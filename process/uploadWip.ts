import { Buffer } from "https://deno.land/std@0.224.0/streams/buffer.ts";
import { InfoDatSchema } from "../zod-schema/Info.dat.schema.ts";

// @ts-types="https://deno.land/x/zipjs@v2.7.69/index.d.ts"
import {
  BlobWriter,
  ZipReader,
  ZipWriter,
} from "https://deno.land/x/zipjs@v2.7.69/index.js";

export namespace UploadWip {
  type FileEntry = {
    name: string;
    data: Buffer;
  };
  type FileEntries = Map<string, FileEntry>;
  const MEGABYTE = 1024 * 1024;
  const compressedTotalSizeLimit = 64 * MEGABYTE;
  const uncompressedItemSizeLimit = 100 * MEGABYTE;

  const getFileEntries = async (formData: FormData): Promise<FileEntries> => {
    const _formDataArr: IterableIterator<FormDataEntryValue> = formData
      .values();
    const formDataArr = [..._formDataArr];

    if (formDataArr.length !== 1) throw 400;

    const [item] = formDataArr;

    if (!(item instanceof File)) throw 400;

    const file = item as File;

    if (file.size > compressedTotalSizeLimit) throw 400;

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

  const verifyBeatSaberMapZip = (fileEntries: FileEntries) => {
    // Info.dat
    if (!fileEntries.has("Info.dat")) throw 400;
    const infoDatObject = readBufferAsJson(fileEntries.get("Info.dat")!.data);
    const infoDat = InfoDatSchema.parse(infoDatObject);
    // console.log(infoDat);
    const hasBPMInfo = fileEntries.has("BPMInfo.dat");
    const hasCinemaVideo = fileEntries.has("cinema-video.json");
    const hasVivifyAndroid2021 = fileEntries.has("bundleAndroid2021.vivify");
    const hasVivifyWindows2019 = fileEntries.has("bundleWindows2019.vivify");
    const hasVivifyWindows2021 = fileEntries.has("bundleWindows2021.vivify");

    const infoInfo = {
      cover: infoDat._coverImageFilename,
      song: infoDat._songFilename,
      difficultyFiles: infoDat._difficultyBeatmapSets.flatMap((x) =>
        x._difficultyBeatmaps.flatMap((y) => y._beatmapFilename)
      ),
      bpmInfo: hasBPMInfo ? "BPMInfo.dat" : null,
      cinemaVideo: hasCinemaVideo ? "cinema-video.json" : null,
      vivifyAndroid2021: hasVivifyAndroid2021
        ? "bundleAndroid2021.vivify"
        : null,
      vivifyWindows2019: hasVivifyWindows2019
        ? "bundleWindows2019.vivify"
        : null,
      vivifyWindows2021: hasVivifyWindows2021
        ? "bundleAndroid2021.vivify"
        : null,
    };

    return infoInfo;
  };

  const reconstructBeatSaberMapZip = async (
    fileEntries: FileEntries,
    infoInfo: ReturnType<typeof verifyBeatSaberMapZip>,
  ) => {
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);

    await Promise.all(
      Object
        .values(infoInfo)
        .flatMap((x) => x)
        .filter((x) => x !== null)
        .map((x) => {
          const _file = fileEntries.get(x!);
          if (!_file) {
            console.error(
              `${x} is missing in reconstruction`,
              "\nreconstruction data:",
              infoInfo,
              "\ncontents:",
              [...fileEntries.keys()],
            );
          }
          return zipWriter.add(x!, fileEntries.get(x!)!.data);
        }),
    );
    await zipWriter.close();

    return await zipFileWriter.getData();
  };

  export const _getBlob = async (formData: FormData): Promise<Blob | null> => {
    try {
      const fileEntries = await getFileEntries(formData);
      const infoInfo = verifyBeatSaberMapZip(fileEntries);
      const finalBlob = await reconstructBeatSaberMapZip(fileEntries, infoInfo);
      return finalBlob;
    } catch (_) {
      return null;
    }
  };

  export const uploadWip = async (formData: FormData): Promise<string> => {
    try {
      const blob = await _getBlob(formData);
    } catch (_) {
      return "Not OK";
    }
    return "OK";
  };
}
