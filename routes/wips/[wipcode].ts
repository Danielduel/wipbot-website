import { FreshContext } from "$fresh/server.ts";
import { DbClient } from "../../process/dbClient.ts";
import { WipMetadataSchema } from "../../process/dbCollection/wipMetadata.ts";
import { S3Client } from "../../process/s3Client.ts";

export const handler = async (_req: Request, _ctx: FreshContext): Promise<Response> => {
  const __wipcode = _ctx.params.wipcode;

  if (__wipcode === "***") {
    // It's a censored link by twitch
    throw 400;
  }

  const _wipcode = __wipcode.endsWith(".zip") ? __wipcode.split(".zip")[0] : __wipcode;
  const wipcode = _wipcode.substring(1);

  console.log(_wipcode, " -> ", wipcode);

  const dbClient = await DbClient.getDbClient();
  const _metadata = await dbClient.WipMetadata.findByPrimaryIndex("wipcode", wipcode);

  if (!_metadata || !_metadata.value) throw 400;
  const metadata = _metadata.value as typeof WipMetadataSchema["_type"];

  if (!metadata.verify_success) throw 400;

  const s3Client = S3Client.getS3Client();
  const exists = await s3Client.exists(metadata.hash, { bucketName: S3Client.BUCKET.WIP_BLOB_VERIFIED });
  if (!exists) throw 404;

  const data = await s3Client.getObject(metadata.hash, { bucketName: S3Client.BUCKET.WIP_BLOB_VERIFIED }); 
  return new Response(await data.blob());
};

