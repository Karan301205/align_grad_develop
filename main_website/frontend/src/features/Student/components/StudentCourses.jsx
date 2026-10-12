import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Play,
  CheckCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  Layers,
  Award,
  Video,
  FileText,
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Bookmark,
  Maximize2,
  Download,
  Paperclip,
  HelpCircle,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
}

export default function StudentCourses({ user, token }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active classroom state
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [collapsedModules, setCollapsedModules] = useState({});
  const [videoStreamUrl, setVideoStreamUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // notes, transcript, quiz, overview
  const [bookmarked, setBookmarked] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  // End-of-video MCQ Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);

  const videoRef = useRef(null);

  // Fetch available courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch single course details & enrollment
  const openCourse = async (courseId) => {
    setActiveCourseId(courseId);
    setLoadingDetail(true);
    setVideoError(false);
    try {
      const res = await apiFetch(`/courses/${courseId}`, { token });
      if (res.ok) {
        const data = await res.json();
        const course = data.course;
        setCourseDetail(course);

        // Auto-select first lesson or last accessed lesson
        const allModules = course.modules || [];
        let lessonToSelect = null;
        let modIdToSelect = null;

        const lastAccessed = course.enrollment?.lastAccessedLessonId;
        if (lastAccessed) {
          for (const m of allModules) {
            const found = (m.lessons || []).find(l => l.id === lastAccessed);
            if (found) {
              lessonToSelect = found;
              modIdToSelect = m.id;
              break;
            }
          }
        }

        if (!lessonToSelect && allModules.length > 0) {
          for (const m of allModules) {
            if (m.lessons && m.lessons.length > 0) {
              lessonToSelect = m.lessons[0];
              modIdToSelect = m.id;
              break;
            }
          }
        }

        if (lessonToSelect) {
          setSelectedLesson(lessonToSelect);
          setSelectedModuleId(modIdToSelect);
          loadVideoStream(courseId, lessonToSelect.id);
        }
      }
    } catch (err) {
      console.error('Failed to open course:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Load CloudFront signed stream URL for a lesson
  const loadVideoStream = async (courseId, lessonId) => {
    setLoadingVideo(true);
    setVideoError(false);
    setVideoStreamUrl('');
    try {
      const res = await apiFetch(`/courses/${courseId}/lessons/${lessonId}/stream`, { token });
      if (res.ok) {
        const data = await res.json();
        setVideoStreamUrl(data.streamUrl || '');
      } else {
        setVideoError(true);
      }
    } catch (err) {
      console.error('Error loading video stream:', err);
      setVideoError(true);
    } finally {
      setLoadingVideo(false);
    }
  };

  // Switch lesson in classroom
  const selectLesson = (lesson, modId) => {
    setSelectedLesson(lesson);
    setSelectedModuleId(modId);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizPrompt(false);
    loadVideoStream(activeCourseId, lesson.id);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Download Notes written by Admin as a .txt file
  const handleDownloadNotes = () => {
    if (!selectedLesson?.notes) return;
    const content = `=====================================================
COURSE: ${courseDetail?.title || 'AlignGrade Academy'}
LESSON: ${selectedLesson.title}
SUB TOPIC: ${selectedLesson.subTopic || 'Core Concept'}
=====================================================

INSTRUCTOR / ADMIN NOTES:
-----------------------------------------------------
${selectedLesson.notes}

=====================================================
Downloaded from AlignGrade Interactive Academy
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(selectedLesson.title || 'Lesson').replace(/[^a-zA-Z0-9_-]/g, '_')}_Notes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quiz evaluation helper
  const calculateQuizScore = () => {
    if (!selectedLesson?.quiz?.questions) return { correct: 0, total: 0, percent: 0 };
    const questions = selectedLesson.quiz.questions;
    let correct = 0;
    questions.forEach((q, idx) => {
      if (Number(quizAnswers[idx]) === Number(q.correctAnswer)) {
        correct++;
      }
    });
    const percent = Math.round((correct / questions.length) * 100);
    return { correct, total: questions.length, percent };
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    handleMarkComplete();
  };

  const handleVideoEnded = () => {
    if (selectedLesson?.quiz && selectedLesson.quiz.questions?.length > 0) {
      setShowQuizPrompt(true);
    }
  };

  // Toggle module collapse in playlist
  const toggleModuleCollapse = (modId) => {
    setCollapsedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  // Mark lesson completed
  const handleMarkComplete = async () => {
    if (!activeCourseId || !selectedLesson || !token) return;
    setMarkingComplete(true);
    try {
      const res = await apiFetch(`/courses/${activeCourseId}/lessons/${selectedLesson.id}/complete`, {
        method: 'POST',
        token
      });
      if (res.ok) {
        const data = await res.json();
        // Update local enrollment state
        setCourseDetail(prev => ({
          ...prev,
          enrollment: data.enrollment
        }));
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
    } finally {
      setMarkingComplete(false);
    }
  };

  // Helper: flatten all lessons to find next/prev
  const getAllLessonsFlat = () => {
    if (!courseDetail || !courseDetail.modules) return [];
    const list = [];
    courseDetail.modules.forEach(m => {
      (m.lessons || []).forEach(l => {
        list.push({ ...l, moduleId: m.id });
      });
    });
    return list;
  };

  const flatLessons = getAllLessonsFlat();
  const currentIdx = flatLessons.findIndex(l => l.id === selectedLesson?.id);
  const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx !== -1 && currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;

  // Compute progress
  const totalLessonsCount = flatLessons.length;
  const completedIds = courseDetail?.enrollment?.completedLessonIds || [];
  const completedCount = completedIds.length;
  const progressPercent = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  // Filter courses for catalog view
  const categories = ['All', ...new Set(courses.map(c => c.category).filter(Boolean))];
  const filteredCourses = courses.filter(c => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: CLASSROOM / VIDEO PLAYER VIEW (Swayam-style interface)
  // ─────────────────────────────────────────────────────────────
  if (activeCourseId && courseDetail) {
    const isCurrentCompleted = selectedLesson && completedIds.includes(selectedLesson.id);

    return (
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen bg-surface-container-lowest text-on-surface">
        {/* Top Control Bar */}
        <header className="h-14 border-b border-outline-variant bg-surface-container flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveCourseId(null);
                setCourseDetail(null);
                fetchCourses();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold border border-outline-variant transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>All Courses</span>
            </button>
            <div className="h-4 w-[1px] bg-outline-variant hidden sm:block" />
            <span className="text-xs font-bold font-headline text-on-surface truncate max-w-[200px] sm:max-w-md">
              {courseDetail.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              CloudFront CDN Streamed
            </span>
            <div className="text-xs font-medium text-on-surface-variant">
              Progress: <strong className="text-primary font-bold">{progressPercent}%</strong>
            </div>
          </div>
        </header>

        {/* Main Classroom Split Pane */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Playlist & Progress (Width ~320px) */}
          <aside className="w-full md:w-80 lg:w-96 border-r border-outline-variant bg-surface-container flex flex-col shrink-0 overflow-hidden order-2 md:order-1 max-h-72 md:max-h-full">
            {/* Course Header & Progress Bar */}
            <div className="p-4 border-b border-outline-variant bg-surface-container-low shrink-0 space-y-3">
              <h2 className="text-sm font-bold font-headline text-on-surface tracking-tight">
                {courseDetail.title}
              </h2>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
                  <span>Course Progress</span>
                  <span className="font-semibold text-primary">{progressPercent}% ({completedCount} of {totalLessonsCount})</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Modules & Lessons List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/60">
              {(courseDetail.modules || []).map((mod, modIdx) => {
                const isCollapsed = collapsedModules[mod.id];
                const modLessons = mod.lessons || [];
                const modCompleted = modLessons.filter(l => completedIds.includes(l.id)).length;

                return (
                  <div key={mod.id || modIdx} className="bg-surface-container">
                    {/* Module Accordion Header */}
                    <button
                      onClick={() => toggleModuleCollapse(mod.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left hover:bg-surface-container-high transition-colors text-xs font-semibold text-on-surface"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <span className="truncate font-headline font-bold">{mod.title}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-medium shrink-0">
                        {modCompleted}/{modLessons.length}
                      </span>
                    </button>

                    {/* Module Lessons Items */}
                    {!isCollapsed && (
                      <div className="bg-surface-container-low/60 divide-y divide-outline-variant/30">
                        {modLessons.map(lesson => {
                          const isSelected = selectedLesson?.id === lesson.id;
                          const isCompleted = completedIds.includes(lesson.id);
                          const hasQuiz = lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0;

                          return (
                            <React.Fragment key={lesson.id}>
                              {/* Lesson Video Item */}
                              <button
                                onClick={() => {
                                  selectLesson(lesson, mod.id);
                                  setActiveTab('notes');
                                }}
                                className={`w-full flex items-start gap-3 p-3 text-left transition-all text-xs cursor-pointer ${
                                  isSelected && activeTab !== 'quiz'
                                    ? 'bg-blue-500/10 border-l-4 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold'
                                    : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                  ) : (
                                    <Circle className={`w-4 h-4 ${isSelected && activeTab !== 'quiz' ? 'text-blue-600' : 'text-on-surface-variant/40'}`} />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <p className={`text-xs leading-snug line-clamp-2 ${isSelected && activeTab !== 'quiz' ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-on-surface'}`}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-on-surface-variant/70 font-sans">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {lesson.duration || '10:00'}
                                    </span>
                                    {lesson.subTopic && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-medium truncate max-w-[120px]">
                                        {lesson.subTopic}
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Completed</span>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Dedicated Quiz Item under the lesson (matching screenshot format) */}
                              {hasQuiz && (
                                <button
                                  onClick={() => {
                                    selectLesson(lesson, mod.id);
                                    setActiveTab('quiz');
                                  }}
                                  className={`w-full flex items-center gap-3 p-2.5 pl-7 text-left transition-all text-xs cursor-pointer ${
                                    isSelected && activeTab === 'quiz'
                                      ? 'bg-purple-500/10 border-l-4 border-purple-600 text-purple-700 dark:text-purple-300 font-semibold'
                                      : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                                  }`}
                                >
                                  <div className="shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                    ) : (
                                      <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs leading-snug truncate font-medium text-purple-700 dark:text-purple-300">
                                      {lesson.quiz.title || `Quiz: ${lesson.title}`}
                                    </p>
                                  </div>
                                </button>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right Column: Main Video Player & Lesson Details */}
          <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 space-y-4 order-1 md:order-2">
            {/* Top Lesson Header Pill & Navigation */}
            <div className="flex items-center justify-between gap-3 pb-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-xs max-w-[85%] truncate">
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Lesson: {selectedLesson?.title || 'Select a lesson'}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setBookmarked(prev => !prev)}
                  className={`p-2 rounded-xl border border-outline-variant transition-all cursor-pointer ${
                    bookmarked ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                  title={bookmarked ? "Remove Bookmark" : "Bookmark Lesson"}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current?.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }}
                  className="p-2 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lesson Title Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-2">
              <h1 className="text-xl md:text-2xl font-bold font-headline text-on-surface tracking-tight">
                {selectedLesson?.title || 'Lesson Overview'}
              </h1>

              {/* Mark as Completed Button */}
              <button
                onClick={handleMarkComplete}
                disabled={markingComplete}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs shrink-0 ${
                  isCurrentCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isCurrentCompleted ? 'Completed' : 'Mark Complete'}</span>
              </button>
            </div>

            {/* Main Video Chassis Container with Floating Navigation Arrows */}
            <div className="w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 shadow-xl relative aspect-video flex items-center justify-center group">
              {loadingVideo ? (
                <div className="flex flex-col items-center gap-3 text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <span>Loading secure CloudFront video stream...</span>
                </div>
              ) : (getYouTubeEmbedUrl(videoStreamUrl || selectedLesson?.videoUrl)) ? (
                <iframe
                  key={videoStreamUrl}
                  src={getYouTubeEmbedUrl(videoStreamUrl || selectedLesson?.videoUrl)}
                  title={selectedLesson?.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videoStreamUrl ? (
                <video
                  ref={videoRef}
                  key={videoStreamUrl}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  className="w-full h-full object-contain bg-black"
                  src={videoStreamUrl}
                  onError={() => setVideoError(true)}
                  onEnded={handleVideoEnded}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400 text-center p-6 max-w-md">
                  <Video className="w-12 h-12 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">
                    {videoError ? 'Video could not be streamed via CloudFront' : 'No lecture video assigned for this lesson'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    The admin can upload lecture video files via the Admin Portal Course Manager directly into S3 & CloudFront.
                  </p>
                </div>
              )}

              {/* Floating Previous Lesson Arrow */}
              {prevLesson && (
                <button
                  onClick={() => selectLesson(prevLesson, prevLesson.moduleId)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10 transition-all z-10 cursor-pointer"
                  title={`Previous Lesson: ${prevLesson.title}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Floating Next Lesson Arrow */}
              {nextLesson && (
                <button
                  onClick={() => selectLesson(nextLesson, nextLesson.moduleId)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10 transition-all z-10 cursor-pointer"
                  title={`Next Lesson: ${nextLesson.title}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* End of Video Prompt for Quiz */}
            {showQuizPrompt && selectedLesson?.quiz && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Video Finished! Test Your Understanding</h4>
                    <p className="text-[11px] text-on-surface-variant">Take the end-of-video MCQ quiz ({selectedLesson.quiz.questions?.length || 0} questions) to solidify your knowledge.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('quiz');
                    setShowQuizPrompt(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shrink-0"
                >
                  Start Quiz Now
                </button>
              </div>
            )}

            {/* Swayam Style Tabs: Notes, Transcript, Quiz, Overview */}
            <div className="space-y-4 pt-4">
              <div className="border-b border-outline-variant flex items-center gap-6 text-xs font-semibold overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2.5 transition-all relative shrink-0 ${
                    activeTab === 'notes'
                      ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Notes &amp; Resources
                </button>

                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`pb-2.5 transition-all relative shrink-0 ${
                    activeTab === 'transcript'
                      ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Transcript
                </button>

                {selectedLesson?.quiz && selectedLesson.quiz.questions && selectedLesson.quiz.questions.length > 0 && (
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`pb-2.5 transition-all relative flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'quiz'
                        ? 'text-purple-600 dark:text-purple-400 font-bold border-b-2 border-purple-600 dark:border-purple-400'
                        : 'text-purple-600/70 hover:text-purple-600'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>End-of-Video Quiz ({selectedLesson.quiz.questions.length})</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 transition-all relative shrink-0 ${
                    activeTab === 'overview'
                      ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Overview &amp; Outcomes
                </button>
              </div>

              {/* Tab Content */}
              <div className="pt-2 text-xs text-on-surface-variant leading-relaxed">
                {/* 1. NOTES TAB (With Download Button + Document Download) */}
                {activeTab === 'notes' && (
                  <div className="space-y-4 py-1">
                    {/* Notes Header Plate */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant">
                      <div>
                        <h3 className="text-xs font-bold text-on-surface flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>Lecture Study Notes (Written by Instructor)</span>
                        </h3>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {selectedLesson?.subTopic ? `Sub Topic: ${selectedLesson.subTopic} • ` : ''}Official notes and procedure models for this lecture.
                        </p>
                      </div>

                      {selectedLesson?.notes && (
                        <button
                          onClick={handleDownloadNotes}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Notes (.txt)</span>
                        </button>
                      )}
                    </div>

                    {/* Notes Body */}
                    {selectedLesson?.notes ? (
                      <div className="p-4 rounded-xl bg-surface-container border border-outline-variant text-on-surface text-xs whitespace-pre-line leading-relaxed font-sans">
                        {selectedLesson.notes}
                      </div>
                    ) : (
                      <p className="text-on-surface-variant italic text-xs py-2">
                        No written notes added by the instructor for this lesson yet.
                      </p>
                    )}

                    {/* Attached Document uploaded by Recruiter / Admin */}
                    {(selectedLesson?.documentUrl || selectedLesson?.documentName) && (
                      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-on-surface truncate">
                              {selectedLesson.documentName || 'Lecture_Reference_Document.pdf'}
                            </h4>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                              Official Reference Document Attached by Instructor
                            </span>
                          </div>
                        </div>

                        <a
                          href={selectedLesson.documentUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={selectedLesson.documentName || 'Document'}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Document</span>
                        </a>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant text-[11px] text-on-surface space-y-1">
                      <strong className="block text-primary">Pro-tip for Technical Interviews:</strong>
                      <span>Download the lecture notes and review the procedure stages to reference during your candidate interview showcases.</span>
                    </div>
                  </div>
                )}

                {/* 2. TRANSCRIPT TAB */}
                {activeTab === 'transcript' && (
                  <div className="py-6 text-center sm:text-left">
                    {selectedLesson?.transcript ? (
                      <p className="whitespace-pre-line text-on-surface text-xs leading-relaxed font-sans">
                        {selectedLesson.transcript}
                      </p>
                    ) : (
                      <p className="text-on-surface-variant italic text-xs">
                        No transcripts are available for this video.
                      </p>
                    )}
                  </div>
                )}

                {/* 3. MCQ QUIZ TAB (Optional end-of-video quiz) */}
                {activeTab === 'quiz' && (
                  <div className="space-y-4 py-1">
                    {selectedLesson?.quiz && selectedLesson.quiz.questions && selectedLesson.quiz.questions.length > 0 ? (
                      <div className="space-y-4">
                        {/* Quiz Header Plate */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant">
                          <div>
                            <h3 className="text-xs font-bold text-on-surface flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-purple-500" />
                              <span>{selectedLesson.quiz.title || 'End-of-Video MCQ Quiz'}</span>
                            </h3>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Answer {selectedLesson.quiz.questions.length} multiple-choice questions to test your comprehension from this lecture.
                            </p>
                          </div>

                          {quizSubmitted && (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                Score: {calculateQuizScore().correct} / {selectedLesson.quiz.questions.length} ({calculateQuizScore().percent}%)
                              </span>
                              <button
                                onClick={() => {
                                  setQuizAnswers({});
                                  setQuizSubmitted(false);
                                }}
                                className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface flex items-center gap-1 cursor-pointer transition-all border border-outline-variant"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Retake</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Questions List */}
                        <div className="space-y-3">
                          {selectedLesson.quiz.questions.map((q, qIdx) => {
                            const selectedOpt = quizAnswers[qIdx];
                            const isCorrect = Number(selectedOpt) === Number(q.correctAnswer);

                            return (
                              <div key={qIdx} className="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-3">
                                <div className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {qIdx + 1}
                                  </span>
                                  <h4 className="text-xs font-bold text-on-surface leading-snug">{q.question}</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {(q.options || []).map((opt, optIdx) => {
                                    const isChosen = Number(selectedOpt) === optIdx;
                                    const isActuallyCorrect = Number(q.correctAnswer) === optIdx;

                                    let optStyle = "bg-surface-container-low hover:bg-surface-container-high border-outline-variant/60 text-on-surface";
                                    if (quizSubmitted) {
                                      if (isActuallyCorrect) {
                                        optStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold";
                                      } else if (isChosen && !isActuallyCorrect) {
                                        optStyle = "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300";
                                      }
                                    } else if (isChosen) {
                                      optStyle = "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 font-bold";
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        disabled={quizSubmitted}
                                        onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-2.5 cursor-pointer disabled:cursor-default ${optStyle}`}
                                      >
                                        <span className="w-5 text-center font-bold text-[11px] opacity-70">
                                          {String.fromCharCode(65 + optIdx)}.
                                        </span>
                                        <span className="flex-1">{opt}</span>
                                        {quizSubmitted && isActuallyCorrect && (
                                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                        )}
                                        {quizSubmitted && isChosen && !isActuallyCorrect && (
                                          <X className="w-4 h-4 text-rose-500 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {quizSubmitted && q.explanation && (
                                  <div className="p-3 rounded-lg bg-surface-container-high border border-outline-variant text-[11px] text-on-surface-variant">
                                    <strong className="text-primary">Explanation: </strong>
                                    <span>{q.explanation}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {!quizSubmitted && (
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={handleSubmitQuiz}
                              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>Submit Quiz Answers</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-on-surface-variant italic text-xs">
                        No quiz attached for this lecture.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-3 py-2">
                    <p className="text-on-surface">
                      {selectedLesson?.description || 
                        'This lesson provides a comprehensive introduction to modern industrial methodologies, practical frameworks, and domain applications. Follow along with the lecture video and review the accompanying key notes.'}
                    </p>
                    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-2">
                      <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Learning Outcomes
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-on-surface-variant text-[11px]">
                        <li>Understand essential architectural principles and domain requirements.</li>
                        <li>Learn step-by-step procedure models for rapid execution and validation.</li>
                        <li>Gain hands-on perspectives to excel in your technical assessment rounds.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: COURSES CATALOG & DIRECTORY VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-headline font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Learning Academy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-on-surface tracking-tight">
            Skill Courses & Video Lectures
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">
            Stream high-definition lecture videos powered by AWS CloudFront CDN. Upgrade your proficiencies, build job-ready confidence, and unlock recruitment tests.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search courses, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-surface-container border border-outline-variant" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface-container border border-outline-variant space-y-3">
          <BookOpen className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
          <h3 className="text-sm font-bold text-on-surface">No courses found</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            {searchQuery ? `No courses matching "${searchQuery}".` : 'Courses will be uploaded by the administration soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const modulesCount = (course.modules || []).length;
            const lessonsCount = (course.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

            return (
              <div
                key={course.id}
                className="group rounded-2xl bg-surface-container border border-outline-variant hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col shadow-xs hover:shadow-md"
              >
                {/* Course Thumbnail */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-indigo-950 text-indigo-400">
                      <BookOpen className="w-10 h-10 mb-2 opacity-60" />
                      <span className="text-[11px] font-semibold text-slate-400">AlignGrade Academy</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold tracking-wide">
                    {course.category || 'General'}
                  </div>

                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>{lessonsCount} Videos</span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold font-headline text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-outline-variant/60">
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Instructor: <strong className="text-on-surface">{course.instructor || 'AlignGrade Expert'}</strong></span>
                      <span>{modulesCount} Modules</span>
                    </div>

                    <button
                      onClick={() => openCourse(course.id)}
                      className="w-full py-2.5 rounded-xl bg-primary text-on-primary hover:opacity-90 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Learning</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
