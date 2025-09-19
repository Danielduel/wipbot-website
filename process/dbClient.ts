import { kvdex  } from "../deps/kvdex.ts";
import { WipMetadata } from "./dbCollection/wipMetadata.ts";

export namespace DbClient {
  let _currentKv: Deno.Kv | null = null;

  const getKv = async (): Promise<Deno.Kv> => {
    if (_currentKv) return _currentKv;

    const url = Deno.env.get("KV_URL") ?? "";

    if (url) {
      _currentKv = await Deno.openKv(url);
    } else {
      _currentKv = await Deno.openKv();
    }
    return _currentKv;
  };

  const _createDbClient = (kv: Deno.Kv) => {
    const kvClient = kvdex(kv, {
      WipMetadata,
    });

    return kvClient;
  };

  const createDbClient = async () => {
    const kv = await getKv();
    return _createDbClient(kv);
  };

  export type DbClient = ReturnType<typeof _createDbClient>;
  let _currentDb: DbClient | null = null;
  export const getDbClient = async (): Promise<DbClient> => {
    if (_currentDb) return _currentDb;

    _currentDb = await createDbClient();
    return _currentDb;
  };
}
