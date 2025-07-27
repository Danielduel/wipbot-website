import { z } from "npm:zod";

const _ /* whatever */ = z.any().optional(); 

export const InfoDatDifficultyBeatmapsSchema = z.object({
  // ...
  _beatmapFilename: z.string(),
});

export const InfoDatDifficultyBeatmapSetsSchema = z.object({
  // ...
  _difficultyBeatmaps: z.array(InfoDatDifficultyBeatmapsSchema)
});

export const InfoDatSchema = z.object({
  _version: z.string(),
  _songName: z.string(),
  _songSubName: _,
  _songAuthorName: _,
  _levelAuthorName: _,
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

