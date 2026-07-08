const { getUploadUrl, getPublicUrl } = require('../config/s3');

/**
 * Handles requesting a pre-signed PUT URL for uploading to S3 directly from the browser.
 * Expects fileType, fileName, and contentType in request body.
 */
exports.requestUploadUrl = async (req, res) => {
  const { fileType, fileName, contentType } = req.body;

  if (!fileType || !fileName || !contentType) {
    return res.status(400).json({ error: 'Missing required parameters: fileType, fileName, contentType' });
  }

  const allowedTypes = ['resume', 'video', 'doc'];
  if (!allowedTypes.includes(fileType)) {
    return res.status(400).json({ error: 'Invalid fileType. Must be one of: resume, video, doc' });
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
    }

    const uploadUrl = await getUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    res.json({
      uploadUrl,
      publicUrl,
      key
    });
  } catch (err) {
    console.error('Error generating pre-signed upload URL:', err);
    res.status(500).json({ error: 'Failed to generate pre-signed upload URL' });
  }
};
