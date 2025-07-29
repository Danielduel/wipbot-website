import { FreshContext } from "$fresh/server.ts";
import { S3Client } from "../../process/s3Client.ts";
import { UploadWip } from "../../process/uploadWip.ts";

export const handler = async (
  _req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const formData = await _req.formData();
  const blob = await UploadWip.uploadWip(formData);

  if (!blob) throw 400;

  const s3Client = S3Client.getS3Client();
  const wipName = await UploadWip.generateAvailableName();
  s3Client.putObject(wipName, await blob.bytes(), {
    bucketName: S3Client.BUCKET.WIP_BLOB,
    metadata: { Expires: new Date(Date.now() + 5 * 1000).toString() },
  });

  return new Response(wipName);
};
