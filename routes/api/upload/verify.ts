import { FreshContext } from "$fresh/server.ts";
import { DbClient } from "../../../process/dbClient.ts";
import { WipMetadataSchema } from "../../../process/dbCollection/wipMetadata.ts";
import { S3Client } from "../../../process/s3Client.ts";
import { UploadWip } from "../../../process/uploadWip.ts";

const waitForPromise = (time: number) => {
  const p = Promise.withResolvers();

  setTimeout(() => { p.resolve(null); }, time);

  return p.promise;
}

const waitForWipBlob = async (s3Client: S3Client.ClientT, hash: string) => {
  let retries = 0;
  while (!(await s3Client.exists(hash, { bucketName: S3Client.BUCKET.WIP_BLOB }))) {
    retries++;
    console.log(`waitForWipBlob awaiting ${hash}, retries ${retries}`);

    if (retries > 4) {
      console.log(`waitForWipBlob awaiting ${hash} failed`)
      return null;
    }

    await waitForPromise(1000 * retries);
  }

  const blob = await s3Client.getObject(hash, {
    bucketName: S3Client.BUCKET.WIP_BLOB,
  });
  if (!blob.ok) return null;

  return blob;
}

export const _handler = async (
  _req: Request,
  _ctx: FreshContext,
) => {
  const hash = (await _req.json()).hash;
  if (!hash) throw 400;

  const dbClient = await DbClient.getDbClient();
  const _metadata = await dbClient.WipMetadata.findByPrimaryIndex("hash", hash);
  if (!_metadata || !_metadata.value) throw 400;
  const metadata = _metadata.value as typeof WipMetadataSchema["_type"];

  const s3Client = S3Client.getS3Client();
  const blobToVerify = await waitForWipBlob(s3Client, hash);
  if (!blobToVerify) throw 400;

  const verification = await UploadWip.verifyWip(await blobToVerify.blob());
  if (!verification) throw 400;
  if (!verification.blob) throw 400;

  await s3Client.putObject(hash, await verification.blob.bytes(), {
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

  return {
    wipcode: metadata.wipcode,
    status: verification.status,
  } as const;
};

export const handler = async (
  _req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const result = await _handler(_req, _ctx);

  return Response.json(result);
};
export type VerifyEndpointReponse = Awaited<ReturnType<typeof _handler>>;

