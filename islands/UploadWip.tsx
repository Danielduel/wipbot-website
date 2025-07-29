import { useCallback, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";

export const UploadWip = () => {
  const ref = useRef<null | HTMLInputElement>(null);
  const wipCode = useSignal("");
  const handleUploadClick = useCallback(async () => {
    if (!ref.current) return false;

    const formData = new FormData();

    const { current } = ref;
    console.log(current.files);

    if (!current.files) return false;

    for (const file of current.files) {
      const bytes = await file.bytes();
      const blob = new Blob([bytes]);

      formData.append(file.name, blob);
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      wipCode.value = await response.text();
    }

    return true;
  }, [ref.current]);

  return (
    <div class="w-dvw h-dvh bg-[#3b4252]">
      <div class="max-w-screen-md w-full h-full mx-auto my-auto flex flex-col items-center justify-center">
        {wipCode.value !== "" && (
          <div className="py-4 px-9 m-4 bg-[#434c5e] rounded-md text-2xl font-bold text-white">
            !wip 0{wipCode.value}
          </div>
        )}
        <input ref={ref} type="file"></input>
        <Button onClick={handleUploadClick}>Upload</Button>
      </div>
    </div>
  );
};
