import { define } from "@/utils.ts";
import { ClientSecret } from "../../process/ClientSecret.ts";

export const handler = define.handlers({
  async GET () {
    const item = await ClientSecret.create();

    return new Response(JSON.stringify({
      token: item.token,
      public_code: item.public_code,
      expires_at: item.expires_at,
    }));
  },
});

