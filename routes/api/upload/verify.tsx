import {
  getPreSignedDownloadUrl,
  getPreSignedUploadUrl,
} from "@mesilicon7/simple-r2-utils";
import { DbClient } from "../../../process/dbClient.ts";
import { WipMetadataSchemaT } from "../../../process/dbCollection/wipMetadata.ts";
import { S3Client } from "../../../process/s3Client.ts";
import { UploadWip } from "../../../process/uploadWip.ts";
import { define } from "../../../utils.ts";

const waitForPromise = (time: number) => {
  const p = Promise.withResolvers();

  setTimeout(() => {
    p.resolve(null);
  }, time);

  return p.promise;
};

const waitForWipBlob = async (s3Client: S3Client.ClientT, hash: string) => {
  let retries = 0;
  while (
    !(await s3Client.exists(hash, { bucketName: S3Client.BUCKET.WIP_BLOB }))
  ) {
    retries++;
    console.log(`waitForWipBlob awaiting ${hash}, retries ${retries}`);

    if (retries > 4) {
      console.log(`waitForWipBlob awaiting ${hash} failed`);
      return null;
    }

    await waitForPromise(1000 * retries);
  }

  const blob = await s3Client.getObject(hash, {
    bucketName: S3Client.BUCKET.WIP_BLOB,
  });
  if (!blob.ok) return null;

  return blob;
};

const getVerificationStream = async (
  hash: string,
  log: (str: string) => void,
) => {
  log("s3 init");
  const s3Client = S3Client.getS3Client();

  log("s3 get blob");
  const blobToVerify = await waitForWipBlob(s3Client, hash);
  log("s3 got blob");
  if (!blobToVerify) throw 400;

  log("verification start");
  const verification = await UploadWip.verifyWip(
    await blobToVerify.blob(),
    log,
  );
  if (!verification) throw 400;
  if (!verification.blob) throw 400;
  return {
    verificationStreamLength: verification.blob.size,
    verificationStream: verification.blob.stream(),
    verificationStatus: verification.status,
  };
};

const toMB = (num: number) => (~~((num / (1024 * 1024)) * 100) / 100) + "MB";
const memoryLog = () => {
  const memory = Deno.memoryUsage();
  return `[${toMB(memory.rss)}|${toMB(memory.external)}|${
    toMB(memory.heapUsed)
  }|${toMB(memory.heapTotal)}]`;
};

export const _handler = async (
  req: Request,
) => {
  const traceId = ~~(Math.random() * 255);
  const log = (str: string) =>
    console.log(`[trace: ${traceId}] ${memoryLog()} Verify blob: ${str}`);

  const hash = (await req.json()).hash;
  log(`hash ${hash}`);
  if (!hash) throw 400;

  const dbClient = await DbClient.getDbClient();
  const _metadata = await dbClient.WipMetadata.findByPrimaryIndex("hash", hash);
  if (!_metadata || !_metadata.value) throw 400;
  const metadata = _metadata.value as WipMetadataSchemaT;
  log(`metadata ${JSON.stringify(metadata, undefined, 2)}`);

  log("verification");
  const { verificationStream, verificationStatus, verificationStreamLength } =
    await getVerificationStream(hash, log);

  log("s3 init for put");
  // const s3Client = S3Client.getS3Client();
  log("s3 put");
  // await s3Client.putObject(hash, verificationStream, {
  //   bucketName: S3Client.BUCKET.WIP_BLOB_VERIFIED,
  //   metadata: { Expires: new Date(Date.now() + 5 * 1000).toString() },
  // });
  const uploadUrl = await getPreSignedUploadUrl(
    hash, // fileName
    Deno.env.get("S3_URL")!.split(".")[0]!, // accountId
    // Deno.env.get("R2_ACCESS_KEY_ID")!, // accessKeyId
    // Deno.env.get("R2_SECRET_KEY")!, // secretAccessKey

    Deno.env.get("S3_KEY_ID")!,
    Deno.env.get("S3_SECRET_ACCESS_KEY")!,
    S3Client.BUCKET.WIP_BLOB_VERIFIED, // bucketName
    5 * 1000, // expiresIn (seconds)
    "application/zip", // contentType
  );
  console.log(uploadUrl);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: verificationStream,
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": verificationStreamLength + "" 
    }
  });
  console.log(response);

  log("db update");
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

  log("sending response");
  return {
    wipcode: metadata.wipcode,
    status: verificationStatus,
  } as const;
};

export const handler = define.handlers({
  POST: async (ctx) => {
    const result = await _handler(ctx.req);

    return Response.json(result);
  },
});
export type VerifyEndpointReponse = Awaited<ReturnType<typeof _handler>>;
