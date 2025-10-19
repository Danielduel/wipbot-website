import { z } from "zod";
import { collection } from "kvdex";

export const WipMetadataSchema = z.object({
  version: z.number(),
  hash: z.string(),
  wipcode: z.string(),

  size: z.number(),
  removed: z.boolean(),

  verify_started: z.boolean(),
  verify_finished: z.boolean(),
  verify_success: z.boolean(),
  verify_errorArray: z.array(z.string()).nullable(),

  created_at: z.date(),
  outdated_at: z.date(),
});

export const WipMetadata = collection(WipMetadataSchema, {
  history: true,
  indices: {
    hash: "primary",
    wipcode: "primary",
  },
  idGenerator: (x) => x.hash,
});
