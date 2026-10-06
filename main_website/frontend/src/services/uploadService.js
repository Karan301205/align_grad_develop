// Shared helper for the S3 binary PUT step of the direct-upload flow.
// The "request a presigned/secure URL, then PUT the raw file to it" sequence is
// used for resumes, profile pictures, certificates, verification docs and intro
// videos. Requesting the URL differs per resource (different endpoints/response
// fields), so that part stays in each caller and goes through `apiFetch`; the
// PUT step is identical everywhere and lives here.
//
// Returns the raw `Response` so callers keep their existing `res.ok` checks.
export function putFileToS3(uploadUrl, file, contentType = file.type, token = null) {
  const headers = {
    'Content-Type': contentType
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file
  });
}
