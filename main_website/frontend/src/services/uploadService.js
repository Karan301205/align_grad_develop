import { NETWORK_MESSAGE } from './apiClient';

// Shared helper for the S3 binary PUT step of the direct-upload flow.
// The "request a presigned/secure URL, then PUT the raw file to it" sequence is
// used for resumes, profile pictures, certificates, verification docs and intro
// videos. Requesting the URL differs per resource (different endpoints/response
// fields), so that part stays in each caller and goes through `apiFetch`; the
// PUT step is identical everywhere and lives here.
//
// Returns the `Response` so callers keep their existing `res.ok` checks. A refused
// upload is logged with its status; a network failure is logged and becomes an Error
// with a plain message.
export async function putFileToS3(uploadUrl, file, contentType = file.type, token = null) {
  const headers = {
    'Content-Type': contentType
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body: file
    });
  } catch (err) {
    console.error('[upload] Could not reach the storage service:', err);
    throw new Error(NETWORK_MESSAGE, { cause: err });
  }
  if (!res.ok) {
    const text = await res.clone().text().catch(() => '');
    console.error(`[upload] Storage refused the file (HTTP ${res.status}):`, text.slice(0, 500));
  }
  return res;
}
