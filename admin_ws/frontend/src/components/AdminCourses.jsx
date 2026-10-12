import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import {
  Video,
  Plus,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  FolderPlus,
  Play,
  FileVideo,
  Image,
  AlertCircle,
  Eye,
  FileText,
  Download,
  HelpCircle,
  CheckSquare,
  Paperclip,
  Check,
  X
} from 'lucide-react';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Course Modal state (Create / Edit)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Full Stack Development',
    instructor: 'AlignGrade Academy',
    thumbnailUrl: '',
    thumbnailKey: '',
    isPublished: true
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  // Module state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [savingModule, setSavingModule] = useState(false);

  // Lesson state (Add / Edit Video Lecture)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeModuleIdForLesson, setActiveModuleIdForLesson] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    subTopic: '',
    description: '',
    duration: '15:00',
    videoKey: '',
    videoUrl: '',
    notes: '',
    documentUrl: '',
    documentKey: '',
    documentName: ''
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docProgress, setDocProgress] = useState('');

  // MCQ Quiz State (Optional end-of-video quiz)
  const [quizEnabled, setQuizEnabled] = useState(false);
  const [quizTitle, setQuizTitle] = useState('Quiz: Week 01: Assignment 01');
  const [quizQuestions, setQuizQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }
  ]);

  const [savingLesson, setSavingLesson] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const fetchCourses = () => {
    setLoading(true);
    adminApi.getCourses()
      .then(res => {
        if (res.success) {
          setCourses(res.courses || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching courses:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  // Open curriculum manager for a course
  const openCurriculum = (courseId) => {
    setLoadingDetail(true);
    adminApi.getCourse(courseId)
      .then(res => {
        if (res.success) {
          setSelectedCourse(res.course);
        }
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error('Error fetching course detail:', err);
        setLoadingDetail(false);
      });
  };

  // Handle Thumbnail File Upload to S3
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      const presignedRes = await adminApi.getUploadUrl({
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        folder: 'course-thumbnails'
      });

      if (!presignedRes.success || !presignedRes.uploadUrl) {
        throw new Error(presignedRes.error || 'Failed to get upload authorization');
      }

      await fetch(presignedRes.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg'
        },
        body: file
      });

      // Public or S3 URL
      const cleanUrl = presignedRes.uploadUrl.split('?')[0];
      setCourseForm(prev => ({
        ...prev,
        thumbnailUrl: cleanUrl,
        thumbnailKey: presignedRes.key
      }));
      showStatus('success', 'Thumbnail uploaded to S3 successfully!');
    } catch (err) {
      console.error('Thumbnail upload error:', err);
      showStatus('error', `Thumbnail upload failed: ${err.message}`);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Handle Lecture Video Upload to S3
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingVideo(true);
    setUploadProgress(`Uploading ${file.name} to AWS S3...`);
    try {
      const presignedRes = await adminApi.getUploadUrl({
        fileName: file.name,
        contentType: file.type || 'video/mp4',
        folder: 'course-videos'
      });

      if (!presignedRes.success || !presignedRes.uploadUrl) {
        throw new Error(presignedRes.error || 'Failed to get upload authorization');
      }

      await fetch(presignedRes.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4'
        },
        body: file
      });

      const s3Url = presignedRes.uploadUrl.split('?')[0];
      setLessonForm(prev => ({
        ...prev,
        videoKey: presignedRes.key,
        videoUrl: s3Url
      }));
      setUploadProgress('Video uploaded to S3 successfully!');
      showStatus('success', 'Lecture video successfully uploaded to S3 bucket!');
    } catch (err) {
      console.error('Video upload error:', err);
      setUploadProgress('Upload failed');
      showStatus('error', `Video upload failed: ${err.message}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  // Save Course (Create or Update)
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSavingCourse(true);
    try {
      if (editingCourseId) {
        const res = await adminApi.updateCourse(editingCourseId, courseForm);
        if (res.success) {
          showStatus('success', 'Course updated successfully!');
          setIsCourseModalOpen(false);
          fetchCourses();
          if (selectedCourse?.id === editingCourseId) {
            setSelectedCourse(res.course);
          }
        }
      } else {
        const res = await adminApi.createCourse(courseForm);
        if (res.success) {
          showStatus('success', 'New course created successfully!');
          setIsCourseModalOpen(false);
          fetchCourses();
        }
      }
    } catch (err) {
      showStatus('error', err.message || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to permanently delete this course and all its video lectures?')) return;
    try {
      const res = await adminApi.deleteCourse(courseId);
      if (res.success) {
        showStatus('success', 'Course deleted successfully');
        fetchCourses();
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(null);
        }
      }
    } catch (err) {
      showStatus('error', err.message || 'Failed to delete course');
    }
  };

  // Save Module (Add or Update)
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSavingModule(true);
    try {
      if (editingModuleId) {
        const res = await adminApi.updateModule(selectedCourse.id, editingModuleId, { title: moduleTitle });
        if (res.success) {
          setSelectedCourse(prev => ({ ...prev, modules: res.modules }));
          setIsModuleModalOpen(false);
          showStatus('success', 'Module title updated');
        }
      } else {
        const res = await adminApi.addModule(selectedCourse.id, { title: moduleTitle });
        if (res.success) {
          setSelectedCourse(prev => ({ ...prev, modules: res.modules }));
          setIsModuleModalOpen(false);
          showStatus('success', 'New module added');
        }
      }
    } catch (err) {
      showStatus('error', err.message || 'Failed to save module');
    } finally {
      setSavingModule(false);
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its contained lessons?')) return;
    try {
      const res = await adminApi.deleteModule(selectedCourse.id, moduleId);
      if (res.success) {
        setSelectedCourse(prev => ({ ...prev, modules: res.modules }));
        showStatus('success', 'Module removed');
      }
    } catch (err) {
      showStatus('error', err.message || 'Failed to delete module');
    }
  };

  // Handle Document Upload to S3 (PDF, DOCX, TXT notes attachment)
  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    setDocProgress(`Uploading ${file.name} to S3...`);
    try {
      const presignedRes = await adminApi.getUploadUrl({
        fileName: file.name,
        contentType: file.type || 'application/pdf',
        folder: 'course-documents'
      });

      if (!presignedRes.success || !presignedRes.uploadUrl) {
        throw new Error(presignedRes.error || 'Failed to get upload authorization');
      }

      await fetch(presignedRes.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/pdf'
        },
        body: file
      });

      const docCleanUrl = presignedRes.uploadUrl.split('?')[0];
      setLessonForm(prev => ({
        ...prev,
        documentKey: presignedRes.key,
        documentUrl: docCleanUrl,
        documentName: file.name
      }));
      setDocProgress('Document uploaded successfully!');
      showStatus('success', 'Document uploaded to S3 successfully!');
    } catch (err) {
      console.error('Doc upload error:', err);
      setDocProgress('Upload failed');
      showStatus('error', `Document upload failed: ${err.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Quiz Question Helpers
  const addQuizQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }
    ]);
  };

  const removeQuizQuestion = (qIndex) => {
    setQuizQuestions(prev => prev.filter((_, idx) => idx !== qIndex));
  };

  const updateQuizQuestionField = (qIndex, field, value) => {
    setQuizQuestions(prev => prev.map((q, idx) => {
      if (idx === qIndex) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const updateQuizOption = (qIndex, optIndex, value) => {
    setQuizQuestions(prev => prev.map((q, idx) => {
      if (idx === qIndex) {
        const newOpts = [...q.options];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  // Save Lesson (Add or Update Video Lecture)
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !activeModuleIdForLesson) return;
    if (!lessonForm.videoKey) {
      alert('Please upload a video file or enter an S3 video key.');
      return;
    }

    // Build quiz payload if enabled
    let quizPayload = null;
    if (quizEnabled) {
      const validQuestions = quizQuestions.filter(q => q.question && q.question.trim());
      if (validQuestions.length > 0) {
        quizPayload = {
          title: quizTitle.trim() || `Quiz: ${lessonForm.title || 'Assignment 01'}`,
          questions: validQuestions.map(q => ({
            question: q.question.trim(),
            options: (q.options || []).map(opt => (opt && opt.trim()) ? opt.trim() : 'Option'),
            correctAnswer: Number(q.correctAnswer) || 0,
            explanation: (q.explanation || '').trim()
          }))
        };
      }
    }

    const payload = {
      ...lessonForm,
      quiz: quizPayload
    };

    setSavingLesson(true);
    try {
      if (editingLessonId) {
        const res = await adminApi.updateLesson(selectedCourse.id, activeModuleIdForLesson, editingLessonId, payload);
        if (res.success) {
          setSelectedCourse(prev => ({ ...prev, modules: res.modules }));
          setIsLessonModalOpen(false);
          showStatus('success', 'Lesson updated successfully!');
        }
      } else {
        const res = await adminApi.addLesson(selectedCourse.id, activeModuleIdForLesson, payload);
        if (res.success) {
          setSelectedCourse(prev => ({ ...prev, modules: res.modules }));
          setIsLessonModalOpen(false);
          showStatus('success', 'Lecture video added to module!');
        }
      }
    } catch (err) {
      showStatus('error', err.message || 'Failed to save lesson');
    } finally {
      setSavingLesson(false);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this video lecture?')) return;
    try {
      const res = await adminApi.deleteLesson(selectedCourse.id, moduleId, lessonId);
      if (res.success) {
        setSelectedCourse(prev => ({ ...prev, modules: res.modules }));
        showStatus('success', 'Lecture video deleted');
      }
    } catch (err) {
      showStatus('error', err.message || 'Failed to delete lesson');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: CURRICULUM & VIDEO MANAGER FOR SELECTED COURSE
  // ─────────────────────────────────────────────────────────────
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        {/* Banner notification */}
        {statusMessage.text && (
          <div className={`p-4 rounded-xl flex items-center gap-2 text-xs font-semibold ${
            statusMessage.type === 'error' ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Back and Course Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedCourse(null);
                fetchCourses();
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-xs"
              title="Back to all courses"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{selectedCourse.title}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {selectedCourse.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">{selectedCourse.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingCourseId(selectedCourse.id);
                setCourseForm({
                  title: selectedCourse.title,
                  description: selectedCourse.description,
                  category: selectedCourse.category,
                  instructor: selectedCourse.instructor,
                  thumbnailUrl: selectedCourse.thumbnailUrl || '',
                  thumbnailKey: selectedCourse.thumbnailKey || '',
                  isPublished: selectedCourse.isPublished
                });
                setIsCourseModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit Course Info</span>
            </button>

            <button
              onClick={() => {
                setEditingModuleId(null);
                setModuleTitle('');
                setIsModuleModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Module / Week</span>
            </button>
          </div>
        </div>

        {/* Modules & Lessons Curriculum Tree */}
        <div className="space-y-4">
          {(selectedCourse.modules || []).length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950/30 border border-slate-900 space-y-3">
              <FolderPlus className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No modules added yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Organize your course into weekly modules or units, then upload lecture videos directly to AWS S3 & CloudFront.
              </p>
              <button
                onClick={() => {
                  setEditingModuleId(null);
                  setModuleTitle('Week 1: Introduction');
                  setIsModuleModalOpen(true);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Module</span>
              </button>
            </div>
          ) : (
            (selectedCourse.modules || []).map((mod, modIdx) => (
              <div key={mod.id || modIdx} className="rounded-2xl bg-slate-950/40 border border-slate-900/80 overflow-hidden space-y-3 p-5">
                {/* Module Bar */}
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center">
                      {modIdx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                    <span className="text-[10px] text-slate-500 font-medium">({(mod.lessons || []).length} lectures)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveModuleIdForLesson(mod.id);
                        setEditingLessonId(null);
                        setLessonForm({
                          title: '',
                          subTopic: '',
                          description: '',
                          duration: '15:00',
                          videoKey: '',
                          videoUrl: '',
                          notes: '',
                          documentUrl: '',
                          documentKey: '',
                          documentName: ''
                        });
                        setUploadProgress('');
                        setDocProgress('');
                        setQuizEnabled(false);
                        setQuizTitle('Quiz: Assignment 01');
                        setQuizQuestions([
                          {
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: 0,
                            explanation: ''
                          }
                        ]);
                        setIsLessonModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Video / Lecture</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingModuleId(mod.id);
                        setModuleTitle(mod.title);
                        setIsModuleModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                      title="Rename module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-all cursor-pointer"
                      title="Delete module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons List inside this Module */}
                <div className="space-y-2 pt-1">
                  {(mod.lessons || []).length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-2">No video lectures uploaded to this module yet.</p>
                  ) : (
                    (mod.lessons || []).map((lesson, lessonIdx) => (
                      <div
                        key={lesson.id || lessonIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-900/60 hover:border-slate-800 transition-all"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5 shrink-0">
                            <FileVideo className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-bold text-white truncate">{lesson.title}</h4>
                              {lesson.subTopic && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  {lesson.subTopic}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{lesson.description || 'No description provided'}</p>
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration || '10:00'}
                              </span>
                              {lesson.notes && (
                                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                  <FileText className="w-3 h-3" />
                                  Notes
                                </span>
                              )}
                              {lesson.documentName && (
                                <span className="flex items-center gap-1 text-amber-400 font-medium">
                                  <Paperclip className="w-3 h-3" />
                                  {lesson.documentName}
                                </span>
                              )}
                              {lesson.quiz && lesson.quiz.questions?.length > 0 && (
                                <span className="flex items-center gap-1 text-purple-400 font-medium">
                                  <HelpCircle className="w-3 h-3" />
                                  Quiz ({lesson.quiz.questions.length} Qs)
                                </span>
                              )}
                              <span className="truncate max-w-xs text-slate-600">
                                S3: {lesson.videoKey}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => {
                              setActiveModuleIdForLesson(mod.id);
                              setEditingLessonId(lesson.id);
                              setLessonForm({
                                title: lesson.title || '',
                                subTopic: lesson.subTopic || '',
                                description: lesson.description || '',
                                duration: lesson.duration || '15:00',
                                videoKey: lesson.videoKey || '',
                                videoUrl: lesson.videoUrl || '',
                                notes: lesson.notes || '',
                                documentUrl: lesson.documentUrl || '',
                                documentKey: lesson.documentKey || '',
                                documentName: lesson.documentName || ''
                              });
                              setUploadProgress('');
                              setDocProgress('');
                              const hasQuiz = !!(lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0);
                              setQuizEnabled(hasQuiz);
                              setQuizTitle(lesson.quiz?.title || 'Quiz: Week 01: Assignment 01');
                              setQuizQuestions(hasQuiz ? lesson.quiz.questions : [
                                {
                                  question: '',
                                  options: ['', '', '', ''],
                                  correctAnswer: 0,
                                  explanation: ''
                                }
                              ]);
                              setIsLessonModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                            title="Delete lecture video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal: Add / Edit Module */}
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-5 shadow-2xl">
              <h3 className="text-base font-bold text-white">
                {editingModuleId ? 'Edit Module Name' : 'Add New Module / Week'}
              </h3>
              <form onSubmit={handleSaveModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Module Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Week 1: Procedural Models & Architecture"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModuleModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingModule}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {savingModule ? 'Saving...' : 'Save Module'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add / Edit Lesson & Video Upload */}
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingLessonId ? 'Edit Lecture Video Details' : 'Upload Video Lecture to S3'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure video, sub-topic, notes, reference documents, and optional end-of-video MCQ quiz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLesson} className="space-y-4">
                {/* 1. Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Video / Lesson Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Entrepreneurship: An overview (1)"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 2. Sub Topic (just like in the screen shot) */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Sub Topic <span className="text-slate-500 font-normal">(Curriculum Section / Grouping just like in screenshot)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Procedures and Models for Entrepreneurial Endevours"
                    value={lessonForm.subTopic}
                    onChange={(e) => setLessonForm({ ...lessonForm, subTopic: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="block text-[11px] text-slate-500 mt-1">
                    Allows sub-grouping under modules (e.g. Procedures and Models for Entrepreneurial Endevours, Steps to start a small business).
                  </span>
                </div>

                {/* 3. Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Description / Overview</label>
                  <textarea
                    rows="2"
                    placeholder="Brief summary of concepts covered in this lecture..."
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 4. Duration & S3 Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Estimated Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 18:45"
                      value={lessonForm.duration}
                      onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">S3 Video Object Key *</label>
                    <input
                      type="text"
                      required
                      placeholder="courses/video.mp4"
                      value={lessonForm.videoKey}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoKey: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* S3 File Uploader Dropzone for Video */}
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/30 text-center space-y-2">
                  <FileVideo className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div className="text-xs text-slate-300">
                    <label className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-bold">
                      <span>Click to select video file</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                      />
                    </label>
                    <span className="block text-[11px] text-slate-500 mt-1">MP4, WebM, MOV files supported</span>
                  </div>

                  {uploadingVideo && (
                    <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 pt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadProgress}</span>
                    </div>
                  )}

                  {!uploadingVideo && lessonForm.videoKey && (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-semibold pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Video uploaded: {lessonForm.videoKey}</span>
                    </div>
                  )}
                </div>

                {/* 5. Notes written by Admin (with download option at candidate side) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-400">
                      Notes Written by Admin <span className="text-slate-500 font-normal">(With download option at candidate side)</span>
                    </label>
                  </div>
                  <textarea
                    rows="3"
                    placeholder="Enter comprehensive lecture notes, key bullet points, formulas, procedure models, and interview tips for candidate download..."
                    value={lessonForm.notes}
                    onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 6. Document uploaded by recruiter/admin (Downloadable at candidate side) */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <label className="block text-xs font-medium text-slate-400">
                    Document Uploaded by Recruiter / Admin <span className="text-slate-500 font-normal">(PDF, DOCX, presentation notes)</span>
                  </label>
                  
                  {lessonForm.documentName ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-indigo-500/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{lessonForm.documentName}</p>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Attached for candidate download
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLessonForm(prev => ({ ...prev, documentUrl: '', documentKey: '', documentName: '' }))}
                        className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer"
                        title="Remove attached document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs text-slate-400">
                        <Paperclip className="w-4 h-4 text-slate-500" />
                        <span>Upload lecture doc or study guide (PDF, Word, PPT)</span>
                      </div>
                      <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-all">
                        <span>{uploadingDoc ? 'Uploading...' : 'Browse File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                          className="hidden"
                          onChange={handleDocumentUpload}
                          disabled={uploadingDoc}
                        />
                      </label>
                    </div>
                  )}
                  {uploadingDoc && (
                    <div className="flex items-center gap-2 text-xs text-indigo-400 pt-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{docProgress}</span>
                    </div>
                  )}
                </div>

                {/* 7. Option for Admin to put MCQ Quiz for candidate at end of video (Optional) */}
                <div className="pt-3 border-t border-slate-900 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-white">End-of-Video MCQ Quiz</h4>
                        <p className="text-[11px] text-slate-400">Candidates can test their understanding immediately after watching this lecture.</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quizEnabled}
                        onChange={(e) => setQuizEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-300">Enable Quiz (Optional)</span>
                    </label>
                  </div>

                  {quizEnabled && (
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-purple-500/20 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Quiz Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Quiz: Week 01: Assignment 01"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Question Cards */}
                      <div className="space-y-3">
                        {quizQuestions.map((q, qIndex) => (
                          <div key={qIndex} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-purple-400">Question #{qIndex + 1}</span>
                              {quizQuestions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeQuizQuestion(qIndex)}
                                  className="p-1 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                                  title="Delete question"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <input
                              type="text"
                              placeholder={`Enter question #${qIndex + 1}...`}
                              value={q.question}
                              onChange={(e) => updateQuizQuestionField(qIndex, 'question', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                            />

                            {/* 4 Options */}
                            <div className="space-y-2 pt-1">
                              <span className="block text-[11px] text-slate-400 font-medium">
                                Answer Options <span className="text-slate-500 font-normal">(Select radio for correct answer)</span>
                              </span>
                              {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct_${qIndex}`}
                                    checked={Number(q.correctAnswer) === optIdx}
                                    onChange={() => updateQuizQuestionField(qIndex, 'correctAnswer', optIdx)}
                                    className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    title={`Mark Option ${label} as correct answer`}
                                  />
                                  <span className="w-5 text-center text-[11px] font-bold text-slate-400">{label}.</span>
                                  <input
                                    type="text"
                                    placeholder={`Option ${label}`}
                                    value={q.options[optIdx] || ''}
                                    onChange={(e) => updateQuizOption(qIndex, optIdx, e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Explanation */}
                            <div>
                              <input
                                type="text"
                                placeholder="Explanation for correct answer (Optional)..."
                                value={q.explanation || ''}
                                onChange={(e) => updateQuizQuestionField(qIndex, 'explanation', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addQuizQuestion}
                          className="w-full py-2 rounded-xl bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Another MCQ Question</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsLessonModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingLesson || uploadingVideo || uploadingDoc}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {savingLesson ? 'Saving...' : 'Save Lecture'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: COURSES DIRECTORY LIST FOR ADMIN
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Banner notification */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-xs font-semibold ${
          statusMessage.type === 'error' ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Courses & Lecture Videos</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage student course offerings, upload lecture videos to S3, and control CloudFront streaming catalogs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh courses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingCourseId(null);
              setCourseForm({
                title: '',
                description: '',
                category: 'Full Stack Development',
                instructor: 'AlignGrade Academy',
                thumbnailUrl: '',
                thumbnailKey: '',
                isPublished: true
              });
              setIsCourseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs font-semibold animate-pulse">
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/30 border border-slate-900 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No courses created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first course to begin uploading lecture videos and curriculum modules for students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div
              key={course.id}
              className="rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                    <BookOpen className="w-10 h-10 mb-1" />
                    <span className="text-[10px]">No Thumbnail</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                  {course.category}
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400">
                  {course.isPublished ? 'Published' : 'Draft'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{course.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-900/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{(course.modules || []).length} Modules</span>
                    <span>{course.totalLessons || 0} Lectures</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openCurriculum(course.id)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Manage Lectures</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingCourseId(course.id);
                        setCourseForm({
                          title: course.title,
                          description: course.description,
                          category: course.category,
                          instructor: course.instructor,
                          thumbnailUrl: course.thumbnailUrl || '',
                          thumbnailKey: course.thumbnailKey || '',
                          isPublished: course.isPublished
                        });
                        setIsCourseModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                      title="Edit Course Information"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 transition-all cursor-pointer"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Course */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-white">
                {editingCourseId ? 'Edit Course Settings' : 'Create New Skill Course'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Define the course metadata and upload an eye-catching thumbnail image.
              </p>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Backend Architecture & Distributed Systems"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Course Description *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain what students will learn and master in this course..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Instructor Name</label>
                  <input
                    type="text"
                    value={courseForm.instructor}
                    onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Thumbnail Uploader */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Course Thumbnail Image</label>
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    {courseForm.thumbnailUrl ? (
                      <img src={courseForm.thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <label className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{uploadingThumbnail ? 'Uploading to S3...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumbnail}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={courseForm.isPublished}
                  onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isPublished" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Publish course immediately to student directory
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse || uploadingThumbnail}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer hover:bg-indigo-500 disabled:opacity-50"
                >
                  {savingCourse ? 'Saving...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
