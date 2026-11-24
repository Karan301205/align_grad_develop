// Best-effort removal of a previously-uploaded S3 object given its public URL.
// Extracted from the duplicated cleanup blocks in the student and recruiter
// controllers. The object key is derived from the portion of the URL after
// ".amazonaws.com/"; if the URL doesn't contain that marker, nothing happens.
//
// Callers keep their own try/catch so their existing error-log wording is
// preserved; the `label` keeps the pre-existing "Deleting old <label> from S3"
// log message identical per call site.
// `ownerIds` are the ids of the account making the change. A stored URL can point at anyone's
// object (the URL is saved from a request), so only the owner's own files are ever deleted (ISSUES U2).
async function deleteS3ObjectFromUrl(url, label = 'file', ownerIds = []) {
  const oldKey = keyFromPublicUrl(url);
  if (!oldKey) return;
  if (!isOwnedKey(oldKey, ownerIds)) {
    console.warn(`Not deleting ${label}: it is not a file owned by this account (${oldKey})`);
    return;
  }
  const { deleteObject } = require('../../infrastructure/storage/s3');
  console.log(`Deleting old ${label} from S3: ${oldKey}`);
  await deleteObject(oldKey);
}

const { isOwnedKey, keyFromPublicUrl } = require('./ownership');

module.exports = { deleteS3ObjectFromUrl };
