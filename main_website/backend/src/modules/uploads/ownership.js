// Who may touch which S3 object. Uploads are stored as `<folder>/<owner id>/<file>`, where the owner
// id is the uploader's User id (or, for student videos, their Profile id). Only the owner may upload
// into that folder or delete from it (ISSUES U1, U2).

const OWNED_FOLDERS = ['resumes', 'videos', 'docs', 'images'];
const MAX_KEY_LENGTH = 300;

/** True when `key` is `<owned folder>/<one of ownerIds>/<file>`. */
function isOwnedKey(key, ownerIds) {
  if (typeof key !== 'string' || key.length > MAX_KEY_LENGTH || key.includes('..') || key.startsWith('/')) return false;
  const parts = key.split('/');
  if (parts.length < 3 || !OWNED_FOLDERS.includes(parts[0]) || parts[parts.length - 1] === '') return false;
  return (ownerIds || []).filter(Boolean).map(String).includes(parts[1]);
}

/** The S3 key inside a stored public URL, or null for anything that isn't an amazonaws.com URL. */
function keyFromPublicUrl(url) {
  if (typeof url !== 'string') return null;
  const parts = url.split('.amazonaws.com/');
  return parts.length > 1 ? parts[1] : null;
}

module.exports = { isOwnedKey, keyFromPublicUrl, OWNED_FOLDERS };
