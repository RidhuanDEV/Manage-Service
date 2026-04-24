import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// S3 client — 100% compatible with MinIO
// forcePathStyle WAJIB untuk MinIO
// ---------------------------------------------------------------------------
export const s3 = new S3Client({
  region: "us-east-1", // bebas untuk MinIO
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // WAJIB — jangan hapus
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME!;

// ---------------------------------------------------------------------------
// Upload file ke MinIO
// ---------------------------------------------------------------------------
export async function uploadToMinIO(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

// ---------------------------------------------------------------------------
// Hapus file dari MinIO
// ---------------------------------------------------------------------------
export async function deleteFromMinIO(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

// ---------------------------------------------------------------------------
// Presigned URL untuk akses browser (expire 1 jam)
// ---------------------------------------------------------------------------
export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    { expiresIn: 3600 }
  );
}

// ---------------------------------------------------------------------------
// Ambil file sebagai Buffer — untuk pdfmake (JANGAN via presigned URL dari server)
// ---------------------------------------------------------------------------
export async function getFileBuffer(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
  );

  if (!response.Body) {
    throw new Error(`File tidak ditemukan: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
