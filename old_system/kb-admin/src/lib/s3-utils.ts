import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Environment variables
const AWS_REGION = process.env.AWS_REGION || "eu-north-1";
const APP_AWS_ACCESS_KEY = process.env.APP_AWS_ACCESS_KEY || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";

/**
 * Initialize S3 client
 */
export const getS3Client = () => {
	return new S3Client({
		region: AWS_REGION,
		credentials: {
			accessKeyId: APP_AWS_ACCESS_KEY,
			secretAccessKey: AWS_SECRET_ACCESS_KEY,
		},
	});
};

/**
 * Delete file from S3 bucket
 */
export async function deleteFileFromS3(
	key: string,
	bucketName: string,
): Promise<boolean> {
	if (!bucketName) {
		throw new Error("S3 bucket name is required");
	}

	const client = getS3Client();

	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: key,
			}),
		);
		console.log(`Deleted file from S3: ${key}`);
		return true;
	} catch (error) {
		console.error(`Error deleting file from S3: ${key}`, error);
		return false;
	}
}

/**
 * Extract S3 key from URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
	const keyMatch = url.match(/amazonaws\.com\/(.+)$/);
	return keyMatch?.[1] || null;
}
