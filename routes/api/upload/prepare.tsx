import { DbClient } from "../../../process/dbClient.ts";
import { S3Client } from "../../../process/s3Client.ts";
import { UploadWip } from "../../../process/uploadWip.ts";
import { define } from "../../../utils.ts";

const respond = (url: string, hash: string) => ({
  url,
  hash,
});

export type ResponseObject = ReturnType<typeof respond>;

const HOUR_MS = 60 * 60 * 1000;

export const handler = define.handlers({
  async POST (ctx) {
    const size = (await ctx.req.json()).size as number;
    const s3Client = S3Client.getS3Client();
    const dbClient = await DbClient.getDbClient();
    const hash = await UploadWip.generateAvailableHash();
    const wipcode = await UploadWip.generateAvailableName();

    const created_at = new Date();
    const outdated_at = new Date(Date.now() + 23 * HOUR_MS);

    await dbClient.WipMetadata.add({
      version: 2,
      hash,
      wipcode,
      size,
      removed: false,
      verify_started: false,
      verify_errorArray: null,
      verify_finished: false,
      verify_success: false,
      created_at,
      outdated_at,
    });

    const url = await s3Client.getPresignedUrl("PUT", hash, {
      bucketName: S3Client.BUCKET.WIP_BLOB,
      expirySeconds: 5 * 60,
      parameters: {
        "Content-Length": "" + size,
      },
    });

    return new Response(JSON.stringify(respond(url, hash)));
  },
});
