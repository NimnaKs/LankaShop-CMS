import { type NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Set up S3 upload parameters
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "ls-bucket12345";
    const params = {
      Bucket: bucketName,
      Key: path,
      Body: buffer,
      ContentType: file.type,
    };

    // Upload to S3
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Generate CDN URL
    // You can use your own CDN URL format here
    const cdnUrl = `https://${bucketName}.s3.amazonaws.com/${path}`;

    return NextResponse.json({
      success: true,
      url: cdnUrl,
    });
  } catch (error) {
    console.error("Error uploading to S3:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
