import { DbClient } from "./process/dbClient.ts";
import { shouldBeAvailable } from "./routes/wips/[wipcode].ts";

const dbClient = await DbClient.getDbClient();

await dbClient.WipMetadata.forEach(async (metadataKV) => {
  const metadata = metadataKV.value;
  if (metadata.removed) return; // nothing to do

  await shouldBeAvailable(metadata, async () => {
    await dbClient.WipMetadata.update(metadataKV.id, { removed: true });
  });
});
