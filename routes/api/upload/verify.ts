import { FreshContext } from "$fresh/server.ts";
import { DbClient } from "../../../process/dbClient.ts";
import { WipMetadataSchema } from "../../../process/dbCollection/wipMetadata.ts";
import { S3Client } from "../../../process/s3Client.ts";
import { UploadWip } from "../../../process/uploadWip.ts";

export const handler = async (
  _req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const hash = (await _req.json()).hash;
  if (!hash) throw 400;

  const dbClient = await DbClient.getDbClient();
  const _metadata = await dbClient.WipMetadata.findByPrimaryIndex("hash", hash);
  if (!_metadata || !_metadata.value) throw 400;
  const metadata = _metadata.value as typeof WipMetadataSchema["_type"];

  console.log(metadata);

  const s3Client = S3Client.getS3Client();
  if (!s3Client.exists(hash, { bucketName: S3Client.BUCKET.WIP_BLOB })) {
    throw 400;
  }
  const blobToVerify = await s3Client.getObject(hash, {
    bucketName: S3Client.BUCKET.WIP_BLOB,
  });
  if (!blobToVerify.ok) throw 400;

  const blob = await UploadWip.verifyWip(await blobToVerify.blob());
  if (!blob) throw 400;

  await s3Client.putObject(hash, await blob.bytes(), {
    bucketName: S3Client.BUCKET.WIP_BLOB_VERIFIED,
    metadata: { Expires: new Date(Date.now() + 5 * 1000).toString() },
  });

  await dbClient.WipMetadata.updateByPrimaryIndex(
    "hash",
    hash,
    {
      verify_started: true,
      verify_success: true,
      verify_finished: true,
      verify_errorArray: null,
    },
  );

  return new Response(metadata.wipcode);
};
