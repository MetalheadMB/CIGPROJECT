import env from '../../config/env.js';

/**
 * AWS S3 storage driver (drop-in replacement for the local driver).
 *
 * To enable:
 *   1. npm i @aws-sdk/client-s3
 *   2. Set STORAGE_DRIVER=s3 and the AWS_* vars in .env
 *
 * The SDK is imported lazily so the app runs without the dependency when
 * using the local driver.
 */
let _client = null;

async function client() {
  if (_client) return _client;
  const { S3Client } = await import('@aws-sdk/client-s3');
  _client = new S3Client({
    region: env.aws.region,
    credentials: {
      accessKeyId: env.aws.accessKeyId,
      secretAccessKey: env.aws.secretAccessKey,
    },
  });
  return _client;
}

export const s3Storage = {
  driver: 's3',

  async save(buffer, key, mimeType) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await client();
    await c.send(
      new PutObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return { key, url: this.url(key) };
  },

  async delete(key) {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await client();
    await c.send(new DeleteObjectCommand({ Bucket: env.aws.bucket, Key: key }));
  },

  async read(key) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const c = await client();
    const res = await c.send(new GetObjectCommand({ Bucket: env.aws.bucket, Key: key }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
  },

  url(key) {
    return `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
  },
};
