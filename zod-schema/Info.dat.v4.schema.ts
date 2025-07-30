import { z } from "npm:zod";

const InfoDatV4DifficultyBeatmapSchema = z.object({
  beatmapDataFilename: z.string(),
  lightshowDataFilename: z.string(),
});

export const InfoDatV4Schema = z.object({
  version: z.string(),
  audio: z.object({
    // ...
    songFilename: z.string(),
    audioDataFilename: z.string(),
  }),
  songPreviewFilename: z.string(),
  coverImageFilename: z.string(),
  difficultyBeatmaps: z.array(InfoDatV4DifficultyBeatmapSchema),
  customData: z.object({}).optional(),
});

