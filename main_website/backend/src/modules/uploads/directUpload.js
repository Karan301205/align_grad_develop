// Videos go from the browser straight to S3, so a 100 MB file never sits in this server's
// memory (the old PUT /upload/secure-put proxy buffered the whole file).
//
// 1. startVideoUpload: a presigned POST form for one key in the owner's videos/ folder. S3
//    itself refuses a file over the size limit or with another Content-Type.
// 2. The browser posts the file to S3.
// 3. checkUploadedFile (POST /upload/verify): reads the stored object's size, type and first
//    bytes, and deletes it if it isn't really a video. The browser only uses the URL after this.
//
// Needs on AWS: a CORS rule on the bucket allowing POST from the frontend origins, and
// s3:GetObject (for HEAD and the range read) besides s3:PutObject / s3:DeleteObject.

const s3 = require('../../infrastructure/storage/s3');
const uploadConfig = require('../../config/upload.config');
const { validateMagicBytes } = require('../../shared/utils/fileSignature');

const MB = 1024 * 1024;
const VIDEO_FILE_TYPES = ['video', 'projectVideo'];
const EXTENSION_FOR = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/x-msvideo': 'avi',
  'video/ogg': 'ogv'
};

const baseType = (contentType) => String(contentType || '').split(';')[0].trim().toLowerCase();

class UploadProblem extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * A presigned upload for a candidate video. `folderId` is the owner's id used in the key
 * (the profile id for candidate videos). Throws UploadProblem for a type that isn't allowed.
 */
async function startVideoUpload({ folderId, fileType, fileName, contentType, now = Date.now() }) {
  const type = baseType(contentType);
  if (!VIDEO_FILE_TYPES.includes(fileType) || !(uploadConfig.allowedMimeTypes[fileType] || []).includes(type)) {
    throw new UploadProblem(400, 'Upload an MP4, MOV or WebM video.');
  }
  // The extension only names the file; keep it to plain letters and digits.
  const given = String(fileName || '').split('.').pop().toLowerCase();
  const extension = /^[a-z0-9]{1,8}$/.test(given) && String(fileName).includes('.') ? given : EXTENSION_FOR[type] || 'mp4';
  const prefix = fileType === 'projectVideo' ? 'proj' : 'showcase';
  const key = `videos/${folderId}/${prefix}_${now}.${extension}`;
  const maxBytes = uploadConfig.limits[fileType];
  const upload = await s3.createUploadPost(key, type, maxBytes);
  return { upload, key, publicUrl: s3.getPublicUrl(key), maxBytes };
}

const isNotFound = (err) => err?.name === 'NotFound' || err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404;

/**
 * Checks a file the browser put in S3. Returns null when it's fine; otherwise deletes it
 * and returns { status, error }. Other storage failures (e.g. missing permissions) throw.
 */
async function checkUploadedFile(key, fileType) {
  let head;
  try {
    head = await s3.headObject(key);
  } catch (err) {
    if (isNotFound(err)) return { status: 404, error: 'The video didn’t reach storage. Please upload it again.' };
    throw err;
  }

  const maxBytes = uploadConfig.limits[fileType];
  let problem = null;
  if (!head.ContentLength || head.ContentLength > maxBytes) {
    problem = `The video must be ${Math.round(maxBytes / MB)} MB or smaller.`;
  } else if (!(uploadConfig.allowedMimeTypes[fileType] || []).includes(baseType(head.ContentType))) {
    problem = 'Upload an MP4, MOV or WebM video.';
  } else if (!validateMagicBytes(await s3.readObjectStart(key, 64), fileType)) {
    problem = 'This file isn’t a video we can play. Try an MP4, MOV or WebM file.';
  }
  if (!problem) return null;

  await s3.deleteObject(key).catch((err) => console.error(`[upload] Could not delete the rejected file ${key}:`, err.message));
  return { status: 400, error: problem };
}

module.exports = { VIDEO_FILE_TYPES, UploadProblem, startVideoUpload, checkUploadedFile };
