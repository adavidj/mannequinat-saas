import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class ObjectStorageService {
  private client: S3Client | null = null;

  constructor(private readonly config: AppConfigService) {}

  private getClient(): S3Client {
    if (this.client) {
      return this.client;
    }
    this.client = new S3Client({
      endpoint: this.config.s3Endpoint,
      region: this.config.s3Region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.s3AccessKeyId,
        secretAccessKey: this.config.s3SecretAccessKey,
      },
    });
    return this.client;
  }

  async putPrivateImage(key: string, body: Buffer): Promise<void> {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: body,
        ContentType: 'image/webp',
        CacheControl: 'private, no-store',
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
      }),
    );
  }

  async createDownloadUrl(key: string): Promise<{ url: string; expiresAt: Date }> {
    const expiresIn = this.config.photoSignedUrlTtlSeconds;
    const url = await getSignedUrl(
      this.getClient(),
      new GetObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        ResponseContentType: 'image/webp',
      }),
      { expiresIn },
    );

    return { url, expiresAt: new Date(Date.now() + expiresIn * 1_000) };
  }
}
