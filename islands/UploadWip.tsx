import { useCallback, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { ResponseObject } from "../routes/api/upload/prepare.ts";

export const UploadWip = () => {
  const ref = useRef<null | HTMLInputElement>(null);
  const uploadButtonText = useSignal("");
  const wipCode = useSignal("");
  const handleUploadClick = useCallback(async () => {
    uploadButtonText.value = "Starting";
    if (!ref.current) return false;

    const { current } = ref;
    console.log(current.files);

    if (!current.files) {
      uploadButtonText.value = "";
      return false;
    }

    for (const file of current.files) {
      uploadButtonText.value = "Preparing upload";
      const bytes = await file.bytes();
      const blob = new Blob([bytes]);

      // formData.append(file.name, blob);
      uploadButtonText.value = "Requesting upload";
      const presignedUrl = await fetch("/api/upload/prepare", {
        method: "POST",
        body: JSON.stringify({ size: blob.size }),
      });

      const presignedUrlData = await presignedUrl.json() as ResponseObject;

      const PromiseObject = Promise.withResolvers();
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrlData.url, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = ((e.loaded / e.total) * 100).toFixed(2);

          console.log(percentComplete);
          uploadButtonText.value = `Uploading... ${percentComplete}%`;
        }
      };
      xhr.upload.onload = (e) => {
        uploadButtonText.value = "Upload successful!";
        PromiseObject.resolve(null);
      };
      xhr.upload.onerror =
        xhr.upload.onabort =
        xhr.upload.ontimeout =
          (e) => {
            uploadButtonText.value = "Upload failed";
            PromiseObject.reject();
          };
      xhr.send(blob);
      await PromiseObject.promise;

      uploadButtonText.value = "Verifying the upload";
      const response = await fetch("/api/upload/verify", {
        method: "POST",
        body: JSON.stringify({
          hash: presignedUrlData.hash
        }),
      });

      if (response.ok) {
        uploadButtonText.value = "Upload verified!"
        wipCode.value = (await response.text());
        return;
      }

      uploadButtonText.value = "Verifying failed! If it's a proper map - please contact me";
    }

    return true;
  }, [ref.current, uploadButtonText, wipCode ]);

  return (
    <div class="w-dvw h-dvh bg-[#3b4252]">
      <div class="max-w-screen-md w-full h-full mx-auto my-auto flex flex-col items-center justify-center">
        <div class="text-white">
          Select file and then click Upload button, after a moment it should
          present you a code to copy-paste
        </div>

        {wipCode.value !== "" && (
          <div className="py-4 px-9 m-4 bg-[#434c5e] rounded-md text-2xl font-bold text-white">
            !wip 0{wipCode.value}
          </div>
        )}

        <input class="p-4 m-2 text-white text-xl" ref={ref} type="file"></input>
        <Button onClick={handleUploadClick}>{ uploadButtonText.value ? uploadButtonText.value : "Upload" }</Button>

        <p class="text-xl text-white bg-[#434c5e] py-4 px-9 m-4 rounded">
          Should support every kind of map zip<br />
          In case of issues:{" "}
          <a
            class="underline text-[#5e81ac]"
            href="https://discord.gg/h8Pg95CNGa"
          >
            Discord server
          </a>{" "}
          or directly <code class="p-1">danielduel</code> on Discord
        </p>
      </div>
    </div>
  );
};
