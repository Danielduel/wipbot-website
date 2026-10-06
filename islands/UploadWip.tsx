import { IconUpload } from "../components/icons/IconUpload.tsx";
import { IconDotsMove } from "../components/icons/IconDotsMove.tsx";
import { IconUploadSuccess } from "../components/icons/IconUploadSuccess.tsx";
import { FunctionComponent } from "preact/compat";
import { DOMAttributes } from "preact";
import { useUpload } from "@/hooks/useUpload.ts";

const UploadWipSuccess: FunctionComponent<
  { containerClassName: string; wipcode: string }
> = ({ containerClassName, wipcode }) => {
  return (
    <div className={"border-[#8fbcbb] " + containerClassName}>
      <IconUploadSuccess class="h-20 w-20 my-6 mx-auto text-[#8fbcbb]" />
      <div class="text-white text-lg inline-block">
        Send this code on twitch chat to request the wip
      </div>
      <br />
      <div class="text-white my-4 text-3xl bg-[#4c566a] rounded inline-block py-3 px-20">
        !wip 0{wipcode}
      </div>
    </div>
  );
};

const UploadWipProgress: FunctionComponent<
  { containerClassName: string; uploadButtonText: string }
> = ({ containerClassName, uploadButtonText }) => {
  return (
    <div className={"border-[#81a1c1] " + containerClassName}>
      <IconDotsMove class="h-20 w-20 my-6 mx-auto text-[#81a1c1]" />
      <div class="text-white my-4 text-3xl">
        {uploadButtonText}
      </div>
    </div>
  );
};

type DragEventHandler = DOMAttributes<HTMLDivElement>["onDragStart"];
const UploadWipInput: FunctionComponent<{
  subcontainerClassName: string;
  containerClassName: string;
  handleIgnore: DragEventHandler;
  handleDragEnter: DragEventHandler;
  handleDragEnd: DragEventHandler;
  handleDropUpload: DragEventHandler;
  isDraggingOver: boolean;
}> = ({
  isDraggingOver,
  handleDropUpload,
  handleDragEnd,
  handleDragEnter,
  handleIgnore,
  containerClassName,
  subcontainerClassName,
}) => {
  return (
    <div
      onDragStart={handleIgnore}
      onDragOver={handleDragEnter}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragEnd}
      onDragEnd={handleDragEnd}
      onDrop={handleDropUpload}
      // onDragExit={handleDragEnd}
      class={`${containerClassName} ${
        isDraggingOver ? "border-white" : "border-gray-500"
      }`}
    >
      <div class={subcontainerClassName}>
        <IconUpload
          class={`h-20 w-20 my-6 mx-auto transition-colors ${
            isDraggingOver ? "text-white" : "text-gray-400"
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
  );
};

export const UploadWip = () => {
  const {
    ref,

    status,
    uploadButtonText,
    verifyResponse,

    isFileChosen,
    isDraggingOver,

    handleIgnore,
    handleDragEnd,
    handleDragEnter,
    handleDropUpload,
    handleBrowseUpload,
  } = useUpload();

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

        {status.value !== "SUCCESS" ? <></> : (
          <UploadWipSuccess
            wipcode={verifyResponse.value!.wipcode}
            containerClassName={containerClassName}
          />
        )}

        {status.value !== "PROGRESS" ? <></> : (
          <UploadWipProgress
            uploadButtonText={uploadButtonText.value!}
            containerClassName={containerClassName}
          />
        )}

        {status.value !== "INPUT"
          ? <></>
          : (
            <UploadWipInput
              containerClassName={containerClassName}
              ref={ref}
              isDraggingOver={isDraggingOver.value}
              handleIgnore={handleIgnore}
              handleDropUpload={handleDropUpload}
              handleDragEnter={handleDragEnter}
              handleDragEnd={handleDragEnd}
              subcontainerClassName={subcontainerClassName}
            />
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
