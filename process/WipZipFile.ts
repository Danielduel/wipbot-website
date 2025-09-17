import { Buffer } from "../deps/buffer.ts";
import { Err, Ok, Result } from "../deps/optionals.ts";
import { BlobWriter, ZipReader, ZipWriter } from "../deps/zipjs.ts";

import {
  compressedTotalSizeLimit,
  uncompressedItemSizeLimit,
  uncompressedTotalSizeLimit,
} from "../constants/limits.ts";
import { LooseCaseMap } from "./LooseCaseMap.ts";
import type { FileEntry, ReconstructionEntry } from "./types.ts";

export class WipZipFile {
  private file: File;
  public fileEntries = new LooseCaseMap<string, FileEntry>();
  private reconstructionEntries: ReconstructionEntry[] = [];

  private directories: string[] = [];

  public static async fromBlobM(
    wipFileBlob: Blob,
  ): Promise<Result<WipZipFile, Error>> {
    const wipZipFile = new WipZipFile(wipFileBlob);
    const error = await wipZipFile.initialize();
    if (!error) return Ok(wipZipFile);
    return Err(error);
  }

  constructor(wipFileBlob: Blob) {
    this.file = new File([wipFileBlob], "none");
  }

  protected async initialize(): Promise<Error | undefined> {
    if (!(this.file instanceof File)) {
      return new Error("Expected blob is not a file");
    }

    if (this.file.size > compressedTotalSizeLimit) {
      return new Error("Compressed size is over the limit");
    }

    const fileStream = this.file.stream();
    const fileZipReader = new ZipReader(fileStream);
    const entries = fileZipReader.getEntriesGenerator();
    let totalUncompressedSize = 0;

    const returns = async <R>(returnedValue: R): Promise<R> => {
      if (!fileStream.locked) {
        await fileStream.cancel();
      }
      await fileZipReader.close();
      return returnedValue;
    };

    for await (const zipFileContent of entries) {
      if (zipFileContent.directory) {
        this.directories.push(zipFileContent.filename);
      } else {
        const buffer = new Buffer();
        totalUncompressedSize += zipFileContent.uncompressedSize;
        if (totalUncompressedSize > uncompressedTotalSizeLimit) {
          return await returns(
            new Error("Uncompressed size is over the limit"),
          );
        }
        if (zipFileContent.uncompressedSize > uncompressedItemSizeLimit) {
          return await returns(
            new Error("Uncompressed size for an item is over the limit"),
          );
        }
        await zipFileContent.getData(buffer.writable);
        this.fileEntries.set(zipFileContent.filename, {
          name: zipFileContent.filename,
          data: buffer,
        });
      }
    }

    if (this.fileEntries.has("Info.dat")) return await returns(undefined);

    const nestedInfoDatPath = this.fileEntries
      .keys()
      .filter((x) => x.endsWith("/Info.dat"))
      .toArray()
      .sort((x, y) => x.split("/").length - y.split("/").length)[0];
    if (!nestedInfoDatPath) {
      return await returns(
        new Error("Couldn't find Info.dat file in the archive"),
      );
    }

    const nestedInfoDatPathSplit = nestedInfoDatPath.split("Info.dat");
    const isSplitValid = nestedInfoDatPathSplit.length === 2 &&
      nestedInfoDatPathSplit[1] === "";
    if (!isSplitValid) {
      return await returns(
        new Error("Something went wrong with nesting the Info.dat"),
      );
    }

    const infoDatParentFolderPath = nestedInfoDatPathSplit[0]!;
    // remove all paths that aren't in the scope and truncate valid ones
    const fileEntriesOldEntries = this.fileEntries.entries().toArray();
    this.fileEntries.clear();
    for (const [key, value] of fileEntriesOldEntries) {
      if (!key.startsWith(infoDatParentFolderPath)) continue; // junk

      const newKey = key.replace(infoDatParentFolderPath, "");
      this.fileEntries.set(newKey, value);
    }

    return await returns(undefined);
  }

  public pushReconstructionEntryIfExists = (
    filename: string,
    isOptional: boolean = true,
  ) => {
    if (this.fileEntries.has(filename)) {
      this.reconstructionEntries.push({ filename, isOptional });
    }
    return this;
  };

  public pushReconstructionEntry = (
    filename: string,
    isOptional: boolean = true,
  ) => {
    this.reconstructionEntries.push({ filename, isOptional });
    return this;
  };

  public reconstruct = async () => {
    const zipFileWriter = new BlobWriter();
    const zipWriter = new ZipWriter(zipFileWriter);
    const addedFiles: string[] = [];

    await Promise.all(
      this.reconstructionEntries
        .map(({ filename, isOptional }) => {
          const entry = this.fileEntries.getEntryIgnoreCase(filename);
          if (!entry && isOptional) return Promise.resolve();
          if (!entry && !isOptional) {
            return Promise.resolve(
              new Error(
                `Necessary file ${filename} is missing in reconstruction data`,
              ),
            );
          }
          if (!entry) {
            return Promise.resolve(new Error("Empty entry error, fallback")); // this shouldn't happen
          }

          const [finalFileName, item] = entry;
          if (addedFiles.includes(finalFileName)) return Promise.resolve();

          addedFiles.push(finalFileName);
          return zipWriter.add(finalFileName, item.data);
        }),
    );
    await zipWriter.close();

    return await zipFileWriter.getData();
  };

  private readBufferAsJson = (buffer: Buffer) => {
    const textDecoder = new TextDecoder();
    const contents = textDecoder.decode(buffer.bytes({ copy: false }));
    const object = JSON.parse(contents);
    return object;
  };

  public readFileEntryAsJson = (key: string): [string, unknown] | undefined => {
    const entry = this.fileEntries.getEntryIgnoreCase(key);
    if (!entry) return undefined;
    const parsedData = this.readBufferAsJson(entry[1].data);
    return [entry[0], parsedData];
  };
}
