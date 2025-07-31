(By App I mean frontend app)

Wips are uploaded to let streamers test maps from mappers.

To make this process safe for streamers, backend should verify the uploaded file.

The process should go as follows:

1. Mapper uploads a wip
2. System verifies the wip
3. Mapper receives a code from the system

Then

4. Streamer downloads the wip

---

### Mapper uploads a wip

Mapper picks a file.
App requests a presigned upload url.
(System creates a hash, wipcode and metadata and hands the hash back)
Mapper places a PUT fetch with the file blob.

---

### System verifies the wip

App requests a verification with the hash.
System fetches and verifies the file under that hash, updates the metadata, if verification is passed - the wipcode is passed.


