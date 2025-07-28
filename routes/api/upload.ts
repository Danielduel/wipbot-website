import { FreshContext } from "$fresh/server.ts";
import { uploadWip } from "../../process/uploadWip.ts";

export const handler = async (_req: Request, _ctx: FreshContext): Promise<Response> => {
  const formData = await _req.formData();

  return uploadWip(formData);
 };

