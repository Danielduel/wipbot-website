import { S3Client } from "../../../process/s3Client.ts";
import { WipMetadata } from "../../../process/WipMetadata.ts";
import { define } from "../../../utils.ts";

const respond = (url: string, hash: string, secret: string | undefined) => ({
  url,
  hash,
  secret
});

export type ResponseObject = ReturnType<typeof respond>;

export const handler = define.handlers({
  async POST (ctx) {
    const size = (await ctx.req.json()).size as number;
    const s3Client = S3Client.getS3Client();

    const item = await WipMetadata.create(size);
    const {
      secret,
      hash
    } = item;

    const url = await s3Client.getPresignedUrl("PUT", hash, {
      bucketName: S3Client.BUCKET.WIP_BLOB,
      expirySeconds: 5 * 60,
      parameters: {
        "Content-Length": "" + size,
      },
    });

    return new Response(JSON.stringify(respond(url, hash, secret)));
  },
});
