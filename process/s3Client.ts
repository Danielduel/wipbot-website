import { S3Client as _S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

export namespace S3Client {
  let _current: _S3Client | null = null;

  export const getS3Client = () => {
    if (_current) return _current;

    const s3client = // isLocal() && !isDbEditorRemote()
      // ? new _S3Client({
      //   endPoint: "localhost",
      //   port: 8014,
      //   useSSL: false,
      //   region: "dev-region",
      //   accessKey: "AKEXAMPLES3S",
      //   secretKey: "SKEXAMPLES3S",
      //   bucket: "dev-bucket",
      //   pathStyle: true,
      // })
      new _S3Client({
        endPoint: Deno.env.get("S3_URL")!,
        port: 443,
        region: "auto",
        useSSL: true,
        accessKey: Deno.env.get("S3_KEY_ID"),
        secretKey: Deno.env.get("S3_SECRET_ACCESS_KEY"),
        bucket: BUCKET.WIP_BLOB,
        pathStyle: true,
      });

    _current = s3client;

    return s3client;
  };

  export enum BUCKET {
    WIP_BLOB = "wipbot-zip-blob",
    WIP_BLOB_VERIFIED = "wipbot-zip-verified",
  } 
}

