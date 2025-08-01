import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class="px-4 py-2 border-gray-500 border-2 rounded bg-white disabled:bg-slate-200 hover:enabled:bg-gray-200 transition-colors text-xl"
    />
  );
}
