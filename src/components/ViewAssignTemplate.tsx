import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronDown, 
  Minus, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  Edit3, 
  Trash2, 
  Layers, 
  X, 
  SlidersHorizontal, 
  Check 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { dbGetItems, dbSaveItem } from '../services/firebase';

export interface ExamTemplateRecord {
  id: string;
  examCode: string;
  examName: string;
  organization: string;
  program: string;
  session: string;
  course: string;
  subject: string;
  examDate: string;
  totalScripts: number;
  evaluatedScripts: number;
  status: 'Assigned' | 'Unassigned';
  templateId?: string;
  templateName?: string;
  ratePerScript?: number;
  reviewRate?: number;
  deadlineHours?: number;
  bonusPerScript?: number;
  latePenaltyPercent?: number;
  assignedBy?: string;
  assignedAt?: string;
}

export interface PaymentTemplate {
  id: string;
  name: string;
  description: string;
  program: string;
  ratePerScript: number;
  reviewRate: number;
  deadlineHours: number;
  bonusPerScript: number;
  latePenaltyPercent: number;
}

export interface TemplateLogEntry {
  id: string;
  examId: string;
  examName: string;
  action: string;
  templateName: string;
  ratePerScript?: number;
  reviewRate?: number;
  assignedBy: string;
  timestamp: string;
  remarks?: string;
}

export const ORGANIZATION_OPTIONS = ['UDVASH', 'UNMESH', 'ONLINE CARE', 'UTKORSHO'];

export const PROGRAM_OPTIONS = [
  'Engineering Admission Program',
  "Varsity 'KA' Admission Program",
  "Varsity 'KHA' Admission Program",
  'Medical Admission Program',
  'College Admission Program',
  'SSC Model Test',
  'HSC Model Test',
];

export const SESSION_OPTIONS = ['2026', '2025', '2024', '2023'];

export const COURSE_OPTIONS = [
  'Engineering Marathon Class 2026',
  'Engineering Offline Course',
  'Engineering Online Course',
  "Varsity 'KA' Offline Exam 2025",
  'Medical Weekly Exam Service',
  'NDC & SJC All Service',
  'HCC All Service',
];

export const STATUS_OPTIONS = ['Unassigned', 'Assigned'];

const DEFAULT_PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: 'tmpl-eng-standard',
    name: 'Engineering Standard CQ Template (৳35/script)',
    description: 'Standard written evaluation rate for Engineering Admission Programs',
    program: 'Engineering Admission Program',
    ratePerScript: 35,
    reviewRate: 6,
    deadlineHours: 48,
    bonusPerScript: 3,
    latePenaltyPercent: 10,
  },
  {
    id: 'tmpl-eng-combined',
    name: 'Engineering Combined MCQ + CQ Template (৳45/script)',
    description: 'Comprehensive evaluation rate for heavy combined exam papers',
    program: 'Engineering Admission Program',
    ratePerScript: 45,
    reviewRate: 8,
    deadlineHours: 72,
    bonusPerScript: 5,
    latePenaltyPercent: 15,
  },
  {
    id: 'tmpl-varsity-standard',
    name: 'Varsity "KA" Standard Template (৳30/script)',
    description: 'Standard written rate for DU/Varsity A Unit programs',
    program: "Varsity 'KA' Admission Program",
    ratePerScript: 30,
    reviewRate: 5,
    deadlineHours: 48,
    bonusPerScript: 2,
    latePenaltyPercent: 10,
  },
  {
    id: 'tmpl-medical-cq',
    name: 'Medical Admission Written Template (৳28/script)',
    description: 'Rate for Medical admission written evaluation exercises',
    program: 'Medical Admission Program',
    ratePerScript: 28,
    reviewRate: 5,
    deadlineHours: 36,
    bonusPerScript: 3,
    latePenaltyPercent: 10,
  },
  {
    id: 'tmpl-hsc-model',
    name: 'HSC Board Standard Model Test (৳40/script)',
    description: 'Full CQ standard board style evaluation with in-depth annotations',
    program: 'HSC Model Test',
    ratePerScript: 40,
    reviewRate: 7,
    deadlineHours: 60,
    bonusPerScript: 4,
    latePenaltyPercent: 10,
  },
];

// Initial records matching the exact user screenshot
const INITIAL_EXAM_RECORDS: ExamTemplateRecord[] = [
  {
    id: 'exam-eap-demo01',
    examCode: '102',
    examName: '[102] EAP Weekly Written Exam Demo-01',
    organization: 'UDVASH',
    program: 'Engineering Admission Program',
    session: '2026',
    course: 'Engineering Marathon Class 2026',
    subject: 'Physics',
    examDate: '2026-09-20',
    totalScripts: 1420,
    evaluatedScripts: 0,
    status: 'Unassigned',
  },
  {
    id: 'exam-eap-p01',
    examCode: '104',
    examName: '[104] EAP Daily MCQ and Written Exam P-01',
    organization: 'UDVASH',
    program: 'Engineering Admission Program',
    session: '2026',
    course: 'Engineering Marathon Class 2026',
    subject: 'Physics',
    examDate: '2026-09-22',
    totalScripts: 1380,
    evaluatedScripts: 0,
    status: 'Unassigned',
  },
  {
    id: 'exam-eap-c01',
    examCode: '105',
    examName: '[105] EAP Daily MCQ and Written Exam C-01',
    organization: 'UDVASH',
    program: 'Engineering Admission Program',
    session: '2026',
    course: 'Engineering Marathon Class 2026',
    subject: 'Chemistry',
    examDate: '2026-09-24',
    totalScripts: 1510,
    evaluatedScripts: 0,
    status: 'Unassigned',
  },
  {
    id: 'exam-eap-m01',
    examCode: '106',
    examName: '[106] EAP Daily MCQ and Written Exam M-01',
    organization: 'UDVASH',
    program: 'Engineering Admission Program',
    session: '2026',
    course: 'Engineering Marathon Class 2026',
    subject: 'Higher Math',
    examDate: '2026-09-25',
    totalScripts: 1490,
    evaluatedScripts: 0,
    status: 'Unassigned',
  },
  {
    id: 'exam-eap-demo02',
    examCode: '108',
    examName: '[108] EAP Weekly Written Exam Demo-02',
    organization: 'UDVASH',
    program: 'Engineering Admission Program',
    session: '2026',
    course: 'Engineering Marathon Class 2026',
    subject: 'Physics',
    examDate: '2026-09-27',
    totalScripts: 1460,
    evaluatedScripts: 1200,
    status: 'Assigned',
    templateId: 'tmpl-eng-standard',
    templateName: 'Engineering Standard CQ Template (৳35/script)',
    ratePerScript: 35,
    reviewRate: 6,
    deadlineHours: 48,
    bonusPerScript: 3,
    latePenaltyPercent: 10,
    assignedBy: 'nazmulriad4@gmail.com',
    assignedAt: '2026-09-27 10:15 AM',
  },
];

// =========================================================================
// MULTI-SELECT DROPDOWN WITH CHECKMARKS (MATCHING UPLOADED USER SCREENSHOT)
// =========================================================================
interface CheckmarkMultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function CheckmarkMultiSelect({
  label,
  options,
  selected,
  onChange,
  isOpen,
  onToggle,
  onClose,
}: CheckmarkMultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const isAllSelected = options.length > 0 && selected.length === options.length;

  const toggleSelectAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const toggleOption = (opt: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selected.includes(opt)) {
      onChange(selected.filter(item => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const getDisplayText = () => {
    if (selected.length === 0) {
      return <span className="text-gray-400 italic">None selected</span>;
    }
    if (isAllSelected) {
      return <span className="text-gray-900 font-medium truncate">Select all ({options.length})</span>;
    }
    if (selected.length === 1) {
      return <span className="text-gray-900 font-medium truncate">{selected[0]}</span>;
    }
    if (selected.length === 2) {
      return <span className="text-gray-900 font-medium truncate">{selected.join(', ')}</span>;
    }
    return <span className="text-gray-900 font-medium truncate">{selected[0]}, {selected[1]} +{selected.length - 2} more</span>;
  };

  return (
    <div className="flex items-center relative" ref={containerRef}>
      <label className="w-[32%] text-right pr-4 text-xs font-bold text-gray-700 select-none">
        {label}
      </label>
      <div className="w-[68%] relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={onToggle}
          className={`w-full bg-white border rounded px-2.5 py-1.5 text-xs text-left flex items-center justify-between focus:outline-none cursor-pointer font-sans h-8 transition-colors ${
            isOpen ? 'border-[#337ab7] ring-1 ring-[#337ab7]' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="truncate pr-3 flex-1">
            {getDisplayText()}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu - EXACTLY matching the uploaded image */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-400 rounded-xs shadow-xl z-50 overflow-hidden font-sans text-xs">
            {/* Top Row: "Select all" in dark/black bordered box with #337ab7 blue background */}
            <div
              onClick={toggleSelectAll}
              className="border-2 border-black bg-[#337ab7] text-white px-2.5 py-1.5 flex items-center space-x-2.5 cursor-pointer font-bold select-none text-xs"
            >
              {/* Checkbox box: white square when unchecked, blue filled with white checkmark when checked */}
              {isAllSelected ? (
                <div className="w-3.5 h-3.5 rounded-xs bg-[#0066cc] border border-white flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-xs bg-white border border-gray-400 flex-shrink-0" />
              )}
              <span className="text-white font-bold tracking-wide">Select all</span>
            </div>

            {/* Individual Options List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
              {options.map((opt) => {
                const isChecked = selected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={(e) => toggleOption(opt, e)}
                    className={`px-2.5 py-1.5 flex items-center space-x-2.5 cursor-pointer select-none text-xs transition-colors ${
                      isChecked
                        ? 'bg-[#337ab7] text-white hover:bg-[#286090]'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {/* Checkbox for option */}
                    {isChecked ? (
                      <div className="w-3.5 h-3.5 rounded-xs bg-[#0066cc] border border-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-xs bg-white border border-gray-400 flex-shrink-0" />
                    )}

                    <span className={isChecked ? 'text-white font-medium truncate' : 'text-gray-900 font-normal truncate'}>
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ViewAssignTemplateProps {
  currentUser?: any;
}

export default function ViewAssignTemplate({ currentUser }: ViewAssignTemplateProps) {
  // Multi-select state variables (empty by default)
  const [filterOrganizations, setFilterOrganizations] = useState<string[]>([]);
  const [filterPrograms, setFilterPrograms] = useState<string[]>([]);
  const [filterSessions, setFilterSessions] = useState<string[]>([]);
  const [filterCourses, setFilterCourses] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterExamName, setFilterExamName] = useState<string>('');

  // Active open dropdown tracker
  const [openDropdown, setOpenDropdown] = useState<'organization' | 'program' | 'session' | 'course' | 'status' | null>(null);

  // User submission state: data only appears after clicking Submit
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  // Applied filter state after user clicks Submit
  const [appliedFilters, setAppliedFilters] = useState({
    organizations: [] as string[],
    programs: [] as string[],
    sessions: [] as string[],
    courses: [] as string[],
    statuses: [] as string[],
    examName: '',
  });

  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [examRecords, setExamRecords] = useState<ExamTemplateRecord[]>(INITIAL_EXAM_RECORDS);
  const [paymentTemplates, setPaymentTemplates] = useState<PaymentTemplate[]>(DEFAULT_PAYMENT_TEMPLATES);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetExamToAssign, setTargetExamToAssign] = useState<ExamTemplateRecord | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_PAYMENT_TEMPLATES[0].id);
  const [customRate, setCustomRate] = useState<number>(35);
  const [customReviewRate, setCustomReviewRate] = useState<number>(6);
  const [customDeadline, setCustomDeadline] = useState<number>(48);
  const [customBonus, setCustomBonus] = useState<number>(3);
  const [customLatePenalty, setCustomLatePenalty] = useState<number>(10);

  // Log Modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedExamForLog, setSelectedExamForLog] = useState<ExamTemplateRecord | null>(null);
  const [examLogs, setExamLogs] = useState<Record<string, TemplateLogEntry[]>>({
    'exam-eap-demo01': [
      {
        id: 'log-102-1',
        examId: 'exam-eap-demo01',
        examName: '[102] EAP Weekly Written Exam Demo-01',
        action: 'Exam Synced',
        templateName: 'Unassigned',
        assignedBy: 'System Auto-Sync',
        timestamp: '2026-09-20 09:00 AM',
        remarks: 'Exam scheduled and scripts synced from exam engine'
      }
    ],
    'exam-eap-p01': [
      {
        id: 'log-104-1',
        examId: 'exam-eap-p01',
        examName: '[104] EAP Daily MCQ and Written Exam P-01',
        action: 'Exam Synced',
        templateName: 'Unassigned',
        assignedBy: 'System Auto-Sync',
        timestamp: '2026-09-22 09:00 AM',
        remarks: 'Exam scheduled for Engineering Marathon Class 2026'
      }
    ]
  });

  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    program: 'Engineering Admission Program',
    ratePerScript: 35,
    reviewRate: 5,
    deadlineHours: 48,
    bonusPerScript: 2,
    latePenaltyPercent: 10,
    description: '',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync with Firestore on mount
  useEffect(() => {
    async function loadData() {
      try {
        const storedExams = await dbGetItems('assign_template_exams');
        const hasScreenshotDemoExams = storedExams?.some((e: any) => e.examName?.includes('[102] EAP'));
        
        if (storedExams && storedExams.length > 0 && hasScreenshotDemoExams) {
          setExamRecords(storedExams as ExamTemplateRecord[]);
        } else {
          setExamRecords(INITIAL_EXAM_RECORDS);
          for (const item of INITIAL_EXAM_RECORDS) {
            await dbSaveItem('assign_template_exams', item.id, item);
          }
        }

        const storedTemplates = await dbGetItems('payment_templates');
        if (storedTemplates && storedTemplates.length > 0) {
          setPaymentTemplates(storedTemplates as PaymentTemplate[]);
        } else {
          for (const tmpl of DEFAULT_PAYMENT_TEMPLATES) {
            await dbSaveItem('payment_templates', tmpl.id, tmpl);
          }
        }
      } catch (err) {
        console.error('Failed to load assign template data:', err);
      } finally {
        setIsDbLoaded(true);
      }
    }
    loadData();
  }, []);

  // When selectedTemplateId changes, sync the custom form defaults
  useEffect(() => {
    const tmpl = paymentTemplates.find(t => t.id === selectedTemplateId);
    if (tmpl) {
      setCustomRate(tmpl.ratePerScript);
      setCustomReviewRate(tmpl.reviewRate);
      setCustomDeadline(tmpl.deadlineHours);
      setCustomBonus(tmpl.bonusPerScript);
      setCustomLatePenalty(tmpl.latePenaltyPercent);
    }
  }, [selectedTemplateId, paymentTemplates]);

  // Handle Submit button click
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOpenDropdown(null);
    setHasSubmitted(true);
    setAppliedFilters({
      organizations: [...filterOrganizations],
      programs: [...filterPrograms],
      sessions: [...filterSessions],
      courses: [...filterCourses],
      statuses: [...filterStatuses],
      examName: filterExamName,
    });
    showToast('Filters applied. Showing records.');
  };

  // Reset filters
  const handleResetFilters = () => {
    setOpenDropdown(null);
    setFilterOrganizations([]);
    setFilterPrograms([]);
    setFilterSessions([]);
    setFilterCourses([]);
    setFilterStatuses([]);
    setFilterExamName('');
    setHasSubmitted(false);
    setAppliedFilters({
      organizations: [],
      programs: [],
      sessions: [],
      courses: [],
      statuses: [],
      examName: '',
    });
    showToast('Filters reset. Nothing selected.');
  };

  // Filtered Exam Records based on appliedFilters (populated only after Submit)
  const filteredExams = useMemo(() => {
    if (!hasSubmitted) return [];

    return examRecords.filter(item => {
      // Organization filter
      if (appliedFilters.organizations.length > 0 && !appliedFilters.organizations.includes(item.organization)) {
        return false;
      }
      // Program filter
      if (appliedFilters.programs.length > 0 && !appliedFilters.programs.includes(item.program)) {
        return false;
      }
      // Session filter
      if (appliedFilters.sessions.length > 0 && !appliedFilters.sessions.includes(item.session)) {
        return false;
      }
      // Course filter
      if (appliedFilters.courses.length > 0 && !appliedFilters.courses.includes(item.course)) {
        return false;
      }
      // Status filter
      if (appliedFilters.statuses.length > 0 && !appliedFilters.statuses.includes(item.status)) {
        return false;
      }
      // Exam Name search
      if (appliedFilters.examName) {
        const query = appliedFilters.examName.trim().toLowerCase();
        const matchesName = item.examName.toLowerCase().includes(query);
        const matchesCode = item.examCode.toLowerCase().includes(query);
        const matchesSubject = item.subject.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesSubject) return false;
      }
      return true;
    });
  }, [examRecords, appliedFilters, hasSubmitted]);

  // Open modal for exam assignment
  const handleOpenAssignModalSingle = (exam: ExamTemplateRecord) => {
    setTargetExamToAssign(exam);
    if (exam.templateId) {
      setSelectedTemplateId(exam.templateId);
    } else {
      setSelectedTemplateId(paymentTemplates[0]?.id || '');
    }
    setAssignModalOpen(true);
  };

  // Open Log Modal
  const handleOpenLogModal = (exam: ExamTemplateRecord) => {
    setSelectedExamForLog(exam);
    setLogModalOpen(true);
  };

  // Save template assignment
  const handleConfirmAssign = async () => {
    if (!targetExamToAssign) return;

    const template = paymentTemplates.find(t => t.id === selectedTemplateId);
    const templateName = template?.name || 'Custom Rate Template';
    const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const userEmail = currentUser?.email || 'admin@udvash.com';

    const updatedItem: ExamTemplateRecord = {
      ...targetExamToAssign,
      status: 'Assigned',
      templateId: selectedTemplateId,
      templateName: templateName,
      ratePerScript: customRate,
      reviewRate: customReviewRate,
      deadlineHours: customDeadline,
      bonusPerScript: customBonus,
      latePenaltyPercent: customLatePenalty,
      assignedBy: userEmail,
      assignedAt: nowStr,
    };

    // Update in state
    setExamRecords(prev => prev.map(e => e.id === updatedItem.id ? updatedItem : e));
    await dbSaveItem('assign_template_exams', updatedItem.id, updatedItem);

    // Append to logs
    const newLogEntry: TemplateLogEntry = {
      id: `log-${Date.now()}`,
      examId: updatedItem.id,
      examName: updatedItem.examName,
      action: 'Template Assigned',
      templateName: templateName,
      ratePerScript: customRate,
      reviewRate: customReviewRate,
      assignedBy: userEmail,
      timestamp: nowStr,
      remarks: `Assigned remuneration ৳${customRate}/script, review ৳${customReviewRate}`,
    };

    setExamLogs(prev => ({
      ...prev,
      [updatedItem.id]: [newLogEntry, ...(prev[updatedItem.id] || [])]
    }));

    setAssignModalOpen(false);
    showToast(`Template "${templateName}" assigned to ${updatedItem.examName}`);
  };

  // Add new custom template blueprint
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateForm.name.trim()) {
      showToast('Please enter a template name.');
      return;
    }

    const newId = `tmpl-${Date.now()}`;
    const newTmpl: PaymentTemplate = {
      id: newId,
      name: newTemplateForm.name,
      program: newTemplateForm.program,
      ratePerScript: Number(newTemplateForm.ratePerScript),
      reviewRate: Number(newTemplateForm.reviewRate),
      deadlineHours: Number(newTemplateForm.deadlineHours),
      bonusPerScript: Number(newTemplateForm.bonusPerScript),
      latePenaltyPercent: Number(newTemplateForm.latePenaltyPercent),
      description: newTemplateForm.description || 'Custom defined payment rate template',
    };

    const nextTemplates = [...paymentTemplates, newTmpl];
    setPaymentTemplates(nextTemplates);
    await dbSaveItem('payment_templates', newId, newTmpl);

    setNewTemplateForm({
      name: '',
      program: 'Engineering Admission Program',
      ratePerScript: 35,
      reviewRate: 5,
      deadlineHours: 48,
      bonusPerScript: 2,
      latePenaltyPercent: 10,
      description: '',
    });

    showToast(`Template "${newTmpl.name}" created successfully!`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredExams.map((e, idx) => ({
      Serial: idx + 1,
      Organization: e.organization,
      Program: e.program,
      Course: e.course,
      Exam: e.examName,
      Status: e.status,
      AssignedTemplate: e.templateName || 'Unassigned',
      RatePerScript: e.ratePerScript ? `৳${e.ratePerScript}` : '-',
      AssignedBy: e.assignedBy || '-',
      AssignedDate: e.assignedAt || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AssignPaymentTemplates');
    XLSX.writeFile(workbook, `View_Assign_Template_${Date.now()}.xlsx`);
    showToast('Exported to Excel successfully!');
  };

  // Print Table
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-[#f4f6f9] overflow-y-auto px-4 sm:px-6 py-4 text-left font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#002d5b] text-white px-4 py-2.5 rounded shadow-lg flex items-center space-x-2 text-xs border border-blue-400 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header / Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 mb-3 border-b border-gray-200 gap-2">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Exam</span>
            <span>/</span>
            <span>Script Evaluation</span>
            <span>/</span>
            <span className="text-gray-800 font-semibold">View Assign Template</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#002d5b] mt-0.5">
            Script Evaluation — Assign Payment Template
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setManageTemplatesOpen(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold text-xs px-3 py-1.5 rounded shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Manage Templates ({paymentTemplates.length})</span>
          </button>

          {hasSubmitted && filteredExams.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER BOX: With Multi-Select Checkmark Options (As per user's image)      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200 rounded shadow-xs mb-5">
        {/* Dark Navy Header Bar */}
        <div className="bg-[#002d5b] text-white px-4 py-2.5 flex items-center justify-between rounded-t">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-3.5 bg-red-500 rounded-xs inline-block"></span>
            <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase">
              Assign Payment Template
            </h2>
          </div>
          <button 
            type="button"
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            className="text-white hover:text-gray-200 p-1 rounded transition-colors cursor-pointer"
            title={isFilterCollapsed ? "Expand Filter" : "Collapse Filter"}
          >
            {isFilterCollapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
        </div>

        {/* Filter Body */}
        {!isFilterCollapsed && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 bg-white relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              
              {/* Field 1: Organization (Multi-Select with Checkmarks) */}
              <CheckmarkMultiSelect
                label="Organization"
                options={ORGANIZATION_OPTIONS}
                selected={filterOrganizations}
                onChange={setFilterOrganizations}
                isOpen={openDropdown === 'organization'}
                onToggle={() => setOpenDropdown(prev => prev === 'organization' ? null : 'organization')}
                onClose={() => setOpenDropdown(prev => prev === 'organization' ? null : prev)}
              />

              {/* Field 2: Program (Multi-Select with Checkmarks) */}
              <CheckmarkMultiSelect
                label="Program"
                options={PROGRAM_OPTIONS}
                selected={filterPrograms}
                onChange={setFilterPrograms}
                isOpen={openDropdown === 'program'}
                onToggle={() => setOpenDropdown(prev => prev === 'program' ? null : 'program')}
                onClose={() => setOpenDropdown(prev => prev === 'program' ? null : prev)}
              />

              {/* Field 3: Session (Multi-Select with Checkmarks) */}
              <CheckmarkMultiSelect
                label="Session"
                options={SESSION_OPTIONS}
                selected={filterSessions}
                onChange={setFilterSessions}
                isOpen={openDropdown === 'session'}
                onToggle={() => setOpenDropdown(prev => prev === 'session' ? null : 'session')}
                onClose={() => setOpenDropdown(prev => prev === 'session' ? null : prev)}
              />

              {/* Field 4: Course (Multi-Select with Checkmarks) */}
              <CheckmarkMultiSelect
                label="Course"
                options={COURSE_OPTIONS}
                selected={filterCourses}
                onChange={setFilterCourses}
                isOpen={openDropdown === 'course'}
                onToggle={() => setOpenDropdown(prev => prev === 'course' ? null : 'course')}
                onClose={() => setOpenDropdown(prev => prev === 'course' ? null : prev)}
              />

              {/* Field 5: Status (Multi-Select with Checkmarks) */}
              <CheckmarkMultiSelect
                label="Status"
                options={STATUS_OPTIONS}
                selected={filterStatuses}
                onChange={setFilterStatuses}
                isOpen={openDropdown === 'status'}
                onToggle={() => setOpenDropdown(prev => prev === 'status' ? null : 'status')}
                onClose={() => setOpenDropdown(prev => prev === 'status' ? null : prev)}
              />

              {/* Field 6: Enter Exam Name (Text Search) */}
              <div className="flex items-center">
                <label className="w-[32%] text-right pr-4 text-xs font-bold text-gray-700">
                  Enter Exam Name
                </label>
                <div className="w-[68%] relative">
                  <input
                    type="text"
                    placeholder="Enter Exam Name"
                    value={filterExamName}
                    onChange={(e) => setFilterExamName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 font-sans h-8"
                  />
                  {filterExamName && (
                    <button
                      type="button"
                      onClick={() => setFilterExamName('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="flex justify-center items-center pt-4 mt-3 border-t border-gray-100 gap-3">
              <button
                type="submit"
                className="bg-[#337ab7] hover:bg-[#286090] text-white font-bold text-xs px-8 py-2 rounded shadow-xs cursor-pointer transition-all border border-[#2e6da4] flex items-center space-x-1.5"
              >
                <span>Submit</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs px-4 py-2 rounded shadow-xs cursor-pointer transition-all border border-gray-300"
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RESULTS TABLE: EXACTLY MATCHING USER'S SUBMITTED SCREENSHOT               */}
      {/* ========================================================================= */}
      {!hasSubmitted ? (
        <div className="bg-white border border-gray-200 rounded shadow-xs p-10 text-center text-gray-500 mb-5">
          <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#337ab7]">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">No Data Displayed Yet</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              By default nothing is selected. Please select your desired filter criteria above and click <span className="font-semibold text-[#337ab7]">"Submit"</span> to view exam records.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {/* Top Summary Bar */}
          <div className="flex justify-between items-center px-1 text-xs text-gray-600">
            <div>
              Total Records Found: <strong className="text-gray-900">{filteredExams.length}</strong>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-2.5 py-1 rounded shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Table Container - matching image border & layout */}
          <div className="bg-white border border-gray-300 rounded-xs overflow-x-auto shadow-xs">
            <table className="w-full text-center text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-gray-300 bg-white font-bold text-gray-800 text-[13px]">
                  <th className="py-2.5 px-4 text-center border-r border-gray-300 w-20">Serial</th>
                  <th className="py-2.5 px-4 text-center border-r border-gray-300 min-w-[140px]">Organization</th>
                  <th className="py-2.5 px-4 text-center border-r border-gray-300 min-w-[200px]">Program</th>
                  <th className="py-2.5 px-4 text-center border-r border-gray-300 min-w-[200px]">Course</th>
                  <th className="py-2.5 px-4 text-center border-r border-gray-300 min-w-[260px]">Exam</th>
                  <th className="py-2.5 px-4 text-center border-r border-gray-300 w-36">Status</th>
                  <th className="py-2.5 px-4 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 bg-white">
                {filteredExams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                        <p className="text-sm font-semibold text-gray-700">No exams match the selected filter criteria.</p>
                        <p className="text-xs text-gray-500">
                          Try adjusting the Course or Status filters.
                        </p>
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 bg-[#337ab7] text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-[#286090] cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredExams.map((exam, index) => (
                    <tr 
                      key={exam.id} 
                      className="hover:bg-gray-50/70 transition-colors border-b border-gray-300 text-gray-700"
                    >
                      {/* Serial */}
                      <td className="py-3 px-4 text-center font-normal border-r border-gray-300 text-gray-800">
                        {index + 1}
                      </td>

                      {/* Organization */}
                      <td className="py-3 px-4 text-center font-normal border-r border-gray-300 text-gray-800">
                        {exam.organization}
                      </td>

                      {/* Program */}
                      <td className="py-3 px-4 text-center font-normal border-r border-gray-300 text-gray-800">
                        {exam.program}
                      </td>

                      {/* Course */}
                      <td className="py-3 px-4 text-center font-normal border-r border-gray-300 text-gray-800">
                        {exam.course}
                      </td>

                      {/* Exam */}
                      <td className="py-3 px-4 text-center font-normal border-r border-gray-300 text-gray-800">
                        {exam.examName}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center font-normal border-r border-gray-300 text-gray-800">
                        {exam.status}
                      </td>

                      {/* Action (Only Log option) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleOpenLogModal(exam)}
                            className="bg-[#337ab7] hover:bg-[#286090] text-white font-medium text-xs px-4 py-1 rounded transition-colors cursor-pointer border border-[#2e6da4] shadow-xs"
                          >
                            Log
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN PAYMENT TEMPLATE                                           */}
      {/* ========================================================================= */}
      {assignModalOpen && targetExamToAssign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-xl overflow-hidden text-left">
            {/* Modal Header */}
            <div className="bg-[#002d5b] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-4 bg-red-500 rounded-xs inline-block"></span>
                <h3 className="text-sm font-bold tracking-wide">
                  Assign Payment Template
                </h3>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-white hover:text-gray-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Target exam info */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                  Target Exam:
                </div>
                <div className="font-semibold text-gray-900 text-sm">{targetExamToAssign.examName}</div>
                <div className="text-gray-600 mt-0.5">
                  Course: <strong>{targetExamToAssign.course}</strong> • Total Scripts: <strong>{targetExamToAssign.totalScripts}</strong>
                </div>
              </div>

              {/* Template Choice */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Choose Payment Template <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                  >
                    {paymentTemplates.map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Rate configuration details */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Evaluation Rate (৳ / script)
                  </label>
                  <input
                    type="number"
                    value={customRate}
                    onChange={(e) => setCustomRate(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Admin Review Rate (৳ / script)
                  </label>
                  <input
                    type="number"
                    value={customReviewRate}
                    onChange={(e) => setCustomReviewRate(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Evaluation Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Early Bonus (৳ / script)
                  </label>
                  <input
                    type="number"
                    value={customBonus}
                    onChange={(e) => setCustomBonus(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Total payout estimate */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 flex justify-between items-center text-xs">
                <span className="text-gray-600">
                  Estimated Total Remuneration:
                </span>
                <span className="font-mono font-extrabold text-sm text-[#002d5b]">
                  ৳{(targetExamToAssign.totalScripts * customRate).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end items-center space-x-2.5">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium text-xs px-4 py-2 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="bg-[#5cb85c] hover:bg-[#449d44] text-white font-bold text-xs px-5 py-2 rounded shadow-xs border border-[#4cae4c] cursor-pointer"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYMENT TEMPLATE LOG                                               */}
      {/* ========================================================================= */}
      {logModalOpen && selectedExamForLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-2xl overflow-hidden text-left text-xs">
            {/* Header */}
            <div className="bg-[#002d5b] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-300" />
                <h3 className="font-bold text-sm">Payment Template Log</h3>
              </div>
              <button onClick={() => setLogModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Exam Info Card */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Organization:</span>{' '}
                  <strong className="text-gray-800">{selectedExamForLog.organization}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Program:</span>{' '}
                  <strong className="text-gray-800">{selectedExamForLog.program}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Exam:</span>{' '}
                  <strong className="text-gray-800">{selectedExamForLog.examName}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Course:</span>{' '}
                  <strong className="text-gray-800">{selectedExamForLog.course}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Current Status:</span>{' '}
                  <span className={`font-bold ${selectedExamForLog.status === 'Assigned' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedExamForLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Assigned Template:</span>{' '}
                  <span className="font-semibold text-blue-800">
                    {selectedExamForLog.templateName || 'None (Unassigned)'}
                  </span>
                </div>
              </div>

              {/* Log Records Table */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Assignment Audit History:</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 font-bold text-gray-700">
                      <tr>
                        <th className="p-2 border-b text-center w-10">SL</th>
                        <th className="p-2 border-b">Date & Time</th>
                        <th className="p-2 border-b">Action</th>
                        <th className="p-2 border-b">Template / Rate</th>
                        <th className="p-2 border-b">User</th>
                        <th className="p-2 border-b">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(examLogs[selectedExamForLog.id] || [
                        {
                          id: 'default-log-1',
                          examId: selectedExamForLog.id,
                          examName: selectedExamForLog.examName,
                          action: selectedExamForLog.status === 'Assigned' ? 'Template Assigned' : 'Exam Scheduled',
                          templateName: selectedExamForLog.templateName || 'Unassigned',
                          ratePerScript: selectedExamForLog.ratePerScript,
                          assignedBy: selectedExamForLog.assignedBy || 'System',
                          timestamp: selectedExamForLog.assignedAt || '2026-09-24 10:00 AM',
                          remarks: 'Standard automated sync'
                        }
                      ]).map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-gray-50">
                          <td className="p-2 text-center text-gray-600">{idx + 1}</td>
                          <td className="p-2 font-mono text-gray-700">{log.timestamp}</td>
                          <td className="p-2 font-semibold text-gray-800">{log.action}</td>
                          <td className="p-2 text-blue-700 font-medium">
                            {log.templateName}{log.ratePerScript ? ` (৳${log.ratePerScript})` : ''}
                          </td>
                          <td className="p-2 text-gray-600">{log.assignedBy}</td>
                          <td className="p-2 text-gray-500 italic">{log.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t flex justify-end">
              <button
                onClick={() => setLogModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1.5 rounded font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE TEMPLATES                                                   */}
      {/* ========================================================================= */}
      {manageTemplatesOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-2xl overflow-hidden text-left text-xs">
            <div className="bg-[#002d5b] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-300" />
                <h3 className="font-bold text-sm">Payment Rate Templates Management</h3>
              </div>
              <button onClick={() => setManageTemplatesOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
              {/* Existing Templates Table */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Configured Payment Templates:</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 font-bold text-gray-700">
                      <tr>
                        <th className="p-2 border-b">Template Name</th>
                        <th className="p-2 border-b">Program</th>
                        <th className="p-2 border-b text-center">Rate</th>
                        <th className="p-2 border-b text-center">Review</th>
                        <th className="p-2 border-b text-center">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentTemplates.map(tmpl => (
                        <tr key={tmpl.id} className="hover:bg-gray-50">
                          <td className="p-2 font-semibold text-gray-800">{tmpl.name}</td>
                          <td className="p-2 text-gray-600">{tmpl.program}</td>
                          <td className="p-2 text-center font-mono font-bold text-blue-700">৳{tmpl.ratePerScript}</td>
                          <td className="p-2 text-center font-mono text-gray-700">৳{tmpl.reviewRate}</td>
                          <td className="p-2 text-center font-mono text-gray-700">{tmpl.deadlineHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Template Form */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                  <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Create New Payment Template
                </h4>

                <form onSubmit={handleCreateTemplate} className="space-y-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Template Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Engineering Special Speed Rate Template (৳40/script)"
                      value={newTemplateForm.name}
                      onChange={(e) => setNewTemplateForm({ ...newTemplateForm, name: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Target Program</label>
                      <select
                        value={newTemplateForm.program}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, program: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {PROGRAM_OPTIONS.map(prog => (
                          <option key={prog} value={prog}>{prog}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Evaluation Rate (৳)</label>
                      <input
                        type="number"
                        value={newTemplateForm.ratePerScript}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, ratePerScript: Number(e.target.value) })}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Review Rate (৳)</label>
                      <input
                        type="number"
                        value={newTemplateForm.reviewRate}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, reviewRate: Number(e.target.value) })}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">Deadline (Hours)</label>
                      <input
                        type="number"
                        value={newTemplateForm.deadlineHours}
                        onChange={(e) => setNewTemplateForm({ ...newTemplateForm, deadlineHours: Number(e.target.value) })}
                        className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
                    >
                      Save New Template
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t flex justify-end">
              <button
                onClick={() => setManageTemplatesOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-1.5 rounded font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
