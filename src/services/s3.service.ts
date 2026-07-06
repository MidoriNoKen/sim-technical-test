import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { redis } from "@/lib/redis";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "";
const CACHE_PREFIX = "s3:presigned:";
const SIGNED_URL_EXPIRY_SEC = 3600; // 1 hour
const REDIS_TTL_SEC = 3000; // 50 minutes (slightly less than URL expiry)

export async function getUploadUrl(fileName: string, contentType: string) {
  if (!BUCKET_NAME) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  // Sanitize fileName to prevent path traversal and weird character issues
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueKey = `products/uploads/${crypto.randomUUID()}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900, // 15 minutes upload window
  });

  return {
    uploadUrl,
    key: uniqueKey,
  };
}

export async function getPresignedUrlsForKeys(keys: string[]): Promise<string[]> {
  if (!keys || keys.length === 0) {
    return [];
  }

  const urls: string[] = [];

  for (const key of keys) {
    const redisKey = `${CACHE_PREFIX}${key}`;
    try {
      const cachedUrl = await redis.get(redisKey);
      if (cachedUrl) {
        urls.push(cachedUrl);
        continue;
      }
    } catch (error) {
      console.error(`Failed to get S3 cached URL for key ${key} from Redis:`, error);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: SIGNED_URL_EXPIRY_SEC,
      });

      // Cache the signed URL in Redis
      try {
        await redis.setex(redisKey, REDIS_TTL_SEC, signedUrl);
      } catch (cacheError) {
        console.error(`Failed to cache S3 URL for key ${key} in Redis:`, cacheError);
      }

      urls.push(signedUrl);
    } catch (s3Error) {
      console.error(`Failed to generate signed URL for key ${key} from S3:`, s3Error);
      // Fallback: return the raw key or empty string if S3 signing fails
      urls.push("");
    }
  }

  return urls;
}
