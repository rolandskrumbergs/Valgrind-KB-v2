"use server";

import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { createHash } from "node:crypto";
import {
	createUploadedFileRecord,
	getUploadedFileByHash,
	getKnowledgeBaseFilesLite,
	getKnowledgeBaseFileById,
	getKnowledgeBaseAllStatus,
	getKnowledgeBaseFileStatus,
} from "@/db/queries/knowledgebase-queries";
import { CheckPermissionOfUser, GetSessionInServer } from "./auth-action";
import { revalidatePath } from "next/cache";
import { Index } from "@upstash/vector";
import { db } from "@/db";
import { ibbenLenaKnowledgeFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UPSTASH_INDICES } from "@/constants/upstash-variables";
import { getS3Client, deleteFileFromS3 } from "@/lib/s3-utils";

// Environment variables
const AWS_REGION = process.env.AWS_REGION || "eu-north-1";
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";
const APP_AWS_ACCESS_KEY = process.env.APP_AWS_ACCESS_KEY || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
const AWS_SQS_URL = process.env.AWS_SQS_URL || "";

// Initialize SQS client
const getSQSClient = () => {
	return new SQSClient({
		region: AWS_REGION,
		credentials: {
			accessKeyId: APP_AWS_ACCESS_KEY,
			secretAccessKey: AWS_SECRET_ACCESS_KEY,
		},
	});
};

export interface UploadResult {
	key: string;
	url: string;
	category: string;
	fileHash: string;
	chunkSet: string;
	alreadyExists?: boolean;
}

/**
 * Generate a unique hash for a file to identify duplicates
 */
async function generateFileHash(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const hashSum = createHash("sha256");
	hashSum.update(Buffer.from(buffer));
	return hashSum.digest("hex");
}

/**
 * Check if a file already exists in S3 by its hash
 */
async function fileExistsInS3(
	fileHash: string,
	category: string,
): Promise<string | null> {
	const client = getS3Client();

	try {
		// S3 key format for hash lookup: category/hash/metadata.json
		const lookupKey = `${category}/${fileHash}/metadata.json`;

		// Check if metadata file exists
		const headCommand = new HeadObjectCommand({
			Bucket: AWS_BUCKET_NAME,
			Key: lookupKey,
		});

		try {
			await client.send(headCommand);
			// If we get here, the file exists
			return lookupKey;
		} catch (error) {
			// AWS SDK errors have metadata property with status code
			const awsError = error as {
				name?: string;
				$metadata?: { httpStatusCode?: number };
			};

			// NotFound is expected when the file doesn't exist
			if (
				awsError.name === "NotFound" ||
				awsError.$metadata?.httpStatusCode === 404
			) {
				return null;
			}

			// For permission issues (403 Forbidden), assume file might exist and try database lookup instead
			if (awsError.$metadata?.httpStatusCode === 403) {
				console.warn(
					"Permission issue checking S3. Defaulting to database lookup only.",
				);
				// Return null so we rely on database lookup instead
				return null;
			}

			// For all other errors, log and rethrow
			throw error;
		}
	} catch (error) {
		console.error("Error checking if file exists in S3:", error);
		// If we have issues checking in S3, default to relying on database lookup
		return null;
	}
}

/**
 * Send document processing message to SQS queue
 */
async function sendToProcessingQueue(
	s3Url: string,
	chunkSet = "set_a",
): Promise<void> {
	if (!AWS_SQS_URL) {
		console.error("AWS_SQS_URL environment variable is not set");
		return;
	}

	try {
		const url = new URL(s3Url);
		const bucket = url.hostname.split(".")[0];
		// Decode the URL path to handle spaces and special characters correctly
		const path = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode
		const s3Protocol = `s3://${bucket}/${path}`;

		const client = getSQSClient();
		const command = new SendMessageCommand({
			QueueUrl: AWS_SQS_URL,
			MessageBody: JSON.stringify({
				s3_url: s3Protocol,
				chunking_set: chunkSet,
			}),
		});

		// Fire and forget - don't await the processing
		client
			.send(command)
			.then(() => console.log("Successfully sent message to SQS queue"))
			.catch((error) =>
				console.error("Error sending message to SQS queue:", error),
			);
	} catch (error) {
		console.error("Error preparing SQS message:", error);
	}
}

/**
 * Server action to upload file to S3
 */
export async function uploadDocumentToS3(
	formData: FormData,
): Promise<UploadResult> {
	// Check user session and authorization
	const session = await GetSessionInServer();

	if (!session) {
		throw new Error("You must be logged in to upload documents");
	}

	// Only allow admin or manager to upload files
	const canUpload = await CheckPermissionOfUser(
		session.user.id,
		"knowledgebase",
		"update",
	);

	if (!canUpload) {
		throw new Error("You are not authorized to upload documents");
	}

	// Get user info from session
	const userId = session.user.id;
	const userName = session.user.name || "Unknown User";
	const userRole = session.user.role;

	// Validate required environment variables
	if (!AWS_BUCKET_NAME) {
		throw new Error(
			"AWS_BUCKET_NAME environment variable is not set. Please set it in your .env file.",
		);
	}

	if (!APP_AWS_ACCESS_KEY || !AWS_SECRET_ACCESS_KEY) {
		throw new Error(
			"APP_AWS_ACCESS_KEY or AWS_SECRET_ACCESS_KEY environment variables are not set. Please set them in your .env file.",
		);
	}

	const file = formData.get("file") as File;
	const category = formData.get("category") as
		| "books"
		| "laws"
		| "legalcases"
		| "other";
	const chunkSet = (formData.get("chunkSet") as string) || "set_a";
	const skipDuplicateCheck = formData.get("skipDuplicateCheck") === "true";

	if (!file) {
		throw new Error("No file provided.");
	}

	if (!category) {
		throw new Error("No category provided.");
	}

	// Check file size - limit to 4MB (4 * 1024 * 1024 bytes)
	const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
	if (file.size > MAX_FILE_SIZE) {
		throw new Error(
			`File size exceeds limit of 4MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`,
		);
	}

	// Generate file hash for duplicate detection
	const fileHash = await generateFileHash(file);

	// First check if file exists in our database by hash - this is the most reliable method
	const existingFileRecord = await getUploadedFileByHash(fileHash);
	if (existingFileRecord && !skipDuplicateCheck) {
		console.log(`File with hash ${fileHash} already exists in database`);
		return {
			key: existingFileRecord.s3Key,
			url: existingFileRecord.s3Url,
			category: existingFileRecord.category,
			fileHash,
			chunkSet,
			alreadyExists: true,
		};
	}

	// If allowed to check S3 and file not in database, try S3 lookup
	if (!skipDuplicateCheck && !existingFileRecord) {
		try {
			const existingFileKey = await fileExistsInS3(fileHash, category);
			if (existingFileKey) {
				console.log(
					`File with hash ${fileHash} exists in S3 but not in database`,
				);
				// File already exists in S3 but not in our database, create a record
				const s3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${existingFileKey}`;

				// Store in database with user ID from session
				await createUploadedFileRecord({
					fileName: file.name,
					fileSize: file.size,
					fileType: file.type,
					category,
					s3Key: existingFileKey,
					s3Url,
					fileHash,
					userId,
					userName,
					userRole,
					chunkSet,
				});

				// File already exists, return existing file information
				return {
					key: existingFileKey,
					url: s3Url,
					category,
					fileHash,
					chunkSet,
					alreadyExists: true,
				};
			}
		} catch (error) {
			// If there's an error checking S3, we'll log it but continue with upload
			console.warn(
				"Error during S3 duplicate check, proceeding to upload:",
				error,
			);
		}
	}

	// At this point, we either have a new file, or we couldn't determine if it's a duplicate
	// Proceed with the upload process
	console.log(`Uploading new file with hash ${fileHash}`);
	const client = getS3Client();

	// Create a unique file key
	const timestamp = Date.now();
	const key = `${category}/${timestamp}-${file.name}`;

	// Also store a lookup by hash
	const metadataKey = `${category}/${fileHash}/metadata.json`;

	try {
		// Get file buffer
		const fileBuffer = await file.arrayBuffer();

		// Upload to S3
		const uploadCommand = new PutObjectCommand({
			Bucket: AWS_BUCKET_NAME,
			Key: key,
			Body: Buffer.from(fileBuffer),
			ContentType: file.type,
			Metadata: {
				category,
				originalName: file.name,
				uploadedAt: new Date().toISOString(),
				fileHash,
				userId,
				userName,
			},
		});

		await client.send(uploadCommand);

		// Also store a small metadata file with the file hash to make future lookups faster
		const metadataCommand = new PutObjectCommand({
			Bucket: AWS_BUCKET_NAME,
			Key: metadataKey,
			Body: Buffer.from(
				JSON.stringify({
					originalKey: key,
					originalName: file.name,
					fileHash,
					category,
					contentType: file.type,
					uploadedAt: new Date().toISOString(),
					userId,
					userName,
					userRole,
				}),
			),
			ContentType: "application/json",
		});

		// Try to upload metadata file but don't block on failure
		try {
			await client.send(metadataCommand);
		} catch (error) {
			console.warn(
				"Failed to upload metadata file, but main file was uploaded:",
				error,
			);
		}

		// Create S3 URL
		const s3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

		// Store in database
		await createUploadedFileRecord({
			fileName: file.name,
			fileSize: file.size,
			fileType: file.type,
			category,
			s3Key: key,
			s3Url,
			fileHash,
			userId,
			userName,
			userRole,
			chunkSet,
		});

		// Send message to SQS for document processing
		sendToProcessingQueue(s3Url, chunkSet);

		// Return result
		revalidatePath("/knowledge-base");

		return {
			key,
			url: s3Url,
			category,
			fileHash,
			chunkSet,
		};
	} catch (error) {
		console.error("Error uploading file to S3:", error);
		throw error;
	}
}

/**
 * Server action to get knowledge base files with pagination
 */
export async function getKnowledgeBaseFilesLiteAction() {
	try {
		// Check user session and authorization
		const session = await GetSessionInServer();

		if (!session) {
			return { error: "You must be logged in to view knowledge base files" };
		}

		// Check if user has permission to view the knowledge base
		const canView = await CheckPermissionOfUser(
			session.user.id,
			"knowledgebase",
			"read",
		);

		if (!canView) {
			return { error: "You are not authorized to view knowledge base files" };
		}

		// Get files with pagination
		const files = await getKnowledgeBaseFilesLite();

		return files;
	} catch (error) {
		console.error("Error getting knowledge base files:", error);
		return { error: "Failed to fetch knowledge base files" };
	}
}

/**
 * Server action to get knowledge base files with pagination
 */
export async function getKnowledgeBaseAllStatusAction() {
	try {
		// Check user session and authorization
		const session = await GetSessionInServer();

		if (!session) {
			return { error: "You must be logged in to view knowledge base files" };
		}

		// Check if user has permission to view the knowledge base
		const canView = await CheckPermissionOfUser(
			session.user.id,
			"knowledgebase",
			"read",
		);

		if (!canView) {
			return { error: "You are not authorized to view knowledge base files" };
		}

		// Get files with pagination
		const files = await getKnowledgeBaseAllStatus();

		return files;
	} catch (error) {
		console.error("Error getting knowledge base files:", error);
		return { error: "Failed to fetch knowledge base files" };
	}
}

/**
 * Server action to get a single knowledge base file by ID
 */
export async function getKnowledgeBaseFileStatusAction(id: string) {
	try {
		// Check user session and authorization
		const session = await GetSessionInServer();

		if (!session) {
			return { error: "You must be logged in to view knowledge base files" };
		}

		// Check if user has permission to view the knowledge base
		const canView = await CheckPermissionOfUser(
			session.user.id,
			"knowledgebase",
			"read",
		);

		if (!canView) {
			return { error: "You are not authorized to view knowledge base files" };
		}

		// Get file by ID
		const file = await getKnowledgeBaseFileStatus(id);

		if (!file) {
			return { error: "File not found" };
		}

		return file;
	} catch (error) {
		console.error("Error getting knowledge base file:", error);
		return { error: "Failed to fetch knowledge base file" };
	}
}
/**
 * Server action to get a single knowledge base file by ID
 */
export async function getKnowledgeBaseFileByIdAction(id: string) {
	try {
		// Check user session and authorization
		const session = await GetSessionInServer();

		if (!session) {
			return { error: "You must be logged in to view knowledge base files" };
		}

		// Check if user has permission to view the knowledge base
		const canView = await CheckPermissionOfUser(
			session.user.id,
			"knowledgebase",
			"read",
		);

		if (!canView) {
			return { error: "You are not authorized to view knowledge base files" };
		}

		// Get file by ID
		const file = await getKnowledgeBaseFileById(id);

		if (!file) {
			return { error: "File not found" };
		}

		return file;
	} catch (error) {
		console.error("Error getting knowledge base file:", error);
		return { error: "Failed to fetch knowledge base file" };
	}
}

/**
 * Server action to delete a knowledge base file and its associated resources
 */
export async function deleteKnowledgeBaseFileAction(fileId: string) {
	try {
		// Check user session and authorization
		const session = await GetSessionInServer();

		if (!session) {
			return { error: "You must be logged in to delete knowledge base files" };
		}

		// Only allow admin or manager to delete files
		const canDelete = await CheckPermissionOfUser(
			session.user.id,
			"knowledgebase",
			"delete",
		);

		if (!canDelete) {
			return { error: "You are not authorized to delete documents" };
		}

		// Get file by ID
		const file = await getKnowledgeBaseFileById(fileId);

		if (!file) {
			return { error: "File not found" };
		}

		// Step 1: Delete from Upstash Vector using fileHash as filter
		try {
			// Get the appropriate Upstash index configuration based on file category
			const indexConfig = UPSTASH_INDICES[file.category];

			if (!indexConfig || !indexConfig.url || !indexConfig.token) {
				console.error(
					`Invalid Upstash index configuration for category: ${file.category}`,
				);
				return {
					error:
						"Failed to delete file from vector database: invalid configuration",
				};
			}

			const index = new Index({
				url: indexConfig.url,
				token: indexConfig.token,
			});

			// Delete all vectors with this file_hash in metadata
			const deleteResponse = await index.delete({
				filter: `file_hash = "${file.fileHash}"`,
			});

			console.log(
				`Deleted ${deleteResponse.deleted} vectors from Upstash for category: ${file.category}`,
			);
		} catch (error) {
			console.error("Error deleting from Upstash Vector:", error);
			return { error: "Failed to delete file from vector database" };
		}

		// Step 2: Delete from S3
		try {
			// Delete the main file
			await deleteFileFromS3(file.s3Key, AWS_BUCKET_NAME);

			// Also delete the metadata file if it exists
			try {
				const metadataKey = `${file.category}/${file.fileHash}/metadata.json`;
				await deleteFileFromS3(metadataKey, AWS_BUCKET_NAME);
			} catch (error) {
				// Non-critical if metadata deletion fails
				console.warn("Error deleting metadata file from S3:", error);
			}
		} catch (error) {
			console.error("Error deleting file from S3:", error);
			return { error: "Failed to delete file from S3" };
		}

		// Step 3: Delete from database
		try {
			await db
				.delete(ibbenLenaKnowledgeFiles)
				.where(eq(ibbenLenaKnowledgeFiles.id, fileId));
		} catch (error) {
			console.error("Error deleting file record from database:", error);
			return { error: "Failed to delete file record from database" };
		}

		// Revalidate the knowledge base page to reflect changes
		revalidatePath("/knowledge-base");

		return { success: true };
	} catch (error) {
		console.error("Error in delete knowledge base file action:", error);
		return { error: "Failed to delete knowledge base file" };
	}
}
