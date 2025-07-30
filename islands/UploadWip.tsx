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
        <div class="text-white">Select file and then click Upload button, after a moment it should present you a code to copy-paste</div>

        {wipCode.value !== "" && (
          <div className="py-4 px-9 m-4 bg-[#434c5e] rounded-md text-2xl font-bold text-white">
            !wip 0{wipCode.value}
          </div>
        )}

        <input class="p-4 m-2 text-white text-xl" ref={ref} type="file"></input>
        <Button onClick={handleUploadClick}>Upload</Button>

        <p class="text-xl text-white bg-[#434c5e] py-4 px-9 m-4 rounded">
          Should support every kind of map zip<br />
          In case of issues: <a class="underline text-[#5e81ac]" href="https://discord.gg/h8Pg95CNGa">Discord server</a> or directly <code class="p-1">danielduel</code> on Discord
        </p>
      </div>
    </div>
  );
};
