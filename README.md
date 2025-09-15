# For Developers

## Uploading the WIP zip file

### Preparing the upload

Before the upload process itself happens - an API endpoint is being called
to presetup the uploading and returns an URL that a client has to push
their map to.

### Uploading

File gets uploaded to the S3-like service using previously mentioned URL.
Available S3 API compatibility: [S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

### Verification

In order to get a requestable code - the backend has to get a map and verify
it, before that a flag inside a database will prevent downloading the map
even if the wip code will get guessed.

### Verification of the file

Zip-related checks:
* The zip file size has to be below 64MB
* The invidual uncompressed items have to be under 100MB each
* The total uncompressed items have to be under 100MB total

Archive entry checks:
* The zip has to contain `Info.dat` file, it can be nested inside the archive, like `Nested/Folder/Info.dat`

`Info.dat` checks:
* The file tself has to exist
* Content has to be a proper JSON
* Has to contain `_version` or `version` field in top object

---

#### `Info.dat` with `_version` field

* Has to match schema
* Archive has to optionally contain cover file mentioned in `_coverImageFilename`
* Archive has to contain song file mentioned in `_songFilename`
* Archive has to optionally contain an icon file mentioned in `_characteristicImageFilename` inside each existing `_difficultyBeatmapSets[]._customData`
* Archive has to contain difficulty file mentioned in `_beatmapFilename` inside each existing `_difficultyBeatmapSets[]._difficultyBeatmaps[]`
* Archive has to optionally contain an icon file mentioned in `_iconPath` inside each existing `_customData._contributors[]`

#### Optional contents

Archive entry optional includes:
* `BPMInfo.dat`
* `cinema-video.json`
* `bundleAndroid2021.vivify`
* `bundleWindows2019.vivify`
* `bundleWindows2021.vivify`

---

#### `Info.dat` with `version` field ("v4 map")

* Has to match v4 schema
* Archive has to optionally contain cover file mentioned in `coverImageFilename` 
* Archive has to contain song preview file mentioned in `songPreviewFilename`
* Archive has to contain song file mentioned in `audio.songFilename`
* Archive has to contain song data file mentioned in `audio.audioDataFilename`

#### Optional contents

Archive entry optional includes:
* `BPMInfo.dat`
* `cinema-video.json`
* `bundleAndroid2021.vivify`
* `bundleWindows2019.vivify`
* `bundleWindows2021.vivify`

---

### Reconstruction

The archive sent to the `wipbot.com` is not the same one that is being
sent to clients when archive gets requested.

From all the verified parts of the archive a new archive is being created,
which in turn means that all the not verified parts get dropped.
The new archive gets created and pushed to a separate S3 bucket
which is used to serve archives to clients.

The verification is finished after reconstruction is done and the
reconstructed archive is pushed to the bucket. Finishing verification
releases the wip request code to the uploader and flips the database
flag about the wip entry to be requestable.



