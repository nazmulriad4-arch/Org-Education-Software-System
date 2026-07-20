import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dbGetItems, dbSaveItem, dbDeleteItem } from '../services/firebase';
import HandwrittenPaper from '../assets/images/bengali_handwritten_exam_paper_1784459875251.jpg';
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  ChevronDown, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  Minus,
  Send, 
  Edit3, 
  ThumbsUp, 
  Clock, 
  BookOpen, 
  Star, 
  ChevronRight,
  Info,
  Check,
  Award,
  ArrowRight,
  Sparkles,
  CreditCard,
  FileCheck,
  MessageCircle,
  Pencil,
  Type,
  Undo2,
  Redo2,
  Eraser,
  RotateCcw,
  X
} from 'lucide-react';

interface TeacherPortalProps {
  onBackToAdmin?: () => void;
  adminForwardedRequests?: any[];
  setAdminForwardedRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  studentReviewRequests?: any[];
  setStudentReviewRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser?: any;
}

export default function TeacherPortal({ 
  onBackToAdmin,
  adminForwardedRequests = [],
  setAdminForwardedRequests,
  studentReviewRequests: propStudentReviewRequests,
  setStudentReviewRequests: propSetStudentReviewRequests,
  currentUser
}: TeacherPortalProps) {
  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<'routine' | 'evaluation' | 'review' | 'due-amount' | 'summary-report' | 'class-payment' | 'evaluation-payment' | 'materials-payment' | 'qa-payment' | 'class-performance' | 'pending-question' | 'edit-answer' | 'community'>('routine');

  // Local Student Review Requests State Fallback
  const [localStudentReviewRequests, setLocalStudentReviewRequests] = useState([
    {
      id: 'SR-001',
      program: 'CAP-2026',
      course: 'NDC & SJC All Service',
      exam: 'Weekly MCQ and SAQ Exam For NDC-02 (Phy)',
      examCode: '170',
      version: 'Bangla',
      question: 'U1-Q4',
      requests: 1,
      studentName: 'Tasnim Alam',
      roll: '37180715',
      originalMarks: 6.0,
      claimedMarks: 8.0,
      doubtText: '৩ নং প্রশ্নের উত্তরের পূর্ণমান দেওয়া হয়নি, দয়া করে আবার বিবেচনা করবেন।',
      status: 'Pending'
    }
  ]);

  const studentReviewRequests = propStudentReviewRequests !== undefined ? propStudentReviewRequests : localStudentReviewRequests;
  const setStudentReviewRequests = propSetStudentReviewRequests !== undefined ? propSetStudentReviewRequests : setLocalStudentReviewRequests;

  // Review Modal States
  const [selectedReviewModal, setSelectedReviewModal] = useState<any | null>(null);
  const [reviewModalType, setReviewModalType] = useState<'student' | 'admin'>('student');
  const [revisedMarks, setRevisedMarks] = useState('');
  const [revisedRemarks, setRevisedRemarks] = useState('');
  
  // Dropdown States
  const [isScriptEvalOpen, setIsScriptEvalOpen] = useState(false);
  const [isMyPaymentOpen, setIsMyPaymentOpen] = useState(false);
  const [isQAOpen, setIsQAOpen] = useState(false);

  // Filter States (Routine)
  const [routineType, setRoutineType] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedProgram, setSelectedProgram] = useState('All Program');
  const [selectedLecture, setSelectedLecture] = useState('All Lecture');

  // Interactive Mock Data States
  const [scripts, setScripts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Evaluation Payment Filter States
  const [evalPaymentProgram, setEvalPaymentProgram] = useState('All Program');
  const [evalPaymentSession, setEvalPaymentSession] = useState('All Session');
  const [evalPaymentCourse, setEvalPaymentCourse] = useState('All Course');
  const [evalPaymentExam, setEvalPaymentExam] = useState('');
  const [evalPaymentExamType, setEvalPaymentExamType] = useState('All Exam Type');
  const [evalPaymentStatus, setEvalPaymentStatus] = useState('All Status');
  const [evalPaymentStartDate, setEvalPaymentStartDate] = useState('2026-07-12');
  const [evalPaymentEndDate, setEvalPaymentEndDate] = useState('2026-07-19');
  const [isEvalFilterExpanded, setIsEvalFilterExpanded] = useState(true);
  const [isEvalSearching, setIsEvalSearching] = useState(false);
  const [evalSearchResults, setEvalSearchResults] = useState<any[]>([]);

  // Canvas Drawing State for Script Review
  const [activeDrawingTool, setActiveDrawingTool] = useState("pencil");
  const [imageScale, setImageScale] = useState(1);
  const [studentPaperRotate, setStudentPaperRotate] = useState(0);
  const [extraBottomSpace, setExtraBottomSpace] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTextInput, setActiveTextInput] = useState<{x: number, y: number} | null>(null);
  const [currentPath, setCurrentPath] = useState("");
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [scriptComments, setScriptComments] = useState<{x: number, y: number, text: string}[]>([]);
  const [actionHistory, setActionHistory] = useState<{type: 'path'|'comment', value: string | any}[]>([]);
  const [redoHistory, setRedoHistory] = useState<{type: 'path'|'comment', value: string | any}[]>([]);

  // Mouse handlers for drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeDrawingTool !== 'pencil' && activeDrawingTool !== 'eraser') return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentPath(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeDrawingTool === 'pencil') {
      setCurrentPath(prev => `${prev} L ${x.toFixed(2)} ${y.toFixed(2)}`);
    } else if (activeDrawingTool === 'eraser') {
      // Very basic eraser logic: clear paths that are close (simplified by just clearing the last path for this demo)
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (activeDrawingTool === 'pencil' && currentPath) {
      setAllPaths(prev => [...prev, currentPath]);
      setActionHistory(prev => [...prev, { type: 'path', value: currentPath }]);
      setRedoHistory([]);
      setCurrentPath("");
    }
  };

  const handleCanvasMouseLeave = () => {
    if (isDrawing) {
      handleCanvasMouseUp();
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (activeDrawingTool !== 'text') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setActiveTextInput({ x, y });
  };

  const handleTextInputSubmit = (text: string, x: number, y: number) => {
    if (text.trim()) {
      const newComment = { x, y, text: text.trim() };
      const updatedComments = [...scriptComments, newComment];
      setScriptComments(updatedComments);
      setActionHistory(prev => [...prev, { type: 'comment', value: newComment }]);
      setRedoHistory([]);
    }
    setActiveTextInput(null);
  };

  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    const lastAction = actionHistory[actionHistory.length - 1];
    if (lastAction.type === 'path') {
      setAllPaths(prev => prev.slice(0, -1));
    } else if (lastAction.type === 'comment') {
      setScriptComments(prev => prev.slice(0, -1));
    }
    setRedoHistory(prev => [...prev, lastAction]);
    setActionHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const nextAction = redoHistory[redoHistory.length - 1];
    if (nextAction.type === 'path') {
      setAllPaths(prev => [...prev, nextAction.value]);
    } else if (nextAction.type === 'comment') {
      setScriptComments(prev => [...prev, nextAction.value]);
    }
    setActionHistory(prev => [...prev, nextAction]);
    setRedoHistory(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const defaultScripts = [
          { id: 'SCR-101', studentName: 'Imtiaz Ahmed', roll: '37180701', subject: 'Chemistry [OW]', examName: 'Weekly Exam-03', status: 'Pending', submittedDate: '2026-07-03 18:24', maxMarks: 10, image: HandwrittenPaper },
          { id: 'SCR-102', studentName: 'Fahima Tabassum', roll: '37180702', subject: 'Physics [OW]', examName: 'Weekly Exam-03', status: 'Pending', submittedDate: '2026-07-03 19:10', maxMarks: 10, image: HandwrittenPaper },
          { id: 'SCR-103', studentName: 'Rafid Al-Hasan', roll: '37180703', subject: 'Higher Mathematics [TW]', examName: 'Daily Exam Chemistry-04', status: 'Pending', submittedDate: '2026-07-03 21:05', maxMarks: 10, image: HandwrittenPaper },
          { id: 'SCR-104', studentName: 'Sadia Rahman', roll: '37180704', subject: 'Biology [OW]', examName: 'Weekly Exam-03', status: 'Evaluated', marks: 8.5, maxMarks: 10, feedback: 'Excellent structural diagram drawing.', submittedDate: '2026-07-02 14:15' }
        ];

        const defaultReviews = [
          { id: 'REV-201', studentName: 'Tasnim Alam', roll: '37180715', subject: 'Physics [OW]', examName: 'Weekly Exam-02', originalMarks: 6.0, claimedMarks: 8.0, reason: '৩ নং প্রশ্নের উত্তরের পূর্ণমান দেওয়া হয়নি, দয়া করে আবার বিবেচনা করবেন।', status: 'Pending Student Claim', adminNote: 'Requested manual check for question 3', date: '2026-07-03 10:45' },
          { id: 'REV-202', studentName: 'Abrar Zahid', roll: '37180722', subject: 'Chemistry [TW]', examName: 'Daily Exam Chemistry-03', originalMarks: 4.5, claimedMarks: 7.0, reason: 'উত্তরের প্রথম অংশ সঠিক হওয়া সত্ত্বেও ভুল দেওয়া হয়েছে।', status: 'Pending Student Claim', adminNote: 'Check part A correctness', date: '2026-07-03 14:12' }
        ];

        const defaultPendingQuestions = [
          { id: 'Q-501', studentName: 'Mahir Faisal', subject: 'Chemistry [OW]', questionText: 'তড়িৎ রসায়ন অধ্যায়ে ফ্যারাডের ১ম সূত্রের গাণিতিক ব্যাখ্যায় Z এর মান বের করার সময় আধানের একক কুলম্ব নাকি ফ্যারাডে ব্যবহার করা যুক্তিযুক্ত?', submittedDate: '2026-07-03 17:15', isAnswered: false, answerText: '' },
          { id: 'Q-502', studentName: 'Nusrat Jahan', subject: 'Physics [TW]', questionText: 'পর্যায়বৃত্ত গতি অধ্যায়ে সরল দোলকের ক্ষেত্রে কৌণিক বিস্তার ৪ ডিগ্রির বেশি হলে কেন দোলনকাল সমীকরণ আর খাটে না? বিস্তারিত বুঝিয়ে দেবেন।', submittedDate: '2026-07-03 22:30', isAnswered: false, answerText: '' }
        ];

        const defaultCommunityPosts = [
          { id: 'POST-301', author: 'Dr. Rafiqul Islam', role: 'Senior Chemistry Instructor', content: 'প্রিয় শিক্ষক মন্ডলী, আগামী ৫ জুলাই আমাদের Chemistry [OW] বিষয়ের নতুন লেকচার শিট সরবরাহ করা হবে। সকলকে মূল্যায়নের সময় সংশোধিত সমাধান ফাইল অনুসরণের অনুরোধ রইলো।', likes: 14, comments: 3, date: '2026-07-03 12:00', hasLiked: false },
          { id: 'POST-302', author: 'Niaz Morshed', role: 'Mathematics Lead', content: 'Engineering Admission programs এর ৩ নং সেটের গণিত প্রশ্নপত্রে একটি প্রিন্টিং ত্রুটি পাওয়া গিয়েছে। দয়া করে সবাইকে ৩ নং প্রশ্নের উত্তর মূল্যায়নকালে বোনাস মার্কস (১.০০) দেওয়ার নির্দেশনা দেওয়া হলো।', likes: 25, comments: 7, date: '2026-07-03 15:30', hasLiked: true }
        ];

        // 1. Scripts
        const dbScripts = await dbGetItems('teacher_scripts');
        if (dbScripts.length === 0) {
          for (const s of defaultScripts) {
            await dbSaveItem('teacher_scripts', s.id, s);
          }
          setScripts(defaultScripts);
        } else {
          setScripts(dbScripts);
        }

        // 2. Reviews
        const dbReviews = await dbGetItems('teacher_reviews');
        if (dbReviews.length === 0) {
          for (const r of defaultReviews) {
            await dbSaveItem('teacher_reviews', r.id, r);
          }
          setReviews(defaultReviews);
        } else {
          setReviews(dbReviews);
        }

        // 3. Pending Questions
        const dbQuestions = await dbGetItems('teacher_pending_questions');
        if (dbQuestions.length === 0) {
          for (const q of defaultPendingQuestions) {
            await dbSaveItem('teacher_pending_questions', q.id, q);
          }
          setPendingQuestions(defaultPendingQuestions);
        } else {
          setPendingQuestions(dbQuestions);
        }

        // 4. Community Posts
        const dbPosts = await dbGetItems('teacher_community_posts');
        if (dbPosts.length === 0) {
          for (const p of defaultCommunityPosts) {
            await dbSaveItem('teacher_community_posts', p.id, p);
          }
          setCommunityPosts(defaultCommunityPosts);
        } else {
          const sortedPosts = [...dbPosts].sort((a, b) => b.id.localeCompare(a.id));
          setCommunityPosts(sortedPosts);
        }

        setIsDbLoaded(true);
      } catch (err) {
        console.error("Error loading TeacherPortal data from Firebase:", err);
      }
    }
    loadData();
  }, []);

  // Sync back to Firebase when states change
  useEffect(() => {
    if (!isDbLoaded) return;
    async function syncScripts() {
      try {
        const dbScripts = await dbGetItems('teacher_scripts');
        for (const dbS of dbScripts) {
          if (!scripts.some(s => s.id === dbS.id)) {
            await dbDeleteItem('teacher_scripts', dbS.id);
          }
        }
        for (const s of scripts) {
          await dbSaveItem('teacher_scripts', s.id, s);
        }
      } catch (error) {
        console.error("Error syncing teacher_scripts:", error);
      }
    }
    syncScripts();
  }, [scripts, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    async function syncReviews() {
      try {
        const dbReviews = await dbGetItems('teacher_reviews');
        for (const dbR of dbReviews) {
          if (!reviews.some(r => r.id === dbR.id)) {
            await dbDeleteItem('teacher_reviews', dbR.id);
          }
        }
        for (const r of reviews) {
          await dbSaveItem('teacher_reviews', r.id, r);
        }
      } catch (error) {
        console.error("Error syncing teacher_reviews:", error);
      }
    }
    syncReviews();
  }, [reviews, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    async function syncQuestions() {
      try {
        const dbQuestions = await dbGetItems('teacher_pending_questions');
        for (const dbQ of dbQuestions) {
          if (!pendingQuestions.some(q => q.id === dbQ.id)) {
            await dbDeleteItem('teacher_pending_questions', dbQ.id);
          }
        }
        for (const q of pendingQuestions) {
          await dbSaveItem('teacher_pending_questions', q.id, q);
        }
      } catch (error) {
        console.error("Error syncing teacher_pending_questions:", error);
      }
    }
    syncQuestions();
  }, [pendingQuestions, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    async function syncPosts() {
      try {
        const dbPosts = await dbGetItems('teacher_community_posts');
        for (const dbP of dbPosts) {
          if (!communityPosts.some(p => p.id === dbP.id)) {
            await dbDeleteItem('teacher_community_posts', dbP.id);
          }
        }
        for (const p of communityPosts) {
          await dbSaveItem('teacher_community_posts', p.id, p);
        }
      } catch (error) {
        console.error("Error syncing teacher_community_posts:", error);
      }
    }
    syncPosts();
  }, [communityPosts, isDbLoaded]);

  // Active Evaluator / Review Modal States
  const [evaluatingScript, setEvaluatingScript] = useState<any | null>(null);
  const [obtainedMarksInput, setObtainedMarksInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  
  const [reviewingItem, setReviewingItem] = useState<any | null>(null);
  const [reviewObtainedMarks, setReviewObtainedMarks] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');

  const [answeringQuestion, setAnsweringQuestion] = useState<any | null>(null);
  const [answerInput, setAnswerInput] = useState('');

  const [newPostText, setNewPostText] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch tab & Close dropdowns
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsScriptEvalOpen(false);
    setIsMyPaymentOpen(false);
    setIsQAOpen(false);
  };

  // Submit Grade
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obtainedMarksInput || isNaN(Number(obtainedMarksInput))) {
      showToast('অনুগ্রহ করে সঠিক প্রাপ্ত নম্বর প্রদান করুন।');
      return;
    }
    const marksNum = parseFloat(obtainedMarksInput);
    if (marksNum < 0 || marksNum > evaluatingScript.maxMarks) {
      showToast(`প্রাপ্ত নম্বর অবশ্যই ০ থেকে ${evaluatingScript.maxMarks} এর মধ্যে হতে হবে।`);
      return;
    }

    setScripts(prev => prev.map(s => s.id === evaluatingScript.id ? {
      ...s,
      status: 'Evaluated',
      marks: marksNum,
      feedback: feedbackInput
    } : s));

    showToast(`Script ${evaluatingScript.id} Evaluation Successful! Marks: ${marksNum}`);
    setEvaluatingScript(null);
    setObtainedMarksInput('');
    setFeedbackInput('');
  };

  // Submit Review Re-evaluation
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewObtainedMarks || isNaN(Number(reviewObtainedMarks))) {
      showToast('অনুগ্রহ করে সঠিক নম্বরটি লিখুন।');
      return;
    }
    const marksNum = parseFloat(reviewObtainedMarks);
    if (marksNum < 0 || marksNum > 10) {
      showToast('প্রাপ্ত নম্বর অবশ্যই ০ থেকে ১০ এর মধ্যে হতে হবে।');
      return;
    }

    setReviews(prev => prev.filter(r => r.id !== reviewingItem.id));
    showToast(`Review request ${reviewingItem.id} re-evaluation submitted successfully! Updated Marks: ${marksNum}`);
    setReviewingItem(null);
    setReviewObtainedMarks('');
    setReviewRemarks('');
  };

  // Submit Student or Admin Re-evaluation from Evaluation Tab
  const handleReviewModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedMarks || isNaN(Number(revisedMarks))) {
      showToast('অনুগ্রহ করে সঠিক প্রাপ্ত নম্বর প্রদান করুন।');
      return;
    }
    const marksNum = parseFloat(revisedMarks);
    if (marksNum < 0 || marksNum > 25) {
      showToast('প্রাপ্ত নম্বর অবশ্যই ০ থেকে ২৫ এর মধ্যে হতে হবে।');
      return;
    }

    if (reviewModalType === 'student') {
      const pendingStudents = studentReviewRequests.filter(req => req.status === 'Pending');
      const currentIndex = pendingStudents.findIndex(req => req.id === selectedReviewModal.id);

      setStudentReviewRequests(prev => prev.map(item => 
        item.id === selectedReviewModal.id ? { ...item, status: 'Resolved' } : item
      ));
      showToast(`Student Review ${selectedReviewModal.id} resolved! Revised Marks: ${marksNum}`);

      if (currentIndex !== -1 && currentIndex + 1 < pendingStudents.length) {
        const nextReq = pendingStudents[currentIndex + 1];
        setSelectedReviewModal(nextReq);
        setRevisedMarks(String(nextReq.originalMarks));
        setRevisedRemarks('');
      } else {
        setSelectedReviewModal(null);
        setRevisedMarks('');
        setRevisedRemarks('');
        showToast('All student review requests completed!');
      }
    } else {
      const pendingAdmins = adminForwardedRequests.filter(req => req.status === 'Pending Teacher Response' || req.status === 'In Progress');
      const currentIndex = pendingAdmins.findIndex(req => req.id === selectedReviewModal.id);

      if (setAdminForwardedRequests) {
        setAdminForwardedRequests(prev => prev.map(item => 
          item.id === selectedReviewModal.id ? { ...item, status: 'Resolved by Teacher', note: revisedRemarks || item.note } : item
        ));
      }
      showToast(`Admin Review Request ${selectedReviewModal.id} resolved! Revised Marks: ${marksNum}`);

      if (currentIndex !== -1 && currentIndex + 1 < pendingAdmins.length) {
        const nextReq = pendingAdmins[currentIndex + 1];
        setSelectedReviewModal(nextReq);
        setRevisedMarks(String(nextReq.originalMarks || nextReq.minMarks || '6'));
        setRevisedRemarks('');
      } else {
        setSelectedReviewModal(null);
        setRevisedMarks('');
        setRevisedRemarks('');
        showToast('All admin review requests completed!');
      }
    }
  };

  // Submit Question Answer
  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) {
      showToast('উত্তর ফাঁকা হতে পারে না!');
      return;
    }

    setPendingQuestions(prev => prev.map(q => q.id === answeringQuestion.id ? {
      ...q,
      isAnswered: true,
      answerText: answerInput
    } : q));

    showToast(`Question ${answeringQuestion.id} successfully answered!`);
    setAnsweringQuestion(null);
    setAnswerInput('');
  };

  // Submit New Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost = {
      id: `POST-${Math.floor(400 + Math.random() * 500)}`,
      author: 'A. H. M. Shakil',
      role: 'Core Teacher (You)',
      content: newPostText,
      likes: 0,
      comments: 0,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      hasLiked: false
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    setNewPostText('');
    showToast('Post created successfully!');
  };

  const handleLikePost = (id: string) => {
    setCommunityPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          hasLiked: !p.hasLiked,
          likes: p.hasLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  return (
    <div className="w-full flex flex-col bg-[#ebdff2] min-h-screen text-gray-800">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] bg-purple-900 text-white font-sans text-xs font-bold px-6 py-3.5 rounded-full shadow-xl flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner alert to easily switch back to main Admin Panel */}
      <div className="bg-gradient-to-r from-[#002d5b] to-[#124d8f] text-white px-4 py-2 flex items-center justify-between text-xs font-sans shadow-xs shrink-0">
        <div className="flex items-center space-x-2">
          <span className="bg-[#ff9800] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Demo Portal</span>
          <span>You are viewing the simulated <strong>Teacher Portal (উদ্ভাস শিক্ষক পোর্টাল)</strong> from the administration tab.</span>
        </div>
        {onBackToAdmin && (
          <button 
            onClick={onBackToAdmin}
            className="bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1 rounded transition-colors text-[11px] cursor-pointer"
          >
            Go Back to Admin Panel &rarr;
          </button>
        )}
      </div>

      {/* Header (Matching Second Image) */}
      <header className="bg-white border-b border-gray-200 shadow-xs px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        {/* Logo and Brand Title */}
        <div className="flex items-center space-x-3 select-none">
          {/* Udvash-Unmesh Flame Emblem */}
          <div className="flex items-center">
            <div className="w-10 h-10 border border-gray-300 rounded p-1 bg-white flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 100 100">
                {/* Visual representation of stylized Udvash Lotus/Flame */}
                <path d="M50 15 C 38 40, 20 60, 20 75 C 20 88, 32 95, 50 95 C 68 95, 80 88, 80 75 C 80 60, 62 40, 50 15 Z" fill="#7e22ce" />
                <path d="M50 35 C 43 50, 30 65, 30 75 C 30 83, 38 88, 50 88 C 62 88, 70 83, 70 75 C 70 65, 57 50, 50 35 Z" fill="#ff9800" />
                <path d="M50 55 C 46 65, 38 72, 38 78 C 38 82, 42 85, 50 85 C 58 85, 62 82, 62 78 C 62 72, 54 65, 50 55 Z" fill="#e11d48" />
              </svg>
            </div>
            <div className="ml-2">
              <h1 className="text-xl font-extrabold text-[#950000] tracking-tight font-sans leading-none">উদ্ভাস-উন্মেষ</h1>
              <span className="text-[12px] font-bold text-gray-700 font-sans tracking-wide">Online Care</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex flex-wrap items-center gap-1 text-[13px] font-bold text-gray-600 font-sans">
          
          {/* Routine Link */}
          <button 
            onClick={() => handleTabChange('routine')}
            className={`px-3 py-2 rounded-md transition-all ${activeTab === 'routine' ? 'bg-[#ff9800]/10 text-[#ff9800] border-b-2 border-[#ff9800]' : 'hover:bg-gray-100 hover:text-gray-900'}`}
          >
            Routine
          </button>

          {/* Script Evaluation Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsScriptEvalOpen(!isScriptEvalOpen);
                setIsMyPaymentOpen(false);
                setIsQAOpen(false);
              }}
              className={`px-3 py-2 rounded-md flex items-center gap-1 transition-all ${
                ['evaluation', 'review'].includes(activeTab) 
                  ? 'bg-purple-100 text-purple-900 border-b-2 border-purple-800' 
                  : 'hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>Script Evaluation</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isScriptEvalOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Box (Image 3 layout) */}
            {isScriptEvalOpen && (
              <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-[150] overflow-hidden">
                <button 
                  onClick={() => handleTabChange('evaluation')}
                  className={`w-full text-left px-4 py-2 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'evaluation' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Evaluation
                </button>
                <button 
                  onClick={() => handleTabChange('review')}
                  className={`w-full text-left px-4 py-2 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'review' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Review
                </button>
              </div>
            )}
          </div>

          {/* My Payment Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsMyPaymentOpen(!isMyPaymentOpen);
                setIsScriptEvalOpen(false);
                setIsQAOpen(false);
              }}
              className={`px-3 py-2 rounded-md flex items-center gap-1 transition-all ${
                ['due-amount', 'summary-report', 'class-payment', 'evaluation-payment', 'materials-payment', 'qa-payment'].includes(activeTab) 
                  ? 'bg-purple-100 text-purple-900 border-b-2 border-purple-800' 
                  : 'hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>My Payment</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMyPaymentOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Box (Image 4 layout) */}
            {isMyPaymentOpen && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-[150] overflow-hidden">
                <button 
                  onClick={() => handleTabChange('due-amount')}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'due-amount' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Due Amount
                </button>
                <button 
                  onClick={() => handleTabChange('summary-report')}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'summary-report' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Summary Report
                </button>
                <button 
                  onClick={() => handleTabChange('class-payment')}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'class-payment' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Class Payment Report
                </button>
                <button 
                  onClick={() => handleTabChange('evaluation-payment')}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'evaluation-payment' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Evaluation Payment Report
                </button>
                <button 
                  onClick={() => handleTabChange('materials-payment')}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'materials-payment' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Materials Payment Report
                </button>
                <button 
                  onClick={() => handleTabChange('qa-payment')}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'qa-payment' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Q&A Payment
                </button>
              </div>
            )}
          </div>

          {/* Class Performance */}
          <button 
            onClick={() => handleTabChange('class-performance')}
            className={`px-3 py-2 rounded-md transition-all ${activeTab === 'class-performance' ? 'bg-purple-100 text-purple-900 border-b-2 border-purple-800' : 'hover:bg-gray-100 hover:text-gray-900'}`}
          >
            Class Performance
          </button>

          {/* Question & Answer Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsQAOpen(!isQAOpen);
                setIsScriptEvalOpen(false);
                setIsMyPaymentOpen(false);
              }}
              className={`px-3 py-2 rounded-md flex items-center gap-1 transition-all ${
                ['pending-question', 'edit-answer'].includes(activeTab) 
                  ? 'bg-purple-100 text-purple-900 border-b-2 border-purple-800' 
                  : 'hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>Question & Answer</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQAOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Box (Image 5 layout) */}
            {isQAOpen && (
              <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-[150] overflow-hidden">
                <button 
                  onClick={() => handleTabChange('pending-question')}
                  className={`w-full text-left px-4 py-2 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'pending-question' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Pending Question
                </button>
                <button 
                  onClick={() => handleTabChange('edit-answer')}
                  className={`w-full text-left px-4 py-2 text-[12.5px] font-sans font-medium transition-colors ${activeTab === 'edit-answer' ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Edit Answer
                </button>
              </div>
            )}
          </div>

          {/* Community */}
          <button 
            onClick={() => handleTabChange('community')}
            className={`px-3 py-2 rounded-md transition-all ${activeTab === 'community' ? 'bg-purple-100 text-[#7e22ce] border-b-2 border-[#7e22ce]' : 'hover:bg-gray-100 hover:text-gray-900'}`}
          >
            Community
          </button>
        </nav>

        {/* User Profile */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          <div className="w-9 h-9 rounded-full bg-[#7e22ce] text-white flex items-center justify-center font-bold shadow-xs border border-purple-200">
            <User className="w-5 h-5" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-extrabold text-gray-800 leading-none">{currentUser?.name || currentUser?.id?.split('@')[0] || 'Teacher'}</p>
            <span className="text-[10px] text-gray-500 font-medium">Core Instructor</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 md:px-8 max-w-6xl w-full mx-auto">
        <AnimatePresence mode="wait">
          
          {/* 1. ROUTINE PAGE */}
          {activeTab === 'routine' && (
            <motion.div 
              key="routine"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Routine Header Banner */}
              <div className="bg-white rounded-lg shadow-sm border border-purple-100 p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-50 text-[#7e22ce] flex items-center justify-center mb-3 shadow-xs">
                  <FileText className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h2 className="text-xl font-bold font-sans tracking-wide text-purple-900 uppercase">My Routine</h2>
              </div>

              {/* Toggles and Select Selectors */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* UPCOMING & PAST Pill Control */}
                <div className="bg-[#b5a8c2] rounded-full p-1 flex items-center shadow-inner select-none shrink-0">
                  <button 
                    onClick={() => setRoutineType('upcoming')}
                    className={`px-6 py-2 rounded-full text-xs font-bold font-sans tracking-wide uppercase transition-all cursor-pointer ${
                      routineType === 'upcoming' 
                        ? 'bg-[#ff9800] text-white shadow-md' 
                        : 'text-purple-900/70 hover:text-purple-900'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button 
                    onClick={() => setRoutineType('past')}
                    className={`px-6 py-2 rounded-full text-xs font-bold font-sans tracking-wide uppercase transition-all cursor-pointer ${
                      routineType === 'past' 
                        ? 'bg-[#ff9800] text-white shadow-md' 
                        : 'text-purple-900/70 hover:text-purple-900'
                    }`}
                  >
                    Past
                  </button>
                </div>

                {/* Dropdowns */}
                <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <select 
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-4 py-2 text-xs font-bold font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent min-w-[150px] appearance-none cursor-pointer pr-8 shadow-xs"
                    >
                      <option>All Program</option>
                      <option>HSC All Service</option>
                      <option>Engineering Admission</option>
                      <option>Medical Admission</option>
                      <option>NDC & SJC All Service</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select 
                      value={selectedLecture}
                      onChange={(e) => setSelectedLecture(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-4 py-2 text-xs font-bold font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent min-w-[150px] appearance-none cursor-pointer pr-8 shadow-xs"
                    >
                      <option>All Lecture</option>
                      <option>C-01 Chemistry Intro</option>
                      <option>P-02 Physics Vector</option>
                      <option>M-03 Calculus Fundamentals</option>
                      <option>B-04 Cell Biology</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* No Data alert panel */}
              <div className="bg-[#fce4ec] border border-[#f8bbd0] text-[#c2185b] rounded-md p-4 text-center font-extrabold font-sans text-xs tracking-wider shadow-xs">
                NO DATA FOUND.
              </div>
            </motion.div>
          )}

          {/* 2. SCRIPT EVALUATION - EVALUATION LIST */}
          {activeTab === 'evaluation' && (
            <motion.div 
              key="evaluation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left w-full"
            >
              {/* 1. STUDENT REVIEW REQUEST */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-gray-200 py-3.5 text-center">
                  <h2 className="text-[14px] md:text-[15px] font-bold text-[#2d3748] font-sans tracking-wide">
                    Student's Review Request
                  </h2>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
                    <thead>
                      <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200 text-center font-sans">
                        <th className="border border-gray-200 px-3 py-3 w-[6%] font-bold">Sl.</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[12%] font-bold">Program</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[20%] font-bold">Course</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[28%] font-bold">[Code] Exam (Subject)</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Version</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Question</th>
                        <th className="border border-gray-200 px-3 py-3 w-[8%] font-bold">Requests</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-sans text-center">
                      {studentReviewRequests.filter(req => req.status === 'Pending').length === 0 ? (
                        <tr>
                          <td colSpan={8} className="border border-gray-200 px-3 py-6 text-gray-400 font-bold">
                            No student review requests at this moment.
                          </td>
                        </tr>
                      ) : (
                        studentReviewRequests.filter(req => req.status === 'Pending').map((req, idx) => (
                          <tr key={req.id} className="hover:bg-gray-50/50">
                            <td className="border border-gray-200 px-3 py-4 text-center">{idx + 1}</td>
                            <td className="border border-gray-200 px-3 py-4 text-left font-semibold text-gray-800">{req.program}</td>
                            <td className="border border-gray-200 px-3 py-4 text-left font-medium text-gray-600">{req.course}</td>
                            <td className="border border-gray-200 px-3 py-4 text-left font-medium text-gray-700">
                              <span className="text-gray-500 font-bold mr-1">[{req.examCode}]</span>
                              {req.exam}
                            </td>
                            <td className="border border-gray-200 px-3 py-4 text-center text-gray-600">{req.version}</td>
                            <td className="border border-gray-200 px-3 py-4 text-center font-mono font-semibold text-purple-700">{req.question}</td>
                            <td className="border border-gray-200 px-3 py-4 text-center font-bold text-[#e67e22]">{req.requests}</td>
                            <td className="border border-gray-200 px-3 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedReviewModal(req);
                                  setReviewModalType('student');
                                  setRevisedMarks(String(req.originalMarks));
                                  setRevisedRemarks('');
                                }}
                                className="bg-[#007bff] hover:bg-[#0069d9] text-white px-4 py-1.5 rounded font-sans text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer inline-flex items-center"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      {/* Total Footer Row */}
                      {studentReviewRequests.filter(req => req.status === 'Pending').length > 0 && (
                        <tr className="bg-white font-bold text-gray-800 text-[13px] border-t border-gray-300">
                          <td colSpan={6} className="border border-gray-200 px-3 py-3 text-right pr-4 font-extrabold">Total</td>
                          <td className="border border-gray-200 px-3 py-3 text-center text-[#e67e22] font-extrabold">
                            {studentReviewRequests.filter(req => req.status === 'Pending').reduce((sum, item) => sum + item.requests, 0)}
                          </td>
                          <td className="border border-gray-200 px-3 py-3"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. ADMIN REVIEW REQUEST */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-gray-200 py-3.5 text-center">
                  <h2 className="text-[14px] md:text-[15px] font-bold text-[#2d3748] font-sans tracking-wide">
                    Admin's Review Request
                  </h2>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
                    <thead>
                      <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200 text-center font-sans">
                        <th className="border border-gray-200 px-3 py-3 w-[6%] font-bold">Sl.</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[12%] font-bold">Program</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[20%] font-bold">Course</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[28%] font-bold">[Code] Exam (Subject)</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Version</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[16%] font-bold">Admin Note</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Unique Set and Question Serial</th>
                        <th className="border border-gray-200 px-3 py-3 w-[8%] font-bold">Requests</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-sans text-center">
                      {adminForwardedRequests.filter(req => req.status === 'Pending Teacher Response' || req.status === 'In Progress').length === 0 ? (
                        <tr>
                          <td colSpan={9} className="border border-gray-200 px-3 py-6 text-gray-400 font-bold">
                            No active admin forwarded requests at this moment.
                          </td>
                        </tr>
                      ) : (
                        adminForwardedRequests.filter(req => req.status === 'Pending Teacher Response' || req.status === 'In Progress').map((req, idx) => (
                          <tr key={req.id} className="hover:bg-gray-50/50">
                            <td className="border border-gray-200 px-3 py-4 text-center">{idx + 1}</td>
                            <td className="border border-gray-200 px-3 py-4 text-left font-semibold text-gray-800">{req.program || "CAP-2026"}</td>
                            <td className="border border-gray-200 px-3 py-4 text-left font-medium text-gray-600">{req.course}</td>
                            <td className="border border-gray-200 px-3 py-4 text-left font-medium text-gray-700">
                              <span className="text-gray-500 font-bold mr-1">[{req.id}]</span>
                              {req.exam} ({req.subject})
                            </td>
                            <td className="border border-gray-200 px-3 py-4 text-center text-gray-600">{req.version || "Bangla"}</td>
                            <td className="border border-gray-200 px-3 py-4 text-left text-purple-900 font-medium bg-purple-50/30 max-w-[200px] truncate" title={req.note}>
                              {req.note}
                            </td>
                            <td className="border border-gray-200 px-2.5 py-3 text-center text-purple-700 font-bold font-mono text-[11px]">
                              U{req.uniqueSet || '1'} - Q{req.questionSerial || '26'}
                            </td>
                            <td className="border border-gray-200 px-3 py-4 text-center font-bold text-[#e67e22]">{req.reviewCount || 1}</td>
                            <td className="border border-gray-200 px-3 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedReviewModal(req);
                                  setReviewModalType('admin');
                                  setRevisedMarks(String(req.originalMarks || req.minMarks || '6'));
                                  setRevisedRemarks('');
                                }}
                                className="bg-[#007bff] hover:bg-[#0069d9] text-white px-4 py-1.5 rounded font-sans text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer inline-flex items-center"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      {/* Total Footer Row */}
                      {adminForwardedRequests.filter(req => req.status === 'Pending Teacher Response' || req.status === 'In Progress').length > 0 && (
                        <tr className="bg-white font-bold text-gray-800 text-[13px] border-t border-gray-300">
                          <td colSpan={8} className="border border-gray-200 px-3 py-3 text-right pr-4 font-extrabold">Total</td>
                          <td className="border border-gray-200 px-3 py-3 text-center text-[#e67e22] font-extrabold">
                            {adminForwardedRequests.filter(req => req.status === 'Pending Teacher Response' || req.status === 'In Progress').reduce((sum, item) => sum + (item.reviewCount || 1), 0)}
                          </td>
                          <td className="border border-gray-200 px-3 py-3"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. NEW SCRIPT EVALUATION */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-gray-200 py-3.5 text-center">
                  <h2 className="text-[14px] md:text-[15px] font-bold text-[#2d3748] font-sans tracking-wide">
                    New Script Evaluation
                  </h2>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 text-xs text-gray-700">
                    <thead>
                      <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200 text-center font-sans">
                        <th className="border border-gray-200 px-3 py-3 w-[6%] font-bold">Sl.</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[18%] font-bold">Program</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[25%] font-bold">Course</th>
                        <th className="border border-gray-200 px-3 py-3 text-left w-[35%] font-bold">[Code] Exam Name</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Pending</th>
                        <th className="border border-gray-200 px-3 py-3 w-[10%] font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-sans text-center">
                      <tr className="bg-[#f4fbf7]">
                        <td colSpan={6} className="border border-gray-200 px-4 py-8 text-center text-[16px] font-extrabold text-[#28a745]">
                          No pending question found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. SCRIPT EVALUATION - REVIEW REQUESTS */}
          {activeTab === 'review' && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h2 className="text-base font-extrabold text-[#950000] font-sans">Script Re-Evaluation Reviews (ছাত্র রি-চেক অনুরোধ)</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 font-sans">ছাত্রদের মার্কিং সংক্রান্ত আপিলগুলোর সঠিক পর্যালোচনা করে মতামত দিন।</p>
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 font-medium font-sans">
                    কোন পেন্ডিং রিভিউ অনুরোধ নেই।
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(item => (
                      <div key={item.id} className="border border-purple-100 rounded-lg p-5 bg-[#fcf9ff] hover:shadow-xs transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="bg-purple-100 text-purple-900 text-[10.5px] font-mono font-extrabold px-2 py-0.5 rounded">
                                {item.id}
                              </span>
                              <h3 className="text-sm font-bold text-gray-800 font-sans">{item.studentName} (Roll: {item.roll})</h3>
                            </div>
                            <p className="text-xs text-gray-600 font-sans">
                              <strong>Subject:</strong> {item.subject} &bull; <strong>Exam:</strong> {item.examName}
                            </p>
                            <p className="text-xs text-gray-500 font-sans italic bg-white p-3 rounded border border-gray-100 mt-2">
                              " {item.reason} "
                            </p>
                            <div className="flex items-center space-x-4 text-xs font-sans text-gray-500 mt-2">
                              <span><strong>Original Marks:</strong> <span className="text-rose-600 font-bold">{item.originalMarks}</span></span>
                              <span><strong>Claimed Marks:</strong> <span className="text-green-600 font-bold">{item.claimedMarks}</span></span>
                              <span className="text-[10px] text-gray-400 font-mono">Date: {item.date}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setReviewingItem(item);
                              setReviewObtainedMarks(String(item.originalMarks));
                              setReviewRemarks('');
                            }}
                            className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded text-[11.5px] font-bold font-sans tracking-wide shadow-xs shrink-0 self-end md:self-start transition-colors cursor-pointer"
                          >
                            Re-Evaluate Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. MY PAYMENT - DUE AMOUNT */}
          {activeTab === 'due-amount' && (
            <motion.div 
              key="due-amount"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              {/* Payment Summary Table (Matches Screenshot) */}
              <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-[13px] font-sans">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700">
                      <th className="border border-gray-200 px-4 py-3 text-center font-bold w-1/4">Payment Type</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-bold w-1/4">Approved Amount</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-bold w-1/4">Pending Amount</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-bold w-1/4">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="bg-white">
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-medium bg-gray-50/30">Class Payment</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-medium bg-gray-50/30">Incentive Payment</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-medium bg-gray-50/30">Seniorship Payment</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-medium bg-gray-50/30">Evaluation Payment</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-bold text-gray-800">85</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-bold text-gray-800">70</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-bold text-gray-800">155</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-medium bg-gray-50/30">Materials Payment</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-bold text-gray-800">100</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-bold text-gray-800">100</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-gray-200 px-4 py-3.5 text-center font-medium bg-gray-50/30">Q&A Payment</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                      <td className="border border-gray-200 px-4 py-3.5 text-center">-</td>
                    </tr>
                    <tr className="bg-gray-100 font-extrabold text-gray-900">
                      <td className="border border-gray-200 px-4 py-3 text-center">Total</td>
                      <td className="border border-gray-200 px-4 py-3 text-center">85</td>
                      <td className="border border-gray-200 px-4 py-3 text-center">170</td>
                      <td className="border border-gray-200 px-4 py-3 text-center">255</td>
                    </tr>
                    <tr className="bg-white font-extrabold text-gray-900">
                      <td className="border border-gray-200 px-4 py-3 text-center">Payable Amount</td>
                      <td className="border border-gray-200 px-4 py-3 text-center">85</td>
                      <td colSpan={2} className="border border-gray-200 px-4 py-3 bg-gray-50/20"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 5. MY PAYMENT - SUMMARY REPORT */}
          {activeTab === 'summary-report' && (
            <motion.div 
              key="summary-report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-extrabold text-[#002d5b] border-b border-gray-100 pb-3 mb-4 font-sans">Payment Summary Report</h2>
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 font-sans">
                  <span className="text-4xl mb-2">📁</span>
                  <p className="text-sm font-semibold">No data available (কোনো তথ্য পাওয়া যায়নি)</p>
                  <p className="text-xs text-gray-400">Payment summary report is empty.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. MY PAYMENT - CLASS PAYMENT REPORT */}
          {activeTab === 'class-payment' && (
            <motion.div 
              key="class-payment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-extrabold text-[#002d5b] border-b border-gray-100 pb-3 mb-4 font-sans">Class Payment History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-sans">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Program</th>
                        <th className="px-4 py-3 text-left">Lecture Topic</th>
                        <th className="px-4 py-3 text-center">Duration</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400 font-sans">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-3xl mb-1">📁</span>
                            <p className="text-sm font-semibold">No data available (কোনো তথ্য পাওয়া যায়নি)</p>
                            <p className="text-xs text-gray-400">Class payment report is empty.</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7. MY PAYMENT - EVALUATION PAYMENT REPORT */}
          {activeTab === 'evaluation-payment' && (
            <motion.div 
              key="evaluation-payment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              {/* Filter Section (Matches Screenshot 3) */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                <div 
                  className="bg-gray-50/50 px-5 py-3 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                  onClick={() => setIsEvalFilterExpanded(!isEvalFilterExpanded)}
                >
                  <h2 className="text-sm font-extrabold text-gray-700 font-sans">Evaluation Payment</h2>
                  <button className="text-gray-500">
                    <Minus className={`w-4 h-4 transition-transform ${isEvalFilterExpanded ? '' : 'rotate-180'}`} />
                  </button>
                </div>
                
                {isEvalFilterExpanded && (
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-5xl mx-auto">
                      {/* Left Column */}
                      <div className="space-y-5">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">Program</label>
                          <select 
                            value={evalPaymentProgram}
                            onChange={(e) => setEvalPaymentProgram(e.target.value)}
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option>All Program</option>
                            <option>CAP 2026</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">Course</label>
                          <select 
                            value={evalPaymentCourse}
                            onChange={(e) => setEvalPaymentCourse(e.target.value)}
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option>All Course</option>
                            <option>NDC & SJC All Service</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">Exam Type</label>
                          <select 
                            value={evalPaymentExamType}
                            onChange={(e) => setEvalPaymentExamType(e.target.value)}
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option>All Exam Type</option>
                            <option>SAQ</option>
                            <option>MCQ</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">Start Date</label>
                          <input 
                            type="date"
                            value={evalPaymentStartDate}
                            onChange={(e) => setEvalPaymentStartDate(e.target.value)}
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50/50"
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-5">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">Session</label>
                          <select 
                            value={evalPaymentSession}
                            onChange={(e) => setEvalPaymentSession(e.target.value)}
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option>All Session</option>
                            <option>Morning</option>
                            <option>Evening</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">Exam</label>
                          <input 
                            type="text"
                            value={evalPaymentExam}
                            onChange={(e) => setEvalPaymentExam(e.target.value)}
                            placeholder="[Code] Exam Name"
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">Payment</label>
                          <select 
                            value={evalPaymentStatus}
                            onChange={(e) => setEvalPaymentStatus(e.target.value)}
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option>All Status</option>
                            <option>Paid</option>
                            <option>Due</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <label className="text-xs font-bold text-gray-700 text-right">End Date</label>
                          <input 
                            type="date"
                            value={evalPaymentEndDate}
                            onChange={(e) => setEvalPaymentEndDate(e.target.value)}
                            className="col-span-2 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center pt-2">
                      <button 
                        onClick={() => {
                          setIsEvalSearching(true);
                          // Mock search delay and results
                          setTimeout(() => {
                            setEvalSearchResults([
                              {
                                date: '18 Jul, 2026',
                                session: 'CAP 2026',
                                course: 'NDC & SJC All Service',
                                branch: 'Khilgaon Udvash',
                                exam: '[121] Daily Exam For NDC English-03-04',
                                qType: 'Normal',
                                evalType: 'Regular',
                                version: 'English',
                                examType: 'SAQ',
                                subject: 'English',
                                quantity: 7,
                                amount: 2.80,
                                base: 0.00,
                                extra: 0.00,
                                total: 3.00,
                                approvalStatus: 'Pending',
                                status: 'Due',
                                payDate: '-'
                              },
                              {
                                date: '18 Jul, 2026',
                                session: 'CAP 2026',
                                course: 'NDC & SJC All Service',
                                branch: 'Malibagh Udvash',
                                exam: '[121] Daily Exam For NDC English-03-04',
                                qType: 'Normal',
                                evalType: 'Regular',
                                version: 'English',
                                examType: 'SAQ',
                                subject: 'English',
                                quantity: 16,
                                amount: 6.40,
                                base: 0.00,
                                extra: 0.00,
                                total: 7.00,
                                approvalStatus: 'Pending',
                                status: 'Due',
                                payDate: '-'
                              },
                              {
                                date: '18 Jul, 2026',
                                session: 'CAP 2026',
                                course: 'NDC & SJC All Service',
                                branch: 'Savar Udvash',
                                exam: '[121] Daily Exam For NDC English-03-04',
                                qType: 'Normal',
                                evalType: 'Regular',
                                version: 'English',
                                examType: 'SAQ',
                                subject: 'English',
                                quantity: 11,
                                amount: 4.40,
                                base: 0.00,
                                extra: 0.00,
                                total: 5.00,
                                approvalStatus: 'Approved',
                                status: 'Due',
                                payDate: '-'
                              },
                              {
                                date: '18 Jul, 2026',
                                session: 'CAP 2026',
                                course: 'NDC & SJC All Service',
                                branch: 'Cumilla Udvash',
                                exam: '[121] Daily Exam For NDC English-03-04',
                                qType: 'Normal',
                                evalType: 'Regular',
                                version: 'English',
                                examType: 'SAQ',
                                subject: 'English',
                                quantity: 12,
                                amount: 4.80,
                                base: 0.00,
                                extra: 0.00,
                                total: 5.00,
                                approvalStatus: 'Pending',
                                status: 'Due',
                                payDate: '-'
                              }
                            ]);
                            setIsEvalSearching(false);
                          }, 600);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2 rounded text-xs transition-colors shadow-sm"
                      >
                        {isEvalSearching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Table Section (Matches Screenshot 1 & 2) */}
              {evalSearchResults.length > 0 && (
                <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-sans border-collapse">
                      <thead>
                        <tr className="bg-white text-gray-700 border-b border-gray-200">
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Evaluation Date</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Program Session</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Course</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Branch</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">[Code] Exam</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Script Question Type</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Evaluation Type</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Script Version</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Exam Type</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Subject</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Total Quantity</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Evaluation Amount</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Base Amount</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Extra Amount</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Total Amount</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Approval Status</th>
                          <th className="px-3 py-4 font-bold border-r border-gray-100 text-center">Payment Status</th>
                          <th className="px-3 py-4 font-bold text-center">Payment Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {evalSearchResults.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.date}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.session}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.course}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.branch}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.exam}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.qType}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.evalType}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.version}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.examType}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600">{row.subject}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600 font-medium">{row.quantity}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600 font-medium">{row.amount.toFixed(2)}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600 font-medium">{row.base.toFixed(2)}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600 font-medium">{row.extra.toFixed(2)}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100 text-gray-600 font-bold">{row.total.toFixed(2)}</td>
                            <td className="px-3 py-4 text-center border-r border-gray-100">
                              <span className={`font-bold ${row.approvalStatus === 'Approved' ? 'text-green-600' : 'text-orange-500'}`}>{row.approvalStatus}</span>
                            </td>
                            <td className="px-3 py-4 text-center border-r border-gray-100">
                              <span className={`font-bold ${row.status === 'Paid' ? 'text-green-600' : 'text-gray-600'}`}>{row.status}</span>
                            </td>
                            <td className="px-3 py-4 text-center text-gray-600">{row.payDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}


          {/* 8. MY PAYMENT - MATERIALS PAYMENT REPORT */}
          {activeTab === 'materials-payment' && (
            <motion.div 
              key="materials-payment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-extrabold text-[#002d5b] border-b border-gray-100 pb-3 mb-4 font-sans">Materials Preparation Earnings</h2>
                <p className="text-xs text-gray-400 font-sans mb-4">প্রশ্নপত্র তৈরি, উত্তরপত্র ব্যাখ্যা ফাইল এবং অতিরিক্ত শিক্ষা উপকরণ রচনার জন্য রয়্যালটি ও সম্মানী।</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-sans">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Material Type</th>
                        <th className="px-4 py-3 text-left">Target Subject / Exam</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-gray-400 font-sans">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-3xl mb-1">📁</span>
                            <p className="text-sm font-semibold">No data available (কোনো তথ্য পাওয়া যায়নি)</p>
                            <p className="text-xs text-gray-400">Materials payment report is empty.</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 9. MY PAYMENT - QA PAYMENT */}
          {activeTab === 'qa-payment' && (
            <motion.div 
              key="qa-payment"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-extrabold text-[#002d5b] border-b border-gray-100 pb-3 mb-4 font-sans">Q&A Desk Response Payments</h2>
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 font-sans">
                  <span className="text-4xl mb-2">📁</span>
                  <p className="text-sm font-semibold">No data available (কোনো তথ্য পাওয়া যায়নি)</p>
                  <p className="text-xs text-gray-400">Q&A response payment data is empty.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 10. CLASS PERFORMANCE */}
          {activeTab === 'class-performance' && (
            <motion.div 
              key="class-performance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-xs text-center">
                  <span className="text-[11px] font-bold text-gray-400 block uppercase font-sans">Teacher Rating</span>
                  <div className="text-3xl font-black text-[#ff9800] mt-2 flex items-center justify-center gap-1 font-mono">
                    4.92
                    <Star className="w-6 h-6 fill-[#ff9800] text-[#ff9800]" />
                  </div>
                  <span className="text-[10px] text-gray-500 font-sans block mt-1.5">Based on 342 student evaluations</span>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-xs text-center">
                  <span className="text-[11px] font-bold text-gray-400 block uppercase font-sans">Total Lectures Taken</span>
                  <div className="text-3xl font-black text-[#002d5b] mt-2 font-mono">
                    ৮৪ টি
                  </div>
                  <span className="text-[10px] text-gray-500 font-sans block mt-1.5">Across 4 separate subjects</span>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-xs text-center">
                  <span className="text-[11px] font-bold text-gray-400 block uppercase font-sans">Class Active Rate</span>
                  <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">
                    96.5%
                  </div>
                  <span className="text-[10px] text-gray-500 font-sans block mt-1.5">Student positive feedback score</span>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-xs text-center">
                  <span className="text-[11px] font-bold text-gray-400 block uppercase font-sans">Student Doubts Solved</span>
                  <div className="text-3xl font-black text-purple-700 mt-2 font-mono">
                    ১৮৬ টি
                  </div>
                  <span className="text-[10px] text-gray-500 font-sans block mt-1.5">Fast-track response rate: 94%</span>
                </div>
              </div>

              {/* Student comments */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-[#002d5b] border-b border-gray-100 pb-3 mb-4 font-sans">Recent Student Testimonials & Feedback</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#faf9fc] rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#002d5b] font-sans">Engineering Chemistry Learner</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-sans">"ভাইয়ার জটিল সমীকরণগুলোকে সহজ উদাহরণ দিয়ে বুঝিয়ে দেওয়ার স্টাইলটা চমৎকার! বিশেষ করে তড়িৎ রসায়নের Z এর মানের অংকগুলো এখন একদম ক্লিয়ার।"</p>
                  </div>

                  <div className="p-4 bg-[#faf9fc] rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#002d5b] font-sans">Weekly test examinee (Physics)</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                        <Star className="w-3 h-3 fill-amber-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-sans">"আমার খাতায় ভুল চিহ্নিত করার সাথে সুন্দরভাবে সঠিক রেফারেন্সটা লিখে দিয়েছেন। অনেক উপকৃত হয়েছি!"</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 11. QUESTION & ANSWER - PENDING QUESTION */}
          {activeTab === 'pending-question' && (
            <motion.div 
              key="pending-question"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="border-b border-gray-100 pb-3 mb-4">
                  <h2 className="text-base font-extrabold text-[#002d5b] font-sans">Student Pending Doubts & Questions</h2>
                  <p className="text-xs text-gray-500 font-medium font-sans">প্রশ্নগুলোর সহজ ও সঠিক সমাধান প্রদান করে ছাত্রদের সাহায্য করুন।</p>
                </div>

                {pendingQuestions.filter(q => !q.isAnswered).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 font-medium font-sans">
                    সব প্রশ্নের উত্তর দেওয়া হয়েছে! অসাধারণ!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingQuestions.filter(q => !q.isAnswered).map(q => (
                      <div key={q.id} className="border border-purple-100 rounded-lg p-5 bg-[#faf8ff] hover:shadow-2xs transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-purple-100 text-purple-950 font-mono font-bold text-[10.5px] px-2 py-0.5 rounded">
                            {q.id} &bull; {q.subject}
                          </span>
                          <span className="text-[10.5px] text-gray-400 font-mono">{q.submittedDate}</span>
                        </div>
                        <p className="text-[13px] text-gray-800 font-sans font-medium bg-white p-4 rounded border border-gray-200 leading-relaxed mb-4 shadow-3xs">
                          {q.questionText}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Student: <strong>{q.studentName}</strong></span>
                          <button 
                            onClick={() => {
                              setAnsweringQuestion(q);
                              setAnswerInput('');
                            }}
                            className="bg-[#7e22ce] hover:bg-[#6b1cb2] text-white font-bold px-4 py-2 rounded text-xs tracking-wide shadow-xs transition-colors cursor-pointer"
                          >
                            Answer Question
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 12. QUESTION & ANSWER - EDIT ANSWER */}
          {activeTab === 'edit-answer' && (
            <motion.div 
              key="edit-answer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="border-b border-gray-100 pb-3 mb-4">
                  <h2 className="text-base font-extrabold text-[#002d5b] font-sans">Edit / Review Submitted Answers</h2>
                  <p className="text-xs text-gray-500 font-medium font-sans">আপনার ইতিমধ্যে প্রদানকৃত উত্তরগুলোতে কোনো সংযোজন-বিয়োজন বা পরিমার্জন থাকলে এডিট করুন।</p>
                </div>

                {pendingQuestions.filter(q => q.isAnswered).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 font-medium font-sans">
                    এখনো কোনো উত্তর প্রদান করা হয়নি।
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingQuestions.filter(q => q.isAnswered).map(q => (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-2xs">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                          <span className="bg-gray-100 text-gray-800 font-mono font-bold text-[10.5px] px-2 py-0.5 rounded">
                            {q.id} &bull; {q.subject}
                          </span>
                          <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Answered
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="text-xs">
                            <span className="font-bold text-gray-400 block mb-1 uppercase tracking-wide">Question</span>
                            <p className="text-gray-700 bg-gray-50/50 p-3 rounded italic">{q.questionText}</p>
                          </div>
                          
                          <div className="text-xs">
                            <span className="font-bold text-purple-400 block mb-1 uppercase tracking-wide">Your Solution</span>
                            <p className="text-gray-800 bg-purple-50/20 p-3 rounded border border-purple-50 font-sans leading-relaxed">{q.answerText}</p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button 
                            onClick={() => {
                              setAnsweringQuestion(q);
                              setAnswerInput(q.answerText);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit Response
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 13. COMMUNITY TAB */}
          {activeTab === 'community' && (
            <motion.div 
              key="community"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 text-left"
            >
              {/* Write Post Box */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-[#7e22ce] mb-3 font-sans">Teacher Community Discussion Board</h2>
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <textarea 
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="উদ্ভাস-উন্মেষ শিক্ষক ফোরামে কিছু শেয়ার করুন... (যেমন: পরীক্ষা সংক্রান্ত নোটিস, সলভ সংক্রান্ত ডাউট ইত্যাদি)"
                    className="w-full min-h-[80px] border border-gray-200 rounded-md p-3 text-xs font-sans text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                  />
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={!newPostText.trim()}
                      className="bg-[#7e22ce] hover:bg-[#6b1cb2] disabled:opacity-40 text-white font-bold text-xs px-6 py-2 rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Announcement
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed List */}
              <div className="space-y-4">
                {communityPosts.map(post => (
                  <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-[#7e22ce] flex items-center justify-center font-bold text-sm border border-purple-100">
                          {post.author[0]}
                        </div>
                        <div>
                          <strong className="text-xs text-gray-800 block leading-tight">{post.author}</strong>
                          <span className="text-[10px] text-gray-500 font-medium font-sans block">{post.role}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{post.date}</span>
                    </div>

                    <p className="text-xs text-gray-700 font-sans leading-relaxed whitespace-pre-wrap mb-4">
                      {post.content}
                    </p>

                    <div className="flex items-center space-x-6 text-xs text-gray-500 border-t border-gray-100 pt-3">
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center space-x-1.5 font-sans font-bold cursor-pointer transition-colors ${
                          post.hasLiked ? 'text-purple-600' : 'hover:text-gray-800'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-purple-100' : ''}`} />
                        <span>{post.likes} Likes</span>
                      </button>
                      <span className="font-sans font-bold">
                        {post.comments} Comments
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Block (Directly matching Bengali style from the second picture!) */}
      <footer className="bg-[#48285e] text-purple-100 mt-12 border-t-4 border-[#ff9800] py-12 px-6 md:px-12 text-left text-xs tracking-wide shrink-0 font-sans">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Section 1 - Bengali slogan & Logo representation */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-white italic font-sans">"সম্পর্ক হোক সহযোগিতার...."</p>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center p-1 border border-white/20">
                <svg className="w-6 h-6" viewBox="0 0 100 100">
                  <path d="M50 15 C 38 40, 20 60, 20 75 C 20 88, 32 95, 50 95 C 68 95, 80 88, 80 75 C 80 60, 62 40, 50 15 Z" fill="#ffffff" />
                  <path d="M50 35 C 43 50, 30 65, 30 75 C 30 83, 38 88, 50 88 C 62 88, 70 83, 70 75 C 70 65, 57 50, 50 35 Z" fill="#ff9800" />
                </svg>
              </div>
              <div>
                <strong className="text-white text-base block font-sans">উদ্ভাস-উন্মেষ</strong>
                <span className="text-[10px] text-purple-200 block font-sans tracking-widest uppercase">Online Care</span>
              </div>
            </div>
          </div>

          {/* Section 2 - Help Menu Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-white/10 pb-1.5">Help</h4>
            <ul className="space-y-1.5 text-purple-200">
              <li><button onClick={() => showToast('About Us Information')} className="hover:text-white transition-colors cursor-pointer text-left">About Us</button></li>
              <li><button onClick={() => showToast('Privacy Policy Information')} className="hover:text-white transition-colors cursor-pointer text-left">Privacy Policy</button></li>
              <li><button onClick={() => showToast('Terms & Conditions')} className="hover:text-white transition-colors cursor-pointer text-left">Terms & Conditions</button></li>
              <li><button onClick={() => showToast('Frequently Asked Questions')} className="hover:text-white transition-colors cursor-pointer text-left">FAQs</button></li>
              <li><button onClick={() => showToast('Contact Our Help Desk')} className="hover:text-white transition-colors cursor-pointer text-left">Contact Us</button></li>
            </ul>
          </div>

          {/* Section 3 - Explore links */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-white/10 pb-1.5">Explore</h4>
            <ul className="space-y-1.5 text-purple-200">
              <li><a href="https://udvash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Udvash</a></li>
              <li><a href="https://unmesh.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Unmesh</a></li>
            </ul>
          </div>

          {/* Section 4 - Contact Details & Social */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-white tracking-wider uppercase border-b border-white/10 pb-1.5">Get in Touch</h4>
            <p className="text-purple-200 leading-relaxed text-[11px]">
              Address: Hossain Tower (5th Floor), 75, Green Road, Farmgate; Sher-e-Bangla Nagar PS; Dhaka-1205.
            </p>
            <div className="pt-1.5">
              <span className="block text-white font-bold">Helpline: 09666775566</span>
              <span className="block text-purple-200">Email: info@udvash-unmesh.com</span>
            </div>
            
            {/* Social media icons container */}
            <div className="flex items-center space-x-3 pt-3">
              <button onClick={() => showToast('Opening Udvash YouTube channel')} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#ff9800] transition-all cursor-pointer">
                <span className="font-extrabold text-[10px] tracking-tighter">YT</span>
              </button>
              <button onClick={() => showToast('Opening Udvash Instagram Profile')} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#ff9800] transition-all cursor-pointer">
                <span className="font-extrabold text-[10px] tracking-tighter">IG</span>
              </button>
              <button onClick={() => showToast('Opening Udvash LinkedIn Corporate Page')} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#ff9800] transition-all cursor-pointer">
                <span className="font-extrabold text-[10px] tracking-tighter">LN</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="max-w-6xl mx-auto border-t border-white/10 mt-10 pt-6 text-center text-[10.5px] text-purple-300 font-mono">
          Copyright © Udvash-Unmesh Online Care. All rights reserved. 2026 | P-1 | V-line-teacher-portal-5fcbf8b645-p9q74.222
        </div>
      </footer>


      {/* EVALUATING SCRIPT MODAL DIALOG */}
      <AnimatePresence>
        {evaluatingScript && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-xs text-left">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#002d5b] text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold font-sans">Answer Script Grading: {evaluatingScript.id}</h3>
                  <span className="text-[10px] text-gray-300 font-mono block">Student: {evaluatingScript.studentName} &bull; Roll: {evaluatingScript.roll}</span>
                </div>
                <button 
                  onClick={() => setEvaluatingScript(null)}
                  className="text-white/80 hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Simulated Image Box for student answer script */}
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold text-gray-400 block uppercase">Student Answer Sheet Image</span>
                  <div className="border border-gray-200 rounded bg-gray-50 p-2 flex items-center justify-center">
                    <img 
                      src={evaluatingScript.image} 
                      alt="Answer sheet" 
                      className="max-h-[220px] rounded object-contain shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 text-center block mt-1">Simulated preview. In production, this renders the uploaded high-res canvas markup.</span>
                </div>

                <form onSubmit={handleGradeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Obtained Marks (প্রাপ্ত নম্বর)</label>
                      <input 
                        type="text" 
                        required
                        value={obtainedMarksInput}
                        onChange={(e) => setObtainedMarksInput(e.target.value)}
                        placeholder={`Max marks: ${evaluatingScript.maxMarks}`}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 block">Maximum Allowed Marks</label>
                      <input 
                        type="text" 
                        disabled
                        value={`${evaluatingScript.maxMarks}.00`}
                        className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Feedback / Remarks (মন্তব্য)</label>
                    <textarea 
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="এখানে ছাত্রের জন্য আপনার ফিডব্যাক লিখুন (যেমন: হাতের লেখা বা সূত্রের ভুল ইত্যাদি)"
                      className="w-full min-h-[70px] border border-gray-300 rounded p-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setEvaluatingScript(null)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      Submit Grading
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* RE-EVALUATION / REVIEW MODAL DIALOG */}
      <AnimatePresence>
        {reviewingItem && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-xs text-left">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="bg-[#950000] text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold font-sans">Appeal Re-check: {reviewingItem.id}</h3>
                  <span className="text-[10px] text-gray-200 font-mono block">Reviewing evaluation originally graded as {reviewingItem.originalMarks}</span>
                </div>
                <button 
                  onClick={() => setReviewingItem(null)}
                  className="text-white/80 hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 leading-relaxed">
                  <strong>Student Appeal Reason:</strong>
                  <p className="mt-1 font-medium italic">" {reviewingItem.reason} "</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Original Grade</label>
                    <div className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded px-3 py-2 text-xs font-mono font-bold">
                      {reviewingItem.originalMarks} / 10
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Updated Marks</label>
                    <input 
                      type="text" 
                      required
                      value={reviewObtainedMarks}
                      onChange={(e) => setReviewObtainedMarks(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Re-evaluation Remarks (মন্তব্য)</label>
                  <textarea 
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    required
                    placeholder="নম্বর পরিবর্তনের কারণ ব্যাখ্যা করুন... (যেমন: ৩ নং উত্তর পুনরায় বিবেচনা করে ২.০০ যোগ করা হলো)"
                    className="w-full min-h-[60px] border border-gray-300 rounded p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setReviewingItem(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    type="submit"
                    className="bg-[#950000] hover:bg-[#800000] text-white font-bold px-6 py-2 rounded text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Confirm Re-evaluation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ANSWERING QUESTION MODAL DIALOG */}
      <AnimatePresence>
        {answeringQuestion && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-xs text-left">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="bg-purple-900 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold font-sans">Solve Student Query: {answeringQuestion.id}</h3>
                  <span className="text-[10px] text-purple-200 font-mono block">Student: {answeringQuestion.studentName} &bull; Subject: {answeringQuestion.subject}</span>
                </div>
                <button 
                  onClick={() => setAnsweringQuestion(null)}
                  className="text-white/80 hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAnswerSubmit} className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded border border-gray-200 text-[12.5px] text-gray-700 leading-relaxed font-medium font-sans">
                  <strong>Student Doubt:</strong>
                  <p className="mt-1 italic">" {answeringQuestion.questionText} "</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-900 block font-sans">Your Detailed Solution / Explanation (আপনার সমাধান)</label>
                  <textarea 
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    required
                    placeholder="এখানে বিশদ সমাধান ও প্রয়োজনীয় সূত্রের ব্যাখ্যা দিন..."
                    className="w-full min-h-[120px] border border-gray-300 rounded p-3 text-xs font-sans text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setAnsweringQuestion(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-[#7e22ce] hover:bg-[#6b1cb2] text-white font-bold px-6 py-2 rounded text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Submit Solution
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EVALUATION TAB - GENERAL STUDENT/ADMIN REVIEW MODAL */}
      <AnimatePresence>
        {selectedReviewModal && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-xs text-left">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="bg-[#007bff] text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold font-sans">
                    {reviewModalType === 'student' ? "Student's Review Request" : "Admin's Review Request"}
                  </h3>
                  <span className="text-[10.5px] text-blue-100 font-mono block">
                    ID: {selectedReviewModal.id} &bull; {selectedReviewModal.exam}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedReviewModal(null)}
                  className="text-white hover:text-gray-100 font-bold cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[85vh]">
                <form onSubmit={handleReviewModalSubmit} className="space-y-5">
                  {/* Question Info Section (Matches Screenshots exactly) */}
                  <div className="bg-white border-b-2 border-gray-100 pb-4 flex justify-between items-center text-sm font-bold text-gray-800">
                    <span className="font-sans">Question : Unique Set: {selectedReviewModal.uniqueSet || '1'}, Question Serial: {selectedReviewModal.questionSerial || '4'}</span>
                    <span className="font-sans">Full Marks : {Number(selectedReviewModal.maxMarks || 1).toFixed(2)}</span>
                  </div>
                  
                  {/* Question Text */}
                  <div className="text-[15px] font-bold text-gray-900 font-sans leading-relaxed px-2">
                    {selectedReviewModal.question || 'স্থির বিদ্যুতের পরীক্ষাগুলো কোন ঋতুতে সবচেয়ে ভালো কাজ করে?'}
                  </div>

                  {/* Sample Answer Box */}
                  <div className="bg-[#dcedc8] p-4 relative text-sm text-gray-900 font-medium">
                    <div className="absolute top-2 right-2">
                      <button type="button" className="bg-[#1976d2] text-white px-3 py-1 rounded text-xs font-bold shadow-md hover:bg-[#1565c0]">
                        Sample Answer
                      </button>
                    </div>
                    <p className="mb-1">শীতকালে।</p>
                    <p className="font-bold">নম্বর বণ্টন:</p>
                    <p>শীতকালে; লেখার জন্য ০১ নম্বর।</p>
                  </div>

                  {/* Student Doubt / Admin Note */}
                  <div className={`p-4 rounded-lg border ${reviewModalType === 'student' ? 'bg-blue-50 border-blue-100' : 'bg-purple-50 border-purple-100'}`}>
                    <strong className={`block mb-1 text-xs ${reviewModalType === 'student' ? 'text-blue-900' : 'text-purple-900'}`}>
                      {reviewModalType === 'student' ? "Student's Doubt (শিক্ষার্থীর প্রশ্ন):" : "Admin Note (অ্যাডমিনের নির্দেশনা):"}
                    </strong>
                    <p className={`text-xs p-2.5 rounded bg-white ${reviewModalType === 'student' ? 'text-blue-800' : 'text-purple-800'}`}>
                      "{reviewModalType === 'student' ? selectedReviewModal.doubtText : selectedReviewModal.note}"
                    </p>
                  </div>

                  {/* Script Annotation Area */}
                  <div className="border border-gray-200 rounded-sm bg-gray-50 flex flex-col items-center justify-center mt-6">
                    {/* Toolbar */}
                    <div className="w-full flex justify-center items-center gap-4 py-2 border-b border-gray-200 bg-[#f5f5f5]">
                      <button type="button" onClick={() => setActiveDrawingTool('pencil')} className={`p-2 rounded ${activeDrawingTool === 'pencil' ? 'bg-gray-300' : 'hover:bg-gray-200'} transition-all`} title="Pencil">
                        <Pencil className="w-6 h-6 text-red-600 fill-red-600" />
                      </button>
                      <button type="button" onClick={() => setActiveDrawingTool('text')} className={`p-2 rounded ${activeDrawingTool === 'text' ? 'bg-gray-300' : 'hover:bg-gray-200'} transition-all text-red-600 font-serif font-bold text-xl leading-none`} title="Text">
                        T
                      </button>
                      <button type="button" onClick={handleUndo} disabled={actionHistory.length === 0} className="p-2 rounded hover:bg-gray-200 transition-all text-gray-500 disabled:opacity-40" title="Undo">
                        <Undo2 className="w-6 h-6" />
                      </button>
                      <button type="button" onClick={handleRedo} disabled={redoHistory.length === 0} className="p-2 rounded hover:bg-gray-200 transition-all text-gray-500 disabled:opacity-40" title="Redo">
                        <Redo2 className="w-6 h-6" />
                      </button>
                      <button type="button" onClick={() => setActiveDrawingTool('eraser')} className={`p-2 rounded ${activeDrawingTool === 'eraser' ? 'bg-gray-300' : 'hover:bg-gray-200'} transition-all text-gray-700`} title="Eraser">
                        <Eraser className="w-6 h-6" />
                      </button>
                      <button type="button" onClick={() => setStudentPaperRotate(prev => (prev + 90) % 360)} className="p-2 rounded hover:bg-gray-200 transition-all text-gray-700" title="Rotate">
                        <RotateCcw className="w-6 h-6" />
                      </button>
                      <button type="button" onClick={() => setExtraBottomSpace(prev => prev + 48)} className="p-2 rounded hover:bg-gray-200 transition-all text-gray-700" title="Add Page Space">
                        <Plus className="w-7 h-7 stroke-[3]" />
                      </button>
                      <button type="button" onClick={() => setExtraBottomSpace(prev => Math.max(0, prev - 48))} className="p-2 rounded hover:bg-gray-200 transition-all text-gray-700" title="Remove Page Space">
                        <Minus className="w-8 h-8 stroke-[4]" />
                      </button>
                    </div>

                    {/* Canvas Area */}
                    <div className="p-4 w-full flex justify-center bg-gray-50 overflow-hidden">
                      <div 
                        onClick={handleImageClick}
                        className="relative border-2 border-dashed border-gray-400 bg-white"
                        style={{
                          transform: `rotate(${studentPaperRotate}deg) scale(${imageScale})`,
                          transformOrigin: 'center center',
                          width: '100%',
                          maxWidth: '700px'
                        }}
                      >
                        <div className="w-full flex flex-col pointer-events-none select-none">
                          <img 
                            src={HandwrittenPaper} 
                            alt="Student Answer" 
                            className="w-full h-auto object-contain block opacity-85"
                          />
                          {/* Extra white page space at the bottom */}
                          <div style={{ height: `${extraBottomSpace}px` }} className="w-full bg-white transition-all"></div>
                        </div>

                        {/* Drawing Canvas Overlay */}
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-auto"
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={handleCanvasMouseLeave}
                          style={{
                            cursor: activeDrawingTool === 'pencil' ? 'crosshair' : activeDrawingTool === 'text' ? 'text' : activeDrawingTool === 'eraser' ? 'cell' : 'default',
                            zIndex: 10
                          }}
                        >
                          {allPaths.map((pathStr, index) => (
                            <path
                              key={index}
                              d={pathStr}
                              stroke="red"
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ))}
                          {isDrawing && currentPath && (
                            <path
                              d={currentPath}
                              stroke="red"
                              strokeWidth="3"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>

                        {/* Text Comments Overlay */}
                        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
                          {scriptComments.map((comment, index) => (
                            <div
                              key={index}
                              className="absolute bg-white px-2 py-1 rounded shadow-md text-red-600 font-bold text-sm"
                              style={{
                                left: `${comment.x}%`,
                                top: `${comment.y}%`,
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'auto'
                              }}
                            >
                              {comment.text}
                            </div>
                          ))}

                          {/* Active Text Input */}
                          {activeTextInput && (
                            <div
                              className="absolute pointer-events-auto"
                              style={{
                                left: `${activeTextInput.x}%`,
                                top: `${activeTextInput.y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <input
                                type="text"
                                autoFocus
                                placeholder="Type..."
                                className="px-2 py-1 bg-white border border-red-500 rounded shadow-md text-sm text-red-600 font-bold outline-none ring-2 ring-red-500/30"
                                onBlur={(e) => handleTextInputSubmit(e.target.value, activeTextInput.x, activeTextInput.y)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleTextInputSubmit(e.currentTarget.value, activeTextInput.x, activeTextInput.y);
                                  if (e.key === 'Escape') setActiveTextInput(null);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-center py-2 text-gray-500 text-sm font-medium border-t border-gray-200">
                      1/1
                    </div>
                  </div>

                  {/* Student Details Footer (Matches Screenshots exactly) */}
                  <div className="flex justify-between items-end border-t border-gray-200 pt-4 mt-2">
                    <div className="text-[13px] text-gray-700 space-y-1 font-sans">
                      <p>Roll No : {selectedReviewModal.roll || '20218901050'}</p>
                      <p>Registration No : {selectedReviewModal.regNo || '4869621'}</p>
                      <p>Examiner : [21192] {currentUser?.name || currentUser?.id?.split('@')[0] || 'Teacher'} | EvaluationTime : 2026-07-18 07:56 PM</p>
                    </div>
                    <button type="button" className="bg-[#4285f4] hover:bg-[#3367d6] text-white px-6 py-2 rounded shadow-sm text-sm font-medium transition-colors">
                      Image log
                    </button>
                  </div>

                  {/* Grading Layout matching Screenshot exactly */}
                  <div className="flex items-center gap-2 py-4 border-t border-gray-200 font-sans text-sm font-bold text-gray-800">
                    <span className="text-gray-900 font-bold text-sm md:text-base">Obtained:</span>
                    <input 
                      type="text" 
                      required
                      value={revisedMarks}
                      onChange={(e) => setRevisedMarks(e.target.value)}
                      className="w-20 bg-[#9dfd9d] border border-gray-700 rounded-md px-2 py-1.5 text-center font-bold text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 font-mono"
                    />
                    <span className="text-gray-800 font-bold text-sm md:text-base">/ {Number(selectedReviewModal.maxMarks || 1).toFixed(2)}</span>
                  </div>

                  {/* Buttons matching Screenshot exactly */}
                  <div className="flex justify-start items-center gap-3 pt-4 border-t border-gray-100">
                    <button 
                      type="submit"
                      className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold px-8 py-2.5 rounded-md text-sm transition-colors shadow-xs cursor-pointer font-sans"
                    >
                      Update & Next
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedReviewModal(null)}
                      className="bg-[#d9534f] hover:bg-[#c9302c] text-white font-bold px-8 py-2.5 rounded-md text-sm transition-colors shadow-xs cursor-pointer font-sans"
                    >
                      Exit
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
