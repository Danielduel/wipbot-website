import { useCallback, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { ResponseObject } from "../routes/api/upload/prepare.ts";

export const UploadWip = () => {
  const ref = useRef<null | HTMLInputElement>(null);
  const uploadButtonText = useSignal("");
  const disableTheUploadButton = useSignal(false);
  const wipCode = useSignal("");
  const _handleUploadClick = useCallback(async () => {
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
      // const bytes = await file.bytes();

      const blob = new Blob([file]); // new Blob([bytes]);

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
  }, [ref.current, uploadButtonText, wipCode, disableTheUploadButton ]);

  const handleUploadClick = useCallback(async () => {
    disableTheUploadButton.value = true;
    await _handleUploadClick();
    disableTheUploadButton.value = false;
  }, [ _handleUploadClick ])

  return (
    <div class="w-dvw h-dvh bg-[#3b4252]">
      <div class="max-w-screen-md w-full h-full mx-auto my-auto flex flex-col items-center justify-center">
        <p class="text-white bg-[#434c5e] py-4 px-9 m-4 rounded">
          Select a file and then click the "Upload" button<br />
          After upload finishes and verifies, the twitch command will pop up.
        </p>

        {wipCode.value !== "" && (
          <div className="py-4 px-9 m-4 bg-[#434c5e] rounded-md text-2xl font-bold text-white">
            !wip 0{wipCode.value}
          </div>
        )}

        <input disabled={disableTheUploadButton.value} class="p-4 m-2 text-white text-xl disabled:text-slate-200" ref={ref} type="file"></input>
        <Button disabled={disableTheUploadButton.value} onClick={handleUploadClick}>{ uploadButtonText.value ? uploadButtonText.value : "Upload" }</Button>


        <p class="text-xl text-white bg-[#5e81ac] py-4 px-9 m-4 rounded">
          Hello, there is a lot of confusion about why the wipbot doesn't work.<br />
          If you got redirected from wipbot.catse.net - the wipbot won't work.<br />
          This means that the streamer still runs on the old config.<br />
          The new version can be obtained from <a class="underline text-[#ebcb8b]" href="https://github.com/Danielduel/wipbot/releases/tag/1.20.0">this GitHub release page</a>.
        </p>

        <p class="text-xl text-white bg-[#5e81ac] py-4 px-9 m-4 rounded whitespace-break-spaces">
          Thank you DaRoota and Kacy for reporting the last issue about failed verification
          on perfectly fine wips. I think it was happening when the mapper had a bit too
          fast internet speed and was on chromium-based browser.<br />
          Should be fixed now!
        </p>


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
