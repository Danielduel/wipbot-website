import { Buffer } from "https://deno.land/std@0.224.0/streams/buffer.ts";
import { InfoDatSchema } from "../zod-schema/Info.dat.schema.ts";

// @ts-types="https://deno.land/x/zipjs@v2.7.69/index.d.ts"
import {
  BlobWriter,
  ZipReader,
  ZipWriter,
} from "https://deno.land/x/zipjs@v2.7.69/index.js";
import { S3Client } from "./s3Client.ts";
import { InfoDatV4Schema } from "../zod-schema/Info.dat.v4.schema.ts";

// TODO
// BeatSaber doesn't care about lower/uppercase - make this code not care too
//

export namespace UploadWip {
  type FileEntry = {
    name: string;
    data: Buffer;
  };
  type FileEntries = Map<string, FileEntry>;
  const MEGABYTE = 1024 * 1024;
  const compressedTotalSizeLimit = 64 * MEGABYTE;
  const uncompressedItemSizeLimit = 100 * MEGABYTE;

  const _getFileEntries = async (formData: FormData): Promise<FileEntries> => {
    const _formDataArr: IterableIterator<FormDataEntryValue> = formData
      .values();
    const formDataArr = [..._formDataArr];

    if (formDataArr.length !== 1) {
      console.error("1");
      throw 400;
    }

    const [item] = formDataArr;

    if (!(item instanceof File)) {
      console.error("2");
      throw 400;
    }

    const file = item as File;

    if (file.size > compressedTotalSizeLimit) {
      console.error("3");
      throw 400;
    }

    const fileEntries = new Map<string, FileEntry>();
    const stream = file.stream();

    const zipReader = new ZipReader(stream);
    const directories: string[] = [];
    const entries = zipReader.getEntriesGenerator();

    for await (const zipFileContent of entries) {
      if (zipFileContent.directory) {
        directories.push(zipFileContent.filename);
      }
      if (!zipFileContent.directory) {
        const buffer = new Buffer();
        if (zipFileContent.uncompressedSize > uncompressedItemSizeLimit) {
          console.error("4");
          await zipReader.close();
          throw 400;
        }
        await zipFileContent.getData(buffer.writable);
        fileEntries.set(zipFileContent.filename, {
          name: zipFileContent.filename,
          data: buffer,
        });
      }
    }

    await zipReader.close();

    if (fileEntries.has("Info.dat")) return fileEntries;
    // find Info.dat folder path that is also the least nested
    const nestedInfoDatPath = fileEntries
      .keys()
      .filter((x) => x.endsWith("/Info.dat"))
      .toArray()
      .sort((x, y) => x.split("/").length - y.split("/").length)[0];
    if (!nestedInfoDatPath) return fileEntries;

    // if Info.dat is nested, run checks and if success - truncate paths in fileEntries

    const nestedInfoDatPathSplit = nestedInfoDatPath.split("Info.dat");
    const isSplitValid = nestedInfoDatPathSplit.length === 2 &&
      nestedInfoDatPathSplit[1] === "";
    if (!isSplitValid) return fileEntries;

    const infoDatParentFolderPath = nestedInfoDatPathSplit[0]!;
    // remove all paths that aren't in the scope and truncate valid ones
    const fileEntriesOldEntries = fileEntries.entries().toArray();
    fileEntries.clear();
    for (const [key, value] of fileEntriesOldEntries) {
      if (!key.startsWith(infoDatParentFolderPath)) continue; // junk

      const newKey = key.replace(infoDatParentFolderPath, "");
      fileEntries.set(newKey, value);
    }

    return fileEntries;
  };

  const readBufferAsJson = (buffer: Buffer) => {
    const textDecoder = new TextDecoder();
    const contents = textDecoder.decode(buffer.bytes({ copy: false }));
    const object = JSON.parse(contents);
    return object;
  };

  type ReconstructionEntry = { filename: string; isOptional: boolean };
  const optionalReconstructionEntry = (
    fileEntries: FileEntries,
    filename: string,
    isOptional: boolean = true,
  ): ReconstructionEntry | null => {
    if (fileEntries.has(filename)) {
      return { filename, isOptional };
    } else {
      return null;
    }
  };
  const reconstructionEntry = (
    filename: string,
    isOptional: boolean = true,
  ): ReconstructionEntry => {
    return { filename, isOptional };
  };

  const _verifyLegacy = (infoDatObject: unknown, fileEntries: FileEntries): ReconstructionEntry[] => {
    const _infoDat = InfoDatSchema.safeParse(infoDatObject);

    if (_infoDat.error) {
      console.error("Failed to parse Info.dat", _infoDat.error);
      throw 400;
    }

    const infoDat = _infoDat!.data!;
    const infoInfo: ReconstructionEntry[] = [
      reconstructionEntry("Info.dat", false),
      reconstructionEntry(infoDat._coverImageFilename, true),
      reconstructionEntry(infoDat._songFilename, false),
      ...infoDat._difficultyBeatmapSets.flatMap((x) =>
        x._difficultyBeatmaps.flatMap((y) =>
          reconstructionEntry(y._beatmapFilename, false)
        )
      ),
      ...(infoDat._customData?._contributors?.flatMap((x) =>
        reconstructionEntry(x._iconPath ?? "", true)
      ) ?? []),
      ...(infoDat._difficultyBeatmapSets.flatMap((x) =>
        reconstructionEntry(
          x._customData?._characteristicIconImageFilename ?? "",
          true,
        )
      ) ?? []),
      optionalReconstructionEntry(fileEntries, "BPMInfo.dat", true),
      optionalReconstructionEntry(fileEntries, "cinema-video.json", true),
      optionalReconstructionEntry(fileEntries, "bundleAndroid2021.vivify", true),
      optionalReconstructionEntry(fileEntries, "bundleWindows2019.vivify", true),
      optionalReconstructionEntry(fileEntries, "bundleWindows2021.vivify", true) 
    ].filter(x => !!x);

    return infoInfo;
  };

  const _verifyV4 = (infoDatObject: unknown, fileEntries: FileEntries): ReconstructionEntry[] => {
    const _infoDat = InfoDatV4Schema.safeParse(infoDatObject);

    if (_infoDat.error) {
      console.error("Failed to parse (V4) Info.dat", _infoDat.error);
      throw 400;
    }

    const infoDat = _infoDat!.data!;
    const infoInfo: ReconstructionEntry[] = [
      reconstructionEntry("Info.dat", false),
      reconstructionEntry(infoDat.coverImageFilename, false),
      reconstructionEntry(infoDat.songPreviewFilename, false),
      reconstructionEntry(infoDat.audio.songFilename, true),
      reconstructionEntry(infoDat.audio.audioDataFilename, false),
      ...infoDat.difficultyBeatmaps.map(x => reconstructionEntry(x.beatmapDataFilename, false)), 
      ...infoDat.difficultyBeatmaps.map(x => reconstructionEntry(x.lightshowDataFilename, false)),
      optionalReconstructionEntry(fileEntries, "BPMInfo.dat", true),
      optionalReconstructionEntry(fileEntries, "cinema-video.json", true),
      optionalReconstructionEntry(fileEntries, "bundleAndroid2021.vivify", true),
      optionalReconstructionEntry(fileEntries, "bundleWindows2019.vivify", true),
      optionalReconstructionEntry(fileEntries, "bundleWindows2021.vivify", true) 
    ].filter(x => !!x);

    return infoInfo;
  };

  const _verify = (fileEntries: FileEntries) => {
    if (!fileEntries.has("Info.dat")) {
      console.error("Missing Info.dat in fileEntries");
      throw 400;
    }
    const infoDatObject = readBufferAsJson(fileEntries.get("Info.dat")!.data);

    if ("_version" in infoDatObject) {
      return _verifyLegacy(infoDatObject, fileEntries);
    }
    if ("version" in infoDatObject) {
      return _verifyV4(infoDatObject, fileEntries);
    }

    throw 400;
  };

  const _reconstruct = async (
    fileEntries: FileEntries,
    infoInfo: ReconstructionEntry[],
  ) => {
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);
    const addedFiles: string[] = [];
    await Promise.all(
      infoInfo
        .map((x) => {
          // TODO rework this part
          let _x = x.filename;
          const _file = fileEntries
            .get(_x!) ?? // ignore case fallback
            (() => {
              const key = fileEntries
                .keys()
                .find((y) => y.toLowerCase() === x.filename.toLowerCase());
              if (!key) return undefined;
              _x = key;
              return fileEntries.get(key);
            })();
          if (!_file) {
            if (!x.isOptional) {
            console.error(
              `${x} is missing in reconstruction`,
              "\nreconstruction data:",
              infoInfo,
              "\ncontents:",
              [...fileEntries.keys()],
            );
            throw 400;
            }
            return Promise.resolve();
          }
          if (!addedFiles.includes(_x!)) {
          addedFiles.push(_x!);
          return zipWriter.add(_x!, _file.data);
          }
          // entry duplicate
          return Promise.resolve();
        }),
    );
    await zipWriter.close();

    return await zipFileWriter.getData();
  };

  export const _getBlob = async (formData: FormData): Promise<Blob | null> => {
    try {
      const fileEntries = await _getFileEntries(formData);
      const infoInfo = _verify(fileEntries);
      const finalBlob = await _reconstruct(fileEntries, infoInfo);
      return finalBlob;
    } catch (_) {
      console.error(_);
      return null;
    }
  };

  export const _generateName = (
    seed: number = Math.floor(Math.random() * Date.now()),
  ) => {
    const characters = "0123456789ABCDEF"; // GHIJKLMNOPQRSTUVWXYZ";
    const length = 5;
    const index = () => {
      const x = Math.sin(seed++) * 1000;
      const randomish = x - Math.floor(x);
      return Math.floor(randomish * characters.length);
    };
    const arr = new Array(length).fill("").map(() => characters[index()]);

    return arr.join("");
  };

  export const generateAvailableName = async () => {
    const s3Client = S3Client.getS3Client();
    let key = UploadWip._generateName();
    while (
      await s3Client.exists(key, { bucketName: S3Client.BUCKET.WIP_BLOB })
    ) {
      key = UploadWip._generateName();
    }
    return key;
  };

  export const uploadWip = async (formData: FormData): Promise<Blob | null> => {
    const blob = await _getBlob(formData);
    if (blob) {
      return blob;
    }
    return null;
  };
}
