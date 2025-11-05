import { z } from "zod";
import { collection } from "kvdex";

export const WipMetadataSchema = z.object({
  version: z.number().optional(),
  hash: z.string(),
  wipcode: z.string(),

  secret: z.string().default("none"),
  private: z.boolean().default(false),
  private_shared_with: z.array(z.string()).default([]),

  size: z.number(),
  removed: z.boolean(),

  verify_started: z.boolean(),
  verify_finished: z.boolean(),
  verify_success: z.boolean(),
  verify_errorArray: z.array(z.string()).nullable(),

  created_at: z.date().default(new Date(0)),
  outdated_at: z.date().default(new Date(0)),
});

export const WipMetadata = collection(WipMetadataSchema, {
  history: true,
  indices: {
    hash: "primary",
    wipcode: "primary",
  },
  idGenerator: (x) => x.hash,
});
