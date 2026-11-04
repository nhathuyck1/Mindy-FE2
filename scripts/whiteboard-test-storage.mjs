import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
const require = createRequire(resolve('../Mindy-BE/package.json'));
const {
  S3Client,
  CreateBucketCommand,
  PutBucketVersioningCommand,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
} = require('@aws-sdk/client-s3');
export async function whiteboardTestStorage() {
  const bucket = `mindy-whiteboard-${randomUUID()}-test`;
  const client = new S3Client({
    endpoint: 'http://127.0.0.1:19000',
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'mindy-files-test',
      secretAccessKey: 'mindy-files-test-only-password',
    },
    maxAttempts: 1,
  });
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  await client.send(
    new PutBucketVersioningCommand({
      Bucket: bucket,
      VersioningConfiguration: { Status: 'Enabled' },
    }),
  );
  return {
    bucket,
    cleanup: async () => {
      if (!/^mindy-whiteboard-[\da-f-]+-test$/.test(bucket))
        throw new Error('Only generated test bucket may be removed');
      for (;;) {
        const page = await client.send(
          new ListObjectVersionsCommand({ Bucket: bucket, MaxKeys: 1000 }),
        );
        const objects = [...(page.Versions ?? []), ...(page.DeleteMarkers ?? [])].map((v) => ({
          Key: v.Key,
          VersionId: v.VersionId,
        }));
        if (!objects.length) break;
        await client.send(
          new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }),
        );
      }
      await client.send(new DeleteBucketCommand({ Bucket: bucket }));
      client.destroy();
    },
  };
}
