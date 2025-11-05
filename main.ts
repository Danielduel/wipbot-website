/// <reference lib="deno.unstable" />

import "./cronjobs.ts";

import { App, staticFiles, trailingSlashes } from "fresh";

export const app = new App()
  // Add static file serving middleware
  .use(trailingSlashes("never"))
  .use(staticFiles())
  // Enable file-system based routing
  .fsRoutes();

