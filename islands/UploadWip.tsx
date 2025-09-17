import { useCallback, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { ResponseObject } from "../routes/api/upload/prepare.ts";
import { IconUpload } from "../components/icons/IconUpload.tsx";
import { IconDotsMove } from "../components/icons/IconDotsMove.tsx";
import { JSX } from "preact/jsx-runtime/src/index.d.ts";
import { IconUploadSuccess } from "../components/icons/IconUploadSuccess.tsx";
import { VerifyEndpointReponse } from "../routes/api/upload/verify.ts";

export const UploadWip = () => {
  const ref = useRef<null | HTMLInputElement>(null);
  const uploadButtonText = useSignal("");
  const isFileChosen = useSignal(false);
  const status = useSignal<"INPUT" | "PROGRESS" | "SUCCESS">("INPUT");
  const verifyResponse = useSignal<VerifyEndpointReponse | null>({
    wipcode: "ASDASD",
    status: {
      details: {
        infoDat: {
          done: true,
          error: false,
          ok: false,
          warns: [],
          warn: false,
          errors: [],
        },
      },
    },
  });

  const _handleUploadFiles = useCallback(async (fileList: FileList) => {
    uploadButtonText.value = "Starting";

    for (const file of fileList) {
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
          hash: presignedUrlData.hash,
        }),
      });

      if (response.ok) {
        uploadButtonText.value = "Upload verified!";
        const verification = (await response.json()) as VerifyEndpointReponse;
        verifyResponse.value = verification;
        const _ = Promise.withResolvers();
        setTimeout(() => {
          status.value = "SUCCESS";
          _.resolve(null);
        }, 400);
        await _.promise;
        return;
      }

      uploadButtonText.value =
        "Verifying failed! If it's a proper map - please contact me";
    }
  }, [uploadButtonText, verifyResponse, isFileChosen]);

  const handleUploadFiles = useCallback(async (fileList: FileList) => {
    status.value = "PROGRESS";
    await _handleUploadFiles(fileList);
    if (status.value === "PROGRESS") {
      status.value = "INPUT";
    }
  }, [_handleUploadFiles]);

  const handleBrowseUpload = useCallback(async () => {
    if (!ref.current) return false;

    const { current } = ref;
    console.log(current.files);

    if (!current.files) {
      uploadButtonText.value = "";
      return false;
    }

    await handleUploadFiles(current.files);

    return true;
  }, [ref.current, uploadButtonText, isFileChosen]);

  const handleDropUpload = useCallback<JSX.DragEventHandler<HTMLDivElement>>(
    async (e) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
      console.log("File(s) dropped");

      e.preventDefault();
      e.stopPropagation();

      if (!e.dataTransfer) return;
      if (!e.dataTransfer.files) return;

      await handleUploadFiles(e.dataTransfer.files);
    },
    [handleUploadFiles],
  );

  const isDraggingOver = useSignal(false);

  const handleDragEnter = useCallback<JSX.DragEventHandler<HTMLDivElement>>(
    (e) => {
      console.log("Drag start!");

      e.preventDefault();
      e.stopPropagation();

      isDraggingOver.value = true;
    },
    [isDraggingOver],
  );

  const handleDragEnd = useCallback<JSX.DragEventHandler<HTMLDivElement>>(
    (e) => {
      console.log("Drag end!");

      e.preventDefault();
      e.stopPropagation();

      isDraggingOver.value = false;
    },
    [isDraggingOver],
  );

  const handleIgnore = useCallback((e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const containerClassName =
    `px-4 py-3 w-full h-full border-[0.5rem] bg-[#434c5e] rounded-2xl text-center hover:border-gray-400 transition-colors border-dashed`;
  const subcontainerClassName = isDraggingOver.value === true
    ? "pointer-events-none"
    : "";

  return (
    <div class="w-dvw h-dvh bg-[#3b4252]">
      <div class="container mx-auto">
        <div class="text-2xl mt-10 mb-2 text-white">
          Add a WIP
        </div>

        {status.value !== "SUCCESS"
          ? <></>
          : (
            <div className={"border-[#8fbcbb] " + containerClassName}>
              <IconUploadSuccess class="h-20 w-20 my-6 mx-auto text-[#8fbcbb]" />
              <div class="text-white text-lg inline-block">
                Send this code on twitch chat to request the wip
              </div>
              <br />
              <div class="text-white my-4 text-3xl bg-[#4c566a] rounded inline-block py-3 px-20">
                !wip 0{verifyResponse.value?.wipcode}
              </div>
            </div>
          )}

        {status.value !== "PROGRESS"
          ? <></>
          : (
            <div className={"border-[#81a1c1] " + containerClassName}>
              <IconDotsMove class="h-20 w-20 my-6 mx-auto text-[#81a1c1]" />
              <div class="text-white my-4 text-3xl">
                {uploadButtonText.value}
              </div>
            </div>
          )}

        {status.value !== "INPUT" ? <></> : (
          <div
            onDragStart={handleIgnore}
            onDragOver={handleDragEnter}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragEnd}
            onDragEnd={handleDragEnd}
            onDrop={handleDropUpload}
            // onDragExit={handleDragEnd}
            class={`${containerClassName} ${
              isDraggingOver.value ? "border-white" : "border-gray-500"
            }`}
          >
            <div class={subcontainerClassName}>
              <IconUpload
                class={`h-20 w-20 my-6 mx-auto transition-colors ${
                  isDraggingOver.value ? "text-white" : "text-gray-400"
                }`}
              />
              <div class="text-white my-4 text-3xl">
                Drag your file here
              </div>

              {false && (
                <div class="text-gray-400 my-2 text-lg inline-block">
                  <div class="text-left">
                    Files supported: ZIP, GZ<br />
                    Maps supported: v1, v2, v3, v4<br />
                    Mods supported: cinema, vivify<br />
                  </div>
                </div>
              )}

              <div class="text-white text-xl">
                OR
              </div>

              <label class="" for="wipupload">
                <div class="text-gray-300 border-gray-300 hover:border-white cursor-pointer hover:text-white text-3xl px-10 py-3 my-4 rounded-3xl border inline-block">
                  BROWSE
                </div>
              </label>

              <div class="text-white text-xl">
                Maximum size: 64MB
              </div>
            </div>
          </div>
        )}

        <input
          id="wipupload"
          disabled={isFileChosen.value}
          class="hidden p-4 m-2 text-white text-xl disabled:text-slate-200"
          ref={ref}
          type="file"
          onChange={handleBrowseUpload}
        />
      </div>
    </div>
  );
};

/*
 *
 *
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

       */
