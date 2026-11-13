const { getDB } = require('../../config/database');
const { normalizeId } = require('../../utils/ids');
const crypto = require('crypto');
const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getS3Settings, createS3Client } = require('../../config/s3');
const env = require('../../config/env');

// Columns PUT /courses/:id may write (anything else in the body is ignored).
// `cast` is appended to the bind parameter for array/JSON columns.
const UPDATABLE_COURSE_COLUMNS = {
  title: {},
  description: {},
  category: {},
  instructor: {},
  thumbnailUrl: {},
  thumbnailKey: {},
  isPublished: {},
  tags: { cast: 'text[]' },
  modules: { cast: 'jsonb' }
};

// "Course"."tags" is a text[] column.
function toTagArray(tags) {
  if (tags === undefined || tags === null) return [];
  return Array.isArray(tags) ? tags : [tags];
}

// Read-modify-write of the "modules" JSONB column inside a transaction, with the
// Course row locked (SELECT ... FOR UPDATE) so concurrent module/lesson edits
// cannot overwrite each other. `mutate(modules)` returns { modules, ...extra }
// to persist, or { error: { status, body } } to abort without writing.
async function updateCourseModules(db, rawId, mutate) {
  const id = normalizeId(rawId);
  const client = await db.connect();
  let releaseError;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT "modules" FROM "Course" WHERE "id" = $1 FOR UPDATE',
      [id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return { error: { status: 404, body: { success: false, error: 'Course not found' } } };
    }

    const current = Array.isArray(rows[0].modules) ? rows[0].modules : [];
    const result = mutate(current);
    if (result.error) {
      await client.query('ROLLBACK');
      return result;
    }

    await client.query(
      'UPDATE "Course" SET "modules" = $1::jsonb, "updatedAt" = now() WHERE "id" = $2',
      [JSON.stringify(result.modules), id]
    );
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      releaseError = rollbackErr; // discard the broken connection instead of reusing it
    }
    throw err;
  } finally {
    client.release(releaseError);
  }
}

// Presigned S3 URL generator for course videos and thumbnails
exports.getUploadUrl = async (req, res, next) => {
  try {
    const { fileName, contentType, folder = 'courses' } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, error: 'fileName and contentType are required' });
    }

    const { bucketName, accessKeyId, secretAccessKey, region } = getS3Settings();
    if (!bucketName || !accessKeyId || !secretAccessKey) {
      // No stand-in URL: the upload is refused and the missing setting is logged.
      console.error('[courses] Upload URL refused: S3_BUCKET_NAME / AWS credentials are not configured in admin_ws/backend/.env.');
      return res.status(503).json({ success: false, error: 'File uploads are not available right now. Please try again later.' });
    }

    const s3 = createS3Client({ region, accessKeyId, secretAccessKey });
    const fileExt = path.extname(fileName) || '';
    const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
    res.json({
      success: true,
      uploadUrl,
      key,
      bucket: bucketName
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllCourses = async (req, res, next) => {
  try {
    const db = getDB();
    const { rows: courses } = await db.query(
      'SELECT * FROM "Course" ORDER BY "createdAt" DESC NULLS LAST, "id" DESC'
    );
    const mapped = courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category || 'General',
      instructor: c.instructor || null,
      thumbnailUrl: c.thumbnailUrl || null,
      thumbnailKey: c.thumbnailKey || null,
      isPublished: c.isPublished !== undefined ? c.isPublished : true,
      tags: c.tags || [],
      modules: c.modules || [],
      totalLessons: (c.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json({ success: true, courses: mapped });
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const db = getDB();
    const { rows: [course] } = await db.query(
      'SELECT * FROM "Course" WHERE "id" = $1',
      [normalizeId(req.params.id)]
    );
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    res.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category || 'General',
        instructor: course.instructor || null,
        thumbnailUrl: course.thumbnailUrl || null,
        thumbnailKey: course.thumbnailKey || null,
        isPublished: course.isPublished !== undefined ? course.isPublished : true,
        tags: course.tags || [],
        modules: course.modules || [],
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const db = getDB();
    const { title, description, category, instructor, thumbnailUrl, thumbnailKey, isPublished, tags } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    const { rows: [course] } = await db.query(
      `INSERT INTO "Course"
         ("title", "description", "category", "instructor", "thumbnailUrl", "thumbnailKey", "isPublished", "tags", "modules")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], '[]'::jsonb)
       RETURNING *`,
      [
        title,
        description,
        category || 'General',
        instructor || null,
        thumbnailUrl || null,
        thumbnailKey || null,
        isPublished !== undefined && isPublished !== null ? isPublished : true,
        toTagArray(tags)
      ]
    );

    res.status(201).json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        instructor: course.instructor,
        thumbnailUrl: course.thumbnailUrl,
        thumbnailKey: course.thumbnailKey,
        isPublished: course.isPublished,
        tags: course.tags,
        modules: course.modules,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        _id: course.id // legacy duplicate of `id`, kept so the response shape is unchanged
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const db = getDB();
    const id = normalizeId(req.params.id);
    const assignments = [];
    const values = [];
    for (const [column, { cast }] of Object.entries(UPDATABLE_COURSE_COLUMNS)) {
      if (!Object.prototype.hasOwnProperty.call(req.body || {}, column)) continue;
      let value = req.body[column];
      if (column === 'tags') value = toTagArray(value);
      if (cast === 'jsonb') value = JSON.stringify(value);
      values.push(value);
      assignments.push(`"${column}" = $${values.length}${cast ? `::${cast}` : ''}`);
    }
    assignments.push('"updatedAt" = now()');
    values.push(id);

    const { rows: [updated] } = await db.query(
      `UPDATE "Course" SET ${assignments.join(', ')} WHERE "id" = $${values.length} RETURNING *`,
      values
    );
    if (!updated) return res.status(404).json({ success: false, error: 'Course not found' });

    res.json({
      success: true,
      // `_id` is a legacy duplicate of `id`, kept so the response shape is unchanged
      course: { id: updated.id, _id: updated.id, ...updated }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const db = getDB();
    await db.query('DELETE FROM "Course" WHERE "id" = $1', [normalizeId(req.params.id)]);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.addModule = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await updateCourseModules(db, req.params.id, modules => {
      const newModule = {
        id: `mod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        title: req.body.title || `Module ${modules.length + 1}`,
        order: req.body.order !== undefined ? req.body.order : modules.length + 1,
        lessons: []
      };
      return { module: newModule, modules: [...modules, newModule] };
    });
    if (result.error) return res.status(result.error.status).json(result.error.body);

    res.status(201).json({ success: true, module: result.module, modules: result.modules });
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const db = getDB();
    const { title, order } = req.body;
    const result = await updateCourseModules(db, req.params.id, current => ({
      modules: current.map(m => {
        if (m.id === req.params.moduleId) {
          return {
            ...m,
            ...(title !== undefined && { title }),
            ...(order !== undefined && { order })
          };
        }
        return m;
      })
    }));
    if (result.error) return res.status(result.error.status).json(result.error.body);

    res.json({ success: true, modules: result.modules });
  } catch (err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await updateCourseModules(db, req.params.id, current => ({
      modules: current.filter(m => m.id !== req.params.moduleId)
    }));
    if (result.error) return res.status(result.error.status).json(result.error.body);

    res.json({ success: true, modules: result.modules });
  } catch (err) {
    next(err);
  }
};

exports.addLesson = async (req, res, next) => {
  try {
    const db = getDB();
    const {
      title,
      subTopic,
      description,
      videoKey,
      videoUrl,
      duration,
      notes,
      documentUrl,
      documentKey,
      documentName,
      quiz,
      order
    } = req.body;

    const result = await updateCourseModules(db, req.params.id, current => {
      // Checked after the course lookup so a missing course still answers 404 first.
      if (!title || !videoKey) {
        return { error: { status: 400, body: { success: false, error: 'Lesson title and videoKey are required' } } };
      }

      return {
        modules: current.map(m => {
          if (m.id === req.params.moduleId) {
            const lessons = m.lessons || [];
            const newLesson = {
              id: `les-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              title,
              subTopic: subTopic || '',
              description: description || '',
              videoKey,
              videoUrl: videoUrl || null,
              duration: duration || '10:00',
              notes: notes || '',
              documentUrl: documentUrl || null,
              documentKey: documentKey || null,
              documentName: documentName || null,
              quiz: quiz || null,
              order: order !== undefined ? order : lessons.length + 1
            };
            return { ...m, lessons: [...lessons, newLesson] };
          }
          return m;
        })
      };
    });
    if (result.error) return res.status(result.error.status).json(result.error.body);

    res.status(201).json({ success: true, modules: result.modules });
  } catch (err) {
    next(err);
  }
};

exports.updateLesson = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await updateCourseModules(db, req.params.id, current => ({
      modules: current.map(m => {
        if (m.id === req.params.moduleId) {
          const lessons = (m.lessons || []).map(l => {
            if (l.id === req.params.lessonId) {
              return { ...l, ...req.body };
            }
            return l;
          });
          return { ...m, lessons };
        }
        return m;
      })
    }));
    if (result.error) return res.status(result.error.status).json(result.error.body);

    res.json({ success: true, modules: result.modules });
  } catch (err) {
    next(err);
  }
};

exports.deleteLesson = async (req, res, next) => {
  try {
    const db = getDB();
    const result = await updateCourseModules(db, req.params.id, current => ({
      modules: current.map(m => {
        if (m.id === req.params.moduleId) {
          return {
            ...m,
            lessons: (m.lessons || []).filter(l => l.id !== req.params.lessonId)
          };
        }
        return m;
      })
    }));
    if (result.error) return res.status(result.error.status).json(result.error.body);

    res.json({ success: true, modules: result.modules });
  } catch (err) {
    next(err);
  }
};
