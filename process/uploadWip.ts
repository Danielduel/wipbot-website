import { DbClient } from "./dbClient.ts";
import { WipZipFileVerification } from "./WipZipFileVerification.ts";

export namespace UploadWip {
  export type Verification = {
    blob: Blob | null;
    status: WipZipFileVerification["status"];
  };

  export const _getBlob = async (
    blobToVerify: Blob,
  ): Promise<Verification | null> => {
    try {
      const wipZipFileVerificationM = await WipZipFileVerification.fromBlobM(
        blobToVerify,
      );

      if (wipZipFileVerificationM.isErr()) {
        console.log(wipZipFileVerificationM.unwrapErr());
        throw 400;
      }

      const wipZipFileVerification = wipZipFileVerificationM.unwrap();
      const hasFailed = wipZipFileVerification.verify();

      if (hasFailed) {
        console.log(wipZipFileVerification.status);
        throw 400;
      }

      const finalBlob = await wipZipFileVerification.reconstruct();

      if (!finalBlob) {
        console.log(wipZipFileVerification.status);
        throw 400;
      }

      return { blob: finalBlob, status: wipZipFileVerification.status };
    } catch (_) {
      console.error(_);
      return null;
    }
  };

  export const _generateName = (
    length: number = 5,
    seed: number = Math.floor(Math.random() * Date.now()),
  ) => {
    const characters = "0123456789ABCDEF"; // GHIJKLMNOPQRSTUVWXYZ";
    const index = () => {
      const x = Math.sin(seed++) * 1000;
      const randomish = x - Math.floor(x);
      return Math.floor(randomish * characters.length);
    };
    const arr = new Array(length).fill("").map(() => characters[index()]);

    return arr.join("");
  };

  export const _generateHash = (
    length: number = 12,
    seed: number = Math.floor(Math.random() * Date.now()),
  ) => {
    return _generateName(length, seed);
  };

  const isNameAvailable = async (dbClient: DbClient.DbClient, name: string) => {
    const data = await dbClient.WipMetadata.findByPrimaryIndex("wipcode", name);
    if (!data) return true;
    return data.value.removed;
  };

  export const generateAvailableName = async () => {
    const dbClient = await DbClient.getDbClient();
    let key = UploadWip._generateName();
    while (!(await isNameAvailable(dbClient, key))) {
      key = UploadWip._generateName();
    }
    return key;
  };

  const isHashAvailable = async (dbClient: DbClient.DbClient, hash: string) => {
    const data = await dbClient.WipMetadata.findByPrimaryIndex("hash", hash);
    if (!data) return true;
    return data.value.removed;
  };

  export const generateAvailableHash = async () => {
    const dbClient = await DbClient.getDbClient();
    let key = UploadWip._generateHash();
    while (!(await isHashAvailable(dbClient, key))) {
      key = UploadWip._generateHash();
    }
    return key;
  };

  export const verifyWip = async (
    blobToVerify: Blob,
  ): Promise<Verification | null> => {
    const verification = await _getBlob(blobToVerify);
    if (!verification) return null;
    if (!verification.blob) return { blob: null, status: verification.status };
    return verification;
  };
}
