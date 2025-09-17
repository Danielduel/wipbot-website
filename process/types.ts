import { Buffer } from "../deps/buffer.ts";

export type FileEntry = {
  name: string;
  data: Buffer;
};

export type ReconstructionEntry = {
  filename: string;
  isOptional: boolean;
};
