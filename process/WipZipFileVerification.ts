import { WipZipFile } from "./WipZipFile.ts";
import { InfoDatSchema } from "../zod-schema/Info.dat.schema.ts";
import { InfoDatV4Schema } from "../zod-schema/Info.dat.v4.schema.ts";
import { Err, Ok, Result } from "../deps/optionals.ts";

class VerificationMetadata {
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

class WipZipFileVerificationMetadata extends VerificationMetadata {
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

export class WipZipFileVerification extends WipZipFile {
  constructor(wipFileBlob: Blob) {
    super(wipFileBlob);
  }

  public static override async fromBlobM(
    wipFileBlob: Blob,
  ): Promise<Result<WipZipFileVerification, Error>> {
    const wipZipFile = new WipZipFileVerification(wipFileBlob);
    const error = await wipZipFile.initialize();
    if (!error) return Ok(wipZipFile);
    return Err(error);
  }

  status: WipZipFileVerificationMetadata = new WipZipFileVerificationMetadata();

  public verify = () => {
    const infoDatObject = this.readInfoDatObject();

    if (!infoDatObject) {
      return true;
    }

    if ("_version" in infoDatObject) {
      const fail = this.verifyMap(infoDatObject);
      if (fail) return fail;
    }

    if ("version" in infoDatObject) {
      const fail = this.verifyMapV4(infoDatObject);
      if (fail) return fail;
    }
  };

  private verifyMap = (infoDatObject: object) => {
    const _infoDat = InfoDatSchema.safeParse(infoDatObject);

    const infoDat = _infoDat!.data!;

    this
      .pushReconstructionEntry("Info.dat", false)
      .pushReconstructionEntry(infoDat._coverImageFilename, true)
      .pushReconstructionEntry(infoDat._songFilename, false)
      .pushReconstructionEntryIfExists("BPMInfo.dat", true)
      .pushReconstructionEntryIfExists("cinema-video.json", true)
      .pushReconstructionEntryIfExists("bundleAndroid2021.vivify")
      .pushReconstructionEntryIfExists("bundleWindows2019.vivify")
      .pushReconstructionEntryIfExists("bundleWindows2021.vivify");

    infoDat._difficultyBeatmapSets.forEach((beatmapSet) => {
      if (beatmapSet._customData?._characteristicIconImageFilename) {
        this.pushReconstructionEntry(
          beatmapSet._customData?._characteristicIconImageFilename,
          true,
        );
      }
      beatmapSet._difficultyBeatmaps.forEach((beatmap) => {
        this.pushReconstructionEntry(beatmap._beatmapFilename, false);
      });
    });

    infoDat._customData?._contributors?.forEach((contributor) => {
      if (contributor._iconPath) {
        this.pushReconstructionEntry(contributor._iconPath, true);
      }
    });

    return false;
  };

  private verifyMapV4 = (infoDatObject: object) => {
    const _infoDat = InfoDatV4Schema.safeParse(infoDatObject);

    const infoDat = _infoDat!.data!;

    this
      .pushReconstructionEntry("Info.dat", false)
      .pushReconstructionEntry(infoDat.coverImageFilename, true)
      .pushReconstructionEntry(infoDat.songPreviewFilename, false)
      .pushReconstructionEntry(infoDat.audio.songFilename, false)
      .pushReconstructionEntry(infoDat.audio.audioDataFilename, false)
      .pushReconstructionEntryIfExists("BPMInfo.dat", true)
      .pushReconstructionEntryIfExists("cinema-video.json", true)
      .pushReconstructionEntryIfExists("bundleAndroid2021.vivify")
      .pushReconstructionEntryIfExists("bundleWindows2019.vivify")
      .pushReconstructionEntryIfExists("bundleWindows2021.vivify");

    infoDat.difficultyBeatmaps.forEach((beatmap) => {
      this.pushReconstructionEntry(beatmap.beatmapDataFilename, false);
      this.pushReconstructionEntry(beatmap.lightshowDataFilename, false);
    });

    return false;
  };

  private readInfoDatObject = (): object | null => {
    if (!this.fileEntries.hasIgnoreCase("Info.dat")) {
      this.status.details.infoDat
        .pushError("Missing Info.dat in verification entries")
        .finish();
      this.status.finish();
      return null;
    }

    const infoDatObject = this.readFileEntryAsJson("Info.dat");
    if (!infoDatObject) {
      this.status.details.infoDat
        .pushError("Cannot read Info.dat")
        .finish();
      this.status.finish();
      return null;
    }

    const infoDatObjectInner = infoDatObject[1];
    if (!(typeof infoDatObjectInner === "object")) {
      this.status.details.infoDat
        .pushError("Cannot read Info.dat")
        .finish();
      this.status.finish();
      return null;
    }

    return infoDatObjectInner;
  };
}
