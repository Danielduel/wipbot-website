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
      const traceId = ~~(Math.random() * 255);
      const log = (str: string) => console.log(`[trace: ${traceId}] Verify blob: ${str}`)
      log("start")
      const wipZipFileVerificationM = await WipZipFileVerification.fromBlobM(
        blobToVerify,
      );

      log("checking for error")
      if (wipZipFileVerificationM.isErr()) {
        log("error")
        console.log(wipZipFileVerificationM.unwrapErr());
        throw 400;
      }

      log("calling unwrap")
      const wipZipFileVerification = wipZipFileVerificationM.unwrap();

      log("calling verify")
      const hasFailed = wipZipFileVerification.verify();

      log("checking verify")
      if (hasFailed) {
        log("verify failure")
        console.log(wipZipFileVerification.status);
        throw 400;
      }

      log("calling reconstruct")
      const finalBlob = await wipZipFileVerification.reconstruct(log);

      log("checking final blob")
      if (!finalBlob) {
        log("final blob is empty")
        console.log(wipZipFileVerification.status);
        throw 400;
      }

      log("sending response")
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
