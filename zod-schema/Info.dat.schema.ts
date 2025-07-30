import { z } from "npm:zod";

export const InfoDatDifficultyBeatmapsSchema = z.object({
  // ...
  _beatmapFilename: z.string(),
});

export const InfoDatDifficultyBeatmapSetsSchema = z.object({
  // ...
  _difficultyBeatmaps: z.array(InfoDatDifficultyBeatmapsSchema),
  _customData: z.object({
    _characteristicIconImageFilename: z.string().optional(),
  }).optional(),
});

export const InfoDatSchema = z.object({
  _version: z.string(),
  _songName: z.string(),
  _customData: z.object({
    _contributors: z.array(z.object({
      _iconPath: z.string().optional(),
    })).optional(),
  }).optional(),
  // ...
  _beatsPerMinute: z.number(),
  _previewStartTime: z.number(),
  _previewDuration: z.number(),
  _songTimeOffset: z.number(),
  _coverImageFilename: z.string(),
  _songFilename: z.string(),
  // ...
  _difficultyBeatmapSets: z.array(InfoDatDifficultyBeatmapSetsSchema)
});

