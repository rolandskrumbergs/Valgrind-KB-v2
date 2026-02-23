import { PutObjectCommand } from "@aws-sdk/client-s3";

import { getS3Client } from "@/lib/s3-utils";

export async function uploadImageToS3Action(
  file: File,
  awsBucketName?: string,
  awsRegionName?: string,
  subfolder = "",
): Promise<string> {
  if (!awsBucketName || !awsRegionName) {
    throw new Error("AWS environment variables are missing");
  }

  try {
    const client = getS3Client();

    // Create a unique file key
    const timestamp = Date.now();
    const key = `${subfolder}${timestamp}-${file.name}`;

    // Get file buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: awsBucketName,
      Key: key,
      Body: Buffer.from(fileBuffer),
      ContentType: file.type,
      ACL: "public-read",
    });

    await client.send(uploadCommand);

    // Create S3 URL
    return `https://${awsBucketName}.s3.${awsRegionName}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error at [uploadImageToS3Action]:", error);
    throw error;
  }
}
