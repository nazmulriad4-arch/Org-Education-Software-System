/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  UserSquare2, 
  LayoutDashboard, 
  Settings, 
  Power, 
  Search, 
  ChevronDown,
  X,
  CreditCard,
  UserCircle,
  FileText,
  UserPlus,
  Mail,
  Lock,
  ShieldCheck,
  FileUp,
  Image,
  UploadCloud,
  CheckCircle2,
  RefreshCcw,
  Info,
  Download,
  Clock,
  Zap,
  Plus,
  Minus,
  Pencil,
  Undo2,
  Redo2,
  Eraser,
  RotateCcw,
  FileType,
  ChevronUp,
  Eye,
  Trash2,
  RotateCw,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Menu,
  AlertTriangle,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { evaluateScript, type Annotation, type EvaluationResult as AIEvaluationResult } from './services/geminiService';
import TeacherPortal from './components/TeacherPortal';
import UserManagementPanel from './components/UserManagement';
import { dbGetItems, dbSaveItem, dbDeleteItem } from './services/firebase';

// --- Types ---
type TopNavTab = 'Exam' | 'Team' | 'Administration';

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  subItems?: SidebarItem[];
}

// --- Constants ---
const ENGINE_INSTRUCTIONS: Record<string, string> = {
  Bangla: `এই পরীক্ষার খাতায় সৃজনশীল প্রশ্ন (CQ) রয়েছে। প্রতিটি প্রশ্নের ৪টি অংশ: ক, খ, গ, ঘ। === খাতা মূল্যায়ন নীতিমালা === **সবচেয়ে গুরুত্বপূর্ণ নিয়ম:** mark scheme-ই নম্বরের একমাত্র ভিত্তি। mark scheme যা বলে ঠিক তাই দাও — তার বেশিও না, কমও না। - mark scheme যে ধাপে যত নম্বর দিয়েছে, সেই ধাপে ঠিক তত নম্বর। - mark scheme-এ উল্লেখ নেই এমন কোনো ধাপ বা কারণে নম্বর দেওয়া যাবে না। - সন্দেহ হলে নম্বর দিও না। ১. লাইন টু লাইন পড়ে mark scheme এর প্রতিটি বরাদ্দ পয়েন্টের সাথে মিলিয়ে নম্বর দাও। ২. mark scheme-এর বাইরে বিকল্প উত্তর পেলে সেটি প্রাসঙ্গিক ও সঠিক কিনা যাচাই করো। সঠিক হলে নম্বর দাও। ৩. বাংলা ভার্সনের কমেন্ট ও feedback বাংলায়, ইংরেজি ভার্সনের ইংরেজিতে লেখো। ৪. উত্তরের মূলভাব সঠিক ও প্রাসঙ্গিক থাকলে হুবহু না হলেও mark scheme অনুযায়ী নম্বর দাও। ৫. কমেন্টে নির্দেশনামূলক বাক্য লেখা যাবে না। ভুল অংশ underline করে পাশে সঠিক উত্তর comment হিসেবে লিখে দাও। ৬. কমেন্ট শিক্ষার্থীর লেখার উপরে বসাবে না। কাছাকাছি ফাঁকা জায়গায় দাও। ৭. গ ও ঘ অংশে শুধু সিদ্ধান্ত লিখে যুক্তি না দিলে — mark scheme যদি যুক্তির জন্য আলাদা নম্বর রাখে তাহলে সেই নম্বর দিও না। ৮. সঠিক উত্তরে টিক বাক্য বা প্যারার শেষে দাও। এক পৃষ্ঠায় সর্বোচ্চ ৫-৬টি টিক। ৯. সৃজনশীলের ক, খ, গ, ঘ তে আলাদা answer_attempt। কখনো একত্রিত করো না। - answer_id ফরম্যাট: "6_ka", "6_kha", "6_ga", "6_gha"। - একাধিক পৃষ্ঠায় উত্তর চললে শেষ পৃষ্ঠায় marks_badge, মাঝের পৃষ্ঠায় marks_awarded=0, max_marks=0। - মার্ক বণ্টন: ক=১, খ=২, গ=৩, ঘ=৪ (অথবা mark scheme অনুযায়ী)। ১০. বানান ভুল underline করে পাশে সঠিক বানান comment হিসেবে লিখে দাও। mark scheme-এ নির্দেশনা থাকলে নম্বর কর্তন করো। ১১. প্রশ্নপত্রের ছাপানো লেখা, রাফ কাজ, অপ্রাসঙ্গিক লেখা, কেটে দেওয়া লেখায় কোনো annotation দিও না, মূল্যায়নে গণনা করো না। ১২. অপাঠযোগ্য হাতের লেখায় ০ নম্বর। অনুমান করে নম্বর দেওয়া যাবে না। {{lang=bangla}}`,
  English: `এই পরীক্ষার খাতায় MCQ, ছোট প্রশ্ন, Matching, Reordering, Tag Questions এবং Verb Identification রয়েছে। === English খাতা মূল্যায়ন নীতিমালা === **সবচেয়ে গুরুত্বপূর্ণ নিয়ম:** mark scheme-ই নম্বরের একমাত্র ভিত্তি। mark scheme যা বলে ঠিক তাই দাও — তার বেশিও না, কমও না। - mark scheme যে ধাপে যত নম্বর দিয়েছে, সেই ধাপে ঠিক তত নম্বর। - mark scheme-এ উল্লেখ নেই এমন কোনো নম্বর কর্তন বা প্রদান করা যাবে না। - সন্দেহ হলে নম্বর দিও না। ১. লাইন টু লাইন পড়ে mark scheme এর প্রতিটি বরাদ্দ পয়েন্টের সাথে মিলিয়ে নম্বর দাও। ২. সকল কমেন্ট ও feedback ইংরেজিতে লেখো। ৩. কমেন্টে নির্দেশনামূলক বাক্য লেখা যাবে না। ভুল অংশ underline করে পাশে সঠিক উত্তর comment হিসেবে লিখে দাও। ৪. কমেন্ট শিক্ষার্থীর লেখার উপরে বসাবে না। কাছাকাছি ফাঁকা জায়গায় দাও। ৫. প্রশ্নপত্রের ছাপানো লেখা, রাফ কাজ, অপ্রাসঙ্গিক লেখা, কেটে দেওয়া লেখায় কোনো annotation দিও না, মূল্যায়নে গণনা করো না। ৬. কোনো অংশের উত্তর একাধিক পৃষ্ঠায় চললে শুধুমাত্র শেষ পৃষ্ঠায় marks_badge দাও। মাঝের পৃষ্ঠায় marks_awarded=0, max_marks=0 রাখো। ৭. অপাঠযোগ্য হাতের লেখায় ০ নম্বর। অনুমান করে নম্বর দেওয়া যাবে না। === প্রশ্নভিত্তিক নির্দেশিকা === **MCQ (Q1) ও Verb Identification (Q6):** - সঠিক Roman number + সঠিক option = পূর্ণ নম্বর। - শুধু সঠিক option (Roman number ছাড়া) = পূর্ণ নম্বর। - শুধু সঠিক Roman number (option ছাড়া) = পূর্ণ নম্বর। - ভুল Roman number + সঠিক option = ৫০% নম্বর কর্তন। - সঠিক Roman number + ভুল option = ৫০% নম্বর কর্তন। - ভুল Roman number + ভুল option = পূর্ণ নম্বর কর্তন। - Capital/small letter এর জন্য কোনো নম্বর কাটা হবে না। **Written/Broad Questions (Q2):** - mark scheme অনুযায়ী তথ্যগত সঠিকতা যাচাই করে point অনুযায়ী নম্বর দাও। - Spelling ও grammar ভুলের জন্য mark scheme এর নির্দেশনা কঠোরভাবে অনুসরণ করো: 1-2 errors = -0.5, 3 errors = -1, 4-5 errors = -1.5, 6+ errors = -2। - ভুল নম্বরে উত্তর লেখা হলে (যেমন "a" এর বদলে "b") প্রতিটি থেকে 0.5 নম্বর কর্তন করো। **Matching (Q3):** - সঠিক matching = পূর্ণ নম্বর (সম্পূর্ণ বাক্য বা শুধু matching code উভয়ই গ্রহণযোগ্য)। - Column A তে ভুল number/letter ব্যবহার করলে প্রতিটি থেকে 0.5 কর্তন। - Column B, C তে Roman number এর বদলে অন্য কিছু লেখলে 0.5 কর্তন। - প্রতি ৩টি বানান ভুলের জন্য ঐ নম্বর থেকে ১ কর্তন। **Reordering (Q4):** - সঠিক ক্রম লেখলে পূর্ণ নম্বর। সম্পূর্ণ passage লেখা বাধ্যতামূলক নয়। - ভুল matching হলে অন্য একটিও স্বয়ংক্রিয়ভাবে ভুল হতে পারে — সেটি বিবেচনা করো। - নির্ধারিত number format (a, b, c...) ছাড়া অন্য format ব্যবহার করলে মোট প্রাপ্য নম্বর থেকে ১ কর্তন। - প্রতি ৩টি spelling/grammar ভুলের জন্য ১ কর্তন। **Tag Questions (Q5):** - সম্পূর্ণ বাক্য বা শুধু tag part লেখলে পূর্ণ নম্বর। - Interrogation mark (?) না দিলে নম্বর = ০। - Apostrophe (') বা contracted form (isn't, doesn't) না লেখলে নম্বর = ০। - Tag question অংশে capital letter ব্যবহার করলে (subject "I" ব্যতীত) ৫০% কর্তন। - Comma (,) missing থাকলে ৫০% কর্তন। {{lang=english}}`,
  Physics: `এই পরীক্ষার খাতায় সৃজনশীল প্রশ্ন (CQ) রয়েছে। প্রতিটি প্রশ্নের ৪টি অংশ: ক, খ, গ, ঘ। === পদার্থবিজ্ঞান খাতা মূল্যায়ন নীতিমালা === **সবচেয়ে গুরুত্বপূর্ণ নিয়ম:** mark scheme-ই নম্বরের একমাত্র ভিত্তি। mark scheme যা বলে ঠিক তাই দাও — তার বেশিও না, কমও না। - mark scheme যে ধাপে যত নম্বর দিয়েছে, সেই ধাপে ঠিক তত নম্বর। - mark scheme-এ উল্লেখ নেই এমন কোনো ধাপ, পদ্ধতি বা ব্যাখ্যায় কোনো নম্বর দেওয়া যাবে না। - চূড়ান্ত উত্তর ভুল হলে ০ দাও, যদি না mark scheme সেই কাজের ধাপের জন্য আলাদাভাবে নম্বর বরাদ্দ করে। - "পদ্ধতি সঠিক ছিল" বলে নিজে থেকে আংশিক বা carry-forward নম্বর দেওয়া নিষেধ। - সন্দেহ হলে নম্বর দিও না। ১. লাইন টু লাইন পড়ে mark scheme এর প্রতিটি বরাদ্দ পয়েন্টের সাথে মিলিয়ে নম্বর দাও। ২. mark scheme-এর বাইরে বিকল্প পদ্ধতিতে সঠিক উত্তর পেলে নম্বর দাও। কিন্তু বিকল্প পদ্ধতিতেও চূড়ান্ত উত্তর ভুল হলে ০। ৩. বাংলা ভার্সনের কমেন্ট ও feedback বাংলায়, ইংরেজি ভার্সনের ইংরেজিতে লেখো। ৪. উত্তরের মূলভাব সঠিক ও প্রাসঙ্গিক থাকলে হুবহু না হলেও mark scheme অনুযায়ী নম্বর দাও। ৫. কমেন্টে নির্দেশনামূলক বাক্য লেখা যাবে না। ভুল অংশ underline করে পাশে সঠিক উত্তর comment হিসেবে লিখে দাও। ৬. কমেন্ট শিক্ষার্থীর লেখার উপরে বসাবে না। কাছাকাছি ফাঁকা জায়গায় দাও। ৭. গ ও ঘ অংশে বিশ্লেষণ বা সিদ্ধান্তের প্রশ্নে শুধু সিদ্ধান্ত লিখে যুক্তি না দিলে — mark scheme যদি যুক্তির জন্য আলাদা নম্বর রাখে তাহলে সেই নম্বর দিও না। ৮. সঠিক উত্তরে টিক বাক্য বা প্যারার শেষে দাও। এক পৃষ্ঠায় সর্বোচ্চ ৫-৬টি টিক। ৯. সৃজনশীলের ক, খ, গ, ঘ তে আলাদা answer_attempt। কখনো একত্রিত করো না। - answer_id ফরম্যাট: "6_ka", "6_kha", "6_ga", "6_gha"। - একাধিক পৃষ্ঠায় উত্তর চললে শেষ পৃষ্ঠায় marks_badge, মাঝের পৃষ্ঠায় marks_awarded=0, max_marks=0। - মার্ক বণ্টন: ক=১, খ=২, গ=৩, ঘ=৪ (অথবা mark scheme অনুযায়ী)। ১০. প্রশ্নপত্রের ছাপানো লেখা, রাফ কাজ, অপ্রাসঙ্গিক লেখা, কেটে দেওয়া লেখায় কোনো annotation দিও না, মূল্যায়নে গণনা করো না। ১১. অপাঠযোগ্য হাতের লেখায় ০ নম্বর। অনুমান করে নম্বর দেওয়া যাবে না। === পদার্থবিজ্ঞান-বিশেষ নির্দেশিকা === - সূত্র mark scheme-এ থাকলে সূত্র লেখা বাধ্যতামূলক; না লিখলে mark scheme অনুযায়ী নম্বর কাটো। - একক ভুল বা অনুপস্থিত হলে mark scheme-এ নির্দেশনা থাকলে নম্বর কাটো। - গণনার পর mark scheme যদি সিদ্ধান্তের জন্য আলাদা নম্বর রাখে, সিদ্ধান্ত না টানলে সেই নম্বর দিও না। - রাশির মান (Vp, Vs, np, Is ইত্যাদি) ভুল নেওয়া হলে পরের ধাপের নম্বর শুধু তখনই দাও যখন mark scheme সেই ধাপের জন্য আলাদা নম্বর বরাদ্দ করে। - চিত্র, সার্কিট ডায়াগ্রাম বা গ্রাফে লেবেলিং mark scheme অনুযায়ী যাচাই করো। {{lang=bangla}}`,
  Chemistry: `এই পরীক্ষার খাতায় সৃজনশীল প্রশ্ন (CQ) রয়েছে। প্রতিটি প্রশ্নের ৪টি অংশ: ক, খ, গ, ঘ। === রসায়ন খাতা মূল্যায়ন নীতিমালা === **সবচেয়ে গুরুত্বপূর্ণ নিয়ম:** mark scheme-ই নম্বরের একমাত্র ভিত্তি। mark scheme যা বলে ঠিক তাই দাও — তার বেশিও না, কমও না। - mark scheme যে ধাপে যত নম্বর দিয়েছে, সেই ধাপে ঠিক তত নম্বর। - mark scheme-এ উল্লেখ নেই এমন কোনো ধাপ, পদ্ধতি বা ব্যাখ্যায় কোনো নম্বর দেওয়া যাবে না। - চূড়ান্ত উত্তর ভুল হলে ০ দাও, যদি না mark scheme সেই কাজের ধাপের জন্য আলাদাভাবে নম্বর বরাদ্দ করে। - "পদ্ধতি সঠিক ছিল" বলে নিজে থেকে আংশিক বা carry-forward নম্বর দেওয়া নিষেধ। - সন্দেহ হলে নম্বর দিও না। ১. লাইন টু লাইন পড়ে mark scheme এর প্রতিটি বরাদ্দ পয়েন্টের সাথে মিলিয়ে নম্বর দাও। ২. mark scheme-এর বাইরে বিকল্প পদ্ধতিতে সঠিক উত্তর পেলে নম্বর দাও। কিন্তু বিকল্প পদ্ধতিতেও চূড়ান্ত উত্তর ভুল হলে ০। ৩. বাংলা ভার্সনের কমেন্ট ও feedback বাংলায়, ইংরেজি ভার্সনের ইংরেজিতে লেখো। ৪. উত্তরের মূলভাব সঠিক ও প্রাসঙ্গিক থাকলে হুবহু না হলেও mark scheme অনুযায়ী নম্বর দাও। ৫. কমেন্টে নির্দেশনামূলক বাক্য লেখা যাবে না। ভুল অংশ underline করে পাশে সঠিক উত্তর comment হিসেবে লিখে দাও। ৬. কমেন্ট শিক্ষার্থীর লেখার উপরে বসাবে না। কাছাকাছি ফাঁকা জায়গায় দাও। ৭. গ ও ঘ অংশে বিশ্লেষণ বা সিদ্ধান্তের প্রশ্নে শুধু সিদ্ধান্ত লিখে যুক্তি না দিলে — mark scheme যদি যুক্তির জন্য আলাদা নম্বর রাখে তাহলে সেই নম্বর দিও না। ৮. সঠিক উত্তরে টিক বাক্য বা প্যারার শেষে দাও। এক পৃষ্ঠায় সর্বোচ্চ ৫-৬টি টিক। ৯. সৃজনশীলের ক, খ, গ, ঘ তে আলাদা answer_attempt। কখনো একত্রিত করো না। - answer_id ফরম্যাট: "6_ka", "6_kha", "6_ga", "6_gha"। - একাধিক পৃষ্ঠায় উত্তর চললে শেষ পৃষ্ঠায় marks_badge, মাঝের পৃষ্ঠায় marks_awarded=0, max_marks=0। - মার্ক বণ্টন: ক=১, খ=২, গ=৩, ঘ=৪ (অথবা mark scheme অনুযায়ী)। ১০. প্রশ্নপত্রের ছাপানো লেখা, রাফ কাজ, অপ্রাসঙ্গিক লেখা, কেটে দেওয়া লেখায় কোনো annotation দিও না, মূল্যায়নে গণনা করো না। ১১. অপাঠযোগ্য হাতের লেখায় ০ নম্বর। অনুমান করে নম্বর দেওয়া যাবে না। === রসায়ন-বিশেষ নির্দেশিকা === - রাসায়নিক সূত্র ও সমীকরণ mark scheme-এর সাথে মিলিয়ে দেখো। ভুল সূত্রে নম্বর নেই। - Balance সমীকরণ প্রয়োজন হলে unbalanced-এ mark scheme অনুযায়ী নম্বর কাটো। - গণনার ক্ষেত্রে mark scheme যে ধাপের জন্য নম্বর রেখেছে শুধু সেই ধাপ মিলিয়ে নম্বর দাও। - চিত্র বা ডায়াগ্রামে লেবেলিং mark scheme অনুযায়ী যাচাই করো। - একক ভুল বা অনুপস্থিত হলে mark scheme-এ নির্দেশনা থাকলে নম্বর কাটো। {{lang=bangla}}`,
  Math: `এই পরীক্ষার খাতায় সৃজনশীল প্রশ্ন (CQ) রয়েছে। প্রতিটি প্রশ্নের ৩টি অংশ: ক, খ, গ। === গণিত খাতা মূল্যায়ন নীতিমালা === **সবচেয়ে গুরুত্বপূর্ণ নিয়ম:** mark scheme-ই নম্বরের একমাত্র ভিত্তি। mark scheme যা বলে ঠিক তাই দাও — তার বেশিও না, কমও না। - mark scheme যে ধাপে যত নম্বর দিয়েছে, সেই ধাপে ঠিক তত নম্বর। - mark scheme-এ উল্লেখ নেই এমন কোনো ধাপ, পদ্ধতি বা কারণে কোনো নম্বর দেওয়া যাবে না। - চূড়ান্ত উত্তর ভুল হলে ০ দাও, যদি না mark scheme সেই কাজের ধাপের জন্য আলাদাভাবে নম্বর বরাদ্দ করে। - "পদ্ধতি সঠিক ছিল" বলে নিজে থেকে আংশিক বা carry-forward নম্বর দেওয়া নিষেধ। - সন্দেহ হলে নম্বর দিও না। ১. লাইন টু লাইন পড়ে mark scheme এর প্রতিটি বরাদ্দ পয়েন্টের সাথে মিলিয়ে নম্বর দাও। ২. mark scheme-এর বাইরে বিকল্প পদ্ধতিতে সঠিক উত্তর পেলে নম্বর দাও। কিন্তু বিকল্প পদ্ধতিতেও চূড়ান্ত উত্তর ভুল হলে ০। ৩. বাংলা ভার্সনের কমেন্ট ও feedback বাংলায়, ইংরেজি ভার্সনের ইংরেজিতে লেখো। ৪. কমেন্টে নির্দেশনামূলক বাক্য লেখা যাবে না। ভুল অংশ underline করে পাশে সঠিক উত্তর comment হিসেবে লিখে দাও। ৫. কমেন্ট শিক্ষার্থীর লেখার উপরে বসাবে না। কাছাকাছি ফাঁকা জায়গায় দাও। ৬. গ অংশে শুধু চূড়ান্ত উত্তর লিখে ধাপ না দেখালে — mark scheme যদি ধাপের জন্য আলাদা নম্বর রাখে তাহলে সেই ধাপের নম্বর দিও না। ৭. সঠিক উত্তরে টিক বাক্য বা প্যারার শেষে দাও। এক পৃষ্ঠায় সর্বোচ্চ ৫-৬টি টিক। ৮. সৃজনশীলের ক, খ, গ তে আলাদা answer_attempt। কখনো একত্রিত করো না। - answer_id ফরম্যাট: "6_ka", "6_kha", "6_ga"। - একাধিক পৃষ্ঠায় উত্তর চললে শেষ পৃষ্ঠায় marks_badge, মাঝের পৃষ্ঠায় marks_awarded=0, max_marks=0। - মার্ক বণ্টন: ক=২, খ=৪, গ=৪ (অথবা mark scheme অনুযায়ী)। ৯. প্রশ্নপত্রের ছাপানো লেখা, রাফ কাজ, অপ্রাসঙ্গিক লেখা, কেটে দেওয়া লেখায় কোনো annotation দিও না, মূল্যায়নে গণনা করো না। ১০. অপাঠযোগ্য হাতের লেখায় ০ নম্বর। অনুমান করে নম্বর দেওয়া যাবে না। {{lang=bangla}}`,
  Biology: `এই পরীক্ষার খাতায় জীববিজ্ঞানের সৃজনশীল প্রশ্ন (CQ) রয়েছে। প্রতিটি প্রশ্নের ৪টি অংশ: ক, খ, গ, ঘ। === জীববিজ্ঞান খাতা মূল্যায়ন নীতিমালা === **সবচেয়ে গুরুত্বপূর্ণ নিয়ম:** mark scheme-ই নম্বরের একমাত্র ভিত্তি। mark scheme যা বলে ঠিক তাই দাও — তার বেশিও না, কমও না। - mark scheme যে ধাপে যত নম্বর দিয়েছে, সেই ধাপে ঠিক তত নম্বর। - mark scheme-এ উল্লেখ নেই এমন কোনো ধাপ, term বা ব্যাখ্যায় কোনো নম্বর দেওয়া যাবে না। - নিজের জ্ঞান দিয়ে উত্তর validate করা যাবে না — mark scheme-এ যা লেখা আছে শুধু সেটাই সঠিক। - "এটা related" বা "মূলভাব কাছাকাছি" বলে নম্বর দেওয়া যাবে না যদি mark scheme-এ সেই term বা point না থাকে। - সন্দেহ হলে নম্বর দিও না। ১. mark scheme-এর প্রতিটি point আলাদাভাবে যাচাই করো। Holistic বিচারে নম্বর দেওয়া যাবে না। ২. mark scheme-এর বাইরে বিকল্প পদ্ধতিতে সঠিক উত্তর পেলে নম্বর দাও। কিন্তু mark scheme-এ accepted না থাকলে ০। ৩. সকল কমেন্ট ও feedback বাংলায় লেখো। ৪. কমেন্টে নির্দেশনামূলক বাক্য লেখা যাবে না। ভুল অংশ underline করে পাশে সঠিক উত্তর comment হিসেবে লিখে দাও। ৫. কমেন্ট শিক্ষার্থীর লেখার উপরে বসাবে না। কাছাকাছি ফাঁকা জায়গায় দাও। ৬. গ ও ঘ অংশে শুধু সিদ্ধান্ত লিখে যুক্তি না দিলে — mark scheme যদি যুক্তির জন্য আলাদা নম্বর রাখে তাহলে সেই নম্বর দিও না। ৭. সঠিক উত্তরে টিক বাক্য বা প্যারার শেষে দাও। এক পৃষ্ঠায় সর্বোচ্চ ৫-৬টি টিক। ৮. সৃজনশীলের ক, খ, গ, ঘ তে আলাদা answer_attempt। কখনো একত্রিত করো না। - answer_id ফরম্যাট: "6_ka", "6_kha", "6_ga", "6_gha"। - একাধিক পৃষ্ঠায় উত্তর চললে শেষ পৃষ্ঠায় marks_badge, মাঝের পৃষ্ঠায় marks_awarded=0, max_marks=0। - মার্ক বণ্টন: ক=১, খ=২, গ=৩, ঘ=৪ (অথবা mark scheme অনুযায়ী)। ৯. বানান ভুল underline করে পাশে সঠিক বানান comment হিসেবে লিখে দাও। mark scheme-এ নির্দেশনা থাকলে নম্বর কর্তন করো। ১০. প্রশ্নপত্রের ছাপানো লেখা, রাফ কাজ, অপ্রাসঙ্গিক লেখা, কেটে দেওয়া লেখায় কোনো annotation দিও না, মূল্যায়নে গণনা করো না। ১১. অপাঠযোগ্য হাতের লেখায় ০ নম্বর। অনুমান করে নম্বর দেওয়া যাবে না। === জীববিজ্ঞান-বিশেষ নির্দেশিকা === - **জৈবিক term ও অঙ্গাণু**: mark scheme-এ যে exact term বা নাম উল্লেখ আছে শিক্ষার্থীকে সেটিই লিখতে হবে। Broader category, synonym বা কাছাকাছি শব্দ গ্রহণযোগ্য নয় — সনাক্তকরণ ভুল হলে সেই point-এর নম্বর = ০। - **বৈজ্ঞানিক নাম**: Genus অংশ capital letter, species অংশ small letter বাধ্যতামূলক। হাতে লেখায় underline গ্রহণযোগ্য। না মানলে mark scheme-এর নির্দেশনা অনুযায়ী নম্বর কর্তন করো। - **জৈবিক প্রক্রিয়া ও ধাপ**: ধাপগুলো সঠিক ক্রমে আছে কিনা যাচাই করো। ক্রম ভুল হলে mark scheme অনুযায়ী নম্বর কর্তন করো। - **চিত্র**: label সঠিক স্থানে ও mark scheme-এর exact নামে দেওয়া হয়েছে কিনা যাচাই করো। mark scheme-এ চিত্র বাধ্যতামূলক থাকলে চিত্র না আঁকলে সেই নম্বর = ০। {{lang=bangla}}`
};

// --- Components ---

interface PendingBreakdownItem {
  code: string;
  setName: string;
  count: number;
}

const getPendingBreakdown = (course: string, subject: string, total: number): PendingBreakdownItem[] => {
  let prefix = "EX";
  const subLower = subject.toLowerCase();
  if (subLower.includes("chemistry")) prefix = "CH";
  else if (subLower.includes("physics")) prefix = "PH";
  else if (subLower.includes("mathematics") || subLower.includes("math")) prefix = "HM";
  else if (subLower.includes("biology")) prefix = "BI";
  else if (subLower.includes("english")) prefix = "EN";
  else if (subLower.includes("bangla")) prefix = "BN";

  let suffix = "-OW";
  if (subject.includes("[TW]")) suffix = "-TW";
  else if (subject.includes("[OW]")) suffix = "-OW";

  const codePrefix = `${prefix}${suffix}`;
  const cleanSubject = subject.replace(/\[\w+\]/, "").trim();

  const parts: number[] = [];
  if (total > 0) {
    if (total === 1) {
      parts.push(1);
    } else if (total === 2) {
      parts.push(1, 1);
    } else {
      const part1 = Math.floor(total * 0.45);
      const part2 = Math.floor(total * 0.35);
      const part3 = total - part1 - part2;
      parts.push(part1, part2, part3);
    }
  }

  return parts.map((count, index) => {
    const letters = ["A", "B", "C", "D"];
    return {
      code: `${codePrefix}-10${index + 1}`,
      setName: `${cleanSubject} Unique Set ${letters[index]}`,
      count
    };
  });
};

const mockExaminersListByCode: Record<string, Array<{
  id: string;
  name: string;
  phone: string;
  totalEvaluation: number;
  totalEvaTime: string;
  maxEvaTime: string;
  minEvaTime: string;
  avgEvaTime: string;
}>> = {
  // Higher Mathematics [OW]
  "HM-OW-101": [
    { id: "17304", name: "Sakib Imtiaz Rony (2021)", phone: "01303067268", totalEvaluation: 245, totalEvaTime: "08:10:15", maxEvaTime: "00:04:12", minEvaTime: "00:01:05", avgEvaTime: "00:02:00" },
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 198, totalEvaTime: "07:15:30", maxEvaTime: "00:05:01", minEvaTime: "00:01:20", avgEvaTime: "00:02:11" },
    { id: "25380", name: "Iftekhar Ahmed Tanha (2023)", phone: "01959995571", totalEvaluation: 156, totalEvaTime: "05:12:45", maxEvaTime: "00:03:50", minEvaTime: "00:01:10", avgEvaTime: "00:02:00" },
  ],
  "HM-OW-102": [
    { id: "28314", name: "Md. Ibrahim Khalil Sarker (2024)", phone: "01731654815", totalEvaluation: 310, totalEvaTime: "10:15:00", maxEvaTime: "00:04:30", minEvaTime: "00:01:02", avgEvaTime: "00:01:59" },
    { id: "29611", name: "Md. Sohag Ali (2024)", phone: "01792789010", totalEvaluation: 285, totalEvaTime: "09:40:20", maxEvaTime: "00:05:12", minEvaTime: "00:01:15", avgEvaTime: "00:02:02" },
  ],
  "HM-OW-103": [
    { id: "21297", name: "Farhin (2022)", phone: "01831994821", totalEvaluation: 180, totalEvaTime: "06:30:00", maxEvaTime: "00:04:45", minEvaTime: "00:01:18", avgEvaTime: "00:02:10" },
    { id: "17304", name: "Sakib Imtiaz Rony (2021)", phone: "01303067268", totalEvaluation: 144, totalEvaTime: "04:50:10", maxEvaTime: "00:03:55", minEvaTime: "00:01:08", avgEvaTime: "00:02:01" },
  ],
  
  // Higher Mathematics [TW]
  "HM-TW-101": [
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 450, totalEvaTime: "15:45:00", maxEvaTime: "00:05:30", minEvaTime: "00:01:15", avgEvaTime: "00:02:06" },
    { id: "25380", name: "Iftekhar Ahmed Tanha (2023)", phone: "01959995571", totalEvaluation: 400, totalEvaTime: "13:20:15", maxEvaTime: "00:04:10", minEvaTime: "00:01:10", avgEvaTime: "00:02:00" },
  ],
  "HM-TW-102": [
    { id: "28314", name: "Md. Ibrahim Khalil Sarker (2024)", phone: "01731654815", totalEvaluation: 380, totalEvaTime: "12:50:30", maxEvaTime: "00:04:25", minEvaTime: "00:01:05", avgEvaTime: "00:02:01" },
    { id: "29611", name: "Md. Sohag Ali (2024)", phone: "01792789010", totalEvaluation: 336, totalEvaTime: "11:12:00", maxEvaTime: "00:04:40", minEvaTime: "00:01:12", avgEvaTime: "00:02:00" },
  ],

  // Chemistry [OW]
  "CH-OW-101": [
    { id: "17304", name: "Sakib Imtiaz Rony (2021)", phone: "01303067268", totalEvaluation: 310, totalEvaTime: "09:50:20", maxEvaTime: "00:04:15", minEvaTime: "00:01:08", avgEvaTime: "00:01:54" },
    { id: "28314", name: "Md. Ibrahim Khalil Sarker (2024)", phone: "01731654815", totalEvaluation: 290, totalEvaTime: "09:10:45", maxEvaTime: "00:04:30", minEvaTime: "00:01:10", avgEvaTime: "00:01:53" },
  ],
  "CH-OW-102": [
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 338, totalEvaTime: "11:20:10", maxEvaTime: "00:05:05", minEvaTime: "00:01:15", avgEvaTime: "00:02:00" },
  ],

  // Chemistry [TW]
  "CH-TW-101": [
    { id: "17304", name: "Sakib Imtiaz Rony (2021)", phone: "01303067268", totalEvaluation: 520, totalEvaTime: "17:10:40", maxEvaTime: "00:04:10", minEvaTime: "00:01:05", avgEvaTime: "00:01:58" },
    { id: "28314", name: "Md. Ibrahim Khalil Sarker (2024)", phone: "01731654815", totalEvaluation: 480, totalEvaTime: "15:40:50", maxEvaTime: "00:04:20", minEvaTime: "00:01:10", avgEvaTime: "00:01:57" },
  ],
  "CH-TW-102": [
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 389, totalEvaTime: "13:00:20", maxEvaTime: "00:05:00", minEvaTime: "00:01:20", avgEvaTime: "00:02:00" },
  ],

  // Physics [OW]
  "PH-OW-101": [
    { id: "25380", name: "Iftekhar Ahmed Tanha (2023)", phone: "01959995571", totalEvaluation: 410, totalEvaTime: "13:40:15", maxEvaTime: "00:04:00", minEvaTime: "00:01:10", avgEvaTime: "00:02:00" },
    { id: "29611", name: "Md. Sohag Ali (2024)", phone: "01792789010", totalEvaluation: 380, totalEvaTime: "12:50:30", maxEvaTime: "00:04:30", minEvaTime: "00:01:15", avgEvaTime: "00:02:01" },
  ],
  "PH-OW-102": [
    { id: "17304", name: "Sakib Imtiaz Rony (2021)", phone: "01303067268", totalEvaluation: 230, totalEvaTime: "07:30:45", maxEvaTime: "00:03:55", minEvaTime: "00:01:05", avgEvaTime: "00:01:57" },
  ],

  // Physics [TW]
  "PH-TW-101": [
    { id: "25380", name: "Iftekhar Ahmed Tanha (2023)", phone: "01959995571", totalEvaluation: 610, totalEvaTime: "19:50:00", maxEvaTime: "00:04:05", minEvaTime: "00:01:08", avgEvaTime: "00:01:57" },
    { id: "29611", name: "Md. Sohag Ali (2024)", phone: "01792789010", totalEvaluation: 574, totalEvaTime: "18:30:25", maxEvaTime: "00:04:35", minEvaTime: "00:01:12", avgEvaTime: "00:01:56" },
  ],

  // Biology [OW]
  "BI-OW-101": [
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 400, totalEvaTime: "13:20:00", maxEvaTime: "00:04:50", minEvaTime: "00:01:18", avgEvaTime: "00:02:00" },
    { id: "21297", name: "Farhin (2022)", phone: "01831994821", totalEvaluation: 400, totalEvaTime: "13:10:00", maxEvaTime: "00:04:30", minEvaTime: "00:01:10", avgEvaTime: "00:01:58" },
  ],

  // Biology [TW]
  "BI-TW-101": [
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 380, totalEvaTime: "12:50:00", maxEvaTime: "00:04:55", minEvaTime: "00:01:20", avgEvaTime: "00:02:01" },
    { id: "21297", name: "Farhin (2022)", phone: "01831994821", totalEvaluation: 375, totalEvaTime: "12:15:00", maxEvaTime: "00:04:25", minEvaTime: "00:01:12", avgEvaTime: "00:01:57" },
  ],

  // English [OW]
  "EN-OW-101": [
    { id: "21809", name: "Mujammal Miah (2017)", phone: "01518901615", totalEvaluation: 90, totalEvaTime: "03:10:15", maxEvaTime: "00:04:12", minEvaTime: "00:01:15", avgEvaTime: "00:02:06" }
  ]
};

const getSubjectCodes = (course: string, subject: string): string[] => {
  let prefix = "EX";
  const subLower = subject.toLowerCase();
  if (subLower.includes("chemistry")) prefix = "CH";
  else if (subLower.includes("physics")) prefix = "PH";
  else if (subLower.includes("mathematics") || subLower.includes("math")) prefix = "HM";
  else if (subLower.includes("biology")) prefix = "BI";
  else if (subLower.includes("english")) prefix = "EN";
  else if (subLower.includes("bangla")) prefix = "BN";

  let suffix = "-OW";
  if (subject.includes("[TW]")) suffix = "-TW";
  else if (subject.includes("[OW]")) suffix = "-OW";

  const codePrefix = `${prefix}${suffix}`;
  
  return [
    `${codePrefix}-101`,
    `${codePrefix}-102`,
    `${codePrefix}-103`
  ];
};

const getExaminersForCode = (course: string, subject: string, selectedCode: string) => {
  if (mockExaminersListByCode[selectedCode]) {
    return mockExaminersListByCode[selectedCode];
  }
  let prefix = "EX";
  const subLower = subject.toLowerCase();
  if (subLower.includes("chemistry")) prefix = "CH";
  else if (subLower.includes("physics")) prefix = "PH";
  else if (subLower.includes("mathematics") || subLower.includes("math")) prefix = "HM";
  else if (subLower.includes("biology")) prefix = "BI";
  else if (subLower.includes("english")) prefix = "EN";
  else if (subLower.includes("bangla")) prefix = "BN";

  let suffix = "-OW";
  if (subject.includes("[TW]")) suffix = "-TW";
  else if (subject.includes("[OW]")) suffix = "-OW";

  const key1 = `${prefix}${suffix}-101`;
  if (mockExaminersListByCode[key1]) {
    return mockExaminersListByCode[key1];
  }
  
  return [
    { id: "17304", name: "Sakib Imtiaz Rony (2021)", phone: "01303067268", totalEvaluation: 32, totalEvaTime: "01:04:12", maxEvaTime: "00:04:00", minEvaTime: "00:01:10", avgEvaTime: "00:02:00" },
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 25, totalEvaTime: "00:52:10", maxEvaTime: "00:05:00", minEvaTime: "00:01:15", avgEvaTime: "00:02:05" }
  ];
};

const timeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
};

const secondsToTime = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].join(':');
};

const getExaminersForSubjectAll = (course: string, subject: string) => {
  const codes = getSubjectCodes(course, subject);
  const allExaminers: Array<{
    id: string;
    name: string;
    phone: string;
    totalEvaluation: number;
    totalEvaTime: string;
    maxEvaTime: string;
    minEvaTime: string;
    avgEvaTime: string;
  }> = [];

  const seenIds = new Map<string, typeof allExaminers[0]>();

  codes.forEach(code => {
    const list = mockExaminersListByCode[code] || [];
    list.forEach(ex => {
      if (seenIds.has(ex.id)) {
        const existing = seenIds.get(ex.id)!;
        existing.totalEvaluation += ex.totalEvaluation;
        
        // Sum total evaluation times
        const existingSecs = timeToSeconds(existing.totalEvaTime);
        const currentSecs = timeToSeconds(ex.totalEvaTime);
        existing.totalEvaTime = secondsToTime(existingSecs + currentSecs);

        // Max time
        const existingMax = timeToSeconds(existing.maxEvaTime);
        const currentMax = timeToSeconds(ex.maxEvaTime);
        if (currentMax > existingMax) {
          existing.maxEvaTime = ex.maxEvaTime;
        }

        // Min time
        const existingMin = timeToSeconds(existing.minEvaTime);
        const currentMin = timeToSeconds(ex.minEvaTime);
        if (currentMin > 0 && (existingMin === 0 || currentMin < existingMin)) {
          existing.minEvaTime = ex.minEvaTime;
        }
      } else {
        seenIds.set(ex.id, { ...ex });
      }
    });
  });

  // Calculate avgEvaTime dynamically for the merged records
  seenIds.forEach(ex => {
    const totalSecs = timeToSeconds(ex.totalEvaTime);
    if (ex.totalEvaluation > 0) {
      const avgSecs = Math.round(totalSecs / ex.totalEvaluation);
      ex.avgEvaTime = secondsToTime(avgSecs);
    }
  });

  const mergedList = Array.from(seenIds.values());
  if (mergedList.length > 0) {
    return mergedList;
  }

  // Return standard fallback if empty
  return [
    { id: "17304", name: "Sakib Imtiaz Rony (2021)", phone: "01303067268", totalEvaluation: 32, totalEvaTime: "01:04:12", maxEvaTime: "00:04:00", minEvaTime: "00:01:10", avgEvaTime: "00:02:00" },
    { id: "21350", name: "Shajed Ahmed Chowdhury (2022)", phone: "01902139021", totalEvaluation: 25, totalEvaTime: "00:52:10", maxEvaTime: "00:05:00", minEvaTime: "00:01:15", avgEvaTime: "00:02:05" }
  ];
};

const getPendingDuration = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})\s*(AM|PM)?/i);
    if (!parts) return '1.5 hours';
    const year = parseInt(parts[1]);
    const month = parseInt(parts[2]) - 1;
    const day = parseInt(parts[3]);
    let hour = parseInt(parts[4]);
    const minute = parseInt(parts[5]);
    const ampm = parts[6];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
      if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
    }
    const reqTime = new Date(year, month, day, hour, minute);
    let now = new Date();
    // Support custom/mock now if current time is older than the 2026 date
    if (now.getTime() < reqTime.getTime()) {
      now = new Date(2026, 6, 5, 5, 0); // Simulated July 5, 2026 5:00 AM
    }
    const diffMs = now.getTime() - reqTime.getTime();
    if (diffMs < 0) {
      return '15 mins';
    }
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      if (remainingHours > 0) {
        return `${diffDays}d ${remainingHours}h`;
      }
      return `${diffDays}d`;
    }
    if (diffHours > 0) {
      const remainingMins = diffMins % 60;
      if (remainingMins > 0) {
        return `${diffHours}h ${remainingMins}m`;
      }
      return `${diffHours}h`;
    }
    return `${diffMins}m`;
  } catch (err) {
    return '2h 15m';
  }
};

const getDisplayStatus = (req: any) => {
  if (req && req.isMultiple) {
    const checked = req.checkedScriptsCount || 0;
    const total = req.totalScriptsCount || 10;
    if (checked >= total) {
      return "Reviewed";
    }
    if (checked > 0) {
      return "In Progress";
    }
    return "Pending Teacher Response";
  }
  return req ? req.status : "";
};

const isStudentRequest = (req: any) => {
  if (!req) return false;
  if (req.reviewRequest === 'Rechecked from Student' || req.id === 'FWD-001' || req.id === 'FWD-003') {
    return true;
  }
  if (req.reviewRequest === 'Rechecked from Admin' || req.id === 'FWD-002' || req.id === 'FWD-004') {
    return false;
  }
  const noteLower = (req.note || '').toLowerCase();
  if (noteLower.includes('শিক্ষার্থী') || noteLower.includes('student')) {
    return true;
  }
  return false;
};

export default function App() {
  // --- New authentication and view states ---
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
      setViewMode(isMobile ? 'mobile' : 'desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<TopNavTab>('Administration');
  const [activeSidebarItem, setActiveSidebarItem] = useState('admin-dash');
  const [activeSubItem, setActiveSubItem] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('Bangla');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSolutionSheetExpanded, setIsSolutionSheetExpanded] = useState(true);
  const [evaluationResult, setEvaluationResult] = useState<{ id: string; name: string; score: string; status: string }[] | null>(null);
  const [aiEvaluationData, setAiEvaluationData] = useState<AIEvaluationResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({ solution: false, student: false });
  
  // File Preview & Rotation States
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  
  // State for file uploads
  const [solutionFiles, setSolutionFiles] = useState<File[]>([]);
  const [studentFiles, setStudentFiles] = useState<File[]>([]);

  // Admin Review Filter States
  const [reviewFilters, setReviewFilters] = useState({
    organization: 'All Organization',
    session: 'All Session',
    exam: '',
    version: 'All Version',
    startDate: '2026-06-29 12:00 AM',
    examiner: '',
    questionSerial: 'All Question Serial',
    minMarks: '',
    rollNumber: '',
    displayPerPage: '100',
    program: 'All Program',
    course: 'All Course',
    examType: 'All Exam Type',
    answerType: 'All Answer Type',
    endDate: '2026-07-01 11:59 PM',
    uniqueSet: 'All Unique Set',
    evaluationType: 'All',
    maxMarks: '',
    reviewStatus: 'All',
    orderBy: 'All'
  });

  const [reviewSearchTriggered, setReviewSearchTriggered] = useState(true);
  const [rollError, setRollError] = useState(false);
  const [showImageLog, setShowImageLog] = useState(false);
  const [selectedReviewRow, setSelectedReviewRow] = useState<any>(null);
  const [showReviewWorkspace, setShowReviewWorkspace] = useState(false);
  const [showingAdminDetailRow, setShowingAdminDetailRow] = useState<any>(null);

  const [reviewScripts, setReviewScripts] = useState([
    {
      id: 'REV-SCRIPT-1',
      rollNumber: '57210800687',
      registrationNo: '4297721',
      subject: 'Bangla',
      examSubject: '[101] - Bangla 1st Paper',
      examName: 'Paper Final Live Exam Bangla 1st Paper',
      course: 'NDC & SJC All Service',
      program: 'College Admission Program',
      session: '2026',
      examType: 'Online Written',
      version: 'Bangla',
      question: '১ টেরাগাম কত পিকোগ্রামের সমান?',
      uniqueSet: '1',
      questionSerial: '1',
      maxMarks: '1.00',
      obtainedMarks: '1.00',
      sampleAnswer: '১০^২৪ পিকোগ্রাম',
      sampleAnswerNotes: [
        '১ টেরাগাম = ১০^১২ গ্রাম',
        '১ পিকোগ্রাম = ১০^-১২ গ্রাম',
        '.-. ১ টেরাগাম = ১০^২৪ পিকোগ্রাম; লেখার জন্য ০১ নম্বর ।',
        '[বি. দ্র. শুধু উত্তর লিখলেও সম্পূর্ণ নম্বর পাবে ।]'
      ],
      scriptImage: '/src/assets/images/physics_script_1_1784375451233.jpg',
      examinerName: '[21192] Fahim (2023)',
      evaluationTime: '2026-07-17 07:36 PM',
      annotations: [
        { type: 'text', text: '০১', top: 40, left: 5, fontSize: '42px', fontColor: 'red', isBold: true, fontFamily: '"Comic Sans MS", cursive' },
        { type: 'tick', top: 35, left: 12 }
      ]
    },
    {
      id: 'REV-SCRIPT-2',
      rollNumber: '42205101365',
      registrationNo: '5234365',
      subject: 'Physics',
      examSubject: '[126] - Physics 1st Paper',
      examName: 'Paper Final Live Exam Physics 1st Paper',
      course: "HSC'26 Model Test Online Service [HSC MT - 2026]",
      program: 'College Admission Program',
      session: '2026',
      examType: 'Online Written',
      version: 'Bangla',
      question: '১ টেরাগাম কত পিকোগ্রামের সমান?',
      uniqueSet: '1',
      questionSerial: '1',
      maxMarks: '1.00',
      obtainedMarks: '1.00',
      sampleAnswer: '১০^২৪ পিকোগ্রাম',
      sampleAnswerNotes: [
        '১ টেরাগাম = ১০^১২ গ্রাম',
        '১ পিকোগ্রাম = ১০^-১২ গ্রাম',
        '.-. ১ টেরাগাম = ১০^২৪ পিকোগ্রাম; লেখার জন্য ০১ নম্বর ।',
        '[বি. দ্র. শুধু উত্তর লিখলেও সম্পূর্ণ নম্বর পাবে ।]'
      ],
      scriptImage: '/src/assets/images/physics_script_2_1784375465674.jpg',
      examinerName: '[21192] Fahim (2023)',
      evaluationTime: '2026-07-17 07:36 PM',
      annotations: [
        { type: 'text', text: '০১', top: 40, left: 5, fontSize: '42px', fontColor: 'red', isBold: true, fontFamily: '"Comic Sans MS", cursive' },
        { type: 'tick', top: 35, left: 12 },
        { type: 'line', top: 50, left: 10, width: 70, height: 2, color: 'red', angle: -15 }
      ]
    },
    {
      id: 'REV-SCRIPT-3',
      rollNumber: '15200200816',
      registrationNo: '4755835',
      subject: 'English',
      examSubject: '[107] - English Literature',
      examName: 'Midterm Evaluation English Literature',
      course: 'HSC Bangla-English Full Course Online [HSC BE O - 2026]',
      program: 'College Admission Program',
      session: '2026',
      examType: 'Online Written',
      version: 'English',
      question: 'Fill in the gap with the right form of verb: The principal and president ______ (come) yet.',
      uniqueSet: '1',
      questionSerial: '2',
      maxMarks: '1.00',
      obtainedMarks: '0.00',
      sampleAnswer: "hasn't come",
      sampleAnswerNotes: [
        '01 mark for writing "hasn\'t come"'
      ],
      scriptImage: 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/english-eval-script.png',
      examinerName: '[10089] Manar (2021)',
      evaluationTime: '2026-07-17 07:41 PM',
      annotations: [
        { type: 'text', text: "২ । didn't come", top: 35, left: 12, fontSize: '24px', fontColor: 'black', isBold: true },
        { type: 'line', top: 41, left: 11, width: 20, height: 2, color: 'black' },
        { type: 'circle', top: 31, left: 5, width: 27, height: 16, color: 'red' },
        { type: 'text', text: "hasn't come", top: 48, left: 34, fontSize: '28px', fontColor: 'red', isBold: true },
        { type: 'text', text: '00 /', top: 51, left: 11, fontSize: '42px', fontColor: 'red', isBold: true, fontFamily: '"Comic Sans MS", cursive' }
      ]
    },
    {
      id: 'REV-SCRIPT-4',
      rollNumber: '41180501037',
      registrationNo: '4419518',
      subject: 'Higher Math',
      examSubject: '[129] - Higher Math 1st Paper',
      examName: 'Paper Final Live Exam Higher Math 1st Paper',
      course: 'NDC & SJC All Service',
      program: 'College Admission Program',
      session: '2026',
      examType: 'Online Written',
      version: 'Bangla',
      question: '√3 x + y + 1 = 0 রেখাটি x অক্ষের ধনাত্মক দিকের সাথে কত ডিগ্রি কোণ উৎপন্ন করবে?',
      uniqueSet: '1',
      questionSerial: '2',
      maxMarks: '1.00',
      obtainedMarks: '1.00',
      sampleAnswerMath: true,
      sampleAnswerNotes: [
        'tan θ = -√3 ; নির্ণয় করার জন্য ০.৫ নম্বর।',
        'θ = tan^-1(-√3) বা, 120° ; নির্ণয় করার জন্য ০.৫ নম্বর।',
        '[বি. দ্র. শুধু উত্তর লিখলেও সম্পূর্ণ নম্বর পাবে; তবে বিস্তারিত লেখা উত্তম।]'
      ],
      scriptImage: 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/bangla-eval-script.png',
      examinerName: '[17304] Rony (2021)',
      evaluationTime: '2026-07-18 10:18 AM',
      annotations: [
        { type: 'text', text: 'm = tan θ', top: 58, left: 8, fontSize: '18px', fontColor: 'black', isBold: true },
        { type: 'text', text: '.-. θ = 120', top: 58, left: 28, fontSize: '18px', fontColor: 'black', isBold: true },
        { type: 'text', text: 'o', top: 55, left: 39, fontSize: '11px', fontColor: 'black', isBold: true },
        { type: 'text', text: '-√3 = tan θ', top: 64, left: 6, fontSize: '18px', fontColor: 'black', isBold: true },
        { type: 'tick', top: 56, left: 41 },
        { type: 'line', top: 62, left: 3, width: 23, height: 2, color: 'red', angle: -20 }
      ]
    }
  ]);

  const [activeScriptIdx, setActiveScriptIdx] = useState<number>(0);
  const [reviewObtainedMarks, setReviewObtainedMarks] = useState("1.00");
  const [activeDrawingTool, setActiveDrawingTool] = useState("pencil");
  const [imageScale, setImageScale] = useState(1);
  const [studentPaperRotate, setStudentPaperRotate] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [initialPathCount, setInitialPathCount] = useState(0);
  const [redoPaths, setRedoPaths] = useState<string[]>([]);
  const [scriptComments, setScriptComments] = useState<{ x: number; y: number; text: string }[]>([]);
  const [reviewViewMode, setReviewViewMode] = useState<'canvas' | 'scanned'>('canvas');

  // Custom multi-page drawing & annotation state
  const [totalScriptPages, setTotalScriptPages] = useState(1);
  const [currentScriptPage, setCurrentScriptPage] = useState(1);
  const [pageStore, setPageStore] = useState<{[pageNum: number]: { paths: string[], comments: any[] }}>({});
  const [actionHistory, setActionHistory] = useState<{ type: 'path' | 'comment'; value: any }[]>([]);
  const [redoHistory, setRedoHistory] = useState<{ type: 'path' | 'comment'; value: any }[]>([]);

  useEffect(() => {
    if (selectedReviewRow) {
      const paths = selectedReviewRow.allPaths || [];
      const comments = selectedReviewRow.scriptComments || [];
      setAllPaths(paths);
      setInitialPathCount(paths.length);
      setScriptComments(comments);
      setTotalScriptPages(1);
      setCurrentScriptPage(1);
      setPageStore({
        1: { paths: [...paths], comments: [...comments] }
      });
      setActionHistory([]);
      setRedoHistory([]);
      setImageScale(1);
      setStudentPaperRotate(0);
    } else {
      setAllPaths([]);
      setScriptComments([]);
      setTotalScriptPages(1);
      setCurrentScriptPage(1);
      setPageStore({});
      setActionHistory([]);
      setRedoHistory([]);
    }
  }, [selectedReviewRow]);
  const [showForwardToTeacher, setShowForwardToTeacher] = useState(false);
  const [forwardToTeacherText, setForwardToTeacherText] = useState("");
  const [forwardSuccessMessage, setForwardSuccessMessage] = useState("");
  const [forwardSingleChecked, setForwardSingleChecked] = useState(true);
  const [forwardMultipleChecked, setForwardMultipleChecked] = useState(false);
  const [hoveredPending, setHoveredPending] = useState<{
    course: string;
    subject: string;
    pending: number;
    gIdx: number;
    sIdx: number;
  } | null>(null);
  const [selectedDashboardDetail, setSelectedDashboardDetail] = useState<{
    course: string;
    subject: string;
  } | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>("");

  // Exam Permission States
  const [examPermFilters, setExamPermFilters] = useState({
    organization: 'All Organization',
    session: 'All Session',
    meritPermission: 'All',
    evaluationPermission: 'All Permission',
    examType: 'All Exam Type',
    displayPerPage: '100',
    program: 'All Program',
    course: 'All Course',
    highestMarksPermission: 'All',
    analysisPermission: 'All Permission',
    keyword: ''
  });
  const [isExamPermCollapsed, setIsExamPermCollapsed] = useState(false);
  const [examPermSearchTriggered, setExamPermSearchTriggered] = useState(true);
  const [examPermissions, setExamPermissions] = useState([
    {
      id: "EX-PRM-001",
      organization: "UDVASH",
      program: "VAP 'KA'",
      session: "2025",
      course: "Varsity 'KA' Offline Exam 2025",
      examCode: "[101 ]",
      examName: "VAP Daily MCQ and Written Exam P-01",
      examType: "Mcq",
      examinerPermission: "Yes",
      examinerDateTime: "2025-09-08 15:00",
      analysisPermission: "Yes",
      analysisDateTime: "2025-08-22 15:21 PM",
      meritPermission: "Yes",
      meritDateTime: "2025-08-22 15:21 PM",
      highestMarksPermission: "Yes",
      highestMarksDateTime: "2025-08-22 15:21 PM"
    },
    {
      id: "EX-PRM-002",
      organization: "UDVASH",
      program: "VAP 'KA'",
      session: "2025",
      course: "Varsity 'KA' Offline Exam 2025",
      examCode: "[101 ]",
      examName: "VAP Daily MCQ and Written Exam P-01",
      examType: "Templated Written",
      examinerPermission: "Yes",
      examinerDateTime: "2025-09-08 15:00",
      analysisPermission: "Yes",
      analysisDateTime: "2025-08-22 15:21 PM",
      meritPermission: "Yes",
      meritDateTime: "2025-08-22 15:21 PM",
      highestMarksPermission: "Yes",
      highestMarksDateTime: "2025-08-22 15:21 PM"
    },
    {
      id: "EX-PRM-003",
      organization: "UNMESH",
      program: "Engineering Admission Program",
      session: "2026",
      course: "NDC & SJC All Service",
      examCode: "[102 ]",
      examName: "Physics 1st Paper Daily Exam-04",
      examType: "Online Written",
      examinerPermission: "Yes",
      examinerDateTime: "2026-01-10 10:00",
      analysisPermission: "No",
      analysisDateTime: "---",
      meritPermission: "Yes",
      meritDateTime: "2026-01-10 10:15",
      highestMarksPermission: "No",
      highestMarksDateTime: "---"
    },
    {
      id: "EX-PRM-004",
      organization: "ONLINE CARE",
      program: "HSC Model Test",
      session: "2024",
      course: "HCC All Service",
      examCode: "[103 ]",
      examName: "Chemistry 2nd Paper Live Exam-02",
      examType: "Templated Written",
      examinerPermission: "No",
      examinerDateTime: "---",
      analysisPermission: "No",
      analysisDateTime: "---",
      meritPermission: "No",
      meritDateTime: "---",
      highestMarksPermission: "No",
      highestMarksDateTime: "---"
    },
    {
      id: "EX-PRM-005",
      organization: "UDVASH",
      program: "Class 10 Academic Program",
      session: "2025",
      course: "Employee Training Course",
      examCode: "[104 ]",
      examName: "English Grammar Assessment-03",
      examType: "Mcq",
      examinerPermission: "Yes",
      examinerDateTime: "2025-11-05 14:30",
      analysisPermission: "Yes",
      analysisDateTime: "2025-11-05 14:30",
      meritPermission: "No",
      meritDateTime: "---",
      highestMarksPermission: "No",
      highestMarksDateTime: "---"
    }
  ]);
  const [selectedLogExam, setSelectedLogExam] = useState<any | null>(null);
  const [examLogHistory, setExamLogHistory] = useState<Array<{
    dateTime: string;
    action: string;
    user: string;
  }>>([
    { dateTime: "2025-08-22 15:21 PM", action: "Enabled Show Merit Position", user: "nazmulriad4@gmail.com" },
    { dateTime: "2025-08-22 15:21 PM", action: "Enabled Show Highest Marks", user: "nazmulriad4@gmail.com" },
    { dateTime: "2025-08-22 15:21 PM", action: "Enabled Student Analysis Report Permission", user: "nazmulriad4@gmail.com" },
    { dateTime: "2025-09-08 15:00 PM", action: "Enabled Examiner Permission", user: "nazmulriad4@gmail.com" },
  ]);
  const [examPermToast, setExamPermToast] = useState<string | null>(null);

  // Examiner Permission & Bulk Permission States
  const [isBulkPermissionActive, setIsBulkPermissionActive] = useState<boolean>(false);
  const [managePermFilters, setManagePermFilters] = useState({
    organization: 'All Organization',
    program: 'All Program',
    session: 'All Session',
    course: 'All Course',
    subject: 'All Subject',
    tpin: '',
    mobileNumber: '',
    permissionStatus: 'Permission Status',
    teacherLevel: 'Teacher Level',
    status: 'Status',
    displayPerPage: '10'
  });
  const [examinerBulkFilters, setExaminerBulkFilters] = useState({
    organization: 'Select Organization',
    program: 'Select Program',
    session: 'Select Session',
    course: 'Select All',
    subject: 'Select All',
    version: 'All',
    permissionStatus: 'All',
    teacherLevel: 'Teacher Level',
    tpin: ''
  });
  const [examinerSearchSubmitted, setExaminerSearchSubmitted] = useState<boolean>(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showBulkDetailView, setShowBulkDetailView] = useState<boolean>(false);
  const [bulkRegularChecked, setBulkRegularChecked] = useState<boolean>(true);
  const [bulkExpertChecked, setBulkExpertChecked] = useState<boolean>(true);
  const [bulkReviewRequestChecked, setBulkReviewRequestChecked] = useState<boolean>(true);
  const [examinerReviewPermissions, setExaminerReviewPermissions] = useState<Record<string, boolean>>({
    '17304': true,
    '21350': true,
    '6116': true,
    '21809': false,
    '25380': true,
    '28314': false,
  });
  const [bulkPrograms, setBulkPrograms] = useState([
    {
      column: 1,
      programs: [
        {
          id: "v_ka_gst_2025_offline",
          name: "Varsity 'KA' + GST Full Course 2025 [Offline]",
          checked: false,
          subjects: [
            { id: "v_ka_gst_bio", name: "Biology", checked: true },
            { id: "v_ka_gst_phy", name: "Physics", checked: true },
            { id: "v_ka_gst_chem", name: "Chemistry", checked: true },
            { id: "v_ka_gst_math", name: "Higher Mathematics", checked: true },
            { id: "v_ka_gst_mental", name: "Mental Ability", checked: false },
          ]
        },
        {
          id: "v_ka_prev_q_mt",
          name: "Varsity 'KA' Previous Question Model Test",
          checked: false,
          subjects: [
            { id: "v_ka_prev_bng", name: "Bangla", checked: true },
            { id: "v_ka_prev_eng", name: "English", checked: true },
            { id: "v_ka_prev_ict", name: "ICT", checked: true },
            { id: "v_ka_prev_bio", name: "Biology", checked: true },
            { id: "v_ka_prev_phy", name: "Physics", checked: true },
            { id: "v_ka_prev_chem", name: "Chemistry", checked: true },
            { id: "v_ka_prev_math", name: "Higher Mathematics", checked: true },
            { id: "v_ka_prev_biomath", name: "Biology+Math", checked: false },
            { id: "v_ka_prev_analytical", name: "Analytical Skills", checked: false },
            { id: "v_ka_prev_ictmath", name: "ICT + Math", checked: false },
          ]
        }
      ]
    },
    {
      column: 2,
      programs: [
        {
          id: "med_weekly_v_service",
          name: "Medical Weekly Exam Varsity Students Service",
          checked: false,
          subjects: [
            { id: "med_wk_eng", name: "English", checked: true },
            { id: "med_wk_bio", name: "Biology", checked: true },
            { id: "med_wk_phy", name: "Physics", checked: true },
            { id: "med_wk_chem", name: "Chemistry", checked: true },
            { id: "med_wk_gk", name: "General Knowledge", checked: true },
          ]
        },
        {
          id: "gst_agri_prev_q_mt",
          name: "GST & Agri Guccho Previous Question Model Test",
          checked: false,
          subjects: [
            { id: "gst_agri_bng", name: "Bangla", checked: true },
            { id: "gst_agri_eng", name: "English", checked: true },
            { id: "gst_agri_ict", name: "ICT", checked: true },
            { id: "gst_agri_bio", name: "Biology", checked: true },
            { id: "gst_agri_phy", name: "Physics", checked: true },
            { id: "gst_agri_chem", name: "Chemistry", checked: true },
            { id: "gst_agri_math", name: "Higher Mathematics", checked: true },
            { id: "gst_agri_analytical", name: "Analytical Skills", checked: false },
          ]
        }
      ]
    },
    {
      column: 3,
      programs: [
        {
          id: "v_ka_batch_all_2025",
          name: "Varsity 'KA' Exam Batch + All Materials 2025",
          checked: false,
          subjects: [
            { id: "v_ka_batch_bio", name: "Biology", checked: true },
            { id: "v_ka_batch_phy", name: "Physics", checked: true },
            { id: "v_ka_batch_chem", name: "Chemistry", checked: true },
            { id: "v_ka_batch_math", name: "Higher Mathematics", checked: true },
            { id: "v_ka_batch_mental", name: "Mental Ability", checked: false },
          ]
        },
        {
          id: "du_ka_prev_q_mt",
          name: "DU 'KA' Previous Question Model Test",
          checked: false,
          subjects: [
            { id: "du_ka_bng", name: "Bangla", checked: true },
            { id: "du_ka_eng", name: "English", checked: true },
            { id: "du_ka_ict", name: "ICT", checked: true },
            { id: "du_ka_bio", name: "Biology", checked: true },
            { id: "du_ka_phy", name: "Physics", checked: true },
            { id: "du_ka_chem", name: "Chemistry", checked: true },
            { id: "du_ka_math", name: "Higher Mathematics", checked: true },
          ]
        },
        {
          id: "v_ka_online_exam_2025",
          name: "Varsity 'KA' Online Exam 2025",
          checked: false,
          subjects: [
            { id: "v_ka_on_bio", name: "Biology", checked: true },
            { id: "v_ka_on_phy", name: "Physics", checked: true },
            { id: "v_ka_on_chem", name: "Chemistry", checked: true },
            { id: "v_ka_on_math", name: "Higher Mathematics", checked: true },
            { id: "v_ka_on_bng", name: "Bangla", checked: true },
            { id: "v_ka_on_eng", name: "English", checked: true },
            { id: "v_ka_on_ict", name: "ICT", checked: true },
            { id: "v_ka_on_mental", name: "Mental Ability", checked: false },
          ]
        }
      ]
    }
  ]);

  // Update Permission Modal States
  const [updatePermissionExam, setUpdatePermissionExam] = useState<any | null>(null);
  const [updatePermissionField, setUpdatePermissionField] = useState<'examinerPermission' | 'analysisPermission' | 'meritPermission' | 'highestMarksPermission' | null>(null);
  const [modalPermissionValue, setModalPermissionValue] = useState<boolean>(true);
  const [modalStartTime, setModalStartTime] = useState<string>("");
  const [modalEndTime, setModalEndTime] = useState<string>("");
  const [modalSubjects, setModalSubjects] = useState<Array<{ id: string; name: string; checked: boolean }>>([
    { id: "physics", name: "Physics", checked: false },
    { id: "chemistry", name: "Chemistry", checked: false },
    { id: "higherMath", name: "Higher Math", checked: false },
  ]);
  const [modalAllSubjectsChecked, setModalAllSubjectsChecked] = useState<boolean>(false);

  const [adminReviewRows, setAdminReviewRows] = useState([
    {
      id: 'ADR-001',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 1',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 941,
      reviewStatus: 'Not Reviewed'
    },
    {
      id: 'ADR-002',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'English',
      question: 'Unique Set: 1, Question Serial: 1',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 99,
      reviewStatus: 'Reviewed',
      adminId: 'faisal.7402@udvash.net',
      reviewedTime: '2026-07-17 08:30 PM'
    },
    {
      id: 'ADR-003',
      program: 'College Admission Program',
      session: '2026',
      course: 'HCC All Service',
      examSubject: '[102] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 1',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 419,
      reviewStatus: 'Rechecked from Student',
      adminId: 'Suja.7146@udvash.net',
      reviewedTime: '2026-07-16 11:20 AM'
    },
    {
      id: 'ADR-004',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 2',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 1059,
      reviewStatus: 'Rechecked from Admin',
      adminId: 'nazmul.2853@udvash.net',
      reviewedTime: '2026-07-15 05:45 PM'
    },
    {
      id: 'ADR-005',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'English',
      question: 'Unique Set: 1, Question Serial: 2',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 115,
      reviewStatus: 'Not Reviewed'
    },
    {
      id: 'ADR-006',
      program: 'College Admission Program',
      session: '2026',
      course: 'HCC All Service',
      examSubject: '[102] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 2',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 488,
      reviewStatus: 'Reviewed',
      adminId: 'yeasin.9206@udvash.net',
      reviewedTime: '2026-07-14 10:15 AM'
    },
    {
      id: 'ADR-007',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 3',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 1059,
      reviewStatus: 'Not Reviewed'
    },
    {
      id: 'ADR-008',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'English',
      question: 'Unique Set: 1, Question Serial: 3',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 111,
      reviewStatus: 'Rechecked from Student',
      adminId: 'nazmul.2853@udvash.net',
      reviewedTime: '2026-07-13 04:20 PM'
    },
    {
      id: 'ADR-009',
      program: 'College Admission Program',
      session: '2026',
      course: 'HCC All Service',
      examSubject: '[102] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 3',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 492,
      reviewStatus: 'Rechecked from Admin',
      adminId: 'nazmul.7413@udvash.net',
      reviewedTime: '2026-07-12 09:10 AM'
    },
    {
      id: 'ADR-010',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 4',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 954,
      reviewStatus: 'Reviewed',
      adminId: 'faisal.7402@udvash.net',
      reviewedTime: '2026-07-11 02:30 PM'
    },
    {
      id: 'ADR-011',
      program: 'College Admission Program',
      session: '2026',
      course: 'NDC & SJC All Service',
      examSubject: '[126] - (Physics)',
      examType: 'Online Written',
      evaluationType: 'Regular',
      version: 'Bangla',
      question: 'Unique Set: 1, Question Serial: 7',
      minMarks: '0',
      maxMarks: '1',
      totalScript: 1210,
      reviewStatus: 'Not Reviewed'
    }
  ]);

  const [reviewRecords, setReviewRecords] = useState([
    {
      id: 'REV-001',
      rollNumber: '104825',
      studentName: 'Tahmid Rahman',
      examName: 'Higher Math 2nd Paper Live Exam-03',
      courseName: "HSC'26 Model Test Online Service [HSC MT - 2026]",
      subject: 'Math',
      obtainedMarks: '8.5',
      maxMarks: '10',
      examinerName: 'Md Jahangir Alam (2009)',
      evaluationType: 'Regular',
      reviewStatus: 'Not Reviewed',
      requestDate: '2026-06-30 04:30 PM',
      comment: 'Please check Q3 step evaluation. I believe I deserve 1.5 marks more.'
    },
    {
      id: 'REV-002',
      rollNumber: '203841',
      studentName: 'Anika Tabassum',
      examName: 'Paper Final Live Exam Physics 1st Paper',
      courseName: 'Employee Training Course [ETP - 2021]',
      subject: 'Physics',
      obtainedMarks: '6.0',
      maxMarks: '10',
      examinerName: 'Al Jubair Hasan (2020)',
      evaluationType: 'Regular',
      reviewStatus: 'Reviewed',
      requestDate: '2026-06-29 11:15 AM',
      comment: 'Verify standard formula deduction.'
    },
    {
      id: 'REV-003',
      rollNumber: '105772',
      studentName: 'Sabbir Ahmed',
      examName: 'Weekly CQ Test Chemistry - Acids & Bases',
      courseName: 'Class 11 Progressive Service 2026 [11 AP - 2026]',
      subject: 'Chemistry',
      obtainedMarks: '4.5',
      maxMarks: '10',
      examinerName: 'Md Al Amin (2022)',
      evaluationType: 'Regular',
      reviewStatus: 'Rechecked from Student',
      requestDate: '2026-06-28 09:20 AM',
      comment: 'Review step 3 reaction balance.'
    },
    {
      id: 'REV-004',
      rollNumber: '110489',
      studentName: 'Nafis Fuad',
      examName: 'Midterm Evaluation English Literature',
      courseName: 'HSC Bangla-English Full Course Online [HSC BE O - 2026]',
      subject: 'English',
      obtainedMarks: '9.0',
      maxMarks: '10',
      examinerName: 'M. Nazmul Alam (1021)',
      evaluationType: 'Regular',
      reviewStatus: 'Not Reviewed',
      requestDate: '2026-06-30 02:45 PM',
      comment: 'Formatting and essay outline evaluation inquiry.'
    }
  ]);

  const [adminForwardedRequests, setAdminForwardedRequests] = useState([
    {
      id: "FWD-STU-001",
      examiner: { id: "7380", name: "Nafisa", phone: "" },
      course: "NDC & SJC All Service [CAP - 2026]",
      subject: "Islam [TW]",
      exam: "Daily Exam For NDC Islam-03-04",
      adminId: "Suja.7146@udvash.net",
      note: "Boi dekhen, bissobasi hobe",
      date: "2026-07-18 06:18 PM",
      status: "Pending Teacher Response",
      organization: "UDVASH",
      program: "College Admission Program",
      session: "2026",
      examType: "Daily Exam",
      version: "Bangla",
      questionSerial: "3",
      uniqueSet: "1",
      evaluationType: "Regular",
      reviewRequest: "Rechecked from Student",
      rollNumber: "24171101007",
      minMarks: "0",
      maxMarks: "1",
      reviewCount: 1
    },
    {
      id: "FWD-STU-002",
      examiner: { id: "30645", name: "Labonnya", phone: "" },
      course: "HSC Bangla-English Full Course [Online]",
      subject: "Bangla [TW]",
      exam: "Daily Live Written Exam Bangla-01",
      adminId: "nazmul.2853@udvash.net",
      note: "Kebol bohubrihi lekhle Hoy na?",
      date: "2026-07-18 06:55 PM",
      status: "Pending Teacher Response",
      organization: "UDVASH",
      program: "HSC BE O-2027",
      session: "2027",
      examType: "Daily Exam",
      version: "Bangla",
      questionSerial: "1",
      uniqueSet: "2",
      evaluationType: "Regular",
      reviewRequest: "Rechecked from Student",
      rollNumber: "14216600394",
      minMarks: "0",
      maxMarks: "1",
      reviewCount: 1
    },
    {
      id: "FWD-STU-003",
      examiner: { id: "29974", name: "Reyad", phone: "" },
      course: "NDC & SJC All Service [CAP - 2026]",
      subject: "Physics [TW]",
      exam: "Daily Live Exam For NDC Physics-03-04",
      adminId: "faisal.7402@udvash.net",
      note: "সেটিই তো লিখছি",
      date: "2026-07-18 06:13 PM",
      status: "Pending Teacher Response",
      organization: "UDVASH",
      program: "College Admission Program",
      session: "2026",
      examType: "Daily Exam",
      version: "Bangla",
      questionSerial: "5",
      uniqueSet: "1",
      evaluationType: "Regular",
      reviewRequest: "Rechecked from Student",
      rollNumber: "10130400401",
      minMarks: "0",
      maxMarks: "1",
      reviewCount: 1
    },
    {
      id: "FWD-005",
      examiner: { id: "10321", name: "M. Nazmul Alam", phone: "8801701234567" },
      course: "HSC Bangla-English Full Course [Online]",
      subject: "Ban",
      exam: "Daily Live Written Exam Bangla 2nd-102",
      examCode: "130 ",
      adminId: "nazmul.2853@udvash.net",
      note: "খাতাটি পুনঃ মূল্যায়ন করো।",
      date: "2026-07-04 11:30 AM",
      status: "Pending Teacher Response",
      organization: "UDVASH",
      program: "HSC BE O-2027",
      session: "2027",
      examType: "Daily Exam",
      version: "Bangla",
      questionSerial: "2",
      uniqueSet: "1",
      evaluationType: "Regular",
      reviewRequest: "Not Reviewed",
      rollNumber: "902150",
      minMarks: "15",
      maxMarks: "25",
      reviewCount: 2,
      isMultiple: false,
      totalScriptsCount: 1,
      checkedScriptsCount: 1
    },
    {
      id: "FWD-001",
      examiner: { id: "17304", name: "Sakib Imtiaz Rony", phone: "8801303067268" },
      course: "Engineering Admission Program [EAP - 2026]",
      subject: "Physics [TW]",
      exam: "Weekly Engineering Written Test-02",
      adminId: "nazmul.7413@udvash.net",
      note: "৩ নং প্রশ্নের উত্তরটি আবার চেক করুন। শিক্ষার্থীর দাবী আংশিক সঠিক মনে হচ্ছে।",
      date: "2026-07-02 10:15 AM",
      status: "Pending Teacher Response",
      organization: "UDVASH",
      program: "Engineering Admission Program",
      session: "2026",
      examType: "Weekly Test",
      version: "Bangla",
      questionSerial: "1",
      uniqueSet: "1",
      evaluationType: "Regular",
      reviewRequest: "Not Reviewed",
      rollNumber: "902150",
      minMarks: "15",
      maxMarks: "25",
      reviewCount: 3,
      isMultiple: true,
      totalScriptsCount: 10,
      checkedScriptsCount: 3
    },
    {
      id: "FWD-002",
      examiner: { id: "21350", name: "Shajed Ahmed Chowdhury", phone: "8801902139021" },
      course: "NDC & SJC All Service [CAP - 2026]",
      subject: "Biology [TW]",
      exam: "Daily Exam For NDC Biology-03-04",
      adminId: "faisal.7402@udvash.net",
      note: "৪ নং প্রশ্নের উত্তরটির ডায়াগ্রাম লেবেলিং নিয়ম অনুযায়ী রি-ভ্যালু করুন।",
      date: "2026-07-02 12:40 PM",
      status: "In Progress",
      organization: "UNMESH",
      program: "College Admission Program",
      session: "2026",
      examType: "Daily Exam",
      version: "Bangla",
      questionSerial: "1",
      uniqueSet: "1",
      evaluationType: "Top Student",
      reviewRequest: "Reviewed",
      rollNumber: "804123",
      minMarks: "18",
      maxMarks: "20",
      reviewCount: 5
    },
    {
      id: "FWD-003",
      examiner: { id: "10321", name: "M. Nazmul Alam", phone: "8801701234567" },
      course: "Varsity 'KA' + GST Full Course 2025 [Offline]",
      subject: "Chemistry [TW]",
      exam: "GST Chemistry Model Test-05",
      adminId: "Suja.7146@udvash.net",
      note: "শিক্ষার্থীর অভিযোগের প্রেক্ষিতে রসায়নের ২নং সমীকরণটি পুনরায় মূল্যায়ন করুন।",
      date: "2026-07-03 09:30 AM",
      status: "In Progress",
      organization: "UDVASH",
      program: "Engineering Admission Program",
      session: "2026",
      examType: "Weekly Test",
      version: "Bangla",
      questionSerial: "2",
      uniqueSet: "1",
      evaluationType: "Regular",
      reviewRequest: "Rechecked from Student",
      rollNumber: "702155",
      minMarks: "10",
      maxMarks: "20",
      reviewCount: 4
    },
    {
      id: "FWD-004",
      examiner: { id: "20201", name: "Al Jubair Hasan", phone: "8801809876543" },
      course: "Medical Weekly Exam Varsity Students Service",
      subject: "English [TW]",
      exam: "Weekly English Grammer Test-01",
      adminId: "yeasin.9206@udvash.net",
      note: "অ্যাডমিন প্যানেল থেকে প্রাপ্ত নির্দেশনা অনুযায়ী ৫নং সিনট্যাক্স ইরর পুনরায় খতিয়ে দেখুন।",
      date: "2026-07-03 03:15 PM",
      status: "Pending Teacher Response",
      organization: "UNMESH",
      program: "College Admission Program",
      session: "2026",
      examType: "Daily Exam",
      version: "Bangla",
      questionSerial: "5",
      uniqueSet: "1",
      evaluationType: "Regular",
      reviewRequest: "Rechecked from Admin",
      rollNumber: "604189",
      minMarks: "12",
      maxMarks: "15",
      reviewCount: 2
    }
  ]);

  const [studentReviewRequests, setStudentReviewRequests] = useState([
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

  const [isEvalReportCollapsed, setIsEvalReportCollapsed] = useState(false);
  const [evalReportSearchTriggered, setEvalReportSearchTriggered] = useState(true);
  const [evalReportFilters, setEvalReportFilters] = useState({
    reportType: 'Summary',
    organization: '--All Organization--',
    program: '--All Program--',
    session: '--All Session--',
    course: '--All Course--',
    exam: '',
    uniqueSet: 'All Set',
    questionSerial: 'All',
    examType: 'All Exam Type',
    examiner: '',
    startDate: '2026-07-04',
    endDate: '2026-07-04',
    noOfRows: '100',
    orderBy: 'All'
  });

  const [evaluationReports, setEvaluationReports] = useState([
    {
      id: "EVR-001",
      program: "CAP 2026",
      session: "2026",
      course: "NDC & SJC All Service",
      examCode: "127",
      examName: "Daily Live Exam For NDC Physics-05-06",
      examType: "Online Written",
      totalParticipant: 19,
      mcqSubmitted: 6,
      writtenSubmitted: 13,
      writtenEvaluated: 42,
      blankScript: 23,
      writtenPending: 0,
      reviewRequest: 6,
      reviewPending: 0,
      totalEvaluationTime: "12:59",
      maxEvaluationTime: "02:35",
      minEvaluationTime: "00:05",
      avgEvaluationTime: "00:18",
      reportType: "Summary",
      organization: "UDVASH",
      dateTime: "2026-07-04",
      uniqueSet: "Set A",
      questionSerial: "Q1",
      examinerName: "Md Jahangir Alam",
      status: "Evaluated"
    },
    {
      id: "EVR-002",
      program: "CAP 2026",
      session: "2026",
      course: "NDC & SJC All Service",
      examCode: "107",
      examName: "Daily Exam For NDC Chemistry-05-06",
      examType: "Templated Written",
      totalParticipant: 1,
      mcqSubmitted: 1,
      writtenSubmitted: 1,
      writtenEvaluated: 0,
      blankScript: 0,
      writtenPending: 5,
      reviewRequest: 0,
      reviewPending: 0,
      totalEvaluationTime: "-",
      maxEvaluationTime: "-",
      minEvaluationTime: "-",
      avgEvaluationTime: "-",
      reportType: "Summary",
      organization: "UDVASH",
      dateTime: "2026-07-04",
      uniqueSet: "Set B",
      questionSerial: "Q2",
      examinerName: "Al Jubair Hasan",
      status: "Pending"
    },
    {
      id: "EVR-003",
      program: "CAP 2026",
      session: "2026",
      course: "NDC & SJC All Service",
      examCode: "103",
      examName: "Daily Exam For NDC Physics-05-06",
      examType: "Templated Written",
      totalParticipant: 30,
      mcqSubmitted: 30,
      writtenSubmitted: 30,
      writtenEvaluated: 0,
      blankScript: 18,
      writtenPending: 131,
      reviewRequest: 0,
      reviewPending: 0,
      totalEvaluationTime: "-",
      maxEvaluationTime: "-",
      minEvaluationTime: "-",
      avgEvaluationTime: "-",
      reportType: "Summary",
      organization: "UNMESH",
      dateTime: "2026-07-04",
      uniqueSet: "Set A",
      questionSerial: "Q3",
      examinerName: "Md Al Amin",
      status: "Pending"
    },
    {
      id: "EVR-004",
      program: "CAP 2026",
      session: "2026",
      course: "NDC & SJC All Service",
      examCode: "111",
      examName: "Daily Exam For NDC Higher Math-05-06",
      examType: "Templated Written",
      totalParticipant: 43,
      mcqSubmitted: 43,
      writtenSubmitted: 43,
      writtenEvaluated: 0,
      blankScript: 0,
      writtenPending: 215,
      reviewRequest: 0,
      reviewPending: 0,
      totalEvaluationTime: "-",
      maxEvaluationTime: "-",
      minEvaluationTime: "-",
      avgEvaluationTime: "-",
      reportType: "Summary",
      organization: "UDVASH",
      dateTime: "2026-07-04",
      uniqueSet: "Set A",
      questionSerial: "Q4",
      examinerName: "M. Nazmul Alam",
      status: "Pending"
    },
    {
      id: "EVR-005",
      program: "CAP 2026",
      session: "2026",
      course: "NDC & SJC All Service",
      examCode: "127",
      examName: "Physics-05-06 Subject Wise Summary",
      examType: "Online Written",
      totalParticipant: 25,
      mcqSubmitted: 10,
      writtenSubmitted: 15,
      writtenEvaluated: 40,
      blankScript: 5,
      writtenPending: 0,
      reviewRequest: 1,
      reviewPending: 1,
      totalEvaluationTime: "10:30",
      maxEvaluationTime: "01:45",
      minEvaluationTime: "00:08",
      avgEvaluationTime: "00:20",
      reportType: "Subject Wise Summary",
      organization: "UDVASH",
      dateTime: "2026-07-04",
      uniqueSet: "Set A",
      questionSerial: "Q1-Q5",
      examinerName: "Md Jahangir Alam",
      status: "Evaluated"
    },
    {
      id: "EVR-006",
      program: "CAP 2026",
      session: "2026",
      course: "NDC & SJC All Service",
      examCode: "107",
      examName: "Chemistry Teacher Summary",
      examType: "Mcq",
      totalParticipant: 50,
      mcqSubmitted: 50,
      writtenSubmitted: 0,
      writtenEvaluated: 50,
      blankScript: 0,
      writtenPending: 0,
      reviewRequest: 15,
      reviewPending: 0,
      totalEvaluationTime: "05:15",
      maxEvaluationTime: "00:30",
      minEvaluationTime: "00:01",
      avgEvaluationTime: "00:05",
      reportType: "Teacher Wise Summary",
      organization: "UNMESH",
      dateTime: "2026-07-04",
      uniqueSet: "Set A",
      questionSerial: "Q1-Q10",
      examinerName: "Al Jubair Hasan",
      status: "Evaluated"
    },
    {
      id: "EVR-007",
      program: "HSC-2026",
      session: "2026",
      course: "HSC'26 Model Test Online Service",
      examCode: "105",
      examName: "Weekly CQ Test Chemistry - Acids & Bases",
      examType: "Regular Written",
      totalParticipant: 15,
      mcqSubmitted: 0,
      writtenSubmitted: 15,
      writtenEvaluated: 12,
      blankScript: 2,
      writtenPending: 3,
      reviewRequest: 3,
      reviewPending: 0,
      totalEvaluationTime: "08:45",
      maxEvaluationTime: "01:15",
      minEvaluationTime: "00:10",
      avgEvaluationTime: "00:35",
      reportType: "Teacher Subject Question Wise Summary",
      organization: "UDVASH",
      dateTime: "2026-07-03",
      uniqueSet: "Set A",
      questionSerial: "Q5",
      examinerName: "Md Al Amin",
      status: "Evaluated"
    },
    {
      id: "EVR-008",
      program: "HSC-2026",
      session: "2026",
      course: "HSC'26 Model Test Online Service",
      examCode: "105",
      examName: "Weekly CQ Test Chemistry - Acids & Bases",
      examType: "Regular Written",
      totalParticipant: 15,
      mcqSubmitted: 0,
      writtenSubmitted: 15,
      writtenEvaluated: 12,
      blankScript: 2,
      writtenPending: 3,
      reviewRequest: 1,
      reviewPending: 0,
      totalEvaluationTime: "08:45",
      maxEvaluationTime: "01:15",
      minEvaluationTime: "00:10",
      avgEvaluationTime: "00:35",
      reportType: "Teacher Subject Wise Summary",
      organization: "UDVASH",
      dateTime: "2026-07-03",
      uniqueSet: "Set A",
      questionSerial: "Q5",
      examinerName: "Md Al Amin",
      status: "Evaluated"
    }
  ]);

  const [isAddingReport, setIsAddingReport] = useState(false);
  const [newReportForm, setNewReportForm] = useState({
    organization: 'UDVASH',
    program: 'HSC-2026',
    session: '2026',
    course: "HSC'26 Model Test Online Service",
    examCode: '',
    examName: '',
    examType: 'Mcq',
    uniqueSet: 'Set A',
    questionSerial: '',
    studentRoll: '',
    studentName: '',
    examinerName: '',
    marksObtained: '',
    maxMarks: '10',
    reportType: 'Summary'
  });

  const [adminReviewReqFilters, setAdminReviewReqFilters] = useState({
    organization: 'All Organization',
    program: 'All Program',
    session: 'All Session',
    course: 'All Course',
    exam: '',
    examType: 'All Exam Type',
    version: 'All Version',
    questionSerial: 'All Question Serial',
    startDate: '2026-07-02',
    endDate: '2026-07-04',
    examiner: '',
    uniqueSet: 'All Unique Set',
    minMarks: '',
    maxMarks: '',
    rollNumber: '',
    evaluationType: 'All',
    reviewRequest: 'All',
    reviewRequestFrom: 'All',
    displayPerPage: '100'
  });

  const [adminReviewReqSearchTriggered, setAdminReviewReqSearchTriggered] = useState(true);
  const [selectedForwardReq, setSelectedForwardReq] = useState<any>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [adminDashExamType, setAdminDashExamType] = useState('All Exam Type');
  const [adminDashTime, setAdminDashTime] = useState('Last 30 Minute');

  const handleCancelRequest = (id: string) => {
    setAdminForwardedRequests(prev => prev.filter(req => req.id !== id));
    setCancelConfirmId(null);
    alert("Review request has been cancelled successfully. (রিভিউ রিকোয়েস্টটি সফলভাবে বাতিল করা হয়েছে।)");
  };

  const getExaminerDetails = (fullName: string) => {
    const match = fullName.match(/(.*?)\s*\((\d+)\)/);
    if (match) {
      return { name: match[1].trim(), id: match[2] };
    }
    return { name: fullName, id: "17304" };
  };

  const handleDrag = (e: React.DragEvent, type: 'solution' | 'student') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'solution' | 'student') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (type === 'solution') {
        setSolutionFiles(prev => [...prev, ...droppedFiles]);
      } else {
        setStudentFiles(prev => [...prev, ...droppedFiles]);
      }
    }
  };

  const handleSolutionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSolutionFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleStudentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setStudentFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const toggleRotation = (fileName: string) => {
    setRotations(prev => ({
      ...prev,
      [fileName]: ((prev[fileName] || 0) + 90) % 360
    }));
  };

  const handleStartEvaluation = async () => {
    if (solutionFiles.length === 0 || studentFiles.length === 0) {
      alert("Please upload both Solution Key and Student Scripts first.");
      return;
    }

    setIsProcessing(true);
    try {
      const instructions = ENGINE_INSTRUCTIONS[selectedSubject as keyof typeof ENGINE_INSTRUCTIONS] || ENGINE_INSTRUCTIONS['Bangla'];
      const result = await evaluateScript(selectedSubject, instructions, solutionFiles, studentFiles);
      
      setAiEvaluationData(result);
      setEvaluationResult([
        { 
          id: result.studentId || 'S001', 
          name: result.studentName || 'Student 1', 
          score: `${result.totalScore}/${result.maxScore}`, 
          status: 'Evaluated' 
        },
      ]);
      setShowReport(true);
    } catch (error) {
      console.error("Evaluation failed:", error);
      alert("AI Evaluation failed. Please check your API key or try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // State for managing users
  const [usersList, setUsersList] = useState([
    { 
      id: 'nazmulriad4@gmail.com', 
      name: 'Nazmul Riad', 
      email: 'nazmulriad4@gmail.com', 
      password: 'Bd151332303@', 
      role: 'Owner', 
      permissions: [
        'Exam', 'Team', 'Administration',
        'teacher-management', 'user-management',
        'online-script-eval', 'admin-dash', 'examiner-perm', 'eval-report', 'admin-review', 'exam-perm', 'admin-review-req', 'teacher-user-perm',
        'ai-script-eval', 'ai-eval', 'ai-review', 'eval-history',
        'team-hr', 'team-account', 'my-profile', 'my-attendance', 'my-notice',
        'team-apply', 'attendance-adjustment', 'leave',
        'team-management', 'member-directory'
      ] 
    },
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    permissions: [] as string[]
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    setUsersList([...usersList, { 
      id, 
      name: newUser.name, 
      email: newUser.email, 
      role: newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1),
      permissions: newUser.permissions 
    }]);
    
    // Reset form
    setNewUser({ name: '', email: '', password: '', role: 'user', permissions: [] });
  };

  // --- Firebase Synchronization ---
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Load from Firebase on Mount
  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading data from Firebase Firestore...");

        // 1. Users List
        // Delete the three requested users from the database permanently if they exist
        try {
          await dbDeleteItem('users', '1');
          await dbDeleteItem('users', 'nazmul.2853@udvash.net');
          await dbDeleteItem('users', 'admin@org.com');
          await dbDeleteItem('users', 'john@example.com');
        } catch (e) {
          console.error("Error during initial user deletion cleanups:", e);
        }

        const dbUsers = await dbGetItems('users');
        const defaultUsers = [
          { 
            id: 'nazmulriad4@gmail.com', 
            name: 'Nazmul Riad', 
            email: 'nazmulriad4@gmail.com', 
            password: 'Bd151332303@', 
            role: 'Owner', 
            permissions: [
              'Exam', 'Team', 'Administration',
              'teacher-management', 'user-management',
              'online-script-eval', 'admin-dash', 'examiner-perm', 'eval-report', 'admin-review', 'exam-perm', 'admin-review-req', 'teacher-user-perm',
              'ai-script-eval', 'ai-eval', 'ai-review', 'eval-history',
              'team-hr', 'team-account', 'my-profile', 'my-attendance', 'my-notice',
              'team-apply', 'attendance-adjustment', 'leave',
              'team-management', 'member-directory'
            ] 
          },
        ];
        
        // Filter out any of the deleted users that might still be in the loaded list
        let mergedUsers = dbUsers.filter(u => {
          const lowerId = u.id.toLowerCase();
          return lowerId !== '1' && lowerId !== 'nazmul.2853@udvash.net' && lowerId !== 'admin@org.com' && lowerId !== 'john@example.com';
        });
        let hasModified = false;
        
        // Only seed default users if the database is completely empty (first run setup)
        if (mergedUsers.length === 0) {
          for (const defaultU of defaultUsers) {
            mergedUsers.push(defaultU);
            await dbSaveItem('users', defaultU.id, defaultU);
            hasModified = true;
          }
        } else {
          // Guarantee that the main Owner account 'nazmulriad4@gmail.com' is ALWAYS present and has correct fields.
          for (const defaultU of defaultUsers) {
            const idx = mergedUsers.findIndex(u => u.id.toLowerCase() === defaultU.id.toLowerCase());
            if (idx !== -1) {
              let isUpdated = false;
              if (!mergedUsers[idx].password || 
                  (defaultU.id.toLowerCase() === 'nazmulriad4@gmail.com' && 
                   mergedUsers[idx].password !== 'Bd151332303@')) {
                mergedUsers[idx].password = defaultU.password;
                isUpdated = true;
              }
              if (mergedUsers[idx].role !== defaultU.role) {
                mergedUsers[idx].role = defaultU.role;
                isUpdated = true;
              }
              if (!mergedUsers[idx].permissions || mergedUsers[idx].permissions.length < defaultU.permissions.length) {
                mergedUsers[idx].permissions = defaultU.permissions;
                isUpdated = true;
              }
              if (isUpdated) {
                await dbSaveItem('users', defaultU.id, mergedUsers[idx]);
                hasModified = true;
              }
            } else {
              // Guarantee Owner account always exists
              mergedUsers.push(defaultU);
              await dbSaveItem('users', defaultU.id, defaultU);
              hasModified = true;
            }
          }
        }
        setUsersList(mergedUsers);

        // 2. Exam Permissions
        const dbExamPerms = await dbGetItems('exam_permissions');
        if (dbExamPerms.length === 0) {
          // Seed initial permissions
          for (const p of examPermissions) {
            await dbSaveItem('exam_permissions', p.id, p);
          }
        } else {
          setExamPermissions(dbExamPerms);
        }

        // 3. Review Records
        const dbReviews = await dbGetItems('review_records');
        if (dbReviews.length === 0) {
          // Seed initial review records
          for (const r of reviewRecords) {
            await dbSaveItem('review_records', r.id, r);
          }
        } else {
          setReviewRecords(dbReviews);
        }

        // 4. Admin Forwarded Requests
        const dbForwarded = await dbGetItems('admin_forwarded_requests');
        if (dbForwarded.length === 0) {
          // Seed initial forwarded requests
          for (const f of adminForwardedRequests) {
            await dbSaveItem('admin_forwarded_requests', f.id, f);
          }
        } else {
          setAdminForwardedRequests(dbForwarded);
        }

        // 5. Student Review Requests
        const dbStudentReviews = await dbGetItems('student_review_requests');
        if (dbStudentReviews.length === 0) {
          // Seed initial student review requests
          for (const sr of studentReviewRequests) {
            await dbSaveItem('student_review_requests', sr.id, sr);
          }
        } else {
          setStudentReviewRequests(dbStudentReviews);
        }

        // 6. Evaluation Reports
        const dbEvalReports = await dbGetItems('evaluation_reports');
        const hasOldSchema = dbEvalReports.length > 0 && !('totalParticipant' in dbEvalReports[0]);
        if (dbEvalReports.length === 0 || hasOldSchema) {
          if (hasOldSchema) {
            for (const item of dbEvalReports) {
              await dbDeleteItem('evaluation_reports', item.id);
            }
          }
          // Seed initial evaluation reports
          for (const evr of evaluationReports) {
            await dbSaveItem('evaluation_reports', evr.id, evr);
          }
        } else {
          setEvaluationReports(dbEvalReports);
        }

        setIsDbLoaded(true);
        console.log("Firebase data successfully loaded and synchronized!");
      } catch (error) {
        console.error("Error loading data from Firebase:", error);
      }
    }
    loadData();
  }, []);

  // Save/Sync modifications automatically to Firebase
  useEffect(() => {
    if (!isDbLoaded) return;

    async function syncUsers() {
      try {
        const dbUsers = await dbGetItems('users');
        for (const dbU of dbUsers) {
          if (!usersList.some(u => u.id === dbU.id)) {
            await dbDeleteItem('users', dbU.id);
          }
        }
        for (const u of usersList) {
          await dbSaveItem('users', u.id, u);
        }
      } catch (error) {
        console.error("Failed to sync users list with Firebase:", error);
      }
    }
    syncUsers();
  }, [usersList, isDbLoaded]);

  // If currently logged-in user is deleted from usersList, log them out immediately. Also sync updated roles/permissions.
  useEffect(() => {
    if (!isDbLoaded || !currentUser) return;
    const currentRecord = usersList.find(u => u.id.toLowerCase() === currentUser.id.toLowerCase());
    if (!currentRecord) {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      setIsProfileOpen(false);
      setLoginEmail('');
      setLoginPassword('');
      alert("আপনার অ্যাকাউন্টটি স্থায়ীভাবে ডিলিট করা হয়েছে। অনুগ্রহ করে আবার লগ ইন করুন বা সিস্টেম ওনারের সাথে যোগাযোগ করুন।\n\n(Your account has been permanently deleted. Logging out of session.)");
    } else {
      // Check if details have changed
      const hasChanged = 
        currentRecord.name !== currentUser.name ||
        currentRecord.role !== currentUser.role ||
        JSON.stringify(currentRecord.permissions) !== JSON.stringify(currentUser.permissions);
        
      if (hasChanged) {
        setCurrentUser(currentRecord);
        localStorage.setItem('currentUser', JSON.stringify(currentRecord));
      }
    }
  }, [usersList, isDbLoaded, currentUser]);

  useEffect(() => {
    if (!isDbLoaded) return;

    async function syncExamPermissions() {
      try {
        const dbPerms = await dbGetItems('exam_permissions');
        for (const dbP of dbPerms) {
          if (!examPermissions.some(p => p.id === dbP.id)) {
            await dbDeleteItem('exam_permissions', dbP.id);
          }
        }
        for (const p of examPermissions) {
          await dbSaveItem('exam_permissions', p.id, p);
        }
      } catch (error) {
        console.error("Failed to sync exam permissions with Firebase:", error);
      }
    }
    syncExamPermissions();
  }, [examPermissions, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;

    async function syncReviewRecords() {
      try {
        const dbReviews = await dbGetItems('review_records');
        for (const dbR of dbReviews) {
          if (!reviewRecords.some(r => r.id === dbR.id)) {
            await dbDeleteItem('review_records', dbR.id);
          }
        }
        for (const r of reviewRecords) {
          await dbSaveItem('review_records', r.id, r);
        }
      } catch (error) {
        console.error("Failed to sync review records with Firebase:", error);
      }
    }
    syncReviewRecords();
  }, [reviewRecords, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;

    async function syncForwardedRequests() {
      try {
        const dbForwarded = await dbGetItems('admin_forwarded_requests');
        for (const dbF of dbForwarded) {
          if (!adminForwardedRequests.some(f => f.id === dbF.id)) {
            await dbDeleteItem('admin_forwarded_requests', dbF.id);
          }
        }
        for (const f of adminForwardedRequests) {
          await dbSaveItem('admin_forwarded_requests', f.id, f);
        }
      } catch (error) {
        console.error("Failed to sync admin forwarded requests with Firebase:", error);
      }
    }
    syncForwardedRequests();
  }, [adminForwardedRequests, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;

    async function syncStudentReviewRequests() {
      try {
        const dbStudentReviews = await dbGetItems('student_review_requests');
        for (const dbSR of dbStudentReviews) {
          if (!studentReviewRequests.some(sr => sr.id === dbSR.id)) {
            await dbDeleteItem('student_review_requests', dbSR.id);
          }
        }
        for (const sr of studentReviewRequests) {
          await dbSaveItem('student_review_requests', sr.id, sr);
        }
      } catch (error) {
        console.error("Failed to sync student review requests with Firebase:", error);
      }
    }
    syncStudentReviewRequests();
  }, [studentReviewRequests, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;

    async function syncEvaluationReports() {
      try {
        const dbEvalReports = await dbGetItems('evaluation_reports');
        for (const dbEVR of dbEvalReports) {
          if (!evaluationReports.some(evr => evr.id === dbEVR.id)) {
            await dbDeleteItem('evaluation_reports', dbEVR.id);
          }
        }
        for (const evr of evaluationReports) {
          await dbSaveItem('evaluation_reports', evr.id, evr);
        }
      } catch (error) {
        console.error("Failed to sync evaluation reports with Firebase:", error);
      }
    }
    syncEvaluationReports();
  }, [evaluationReports, isDbLoaded]);

  const togglePermission = (permId: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId) 
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const toggleAllInModule = (module: TopNavTab) => {
    const moduleItemsSource = sidebarItemsMap[module];
    const moduleItemIds = moduleItemsSource.flatMap(item => 
      item.subItems ? [item.id, ...item.subItems.map(s => s.id)] : [item.id]
    );

    const allPresent = moduleItemIds.every(id => newUser.permissions.includes(id));
    
    if (allPresent) {
      setNewUser(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !moduleItemIds.includes(p))
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...moduleItemIds]))
      }));
    }
  };

  const sidebarItemsMap: Record<TopNavTab, SidebarItem[]> = {
    'Administration': [
      { id: 'teacher-management', label: 'Teacher Management' },
      { id: 'user-management', label: 'User Management' },
    ],
    'Exam': [
      { 
        id: 'online-script-eval', 
        label: 'Online Script Evaluation',
        subItems: [
          { id: 'admin-dash', label: 'Admin Dashboard' },
          { id: 'examiner-perm', label: 'Examiner Permission' },
          { id: 'eval-report', label: 'Evaluation Report' },
          { id: 'admin-review', label: 'Admin Review' },
          { id: 'exam-perm', label: 'Exam Permission' },
          { id: 'admin-review-req', label: 'Review Request' },
          { id: 'teacher-user-perm', label: 'Assign Teacher User Permission' },
        ]
      },
      { 
        id: 'ai-script-eval', 
        label: 'AI Script Evaluation',
        subItems: [
          { id: 'ai-eval', label: 'AI Evaluation' },
          { id: 'ai-review', label: 'Review' },
          { id: 'eval-history', label: 'Evaluation History' },
        ]
      },
    ],
    'Team': [
      { id: 'team-hr', label: 'Hr' },
      { 
        id: 'team-account', 
        label: 'My Account',
        subItems: [
          { id: 'my-profile', label: 'My Profile' },
          { id: 'my-attendance', label: 'My Attendance' },
          { id: 'my-notice', label: 'My Notice' },
        ]
      },
      { 
        id: 'team-apply', 
        label: 'Apply For',
        subItems: [
          { id: 'attendance-adjustment', label: 'Attendance Adjustment' },
          { id: 'leave', label: 'Leave' },
        ]
      },
      { 
        id: 'team-management', 
        label: 'Member Management',
        subItems: [
          { id: 'member-directory', label: 'Member Directory' },
        ]
      },
    ],
  };

  const currentSidebarItems = sidebarItemsMap[activeTab] || [];

  const permittedTabs = useMemo(() => {
    if (!currentUser) return [];
    
    const role = (currentUser.id?.toLowerCase() === 'nazmulriad4@gmail.com' || currentUser.id?.toLowerCase() === 'nazmul.2853@udvash.net') 
      ? 'Owner' 
      : (currentUser.role || 'User');
      
    if (role === 'Owner') {
      return ['Exam', 'Team', 'Administration'] as TopNavTab[];
    }
    
    const allTabs = ['Exam', 'Team', 'Administration'] as TopNavTab[];
    return allTabs.filter(tab => {
      // If the tab ID is explicitly in permissions
      if (currentUser.permissions?.includes(tab)) return true;
      
      // Or if any item in the tab is permitted
      const items = sidebarItemsMap[tab] || [];
      return items.some(item => {
        if (currentUser.permissions?.includes(item.id)) return true;
        if (item.subItems) {
          return item.subItems.some(sub => currentUser.permissions?.includes(sub.id));
        }
        return false;
      });
    });
  }, [currentUser]);

  const filteredSidebarItems = useMemo(() => {
    if (!currentUser) return [];

    const role = (currentUser.id?.toLowerCase() === 'nazmulriad4@gmail.com' || currentUser.id?.toLowerCase() === 'nazmul.2853@udvash.net') 
      ? 'Owner' 
      : (currentUser.role || 'User');
      
    const isOwner = role === 'Owner';
    const isUser = role === 'User';

    const allowedItems = currentSidebarItems.map(item => {
      if (isOwner) return item;

      // Users with 'User' role are strictly blocked from User Management
      if (isUser && item.id === 'user-management') {
        return null;
      }

      const hasItemPermission = currentUser.permissions?.includes(item.id);

      if (item.subItems) {
        const allowedSub = item.subItems.filter(sub => {
          if (isUser && sub.id === 'user-management') return false;
          return currentUser.permissions?.includes(sub.id);
        });
        if (allowedSub.length > 0) {
          return {
            ...item,
            subItems: allowedSub
          };
        }
        return hasItemPermission ? { ...item, subItems: [] } : null;
      }

      return hasItemPermission ? item : null;
    }).filter((item): item is SidebarItem => item !== null);

    return allowedItems.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subItems?.some(sub => sub.label.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, currentSidebarItems, currentUser]);

  // Handle auto-correction and redirection if active page is not permitted
  useEffect(() => {
    if (!currentUser || !isDbLoaded) return;
    
    const role = (currentUser.id?.toLowerCase() === 'nazmulriad4@gmail.com' || currentUser.id?.toLowerCase() === 'nazmul.2853@udvash.net') 
      ? 'Owner' 
      : (currentUser.role || 'User');
      
    if (role === 'Owner') return;

    // 1. Is activeTab permitted?
    if (!permittedTabs.includes(activeTab)) {
      if (permittedTabs.length > 0) {
        setActiveTab(permittedTabs[0]);
        return;
      }
    }

    // 2. Is activeSidebarItem permitted within activeTab?
    const currentItems = sidebarItemsMap[activeTab] || [];
    const allowed = currentItems.map(item => {
      if (role === 'User' && item.id === 'user-management') return null;
      const hasItemPermission = currentUser.permissions?.includes(item.id);
      if (item.subItems) {
        const allowedSub = item.subItems.filter(sub => {
          if (role === 'User' && sub.id === 'user-management') return false;
          return currentUser.permissions?.includes(sub.id);
        });
        if (allowedSub.length > 0) return { ...item, subItems: allowedSub };
        return hasItemPermission ? { ...item, subItems: [] } : null;
      }
      return hasItemPermission ? item : null;
    }).filter(Boolean) as SidebarItem[];

    if (allowed.length > 0) {
      const isItemPermitted = allowed.some(i => i.id === activeSidebarItem);
      if (!isItemPermitted) {
        const first = allowed[0];
        setActiveSidebarItem(first.id);
        setExpandedItemId(first.id);
        if (first.subItems && first.subItems.length > 0) {
          setActiveSubItem(first.subItems[0].id);
        } else {
          setActiveSubItem(null);
        }
      } else {
        // 3. Is activeSubItem permitted?
        const currentItem = allowed.find(i => i.id === activeSidebarItem);
        if (currentItem && currentItem.subItems && currentItem.subItems.length > 0) {
          const isSubPermitted = currentItem.subItems.some(s => s.id === activeSubItem);
          if (!isSubPermitted) {
            setActiveSubItem(currentItem.subItems[0].id);
          }
        } else {
          setActiveSubItem(null);
        }
      }
    }
  }, [currentUser, isDbLoaded, activeTab, permittedTabs]);

  // Set default active sidebar item when tab changes explicitly by user
  React.useEffect(() => {
    if (!currentUser) return;
    
    const role = (currentUser.id?.toLowerCase() === 'nazmulriad4@gmail.com' || currentUser.id?.toLowerCase() === 'nazmul.2853@udvash.net') 
      ? 'Owner' 
      : (currentUser.role || 'User');
      
    const currentItems = sidebarItemsMap[activeTab] || [];
    const allowed = currentItems.map(item => {
      if (role === 'User' && item.id === 'user-management') return null;
      if (role === 'Owner') return item;
      const hasItemPermission = currentUser.permissions?.includes(item.id);
      if (item.subItems) {
        const allowedSub = item.subItems.filter(sub => {
          if (role === 'User' && sub.id === 'user-management') return false;
          return currentUser.permissions?.includes(sub.id);
        });
        if (allowedSub.length > 0) return { ...item, subItems: allowedSub };
        return hasItemPermission ? { ...item, subItems: [] } : null;
      }
      return hasItemPermission ? item : null;
    }).filter(Boolean) as SidebarItem[];

    if (allowed && allowed.length > 0) {
      const firstItem = allowed[0];
      setActiveSidebarItem(firstItem.id);
      setExpandedItemId(firstItem.id);
      if (firstItem.subItems && firstItem.subItems.length > 0) {
        setActiveSubItem(firstItem.subItems[0].id);
      } else {
        setActiveSubItem(null);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedReviewRow) {
      let matchedIndex = 0;
      const subjectLower = (selectedReviewRow.subject || selectedReviewRow.examSubject || "").toLowerCase();
      const questionText = (selectedReviewRow.question || "").toLowerCase();
      
      if (subjectLower.includes('physics') || questionText.includes('টেরাগাম') || questionText.includes('900m')) {
        matchedIndex = 1;
      } else if (subjectLower.includes('english') || questionText.includes('principal') || selectedReviewRow.version === 'English') {
        matchedIndex = 2;
      } else if (subjectLower.includes('math') || questionText.includes('√3') || questionText.includes('x অক্ষের')) {
        matchedIndex = 3;
      }
      
      setActiveScriptIdx(matchedIndex);
      setReviewObtainedMarks(reviewScripts[matchedIndex]?.obtainedMarks || "0.00");
      setForwardToTeacherText("");
      setShowForwardToTeacher(false);
      setForwardSingleChecked(true);
      setForwardMultipleChecked(false);
    }
  }, [selectedReviewRow]);

  useEffect(() => {
    if (showReviewWorkspace && reviewScripts[activeScriptIdx]) {
      setReviewObtainedMarks(reviewScripts[activeScriptIdx].obtainedMarks);
    }
  }, [activeScriptIdx, showReviewWorkspace, reviewScripts]);

  const renderReviewWorkspace = () => {
    const activeScript = reviewScripts[activeScriptIdx] || selectedReviewRow;
    const scriptImage = activeScript.scriptImage || (activeScript.version === 'English' || activeScript.examSubject?.toLowerCase().includes('english')
      ? "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/english-eval-script.png"
      : "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/bangla-eval-script.png");

    const matchUniqueSet = activeScript.question?.match(/Unique Set:\s*(\d+)/i) || activeScript.uniqueSet?.toString().match(/(\d+)/);
    const uniqueSet = matchUniqueSet ? matchUniqueSet[1] : "1";
    const matchQSerial = activeScript.question?.match(/Question Serial:\s*(\d+)/i) || activeScript.questionSerial?.toString().match(/(\d+)/);
    const questionSerial = matchQSerial ? matchQSerial[1] : "2";
    const fullMarks = activeScript.maxMarks || "1.00";

    const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
      if (activeDrawingTool !== 'pencil') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setIsDrawing(true);
      setCurrentPath(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing || activeDrawingTool !== 'pencil') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setCurrentPath(prev => `${prev} L ${x.toFixed(2)} ${y.toFixed(2)}`);
    };

    const handleCanvasMouseUp = () => {
      if (!isDrawing || activeDrawingTool !== 'pencil') return;
      setIsDrawing(false);
      if (currentPath) {
        const updatedPaths = [...allPaths, currentPath];
        setAllPaths(updatedPaths);
        setPageStore(prev => ({
          ...prev,
          [currentScriptPage]: {
            paths: updatedPaths,
            comments: scriptComments
          }
        }));
        setActionHistory(prev => [...prev, { type: 'path', value: currentPath }]);
        setRedoHistory([]);
        setCurrentPath("");
      }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (activeDrawingTool !== 'comment') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      const commentText = prompt("Enter comment text / মন্তব্য লিখুন:");
      if (commentText && commentText.trim()) {
        const newComment = { x, y, text: commentText.trim() };
        const updatedComments = [...scriptComments, newComment];
        setScriptComments(updatedComments);
        setPageStore(prev => ({
          ...prev,
          [currentScriptPage]: {
            paths: allPaths,
            comments: updatedComments
          }
        }));
        setActionHistory(prev => [...prev, { type: 'comment', value: newComment }]);
        setRedoHistory([]);
      }
    };

    const handleUndo = () => {
      if (actionHistory.length === 0) return;
      const lastAction = actionHistory[actionHistory.length - 1];
      setActionHistory(prev => prev.slice(0, -1));
      setRedoHistory(prev => [...prev, lastAction]);

      if (lastAction.type === 'path') {
        const updatedPaths = allPaths.filter(p => p !== lastAction.value);
        setAllPaths(updatedPaths);
        setPageStore(prev => ({
          ...prev,
          [currentScriptPage]: {
            paths: updatedPaths,
            comments: scriptComments
          }
        }));
      } else if (lastAction.type === 'comment') {
        const updatedComments = scriptComments.filter(c => c !== lastAction.value);
        setScriptComments(updatedComments);
        setPageStore(prev => ({
          ...prev,
          [currentScriptPage]: {
            paths: allPaths,
            comments: updatedComments
          }
        }));
      }
    };

    const handleRedo = () => {
      if (redoHistory.length === 0) return;
      const actionToRestore = redoHistory[redoHistory.length - 1];
      setRedoHistory(prev => prev.slice(0, -1));
      setActionHistory(prev => [...prev, actionToRestore]);

      if (actionToRestore.type === 'path') {
        const updatedPaths = [...allPaths, actionToRestore.value];
        setAllPaths(updatedPaths);
        setPageStore(prev => ({
          ...prev,
          [currentScriptPage]: {
            paths: updatedPaths,
            comments: scriptComments
          }
        }));
      } else if (actionToRestore.type === 'comment') {
        const updatedComments = [...scriptComments, actionToRestore.value];
        setScriptComments(updatedComments);
        setPageStore(prev => ({
          ...prev,
          [currentScriptPage]: {
            paths: allPaths,
            comments: updatedComments
          }
        }));
      }
    };

    const handleResetAll = () => {
      if (confirm("Are you sure you want to clear all annotations? / আপনি কি নিশ্চিত যে আপনি সব চিহ্ন মুছে ফেলবেন?")) {
        setAllPaths([]);
        setScriptComments([]);
        setActionHistory([]);
        setRedoHistory([]);
        setPageStore(prev => ({
          ...prev,
          [currentScriptPage]: { paths: [], comments: [] }
        }));
      }
    };

    const handleToggleSingle = () => {
      setForwardSingleChecked(true);
      setForwardMultipleChecked(false);
    };

    const handleToggleMultiple = () => {
      setForwardMultipleChecked(true);
      setForwardSingleChecked(false);
    };

    const handleBlank = () => {
      setReviewObtainedMarks("0.00");
      alert("Marked as blank. Obtained marks set to 0.00");
    };

    const handleSaveAndExit = () => {
      if (isNaN(Number(reviewObtainedMarks))) {
        alert("Please enter a valid number for obtained marks. / অনুগ্রহ করে প্রাপ্ত নম্বরের জন্য একটি সঠিক সংখ্যা লিখুন।");
        return;
      }
      const marksNum = parseFloat(reviewObtainedMarks);
      const maxMarksNum = parseFloat(activeScript.maxMarks || "1.00");
      if (marksNum < 0 || marksNum > maxMarksNum) {
        alert(`Obtained marks must be between 0 and ${maxMarksNum} / প্রাপ্ত নম্বর অবশ্যই 0 এবং ${maxMarksNum}-এর মধ্যে হতে হবে।`);
        return;
      }

      // Update in reviewScripts state
      const updatedReviewScripts = reviewScripts.map((s, idx) => idx === activeScriptIdx ? { ...s, obtainedMarks: reviewObtainedMarks } : s);
      setReviewScripts(updatedReviewScripts);

      // Also update in reviewRecords mapping
      const updatedRecords = reviewRecords.map(rec => {
        if (rec.rollNumber === activeScript.rollNumber && rec.examName === activeScript.examName) {
          return { ...rec, reviewStatus: 'Reviewed', obtainedMarks: reviewObtainedMarks };
        }
        return rec;
      });
      setReviewRecords(updatedRecords);

      setStudentReviewRequests(prev => prev.map(req => {
        if (req.roll === activeScript.rollNumber && req.exam === activeScript.examName) {
          return { ...req, status: 'Resolved', obtainedMarks: reviewObtainedMarks };
        }
        return req;
      }));

      setAdminForwardedRequests(prev => prev.map(req => {
        if (req.rollNumber === activeScript.rollNumber && req.exam === activeScript.examName) {
          return { ...req, status: 'Resolved by Teacher', obtainedMarks: reviewObtainedMarks };
        }
        return req;
      }));

      // Update current row to show success message
      setSelectedReviewRow(prev => prev ? { ...prev, isSubmitted: true } : null);

      // Auto exit after a delay to show the message
      setTimeout(() => {
        setShowReviewWorkspace(false);
        setSelectedReviewRow(null);
      }, 3000);
    };

    const handleSkipAndNext = () => {
      if (isNaN(Number(reviewObtainedMarks))) {
        alert("Please enter a valid number for obtained marks. / অনুগ্রহ করে প্রাপ্ত নম্বরের জন্য একটি সঠিক সংখ্যা লিখুন।");
        return;
      }
      const marksNum = parseFloat(reviewObtainedMarks);
      const maxMarksNum = parseFloat(activeScript.maxMarks || "1.00");
      if (marksNum < 0 || marksNum > maxMarksNum) {
        alert(`Obtained marks must be between 0 and ${maxMarksNum} / প্রাপ্ত নম্বর অবশ্যই 0 এবং ${maxMarksNum}-এর মধ্যে হতে হবে।`);
        return;
      }

      // Save current script's marks
      const updatedReviewScripts = reviewScripts.map((s, idx) => idx === activeScriptIdx ? { ...s, obtainedMarks: reviewObtainedMarks } : s);
      setReviewScripts(updatedReviewScripts);

      const updatedRecords = reviewRecords.map(rec => {
        if (rec.rollNumber === activeScript.rollNumber && rec.examName === activeScript.examName) {
          return { ...rec, reviewStatus: 'Reviewed', obtainedMarks: reviewObtainedMarks };
        }
        return rec;
      });
      setReviewRecords(updatedRecords);

      setStudentReviewRequests(prev => prev.map(req => {
        if (req.roll === activeScript.rollNumber && req.exam === activeScript.examName) {
          return { ...req, status: 'Resolved', obtainedMarks: reviewObtainedMarks };
        }
        return req;
      }));

      // Check if we are in the 4 sequence list of reviewScripts
      if (activeScriptIdx < 3) {
        setActiveScriptIdx(prev => prev + 1);
      } else {
        // Find next in reviewRecords as fallback if not in the 4 sequence
        const currentIndex = reviewRecords.findIndex(r => r.rollNumber === activeScript.rollNumber && r.examName === activeScript.examName);
        const nextUnreviewedRow = reviewRecords.slice(currentIndex + 1).find(r => r.reviewStatus === 'Not Reviewed');
        
        if (nextUnreviewedRow) {
          setSelectedReviewRow(nextUnreviewedRow);
        } else {
          alert("Evaluation saved. No more unreviewed student scripts left. (মূল্যায়ন সংরক্ষিত হয়েছে। আর কোনো রি-চেক বা রিভিউযোগ্য খাতা বাকি নেই।)");
          setShowReviewWorkspace(false);
          setSelectedReviewRow(null);
        }
      }
    };

    const handleSubmitForwardToTeacher = () => {
      if (!forwardToTeacherText.trim()) {
        alert("Please enter a note for the teacher first. / অনুগ্রহ করে শিক্ষকের জন্য একটি নোট লিখুন।");
        return;
      }

      // If Multiple is selected, it represents all scripts for this question seen by this teacher
      const totalScripts = forwardMultipleChecked ? 124 : 1;

      const newForwardRequest = {
        id: "FWD-" + Math.floor(Math.random() * 9000 + 1000),
        examiner: { 
          id: activeScript.examinerId || "21192", 
          name: activeScript.examinerName?.replace(/\[.*\]/, '').trim() || "Fahim", 
          phone: "8801701234567" 
        },
        course: activeScript.course || "HSC'26 Model Test Online Service [HSC MT - 2026]",
        subject: activeScript.subject?.replace(/\[.*\]/, '').trim() || activeScript.examSubject?.replace(/\[.*\]/, '').trim() || "Physics",
        exam: activeScript.exam || activeScript.examName || "Paper Final Live Exam Physics 1st Paper",
        examCode: activeScript.examCode || "130 ",
        adminId: currentUser?.email || "nazmul.2853@udvash.net",
        note: forwardToTeacherText.trim(),
        date: new Date().toISOString().replace('T', ' ').slice(0, 16).replace(/-/g, '/'),
        status: "Pending Teacher Response",
        organization: "UDVASH",
        program: activeScript.program || "College Admission Program",
        session: activeScript.session || "2026",
        examType: activeScript.examType || "Online Written",
        version: activeScript.version || "Bangla",
        questionSerial: questionSerial,
        uniqueSet: uniqueSet,
        evaluationType: "Regular",
        reviewRequest: "Pending",
        rollNumber: activeScript.rollNumber || "42182201462",
        minMarks: "0",
        maxMarks: activeScript.maxMarks || "1.00",
        reviewCount: totalScripts,
        isMultiple: forwardMultipleChecked,
        totalScriptsCount: totalScripts,
        checkedScriptsCount: 0
      };

      setAdminForwardedRequests(prev => [newForwardRequest, ...prev]);

      // Update current row to show success message
      setSelectedReviewRow(prev => prev ? { ...prev, isSubmitted: true } : null);
      
      setForwardToTeacherText("");
      setShowForwardToTeacher(false);

      // Auto exit after a delay to show the message
      setTimeout(() => {
        setShowReviewWorkspace(false);
        setSelectedReviewRow(null);
      }, 3000);
    };

    return (
      <div className="flex-1 bg-[#f3f4f6] overflow-y-auto p-4 md:p-8 font-sans text-gray-800">
        {/* Workspace Top Sticky Navigation */}
        <div className="max-w-[750px] mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-extrabold rounded-md uppercase tracking-wide">
              Recheck Workspace
            </span>
            <span className="text-gray-500 text-xs font-semibold font-mono">
              Roll: {selectedReviewRow.rollNumber || '42182201462'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowReviewWorkspace(false);
              setSelectedReviewRow(null);
            }}
            className="bg-white hover:bg-gray-50 text-gray-700 px-4.5 py-1.5 rounded-lg text-xs font-extrabold border border-gray-300 shadow-xs transition-colors cursor-pointer"
          >
            ← Exit Workspace
          </button>
        </div>

        {/* Dynamic Interactive Elements Card Stack */}
        <div className="max-w-[750px] mx-auto space-y-5">
          
          {/* Section 1: Question & Sample Answer Card (Matches screenshots exactly) */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5 mb-3">
              <span className={`text-sm font-bold font-sans transition-all duration-300 px-2 py-0.5 rounded ${forwardMultipleChecked ? "bg-purple-100 text-[#7030a0] ring-1 ring-purple-300" : "text-gray-900"}`}>
                Question : Unique Set: {uniqueSet}, Question Serial: {questionSerial} {forwardMultipleChecked && "(Group Selected)"}
              </span>
              <span className="text-sm font-bold text-gray-900 font-sans">
                Full Marks : {fullMarks}
              </span>
            </div>
            
            <div className="text-sm md:text-base font-bold text-gray-900 font-sans mb-3 leading-relaxed">
              {activeScript.question}
            </div>

            <div className="bg-[#e2f0d9] border border-[#c5e0b4] rounded-md p-4 relative">
              <div className="absolute top-3 right-3">
                <button 
                  type="button"
                  className="bg-white text-[#1a73e8] border border-[#1a73e8] rounded-md px-2.5 py-1 text-[11px] font-bold shadow-xs hover:bg-[#f8f9fa] transition-colors"
                >
                  Sample Answer
                </button>
              </div>

              {/* Sample Answer Body */}
              {activeScript.sampleAnswerFormulas ? (
                <div className="flex flex-wrap items-center gap-1.5 font-sans font-bold text-sm md:text-base text-gray-900 my-2">
                  <span className="italic">C</span>
                  <span>=</span>
                  <div className="inline-flex flex-col items-center justify-center text-xs px-1 leading-none">
                    <span className="italic border-b border-gray-900 pb-0.5">r</span>
                    <span className="italic pt-0.5">k</span>
                  </div>
                  <span>=</span>
                  <div className="inline-flex flex-col items-center justify-center text-xs px-1 leading-none">
                    <span className="border-b border-gray-900 pb-0.5">900</span>
                    <span className="pt-0.5 font-sans">9 × 10<sup>9</sup></span>
                  </div>
                  <span>= 1 × 10<sup>-7</sup> F</span>
                </div>
              ) : activeScript.sampleAnswerMath ? (
                <div className="font-sans text-xs md:text-sm font-bold text-gray-900 my-2 space-y-1 text-left leading-relaxed">
                  <div>y = -√3 x - 1 কে y = mx + c এর সাথে তুলনা করে, m = -√3</div>
                  <div>∴ tan θ = -√3</div>
                  <div>⇒ θ = tan<sup>-1</sup>(-√3) = 120°</div>
                </div>
              ) : (
                <div className="text-sm md:text-base font-bold text-[#1e4620] font-sans my-2">
                  {activeScript.sampleAnswer}
                </div>
              )}

              <div className="text-xs font-bold text-gray-900 mt-3 border-t border-[#c5e0b4]/60 pt-2">
                {activeScript.version === 'English' ? 'Mark Distribution:' : 'নম্বর বণ্টন:'}
              </div>
              <div className="text-xs text-gray-800 mt-1 space-y-1 font-sans">
                {activeScript.sampleAnswerNotes.map((note: string, idx: number) => {
                  if (note.startsWith('[বি. দ্র.') || note.startsWith('[বি. দ্র:') || note.startsWith('[বি.দ্র.')) {
                    return (
                      <div key={idx} className="text-[11px] text-gray-600 mt-2 font-sans leading-relaxed">
                        {note}
                      </div>
                    );
                  }
                  return <div key={idx}>{note}</div>;
                })}
              </div>
            </div>
          </div>

          {/* Section 1.5: Student's Doubt / Admin's Message (Matches Screenshot) */}
          {(selectedReviewRow?.studentDoubt || selectedReviewRow?.adminDoubt || selectedReviewRow?.studentDoubtText) && (
            <div className="bg-white border-2 border-red-500 rounded-lg p-3 shadow-sm text-left">
              <div className="text-sm font-black text-gray-900 font-sans mb-2">
                {selectedReviewRow?.isFromStudent ? "Student's Doubt :" : "Admin Note :"}
              </div>
              <div className="bg-[#fffbd5] border border-[#e6db55] rounded-md p-4 text-sm font-bold text-gray-800 font-sans leading-relaxed">
                {selectedReviewRow?.studentDoubt || selectedReviewRow?.adminDoubt || selectedReviewRow?.studentDoubtText}
              </div>
            </div>
          )}

          {/* Section 2: Interactive drawing toolbar & script canvas */}
          <div className="space-y-3">
            {/* Toolbar (Matches Screenshot Exactly) */}
            <div className="flex justify-center">
              <div className="bg-[#f2f2f2] border-x border-t border-gray-200 flex items-center shadow-sm">
                {/* Pencil Tool */}
                <button
                  type="button"
                  onClick={() => setActiveDrawingTool('pencil')}
                  className={`px-4 py-2.5 transition-all flex items-center justify-center border-r border-gray-300 ${activeDrawingTool === 'pencil' ? 'bg-[#c1c1c1]' : 'hover:bg-gray-200'}`}
                  title="Pencil Tool / কলম"
                >
                  <Pencil className="w-6 h-6 text-[#ff0000] fill-[#ff0000]" />
                </button>

                {/* Text Tool */}
                <button
                  type="button"
                  onClick={() => setActiveDrawingTool('comment')}
                  className={`px-5 py-2.5 transition-all flex items-center justify-center border-r border-gray-300 ${activeDrawingTool === 'comment' ? 'bg-[#c1c1c1]' : 'hover:bg-gray-200'}`}
                  title="Add Text / টেক্সট যোগ করুন"
                >
                  <span className="text-2xl font-black text-[#ff0000] italic font-serif leading-none select-none">T</span>
                </button>

                {/* Undo */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={actionHistory.length === 0}
                  className="px-5 py-2.5 text-[#999] hover:bg-gray-200 disabled:opacity-30 transition-all border-r border-gray-300"
                  title="Undo"
                >
                  <Undo2 className="w-7 h-7" />
                </button>

                {/* Redo */}
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoHistory.length === 0}
                  className="px-5 py-2.5 text-[#999] hover:bg-gray-200 disabled:opacity-30 transition-all border-r border-gray-300"
                  title="Redo"
                >
                  <Redo2 className="w-7 h-7" />
                </button>

                {/* Eraser */}
                <button
                  type="button"
                  onClick={() => setActiveDrawingTool('eraser')}
                  className="px-5 py-2.5 text-[#544f63] hover:bg-gray-200 transition-all border-r border-gray-300"
                  title="Eraser"
                >
                  <Eraser className="w-7 h-7" />
                </button>

                {/* Reset / Rotate Icon */}
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-5 py-2.5 text-[#544f63] hover:bg-gray-200 transition-all border-r border-gray-300"
                  title="Reset All"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>

                {/* Zoom In / Plus */}
                <button
                  type="button"
                  onClick={() => setImageScale(prev => Math.min(3, prev + 0.2))}
                  className="px-5 py-2.5 text-[#544f63] hover:bg-gray-200 transition-all border-r border-gray-300"
                  title="Zoom In"
                >
                  <Plus className="w-7 h-7 stroke-[3]" />
                </button>

                {/* Zoom Out / Minus */}
                <button
                  type="button"
                  onClick={() => setImageScale(prev => Math.max(0.5, prev - 0.2))}
                  className="px-4 py-2.5 text-[#544f63] hover:bg-gray-200 transition-all"
                  title="Zoom Out"
                >
                  <Minus className="w-8 h-8 stroke-[4]" />
                </button>
              </div>
            </div>

            {/* Script Paper Canvas Card */}
            <div className="bg-white border-x border-b border-gray-200 border-t-0 border-dashed border-t-gray-400 p-4 pt-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
              <div 
                onClick={handleImageClick}
                className="relative border border-dashed border-gray-300 bg-white transition-all duration-300 mx-auto"
                style={{
                  transform: `rotate(${studentPaperRotate}deg) scale(${imageScale})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  maxWidth: '520px',
                  aspectRatio: '16/4.5'
                }}
              >
                <img
                  src={scriptImage}
                  alt="Student Answer sheet"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />

                {/* Submitted Successfully Overlay */}
                {selectedReviewRow?.isSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-50 pointer-events-none"
                  >
                    <div className="bg-emerald-600 text-white px-8 py-4 rounded-xl shadow-2xl flex flex-col items-center space-y-2 border-4 border-emerald-400/30 transform -rotate-1">
                      <div className="bg-white/20 p-2 rounded-full mb-1">
                        <Check className="w-10 h-10 text-white" />
                      </div>
                      <div className="text-xl font-black uppercase tracking-widest font-sans drop-shadow-md">
                        Submitted Successfully
                      </div>
                      <div className="text-[11px] font-bold opacity-90 uppercase tracking-tighter">
                        রি-চেক ও মূল্যায়ন সফলভাবে সম্পন্ন হয়েছে
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Custom Handwriting / Overlay Annotations from the student script images */}
                {activeScript.annotations && activeScript.annotations.map((anno: any, idx: number) => {
                  if (anno.type === 'text') {
                    return (
                      <div 
                        key={`anno-${idx}`}
                        className="absolute select-none pointer-events-none font-handwriting leading-none"
                        style={{
                          top: `${anno.top}%`,
                          left: `${anno.left}%`,
                          fontSize: anno.fontSize || '16px',
                          color: anno.fontColor || '#dc2626',
                          fontWeight: anno.isBold ? 'bold' : 'normal',
                          fontFamily: anno.fontFamily || 'var(--font-handwriting)',
                          transform: anno.transform || 'translateY(-50%)',
                          whiteSpace: 'nowrap',
                          zIndex: 10
                        }}
                      >
                        {anno.text}
                      </div>
                    );
                  }
                  if (anno.type === 'line') {
                    return (
                      <div 
                        key={`anno-${idx}`}
                        className="absolute select-none pointer-events-none"
                        style={{
                          top: `${anno.top}%`,
                          left: `${anno.left}%`,
                          width: `${anno.width}%`,
                          height: `${anno.height || 2}px`,
                          backgroundColor: anno.color || '#dc2626',
                          transform: anno.angle ? `rotate(${anno.angle}deg)` : 'none',
                          transformOrigin: 'left center',
                          borderRadius: '1px',
                          zIndex: 10
                        }}
                      />
                    );
                  }
                  if (anno.type === 'circle') {
                    return (
                      <div 
                        key={`anno-${idx}`}
                        className="absolute select-none pointer-events-none"
                        style={{
                          top: `${anno.top}%`,
                          left: `${anno.left}%`,
                          width: `${anno.width}%`,
                          height: `${anno.height}%`,
                          border: `2.5px solid ${anno.color || '#dc2626'}`,
                          borderRadius: '50%',
                          transform: 'rotate(-3deg)',
                          zIndex: 10
                        }}
                      />
                    );
                  }
                  if (anno.type === 'tick') {
                    return (
                      <div 
                        key={`anno-${idx}`}
                        className="absolute select-none pointer-events-none font-sans font-black text-red-600 leading-none drop-shadow-sm"
                        style={{
                          top: `${anno.top}%`,
                          left: `${anno.left}%`,
                          fontSize: '32px',
                          zIndex: 10
                        }}
                      >
                        ✓
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Responsive SVG Drawing & Overlay Layer */}
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full select-none"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  style={{
                    cursor: activeDrawingTool === 'pencil' ? 'crosshair' : activeDrawingTool === 'comment' ? 'cell' : 'default',
                    pointerEvents: 'auto'
                  }}
                >
                  {allPaths.map((pathStr, index) => (
                    <path
                      key={index}
                      d={pathStr}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {currentPath && (
                    <path
                      d={currentPath}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>

                {/* Pin Comments Container */}
                <div className="absolute inset-0 pointer-events-none">
                  {scriptComments.map((comment, index) => (
                    <div
                      key={index}
                      className="absolute group pointer-events-auto"
                      style={{
                        left: `${comment.x}%`,
                        top: `${comment.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Floating Bubble Pin */}
                      <div className="w-6 h-6 bg-amber-500 hover:bg-amber-600 border-2 border-white rounded-full flex items-center justify-center text-gray-900 text-[10px] font-black shadow-lg cursor-pointer transform hover:scale-110 transition-all duration-150">
                        {index + 1}
                      </div>

                      {/* Tooltip Hover Box */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900/95 border border-gray-700 text-white p-3 rounded shadow-2xl z-50 text-xs min-w-[200px] leading-relaxed backdrop-blur-xs font-sans">
                        <div className="font-bold text-amber-400 mb-1">Comment #{index + 1}:</div>
                        <p className="text-gray-200">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submitted Successfully Badge Below Script */}
              {selectedReviewRow?.isSubmitted && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mt-4 py-2 px-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-center space-x-2 text-emerald-700 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-bold font-sans uppercase tracking-tight">
                    Submitted Successfully (সফলভাবে সাবমিট করা হয়েছে)
                  </span>
                </motion.div>
              )}
              
            </div>
          </div>

          {/* Section 3: Student metadata & Evaluation results */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs text-left space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 text-xs text-gray-700 font-sans">
              <div>
                <span className="font-bold">Roll No :</span> {activeScript.rollNumber || '42182201462'}
              </div>
              <div className="sm:text-right">
                <span className="font-bold">Registration No :</span> {activeScript.registrationNo || '5113810'}
              </div>
              <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-gray-100 pt-2.5 mt-1">
                <div>
                  <span className="font-bold">Examiner :</span> {activeScript.examinerName || '[21192] Fahim (2023)'} | <span className="font-bold">EvaluationTime :</span> {activeScript.evaluationTime || '2026-07-17 07:36 PM'}
                  {(activeScript.reviewer || selectedReviewRow?.reviewer || selectedReviewRow?.adminId) && selectedReviewRow?.reviewStatus !== 'Not Reviewed' && (
                    <div className="text-red-600 font-bold mt-1">
                      Review By: {activeScript.reviewer || selectedReviewRow?.reviewer || selectedReviewRow?.adminId} ({activeScript.reviewTime || selectedReviewRow?.reviewTime || activeScript.reviewedTime || selectedReviewRow?.reviewedTime})
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowImageLog(prev => !prev)}
                    className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-4 py-1.5 rounded text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Image log
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Image Log Modal (Matches Screenshot Exactly) */}
            <AnimatePresence>
              {showImageLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col font-sans"
                  >
                    {/* Header */}
                    <div className="bg-[#002d5b] text-white px-6 py-4 flex items-center justify-between shadow-md">
                      <h3 className="text-base font-bold tracking-tight">Saq Image Log</h3>
                      <button onClick={() => setShowImageLog(false)} className="text-white hover:text-gray-200 transition-colors cursor-pointer">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Table Content */}
                    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50/50">
                      <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100/80 text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                            <th className="px-6 py-4 text-center w-[30%]">Image</th>
                            <th className="px-6 py-4 text-left w-[40%]">Details</th>
                            <th className="px-6 py-4 text-left w-[30%]">User</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {/* Entry 1: Student Doubt / Admin Note */}
                          {(selectedReviewRow?.studentDoubt || selectedReviewRow?.adminDoubt || selectedReviewRow?.studentDoubtText) && (
                            <tr className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-6 text-center">
                                <div className="bg-gray-50 rounded border border-gray-100 p-2 flex justify-center inline-block">
                                  <img src={activeScript.scriptImage} className="max-h-40 object-contain rounded shadow-sm opacity-80" />
                                </div>
                                <div className="mt-2 text-center text-[10px] text-blue-500 font-medium truncate mx-auto max-w-[180px]">
                                  review_annotated_rev01.png
                                </div>
                              </td>
                              <td className="px-6 py-6 align-top">
                                <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase mb-3 border ${selectedReviewRow?.isFromStudent ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                                  {selectedReviewRow?.isFromStudent ? 'STUDENT DOUBT' : 'ADMIN NOTE'}
                                </div>
                                <div className="text-xs font-bold text-gray-800 mb-2 leading-relaxed">
                                  Doubt / Note: <span className="text-purple-700 italic">"{selectedReviewRow?.studentDoubt || selectedReviewRow?.adminDoubt || selectedReviewRow?.studentDoubtText || "খাতাটি পুনঃ মূল্যায়ন করো।"}"</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-gray-600 mt-4">
                                  <div><span className="font-bold">UniqueSet:</span> {activeScript.uniqueSet || '2'}</div>
                                  <div><span className="font-bold">Question Serial:</span> {activeScript.questionSerial || '12'}</div>
                                  <div><span className="font-bold">Obtained Marks:</span> <span className="text-blue-600 font-black">{activeScript.obtainedMarks || '1.00'}</span></div>
                                </div>
                              </td>
                              <td className="px-6 py-6 align-top space-y-2">
                                <div className="text-[11px]"><span className="font-bold text-gray-700">Time:</span> {selectedReviewRow?.reviewTime || '08 Jul 2026 11:30 AM'}</div>
                                <div className="text-[11px]"><span className="font-bold text-gray-700">Status:</span> Pending Resolution</div>
                                <div className="text-[11px]"><span className="font-bold text-gray-700">ID:</span> FWD-001</div>
                                <div className="mt-4">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Operation:</div>
                                  <span className="text-purple-600 font-bold text-[11px] underline decoration-dotted cursor-pointer">ReviewRequestLogged</span>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Entry 2: Evaluated Script */}
                          <tr className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-6 text-center">
                              <div className="bg-gray-50 rounded border border-gray-100 p-2 flex justify-center inline-block">
                                <img src={activeScript.scriptImage} className="max-h-40 object-contain rounded shadow-sm" />
                              </div>
                              <div className="mt-2 text-center text-[10px] text-blue-500 font-medium truncate mx-auto max-w-[180px]">
                                anno_2_f46d82d6-b3a5-48db-8ef1-c92e29526190.jpg
                              </div>
                            </td>
                            <td className="px-6 py-6 align-top">
                              <div className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black uppercase mb-3 border border-green-200">
                                EVALUATED SCRIPT
                              </div>
                              <div className="text-[11px] text-gray-600 leading-relaxed max-w-xs mb-4">
                                Graded with red ticks, corrections, annotations and examiner signature.
                              </div>
                              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-gray-600 mt-4">
                                <div><span className="font-bold">UniqueSet:</span> {activeScript.uniqueSet || '2'}</div>
                                <div><span className="font-bold">Question Serial:</span> {activeScript.questionSerial || '12'}</div>
                                <div><span className="font-bold">Original Marks:</span> <span className="text-green-700 font-black">{activeScript.obtainedMarks || '1.00'}</span></div>
                              </div>
                            </td>
                            <td className="px-6 py-6 align-top space-y-2">
                              <div className="text-[11px]"><span className="font-bold text-gray-700">Time:</span> {activeScript.evaluationTime || '05 Jul, 2026 07:31 PM'}</div>
                              <div className="text-[11px]"><span className="font-bold text-gray-700">Examiner:</span> {activeScript.examinerName || 'Junayad [17576]'}</div>
                              <div className="text-[11px]"><span className="font-bold text-gray-700">Is Marked:</span> Yes</div>
                              <div className="mt-4">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Operation:</div>
                                <span className="text-green-600 font-bold text-[11px] underline decoration-dotted cursor-pointer">MarksEntryByTeacher</span>
                              </div>
                            </td>
                          </tr>

                          {/* Entry 3: Raw Script */}
                          <tr className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-6 text-center">
                              <div className="bg-gray-50 rounded border border-gray-100 p-2 flex justify-center inline-block">
                                <img src={activeScript.scriptImage} className="max-h-40 object-contain rounded shadow-sm grayscale opacity-70" />
                              </div>
                              <div className="mt-2 text-center text-[10px] text-blue-500 font-medium truncate mx-auto max-w-[180px]">
                                3_62d5c931-19fa-44c9-a324-85fd1408fd1a.jpg
                              </div>
                            </td>
                            <td className="px-6 py-6 align-top">
                              <div className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black uppercase mb-3 border border-gray-200">
                                RAW SCRIPT
                              </div>
                              <div className="text-[11px] text-gray-600 leading-relaxed max-w-xs mb-4">
                                The original answer script uploaded directly from candidate scanning device. No examiner markings exist on this image.
                              </div>
                              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-gray-600 mt-4">
                                <div><span className="font-bold">UniqueSet:</span> {activeScript.uniqueSet || '2'}</div>
                                <div><span className="font-bold">Question Serial:</span> {activeScript.questionSerial || '12'}</div>
                                <div><span className="font-bold text-gray-700">Marks:</span> 0.00</div>
                              </div>
                            </td>
                            <td className="px-6 py-6 align-top space-y-2">
                              <div className="text-[11px]"><span className="font-bold text-gray-700">Uploaded Time:</span> 05 Jul, 2026 07:21 PM</div>
                              <div className="text-[11px]"><span className="font-bold text-gray-700">System Status:</span> Raw Scanned</div>
                              <div className="text-[11px]"><span className="font-bold text-gray-700">Source:</span> scanned_qmaster_app</div>
                              <div className="mt-4">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Operation:</div>
                                <span className="text-gray-600 font-bold text-[11px] underline decoration-dotted cursor-pointer">NewUploaded</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end">
                      <button 
                        onClick={() => setShowImageLog(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded shadow-sm text-xs transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Obtained Marks Section */}
            <div className="flex items-center space-x-2 border-t border-gray-100 pt-3">
              <span className="text-sm font-bold text-gray-900 font-sans">Obtained:</span>
              <input
                type="text"
                value={reviewObtainedMarks}
                onChange={(e) => setReviewObtainedMarks(e.target.value)}
                className="w-16 text-center bg-[#e6f4ea] border border-green-600 focus:border-green-800 text-green-900 focus:outline-none rounded py-1 px-1.5 font-bold text-sm font-mono"
              />
              <span className="text-sm font-bold text-gray-900 font-sans">/ {fullMarks}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSkipAndNext}
                className={`${allPaths.length > initialPathCount ? "bg-green-600 hover:bg-green-700" : "bg-[#4395d1] hover:bg-[#3484c0]"} text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer`}
              >
                {allPaths.length > initialPathCount ? "Update & Next" : "Skip & Next"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForwardToTeacher(prev => !prev);
                  setForwardSingleChecked(true);
                  setForwardMultipleChecked(false);
                }}
                className="bg-[#7030a0] hover:bg-[#5b2782] text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              >
                Forward to Teacher
              </button>
              <button
                type="button"
                onClick={handleBlank}
                className="bg-[#ec971f] hover:bg-[#d58512] text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
              >
                Blank
              </button>
              <button
                type="button"
                onClick={handleSaveAndExit}
                disabled={selectedReviewRow?.isSubmitted}
                className={`bg-[#c9302c] hover:bg-[#ac2925] text-white font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer ${selectedReviewRow?.isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Exit
              </button>
            </div>

            {/* Section 4: Expanded "FORWARD TO TEACHER" Note & Filter Options (Matches Screenshot 2 exactly!) */}
            {showForwardToTeacher && (
              <div className="bg-[#f2ebf7]/40 border border-purple-200 rounded-lg p-5 mt-4 text-left transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-purple-100">
                  <h4 className="text-xs font-extrabold text-[#7030a0] uppercase tracking-wider font-sans">
                    ADMIN NOTE TO TEACHER
                  </h4>
                  
                  <div className="bg-[#f2ebf7] border border-purple-100 rounded-md p-1 px-2.5 flex items-center space-x-3.5 text-xs text-purple-900 font-sans select-none">
                    <label className="flex items-center space-x-1.5 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={forwardSingleChecked}
                        onChange={handleToggleSingle}
                        className="w-3.5 h-3.5 text-purple-600 border-purple-300 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Single</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={forwardMultipleChecked}
                        onChange={handleToggleMultiple}
                        className="w-3.5 h-3.5 text-purple-600 border-purple-300 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <span>Multiple</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={forwardToTeacherText}
                    onChange={(e) => setForwardToTeacherText(e.target.value)}
                    placeholder="Enter your note for the teacher here... e.g. 'Please review the answer for question 3 again.'"
                    className="w-full min-h-[100px] p-3 text-xs text-gray-800 bg-white border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-y"
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForwardToTeacher(false);
                        setForwardToTeacherText("");
                      }}
                      className="px-4 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitForwardToTeacher}
                      disabled={selectedReviewRow?.isSubmitted}
                      className={`px-5 py-1.5 bg-[#7030a0] hover:bg-[#5b2782] text-white rounded text-xs font-bold transition-colors shadow-xs cursor-pointer ${selectedReviewRow?.isSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (showReviewWorkspace && selectedReviewRow) {
      return renderReviewWorkspace();
    }

    if (showingAdminDetailRow) {
      return (
        <div className="flex-1 bg-gray-50/30 overflow-y-auto px-6 py-8 text-left">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Details Panel */}
            <div className="bg-[#002d5b] text-white px-4 py-2.5 text-[14px] font-bold rounded-t-md">
              Details
            </div>
            <div className="bg-white border-x border-b border-gray-300 p-6 rounded-b shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-[11.5px] font-sans">
                  <thead>
                    <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-300">
                      <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Program</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Course</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">[Code] Exam Name (Subject)</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Version</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Question</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Review Request</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50/40 text-gray-800 font-medium">
                      <td className="border border-gray-300 px-4 py-3.5 text-center">
                        {showingAdminDetailRow.program || "HSC BE O-2027"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3.5 text-left">
                        {showingAdminDetailRow.course || "HSC Bangla-English Full Course [Online]"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3.5 text-left font-sans">
                        [{showingAdminDetailRow.examCode || "130 "}] {showingAdminDetailRow.examName || showingAdminDetailRow.exam} ({showingAdminDetailRow.subject})
                      </td>
                      <td className="border border-gray-300 px-4 py-3.5 text-center">
                        {showingAdminDetailRow.version || "Bangla"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3.5 text-left">
                        Unique Set {showingAdminDetailRow.uniqueSet || "1"}, Question Serial {showingAdminDetailRow.questionSerial || "2"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3.5 text-center font-bold font-mono">
                        {showingAdminDetailRow.reviewCount || 2}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedReviewRow(showingAdminDetailRow);
                            setShowingAdminDetailRow(null);
                            setShowReviewWorkspace(true);
                          }}
                          className="bg-[#337ab7] hover:bg-[#286090] text-white px-4 py-1.5 rounded text-[11px] font-bold transition-all shadow-xs"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="pt-2">
              <button 
                onClick={() => setShowingAdminDetailRow(null)}
                className="text-[#002d5b] hover:underline text-[13px] font-bold transition-all font-sans"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeSidebarItem === 'admin-dash' || activeSubItem === 'admin-dash') {
      const rawRegularSummary = [
        {
          course: "NDC & SJC All Service [CAP - 2026]",
          subjects: [
            { name: "Chemistry [OW]", pending: 938, active: 0, complete: 0, avg: "00:00" },
            { name: "Physics [OW]", pending: 1020, active: 0, complete: 0, avg: "00:00" },
            { name: "Higher Mathematics [OW]", pending: 814, active: 0, complete: 0, avg: "00:00" },
            { name: "Biology [OW]", pending: 800, active: 0, complete: 0, avg: "00:00" },
            { name: "Chemistry [TW]", pending: 1389, active: 0, complete: 0, avg: "00:00" },
            { name: "Physics [TW]", pending: 1184, active: 0, complete: 0, avg: "00:00" },
            { name: "Biology [TW]", pending: 755, active: 0, complete: 0, avg: "00:00" },
            { name: "Higher Mathematics [TW]", pending: 1466, active: 0, complete: 0, avg: "00:00" },
          ]
        },
        {
          course: "HCC All Service [CAP - 2026]",
          subjects: [
            { name: "Physics [OW]", pending: 321, active: 0, complete: 0, avg: "00:00" },
            { name: "Biology [OW]", pending: 270, active: 0, complete: 0, avg: "00:00" },
            { name: "Higher Mathematics [OW]", pending: 269, active: 0, complete: 0, avg: "00:00" },
            { name: "Chemistry [OW]", pending: 332, active: 0, complete: 0, avg: "00:00" },
            { name: "Higher Mathematics [TW]", pending: 4, active: 0, complete: 0, avg: "00:00" },
            { name: "Physics [TW]", pending: 107, active: 0, complete: 0, avg: "00:00" },
          ]
        },
        {
          course: "Special Course for MCSK [10 AOP - 2026]",
          subjects: [
            { name: "Physics [OW]", pending: 2, active: 0, complete: 0, avg: "00:00" },
          ]
        },
        {
          course: "HSC Bangla-English Full Course [Online] [HSC BE O - 2027]",
          subjects: [
            { name: "English [OW]", pending: 90, active: 1, complete: 23, avg: "01:09" },
          ]
        },
        {
          course: "HSC Bangla-English Full Course Online Without Books [HSC BE O - 2026]",
          subjects: [
            { name: "English [OW]", pending: 1, active: 0, complete: 0, avg: "00:00" },
          ]
        },
        {
          course: "Employee Training Course [ETP - 2021]",
          subjects: [
            { name: "Physics [OW]", pending: 79, active: 0, complete: 0, avg: "00:00" },
            { name: "English [TW]", pending: 22, active: 0, complete: 0, avg: "00:00" },
          ]
        }
      ];

      let timeMultiplier = 1.0;
      switch (adminDashTime) {
        case 'Last 5 Minute': timeMultiplier = 0.15; break;
        case 'Last 10 Minute': timeMultiplier = 0.35; break;
        case 'Last 20 Minute': timeMultiplier = 0.7; break;
        case 'Last 30 Minute': timeMultiplier = 1.0; break;
        case 'Last 1 Hour': timeMultiplier = 1.8; break;
        case 'Last 2 Hour': timeMultiplier = 3.2; break;
        case 'Last 6 Hour': timeMultiplier = 8.5; break;
        case 'Last 12 Hour': timeMultiplier = 15.0; break;
        case 'Last 24 Hour': timeMultiplier = 28.0; break;
        default: timeMultiplier = 1.0;
      }

      const regularSummary = rawRegularSummary.map(group => {
        let subjects = group.subjects;
        if (adminDashExamType === 'Templated Written') {
          subjects = subjects.filter(subj => subj.name.includes('[TW]'));
        } else if (adminDashExamType === 'Online Written') {
          subjects = subjects.filter(subj => subj.name.includes('[OW]'));
        }
        return {
          ...group,
          subjects: subjects.map(s => ({
            ...s,
            pending: s.pending > 0 ? Math.max(1, Math.round(s.pending * timeMultiplier)) : 0,
            active: s.active > 0 ? Math.max(1, Math.round(s.active * timeMultiplier)) : 0,
            complete: s.complete > 0 ? Math.max(1, Math.round(s.complete * timeMultiplier)) : 0,
          }))
        };
      }).filter(group => group.subjects.length > 0);

      // Filter adminForwardedRequests into Student and Admin requests for the dashboard
      const dashboardStudentRequests = adminForwardedRequests.filter(isStudentRequest).map(req => ({
        examiner: req.examiner,
        course: req.course,
        subject: req.subject,
        exam: req.exam,
        requests: req.reviewCount || 1,
        pending: getPendingDuration(req.date),
        studentDoubt: req.note,
        status: req.status,
        originalData: req
      }));

      const dashboardAdminRequests = adminForwardedRequests.filter(req => !isStudentRequest(req));

      const reviewRequests = dashboardStudentRequests;

      const handleViewDetails = (courseName: string, subjectName?: string) => {
        setSelectedDashboardDetail({
          course: courseName,
          subject: subjectName || ""
        });
        
        setSelectedCode("All");
      };

      const renderExaminerDetailsTable = () => {
        if (!selectedDashboardDetail) return null;

        const { course, subject } = selectedDashboardDetail;
        const codes = getSubjectCodes(course, subject);
        const currentCode = selectedCode || "All";
        const examiners = currentCode === "All"
          ? getExaminersForSubjectAll(course, subject)
          : getExaminersForCode(course, subject, currentCode);

        return (
          <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-5 text-left animate-fadeIn">
            {/* Back navigation */}
            <button 
              onClick={() => setSelectedDashboardDetail(null)}
              className="mb-5 flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>

            {/* Section Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-sm font-bold text-[#002d5b] flex items-center mb-1">
                  <span className="w-1.5 h-4 bg-red-500 rounded-sm mr-2.5 inline-block"></span>
                  Examiner Performance Breakdown
                </h2>
                <p className="text-xs text-gray-500 font-medium">Course: {course}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-500">Subject: </span>
                <span className="text-xs font-extrabold text-gray-800 bg-gray-50 px-2.5 py-1 border border-gray-200 rounded">
                  {subject}
                </span>
              </div>
            </div>

            {/* Filters and Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-3 bg-red-50 border border-red-100 rounded px-4 py-2">
                <span className="text-xs font-bold text-red-600">Code:</span>
                <div className="relative">
                  <select 
                    value={currentCode}
                    onChange={(e) => setSelectedCode(e.target.value)}
                    className="bg-white border border-gray-200 rounded px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 pr-8 appearance-none cursor-pointer"
                  >
                    <option value="All">All Selected</option>
                    {codes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="text-xs text-gray-400 font-mono">
                Generated at {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Table representation */}
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full border-collapse text-[11.5px] font-sans">
                <thead>
                  <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200 text-left">
                    <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[5%]">Sl</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 w-[30%]">Examiner</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 w-[15%]">Mobile Number</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[12%]">Total Evaluation</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[12%]">Total Eva. Time</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[12%]">Maximum Eva. Time</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[12%]">Minimum Eva. Time</th>
                    <th className="px-2.5 py-2.5 text-center w-[12%]">Average Eva. Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {examiners.map((ex, idx) => (
                    <tr key={ex.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="border-r border-gray-200 px-3 py-3 text-center font-bold text-gray-500 font-mono">{idx + 1}</td>
                      <td className="border-r border-gray-200 px-3 py-3 font-bold text-[#337ab7]">
                        [{ex.id}] - {ex.name}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 text-gray-600 font-mono">{ex.phone}</td>
                      <td className="border-r border-gray-200 px-2.5 py-3 text-center font-bold text-gray-800 font-mono">
                        {ex.totalEvaluation.toLocaleString()}
                      </td>
                      <td className="border-r border-gray-200 px-2.5 py-3 text-center text-gray-600 font-mono">{ex.totalEvaTime}</td>
                      <td className="border-r border-gray-200 px-2.5 py-3 text-center text-gray-600 font-mono">{ex.maxEvaTime}</td>
                      <td className="border-r border-gray-200 px-2.5 py-3 text-center text-gray-600 font-mono">{ex.minEvaTime}</td>
                      <td className="px-2.5 py-3 text-center text-gray-600 font-mono font-bold">{ex.avgEvaTime}</td>
                    </tr>
                  ))}

                  {/* Total summary row */}
                  <tr className="bg-[#fcfcfc] border-t border-gray-200 font-bold">
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-600" colSpan={3}>Total</td>
                    <td className="border-r border-gray-200 px-2.5 py-2 text-center text-gray-900 font-extrabold font-mono">
                      {examiners.reduce((sum, ex) => sum + ex.totalEvaluation, 0).toLocaleString()}
                    </td>
                    <td className="border-r border-gray-200 px-2.5 py-2 text-center text-gray-700 font-mono">
                      {secondsToTime(examiners.reduce((sum, ex) => sum + timeToSeconds(ex.totalEvaTime), 0))}
                    </td>
                    <td className="border-r border-gray-200 px-2.5 py-2 text-center text-gray-600 font-mono">
                      {examiners.length > 0 
                        ? secondsToTime(Math.max(...examiners.map(ex => timeToSeconds(ex.maxEvaTime)))) 
                        : "00:00:00"}
                    </td>
                    <td className="border-r border-gray-200 px-2.5 py-2 text-center text-gray-600 font-mono">
                      {examiners.length > 0 
                        ? secondsToTime(Math.min(...examiners.map(ex => timeToSeconds(ex.minEvaTime)).filter(t => t > 0))) 
                        : "00:00:00"}
                    </td>
                    <td className="px-2.5 py-2 text-center text-gray-700 font-mono font-bold">
                      {(() => {
                        const totalEvaluation = examiners.reduce((sum, ex) => sum + ex.totalEvaluation, 0);
                        const totalSecs = examiners.reduce((sum, ex) => sum + timeToSeconds(ex.totalEvaTime), 0);
                        return totalEvaluation > 0 ? secondsToTime(Math.round(totalSecs / totalEvaluation)) : "00:00:00";
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      };

      return (
        <div className="flex-1 bg-white overflow-y-auto px-6 py-5 text-left">
          {/* Dashboard Header */}
          <div className="bg-[#002d5b] text-white px-4 py-2 flex justify-between items-center text-[13px] font-medium mb-5 rounded shadow-sm">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold tracking-wide">Admin Dashboard <span className="text-blue-200">[{adminDashTime}]</span></span>
            </span>
            <span className="text-blue-100 text-xs">Last update: 11:57:27 AM</span>
          </div>

          {selectedDashboardDetail ? (
            renderExaminerDetailsTable()
          ) : (
            <>

          {/* Regular Script Evaluation Summary Section */}
          <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-xs p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-sm font-bold text-[#002d5b] flex items-center">
                <span className="w-1.5 h-4 bg-[#4395d1] rounded-sm mr-2.5 inline-block"></span>
                Regular Script Evaluation Summary
              </h2>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <select 
                    value={adminDashExamType}
                    onChange={(e) => setAdminDashExamType(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-[11px] text-gray-700 bg-white hover:border-gray-400 focus:outline-none min-w-[140px] appearance-none pr-6 font-sans"
                  >
                    <option value="All Exam Type">All Exam Type</option>
                    <option value="Templated Written">Templated Written</option>
                    <option value="Online Written">Online Written</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative flex-1 sm:flex-initial">
                  <select 
                    value={adminDashTime}
                    onChange={(e) => setAdminDashTime(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-[11px] text-gray-700 bg-white hover:border-gray-400 focus:outline-none min-w-[140px] appearance-none pr-6 font-sans"
                  >
                    <option value="Last 5 Minute">Last 5 Minute</option>
                    <option value="Last 10 Minute">Last 10 Minute</option>
                    <option value="Last 20 Minute">Last 20 Minute</option>
                    <option value="Last 30 Minute">Last 30 Minute</option>
                    <option value="Last 1 Hour">Last 1 Hour</option>
                    <option value="Last 2 Hour">Last 2 Hour</option>
                    <option value="Last 6 Hour">Last 6 Hour</option>
                    <option value="Last 12 Hour">Last 12 Hour</option>
                    <option value="Last 24 Hour">Last 24 Hour</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto lg:overflow-visible rounded border border-gray-200">
              <table className="w-full border-collapse text-[11.5px] font-sans">
                <thead>
                  <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200">
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[32%]">Course [Program-Session]</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[24%]">Subject</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Evaluation Pending</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Active Examiner(s)</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Evaluation Complete</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Average Eva. Time</th>
                    <th className="px-3 py-2.5 text-center w-[6%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {regularSummary.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      {group.subjects.map((subj, sIdx) => (
                        <tr key={sIdx} className="hover:bg-gray-50/50 transition-colors">
                          {sIdx === 0 && (
                            <td className="border-r border-gray-200 px-3 py-3 align-top text-gray-900 font-medium" rowSpan={group.subjects.length + (group.subjects.length > 1 ? 1 : 0)}>
                              {group.course}
                            </td>
                          )}
                          <td className="border-r border-gray-200 px-3 py-2.5 text-gray-700">{subj.name}</td>
                          <td 
                            className="border-r border-gray-200 px-2.5 py-2.5 text-center font-bold text-gray-700 font-mono relative cursor-pointer select-none group/cell"
                            onMouseEnter={() => {
                              if (subj.pending > 0) {
                                setHoveredPending({
                                  course: group.course,
                                  subject: subj.name,
                                  pending: subj.pending,
                                  gIdx,
                                  sIdx
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredPending(null)}
                          >
                            <span className={subj.pending > 0 ? "hover:text-blue-600 transition-colors border-b border-dashed border-gray-300 hover:border-blue-600 pb-0.5" : ""}>
                              {subj.pending.toLocaleString()}
                            </span>

                            {/* Popup Tooltip */}
                            {hoveredPending && hoveredPending.course === group.course && hoveredPending.subject === subj.name && subj.pending > 0 && (
                              <div 
                                className={`absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl text-left pointer-events-none transition-all duration-200 ${
                                  // Position below if near the top, otherwise above to avoid clipping
                                  gIdx === 0 && sIdx < 4 ? 'top-full mt-2 left-1/2 -translate-x-1/2' : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
                                }`}
                              >
                                {/* Header Bar */}
                                <div className="bg-[#002d5b] text-white px-4 py-2.5 rounded-t-lg flex justify-between items-center text-xs font-bold font-sans">
                                  <span>Pending Script Breakdown</span>
                                  <span className="text-[#38bdf8] font-semibold">{subj.name}</span>
                                </div>
                                
                                {/* Content Area */}
                                <div className="p-4 font-sans font-normal text-xs normal-case tracking-normal">
                                  <div className="text-[11px] font-bold text-[#002d5b] leading-snug">
                                    Course: {group.course}
                                  </div>
                                  
                                  <div className="border-b border-gray-100 my-2.5"></div>
                                  
                                  <div className="text-[9px] font-extrabold text-gray-400 tracking-wider mb-2 uppercase">
                                    EXAM CODE & SETS
                                  </div>
                                  
                                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                                    {getPendingBreakdown(group.course, subj.name, subj.pending).map((item, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-center justify-between border border-gray-100 rounded-lg p-2.5 bg-[#fcfdfe] shadow-2xs"
                                      >
                                        <div>
                                          <span className="text-[11px] font-bold text-[#337ab7] block">{item.code}</span>
                                          <span className="text-[9.5px] text-gray-500 font-medium block">{item.setName}</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded px-2.5 py-1 font-mono">
                                          {item.count.toLocaleString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-800">Total Pending</span>
                                    <span className="bg-sky-50 text-[#337ab7] border border-sky-100 text-[11px] font-extrabold rounded px-3 py-1 font-mono shadow-3xs">
                                      {subj.pending.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="border-r border-gray-200 px-2.5 py-2.5 text-center text-gray-600 font-mono">{subj.active}</td>
                          <td className="border-r border-gray-200 px-2.5 py-2.5 text-center text-gray-600 font-mono">{subj.complete}</td>
                          <td className="border-r border-gray-200 px-2.5 py-2.5 text-center text-gray-600 font-mono">{subj.avg}</td>
                          <td className="px-3 py-2.5 text-center">
                            <button 
                              onClick={() => handleViewDetails(group.course, subj.name)}
                              className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-2.5 py-0.5 rounded text-[10px] font-bold transition-all shadow-xs"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {group.subjects.length > 1 && (
                        <tr className="bg-[#fcfcfc] hover:bg-[#fcfcfc]">
                          <td className="border-r border-gray-200 px-3 py-2 font-bold text-right text-gray-600">Total</td>
                          <td className="border-r border-gray-200 px-2.5 py-2 text-center font-bold text-gray-800 font-mono">
                            {group.subjects.reduce((sum, s) => sum + s.pending, 0).toLocaleString()}
                          </td>
                          <td className="border-r border-gray-200 px-2.5 py-2 text-center font-bold text-gray-800 font-mono">
                            {group.subjects.reduce((sum, s) => sum + s.active, 0)}
                          </td>
                          <td className="border-r border-gray-200 px-2.5 py-2 text-center font-bold text-gray-800 font-mono">
                            {group.subjects.reduce((sum, s) => sum + s.complete, 0)}
                          </td>
                          <td className="border-r border-gray-200 px-2.5 py-2 text-center font-bold text-gray-800 font-mono">00:00</td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {/* Grand Totals */}
                  <tr className="bg-[#f1f3f5] font-bold">
                    <td className="border-r border-gray-200 px-3 py-2.5 font-bold text-right text-gray-800" colSpan={2}>Grand Total</td>
                    <td className="border-r border-gray-200 px-2.5 py-2.5 text-center font-extrabold text-gray-900 font-mono">
                      {regularSummary.reduce((total, group) => total + group.subjects.reduce((sum, s) => sum + s.pending, 0), 0).toLocaleString()}
                    </td>
                    <td className="border-r border-gray-200 px-2.5 py-2.5 text-center font-extrabold text-gray-900 font-mono">
                      {regularSummary.reduce((total, group) => total + group.subjects.reduce((sum, s) => sum + s.active, 0), 0).toLocaleString()}
                    </td>
                    <td className="border-r border-gray-200 px-2.5 py-2.5 text-center font-extrabold text-gray-900 font-mono">
                      {regularSummary.reduce((total, group) => total + group.subjects.reduce((sum, s) => sum + s.complete, 0), 0).toLocaleString()}
                    </td>
                    <td className="border-r border-gray-200 px-2.5 py-2.5 text-center font-extrabold text-gray-900 font-mono">
                      {regularSummary.some(group => group.subjects.some(s => s.avg !== "00:00")) ? "01:09" : "00:00"}
                    </td>
                    <td className="px-3 py-2.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Students' Script Evaluation Summary Section */}
          <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-xs p-5">
            <h2 className="text-sm font-bold text-[#002d5b] mb-4 flex items-center">
              <span className="w-1.5 h-4 bg-[#4395d1] rounded-sm mr-2.5 inline-block"></span>
              Top Students' Script Evaluation Summary
            </h2>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full border-collapse text-[11.5px] font-sans">
                <thead>
                  <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200">
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[32%]">Course [Program-Session]</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[24%]">Subject</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Evaluation Pending</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Active Examiner(s)</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Evaluation Complete</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Average Eva. Time</th>
                    <th className="px-3 py-2.5 text-center w-[6%]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="px-3 py-5 text-center text-gray-400 font-medium italic">
                      There is no pending question at this moment.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Students' Review Request Section */}
          <div className="mb-5 bg-white border border-gray-200 rounded-lg shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-[#002d5b] flex items-center">
                <span className="w-1.5 h-4 bg-[#4395d1] rounded-sm mr-2.5 inline-block"></span>
                Students' Review Request
              </h2>
              <button 
                onClick={() => {
                  setActiveSidebarItem('online-script-eval');
                  setActiveSubItem('admin-review-req');
                  setAdminReviewReqFilters(prev => ({ ...prev, reviewRequestFrom: 'Student' }));
                  setAdminReviewReqSearchTriggered(true);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-colors"
              >
                View in Review Request <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full border-collapse text-[11.5px] font-sans">
                <thead>
                  <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200">
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[20%]">Teacher</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[24%]">Course [Program-Session]</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[14%]">Subject</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[18%]">Exam</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[8%]">Review Requests</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[10%]">Pending From</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[11%]">Examiner Status</th>
                    <th className="px-3 py-2.5 text-center w-[5%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reviewRequests.map((req, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="border-r border-gray-200 px-3 py-3 text-gray-700">
                        <div className="font-bold text-blue-700 text-[11px] leading-tight">[{req.examiner.id}] - {req.examiner.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{req.examiner.phone}</div>
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 text-gray-800 font-medium">{req.course}</td>
                      <td className="border-r border-gray-200 px-3 py-3 text-gray-700">{req.subject}</td>
                      <td className="border-r border-gray-200 px-3 py-3 text-gray-700">{req.exam}</td>
                      <td className="border-r border-gray-200 px-2.5 py-3 text-center font-bold text-gray-800 font-mono">{req.requests}</td>
                      <td className="border-r border-gray-200 px-2.5 py-3 text-center text-gray-600 font-mono">{req.pending}</td>
                      <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                        {examinerReviewPermissions[req.examiner.id] !== false ? (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                            Permitted
                          </span>
                        ) : (
                          <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                            Not Permitted
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button 
                          onClick={() => {
                            const constructed = {
                              id: `STU-REV-${idx}`,
                              rollNumber: '37180701100',
                              studentName: 'Tahmid Rahman',
                              examSubject: `${req.exam} - ${req.subject}`,
                              program: req.course.split(' [')[0] || 'NDC All Service',
                              course: req.course,
                              question: 'Unique Set: 2, Question Serial: 12',
                              questionSerial: '12',
                              uniqueSet: '2',
                              obtainedMarks: '0.00',
                              maxMarks: '1.00',
                              examinerName: `${req.examiner.name} (${req.examiner.id})`,
                              evaluationType: 'Regular',
                              examName: req.exam,
                              subject: req.subject.replace(/\[.*\]/, '').trim(),
                              studentDoubt: req.studentDoubt || "Anode manei toh rinattok pranto",
                              studentDoubtText: req.studentDoubt || "Anode manei toh rinattok pranto",
                              isFromStudent: true,
                              totalScript: '124',
                              minMarks: '0.5',
                              reviewStatus: (req as any).reviewRequest || (req as any).status || 'Not Reviewed',
                              suppressNotes: false
                            };
                            setShowingAdminDetailRow(constructed);
                            setShowReviewWorkspace(false);
                          }}
                          className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-2.5 py-0.5 rounded text-[10px] font-bold transition-all shadow-xs"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#f1f3f5] font-bold">
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-800" colSpan={4}>Total</td>
                    <td className="border-r border-gray-200 px-2.5 py-2 text-center text-gray-900 font-extrabold font-mono">{reviewRequests.length}</td>
                    <td className="px-3 py-2" colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Review Request Section */}
          <div className="mb-5 bg-white border border-gray-200 rounded-lg shadow-xs p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-[#002d5b] flex items-center">
                <span className="w-1.5 h-4 bg-purple-600 rounded-sm mr-2.5 inline-block"></span>
                Admin Review Request
              </h2>
              <button 
                onClick={() => {
                  setActiveSidebarItem('online-script-eval');
                  setActiveSubItem('admin-review-req');
                  setAdminReviewReqFilters(prev => ({ ...prev, reviewRequestFrom: 'Admin' }));
                  setAdminReviewReqSearchTriggered(true);
                }}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline flex items-center transition-colors"
              >
                View in Review Request <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full border-collapse text-[11.5px] font-sans">
                <thead>
                  <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200">
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[14%]">Teacher</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[16%]">Course [Program-Session]</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[8%]">Subject</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[12%]">Exam</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[12%]">Admin Note</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[8%]">Unique Set and Question Serial</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[6%]">Reviewed By:</th>
                    <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[5%]">Review Scripts</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[6%]">Status</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[10%]">Examiner Status</th>
                    <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[6%]">Pending From</th>
                    <th className="px-3 py-2.5 text-center w-[10%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardAdminRequests.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-5 text-center text-gray-400 font-medium italic">
                        No forwarded reviews at this moment.
                      </td>
                    </tr>
                  ) : (
                    dashboardAdminRequests.map((req, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="border-r border-gray-200 px-3 py-3 text-gray-700">
                          <div className="font-bold text-blue-700 text-[11px] leading-tight">[{req.examiner.id}] - {req.examiner.name}</div>
                          {req.examiner.phone && <div className="text-[10px] text-gray-500 mt-0.5">{req.examiner.phone}</div>}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 text-gray-800 font-medium">{req.course}</td>
                        <td className="border-r border-gray-200 px-3 py-3 text-gray-700">{req.subject}</td>
                        <td className="border-r border-gray-200 px-3 py-3 text-gray-700">{req.exam}</td>
                        <td className="border-r border-gray-200 px-3 py-3 text-purple-950 text-[11px] font-sans leading-relaxed">
                          <div className="bg-purple-50/70 border border-purple-100 rounded p-2 italic">
                            "{req.note}"
                          </div>
                          <div className="text-[9px] text-gray-400 mt-1.5 font-mono">{req.date}</div>
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-3 text-center text-purple-700 font-bold font-mono text-[11px]">
                          U{req.uniqueSet || '1'} - Q{req.questionSerial || '26'}
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                          <span className="inline-block bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded font-bold font-mono text-[10px]">
                            {req.adminId}
                          </span>
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                          <span className="inline-flex items-center justify-center bg-red-100 text-red-800 px-2.5 py-0.5 rounded font-extrabold font-mono text-[10.5px] border border-red-200/60 shadow-3xs">
                            {req.isMultiple ? `${req.checkedScriptsCount}/${req.totalScriptsCount}` : (req.reviewCount || 1)}
                          </span>
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap ${
                            getDisplayStatus(req) === 'Pending Teacher Response' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : getDisplayStatus(req) === 'In Progress'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {getDisplayStatus(req)}
                          </span>
                        </td>
                        <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                          {examinerReviewPermissions[req.examiner.id] !== false ? (
                            <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                              Permitted
                            </span>
                          ) : (
                            <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                              Not Permitted
                            </span>
                          )}
                        </td>
                        <td className="border-r border-gray-200 px-3 py-3 text-center">
                          {getDisplayStatus(req) === 'Reviewed' || getDisplayStatus(req) === 'Completed' ? (
                            <span className="text-gray-400 font-medium font-sans">--</span>
                          ) : (
                            <span className="inline-block bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded font-extrabold font-mono text-[10px] shadow-3xs whitespace-nowrap">
                              {getPendingDuration(req.date)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => {
                                const constructed = {
                                  id: req.id,
                                  rollNumber: req.rollNumber || '37180701100',
                                  studentName: 'Tahmid Rahman',
                                  examSubject: `${req.exam} - ${req.subject}`,
                                  program: req.program || 'Engineering Admission',
                                  course: req.course,
                                  question: `Unique Set: 1, Question Serial: 18`,
                                  questionSerial: req.questionSerial || '18',
                                  uniqueSet: req.uniqueSet || '1',
                                  obtainedMarks: '0.00',
                                  maxMarks: req.maxMarks || '1.00',
                                  examinerName: `${req.examiner.name} (${req.examiner.id})`,
                                  evaluationType: req.evaluationType || 'Regular',
                                  examName: req.exam,
                                  examCode: req.examCode || '130 ',
                                  subject: req.subject.replace(/\[.*\]/, '').trim(),
                                  adminDoubt: req.note || "খাতাটি পুনঃ মূল্যায়ন করো।",
                                  adminCommentText: req.note || "খাতাটি পুনঃ মূল্যায়ন করো।",
                                  isFromStudent: false,
                                  totalScript: '124',
                                  minMarks: req.minMarks || '0.5',
                                  reviewStatus: req.reviewRequest || req.status || 'Not Reviewed',
                                  reviewCount: req.reviewCount || 2,
                                  suppressNotes: false,
                                  examType: req.examType || 'Online Written',
                                  version: req.version || 'Bangla'
                                };
                                setShowingAdminDetailRow(constructed);
                                setShowReviewWorkspace(false);
                              }}
                              className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-2.5 py-1 rounded text-[10.5px] font-bold transition-all shadow-xs"
                            >
                              Details
                            </button>
                            <button 
                              onClick={() => setCancelConfirmId(req.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10.5px] font-bold transition-all shadow-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {dashboardAdminRequests.length > 0 && (
                    <tr className="bg-[#f1f3f5] font-bold">
                      <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-800" colSpan={4}>Total Forwarded</td>
                      <td className="border-r border-gray-200 px-2.5 py-2 text-center text-gray-900 font-extrabold font-mono" colSpan={4}>
                        {dashboardAdminRequests.length}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      );
    }

    if (activeTab === 'Exam' && activeSubItem === 'ai-eval') {
      return (
        <div className="flex-1 flex flex-col items-center justify-start bg-gray-50/10 overflow-y-auto px-6 pt-8 pb-20 custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl space-y-8"
          >
            {/* TOP PANELS: Configuration, Assets, Student Work */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration Card */}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col text-left">
                <div className="bg-[#0b2b40] text-white px-4 py-3 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Configuration</span>
                </div>
                <div className="p-6 space-y-6 flex-1">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#b91c1c] uppercase tracking-tight">Evaluation Teacher *</label>
                    <div className="relative">
                      <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white font-medium"
                      >
                        <option value="Bangla">Bangla</option>
                        <option value="English">English</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Math">Math</option>
                        <option value="Biology">Biology</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] border border-gray-100 rounded p-4 space-y-3 relative group">
                    <div className="flex items-center space-x-2 text-gray-400 mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Engine Instructions</span>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto text-[13px] leading-relaxed text-gray-600 font-medium whitespace-pre-wrap pr-3 custom-scrollbar text-left lowercase-bengali-fix">
                      {ENGINE_INSTRUCTIONS[selectedSubject as keyof typeof ENGINE_INSTRUCTIONS] || ENGINE_INSTRUCTIONS['Bangla']}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Card */}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col text-left">
                <div className="bg-[#0b2b40] text-white px-4 py-3 flex items-center space-x-2">
                  <FileUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Assets</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight mb-4">Solution Key / Mark Scheme</label>
                  <label 
                    onDragEnter={(e) => handleDrag(e, 'solution')}
                    onDragLeave={(e) => handleDrag(e, 'solution')}
                    onDragOver={(e) => handleDrag(e, 'solution')}
                    onDrop={(e) => handleDrop(e, 'solution')}
                    className={`flex-1 border-2 border-dashed ${dragActive.solution ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-[#fafafa]'} rounded-lg flex flex-col items-center justify-center p-8 hover:bg-gray-50 transition-all cursor-pointer group relative min-h-[160px]`}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept=".pdf,.doc,.docx,image/*" 
                      onChange={handleSolutionUpload}
                    />
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform border border-gray-100">
                      <UploadCloud className={`w-6 h-6 ${solutionFiles.length > 0 ? 'text-blue-500' : 'text-gray-300'}`} />
                    </div>
                    <p className="text-sm font-bold text-gray-700 mb-1">
                      {solutionFiles.length > 0 ? `${solutionFiles.length} file(s) selected` : 'Upload Solution Key'}
                    </p>
                    <p className="text-[10px] text-gray-400 text-center max-w-[180px]">
                      PDF, Word (.doc, .docx), Images — multiple supported
                    </p>
                  </label>

                  {/* File Action List */}
                  <div className="mt-4 space-y-2">
                    {solutionFiles.map((file, index) => (
                      <div key={index} className="bg-gray-50/50 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden ml-1">
                          <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt="preview" 
                                className="w-full h-full object-cover transition-transform duration-200" 
                                style={{ transform: `rotate(${rotations[file.name] || 0}deg)` }}
                              />
                            ) : (
                              <FileType className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <p className="text-[13px] font-bold text-gray-700 truncate max-w-[150px]">{file.name}</p>
                        </div>
                        <div className="flex items-center space-x-4 mr-2">
                          <button 
                            title="Rotate" 
                            onClick={(e) => { e.preventDefault(); toggleRotation(file.name); }}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <RotateCw className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            title="View" 
                            onClick={(e) => { e.preventDefault(); setPreviewFile(file); }}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            title="Delete"
                            onClick={(e) => { e.preventDefault(); setSolutionFiles(prev => prev.filter((_, i) => i !== index)); }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Work Card */}
              <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden flex flex-col text-left">
                <div className="bg-[#0b2b40] text-white px-4 py-3 flex items-center space-x-2">
                  <UserCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Student Work</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight mb-4">Student Scripts</label>
                  <label 
                    onDragEnter={(e) => handleDrag(e, 'student')}
                    onDragLeave={(e) => handleDrag(e, 'student')}
                    onDragOver={(e) => handleDrag(e, 'student')}
                    onDrop={(e) => handleDrop(e, 'student')}
                    className={`flex-1 border-2 border-dashed ${dragActive.student ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-[#fafafa]'} rounded-lg flex flex-col items-center justify-center p-8 hover:bg-gray-50 transition-all cursor-pointer group relative min-h-[160px]`}
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept=".pdf,image/*" 
                      onChange={handleStudentUpload}
                    />
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform border border-gray-100">
                      <Image className={`w-6 h-6 ${studentFiles.length > 0 ? 'text-blue-500' : 'text-gray-300'}`} />
                    </div>
                    <p className="text-sm font-bold text-gray-700 mb-1">
                      {studentFiles.length > 0 ? `${studentFiles.length} file(s) selected` : 'Add Student Work'}
                    </p>
                    <p className="text-[10px] text-gray-400 text-center max-w-[180px]">
                      Multiple images or PDF — Drag & Drop supported
                    </p>
                  </label>

                  {/* File Action List */}
                  <div className="mt-4 space-y-2">
                    {studentFiles.map((file, index) => (
                      <div key={index} className="bg-gray-50/50 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden ml-1">
                          <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt="preview" 
                                className="w-full h-full object-cover transition-transform duration-200" 
                                style={{ transform: `rotate(${rotations[file.name] || 0}deg)` }}
                              />
                            ) : (
                              <FileType className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <p className="text-[13px] font-bold text-gray-700 truncate max-w-[150px]">{file.name}</p>
                        </div>
                        <div className="flex items-center space-x-4 mr-2">
                          <button 
                            title="Rotate" 
                            onClick={(e) => { e.preventDefault(); toggleRotation(file.name); }}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <RotateCw className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            title="View" 
                            onClick={(e) => { e.preventDefault(); setPreviewFile(file); }}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            title="Delete"
                            onClick={(e) => { e.preventDefault(); setStudentFiles(prev => prev.filter((_, i) => i !== index)); }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BAR: Start Evaluation Button */}
            <div className="flex items-center justify-center py-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleStartEvaluation}
                  disabled={isProcessing || solutionFiles.length === 0 || studentFiles.length === 0}
                  className={`${isProcessing ? 'bg-gray-400' : 'bg-[#2d5fb8] hover:bg-[#254ea3]'} text-white px-20 py-3 rounded-md flex items-center space-x-3 font-bold text-[14px] shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed uppercase tracking-wide`}
                >
                  {isProcessing ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5 shadow-sm" />
                  )}
                  <span>{isProcessing ? 'Evaluating...' : 'Start AI Evaluation'}</span>
                </button>
                <button 
                  onClick={() => {
                    setEvaluationResult(null);
                    setSolutionFiles([]);
                    setStudentFiles([]);
                    setShowReport(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-400 transition-colors"
                  title="Reset All"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LOWER SECTION: Evaluation Report */}
            <AnimatePresence>
              {showReport && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white shadow-lg border border-gray-200"
                >
                  {/* Header */}
                  <div className="bg-[#1a2b3c] text-white p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 text-emerald-500 rounded border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold tracking-tight">Evaluation Report</h2>
                        <p className="text-[10px] text-gray-400 font-medium">ID: 01 • May 04, 2026</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="bg-[#2c3e50]/50 hover:bg-[#2c3e50] text-[#a0aec0] hover:text-white text-[11px] font-bold px-4 py-2 rounded border border-gray-700/50 flex items-center space-x-2 transition-all">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest shadow-sm">
                        Evaluation Finalized
                      </span>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-white">
                    <div className="p-5 flex flex-col items-center border-b md:border-b-0 border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Total Score</p>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-black text-blue-600">{aiEvaluationData?.totalScore || '1.5'}</span>
                        <span className="text-sm font-bold text-gray-300">/ {aiEvaluationData?.maxScore || '10'}</span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col items-center border-b md:border-b-0 border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Accuracy</p>
                      <span className="text-2xl font-black text-emerald-500">
                        {aiEvaluationData ? `${Math.round((parseFloat(aiEvaluationData.totalScore) / parseFloat(aiEvaluationData.maxScore)) * 100)}%` : '60%'}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col items-center border-b md:border-b-0 border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Questions</p>
                      <span className="text-2xl font-black text-orange-500">1</span>
                    </div>
                    <div className="p-5 flex flex-col items-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Pages</p>
                      <span className="text-2xl font-black text-gray-800">1</span>
                    </div>
                  </div>

                  {/* Annotated Tab */}
                  <div className="px-6 py-4 flex space-x-4 border-b border-gray-100 bg-[#f9fafb]">
                    <button className="bg-white text-blue-600 text-[11px] font-bold px-5 py-1.5 rounded-full border border-blue-200 shadow-sm transition-all hover:bg-blue-50">
                      Annotated
                    </button>
                  </div>

                  {/* Report Body */}
                  <div className="p-6 bg-white space-y-8">
                    {/* Marked Sheet Section */}
                    <div className="bg-[#1a2b3c] rounded-lg overflow-hidden border border-gray-700 shadow-xl">
                      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-[#1a2b3c] to-[#25394e]">
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-[12px] font-black text-white shadow-inner">1</div>
                          <span className="text-[12px] font-bold text-blue-50 uppercase tracking-widest">Marked Sheet 1 (Student Scripts)</span>
                        </div>
                        <button className="text-[11px] font-bold text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline">View Full Result</button>
                      </div>
                      
                      <div className="bg-[#f0f4f8] p-4 sm:p-6 lg:p-8">
                        <div className="bg-white border border-blue-100 rounded-md p-4 sm:p-6 shadow-sm">
                          <div 
                            className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 cursor-pointer group"
                            onClick={() => setIsSolutionSheetExpanded(!isSolutionSheetExpanded)}
                          >
                            <div className="flex items-center space-x-2.5">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Question Wise Solution Sheet 1</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button className="text-[11px] text-blue-600 font-bold hover:text-blue-800 flex items-center space-x-1 underline decoration-dotted">
                                <span>View Original</span>
                              </button>
                              <div className="p-1 bg-gray-50 rounded group-hover:bg-gray-100 transition-colors">
                                {isSolutionSheetExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isSolutionSheetExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                              >
                                {/* Question Box */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                  <div className="bg-gray-50/80 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                                    <span className="text-[11px] font-bold text-gray-500 tracking-tight uppercase">Solution Reference Material</span>
                                    <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      {solutionFiles.length} FILE(S)
                                    </span>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    {solutionFiles.map((file, index) => (
                                      <div key={index} className="border border-gray-100 rounded-md overflow-hidden bg-[#fafafa]">
                                        <div className="px-3 py-1.5 bg-white border-b border-gray-50 flex items-center justify-between">
                                          <span className="text-[10px] font-bold text-gray-400 truncate max-w-[200px]">{file.name}</span>
                                          <button 
                                            onClick={() => setPreviewFile(file)}
                                            className="text-blue-600 text-[10px] font-bold hover:underline"
                                          >
                                            View Full
                                          </button>
                                        </div>
                                        <div className="p-4 flex justify-center bg-white">
                                          {file.type.startsWith('image/') ? (
                                            <img 
                                              src={URL.createObjectURL(file)} 
                                              alt={`Solution ${index + 1}`} 
                                              className="max-w-full h-auto max-h-[600px] object-contain shadow-sm border border-gray-50"
                                              style={{ transform: `rotate(${rotations[file.name] || 0}deg)` }}
                                            />
                                          ) : (
                                            <div className="py-10 flex flex-col items-center text-gray-400">
                                              <FileType className="w-10 h-10 mb-2 opacity-20" />
                                              <p className="text-xs font-medium">{file.name}</p>
                                              <p className="text-[10px opacity-50">Document format (Preview not available here)</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}

                                    {solutionFiles.length === 0 && (
                                      <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-lg">
                                        <FileQuestion className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                        <p className="text-xs text-gray-400 font-medium tracking-tight">No solution keys were uploaded for this evaluation.</p>
                                      </div>
                                    )}

                                    {/* Marked Content Box */}
                                    {studentFiles.length > 0 && (
                                      <div className="mt-6 pt-4 border-t border-gray-100">
                                        <div className="flex items-center space-x-2 mb-3">
                                          <div className="p-1.5 bg-amber-100 rounded-lg">
                                            <Search className="w-3.5 h-3.5 text-amber-600" />
                                          </div>
                                          <h3 className="text-[12px] font-black text-amber-900 uppercase tracking-widest">Marked Content (Student Script 1)</h3>
                                        </div>
                                        
                                        <div className="bg-[#fdfdfd] rounded-xl border border-amber-100 shadow-lg p-4 sm:p-6 flex flex-col items-center overflow-hidden">
                                          <div className="max-w-full relative shadow-[0_20px_40px_rgba(0,0,0,0.1)] border-4 border-white rounded-sm transform hover:scale-[1.01] transition-all duration-500 cursor-zoom-in overflow-hidden">
                                            <img 
                                              src={selectedSubject === 'English' 
                                                ? "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/english-eval-script.png"
                                                : "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/bangla-eval-script.png"} 
                                              alt="Student Script" 
                                              className="max-w-full h-auto max-h-[600px] object-contain rounded-sm transition-transform duration-300"
                                              style={{ transform: `rotate(${rotations[studentFiles[0]?.name] || 0}deg)` }}
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/manual-eval-script.png";
                                              }}
                                            />
                                            {/* Annotation Overlays - Generated by AI */}
                                            <div className="absolute inset-0 pointer-events-none select-none">
                                              {aiEvaluationData?.annotations.map((anno, idx) => {
                                                if (anno.type === 'underline') {
                                                  return (
                                                    <div 
                                                      key={idx}
                                                      className="absolute bg-red-600 opacity-80 rounded-full"
                                                      style={{ 
                                                        top: `${anno.top}%`, 
                                                        left: `${anno.left}%`, 
                                                        width: `${anno.width || 10}%`, 
                                                        height: '2px' 
                                                      }}
                                                    />
                                                  );
                                                }
                                                if (anno.type === 'tick') {
                                                  return (
                                                    <div 
                                                      key={idx}
                                                      className="absolute text-emerald-500 font-bold text-2xl drop-shadow-sm"
                                                      style={{ top: `${anno.top}%`, left: `${anno.left}%` }}
                                                    >
                                                      ✓
                                                    </div>
                                                  );
                                                }
                                                if (anno.type === 'cross') {
                                                  return (
                                                    <div 
                                                      key={idx}
                                                      className="absolute text-red-600 font-bold text-2xl drop-shadow-sm"
                                                      style={{ top: `${anno.top}%`, left: `${anno.left}%` }}
                                                    >
                                                      ✕
                                                    </div>
                                                  );
                                                }
                                                if (anno.type === 'text') {
                                                  return (
                                                    <div 
                                                      key={idx}
                                                      className="absolute text-[12px] font-bold text-red-600 bg-white/20 px-1 py-0.5 rounded whitespace-nowrap"
                                                      style={{ top: `${anno.top}%`, left: `${anno.left}%` }}
                                                    >
                                                      {anno.text}
                                                    </div>
                                                  );
                                                }
                                                if (anno.type === 'score') {
                                                  return (
                                                    <div 
                                                      key={idx}
                                                      className="absolute text-[#e11d48] font-black text-[48px] leading-none drop-shadow-md"
                                                      style={{ 
                                                        bottom: `${100 - anno.top}%`, 
                                                        left: `${anno.left}%`,
                                                        fontFamily: '"Comic Sans MS", cursive, sans-serif'
                                                      }}
                                                    >
                                                      {anno.text}
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              })}
                                              
                                              {/* Fallback pattern matching the user provided image */}
                                              {!aiEvaluationData && (
                                                <>
                                                  {/* (i) Tick */}
                                                  <div className="absolute top-[22%] left-[62%] text-emerald-500 font-bold text-2xl">✓</div>
                                                  
                                                  {/* (ii) Cross + Text */}
                                                  <div className="absolute top-[35%] left-[62%] text-red-600 font-bold text-2xl">✕</div>
                                                  <div className="absolute top-[38%] left-[52%] text-[14px] font-bold text-red-600 whitespace-nowrap">হাইপোডার্মিস উপস্থিত থাকে</div>
                                                  
                                                  {/* (iii) Tick */}
                                                  <div className="absolute top-[48%] left-[62%] text-emerald-500 font-bold text-2xl">✓</div>
                                                  
                                                  {/* (iv) Tick */}
                                                  <div className="absolute top-[60%] left-[62%] text-emerald-500 font-bold text-2xl">✓</div>
                                                  
                                                  {/* (v) Cross + Text */}
                                                  <div className="absolute top-[72%] left-[62%] text-red-600 font-bold text-2xl">✕</div>
                                                  <div className="absolute top-[75%] left-[52%] text-[14px] font-bold text-red-600 whitespace-nowrap">এটি মূলের বৈশিষ্ট্য, কাণ্ডের নয়</div>
                                                  
                                                  {/* Score 02 */}
                                                  <div className="absolute bottom-[2%] left-[5%] text-[#e11d48] font-black text-[56px] leading-none drop-shadow-md" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>02</div>
                                                </>
                                              )}
                                              
                                              {/* Additional scribbles for authenticity */}
                                              <div className="absolute top-[5%] left-[2%] w-10 h-10 border-2 border-red-500/10 rounded-full rotate-12 opacity-30"></div>
                                            </div>
                                          </div>
                                          
                                          <div className="mt-6 flex items-center space-x-4">
                                            <button className="text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-100/80 px-4 py-1.5 rounded-full transition-all border border-amber-200">Adjust Annotations</button>
                                            <button className="text-[11px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-4 py-1.5 rounded-full transition-all border border-gray-200">Recalculate</button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Always show the sample answer as a reference context if it was used */}
                                    {(aiEvaluationData || solutionFiles.length > 0) && (
                                      <div className="mt-4 relative pt-1">
                                        <div className="absolute right-0 top-0 bg-[#3b82f6] text-white text-[9px] font-black px-3 py-1 rounded-bl-lg shadow uppercase tracking-widest z-10">AI Extraction Context</div>
                                        <div className="border border-gray-200 p-4 pt-6 text-[14px] leading-loose text-gray-700 bg-white shadow-inner relative overflow-hidden font-sans">
                                          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-20"></div>
                                          
                                          {aiEvaluationData?.extractionSummary ? (
                                            <div className="mb-4">
                                              <p className="font-bold text-gray-800 mb-2">Extraction Summary:</p>
                                              <p className="text-gray-600 bg-gray-50 p-4 rounded border border-gray-100">
                                                {aiEvaluationData.extractionSummary}
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="bg-[#f9fafb] p-4 border border-gray-50 rounded text-center mb-4 font-bold text-gray-800">
                                              'ব্যক্তি নশ্বর; কর্মই অবিনশ্বর'-'সোনার তরী' কবিতার আলোকে ব্যাখ্যা কর।
                                            </div>
                                          )}
                                          
                                          {!aiEvaluationData && (
                                            <p className="italic opacity-80 mb-4">
                                              Extraction Summary: কবির গভীর জীবনদর্শনের পরিচয়, মহাকালের নিষ্ঠুর কালগ্রাস, কর্মের অবিনশ্বরতা সংক্রান্ত মূলভাবগুলো উত্তরপত্রে থাকা আবশ্যক।
                                            </p>
                                          )}
                                          
                                          <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
                                            <h4 className="text-[13px] font-black text-gray-900 mb-3 underline decoration-blue-300 decoration-2 underline-offset-4 flex items-center">
                                              <Zap className="w-3.5 h-3.5 mr-2 text-orange-500" />
                                              AI Marking Rubric (Derived):
                                            </h4>
                                            <ul className="space-y-2 text-[13px] text-gray-600">
                                              {aiEvaluationData?.markingRubric ? (
                                                aiEvaluationData.markingRubric.map((point, pIdx) => (
                                                  <li key={pIdx} className="flex items-start space-x-3">
                                                    <div className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 shadow-sm shadow-blue-200"></div>
                                                    <span>{point}</span>
                                                  </li>
                                                ))
                                              ) : (
                                                <li className="flex items-start space-x-3">
                                                  <div className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 shadow-sm shadow-blue-200"></div>
                                                  <span>জীবনদর্শনের ব্যাখ্যা (০.৫ নম্বর), মহাকালের স্রোত (১.০ নম্বর), বানান ও শব্দ চয়ন (নম্বর কর্তন নীতি)।</span>
                                                </li>
                                              )}
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Marked Content Box Section Removed from here */}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown & Analysis Toggles */}
                    <div className="space-y-4">
                      {aiEvaluationData?.comments && (
                        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl shadow-inner mb-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span className="text-[12px] font-black text-blue-900 uppercase tracking-widest">AI Comprehensive Analysis</span>
                          </div>
                          <p className="text-[13px] text-gray-700 leading-relaxed font-medium">
                            {aiEvaluationData.comments}
                          </p>
                        </div>
                      )}
                      
                      <button className="w-full group flex items-center justify-between p-4 bg-[#f8fbff] border border-blue-100 rounded-xl hover:bg-blue-50 transition-all shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <LayoutDashboard className="w-4 h-4" />
                          </div>
                          <span className="text-[12px] font-black text-blue-900 uppercase tracking-widest">Detailed Score Breakdown</span>
                        </div>
                        <Plus className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Engine Meta Bar */}
                  <div className="bg-gray-50/80 px-6 py-3 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center space-x-8 text-[11px] font-black text-gray-400 uppercase tracking-tight">
                      <div className="flex items-center space-x-2">
                        <span className="opacity-60">Input Tokens:</span>
                        <span className="text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-100 shadow-xs">
                          {aiEvaluationData ? '2,142' : '0'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="opacity-60">Output Tokens:</span>
                        <span className="text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-100 shadow-xs">
                          {aiEvaluationData ? '458' : '0'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="opacity-60">Latency:</span>
                        <span className="text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-100 shadow-xs">
                          {aiEvaluationData ? '4.8s' : '0s'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-600 font-black italic tracking-widest text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>GEMINI 3 FLASH PRECISION ENGINE</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      );
    }

    if (activeTab === 'Exam' && activeSubItem === 'examiner-perm') {
      const mockTeachersList = [
        { tpin: '6116', name: 'Nazmul Alam (ESM)', phone: '880187199702', passingYear: '2014', institute: 'DIU', dept: 'EEE' },
        { tpin: '17304', name: 'Sakib Imtiaz Rony', phone: '01303067268', passingYear: '2021', institute: 'BUET', dept: 'CSE' },
        { tpin: '21350', name: 'Shajed Ahmed Chowdhury', phone: '01902139021', passingYear: '2022', institute: 'DU', dept: 'EEE' },
      ];

      const getFilteredTeachers = () => {
        return mockTeachersList.filter(t => {
          if (examinerBulkFilters.tpin) {
            const queryTp = examinerBulkFilters.tpin.trim();
            if (queryTp && !t.tpin.includes(queryTp)) return false;
          }
          return true;
        });
      };

      const filteredTeachers = getFilteredTeachers();

      const handleToggleAllTeachers = () => {
        if (selectedTeachers.length === filteredTeachers.length) {
          setSelectedTeachers([]);
        } else {
          setSelectedTeachers(filteredTeachers.map(t => t.tpin));
        }
      };

      const handleToggleTeacherCheckbox = (tpin: string) => {
        setSelectedTeachers(prev => 
          prev.includes(tpin) ? prev.filter(id => id !== tpin) : [...prev, tpin]
        );
      };

      const handleToggleProgram = (programId: string) => {
        setBulkPrograms(prev => prev.map(col => {
          return {
            ...col,
            programs: col.programs.map(prog => {
              if (prog.id === programId) {
                const nextChecked = !prog.checked;
                return {
                  ...prog,
                  checked: nextChecked,
                  subjects: prog.subjects.map(sub => ({ ...sub, checked: nextChecked }))
                };
              }
              return prog;
            })
          };
        }));
      };

      const handleToggleSubject = (programId: string, subjectId: string) => {
        setBulkPrograms(prev => prev.map(col => {
          return {
            ...col,
            programs: col.programs.map(prog => {
              if (prog.id === programId) {
                const updatedSubjects = prog.subjects.map(sub => 
                  sub.id === subjectId ? { ...sub, checked: !sub.checked } : sub
                );
                const allChecked = updatedSubjects.every(sub => sub.checked);
                return {
                  ...prog,
                  checked: allChecked,
                  subjects: updatedSubjects
                };
              }
              return prog;
            })
          };
        }));
      };

      const handleSaveBulkPermissions = () => {
        setExaminerReviewPermissions(prev => {
          const updated = { ...prev };
          selectedTeachers.forEach(tpin => {
            updated[tpin] = bulkReviewRequestChecked;
          });
          return updated;
        });
        setExamPermToast("Bulk Subject Permissions updated successfully!");
        setTimeout(() => setExamPermToast(null), 3000);
      };

      return (
        <div className="flex-1 flex flex-col items-center justify-start bg-gray-50/10 overflow-y-auto px-6 pt-8 pb-20 custom-scrollbar w-full">
          {/* Toast Message */}
          {examPermToast && (
            <div className="fixed bottom-5 right-5 bg-gray-900 text-white text-xs px-4 py-2.5 rounded shadow-lg z-50 flex items-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{examPermToast}</span>
            </div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl text-left"
          >
            {/* If Bulk Permission is NOT active (Image 1 screen) */}
            {!isBulkPermissionActive ? (
              <>
                {/* Blue Bulk Permission Button at top left */}
                <div className="mb-4">
                  <button 
                    onClick={() => {
                      setIsBulkPermissionActive(true);
                      setExaminerSearchSubmitted(false);
                      setShowBulkDetailView(false);
                    }}
                    className="bg-[#337ab7] hover:bg-[#286090] text-white font-bold text-xs px-4 py-2 rounded shadow-sm cursor-pointer transition-all border border-[#2e6da4]"
                  >
                    Bulk Permission
                  </button>
                </div>

                {/* Manage Permission Card */}
                <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden text-left mb-6 font-sans w-full">
                  <div className="bg-[#002d5b] text-white px-4 py-3 flex items-center">
                    <h2 className="text-xs font-bold uppercase tracking-wider flex items-center">
                      <span className="w-1.5 h-3.5 bg-red-500 rounded-sm mr-2.5 inline-block"></span>
                      Manage Permission
                    </h2>
                  </div>
                  <div className="p-6 bg-white space-y-4">
                    {/* Row 1 Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5">
                      <div className="relative">
                        <select 
                          value={managePermFilters.organization}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, organization: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>All Organization</option>
                          <option>UDVASH</option>
                          <option>UNMESH</option>
                          <option>ONLINE CARE</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.program}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, program: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>All Program</option>
                          <option>Varsity 'KA' Admission Program</option>
                          <option>Engineering Admission Program</option>
                          <option>SSC Model Test</option>
                          <option>HSC Model Test</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.session}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, session: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>All Session</option>
                          <option>2026</option>
                          <option>2025</option>
                          <option>2024</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.course}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, course: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>All Course</option>
                          <option>Varsity 'KA' Offline Exam 2025</option>
                          <option>NDC & SJC All Service</option>
                          <option>HCC All Service</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.subject}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>All Subject</option>
                          <option>Physics</option>
                          <option>Chemistry</option>
                          <option>Higher Math</option>
                          <option>Biology</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div>
                        <input 
                          type="text" 
                          placeholder="[TPIN] Name (Batch)"
                          value={managePermFilters.tpin}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, tpin: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Row 2 Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5">
                      <div>
                        <input 
                          type="text" 
                          placeholder="Mobile Number"
                          value={managePermFilters.mobileNumber}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, mobileNumber: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans placeholder:text-gray-400"
                        />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.permissionStatus}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, permissionStatus: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>Permission Status</option>
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.teacherLevel}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, teacherLevel: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>Teacher Level</option>
                          <option>Regular</option>
                          <option>Expert</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.status}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>Status</option>
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select 
                          value={managePermFilters.displayPerPage}
                          onChange={(e) => setManagePermFilters(prev => ({ ...prev, displayPerPage: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-7 cursor-pointer"
                        >
                          <option>10</option>
                          <option>25</option>
                          <option>50</option>
                          <option>100</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <div>
                        <button 
                          onClick={() => {
                            setExamPermToast("Search Completed Successfully!");
                            setTimeout(() => setExamPermToast(null), 2000);
                          }}
                          className="w-full bg-[#337ab7] hover:bg-[#286090] text-white font-bold text-xs py-1.5 px-4 rounded transition-all shadow-xs flex items-center justify-center cursor-pointer border border-[#2e6da4]"
                        >
                          <Search className="w-3.5 h-3.5 mr-1" />
                          <span>Search</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* If Bulk Permission IS active (Image 2 & 3 & 4 screens) */
              <>
                {/* Back Link or Navigation */}
                <div className="mb-4">
                  <button 
                    onClick={() => {
                      setIsBulkPermissionActive(false);
                      setShowBulkDetailView(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>← Back to Manage Permission</span>
                  </button>
                </div>

                {/* Examiner Permission Bulk Card */}
                <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden text-left mb-6 font-sans w-full">
                  <div className="bg-[#002d5b] text-white px-4 py-3 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider flex items-center">
                      <span className="w-1.5 h-3.5 bg-red-500 rounded-sm mr-2.5 inline-block"></span>
                      Examiner Permission
                    </h2>
                  </div>

                  <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Organization :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.organization}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, organization: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>Select Organization</option>
                              <option>UDVASH</option>
                              <option>UNMESH</option>
                              <option>ONLINE CARE</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Session :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.session}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, session: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>Select Session</option>
                              <option>2026</option>
                              <option>2025</option>
                              <option>2024</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Subject :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.subject}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, subject: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>Select All</option>
                              <option>Physics</option>
                              <option>Chemistry</option>
                              <option>Higher Mathematics</option>
                              <option>Biology</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Permission Status :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.permissionStatus}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, permissionStatus: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>All</option>
                              <option>Yes</option>
                              <option>No</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            TPIN :
                          </label>
                          <div className="w-[65%]">
                            <input 
                              type="text" 
                              placeholder="TPIN with comma separate (e.g. 6116)"
                              value={examinerBulkFilters.tpin}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, tpin: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Program :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.program}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, program: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>Select Program</option>
                              <option>Varsity 'KA' Admission Program</option>
                              <option>Engineering Admission Program</option>
                              <option>HSC Model Test</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Course :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.course}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, course: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>Select All</option>
                              <option>Varsity 'KA' Offline Exam 2025</option>
                              <option>NDC & SJC All Service</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Version :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.version}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, version: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>All</option>
                              <option>Bangla</option>
                              <option>English</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                            Teacher Level :
                          </label>
                          <div className="w-[65%] relative">
                            <select 
                              value={examinerBulkFilters.teacherLevel}
                              onChange={(e) => setExaminerBulkFilters(prev => ({ ...prev, teacherLevel: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                            >
                              <option>Teacher Level</option>
                              <option>Regular</option>
                              <option>Expert</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Centered Submit Button */}
                    <div className="flex justify-center border-b border-gray-100 pb-6 mb-6">
                      <button 
                        onClick={() => {
                          setExaminerSearchSubmitted(true);
                          setSelectedTeachers([]);
                        }}
                        className="bg-[#337ab7] hover:bg-[#286090] border border-[#2e6da4] text-white font-semibold text-xs px-5 py-2 rounded transition-all shadow-xs cursor-pointer"
                      >
                        Submit
                      </button>
                    </div>

                    {/* Results Table inside Bulk Section */}
                    <div className="overflow-x-auto rounded border border-gray-300 mb-4">
                      <table className="w-full border-collapse text-[11px] font-sans text-gray-800 bg-white">
                        <thead>
                          <tr className="bg-gray-200 text-gray-700 font-bold border-b border-gray-300">
                            <th className="border-r border-gray-300 px-3 py-2 w-[5%] text-center">
                              <input 
                                type="checkbox"
                                checked={examinerSearchSubmitted && filteredTeachers.length > 0 && selectedTeachers.length === filteredTeachers.length}
                                onChange={handleToggleAllTeachers}
                                disabled={!examinerSearchSubmitted || filteredTeachers.length === 0}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </th>
                            <th className="border-r border-gray-300 px-3 py-2 text-left font-bold w-[12%]">TPIN</th>
                            <th className="border-r border-gray-300 px-3 py-2 text-left font-bold w-[25%]">Nick Name</th>
                            <th className="border-r border-gray-300 px-3 py-2 text-left font-bold w-[18%]">Contact Number</th>
                            <th className="border-r border-gray-300 px-3 py-2 text-left font-bold w-[13%]">HSC Passing Year</th>
                            <th className="border-r border-gray-300 px-3 py-2 text-left font-bold w-[15%]">Institute</th>
                            <th className="px-3 py-2 text-left font-bold w-[12%]">Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!examinerSearchSubmitted ? (
                            <tr>
                              <td colSpan={7} className="text-center py-4 text-gray-500 font-medium bg-gray-50/50">
                                No data
                              </td>
                            </tr>
                          ) : filteredTeachers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-4 text-gray-500 font-medium bg-gray-50/50">
                                No matching teachers found. Try searching for "6116".
                              </td>
                            </tr>
                          ) : (
                            filteredTeachers.map((teacher) => (
                              <tr key={teacher.tpin} className="hover:bg-gray-50/60 border-b border-gray-200">
                                <td className="border-r border-gray-300 px-3 py-2.5 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={selectedTeachers.includes(teacher.tpin)}
                                    onChange={() => handleToggleTeacherCheckbox(teacher.tpin)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>
                                <td className="border-r border-gray-300 px-3 py-2.5 font-semibold">{teacher.tpin}</td>
                                <td className="border-r border-gray-300 px-3 py-2.5">{teacher.name}</td>
                                <td className="border-r border-gray-300 px-3 py-2.5 font-mono">{teacher.phone}</td>
                                <td className="border-r border-gray-300 px-3 py-2.5 font-mono">{teacher.passingYear}</td>
                                <td className="border-r border-gray-300 px-3 py-2.5">{teacher.institute}</td>
                                <td className="px-3 py-2.5">{teacher.dept}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Selected and View Button */}
                    <div className="flex flex-col items-start space-y-4 pt-2">
                      <div className="text-xs font-bold text-gray-700">
                        Total Selected Teacher(s) : <span className="text-blue-700 font-mono text-[13px]">{selectedTeachers.length}</span>
                      </div>

                      <div className="w-full flex justify-center mt-2">
                        <button 
                          onClick={() => {
                            if (selectedTeachers.length === 0) {
                              alert("দয়া করে অন্তত একজন শিক্ষক নির্বাচন করুন! / Please select at least one teacher.");
                              return;
                            }
                            setShowBulkDetailView(true);
                          }}
                          className="bg-[#5cb85c] hover:bg-[#449d44] border border-[#4cae4c] text-white font-bold text-xs px-6 py-2 rounded-sm transition-all shadow-xs cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bulk Permission Details View (Image 4) */}
                {showBulkDetailView && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1 }}
                    className="bg-white border border-gray-200 rounded shadow-xs p-6 font-sans w-full text-left"
                  >
                    {/* Teacher Level Section */}
                    <div className="space-y-2 mb-6 text-xs font-bold text-gray-800">
                      <div className="flex items-center space-x-6">
                        <span className="text-gray-900 font-extrabold text-[12px] min-w-[120px]">Set Teacher Level:</span>
                        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={bulkRegularChecked}
                            onChange={(e) => setBulkRegularChecked(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Regular</span>
                        </label>
                        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={bulkExpertChecked}
                            onChange={(e) => setBulkExpertChecked(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Expert</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <span className="min-w-[120px]"></span>
                        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={bulkReviewRequestChecked}
                            onChange={(e) => setBulkReviewRequestChecked(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Review Request</span>
                        </label>
                      </div>
                    </div>

                    {/* Subject Permission Header with solid underline */}
                    <div className="border-b-2 border-gray-800 pb-1 mb-6">
                      <h3 className="text-xs font-bold text-gray-900 tracking-wider">
                        Subject Permission
                      </h3>
                    </div>

                    {/* 3-Column Program List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      {bulkPrograms.map((col) => (
                        <div key={col.column} className="space-y-6">
                          {col.programs.map((prog) => (
                            <div key={prog.id} className="space-y-2">
                              {/* Main Program Title with Checkbox */}
                              <label className="flex items-start space-x-2 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={prog.checked}
                                  onChange={() => handleToggleProgram(prog.id)}
                                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer shrink-0"
                                />
                                <span className="text-xs font-bold text-gray-700 leading-tight">
                                  {prog.name}
                                </span>
                              </label>

                              {/* Nested Indented Subjects List */}
                              <div className="pl-6 space-y-1.5 border-l border-gray-100 ml-1.5">
                                {prog.subjects.map((sub) => (
                                  <label key={sub.id} className="flex items-center space-x-2 cursor-pointer select-none text-[11px] text-gray-600 hover:text-gray-900">
                                    <input 
                                      type="checkbox"
                                      checked={sub.checked}
                                      onChange={() => handleToggleSubject(prog.id, sub.id)}
                                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-3 w-3 cursor-pointer"
                                    />
                                    <span>{sub.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Centered Save Action Button */}
                    <div className="flex justify-center pt-4 border-t border-gray-100">
                      <button 
                        onClick={handleSaveBulkPermissions}
                        className="bg-[#5cb85c] hover:bg-[#449d44] text-white font-bold text-xs px-8 py-2 rounded shadow-sm cursor-pointer transition-all uppercase tracking-wide border border-[#4cae4c]"
                      >
                        Save & Update Permissions
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      );
    }

    if (activeTab === 'Exam' && activeSubItem === 'eval-report') {
      const getFilteredReports = () => {
        const list = evaluationReports.filter(item => {
          if (evalReportFilters.reportType !== 'All' && item.reportType !== evalReportFilters.reportType) return false;
          if (evalReportFilters.organization !== '--All Organization--' && item.organization !== evalReportFilters.organization) return false;
          if (evalReportFilters.program !== '--All Program--' && item.program !== evalReportFilters.program) return false;
          if (evalReportFilters.session !== '--All Session--' && item.session !== evalReportFilters.session) return false;
          if (evalReportFilters.course !== '--All Course--' && item.course !== evalReportFilters.course) return false;
          if (evalReportFilters.examType !== 'All Exam Type' && item.examType !== evalReportFilters.examType) return false;
          
          if (evalReportFilters.exam) {
            const query = evalReportFilters.exam.toLowerCase();
            const examStr = `${item.examCode || ''} ${item.examName || ''}`.toLowerCase();
            if (!examStr.includes(query)) return false;
          }
          if (evalReportFilters.uniqueSet && evalReportFilters.uniqueSet !== 'All Set') {
            const val = evalReportFilters.uniqueSet;
            const itemVal = (item.uniqueSet || "").trim();
            let isMatch = false;
            if (val === "1") isMatch = itemVal === "Set A" || itemVal === "1" || itemVal === "Set 1";
            else if (val === "2") isMatch = itemVal === "Set B" || itemVal === "2" || itemVal === "Set 2";
            else if (val === "3") isMatch = itemVal === "Set C" || itemVal === "3" || itemVal === "Set 3";
            else if (val === "4") isMatch = itemVal === "Set D" || itemVal === "4" || itemVal === "Set 4";
            else isMatch = itemVal === val;
            
            if (!isMatch) return false;
          }
          if (evalReportFilters.questionSerial && evalReportFilters.questionSerial !== 'All') {
            const qs = evalReportFilters.questionSerial.toLowerCase();
            const itemQS = (item.questionSerial || "").toLowerCase();
            const isMatch = itemQS === qs || itemQS === `q${qs}` || itemQS.includes(qs);
            if (!isMatch) return false;
          }
          if (evalReportFilters.examiner) {
            const queryEx = evalReportFilters.examiner.toLowerCase();
            if (!item.examinerName.toLowerCase().includes(queryEx)) return false;
          }
          if (evalReportFilters.startDate && item.dateTime < evalReportFilters.startDate) return false;
          if (evalReportFilters.endDate && item.dateTime > evalReportFilters.endDate) return false;
          return true;
        });

        // Apply Order By sorting
        if (evalReportFilters.orderBy === 'Highest Review Accepted %') {
          list.sort((a, b) => (b.reviewRequest ?? 0) - (a.reviewRequest ?? 0));
        } else if (evalReportFilters.orderBy === 'Lowest Review Accepted %') {
          list.sort((a, b) => (a.reviewRequest ?? 0) - (b.reviewRequest ?? 0));
        }

        return list.slice(0, parseInt(evalReportFilters.noOfRows) || 100);
      };

      const filteredReports = getFilteredReports();

      const handleAddReport = (e: React.FormEvent) => {
        e.preventDefault();
        const id = `EVR-${Math.floor(100 + Math.random() * 900)}`;
        const newRecord = {
          id,
          organization: newReportForm.organization,
          program: newReportForm.program,
          session: newReportForm.session,
          course: newReportForm.course,
          examCode: newReportForm.examCode || '101',
          examName: newReportForm.examName || 'New Evaluation Exam',
          examType: newReportForm.examType,
          uniqueSet: newReportForm.uniqueSet,
          questionSerial: newReportForm.questionSerial || 'Q1',
          studentRoll: newReportForm.studentRoll || '100001',
          studentName: newReportForm.studentName || 'Student Name',
          examinerName: newReportForm.examinerName || 'M. Nazmul Alam',
          marksObtained: newReportForm.marksObtained || '8.0',
          maxMarks: newReportForm.maxMarks || '10',
          dateTime: '2026-07-04',
          status: 'Evaluated',
          reportType: newReportForm.reportType,
          totalParticipant: 10,
          mcqSubmitted: 5,
          writtenSubmitted: 5,
          writtenEvaluated: 5,
          blankScript: 0,
          writtenPending: 0,
          reviewRequest: 0,
          reviewPending: 0,
          totalEvaluationTime: "01:30",
          maxEvaluationTime: "00:15",
          minEvaluationTime: "00:01",
          avgEvaluationTime: "00:05"
        };

        setEvaluationReports(prev => [...prev, newRecord]);
        setIsAddingReport(false);
        setNewReportForm({
          organization: 'UDVASH',
          program: 'HSC-2026',
          session: '2026',
          course: "HSC'26 Model Test Online Service",
          examCode: '',
          examName: '',
          examType: 'Mcq',
          uniqueSet: 'Set A',
          questionSerial: '',
          studentRoll: '',
          studentName: '',
          examinerName: '',
          marksObtained: '',
          maxMarks: '10',
          reportType: 'Summary'
        });
        alert("Evaluation Report successfully saved to Firebase!");
      };

      const handleDeleteReport = (id: string) => {
        if (window.confirm("Are you sure you want to delete this evaluation report from Firebase?")) {
          setEvaluationReports(prev => prev.filter(r => r.id !== id));
        }
      };

      const handleExportCSV = () => {
        if (filteredReports.length === 0) {
          alert("No records to export.");
          return;
        }
        
        const headers = ["SL", "Report Type", "Organization", "Program", "Session", "Course", "Exam Code", "Exam Name", "Exam Type", "Unique Set", "Question Serial", "Student Roll", "Student Name", "Examiner", "Marks Obtained", "Max Marks", "Date", "Status"];
        const rows = filteredReports.map((r, index) => [
          index + 1,
          r.reportType,
          r.organization,
          r.program,
          r.session,
          r.course,
          r.examCode,
          r.examName,
          r.examType,
          r.uniqueSet,
          r.questionSerial,
          r.studentRoll,
          r.studentName,
          r.examinerName,
          r.marksObtained,
          r.maxMarks,
          r.dateTime,
          r.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `evaluation_report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return (
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Evaluation Report Manager</h1>
              <p className="text-xs text-gray-500 font-medium">Manage and generate evaluation reports, fully synchronized with Firebase.</p>
            </div>
            <button
              onClick={() => setIsAddingReport(true)}
              className="bg-[#002d5b] hover:bg-[#001f40] text-white text-xs font-bold px-4 py-2 rounded shadow flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Evaluation Record</span>
            </button>
          </div>

          {/* Add Report Modal */}
          {isAddingReport && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-lg shadow-xl max-w-xl w-full overflow-hidden"
              >
                <div className="bg-[#002d5b] text-white px-5 py-3.5 flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-wide">Add New Evaluation Record to Firebase</h3>
                  <button onClick={() => setIsAddingReport(false)} className="text-white/80 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddReport} className="p-5 grid grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Organization</label>
                    <select 
                      value={newReportForm.organization} 
                      onChange={e => setNewReportForm({...newReportForm, organization: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="UDVASH">UDVASH</option>
                      <option value="UNMESH">UNMESH</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Program</label>
                    <select 
                      value={newReportForm.program} 
                      onChange={e => setNewReportForm({...newReportForm, program: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="HSC-2026">HSC-2026</option>
                      <option value="VAP 'KA'">VAP 'KA'</option>
                      <option value="Engineering Admission Program">Engineering Admission Program</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Session</label>
                    <select 
                      value={newReportForm.session} 
                      onChange={e => setNewReportForm({...newReportForm, session: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Course</label>
                    <select 
                      value={newReportForm.course} 
                      onChange={e => setNewReportForm({...newReportForm, course: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="HSC'26 Model Test Online Service">HSC'26 Model Test Online Service</option>
                      <option value="Varsity 'KA' Offline Exam 2025">Varsity 'KA' Offline Exam 2025</option>
                      <option value="NDC & SJC All Service">NDC & SJC All Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Exam Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 101" 
                      value={newReportForm.examCode} 
                      onChange={e => setNewReportForm({...newReportForm, examCode: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Exam Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Higher Math 1st Paper" 
                      value={newReportForm.examName} 
                      onChange={e => setNewReportForm({...newReportForm, examName: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Exam Type</label>
                    <select 
                      value={newReportForm.examType} 
                      onChange={e => setNewReportForm({...newReportForm, examType: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Mcq">MCQ</option>
                      <option value="Templated Written">Templated Written</option>
                      <option value="Regular Written">Regular Written</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Unique Set</label>
                    <select 
                      value={newReportForm.uniqueSet} 
                      onChange={e => setNewReportForm({...newReportForm, uniqueSet: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Set A">Set A</option>
                      <option value="Set B">Set B</option>
                      <option value="Set C">Set C</option>
                      <option value="Set D">Set D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Question Serial</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Q1-Q10" 
                      value={newReportForm.questionSerial} 
                      onChange={e => setNewReportForm({...newReportForm, questionSerial: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Student Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Tahmid Rahman" 
                      value={newReportForm.studentName} 
                      onChange={e => setNewReportForm({...newReportForm, studentName: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Student Roll</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 104825" 
                      value={newReportForm.studentRoll} 
                      onChange={e => setNewReportForm({...newReportForm, studentRoll: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Examiner Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Md Jahangir Alam" 
                      value={newReportForm.examinerName} 
                      onChange={e => setNewReportForm({...newReportForm, examinerName: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Obtained Marks</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 8.5" 
                      value={newReportForm.marksObtained} 
                      onChange={e => setNewReportForm({...newReportForm, marksObtained: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Max Marks</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10" 
                      value={newReportForm.maxMarks} 
                      onChange={e => setNewReportForm({...newReportForm, maxMarks: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Report Type</label>
                    <select 
                      value={newReportForm.reportType} 
                      onChange={e => setNewReportForm({...newReportForm, reportType: e.target.value})}
                      className="w-full border border-gray-300 rounded p-1.5 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Summary">Summary</option>
                      <option value="Subject Wise Summary">Subject Wise Summary</option>
                      <option value="Teacher Wise Summary">Teacher Wise Summary</option>
                      <option value="Teacher Subject Question Wise Summary">Teacher Subject Question Wise Summary</option>
                      <option value="Teacher Subject Wise Summary">Teacher Subject Wise Summary</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex justify-end space-x-2.5 pt-4 border-t border-gray-100 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingReport(false)}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-[#002d5b] hover:bg-[#001f40] text-white text-xs font-bold px-4 py-2 rounded cursor-pointer"
                    >
                      Save to Firebase
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Collapsible Filter Card */}
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
            {/* Header with Minimize Toggle */}
            <div className="bg-[#002d5b] text-white px-4 py-2.5 flex items-center justify-between rounded-t border-b border-gray-200">
              <span className="font-bold text-sm tracking-wide">Evaluation New</span>
              <button 
                onClick={() => setIsEvalReportCollapsed(!isEvalReportCollapsed)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
                title={isEvalReportCollapsed ? "Expand Filters" : "Collapse Filters"}
              >
                {isEvalReportCollapsed ? <Plus className="w-4 h-4 text-white" /> : <Minus className="w-4 h-4 text-white" />}
              </button>
            </div>

            {/* Filter Body with custom Right Column containing Unique Set & Question Serial */}
            <AnimatePresence initial={false}>
              {!isEvalReportCollapsed && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-white border-t border-gray-100"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                      {/* LEFT COLUMN */}
                      <div className="space-y-4">
                        {/* Report Type */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Report Type</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.reportType}
                              onChange={e => setEvalReportFilters({...evalReportFilters, reportType: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500 font-medium text-[13px]"
                            >
                              <option value="Summary">Summary</option>
                              <option value="Subject Wise Summary">Subject Wise Summary</option>
                              <option value="Teacher Wise Summary">Teacher Wise Summary</option>
                              <option value="Teacher Subject Question Wise Summary">Teacher Subject Question Wise Summary</option>
                              <option value="Teacher Subject Wise Summary">Teacher Subject Wise Summary</option>
                            </select>
                          </div>
                        </div>

                        {/* Program */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Program</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.program}
                              onChange={e => setEvalReportFilters({...evalReportFilters, program: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="--All Program--">--All Program--</option>
                              <option value="VAP 'KA'">VAP 'KA'</option>
                              <option value="Engineering Admission Program">Engineering Admission Program</option>
                              <option value="HSC-2026">HSC-2026</option>
                            </select>
                          </div>
                        </div>

                        {/* Course */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Course</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.course}
                              onChange={e => setEvalReportFilters({...evalReportFilters, course: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="--All Course--">--All Course--</option>
                              <option value="Varsity 'KA' Offline Exam 2025">Varsity 'KA' Offline Exam 2025</option>
                              <option value="NDC & SJC All Service">NDC & SJC All Service</option>
                              <option value="HSC'26 Model Test Online Service">HSC'26 Model Test Online Service</option>
                            </select>
                          </div>
                        </div>

                        {/* Exam Type */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Exam Type</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.examType}
                              onChange={e => setEvalReportFilters({...evalReportFilters, examType: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="All Exam Type">All Exam Type</option>
                              <option value="Mcq">MCQ</option>
                              <option value="Templated Written">Templated Written</option>
                              <option value="Regular Written">Regular Written</option>
                            </select>
                          </div>
                        </div>

                        {/* Start Date */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Start Date</label>
                          <div className="col-span-8">
                            <input
                              type="date"
                              value={evalReportFilters.startDate}
                              onChange={e => setEvalReportFilters({...evalReportFilters, startDate: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-gray-50 shadow-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* End Date */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">End Date</label>
                          <div className="col-span-8">
                            <input
                              type="date"
                              value={evalReportFilters.endDate}
                              onChange={e => setEvalReportFilters({...evalReportFilters, endDate: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-gray-50 shadow-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* No of Row(s) */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">No of Row(s)</label>
                          <div className="col-span-8">
                            <input
                              type="text"
                              value={evalReportFilters.noOfRows}
                              onChange={e => setEvalReportFilters({...evalReportFilters, noOfRows: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="space-y-4">
                        {/* Organization */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Organization</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.organization}
                              onChange={e => setEvalReportFilters({...evalReportFilters, organization: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="--All Organization--">--All Organization--</option>
                              <option value="UDVASH">UDVASH</option>
                              <option value="UNMESH">UNMESH</option>
                            </select>
                          </div>
                        </div>

                        {/* Session */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Session</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.session}
                              onChange={e => setEvalReportFilters({...evalReportFilters, session: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500"
                            >
                              <option value="--All Session--">--All Session--</option>
                              <option value="2025">2025</option>
                              <option value="2026">2026</option>
                            </select>
                          </div>
                        </div>

                        {/* Exam Name */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Exam</label>
                          <div className="col-span-8">
                            <input
                              type="text"
                              placeholder="[Code] Exam Name"
                              value={evalReportFilters.exam}
                              onChange={e => setEvalReportFilters({...evalReportFilters, exam: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        {/* Unique Set Option (Added below Exam field) */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-red-600 text-[13px]">Unique Set</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.uniqueSet}
                              onChange={e => setEvalReportFilters({...evalReportFilters, uniqueSet: e.target.value})}
                              className="w-full border border-[#002d5b]/40 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-[#002d5b] font-medium"
                            >
                              <option value="All Set">All Sets</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                            </select>
                          </div>
                        </div>

                        {/* Question Serial Option (Added below Unique Set) */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-red-600 text-[13px]">Question Serial</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.questionSerial}
                              onChange={e => setEvalReportFilters({...evalReportFilters, questionSerial: e.target.value})}
                              className="w-full border border-[#002d5b]/40 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-[#002d5b] font-medium"
                            >
                              <option value="All">All Question Serial</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="8">8</option>
                              <option value="9">9</option>
                              <option value="10">10</option>
                            </select>
                          </div>
                        </div>

                        {/* Examiner */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-gray-700 text-[13px]">Examiner</label>
                          <div className="col-span-8">
                            <input
                              type="text"
                              placeholder="Pin / Name/ Hsc Passing Year"
                              value={evalReportFilters.examiner}
                              onChange={e => setEvalReportFilters({...evalReportFilters, examiner: e.target.value})}
                              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                            />
                          </div>
                        </div>


                        {/* Order by Option */}
                        <div className="grid grid-cols-12 items-center gap-2">
                          <label className="col-span-4 text-right pr-4 font-bold text-red-600 text-[13px]">Order by</label>
                          <div className="col-span-8">
                            <select
                              value={evalReportFilters.orderBy || 'All'}
                              onChange={e => setEvalReportFilters({...evalReportFilters, orderBy: e.target.value})}
                              className="w-full border border-blue-400 rounded px-2.5 py-1.5 text-xs text-gray-700 bg-white shadow-sm focus:outline-none focus:border-[#002d5b] font-semibold"
                            >
                              <option value="All">All</option>
                              <option value="Highest Review Accepted %">Highest Review Accepted %</option>
                              <option value="Lowest Review Accepted %">Lowest Review Accepted %</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex items-center justify-center space-x-3.5 mt-8 border-t border-gray-100 pt-5">
                      <button
                        onClick={() => setEvalReportSearchTriggered(true)}
                        className="bg-[#337ab7] hover:bg-[#286090] text-white text-[12px] font-bold px-8 py-2 rounded shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer border border-[#2e6da4]"
                      >
                        <Search className="w-4 h-4" />
                        <span>Search</span>
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="bg-[#5bc0de] hover:bg-[#31b0d5] text-white text-[12px] font-bold px-8 py-2 rounded shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer border border-[#46b8da]"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Results Table */}
          {evalReportSearchTriggered && (
            <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-[#002d5b] text-sm flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-blue-700 inline-block"></span>
                    Evaluation List Results
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Showing {filteredReports.length} matches from Firebase storage.</p>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  <span>Database Online</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#002d5b] text-white border-b border-gray-300 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-3 border border-gray-200/20 text-center">SL</th>
                      <th className="p-3 border border-gray-200/20">Exam Code</th>
                      <th className="p-3 border border-gray-200/20 min-w-[200px]">Exam Name</th>
                      <th className="p-3 border border-gray-200/20">Exam Type</th>
                      <th className="p-3 border border-gray-200/20 text-center">Total Part.</th>
                      <th className="p-3 border border-gray-200/20 text-center">MCQ Sub.</th>
                      <th className="p-3 border border-gray-200/20 text-center">Written Sub.</th>
                      <th className="p-3 border border-gray-200/20 text-center">Written Eval.</th>
                      <th className="p-3 border border-gray-200/20 text-center">Blank Script</th>
                      <th className="p-3 border border-gray-200/20 text-center">Written Pend.</th>
                      <th className="p-3 border border-gray-200/20 text-center">Review Request</th>
                      <th className="p-3 border border-gray-200/20 text-center">Review Pend.</th>
                      <th className="p-3 border border-gray-200/20 text-center text-teal-300 min-w-[130px]">Review Accepted (%)</th>
                      <th className="p-3 border border-gray-200/20 text-center">Total Eva. Time</th>
                      <th className="p-3 border border-gray-200/20 text-center">Max Eva. Time</th>
                      <th className="p-3 border border-gray-200/20 text-center">Min Eva. Time</th>
                      <th className="p-3 border border-gray-200/20 text-center">Avg. Eva. Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="p-8 text-center text-gray-400 font-medium italic">
                          No evaluation reports found matching your selected filters. Try adding a new evaluation record above!
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-50/70 transition-colors text-gray-700">
                          <td className="p-3 border border-gray-100 font-medium text-gray-500 text-center">{i + 1}</td>
                          <td className="p-3 border border-gray-100 font-bold text-gray-900">{r.examCode}</td>
                          <td className="p-3 border border-gray-100">
                            <div className="font-semibold text-blue-900">{r.examName}</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>Org: <strong className="text-gray-600">{r.organization}</strong></span>
                              <span>•</span>
                              <span>Report Type: <strong className="text-indigo-600">{r.reportType}</strong></span>
                              <span>•</span>
                              <span>Set: <strong className="text-blue-600">{r.uniqueSet || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>Q Serial: <strong className="text-purple-600">{r.questionSerial || 'N/A'}</strong></span>
                            </div>
                          </td>
                          <td className="p-3 border border-gray-100 whitespace-nowrap">
                            <span className="bg-gray-100 text-gray-800 font-medium px-2 py-0.5 rounded text-[10px] border border-gray-200">
                              {r.examType}
                            </span>
                          </td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-gray-800">{r.totalParticipant ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-gray-800">{r.mcqSubmitted ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-gray-800">{r.writtenSubmitted ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-emerald-600">{r.writtenEvaluated ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-gray-500">{r.blankScript ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-amber-600">{r.writtenPending ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-blue-600">{r.reviewRequest ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-semibold text-center text-red-500">{r.reviewPending ?? 0}</td>
                          <td className="p-3 border border-gray-100 font-bold text-center text-teal-600 bg-teal-50/30">
                            {r.writtenEvaluated && r.writtenEvaluated > 0 ? (
                              <span>{(((r.reviewRequest || 0) / r.writtenEvaluated) * 100).toFixed(1)}%</span>
                            ) : (
                              <span className="text-gray-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="p-3 border border-gray-100 font-mono text-center text-gray-600">{r.totalEvaluationTime || '-'}</td>
                          <td className="p-3 border border-gray-100 font-mono text-center text-gray-600">{r.maxEvaluationTime || '-'}</td>
                          <td className="p-3 border border-gray-100 font-mono text-center text-gray-600">{r.minEvaluationTime || '-'}</td>
                          <td className="p-3 border border-gray-100 font-mono text-center text-gray-700 font-bold">{r.avgEvaluationTime || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Exam' && activeSubItem === 'exam-perm') {
      const getFilteredExamPermissions = () => {
        return examPermissions.filter(item => {
          if (examPermFilters.organization !== 'All Organization' && item.organization !== examPermFilters.organization) return false;
          if (examPermFilters.program !== 'All Program' && item.program !== examPermFilters.program) return false;
          if (examPermFilters.session !== 'All Session' && item.session !== examPermFilters.session) return false;
          if (examPermFilters.course !== 'All Course' && item.course !== examPermFilters.course) return false;
          if (examPermFilters.examType !== 'All Exam Type' && item.examType !== examPermFilters.examType) return false;
          
          if (examPermFilters.evaluationPermission !== 'All Permission' && item.examinerPermission !== examPermFilters.evaluationPermission) return false;
          if (examPermFilters.analysisPermission !== 'All Permission' && item.analysisPermission !== examPermFilters.analysisPermission) return false;
          if (examPermFilters.meritPermission !== 'All' && item.meritPermission !== examPermFilters.meritPermission) return false;
          if (examPermFilters.highestMarksPermission !== 'All' && item.highestMarksPermission !== examPermFilters.highestMarksPermission) return false;
          
          if (examPermFilters.keyword) {
            const searchStr = `${item.examCode || ''} ${item.examName || ''}`.toLowerCase();
            if (!searchStr.includes(examPermFilters.keyword.toLowerCase())) return false;
          }
          return true;
        });
      };

      const filteredExams = getFilteredExamPermissions();

      const formatNow = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      };

      const toDateTimeLocal = (str: string) => {
        if (!str || str === '---') return '';
        try {
          const parts = str.split(' ');
          if (parts.length < 2) return '';
          const datePart = parts[0]; 
          const timePart = parts[1]; 
          const ampm = parts[2]; 
          
          let [hours, minutes] = timePart.split(':').map(Number);
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          
          return `${datePart}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } catch (e) {
          return '';
        }
      };

      const fromDateTimeLocal = (val: string) => {
        if (!val) return '---';
        const [datePart, timePart] = val.split('T');
        if (!timePart) return datePart + " 12:00 AM";
        let [hours, minutes] = timePart.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${datePart} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
      };

      const handleToggleField = (id: string, field: 'examinerPermission' | 'analysisPermission' | 'meritPermission' | 'highestMarksPermission') => {
        const currentDateTimeStr = formatNow();
        setExamPermissions(prev => prev.map(item => {
          if (item.id === id) {
            const newValue = item[field] === 'Yes' ? 'No' : 'Yes';
            const updatedItem = { ...item, [field]: newValue };
            
            if (field === 'examinerPermission') {
              updatedItem.examinerDateTime = newValue === 'Yes' ? currentDateTimeStr : '---';
            } else if (field === 'analysisPermission') {
              updatedItem.analysisDateTime = newValue === 'Yes' ? currentDateTimeStr : '---';
            } else if (field === 'meritPermission') {
              updatedItem.meritDateTime = newValue === 'Yes' ? currentDateTimeStr : '---';
            } else if (field === 'highestMarksPermission') {
              updatedItem.highestMarksDateTime = newValue === 'Yes' ? currentDateTimeStr : '---';
            }
            
            return updatedItem;
          }
          return item;
        }));

        const targetExam = examPermissions.find(item => item.id === id);
        if (targetExam) {
          const actionText = `${targetExam[field] === 'Yes' ? 'Disabled' : 'Enabled'} ${
            field === 'examinerPermission' ? 'Examiner Permission' :
            field === 'analysisPermission' ? 'Student Analysis Report Permission' :
            field === 'meritPermission' ? 'Show Merit Position' : 'Show Highest Marks'
          }`;
          setExamLogHistory(prev => [
            {
              dateTime: currentDateTimeStr,
              action: actionText,
              user: "nazmulriad4@gmail.com"
            },
            ...prev
          ]);
        }

        setExamPermToast("Permission updated successfully!");
        setTimeout(() => setExamPermToast(null), 3000);
      };

      const handleOpenUpdatePermissionModal = (id: string, field: 'examinerPermission' | 'analysisPermission' | 'meritPermission' | 'highestMarksPermission') => {
        const targetExam = examPermissions.find(item => item.id === id);
        if (targetExam) {
          setUpdatePermissionExam(targetExam);
          setUpdatePermissionField(field);
          setModalPermissionValue(targetExam[field] === 'Yes');
          
          // Get current or new start time
          const dt = targetExam[field + 'DateTime'];
          const initialStart = (dt && dt !== '---' ? dt : formatNow());
          setModalStartTime(toDateTimeLocal(initialStart));
          
          // Get end time if it exists
          const edt = targetExam[field + 'EndDateTime'];
          const initialEnd = (edt && edt !== '---' ? edt : formatNow());
          setModalEndTime(toDateTimeLocal(initialEnd));
          
          // Setup initial subjects
          setModalSubjects([
            { id: "physics", name: "Physics", checked: false },
            { id: "chemistry", name: "Chemistry", checked: false },
            { id: "higherMath", name: "Higher Math", checked: false },
          ]);
          setModalAllSubjectsChecked(false);
        }
      };

      const handleToggleModalSubject = (subjId: string) => {
        setModalSubjects(prev => {
          const updated = prev.map(s => s.id === subjId ? { ...s, checked: !s.checked } : s);
          const allChecked = updated.every(s => s.checked);
          setModalAllSubjectsChecked(allChecked);
          return updated;
        });
      };

      const handleToggleAllModalSubjects = () => {
        const nextVal = !modalAllSubjectsChecked;
        setModalAllSubjectsChecked(nextVal);
        setModalSubjects(prev => prev.map(s => ({ ...s, checked: nextVal })));
      };

      const handleSaveModalPermission = () => {
        if (!updatePermissionExam || !updatePermissionField) return;
        
        const newValueStr = modalPermissionValue ? 'Yes' : 'No';
        const finalTimeStr = fromDateTimeLocal(modalStartTime);
        const finalEndTimeStr = fromDateTimeLocal(modalEndTime);
        
        setExamPermissions(prev => prev.map(item => {
          if (item.id === updatePermissionExam.id) {
            const updatedItem = { ...item, [updatePermissionField]: newValueStr };
            
            if (updatePermissionField === 'examinerPermission') {
              updatedItem.examinerDateTime = newValueStr === 'Yes' ? finalTimeStr : '---';
              updatedItem.examinerEndDateTime = finalEndTimeStr;
            } else if (updatePermissionField === 'analysisPermission') {
              updatedItem.analysisDateTime = newValueStr === 'Yes' ? finalTimeStr : '---';
              updatedItem.analysisEndDateTime = finalEndTimeStr;
            } else if (updatePermissionField === 'meritPermission') {
              updatedItem.meritDateTime = newValueStr === 'Yes' ? finalTimeStr : '---';
              updatedItem.meritEndDateTime = finalEndTimeStr;
            } else if (updatePermissionField === 'highestMarksPermission') {
              updatedItem.highestMarksDateTime = newValueStr === 'Yes' ? finalTimeStr : '---';
              updatedItem.highestMarksEndDateTime = finalEndTimeStr;
            }
            
            return updatedItem;
          }
          return item;
        }));

        // Log the event
        const actionText = `${newValueStr === 'Yes' ? 'Enabled' : 'Disabled'} ${
          updatePermissionField === 'examinerPermission' ? 'Examiner Permission' :
          updatePermissionField === 'analysisPermission' ? 'Student Analysis Report Permission' :
          updatePermissionField === 'meritPermission' ? 'Show Merit Position' : 'Show Highest Marks'
        } (via Update Permission Modal)`;

        setExamLogHistory(prev => [
          {
            dateTime: formatNow(),
            action: actionText,
            user: "nazmulriad4@gmail.com"
          },
          ...prev
        ]);

        setUpdatePermissionExam(null);
        setUpdatePermissionField(null);
        setExamPermToast("Permission updated successfully!");
        setTimeout(() => setExamPermToast(null), 3000);
      };

      return (
        <div className="flex-1 flex flex-col items-center justify-start bg-gray-50/10 overflow-y-auto px-6 pt-8 pb-20 custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl"
          >
            {/* Exam Permission Panel */}
            <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden text-left mb-6 font-sans">
              {/* Header */}
              <div 
                onClick={() => setIsExamPermCollapsed(!isExamPermCollapsed)}
                className="bg-[#002d5b] text-white px-4 py-3 flex items-center justify-between cursor-pointer select-none"
              >
                <h2 className="text-xs font-bold uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-3.5 bg-red-500 rounded-sm mr-2.5 inline-block"></span>
                  Exam Permission
                </h2>
                <button className="text-white hover:text-gray-200 transition-colors">
                  {isExamPermCollapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>
              </div>

              {/* Form Body - Collapsible */}
              {!isExamPermCollapsed && (
                <div className="p-6 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    
                    {/* Row 1: Left: Organization, Right: Program */}
                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Organization
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.organization}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, organization: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All Organization</option>
                          <option>UDVASH</option>
                          <option>UNMESH</option>
                          <option>ONLINE CARE</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Program
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.program}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, program: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All Program</option>
                          <option>Engineering Admission Program</option>
                          <option>Varsity 'KA' Admission Program</option>
                          <option>Varsity 'KHA' Admission Program</option>
                          <option>College Admission Program</option>
                          <option>SSC Model Test</option>
                          <option>HSC Model Test</option>
                          <option>Class 9 Academic Program</option>
                          <option>Class 9 Bangla-English Program</option>
                          <option>Class 10 Academic Program</option>
                          <option>Class 10 Bangla-English Program</option>
                          <option>HSC Bangla-English Full Program</option>
                          <option>Class 11 Academic Program</option>
                          <option>Class 12 Academic Program</option>
                          <option>HSC Bangla-English Special Program</option>
                          <option>Class 8 Bangla-English Full Course (Online)</option>
                          <option>HSC Science Foundation Program</option>
                          <option>HSC 1st Year Basic Course (Top 100 Topics)</option>
                          <option>HSC ICT Program</option>
                          <option>Class 9-10 Bangla-English Full Course</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 2: Left: Session, Right: Course */}
                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Session
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.session}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, session: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All Session</option>
                          <option>2026</option>
                          <option>2025</option>
                          <option>2024</option>
                          <option>2023</option>
                          <option>2022</option>
                          <option>2021</option>
                          <option>2015</option>
                          <option>2014</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Course
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.course}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, course: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All Course</option>
                          <option>NDC & SJC All Service</option>
                          <option>HCC All Service</option>
                          <option>HSC Bangla-English</option>
                          <option>Employee Training Course</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 3: Left: Merit Position Permission, Right: Highest Marks Permission */}
                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Merit Position Permission
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.meritPermission}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, meritPermission: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Highest Marks Permission
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.highestMarksPermission}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, highestMarksPermission: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 4: Left: Evaluation Permission, Right: Analysis Report Permission */}
                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Evaluation Permission
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.evaluationPermission}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, evaluationPermission: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All Permission</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Analysis Report Permission
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.analysisPermission}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, analysisPermission: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All Permission</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Row 5: Left: Exam Type, Right: Keyword */}
                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Exam Type
                      </label>
                      <div className="w-[65%] relative">
                        <select 
                          value={examPermFilters.examType}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, examType: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8 cursor-pointer font-sans"
                        >
                          <option>All Exam Type</option>
                          <option>Templated Written</option>
                          <option>Online Written</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Keyword
                      </label>
                      <div className="w-[65%]">
                        <input 
                          type="text"
                          placeholder="Search Keyword"
                          value={examPermFilters.keyword}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, keyword: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                      </div>
                    </div>

                    {/* Row 6: Left: Display Per Page, Right: Blank */}
                    <div className="flex items-center">
                      <label className="w-[35%] text-right pr-4 text-xs font-bold text-gray-700">
                        Display Per Page
                      </label>
                      <div className="w-[65%]">
                        <input 
                          type="text"
                          value={examPermFilters.displayPerPage}
                          onChange={(e) => setExamPermFilters(prev => ({ ...prev, displayPerPage: e.target.value }))}
                          className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-[35%]"></div>
                      <div className="w-[65%]"></div>
                    </div>

                  </div>

                  {/* Search Button */}
                  <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center">
                    <button 
                      onClick={() => setExamPermSearchTriggered(true)}
                      className="bg-[#337ab7] hover:bg-[#286090] text-white font-bold text-[13px] px-6 py-2 rounded-sm transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Success Toast / Notification */}
            <AnimatePresence>
              {examPermToast && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-5 right-5 bg-[#dff0d8] border border-[#d6e9c6] text-[#3c763d] px-4 py-3 rounded-md shadow-md text-xs font-bold z-50 flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#3c763d]" />
                  <span>{examPermToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Table Section */}
            {examPermSearchTriggered && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden text-left mb-6 font-sans w-full"
              >
                {/* Header of Search Results */}
                <div className="bg-[#002d5b] text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-3.5 bg-red-500 rounded-sm mr-2.5 inline-block"></span>
                    Exam Permission Details
                  </h2>
                  <span className="text-[10px] text-gray-200 font-medium bg-[#1e4a77] px-2.5 py-0.5 rounded">
                    Total {filteredExams.length} Records
                  </span>
                </div>

                <div className="p-4 bg-white">
                  {filteredExams.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 italic font-medium text-xs">
                      No matching exams found. Try adjusting your search filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded border border-gray-300">
                      <table className="w-full border-collapse text-[11px] font-sans text-gray-800 bg-white">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300 text-center text-[11px]">
                            <th className="border-r border-b border-gray-300 px-3 py-3 w-[6%] font-bold text-center">Organization</th>
                            <th className="border-r border-b border-gray-300 px-3 py-3 w-[8%] font-bold text-center">Program Session</th>
                            <th className="border-r border-b border-gray-300 px-3 py-3 w-[11%] font-bold text-center">Course</th>
                            <th className="border-r border-b border-gray-300 px-3 py-3 w-[15%] font-bold text-center">[Code] Exam</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[6%] font-bold text-center">Exam Type</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[7%] font-bold text-center">Examiner Permission</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[10%] font-bold text-center">Start/End Time</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[8%] font-bold text-center">Student Analysis Report Permission</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[10%] font-bold text-center">Start/End Time</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[6%] font-bold text-center">Show Merit Position</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[10%] font-bold text-center">Start/End Time</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[6%] font-bold text-center">Show Highest Marks</th>
                            <th className="border-r border-b border-gray-300 px-2 py-3 w-[10%] font-bold text-center">Start/End Time</th>
                            <th className="border-b border-gray-300 px-3 py-3 w-[5%] font-bold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {filteredExams.map((exam) => (
                            <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors text-center text-[11px] font-sans">
                              {/* Organization */}
                              <td className="border-r border-b border-gray-300 px-3 py-3 text-center font-semibold text-gray-700">
                                {exam.organization || "UDVASH"}
                              </td>
                              
                              {/* Program Session */}
                              <td className="border-r border-b border-gray-300 px-3 py-3 text-center text-gray-600 font-medium">
                                <div className="leading-tight">
                                  <div className="font-semibold text-gray-700">{exam.program}</div>
                                  <div className="text-gray-500 font-mono mt-0.5">{exam.session}</div>
                                </div>
                              </td>
                              
                              {/* Course */}
                              <td className="border-r border-b border-gray-300 px-3 py-3 text-center text-gray-600 font-medium leading-tight">
                                {exam.course}
                              </td>
                              
                              {/* [Code] Exam */}
                              <td className="border-r border-b border-gray-300 px-3 py-3 text-left font-semibold text-gray-700 leading-tight">
                                <div className="text-blue-900 font-medium mb-1">{exam.examCode} {exam.examName}</div>
                              </td>
                              
                              {/* Exam Type */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center text-gray-600 font-medium">
                                {exam.examType}
                              </td>
                              
                              {/* Examiner Permission Toggle */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center">
                                <button 
                                  onClick={() => handleOpenUpdatePermissionModal(exam.id, 'examinerPermission')}
                                  className={`px-3 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer shadow-xs ${
                                    exam.examinerPermission === 'Yes' 
                                      ? 'bg-white text-[#3c763d] border-gray-300 hover:bg-gray-50' 
                                      : 'bg-white text-rose-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {exam.examinerPermission}
                                </button>
                              </td>
                              
                              {/* Examiner Permission Date-Time */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center text-gray-500 font-mono text-[10.5px]">
                                <div className="flex flex-col items-center">
                                  {exam.examinerPermission === 'Yes' && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">Start:</span>
                                      <span>{exam.examinerDateTime || "---"}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">End:</span>
                                    <span>{exam.examinerEndDateTime || "---"}</span>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Student Analysis Report Permission Toggle */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center">
                                <button 
                                  onClick={() => handleOpenUpdatePermissionModal(exam.id, 'analysisPermission')}
                                  className={`px-3 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer shadow-xs ${
                                    exam.analysisPermission === 'Yes' 
                                      ? 'bg-white text-[#3c763d] border-gray-300 hover:bg-gray-50' 
                                      : 'bg-white text-rose-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {exam.analysisPermission}
                                </button>
                              </td>
                              
                              {/* Student Analysis Report Date-Time */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center text-gray-500 font-mono text-[10.5px]">
                                <div className="flex flex-col items-center">
                                  {exam.analysisPermission === 'Yes' && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">Start:</span>
                                      <span>{exam.analysisDateTime || "---"}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">End:</span>
                                    <span>{exam.analysisEndDateTime || "---"}</span>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Show Merit Position Toggle */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center">
                                <button 
                                  onClick={() => handleOpenUpdatePermissionModal(exam.id, 'meritPermission')}
                                  className={`px-3 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer shadow-xs ${
                                    exam.meritPermission === 'Yes' 
                                      ? 'bg-white text-[#3c763d] border-gray-300 hover:bg-gray-50' 
                                      : 'bg-white text-rose-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {exam.meritPermission}
                                </button>
                              </td>
                              
                              {/* Show Merit Position Date-Time */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center text-gray-500 font-mono text-[10.5px]">
                                <div className="flex flex-col items-center">
                                  {exam.meritPermission === 'Yes' && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">Start:</span>
                                      <span>{exam.meritDateTime || "---"}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">End:</span>
                                    <span>{exam.meritEndDateTime || "---"}</span>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Show Highest Marks Toggle */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center">
                                <button 
                                  onClick={() => handleOpenUpdatePermissionModal(exam.id, 'highestMarksPermission')}
                                  className={`px-3 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer shadow-xs ${
                                    exam.highestMarksPermission === 'Yes' 
                                      ? 'bg-white text-[#3c763d] border-gray-300 hover:bg-gray-50' 
                                      : 'bg-white text-rose-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {exam.highestMarksPermission}
                                </button>
                              </td>
                              
                              {/* Show Highest Marks Date-Time */}
                              <td className="border-r border-b border-gray-300 px-2 py-3 text-center text-gray-500 font-mono text-[10.5px]">
                                <div className="flex flex-col items-center">
                                  {exam.highestMarksPermission === 'Yes' && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">Start:</span>
                                      <span>{exam.highestMarksDateTime || "---"}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[8px] font-sans font-bold text-gray-400 uppercase">End:</span>
                                    <span>{exam.highestMarksEndDateTime || "---"}</span>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Action (Log button) */}
                              <td className="border-b border-gray-300 px-3 py-3 text-center">
                                <button 
                                  disabled
                                  className="bg-gray-100 text-gray-400 border border-gray-200 text-[11px] font-bold px-3 py-1 rounded cursor-not-allowed inline-flex items-center space-x-1"
                                >
                                  <span>Log</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Log History Modal */}
            <AnimatePresence>
              {selectedLogExam && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-2xl w-full overflow-hidden text-left font-sans"
                  >
                    {/* Header */}
                    <div className="bg-[#002d5b] text-white px-4 py-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center">
                        <span className="w-1.5 h-3.5 bg-red-500 rounded-sm mr-2.5 inline-block"></span>
                        Permission Activity Logs: {selectedLogExam.examCode} {selectedLogExam.examName}
                      </h3>
                      <button 
                        onClick={() => setSelectedLogExam(null)}
                        className="text-white hover:text-gray-200 font-bold text-sm cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-4">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Exam Metadata</span>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-xs bg-gray-50 p-3 rounded border border-gray-100">
                          <div><span className="font-semibold text-gray-700">Organization:</span> {selectedLogExam.organization}</div>
                          <div><span className="font-semibold text-gray-700">Program Session:</span> {selectedLogExam.program} ({selectedLogExam.session})</div>
                          <div><span className="font-semibold text-gray-700">Course:</span> {selectedLogExam.course}</div>
                          <div><span className="font-semibold text-gray-700">Exam Type:</span> {selectedLogExam.examType}</div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Audit Log Trail</span>
                        <div className="mt-2 border border-gray-200 rounded overflow-hidden max-h-60 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-100 text-gray-700 font-bold">
                              <tr>
                                <th className="px-4 py-2 border-b border-gray-200">Date-Time</th>
                                <th className="px-4 py-2 border-b border-gray-200">Action / Change</th>
                                <th className="px-4 py-2 border-b border-gray-200">Operator Email</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {examLogHistory.map((log, lIdx) => (
                                <tr key={lIdx} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-2.5 text-gray-600 font-mono text-[11px]">{log.dateTime}</td>
                                  <td className="px-4 py-2.5 font-medium text-blue-900">{log.action}</td>
                                  <td className="px-4 py-2.5 text-gray-500 font-mono text-[11px]">{log.user}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-100">
                      <button 
                        onClick={() => setSelectedLogExam(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-4 py-1.5 rounded cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Update Permission Modal */}
            <AnimatePresence>
              {updatePermissionExam && updatePermissionField && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded border border-gray-300 shadow-xl max-w-sm w-full overflow-hidden text-left font-sans"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Update Permission
                      </h3>
                      <button 
                        onClick={() => {
                          setUpdatePermissionExam(null);
                          setUpdatePermissionField(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Permission toggle */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-600">Permission</span>
                        <button
                          type="button"
                          onClick={() => setModalPermissionValue(!modalPermissionValue)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                            modalPermissionValue ? 'bg-[#5cb85c]' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                              modalPermissionValue ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Start Time input - only if Yes */}
                      {modalPermissionValue && (
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-semibold text-gray-600">Start Time</span>
                          <input
                            type="datetime-local"
                            value={modalStartTime}
                            onChange={(e) => setModalStartTime(e.target.value)}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-[11px] text-gray-600 focus:outline-none w-48 font-sans cursor-pointer"
                          />
                        </div>
                      )}

                      {/* End Time input */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-600">End Time</span>
                        <input
                          type="datetime-local"
                          value={modalEndTime}
                          onChange={(e) => setModalEndTime(e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-[11px] text-gray-600 focus:outline-none w-48 font-sans cursor-pointer"
                        />
                      </div>

                      {/* Subject Checkboxes Tree */}
                      <div className="mt-4 border-t border-gray-200 pt-4 space-y-2.5">
                        {/* All Subject */}
                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={modalAllSubjectsChecked}
                            onChange={handleToggleAllModalSubjects}
                            className="rounded border-gray-300 text-[#5cb85c] focus:ring-[#5cb85c] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="flex items-center space-x-1.5 text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <span>All Subject</span>
                          </span>
                        </label>

                        {/* Indented Checklist */}
                        <div className="pl-6 space-y-2 border-l border-gray-200 ml-1.5">
                          {modalSubjects.map((subj) => (
                            <label key={subj.id} className="flex items-center space-x-2.5 cursor-pointer text-xs font-medium text-gray-600">
                              <input
                                type="checkbox"
                                checked={subj.checked}
                                onChange={() => handleToggleModalSubject(subj.id)}
                                className="rounded border-gray-300 text-[#5cb85c] focus:ring-[#5cb85c] h-3.5 w-3.5 cursor-pointer"
                              />
                              <span>{subj.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer / Buttons */}
                    <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-2 border-t border-gray-200">
                      <button 
                        onClick={handleSaveModalPermission}
                        className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold text-xs px-4 py-1.5 rounded transition-all shadow-xs cursor-pointer"
                      >
                        Update
                      </button>
                      <button 
                        onClick={() => {
                          setUpdatePermissionExam(null);
                          setUpdatePermissionField(null);
                        }}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-1.5 rounded transition-all shadow-xs cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      );
    }

    if (activeSidebarItem === 'admin-review' || activeSubItem === 'admin-review' || (activeTab === 'Exam' && (activeSubItem === 'ai-review' || activeSubItem === 'admin-review'))) {
      const filteredRecords = reviewRecords.filter(rec => {
        if (reviewFilters.rollNumber && !rec.rollNumber.includes(reviewFilters.rollNumber)) return false;
        if (reviewFilters.exam && !rec.examName.toLowerCase().includes(reviewFilters.exam.toLowerCase())) return false;
        if (reviewFilters.examiner && !rec.examinerName.toLowerCase().includes(reviewFilters.examiner.toLowerCase())) return false;
        if (reviewFilters.reviewStatus !== 'All' && rec.reviewStatus !== reviewFilters.reviewStatus) return false;
        if (reviewFilters.evaluationType !== 'All' && rec.evaluationType !== reviewFilters.evaluationType) return false;
        if (reviewFilters.course !== 'All Course' && !rec.courseName.toLowerCase().includes(reviewFilters.course.toLowerCase())) return false;
        return true;
      });

      // Filter rows dynamically based on the form values
      const filteredSearchRows = adminReviewRows.filter(row => {
        if (reviewFilters.program !== 'All Program' && row.program !== reviewFilters.program) return false;
        if (reviewFilters.session !== 'All Session' && row.session !== reviewFilters.session) return false;
        if (reviewFilters.version !== 'All Version' && row.version !== reviewFilters.version) return false;
        if (reviewFilters.uniqueSet !== 'All Unique Set') {
          const setStr = `Unique Set: ${reviewFilters.uniqueSet}`;
          if (!row.question.includes(setStr)) return false;
        }
        if (reviewFilters.questionSerial !== 'All Question Serial') {
          const qStr = `Question Serial: ${reviewFilters.questionSerial}`;
          if (!row.question.includes(qStr)) return false;
        }
        if (reviewFilters.evaluationType !== 'All' && row.evaluationType !== reviewFilters.evaluationType) return false;
        if (reviewFilters.reviewStatus !== 'All' && row.reviewStatus !== reviewFilters.reviewStatus) return false;
        return true;
      });
      if (reviewFilters.orderBy === 'Question Serial') {
        filteredSearchRows.sort((a, b) => {
          const matchQA = a.question.match(/Question Serial:\s*(\d+)/i);
          const matchQB = b.question.match(/Question Serial:\s*(\d+)/i);
          const qA = matchQA ? parseInt(matchQA[1], 10) : 0;
          const qB = matchQB ? parseInt(matchQB[1], 10) : 0;
          
          if (qA !== qB) {
            return qA - qB;
          }
          
          const matchSA = a.question.match(/Unique Set:\s*(\d+)/i);
          const matchSB = b.question.match(/Unique Set:\s*(\d+)/i);
          const sA = matchSA ? parseInt(matchSA[1], 10) : 0;
          const sB = matchSB ? parseInt(matchSB[1], 10) : 0;
          return sA - sB;
        });
      }

      const handleSearch = () => {
        if (reviewFilters.orderBy === 'Individual' && !reviewFilters.rollNumber.trim()) {
          setRollError(true);
          setReviewSearchTriggered(false);
        } else {
          setRollError(false);
          setReviewSearchTriggered(true);
        }
      };

      const handleExport = () => {
        alert(`Successfully exported ${filteredSearchRows.length} search records.`);
      };

      return (
        <div className="flex-1 flex flex-col items-center justify-start py-6 bg-gray-50/10 overflow-y-auto px-6 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#002d5b] text-white px-4 py-2.5 flex items-center justify-between">
              <h2 className="text-sm font-medium tracking-wide font-sans">Admin Review</h2>
              <button className="text-white hover:opacity-80">
                <Minus className="w-4 h-4 cursor-pointer" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-10 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Organization</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.organization}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, organization: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Organization">All Organization</option>
                        <option value="UDVASH">UDVASH</option>
                        <option value="UNMESH">UNMESH</option>
                        <option value="ONLINE CARE">ONLINE CARE</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Session</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.session}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, session: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Session">All Session</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2015">2015</option>
                        <option value="2014">2014</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Exam</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="[Code] Exam Name" 
                        value={reviewFilters.exam}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, exam: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Version</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.version}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, version: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Version">All Version</option>
                        <option value="Bangla">Bangla</option>
                        <option value="English">English</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Start Date</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={reviewFilters.startDate}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[#f5f5f5] font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Examiner</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="[TPIN] Name (Batch)" 
                        value={reviewFilters.examiner}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, examiner: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Question Serial</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.questionSerial}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, questionSerial: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Question Serial">All Question Serial</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="7">7</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Min Marks</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={reviewFilters.minMarks}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, minMarks: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Roll Number</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Registration No./ Roll No." 
                        value={reviewFilters.rollNumber}
                        onChange={(e) => {
                          setReviewFilters(prev => ({ ...prev, rollNumber: e.target.value }));
                          if (e.target.value.trim()) setRollError(false);
                        }}
                        className={`w-full border ${rollError ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans`} 
                      />
                      {rollError && (
                        <div className="text-red-600 text-[11px] font-bold mt-1 ml-1 flex items-center space-x-1">
                          <span className="animate-pulse">●</span>
                          <span>Roll অথবা Registration No ইনপুট দিন</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Display Per Page</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={reviewFilters.displayPerPage}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, displayPerPage: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Program</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.program}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, program: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Program">All Program</option>
                        <option value="Engineering Admission Program">Engineering Admission Program</option>
                        <option value="Varsity 'KA' Admission Program">Varsity 'KA' Admission Program</option>
                        <option value="Varsity 'KHA' Admission Program">Varsity 'KHA' Admission Program</option>
                        <option value="College Admission Program">College Admission Program</option>
                        <option value="SSC Model Test">SSC Model Test</option>
                        <option value="HSC Model Test">HSC Model Test</option>
                        <option value="Class 9 Academic Program">Class 9 Academic Program</option>
                        <option value="Class 9 Bangla-English Program">Class 9 Bangla-English Program</option>
                        <option value="Class 10 Academic Program">Class 10 Academic Program</option>
                        <option value="Class 10 Bangla-English Program">Class 10 Bangla-English Program</option>
                        <option value="HSC Bangla-English Full Program">HSC Bangla-English Full Program</option>
                        <option value="Class 11 Academic Program">Class 11 Academic Program</option>
                        <option value="Class 12 Academic Program">Class 12 Academic Program</option>
                        <option value="HSC Bangla-English Special Program">HSC Bangla-English Special Program</option>
                        <option value="Class 8 Bangla-English Full Course (Online)">Class 8 Bangla-English Full Course (Online)</option>
                        <option value="HSC Science Foundation Program">HSC Science Foundation Program</option>
                        <option value="HSC 1st Year Basic Course (Top 100 Topics)">HSC 1st Year Basic Course (Top 100 Topics)</option>
                        <option value="HSC ICT Program">HSC ICT Program</option>
                        <option value="Class 9-10 Bangla-English Full Course">Class 9-10 Bangla-English Full Course</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Course</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.course}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, course: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Course">All Course</option>
                        <option value="HSC'26 Model Test Online Service">HSC'26 Model Test Online Service</option>
                        <option value="Employee Training Course [ETP - 2021]">Employee Training Course [ETP - 2021]</option>
                        <option value="Class 11 Progressive Service 2026">Class 11 Progressive Service 2026</option>
                        <option value="HSC Bangla-English Full Course Online">HSC Bangla-English Full Course Online</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Exam Type</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.examType}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, examType: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Exam Type">All Exam Type</option>
                        <option value="Weekly Test">Weekly Test</option>
                        <option value="Monthly Test">Monthly Test</option>
                        <option value="Model Test">Model Test</option>
                        <option value="Live Exam">Live Exam</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Answer Type</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.answerType}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, answerType: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Answer Type">All Answer Type</option>
                        <option value="Answered">Answered</option>
                        <option value="Blank">Blank</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">End Date</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={reviewFilters.endDate}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[#f5f5f5] font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Unique Set</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.uniqueSet}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, uniqueSet: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Unique Set">All Unique Set</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Evaluation Type</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.evaluationType}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, evaluationType: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All">All</option>
                        <option value="Regular">Regular</option>
                        <option value="Top Student">Top Student</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Max Marks</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={reviewFilters.maxMarks}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, maxMarks: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-red-600 text-right mr-4 leading-tight font-sans">Review Status</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.reviewStatus}
                        onChange={(e) => setReviewFilters(prev => ({ ...prev, reviewStatus: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All">All</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Not Reviewed">Not Reviewed</option>
                        <option value="Rechecked from Student">Rechecked from Student</option>
                        <option value="Rechecked from Admin">Rechecked from Admin</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-red-600 text-right mr-4 leading-tight font-sans">Order by</label>
                    <div className="flex-1 relative">
                      <select 
                        value={reviewFilters.orderBy}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReviewFilters(prev => ({ ...prev, orderBy: val }));
                          if (val === 'Individual' && !reviewFilters.rollNumber.trim()) {
                            setRollError(true);
                          } else {
                            setRollError(false);
                          }
                        }}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All">All</option>
                        <option value="Individual">Individual</option>
                        <option value="Question Serial">Question Serial</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-3 pt-6 pb-2">
                <button 
                  onClick={handleSearch}
                  className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-8 py-1.5 rounded text-sm font-medium transition-colors shadow-sm font-sans flex items-center justify-center min-w-[100px]"
                >
                  Search
                </button>
                <button 
                  onClick={handleExport}
                  className="bg-[#5bc0de] hover:bg-[#46b8da] text-white px-8 py-1.5 rounded text-sm font-medium transition-colors shadow-sm font-sans flex items-center justify-center min-w-[100px]"
                >
                  Export
                </button>
              </div>
            </div>
          </motion.div>

          {/* Program Wise Search Results Table */}
          {reviewSearchTriggered && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-6xl bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden text-left"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px] text-gray-700 font-sans">
                  <thead>
                    <tr className="bg-[#f9f9f9] border-b border-gray-200 text-[#333] font-bold">
                      <th className="py-2.5 px-2 border-r border-gray-200 text-center font-bold font-sans w-12">SI</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 text-left font-bold font-sans">Program Session</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 text-left font-bold font-sans">Course</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 text-left font-bold font-sans">[Code] Exam & Subject</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 text-center font-bold font-sans">Exam Type</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 text-center font-bold font-sans">Evaluation Type</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 text-center font-bold font-sans">Version</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 text-center font-bold font-sans">Question</th>
                      <th className="py-2.5 px-2 border-r border-gray-200 text-center font-bold font-sans">Minimum Marks</th>
                      <th className="py-2.5 px-2 border-r border-gray-200 text-center font-bold font-sans">Maximum Marks</th>
                      <th className="py-2.5 px-2 border-r border-gray-200 text-center font-bold font-sans">Total Script</th>
                      <th className="py-2.5 px-3 text-center font-bold font-sans">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSearchRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-8 text-center text-gray-400 font-medium bg-gray-50/50">
                          No matching program records found.
                        </td>
                      </tr>
                    ) : (
                      filteredSearchRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-2 border-r border-gray-200 text-center font-medium text-gray-500">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3 px-3 border-r border-gray-200 font-medium">
                            <div>{row.program}</div>
                            <div className="text-gray-400 text-[11px] mt-0.5">{row.session}</div>
                          </td>
                          <td className="py-3 px-3 border-r border-gray-200 text-gray-600">
                            {row.course}
                          </td>
                          <td className="py-3 px-3 border-r border-gray-200 text-gray-800 font-medium">
                            {row.examSubject}
                          </td>
                          <td className="py-3 px-3 border-r border-gray-200 text-center text-gray-600">
                            {row.examType}
                          </td>
                          <td className="py-3 px-3 border-r border-gray-200 text-center text-gray-600">
                            {row.evaluationType}
                          </td>
                          <td className="py-3 px-3 border-r border-gray-200 text-center text-gray-600">
                            {row.version}
                          </td>
                          <td className="py-3 px-3 border-r border-gray-200 text-center font-sans">
                            {row.question.includes('Unique Set:') ? (
                              <>
                                <div className="font-medium text-gray-700">
                                  {row.question.split(', ')[0]}
                                </div>
                                <div className="text-gray-400 text-[11px] mt-0.5">
                                  {row.question.split(', ')[1]}
                                </div>
                              </>
                            ) : (
                              row.question
                            )}
                          </td>
                          <td className="py-3 px-2 border-r border-gray-200 text-center text-gray-600 font-mono">
                            {row.minMarks}
                          </td>
                          <td className="py-3 px-2 border-r border-gray-200 text-center text-gray-600 font-mono">
                            {row.maxMarks}
                          </td>
                          <td className="py-3 px-2 border-r border-gray-200 text-center font-bold text-gray-700 bg-gray-50/20 font-mono">
                            {row.totalScript}
                          </td>
                          <td className="py-3 px-3 text-center">
                              <button 
                                onClick={() => {
                                  const subjectLower = ((row as any).subject || row.examSubject || "").toLowerCase();
                                  const questionText = (row.question || "").toLowerCase();
                                  let startIdx = 0;
                                  if (subjectLower.includes('physics') || questionText.includes('900m')) {
                                    startIdx = 1;
                                  } else if (subjectLower.includes('english') || questionText.includes('principal') || row.version === 'English') {
                                    startIdx = 2;
                                  } else if (subjectLower.includes('math') || questionText.includes('√3') || questionText.includes('x অক্ষের')) {
                                    startIdx = 3;
                                  }
                                  setActiveScriptIdx(startIdx);
                                  setReviewObtainedMarks(reviewScripts[startIdx]?.obtainedMarks || "0.00");
                                  
                                  setSelectedReviewRow({ ...row, suppressNotes: true });
                                  setShowReviewWorkspace(true);
                                }}
                                className="bg-[#4395d1] hover:bg-[#3484c0] text-white text-[11px] font-bold px-3 py-1 rounded transition-colors shadow-xs font-sans whitespace-nowrap"
                              >
                                Review All
                              </button>
                            </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Info & Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200 text-[11px] text-[#333] font-sans">
                <div className="mb-2 sm:mb-0 text-gray-500">
                  Showing 1 to {filteredSearchRows.length} of {filteredSearchRows.length === 9 ? '154' : filteredSearchRows.length} entries
                </div>
                <div className="flex items-center space-x-0.5">
                  <button className="px-2.5 py-1 border border-gray-300 rounded-l text-gray-400 bg-white cursor-not-allowed">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-[#337ab7] bg-[#337ab7] text-white font-bold">
                    1
                  </button>
                  {filteredSearchRows.length === 9 && (
                    <button className="px-3 py-1 border border-gray-300 bg-white text-[#337ab7] hover:bg-gray-50">
                      2
                    </button>
                  )}
                  <button className={`px-2.5 py-1 border border-gray-300 rounded-r bg-white text-[#337ab7] hover:bg-gray-50 ${filteredSearchRows.length !== 9 ? 'cursor-not-allowed text-gray-400' : ''}`}>
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      );
    }

    if (activeTab === 'Exam' && activeSubItem === 'admin-review-req') {
      const filteredForwardedRequests = adminForwardedRequests.filter(req => {
        if (adminReviewReqFilters.organization !== 'All Organization' && req.organization !== adminReviewReqFilters.organization) return false;
        if (adminReviewReqFilters.program !== 'All Program' && req.program !== adminReviewReqFilters.program) return false;
        if (adminReviewReqFilters.session !== 'All Session' && req.session !== adminReviewReqFilters.session) return false;
        if (adminReviewReqFilters.course !== 'All Course' && req.course !== adminReviewReqFilters.course && !req.course.toLowerCase().includes(adminReviewReqFilters.course.toLowerCase())) return false;
        if (adminReviewReqFilters.exam && !req.exam.toLowerCase().includes(adminReviewReqFilters.exam.toLowerCase())) return false;
        
        if (adminReviewReqFilters.examType !== 'All Exam Type') {
          const typeMap: Record<string, string> = {
            'Weekly Test': 'weekly',
            'Monthly Test': 'monthly',
            'Model Test': 'model',
            'Live Exam': 'live',
            'Daily Exam': 'daily'
          };
          const filterVal = typeMap[adminReviewReqFilters.examType] || adminReviewReqFilters.examType.toLowerCase();
          if (!req.examType.toLowerCase().includes(filterVal)) return false;
        }

        if (adminReviewReqFilters.version !== 'All Version' && req.version !== adminReviewReqFilters.version) return false;
        if (adminReviewReqFilters.questionSerial !== 'All Question Serial' && req.questionSerial !== adminReviewReqFilters.questionSerial) return false;
        
        if (adminReviewReqFilters.examiner) {
          const searchStr = `${req.examiner.id} ${req.examiner.name}`.toLowerCase();
          if (!searchStr.includes(adminReviewReqFilters.examiner.toLowerCase())) return false;
        }

        if (adminReviewReqFilters.uniqueSet !== 'All Unique Set' && req.uniqueSet !== adminReviewReqFilters.uniqueSet) return false;
        if (adminReviewReqFilters.evaluationType !== 'All' && req.evaluationType !== adminReviewReqFilters.evaluationType) return false;
        if (adminReviewReqFilters.reviewRequest !== 'All') {
          if (adminReviewReqFilters.reviewRequest === 'Single' && req.isMultiple) return false;
          if (adminReviewReqFilters.reviewRequest === 'Multiple' && !req.isMultiple) return false;
        }
        if (adminReviewReqFilters.reviewRequestFrom !== 'All') {
          let isFromAdmin = false;
          if (req.reviewRequest === 'Rechecked from Admin' || req.id === 'FWD-002' || req.id === 'FWD-004') {
            isFromAdmin = true;
          } else if (req.reviewRequest === 'Rechecked from Student' || req.id === 'FWD-001' || req.id === 'FWD-003') {
            isFromAdmin = false;
          } else {
            const noteLower = (req.note || '').toLowerCase();
            if (noteLower.includes('শিক্ষার্থী') || noteLower.includes('student')) {
              isFromAdmin = false;
            } else {
              isFromAdmin = true;
            }
          }

          if (adminReviewReqFilters.reviewRequestFrom === 'Admin' && !isFromAdmin) return false;
          if (adminReviewReqFilters.reviewRequestFrom === 'Student' && isFromAdmin) return false;
        }
        if (adminReviewReqFilters.rollNumber && !req.rollNumber.includes(adminReviewReqFilters.rollNumber)) return false;
        
        if (adminReviewReqFilters.minMarks && parseFloat(req.minMarks) < parseFloat(adminReviewReqFilters.minMarks)) return false;
        if (adminReviewReqFilters.maxMarks && parseFloat(req.maxMarks) > parseFloat(adminReviewReqFilters.maxMarks)) return false;

        return true;
      });

      const studentForwardedRequests = filteredForwardedRequests.filter(req => isStudentRequest(req));
      const adminForwardedRequestsFiltered = filteredForwardedRequests.filter(req => !isStudentRequest(req));

      const handleResetFilters = () => {
        setAdminReviewReqFilters({
          organization: 'All Organization',
          program: 'All Program',
          session: 'All Session',
          course: 'All Course',
          exam: '',
          examType: 'All Exam Type',
          version: 'All Version',
          questionSerial: 'All Question Serial',
          startDate: '2026-07-02',
          endDate: '2026-07-04',
          examiner: '',
          uniqueSet: 'All Unique Set',
          minMarks: '',
          maxMarks: '',
          rollNumber: '',
          evaluationType: 'All',
          reviewRequest: 'All',
          reviewRequestFrom: 'All',
          displayPerPage: '100'
        });
        setAdminReviewReqSearchTriggered(true);
      };

      const handleSearch = () => {
        setAdminReviewReqSearchTriggered(true);
      };

      return (
        <div className="flex-1 flex flex-col items-center justify-start py-8 bg-gray-50/30 overflow-y-auto px-4 space-y-6">
          {/* Filter Card */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden text-left"
          >
            {/* Header */}
            <div className="bg-[#002d5b] text-white px-4 py-2.5 flex items-center justify-between">
              <h2 className="text-sm font-medium tracking-wide font-sans">Review Request</h2>
              <button className="text-white hover:opacity-80">
                <Minus className="w-4 h-4 cursor-pointer" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-10 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Organization</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.organization}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, organization: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Organization">All Organization</option>
                        <option value="UDVASH">UDVASH</option>
                        <option value="UNMESH">UNMESH</option>
                        <option value="ONLINE CARE">ONLINE CARE</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Session</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.session}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, session: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Session">All Session</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Exam</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="[Code] Exam Name" 
                        value={adminReviewReqFilters.exam}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, exam: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Version</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.version}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, version: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Version">All Version</option>
                        <option value="Bangla">Bangla</option>
                        <option value="English">English</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Start Date</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={adminReviewReqFilters.startDate}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[#f5f5f5] font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Examiner</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="[TPIN] Name (Batch)" 
                        value={adminReviewReqFilters.examiner}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, examiner: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Min Marks</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={adminReviewReqFilters.minMarks}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, minMarks: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Roll Number</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Registration No./ Roll No." 
                        value={adminReviewReqFilters.rollNumber}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, rollNumber: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-red-600 text-right mr-4 leading-tight font-sans">Review Request Type</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.reviewRequest}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, reviewRequest: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All">All</option>
                        <option value="Single">Single</option>
                        <option value="Multiple">Multiple</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-red-600 text-right mr-4 leading-tight font-sans">Review Request From</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.reviewRequestFrom}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, reviewRequestFrom: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All">All</option>
                        <option value="Student">Student</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Program</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.program}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, program: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Program">All Program</option>
                        <option value="Engineering Admission Program">Engineering Admission Program</option>
                        <option value="Varsity 'KA' Admission Program">Varsity 'KA' Admission Program</option>
                        <option value="Varsity 'KHA' Admission Program">Varsity 'KHA' Admission Program</option>
                        <option value="College Admission Program">College Admission Program</option>
                        <option value="SSC Model Test">SSC Model Test</option>
                        <option value="HSC Model Test">HSC Model Test</option>
                        <option value="Class 9 Academic Program">Class 9 Academic Program</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 font-sans">Course</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.course}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, course: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Course">All Course</option>
                        <option value="Engineering Admission Program [EAP - 2026]">Engineering Admission Program [EAP - 2026]</option>
                        <option value="NDC & SJC All Service [CAP - 2026]">NDC & SJC All Service [CAP - 2026]</option>
                        <option value="HSC'26 Model Test Online Service">HSC'26 Model Test Online Service</option>
                        <option value="Class 11 Progressive Service 2026">Class 11 Progressive Service 2026</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Exam Type</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.examType}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, examType: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Exam Type">All Exam Type</option>
                        <option value="Weekly Test">Weekly Test</option>
                        <option value="Monthly Test">Monthly Test</option>
                        <option value="Model Test">Model Test</option>
                        <option value="Live Exam">Live Exam</option>
                        <option value="Daily Exam">Daily Exam</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Unique Set</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.uniqueSet}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, uniqueSet: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Unique Set">All Unique Set</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Question Serial</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.questionSerial}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, questionSerial: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All Question Serial">All Question Serial</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">End Date</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={adminReviewReqFilters.endDate}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[#f5f5f5] font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Max Marks</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={adminReviewReqFilters.maxMarks}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, maxMarks: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Evaluation Type</label>
                    <div className="flex-1 relative">
                      <select 
                        value={adminReviewReqFilters.evaluationType}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, evaluationType: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none bg-white font-sans"
                      >
                        <option value="All">All</option>
                        <option value="Regular">Regular</option>
                        <option value="Top Student">Top Student</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-40 text-[13px] font-bold text-[#333] text-right mr-4 leading-tight font-sans">Display Per Page</label>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={adminReviewReqFilters.displayPerPage}
                        onChange={(e) => setAdminReviewReqFilters(prev => ({ ...prev, displayPerPage: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white font-sans" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-3 pt-6 pb-2">
                <button 
                  onClick={handleSearch}
                  className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-8 py-1.5 rounded text-sm font-medium transition-colors shadow-sm font-sans flex items-center justify-center min-w-[100px]"
                >
                  Search
                </button>
                <button 
                  onClick={handleResetFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-1.5 rounded text-sm font-medium transition-colors shadow-sm font-sans flex items-center justify-center min-w-[100px]"
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>

          {/* Results Table Section */}
          {adminReviewReqSearchTriggered && (
            <div className="w-full max-w-6xl space-y-6">
              {/* Student Review Requests Part */}
              {(adminReviewReqFilters.reviewRequestFrom === 'All' || adminReviewReqFilters.reviewRequestFrom === 'Student') && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden text-left"
                >
                  <div className="bg-blue-50/50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-800 flex items-center">
                      <span className="w-1.5 h-4 bg-[#4395d1] rounded-sm mr-2.5 inline-block"></span>
                      Student Review Request
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-[10.5px] font-extrabold font-mono px-2 py-0.5 rounded">
                      Total: {studentForwardedRequests.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[11.5px] font-sans text-gray-700">
                      <thead>
                        <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200">
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-12">SI</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[14%]">Teacher</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[18%]">Course [Program-Session]</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[8%]">Subject</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[12%]">Exam</th>
                          <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[6%]">Review Scripts</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[6%]">Status</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[10%]">Examiner Status</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[6%]">Pending From</th>
                          <th className="px-3 py-2.5 text-center w-[10%]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {studentForwardedRequests.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-3 py-8 text-center text-gray-400 font-medium italic">
                              No student review requests found matching the current filters.
                            </td>
                          </tr>
                        ) : (
                          studentForwardedRequests.map((req, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="border-r border-gray-200 px-3 py-3 text-center text-gray-500 font-medium font-mono">
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-700">
                                <div className="font-bold text-blue-700 text-[11px] leading-tight">[{req.examiner.id}] - {req.examiner.name}</div>
                                {req.examiner.phone && <div className="text-[10px] text-gray-500 mt-0.5">{req.examiner.phone}</div>}
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-800 font-medium">
                                <div>{req.course}</div>
                                <div className="text-[10px] text-gray-400 font-normal mt-0.5">{req.program} &bull; Session: {req.session}</div>
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-700 font-semibold">{req.subject}</td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-700">
                                <div>{req.exam}</div>
                                <div className="text-[9.5px] text-gray-400 font-mono mt-0.5">{req.examType}</div>
                              </td>
                              <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                                <span className="inline-flex items-center justify-center bg-red-100 text-red-800 px-2.5 py-0.5 rounded font-extrabold font-mono text-[10.5px] border border-red-200/60 shadow-3xs">
                                  {req.isMultiple ? `${req.checkedScriptsCount}/${req.totalScriptsCount}` : (req.reviewCount || 1)}
                                </span>
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap ${
                                  getDisplayStatus(req) === 'Pending Teacher Response' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                    : getDisplayStatus(req) === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {getDisplayStatus(req)}
                                </span>
                              </td>
                              <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                                {examinerReviewPermissions[req.examiner.id] !== false ? (
                                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                                    Permitted
                                  </span>
                                ) : (
                                  <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                                    Not Permitted
                                  </span>
                                )}
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-center">
                                {getDisplayStatus(req) === 'Reviewed' || getDisplayStatus(req) === 'Completed' ? (
                                  <span className="text-gray-400 font-medium font-sans">--</span>
                                ) : (
                                  <span className="inline-block bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded font-extrabold font-mono text-[10px] shadow-3xs whitespace-nowrap">
                                    {getPendingDuration(req.date)}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => {
                                      const constructed = {
                                        id: req.id,
                                        rollNumber: req.rollNumber || '37180701100',
                                        studentName: 'Tahmid Rahman',
                                        examSubject: `${req.exam} - ${req.subject}`,
                                        program: req.program || 'Engineering Admission',
                                        course: req.course,
                                        question: 'Unique Set: 1, Question Serial: 18',
                                        questionSerial: req.questionSerial || '18',
                                        uniqueSet: req.uniqueSet || '1',
                                        obtainedMarks: '0.00',
                                        maxMarks: req.maxMarks || '1.00',
                                        examinerName: `${req.examiner.name} (${req.examiner.id})`,
                                        evaluationType: req.evaluationType || 'Regular',
                                        examName: req.exam,
                                        examCode: req.examCode || '130 ',
                                        subject: req.subject.replace(/\[.*\]/, '').trim(),
                                        adminCommentText: req.note || "খাতাটি পুনঃ মূল্যায়ন করো।",
                                        adminDoubt: req.note || "খাতাটি পুনঃ মূল্যায়ন করো।",
                                        studentDoubt: req.studentDoubt || "corner e dekhen cross and the likhsi",
                                        isFromStudent: true,
                                        totalScript: '124',
                                        minMarks: req.minMarks || '0.5',
                                        reviewStatus: req.reviewRequest || req.status || 'Not Reviewed',
                                        reviewCount: req.reviewCount || 2,
                                        suppressNotes: false,
                                        examType: req.examType || 'Online Written',
                                        version: req.version || 'Bangla'
                                      };
                                      setShowingAdminDetailRow(constructed);
                                      setShowReviewWorkspace(false);
                                    }}
                                    className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-2.5 py-1 rounded text-[10.5px] font-bold transition-all shadow-xs"
                                  >
                                    Details
                                  </button>
                                  <button 
                                    onClick={() => setCancelConfirmId(req.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10.5px] font-bold transition-all shadow-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Admin Review Requests Part */}
              {(adminReviewReqFilters.reviewRequestFrom === 'All' || adminReviewReqFilters.reviewRequestFrom === 'Admin') && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden text-left mt-6"
                >
                  <div className="bg-purple-50/50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-purple-800 flex items-center">
                      <span className="w-1.5 h-4 bg-purple-600 rounded-sm mr-2.5 inline-block"></span>
                      Admin Review Request
                    </h3>
                    <span className="bg-purple-100 text-purple-800 text-[10.5px] font-extrabold font-mono px-2 py-0.5 rounded">
                      Total: {adminForwardedRequestsFiltered.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[11.5px] font-sans text-gray-700">
                      <thead>
                        <tr className="bg-[#f8f9fa] text-gray-700 font-bold border-b border-gray-200">
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-12">SI</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[13%]">Teacher</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[16%]">Course [Program-Session]</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[8%]">Subject</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-left w-[12%]">Exam</th>
                          <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[5%]">Admin ID</th>
                          <th className="border-r border-gray-200 px-2.5 py-2.5 text-center w-[5%]">Review Scripts</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[6%]">Status</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[10%]">Examiner Status</th>
                          <th className="border-r border-gray-200 px-3 py-2.5 text-center w-[6%]">Pending From</th>
                          <th className="px-3 py-2.5 text-center w-[10%]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {adminForwardedRequestsFiltered.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="px-3 py-8 text-center text-gray-400 font-medium italic">
                              No admin review requests found matching the current filters.
                            </td>
                          </tr>
                        ) : (
                          adminForwardedRequestsFiltered.map((req, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="border-r border-gray-200 px-3 py-3 text-center text-gray-500 font-medium font-mono">
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-700">
                                <div className="font-bold text-blue-700 text-[11px] leading-tight">[${req.examiner.id}] - ${req.examiner.name}</div>
                                {req.examiner.phone && <div className="text-[10px] text-gray-500 mt-0.5">${req.examiner.phone}</div>}
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-800 font-medium">
                                <div>${req.course}</div>
                                <div className="text-[10px] text-gray-400 font-normal mt-0.5">${req.program} &bull; Session: ${req.session}</div>
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-700 font-semibold">${req.subject}</td>
                              <td className="border-r border-gray-200 px-3 py-3 text-gray-700">
                                <div>${req.exam}</div>
                                <div className="text-[9.5px] text-gray-400 font-mono mt-0.5">${req.examType}</div>
                              </td>
                              <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                                <span className="inline-block bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded font-bold font-mono text-[10px]">
                                  {req.adminId || 'A-102'}
                                </span>
                              </td>
                              <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                                <span className="inline-flex items-center justify-center bg-red-100 text-red-800 px-2.5 py-0.5 rounded font-extrabold font-mono text-[10.5px] border border-red-200/60 shadow-3xs">
                                  {req.isMultiple ? `${req.checkedScriptsCount}/${req.totalScriptsCount}` : (req.reviewCount || 1)}
                                </span>
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold whitespace-nowrap ${
                                  getDisplayStatus(req) === 'Pending Teacher Response' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                    : getDisplayStatus(req) === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {getDisplayStatus(req)}
                                </span>
                              </td>
                              <td className="border-r border-gray-200 px-2.5 py-3 text-center">
                                {examinerReviewPermissions[req.examiner.id] !== false ? (
                                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                                    Permitted
                                  </span>
                                ) : (
                                  <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                                    Not Permitted
                                  </span>
                                )}
                              </td>
                              <td className="border-r border-gray-200 px-3 py-3 text-center">
                                {getDisplayStatus(req) === 'Reviewed' || getDisplayStatus(req) === 'Completed' ? (
                                  <span className="text-gray-400 font-medium font-sans">--</span>
                                ) : (
                                  <span className="inline-block bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded font-extrabold font-mono text-[10px] shadow-3xs whitespace-nowrap">
                                    {getPendingDuration(req.date)}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => {
                                      const constructed = {
                                        id: req.id,
                                        rollNumber: req.rollNumber || '37180701100',
                                        studentName: 'Tahmid Rahman',
                                        examSubject: `${req.exam} - ${req.subject}`,
                                        program: req.program || 'Engineering Admission',
                                        course: req.course,
                                        question: `Unique Set: 1, Question Serial: 18`,
                                        questionSerial: req.questionSerial || '18',
                                        uniqueSet: req.uniqueSet || '1',
                                        obtainedMarks: '0.00',
                                        maxMarks: req.maxMarks || '1.00',
                                        examinerName: `${req.examiner.name} (${req.examiner.id})`,
                                        evaluationType: req.evaluationType || 'Regular',
                                        examName: req.exam,
                                        examCode: req.examCode || '130 ',
                                        subject: req.subject.replace(/\[.*\]/, '').trim(),
                                        adminCommentText: req.note || "খাতাটি পুনঃ মূল্যায়ন করো।",
                                        adminDoubt: req.note || "খাতাটি পুনঃ মূল্যায়ন করো।",
                                        isFromStudent: false,
                                        totalScript: '124',
                                        minMarks: req.minMarks || '0.5',
                                        reviewStatus: req.reviewRequest || req.status || 'Not Reviewed',
                                        reviewCount: req.reviewCount || 2,
                                        suppressNotes: false,
                                        examType: req.examType || 'Online Written',
                                        version: req.version || 'Bangla'
                                      };
                                      setShowingAdminDetailRow(constructed);
                                      setShowReviewWorkspace(false);
                                    }}
                                    className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-2.5 py-1 rounded text-[10.5px] font-bold transition-all shadow-xs"
                                  >
                                    Details
                                  </button>
                                  <button 
                                    onClick={() => setCancelConfirmId(req.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10.5px] font-bold transition-all shadow-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                        {adminForwardedRequestsFiltered.length > 0 && (
                          <tr className="bg-[#f1f3f5] font-bold">
                            <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-800" colSpan={4}>Total Admin Requests Found</td>
                            <td className="border-r border-gray-200 px-2.5 py-2 text-center text-gray-900 font-extrabold font-mono" colSpan={7}>
                              {adminForwardedRequestsFiltered.length}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'Administration' && activeSidebarItem === 'teacher-management') {
      return (
        <div className="flex-1 flex flex-col w-full overflow-y-auto">
          <TeacherPortal 
            adminForwardedRequests={adminForwardedRequests}
            setAdminForwardedRequests={setAdminForwardedRequests}
            studentReviewRequests={studentReviewRequests}
            setStudentReviewRequests={setStudentReviewRequests}
          />
        </div>
      );
    }

    if (activeTab === 'Administration' && activeSidebarItem === 'user-management') {
      return (
        <div className="flex-1 flex flex-col w-full overflow-y-auto">
          <UserManagementPanel 
            usersList={usersList}
            setUsersList={setUsersList}
            currentUser={currentUser}
          />
        </div>
      );
    }

    if ((activeTab === 'Administration' || activeTab === 'Team') && (activeSidebarItem === 'hr' || activeSidebarItem === 'team-hr')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[500px] w-full px-4 text-center">
          <div className="bg-[#f2f2f2] w-full max-w-6xl py-24 flex items-center justify-center rounded-sm">
            <h1 className="text-5xl md:text-7xl font-normal text-[#333] tracking-tight">
              Member Management Area
            </h1>
          </div>
        </div>
      );
    }

    const currentItem = currentSidebarItems.find(i => i.id === activeSidebarItem);
    const label = activeSubItem 
      ? currentItem?.subItems?.find(s => s.id === activeSubItem)?.label 
      : currentItem?.label;

    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] w-full px-4 text-center">
        <div className="bg-[#f2f2f2] w-full max-w-6xl py-24 flex items-center justify-center rounded-sm">
          <h1 className="text-4xl md:text-5xl font-normal text-[#333] tracking-tight px-6 uppercase">
            {label || activeTab} Area
          </h1>
        </div>
      </div>
    );
  };

           const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setIsProfileOpen(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Email and Password are required.');
      return;
    }

    const matchedUser = usersList.find(u => 
      u.id.toLowerCase() === loginEmail.trim().toLowerCase() && 
      (u.password === loginPassword || (u.id.toLowerCase() === 'nazmul.2853@udvash.net' && (loginPassword === '123456' || loginPassword === 'Bd151332303@')))
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem('currentUser', JSON.stringify(matchedUser));
      
      // Auto-set first available tab for this user
      if (matchedUser.permissions && matchedUser.permissions.length > 0) {
        setActiveTab(matchedUser.permissions[0] as TopNavTab);
        const items = sidebarItemsMap[matchedUser.permissions[0] as TopNavTab] || [];
        if (items.length > 0) {
          setActiveSidebarItem(items[0].id);
          if (items[0].subItems && items[0].subItems.length > 0) {
            setActiveSubItem(items[0].subItems[0].id);
          } else {
            setActiveSubItem(null);
          }
        }
      }
    } else {
      setLoginError('Invalid Email or Password.');
    }
  };


  if (!currentUser) {
    return (
      <div className="min-h-screen font-sans bg-white text-gray-900 flex flex-col justify-between">
        {/* Top Navigation Bar */}
        <nav className="relative w-full bg-[#002d5b] text-white h-12 flex items-center px-4 justify-between shadow-md z-50">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-start leading-none group cursor-pointer">
              <span className="text-xl font-bold tracking-tight text-white">ORG</span>
              <span className="text-[10px] text-blue-200">v223.8</span>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs font-semibold mr-4 text-gray-200">
            <span className="hover:text-white cursor-pointer transition-colors">My Ip</span>
            <span className="hover:text-white cursor-pointer text-white border-b-2 border-white pb-0.5">Log in</span>
          </div>
        </nav>

        {/* Center Login Card Container */}
        <div className="flex-1 bg-white flex flex-col items-center justify-center py-12 px-4">
          <div className="w-full max-w-[480px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-gray-200 px-5 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
              Log in
            </div>
            
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
              {/* User Email */}
              <div className="flex flex-col sm:flex-row sm:items-center">
                <label className="sm:w-1/3 text-left sm:text-right pr-4 font-bold text-gray-700 text-xs">
                  User Email
                </label>
                <input 
                  type="text" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="flex-1 border border-blue-200 bg-blue-50/20 px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 transition-all" 
                />
              </div>

              {/* Password */}
              <div className="flex flex-col sm:flex-row sm:items-center">
                <label className="sm:w-1/3 text-left sm:text-right pr-4 font-bold text-gray-700 text-xs">
                  Password
                </label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="flex-1 border border-blue-200 bg-blue-50/20 px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 transition-all" 
                />
              </div>

              {/* Button */}
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-1/3"></div>
                <div className="flex-1">
                  <button 
                    type="submit" 
                    className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-5 py-1.5 rounded text-xs font-bold transition-all shadow-xs"
                  >
                    Log in
                  </button>
                  {loginError && (
                    <p className="text-rose-600 text-[11px] font-semibold mt-2.5 text-left">
                      {loginError}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>
          

        </div>

        {/* Footer */}
        <footer className="h-16 bg-white flex items-center justify-center border-t border-gray-100">
          <p className="text-xs text-gray-500">© 2026 - ORG</p>
        </footer>
      </div>
    );
  }

  const renderAppLayout = () => {
    return (
      <div className="flex flex-col flex-1 h-full min-h-screen">
        {/* Top Navigation Bar */}
        <nav className="relative w-full bg-[#002d5b] text-white h-12 flex items-center px-4 justify-between shadow-md z-40 flex-shrink-0">
          {/* Left side: Hamburger (if mobile) + Logo */}
          <div className="flex items-center space-x-3">
            {/* Hamburger button shown on mobile devices OR when viewMode is 'mobile' */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden block p-1 hover:bg-blue-800 rounded transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col items-start leading-none group cursor-pointer" onClick={() => {
              setActiveSidebarItem('admin-dash');
              setShowReviewWorkspace(false);
              setSelectedReviewRow(null);
              setShowForwardToTeacher(false);
              setShowImageLog(false);
            }}>
              <span className="text-xl font-bold tracking-tight text-white font-sans">ORG</span>
              <span className="text-[10px] text-blue-200 font-sans">v223.8</span>
            </div>
            
            {/* Tabs (Hidden on mobile or mobile-mode) */}
            <div className="hidden md:flex items-center space-x-6 h-full ml-4">
              {permittedTabs.map((tab) => (
                <button
                  key={tab}
                  id={`nav-${tab.toLowerCase()}`}
                  onClick={() => {
                    setActiveTab(tab);
                    setShowReviewWorkspace(false);
                    setSelectedReviewRow(null);
                    setShowForwardToTeacher(false);
                    setShowImageLog(false);
                    // auto-select first item
                    const items = sidebarItemsMap[tab] || [];
                    if (items.length > 0) {
                      setActiveSidebarItem(items[0].id);
                      if (items[0].subItems && items[0].subItems.length > 0) {
                        setActiveSubItem(items[0].subItems[0].id);
                      } else {
                        setActiveSubItem(null);
                      }
                    }
                  }}
                  className={`text-sm font-normal py-3.5 h-full px-1 border-b-2 transition-all font-sans ${
                    activeTab === tab 
                      ? 'border-white text-white font-semibold' 
                      : 'border-transparent text-gray-300 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Profile dropdown */}
            <div className="relative">
              <button 
                id="profile-dropdown-btn"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-1.5 text-xs hover:text-blue-200 transition-colors"
              >
                <span className="hidden sm:inline font-medium">{currentUser.name || currentUser.id}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-xl border border-gray-100 overflow-hidden z-50 text-left"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase text-xs">
                        {(currentUser.name || 'U')[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-none mb-1">{currentUser.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {(currentUser.id?.toLowerCase() === 'nazmulriad4@gmail.com' || currentUser.id?.toLowerCase() === 'nazmul.2853@udvash.net') 
                            ? 'Owner' 
                            : (currentUser.role || 'User')}
                        </p>
                      </div>
                    </div>
                    {/* Mobile tabs menu inside dropdown */}
                    <div className="block md:hidden border-b border-gray-100 p-1.5 space-y-1 bg-gray-50">
                      <p className="text-[9.5px] text-gray-400 font-bold px-2 py-0.5 uppercase">Modules</p>
                      {permittedTabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => {
                            setActiveTab(tab);
                            setShowReviewWorkspace(false);
                            setSelectedReviewRow(null);
                            setShowForwardToTeacher(false);
                            setShowImageLog(false);
                            setIsProfileOpen(false);
                            const items = sidebarItemsMap[tab] || [];
                            if (items.length > 0) {
                              setActiveSidebarItem(items[0].id);
                              if (items[0].subItems && items[0].subItems.length > 0) {
                                setActiveSubItem(items[0].subItems[0].id);
                              } else {
                                setActiveSubItem(null);
                              }
                            }
                          }}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                            activeTab === tab ? 'bg-blue-600 text-white font-semibold' : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center font-semibold border-t border-gray-50">
                      <Power className="w-3.5 h-3.5 mr-2" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              id="logout-btn"
              onClick={handleLogout}
              className="hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Content Wrapper */}
        <div className="flex-1 flex overflow-hidden relative bg-white min-h-0">
          
          {/* Static Sidebar (Hidden on Mobile/Mobile-mode) */}
          <aside className="hidden md:flex w-64 border-r border-gray-200 bg-[#f5f5f5] flex-col py-4 px-3 flex-shrink-0 text-left">
            {/* Tab title badge */}
            <div className="bg-[#002d5b] text-white px-3.5 py-2.5 rounded text-sm font-semibold mb-3 tracking-wide">
              {activeTab}
            </div>

            {/* Search filter */}
            <div className="px-1 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  id="sidebar-search-input"
                  type="text"
                  placeholder="Filter menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-gray-800"
                />
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto px-1 space-y-1.5 pb-4">
              {filteredSidebarItems.length > 0 ? (
                filteredSidebarItems.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <button
                      id={`sidebar-item-${item.id}`}
                      onClick={() => {
                        setSelectedDashboardDetail(null);
                        setShowReviewWorkspace(false);
                        setSelectedReviewRow(null);
                        setShowForwardToTeacher(false);
                        setShowImageLog(false);
                        setActiveSidebarItem(item.id);
                        setExpandedItemId(prev => prev === item.id ? null : item.id);
                        if (item.subItems && item.subItems.length > 0) {
                          setActiveSubItem(item.subItems[0].id);
                        } else {
                          setActiveSubItem(null);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-xs rounded transition-all border ${
                        activeSidebarItem === item.id
                          ? 'bg-[#cccccc] text-gray-900 border-gray-300 font-semibold shadow-xs'
                          : 'bg-[#f8f9fa] hover:bg-gray-200 text-gray-700 border-transparent'
                      }`}
                    >
                      {item.label}
                    </button>
                    
                    {/* Sub-items */}
                    <AnimatePresence>
                      {expandedItemId === item.id && item.subItems && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border border-gray-200 bg-white rounded pl-2 py-1 space-y-0.5"
                        >
                          {item.subItems.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                setSelectedDashboardDetail(null);
                                setShowReviewWorkspace(false);
                                setSelectedReviewRow(null);
                                setShowForwardToTeacher(false);
                                setShowImageLog(false);
                                setActiveSubItem(sub.id);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${
                                activeSubItem === sub.id
                                  ? 'bg-blue-50 text-blue-900 font-bold border-l-2 border-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-400 italic text-xs">
                  No items found
                </div>
              )}
            </div>
          </aside>

          {/* Mobile Sliding Sidebar/Drawer (Handles real responsive layouts and mobile mode) */}
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <>
                {/* Overlay Backdrop */}
                <div 
                  className="absolute inset-0 bg-black/50 z-40 transition-opacity"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
                
                {/* Drawer Content */}
                <motion.aside 
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  className="absolute left-0 top-0 bottom-0 w-64 bg-[#f8f9fa] z-50 border-r border-gray-200 flex flex-col p-4 text-left shadow-2xl"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">{activeTab} Menu</span>
                    <button 
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1 text-gray-500 hover:text-gray-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Filter */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Filter menu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none text-gray-800"
                    />
                  </div>

                  {/* Sidebar list */}
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    {filteredSidebarItems.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedDashboardDetail(null);
                            setShowReviewWorkspace(false);
                            setSelectedReviewRow(null);
                            setShowForwardToTeacher(false);
                            setShowImageLog(false);
                            setActiveSidebarItem(item.id);
                            setExpandedItemId(prev => prev === item.id ? null : item.id);
                            if (item.subItems && item.subItems.length > 0) {
                              setActiveSubItem(item.subItems[0].id);
                            } else {
                              setActiveSubItem(null);
                            }
                            if (!item.subItems) setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded font-medium border ${
                            activeSidebarItem === item.id
                              ? 'bg-blue-50 text-blue-900 border-blue-200 font-bold'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border-transparent'
                          }`}
                        >
                          {item.label}
                        </button>
                        {expandedItemId === item.id && item.subItems && (
                          <div className="bg-white border border-gray-100 rounded pl-2.5 py-1 space-y-1">
                            {item.subItems.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setSelectedDashboardDetail(null);
                                  setShowReviewWorkspace(false);
                                  setSelectedReviewRow(null);
                                  setShowForwardToTeacher(false);
                                  setShowImageLog(false);
                                  setActiveSubItem(sub.id);
                                  setIsMobileSidebarOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded ${
                                  activeSubItem === sub.id ? 'text-blue-700 font-bold bg-blue-50/50' : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content Viewport */}
          <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden relative">
            <div className="flex-1 overflow-auto bg-white flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${activeSidebarItem}-${activeSubItem}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 flex flex-col"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Main Content Footer */}
            <footer className="h-16 bg-white flex items-center justify-center border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500">© 2026 - ORG (Nazmul Alam-2853)</p>
            </footer>
          </main>

        </div>

        {/* Global Confirmation Modals */}
        <AnimatePresence>
          {cancelConfirmId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden font-sans"
              >
                <div className="bg-rose-600 text-white px-6 py-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-3" />
                  <h3 className="text-lg font-bold">Confirm Cancellation</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 font-medium mb-1 text-left">Are you sure you want to cancel this review request?</p>
                  <p className="text-gray-500 text-sm italic mb-6 text-left">(আপনি কি নিশ্চিত যে আপনি এই রিভিউ রিকোয়েস্টটি বাতিল করতে চান?)</p>
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setCancelConfirmId(null)}
                      className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      No, Keep It
                    </button>
                    <button 
                      onClick={() => handleCancelRequest(cancelConfirmId)}
                      className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render app layout directly (fully responsive layout is automatically handled)
  return renderAppLayout();
}
