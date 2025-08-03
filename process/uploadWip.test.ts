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
    const blob = new Blob([file]);
    const returns = await UploadWip._getBlob(blob);

    if (returns) {
      const resultFileName = `./process/__uploadWip/result-${testFileName}`;
      const exists = (() => {
        try {
          Deno.statSync(resultFileName);
          return true;
        } catch (_) {
          return false;
        }
      })();
      if (!exists) {
        await Deno.writeFile(resultFileName, await returns.bytes());
      } else {
        const previousFile = await Deno.readFile(resultFileName);
        const blob = new Blob([ previousFile.buffer ]);
        const previous = await blob.bytes();
        const next = await returns.bytes();

        assertEquals(previous.length, next.length, "Blob data length mismatch");

        for (let i = 0; i < previous.length; i++) {
          // assertEquals(previous[i], next[i], "Blob data content mismatch");
        }
      }
    }

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
  await runTest(t, "good_10.zip");
  await runTest(t, "good_11.zip");
  await runTest(t, "good_12.zip");
  await runTest(t, "good_13.zip");
  await runTest(t, "good_14.zip");
  await runTest(t, "good_15.zip");
  await runTest(t, "good_16_v4_map.zip");
  await runTest(t, "good_17.zip");
  await runTest(t, "good_18.zip");
  await runTest(t, "good_19.zip");
  await runTest(t, "good_20.zip");

  await terminateWorkers();
});

Deno.test("Upload zip further", async (t) => {
  await runTest(t, "good_21.zip");
  await runTest(t, "good_22.zip");

  await terminateWorkers();
});

Deno.test("Generate names", () => {
  UploadWip._generateName(5, 0);
  UploadWip._generateName(5, 100);
  UploadWip._generateName(5, 1000);
  UploadWip._generateName(5, 20000);
  UploadWip._generateName(5, 400000);
  UploadWip._generateName(5, 15905819058);
  UploadWip._generateName(5, 1950159805189);
  UploadWip._generateName(5, 1589534289);
  UploadWip._generateName(5, 151515);
});
