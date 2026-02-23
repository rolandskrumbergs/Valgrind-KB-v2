import { eq } from "drizzle-orm";
import { db } from "..";
import { ibbenLenaKnowledgeFiles } from "../schema";

export const createUploadedFileRecord = async (data: {
	fileName: string;
	fileSize: number;
	fileType: string;
	category: "books" | "laws" | "legalcases" | "other";
	s3Key: string;
	s3Url: string;
	fileHash: string;
	userId?: string;
	userName?: string;
	userRole?: string;
	chunkSet?: string;
}) => {
	try {
		const [file] = await db
			.insert(ibbenLenaKnowledgeFiles)
			.values({
				...data,
				processingStatus: "uploaded",
				active: true,
				chunkSet: data.chunkSet || "set_a", // Use provided chunkSet or default to "set_a"
			})
			.returning();
		return file;
	} catch (error) {
		console.error("Error creating uploaded file record:", error);
		return null;
	}
};

export const getUploadedFileByHash = async (fileHash: string) => {
	try {
		const file = await db.query.ibbenLenaKnowledgeFiles.findFirst({
			where: eq(ibbenLenaKnowledgeFiles.fileHash, fileHash),
		});
		return file;
	} catch (error) {
		console.error("Error fetching uploaded file by hash:", error);
		return null;
	}
};

export const getKnowledgeBaseFilesLite = async () => {
	try {
		// Use a more optimized query with consistent ordering
		const files = await db.query.ibbenLenaKnowledgeFiles.findMany({
			columns: {
				id: true,
				fileName: true,
				fileSize: true,
				fileType: true,
				category: true,
				s3Url: true,
				uploadedAt: true,
				userName: true,
				processingStatus: true,
			},
		});

		return files;
	} catch (error) {
		console.error("Error fetching knowledge base files:", error);
		throw new Error("Failed to fetch knowledge base files");
	}
};

export const getKnowledgeBaseFileStatus = async (id: string) => {
	try {
		const file = await db.query.ibbenLenaKnowledgeFiles.findFirst({
			where: eq(ibbenLenaKnowledgeFiles.id, id),
			columns: {
				id: true,
				processingStatus: true,
				errorMessage: true,
			},
		});
		return file;
	} catch (error) {
		console.error("Error fetching knowledge base files status:", error);
		return null;
	}
};

export const getKnowledgeBaseAllStatus = async () => {
	try {
		const files = await db.query.ibbenLenaKnowledgeFiles.findMany({
			columns: {
				id: true,
				processingStatus: true,
			},
		});
		return files;
	} catch (error) {
		console.error("Error fetching knowledge base files status:", error);
		return null;
	}
};

export const getKnowledgeBaseFileById = async (id: string) => {
	try {
		const file = await db.query.ibbenLenaKnowledgeFiles.findFirst({
			where: eq(ibbenLenaKnowledgeFiles.id, id),
		});
		return file;
	} catch (error) {
		console.error("Error fetching knowledge base file by id:", error);
		return null;
	}
};
