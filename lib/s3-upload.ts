import { v4 as uuidv4 } from "uuid";

// This function will handle uploading to S3 and return the CDN URL
export async function uploadToS3(file: File): Promise<string> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);

    // Generate a unique filename with original extension
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFileName = `products/${uuidv4()}.${fileExtension}`;
    formData.append("path", uniqueFileName);

    // Call your S3 upload API endpoint
    const response = await fetch("/api/upload-s3", {
      method: "POST",
      body: formData,
    });

    console.log("Response from S3 upload:", response);

    if (!response.ok) {
      throw new Error("Failed to upload image to S3");
    }

    const data = await response.json();
    return data.url; // Return the CDN URL
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}
