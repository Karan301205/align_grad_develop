const { getPublicUrl, uploadBuffer } = require('../config/s3');
const uploadConfig = require('../config/upload.config');

/**
 * Validates file magic bytes (signatures) to prevent MIME-type spoofing
 */
const validateMagicBytes = (buffer, fileType) => {
  if (!buffer || buffer.length < 4) return false;
  
  // Read first 4 bytes as hex string
  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  switch (fileType) {
    case 'resume':
      // Must be PDF: 25504446 (%PDF)
      return hex === '25504446';
      
    case 'image':
      // JPEG: FFD8FF
      // PNG: 89504E47
      return hex === '89504E47' || hex.startsWith('FFD8FF');
      
    case 'video':
      // MP4: 66747970 ('ftyp') at offset 4 (so first 4 bytes can vary but contain ftyp starting at 4)
      // WebM: 1A45DFA3
      return hex === '1A45DFA3' || (buffer.length >= 8 && buffer.toString('hex', 4, 8).toUpperCase() === '66747970');
      
    case 'doc':
      // Allowed: PDF (25504446), PNG (89504E47), JPEG (FFD8FF), or Office docs (Zip container: 504B0304 - PK..)
      return hex === '25504446' || hex === '89504E47' || hex.startsWith('FFD8FF') || hex === '504B0304';
      
    default:
      return false;
  }
};

/**
 * Handles requesting a pre-signed upload URL. Redirects to local server proxy to intercept file body.
 * Expects fileType, fileName, and contentType in request body.
 */
exports.requestUploadUrl = async (req, res) => {
  const { fileType, fileName, contentType } = req.body;

  if (!fileType || !fileName || !contentType) {
    return res.status(400).json({ error: 'Missing required parameters: fileType, fileName, contentType' });
  }

  const allowedTypes = ['resume', 'video', 'doc', 'image'];
  if (!allowedTypes.includes(fileType)) {
    return res.status(400).json({ error: 'Invalid fileType. Must be one of: resume, video, doc, image' });
  }

  try {
    const ext = fileName.split('.').pop() || 'bin';
    const userId = req.user.id;
    let key;

    if (fileType === 'resume') {
      key = `resumes/${userId}/resume_${Date.now()}.${ext}`;
    } else if (fileType === 'video') {
      key = `videos/${userId}/intro_${Date.now()}.${ext}`;
    } else if (fileType === 'doc') {
      key = `docs/${userId}/doc_${Date.now()}.${ext}`;
    } else if (fileType === 'image') {
      key = `images/${userId}/pic_${Date.now()}.${ext}`;
    }

    // Construct local secure-put endpoint to validate upload contents on the server
    const uploadUrl = `${req.protocol}://${req.get('host')}/api/upload/secure-put?fileType=${fileType}&key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
    const publicUrl = getPublicUrl(key);

    res.json({
      uploadUrl,
      publicUrl,
      key
    });
  } catch (err) {
    console.error('Error generating secure upload URL:', err);
    res.status(500).json({ error: 'Failed to generate secure upload URL' });
  }
};

/**
 * Middleware handler that intercepts binary PUT payloads, validates parameters/magic-bytes,
 * and streams the file securely to AWS S3.
 */
exports.securePut = async (req, res) => {
  const { fileType, key, contentType } = req.query;

  if (!fileType || !key || !contentType) {
    return res.status(400).json({ error: 'Missing query parameters: fileType, key, contentType' });
  }

  const buffer = req.body;
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return res.status(400).json({ error: 'Empty file payload or invalid binary buffer.' });
  }

  // 1. Enforce size limits
  const maxSize = uploadConfig.limits[fileType];
  if (maxSize && buffer.length > maxSize) {
    return res.status(400).json({ error: `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB.` });
  }

  // 2. Enforce MIME type constraints
  const allowedMimes = uploadConfig.allowedMimeTypes[fileType];
  if (allowedMimes && !allowedMimes.includes(contentType)) {
    return res.status(400).json({ error: `Invalid Content-Type header. Expected one of: ${allowedMimes.join(', ')}` });
  }

  // 3. Inspect magic bytes signature (prevent filename extension spoofing)
  if (!validateMagicBytes(buffer, fileType)) {
    return res.status(400).json({ error: 'File content signature verification failed. The uploaded file is corrupt or has spoofed signatures.' });
  }

  try {
    // Stream validated buffer securely to S3
    await uploadBuffer(key, buffer, contentType);
    res.json({ success: true, message: 'File uploaded and validated successfully.' });
  } catch (err) {
    console.error('Error uploading secure file to S3:', err);
    res.status(500).json({ error: 'Internal server error while storing file in S3.' });
  }
};
