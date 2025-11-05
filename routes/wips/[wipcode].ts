import { DbClient } from "../../process/dbClient.ts";
import { S3Client } from "../../process/s3Client.ts";
import { define } from "../../utils.ts";

const getWipcodeFromContext = (wipcodeParam: string) => {
  const __wipcode = wipcodeParam;

  if (__wipcode === "***") {
    // It's a censored link by twitch
    throw 400;
  }

  const _wipcode = __wipcode.endsWith(".zip")
    ? __wipcode.split(".zip")[0]
    : __wipcode;
  const wipcode = _wipcode.substring(1);

  return wipcode;
};

const getMetadataForWipcode = async (
  dbClient: DbClient.DbClient,
  wipcode: string,
) => {
  const _metadata = await dbClient.WipMetadata.findByPrimaryIndex(
    "wipcode",
    wipcode,
  );

  if (!_metadata || !_metadata.value) throw 400;
  const metadata = _metadata.value;

  if (!metadata.verify_success) throw 400;

  return [metadata, _metadata] as const;
};
type MetadataT = Awaited<ReturnType<typeof getMetadataForWipcode>>[0];

export const shouldBeAvailable = async (metadata: MetadataT, handleRemove: () => Promise<void>): Promise<boolean> => {
  if (!metadata) return false;
  if (metadata.removed) return false;
  if (metadata.outdated_at.getTime() < Date.now()) {
    await handleRemove();
    return false;
  }

  const s3Client = S3Client.getS3Client();
  const exists = await s3Client.exists(metadata.hash, {
    bucketName: S3Client.BUCKET.WIP_BLOB_VERIFIED,
  });
  if (!exists) {
    await handleRemove();
    return false;
  }

  return true;
}

export const handler = define.handlers({
  HEAD: async ({ params }) => {
    const wipcode = getWipcodeFromContext(params.wipcode);
    console.log(`HEAD ${wipcode}`);
    const dbClient = await DbClient.getDbClient();
    const [metadata, metadataKVEntry] = await getMetadataForWipcode(dbClient, wipcode);
    const available = await shouldBeAvailable(metadata, async () => {
      await dbClient.WipMetadata.update(metadataKVEntry.id, {
        removed: true,
      });
    })

    if (!available) {
      console.log(`HEAD ${wipcode} - not found`)
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        }
      })
    }

    console.log(`HEAD ${wipcode} - found`)
    return new Response("OK", {
      status: 200,
      headers: {
        "Content-Length": "" + metadata.size,
        "Content-Type": "application/zip",
      },
    });
  },
  GET: async ({ params }): Promise<Response> => {
    const wipcode = getWipcodeFromContext(params.wipcode);
    console.log(`GET ${wipcode}`);
    const dbClient = await DbClient.getDbClient();
    const s3Client = S3Client.getS3Client();
    const [metadata, metadataKVEntry] = await getMetadataForWipcode(dbClient, wipcode);
    const available = await shouldBeAvailable(metadata, async () => {
      await dbClient.WipMetadata.update(metadataKVEntry.id, {
        removed: true,
      });
    })

    if (!available) throw 404;

    const data = await s3Client.presignedGetObject(metadata.hash, {
      bucketName: S3Client.BUCKET.WIP_BLOB_VERIFIED,
    });

    return Response.redirect(data);
  },
});

