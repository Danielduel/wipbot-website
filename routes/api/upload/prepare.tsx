import { DbClient } from "../../../process/dbClient.ts";
import { S3Client } from "../../../process/s3Client.ts";
import { UploadWip } from "../../../process/uploadWip.ts";
import { define } from "../../../utils.ts";

const respond = (url: string, hash: string) => ({
  url,
  hash,
});

export type ResponseObject = ReturnType<typeof respond>;

export const handler = define.handlers({
  async POST (ctx) {
    const size = (await ctx.req.json()).size as number;
    const s3Client = S3Client.getS3Client();
    const dbClient = await DbClient.getDbClient();
    const hash = await UploadWip.generateAvailableHash();
    const wipcode = await UploadWip.generateAvailableName();

    await dbClient.WipMetadata.add({
      hash,
      wipcode,
      size,
      removed: false,
      verify_started: false,
      verify_errorArray: null,
      verify_finished: false,
      verify_success: false,
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
