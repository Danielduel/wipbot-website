import { FreshContext } from "$fresh/server.ts";

export const handler = (_req: Request, _ctx: FreshContext): Response => {
  const wipcode = _ctx.params.wipcode;
  return new Response(`${wipcode}`);
};
