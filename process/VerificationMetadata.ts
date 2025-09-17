export class VerificationMetadata {
  public ok = false;
  public error = false;
  public warn = false;
  public done = false;

  public warns: string[] = [];
  public errors: string[] = [];

  public pushError(m: string) {
    this.error = true;
    this.ok = false;
    this.done = true;
    this.errors.push(m);
    return this;
  }

  public pushWarn(m: string) {
    this.warn = true;
    this.warns.push(m);
    return this;
  }

  public finish() {
    if (!this.error) {
      this.ok = true;
    }
    this.done = true;
    return this;
  }
}
