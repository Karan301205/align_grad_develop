// Best-effort removal of a previously-uploaded S3 object given its public URL.
// Extracted from the duplicated cleanup blocks in the student and recruiter
// controllers. The object key is derived from the portion of the URL after
// ".amazonaws.com/"; if the URL doesn't contain that marker, nothing happens.
//
// Callers keep their own try/catch so their existing error-log wording is
// preserved; the `label` keeps the pre-existing "Deleting old <label> from S3"
// log message identical per call site.
async function deleteS3ObjectFromUrl(url, label = 'file') {
  const parts = url.split('.amazonaws.com/');
  if (parts.length > 1) {
    const oldKey = parts[1];
    const { deleteObject } = require('../config/s3');
    console.log(`Deleting old ${label} from S3: ${oldKey}`);
    await deleteObject(oldKey);
  }
}

module.exports = { deleteS3ObjectFromUrl };
