import { VerificationMetadata } from "./VerificationMetadata.ts";

export class WipZipFileVerificationMetadata extends VerificationMetadata {
  private proxy = (verificationMetadata: VerificationMetadata) => {
    const self = this;
    const proxied = verificationMetadata;
    const compose =
      <T extends (...args: Parameters<T>) => void>(...fnArr: T[]) =>
      (...args: Parameters<T>) => {
        fnArr.forEach((x) => x(...args));
        return proxied;
      };
    proxied.pushError = compose(
      self.pushError,
      proxied.pushError,
    );
    proxied.pushWarn = compose(
      self.pushWarn,
      proxied.pushWarn,
    );
    return verificationMetadata;
  };

  private metadata() {
    return this.proxy(new VerificationMetadata());
  }

  public details = {
    infoDat: this.metadata(),
  };
}

