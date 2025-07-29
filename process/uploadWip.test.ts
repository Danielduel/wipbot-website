import { assertEquals } from "jsr:@std/assert";
import { UploadWip } from "./uploadWip.ts";
import { terminateWorkers } from "https://deno.land/x/zipjs@v2.7.69/index.js";

const runTest = async (
  t: Deno.TestContext,
  testFileName: string,
  expectSuccess: boolean = true,
) => {
  await t.step(testFileName, async () => {
    const file = await Deno.readFile(
      `./process/__uploadWip/${testFileName}`,
    );
    const formData = new FormData();
    formData.set(testFileName, new Blob([file]));
    const returns = await UploadWip._getBlob(formData);
    
    // uncoment to generate
    if (returns) Deno.writeFileSync(`./process/__uploadWip/result-${testFileName}`, await returns.bytes());

    assertEquals(!!returns, expectSuccess ? true : false);
  });
};

Deno.test("Upload zip (gz bomb)", async (t) => {
  await runTest(t, "zipbomb_1gib.gz", false);
  await runTest(t, "zipbomb_10gib.gz", false);
  await runTest(t, "zipbomb_100gib.gz", false);

  await terminateWorkers();
});

Deno.test("Upload zip (zip bomb)", async (t) => {
  await runTest(t, "zipbomb_1gib.zip", false);
  await runTest(t, "zipbomb_10gib.zip", false);
  await runTest(t, "zipbomb_100gib.zip", false);
  
  await terminateWorkers();
});

Deno.test("Upload zip (br bomb)", async (t) => {
  await runTest(t, "zipbomb_1gib.br", false);
  await runTest(t, "zipbomb_10gib.br", false);
  await runTest(t, "zipbomb_100gib.br", false);

  await terminateWorkers();
});

Deno.test("Upload zip", async (t) => {
  await runTest(t, "good_1_with_data_descriptor.zip");
  await runTest(t, "bad_2_with_4GB_file_uncompressed.zip", false);
  await runTest(t, "good_3_with_autosaves.zip");
  await runTest(t, "good_4.zip");
  await runTest(t, "good_5_with_junk.zip");
  await runTest(t, "good_6_with_cinema.zip");
  await runTest(t, "good_7_with_asciiart_filename.zip");
  await runTest(t, "good_8_with_custom_characteristic.zip");
  await runTest(t, "good_9_vivify_contributors_characteristics.zip");

  await terminateWorkers();
});

