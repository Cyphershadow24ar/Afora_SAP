// Real S3-backed implementation of IStorageService (AWS SDK v3).
//
// Configuration (from environment):
//   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
//
// Object layout: returns/{analysisId}/{filename}
// Object access: objects are uploaded privately; URLs are short-lived
// presigned GET URLs so the bucket does not need public access.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from './IStorageService';
import { ImageUploadResult } from '@/lib/types';

// Presigned URL lifetime. Uses the SigV4 maximum (7 days) so that URLs stored
// on the analysis record remain viewable throughout a demo session.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.S3_BUCKET_NAME;

    // Startup validation — report missing variables by name only (never values).
    const missing: string[] = [];
    if (!region) missing.push('AWS_REGION');
    if (!bucket) missing.push('S3_BUCKET_NAME');
    if (!accessKeyId) missing.push('AWS_ACCESS_KEY_ID');
    if (!secretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY');
    if (missing.length > 0) {
      throw new Error(
        `S3StorageService misconfigured. Missing environment variables: ${missing.join(', ')}`
      );
    }

    this.bucket = bucket as string;
    this.client = new S3Client({
      region: region as string,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    });
  }

  private extensionFor(mimeType: string): string {
    return EXTENSION_BY_MIME[mimeType] || 'jpg';
  }

  // Upload images under returns/{analysisId}/{filename}. Returns the object key,
  // a presigned GET URL for display, and the byte size.
  async uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]> {
    return Promise.all(
      images.map(async (image, index) => {
        const ext = this.extensionFor(image.type);
        const key = `returns/${prefix}/image-${index}.${ext}`;

        const buffer = Buffer.from(await image.arrayBuffer());

        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: image.type,
          })
        );

        const url = await this.getImageUrl(key);

        return { key, url, size: image.size };
      })
    );
  }

  // Generate a presigned GET URL for a stored object.
  async getImageUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: SIGNED_URL_TTL_SECONDS }
    );
  }

  // Delete one or more objects by key.
  async deleteImages(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );
  }
}
