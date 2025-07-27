import { FreshContext } from "$fresh/server.ts";
import { read } from "https://deno.land/x/streaming_zip@v1.1.0/read.ts";
import { Buffer } from "https://deno.land/std@0.224.0/streams/buffer.ts";
import { InfoDatSchema } from "../../zod-schema/Info.dat.schema.ts";

type FileEntry = {
  name: string;
  data: Buffer;
};
type FileEntries = Map<string, FileEntry>;



const getFileEntries = async (formData: FormData): Promise<FileEntries> => {
  const formDataArr = formData.values().toArray();

  if (formDataArr.length !== 1) throw 400;

  const [ item ] = formDataArr;
  
  if (!(item instanceof File)) throw 400;

  const file = item as File;
  console.log(file);
  const fileEntries = new Map<string, FileEntry>();

  for await (const zipFileContent of read(file.stream())) {
    if (zipFileContent.type === "file") {
      console.log(`${zipFileContent.type} ${zipFileContent.name}`);
      const buffer = new Buffer();
      zipFileContent.body.stream().pipeTo(buffer.writable);
      fileEntries.set(zipFileContent.name, {
        name: zipFileContent.name,
        data: buffer
      });
    }
  }

  return fileEntries;
}

const readBufferAsJson = (buffer: Buffer) => {
  const textDecoder = new TextDecoder();
  const contents = textDecoder.decode(buffer.bytes({ copy: false }));
  const object = JSON.parse(contents);
  return object;
}

const verifyBeatSaberMapZip = (fileEntries: FileEntries) => {
  // Info.dat
  if (!fileEntries.has("Info.dat")) throw 400;
  const infoDatObject = readBufferAsJson(fileEntries.get("Info.dat")!.data);
  const infoDat = InfoDatSchema.parse(infoDatObject);
  console.log(infoDat);

}

export const handler = async (_req: Request, _ctx: FreshContext): Promise<Response> => {
  const formData = await _req.formData();
  const fileEntries = await getFileEntries(formData);
  verifyBeatSaberMapZip(fileEntries);

  return new Response("OK");
};

