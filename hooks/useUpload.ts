import { useSignal } from "@preact/signals";
import { VerifyEndpointReponse } from "@/routes/api/upload/verify.tsx";
import { useCallback, useRef } from "preact/hooks";
import { ResponseObject } from "@/routes/api/upload/prepare.tsx";
import { JSX } from "preact/compat/jsx-dev-runtime";

export const useUpload = () => {
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

  return {
    ref,
    status,

    isFileChosen,
    isDraggingOver,
    verifyResponse,
    uploadButtonText,

    handleIgnore,
    handleDragEnter,
    handleDragEnd,
    handleDropUpload,
    handleBrowseUpload,
  } as const;
}


