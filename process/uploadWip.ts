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

  export const verifyWip = async (
    blobToVerify: Blob,
  ): Promise<Verification | null> => {
    const verification = await _getBlob(blobToVerify);
    if (!verification) return null;
    if (!verification.blob) return { blob: null, status: verification.status };
    return verification;
  };
}
