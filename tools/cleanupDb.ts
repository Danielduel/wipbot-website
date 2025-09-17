import { DbClient } from "../process/dbClient.ts";
import { S3Client } from "../process/s3Client.ts";

const db = await DbClient.getDbClient();
const s3 = S3Client.getS3Client();

let totalRecords = 0;
const wipMetadataIdArrToRemove: string[] = [];
await db.WipMetadata.forEach(async (x) => {
  totalRecords++;
  const exists = await s3.exists(x.value.hash, {
    bucketName: S3Client.BUCKET.WIP_BLOB,
  });
  if (exists) return;

  wipMetadataIdArrToRemove.push(x.id);
});

console.log(
  `Deleting ${wipMetadataIdArrToRemove.length} out of ${totalRecords} WipMetadata items`,
);

await db.WipMetadata.delete(...wipMetadataIdArrToRemove);
