import { FreshContext } from "$fresh/server.ts";
import { S3Client } from "../../process/s3Client.ts";

export const handler = async (_req: Request, _ctx: FreshContext): Promise<Response> => {
  const _wipcode = _ctx.params.wipcode;
  const wipcode = _wipcode.substring(1);

  console.log(_wipcode, " -> ", wipcode);
  const s3Client = S3Client.getS3Client();
  const exists = await s3Client.exists(wipcode, { bucketName: S3Client.BUCKET.WIP_BLOB });
  if (!exists) throw 404;

  const data = await s3Client.getObject(wipcode, { bucketName: S3Client.BUCKET.WIP_BLOB }); 
  return new Response(await data.blob());
};

