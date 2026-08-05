import { Entry } from "https://deno.land/x/zipjs@v2.7.69/index.d.ts";

export type FileEntry = {
  name: string;
  data: Entry;
};

export type ReconstructionEntry = {
  filename: string;
  isOptional: boolean;
};
