import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName =
  process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME || "";

if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error("Please define AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.");
}

if (!bucketName) {
  throw new Error("Please define AWS_S3_BUCKET_NAME or AWS_BUCKET_NAME.");
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getFileExtension(fileName, mimeType) {
  const existingExtension = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf("."))
    : "";

  if (existingExtension) {
    return existingExtension;
  }

  if (mimeType === "image/jpeg") {
    return ".jpg";
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  return ".bin";
}

export async function uploadImageToS3(fileBuffer, mimeType, originalFileName) {
  const extension = getFileExtension(originalFileName || "upload", mimeType);
  const fileName = `complaints/${Date.now()}-${randomUUID()}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType || "application/octet-stream",
    })
  );

  return region === "us-east-1"
    ? `https://${bucketName}.s3.amazonaws.com/${fileName}`
    : `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
}