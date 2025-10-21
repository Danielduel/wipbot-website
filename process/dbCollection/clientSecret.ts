import { z } from "zod";
import { collection } from "kvdex";

export const ClientSecretSchema = z.object({
  version: z.number(),
  id: z.string(),
  token: z.string(),
  public_code: z.string(),

  created_at: z.date(),
  last_used_at: z.date(),
  expires_at: z.date(),
});
export type ClientSecretSchemaT = z.infer<typeof ClientSecretSchema>;

export const ClientSecret = collection(ClientSecretSchema, {
  history: true,
  indices: {
    id: "primary",
    token: "primary",
    public_code: "primary"
  },
  idGenerator: (x) => x.id,
});

