import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <h1 class="text-4xl font-bold text-white">404 - Page not found</h1>
      <a href="/" class="underline text-white">Go back home</a>
    </>
  );
}
