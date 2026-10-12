const { getDbSafe } = require('../../config/database');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getS3Settings, createS3Client } = require('../../config/s3');

// Presigned S3 URL generator for course videos and thumbnails
exports.getUploadUrl = async (req, res, next) => {
  try {
    const { fileName, contentType, folder = 'courses' } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ success: false, error: 'fileName and contentType are required' });
    }

    const { bucketName, accessKeyId, secretAccessKey, region } = getS3Settings();
    if (!accessKeyId || !secretAccessKey) {
      return res.json({
        success: true,
        uploadUrl: `https://${bucketName}.s3.${region}.amazonaws.com/mock-upload/${Date.now()}-${fileName}`,
        key: `${folder}/${Date.now()}-${fileName}`,
        bucket: bucketName
      });
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
    const db = getDbSafe();
    if (!db) {
      return res.json({
        success: true,
        courses: [
          {
            id: 'mock_c1',
            title: 'Entrepreneurship & Career Growth',
            description: 'Master modern venture creation, procedure models, and enterprise problem-solving.',
            category: 'Business & Career',
            instructor: 'Dr. K. S. Sharma',
            thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80',
            isPublished: true,
            modules: []
          }
        ]
      });
    }

    const courses = await db.collection('Course').find({}).sort({ createdAt: -1 }).toArray();
    const mapped = courses.map(c => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      category: c.category || 'General',
      instructor: c.instructor || 'AlignGrade Instructor',
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
    const db = getDbSafe();
    if (!db) return res.status(404).json({ success: false, error: 'Course not found (DB offline)' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const course = await db.collection('Course').findOne(query);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    res.json({
      success: true,
      course: {
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        category: course.category || 'General',
        instructor: course.instructor || 'AlignGrade Instructor',
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
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    const { title, description, category, instructor, thumbnailUrl, thumbnailKey, isPublished, tags } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    const doc = {
      title,
      description,
      category: category || 'General',
      instructor: instructor || 'AlignGrade Instructor',
      thumbnailUrl: thumbnailUrl || null,
      thumbnailKey: thumbnailKey || null,
      isPublished: isPublished !== undefined ? isPublished : true,
      tags: tags || [],
      modules: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('Course').insertOne(doc);
    res.status(201).json({
      success: true,
      course: { id: result.insertedId.toString(), ...doc }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const updates = { ...req.body, updatedAt: new Date() };
    delete updates.id;
    delete updates._id;

    await db.collection('Course').updateOne(query, { $set: updates });
    const updated = await db.collection('Course').findOne(query);

    res.json({
      success: true,
      course: { id: updated._id.toString(), ...updated }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    await db.collection('Course').deleteOne(query);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.addModule = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const course = await db.collection('Course').findOne(query);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const modules = course.modules || [];
    const newModule = {
      id: `mod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      title: req.body.title || `Module ${modules.length + 1}`,
      order: req.body.order !== undefined ? req.body.order : modules.length + 1,
      lessons: []
    };

    modules.push(newModule);
    await db.collection('Course').updateOne(query, {
      $set: { modules, updatedAt: new Date() }
    });

    res.status(201).json({ success: true, module: newModule, modules });
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const course = await db.collection('Course').findOne(query);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const { title, order } = req.body;
    const modules = (course.modules || []).map(m => {
      if (m.id === req.params.moduleId) {
        return {
          ...m,
          ...(title !== undefined && { title }),
          ...(order !== undefined && { order })
        };
      }
      return m;
    });

    await db.collection('Course').updateOne(query, {
      $set: { modules, updatedAt: new Date() }
    });

    res.json({ success: true, modules });
  } catch (err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const course = await db.collection('Course').findOne(query);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const modules = (course.modules || []).filter(m => m.id !== req.params.moduleId);
    await db.collection('Course').updateOne(query, {
      $set: { modules, updatedAt: new Date() }
    });

    res.json({ success: true, modules });
  } catch (err) {
    next(err);
  }
};

exports.addLesson = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const course = await db.collection('Course').findOne(query);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

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

    if (!title || !videoKey) {
      return res.status(400).json({ success: false, error: 'Lesson title and videoKey are required' });
    }

    const modules = (course.modules || []).map(m => {
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
    });

    await db.collection('Course').updateOne(query, {
      $set: { modules, updatedAt: new Date() }
    });

    res.status(201).json({ success: true, modules });
  } catch (err) {
    next(err);
  }
};

exports.updateLesson = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const course = await db.collection('Course').findOne(query);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const modules = (course.modules || []).map(m => {
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
    });

    await db.collection('Course').updateOne(query, {
      $set: { modules, updatedAt: new Date() }
    });

    res.json({ success: true, modules });
  } catch (err) {
    next(err);
  }
};

exports.deleteLesson = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) return res.status(500).json({ success: false, error: 'Database not connected' });

    let query = {};
    if (ObjectId.isValid(req.params.id)) query._id = new ObjectId(req.params.id);
    else query._id = req.params.id;

    const course = await db.collection('Course').findOne(query);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    const modules = (course.modules || []).map(m => {
      if (m.id === req.params.moduleId) {
        return {
          ...m,
          lessons: (m.lessons || []).filter(l => l.id !== req.params.lessonId)
        };
      }
      return m;
    });

    await db.collection('Course').updateOne(query, {
      $set: { modules, updatedAt: new Date() }
    });

    res.json({ success: true, modules });
  } catch (err) {
    next(err);
  }
};
