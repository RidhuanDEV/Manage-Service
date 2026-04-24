import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";

// Load .env kecuali di production (sudah di-inject)
if (process.env.NODE_ENV !== "production") {
  config({ path: ".env" });
}

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  },
  forcePathStyle: true, // WAJIB untuk MinIO
});

const BUCKET = process.env.MINIO_BUCKET_NAME ?? "reports";

async function bucketExists(bucket: string): Promise<boolean> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`🪣  Memeriksa bucket MinIO: "${BUCKET}" ...`);

  const exists = await bucketExists(BUCKET);

  if (exists) {
    console.log(`✅  Bucket "${BUCKET}" sudah ada — lewati pembuatan.`);
  } else {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`✅  Bucket "${BUCKET}" berhasil dibuat.`);
  }

  // Set bucket policy: private (hanya dapat diakses via presigned URL)
  // Semua akses langsung ditolak — file hanya bisa diakses melalui presigned URL
  const privatePolicy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "DenyDirectAccess",
        Effect: "Deny",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
        Condition: {
          StringNotEquals: {
            "aws:sourceVpc": "non-existent", // praktis: deny semua anonymous
          },
        },
      },
    ],
  });

  try {
    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: BUCKET,
        Policy: privatePolicy,
      })
    );
    console.log(`🔒  Bucket policy set: private (hanya via presigned URL).`);
  } catch (err) {
    // MinIO standalone mungkin tidak mendukung semua policy conditions
    // Biarkan bucket tetap private by default (MinIO default = private)
    console.warn(
      "⚠️  Tidak dapat set bucket policy (mungkin tidak didukung versi ini). Bucket tetap private by default."
    );
    console.warn(err);
  }

  console.log("\n🎉  Inisialisasi MinIO selesai.");
  console.log(`   Endpoint : ${process.env.MINIO_ENDPOINT ?? "http://localhost:9000"}`);
  console.log(`   Bucket   : ${BUCKET}`);
  console.log(`   Console  : http://localhost:9001`);
}

main().catch((err) => {
  console.error("❌  init-minio gagal:", err);
  process.exit(1);
});
