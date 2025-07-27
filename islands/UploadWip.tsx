import { useRef, useCallback } from "preact/hooks"
import { Button } from "../components/Button.tsx";

export const UploadWip = () => {
  const ref = useRef<null | HTMLInputElement>(null);
  const handleUploadClick = useCallback(async () => {
    if (!ref.current) return false;
    
    const formData  = new FormData();

    const { current } = ref;
    console.log(current.files);

    if (!current.files) return false;

    for(const file of current.files) {
      const bytes = await file.bytes()
      const blob = new Blob([bytes]);
      
      formData.append(file.name, blob);
    }

    await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    return true;
  }, [ref.current])

  return (
    <div class="w-dvw h-dvh bg-[#3b4252]">
      <div class="max-w-screen-md w-full h-full mx-auto my-auto flex flex-col items-center justify-center">
        <input ref={ref} type="file"></input>
        <Button onClick={handleUploadClick} >Upload</Button>
      </div>
    </div>
  );
}
