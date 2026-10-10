import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Cpu,
  Eye,
  EyeOff,
  FileDown,
  Layers,
  Play,
  Printer,
  RefreshCw,
  Sliders,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  DifficultyLevel,
  GenerateQuestionsResponse,
  GradeLevel,
  QuestionItem,
  SubjectId,
  TopicInfo,
} from '../../shared/types.ts';
import { getTopicsFor } from '../../shared/topics.ts';
import { QuestionCard } from '../components/QuestionCard.tsx';
import { TestModeModal } from '../components/TestModeModal.tsx';
import { TTSControlBar, useTTS } from '../components/TTSPlayer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

export const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const { t, currentLang } = useLanguage();

  // Selections
  const [grade, setGrade] = useState<GradeLevel>(5);
  const [subject, setSubject] = useState<SubjectId>('matematika');
  const [availableTopics, setAvailableTopics] = useState<TopicInfo[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('mat_fractions');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('ortacha');
  const [useAi, setUseAi] = useState<boolean>(true);

  // Questions state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [globalShowAnswers, setGlobalShowAnswers] = useState(false);
  const [generationSource, setGenerationSource] = useState<string>('deterministic');
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Copy toast
  const [copiedToast, setCopiedToast] = useState(false);

  // Test mode modal
  const [testModeOpen, setTestModeOpen] = useState(false);

  // TTS
  const { isSpeaking, currentText, speed, setSpeed, speak, speakSequence, stop } = useTTS();

  // Update available topics when grade or subject changes
  useEffect(() => {
    // If grade < 6, subject can only be matematika
    if (grade < 6 && subject === 'algebra') {
      setSubject('matematika');
    }
  }, [grade]);

  useEffect(() => {
    const topics = getTopicsFor(grade, subject);
    setAvailableTopics(topics);
    if (topics.length > 0) {
      // Keep existing topic if available, else pick first
      const exists = topics.some((t) => t.id === selectedTopicId);
      if (!exists) {
        setSelectedTopicId(topics[0].id);
      }
    }
  }, [grade, subject]);

  // Generate Questions
  const handleGenerate = async () => {
    if (!token) return;

    let finalCount = questionCount;
    if (customCountInput) {
      const num = parseInt(customCountInput, 10);
      if (!isNaN(num) && num > 0) {
        finalCount = Math.min(50, num);
      }
    }

    setIsGenerating(true);
    setGenerationNotice(null);
    stop();

    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          grade,
          subject,
          topicId: selectedTopicId,
          count: finalCount,
          difficulty,
          language: currentLang,
          useAi,
        }),
      });

      const data: GenerateQuestionsResponse = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
        setGenerationSource(data.source);
        if (data.message) {
          setGenerationNotice(data.message);
        }
      } else {
        setGenerationNotice(data.message || 'Savollarni yaratishda xatolik yuz berdi.');
      }
    } catch {
      setGenerationNotice('Serverga so\'rov yuborishda xatolik yuz berdi.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy questions
  const handleCopyQuestions = () => {
    if (questions.length === 0) return;

    const textBlock = questions
      .map((q) => {
        let text = `${q.questionNumber}. ${q.questionText}\n`;
        if (q.formula) text += `   Formula: ${q.formula}\n`;
        text += `   A) ${q.options[0]}   B) ${q.options[1]}\n`;
        text += `   C) ${q.options[2]}   D) ${q.options[3]}\n`;
        if (globalShowAnswers) {
          text += `   >>> To'g'ri javob: ${q.correctAnswer}\n`;
          text += `   >>> Yechimi: ${q.stepByStepSolution.join(' ')}\n`;
        }
        return text;
      })
      .join('\n');

    navigator.clipboard.writeText(textBlock).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    });
  };

  // Print worksheet
  const handlePrint = () => {
    window.print();
  };

  // Listen to all questions sequentially
  const handleListenAll = () => {
    if (questions.length === 0) return;
    const itemsToRead = questions.map(
      (q) => `Savol ${q.questionNumber}: ${q.questionText}. Variantlar: A: ${q.options[0]}, B: ${q.options[1]}, C: ${q.options[2]}, D: ${q.options[3]}.`
    );
    speakSequence(itemsToRead);
  };

  const countOptions = [5, 10, 15, 20, 30, 50];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {copiedToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <Check className="w-5 h-5" />
          <span className="text-sm font-semibold">{t('copiedSuccess')}</span>
        </div>
      )}

      {/* Greeting banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900/80 to-purple-900/60 border border-slate-700/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Interaktiv Maktab Ta'limi
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('welcome')}, {user?.fullName}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Sinf va mavzuni tanlang, matematika yoki algebradan test savollari, qadamma-qadam yechimlar va ovozli o'qish imkoniyatidan foydalaning.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {questions.length > 0 && (
            <button
              onClick={() => setTestModeOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition active:scale-[0.98]"
            >
              <Award className="w-4 h-4" />
              {t('testModeBtn')} ({questions.length})
            </button>
          )}
        </div>
      </div>

      {/* Configuration Controls Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-700/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Savol parametrlarini sozlash
            </h3>
          </div>
        </div>

        {/* 1. Grade selection (1-sinf through 11-sinf) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
            {t('gradeSelect')} (1 — 11)
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 sm:gap-2">
            {(Array.from({ length: 11 }, (_, i) => i + 1) as GradeLevel[]).map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`py-2 rounded-xl text-xs sm:text-sm font-bold font-mono transition ${
                  grade === g
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                }`}
              >
                {g}-sinf
              </button>
            ))}
          </div>
        </div>

        {/* 2. Subject & Difficulty Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Subject */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              {t('subjectSelect')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSubject('matematika')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs sm:text-sm font-semibold transition ${
                  subject === 'matematika'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400/40'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Matematika
              </button>

              <button
                disabled={grade < 6}
                onClick={() => setSubject('algebra')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs sm:text-sm font-semibold transition ${
                  grade < 6
                    ? 'opacity-40 cursor-not-allowed bg-slate-800/40 text-slate-500'
                    : subject === 'algebra'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-400/40'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                }`}
                title={grade < 6 ? 'Algebra 6-sinfdan boshlanadi' : ''}
              >
                <Layers className="w-4 h-4" />
                Algebra
                {grade < 6 && <span className="text-[10px] block">(6+ sinf)</span>}
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              {t('difficultySelect')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['oson', 'ortacha', 'qiyin'] as DifficultyLevel[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-3 rounded-2xl text-xs sm:text-sm font-semibold transition capitalize ${
                    difficulty === d
                      ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                  }`}
                >
                  {d === 'oson' ? t('diffEasy') : d === 'ortacha' ? t('diffMedium') : t('diffHard')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Topics for current grade & subject */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
            {t('topicSelect')} ({availableTopics.length} ta mavzu)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 rounded-2xl bg-slate-950/40 border border-slate-800">
            {availableTopics.map((top) => (
              <button
                key={top.id}
                onClick={() => setSelectedTopicId(top.id)}
                className={`flex items-start text-left p-3 rounded-xl transition ${
                  selectedTopicId === top.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-xs sm:text-sm font-semibold block leading-tight">
                    {top.name}
                  </span>
                  <span
                    className={`text-[11px] block mt-0.5 line-clamp-1 ${
                      selectedTopicId === top.id ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {top.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Question Count & Generation Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          {/* Question count */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              {t('questionCount')}
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {countOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setQuestionCount(c);
                    setCustomCountInput('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition ${
                    questionCount === c && !customCountInput
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {c} ta
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="50"
                placeholder={t('customCount')}
                value={customCountInput}
                onChange={(e) => setCustomCountInput(e.target.value)}
                className="w-32 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* AI vs Math Engine toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl ${
                  useAi ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {useAi ? <Sparkles className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">
                  {useAi ? t('aiBadge') : t('mathEngineBadge')}
                </span>
                <span className="text-[10px] text-slate-400">
                  {useAi ? 'Kreativ AI generator' : '100% deterministik aniq hisob'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setUseAi(!useAi)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useAi ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useAi ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Button: Generate */}
        <div className="pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-base font-bold shadow-xl shadow-indigo-600/30 transition active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{t('loadingQuestions')}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{questions.length > 0 ? t('regenerateBtn') : t('generateBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notice info banner if fallback occurred or info message */}
      {generationNotice && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs sm:text-sm text-indigo-200 flex items-center justify-between gap-3 animate-in fade-in">
          <span>{generationNotice}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300">
            {generationSource}
          </span>
        </div>
      )}

      {/* Generated Questions Section */}
      {questions.length > 0 && (
        <div className="space-y-6">
          {/* Top toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-700/80 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {questions.length} ta savol
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                ({grade}-sinf, {subject === 'algebra' ? 'Algebra' : 'Matematika'})
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Show/Hide all answers */}
              <button
                onClick={() => setGlobalShowAnswers(!globalShowAnswers)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                {globalShowAnswers ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{t('hideAnswersBtn')}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('showAnswersBtn')}</span>
                  </>
                )}
              </button>

              {/* TTS Listen All */}
              <button
                onClick={handleListenAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('listenAll')}</span>
              </button>

              {/* Copy Questions */}
              <button
                onClick={handleCopyQuestions}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{t('copyQuestions')}</span>
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('printBtn')}</span>
              </button>

              {/* PDF Save */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('pdfBtn')}</span>
              </button>

              {/* Test Mode */}
              <button
                onClick={() => setTestModeOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{t('testModeBtn')}</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4 print:space-y-6 print:text-black">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                globalShowAnswers={globalShowAnswers}
                onSpeak={(text) => speak(text)}
                isCurrentlySpeaking={currentText === q.questionText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {questions.length === 0 && !isGenerating && (
        <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white mb-1">
            {t('emptyQuestionsPrompt')}
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Matematika va algebradan qiziqarli masalalar, qadamma-qadam yechimlar va testlar tayyorlash uchun yuqoridagi tugmani bosing.
          </p>
        </div>
      )}

      {/* Floating TTS Controller */}
      <TTSControlBar
        currentlySpeakingText={isSpeaking ? currentText : null}
        onStop={stop}
        speed={speed}
        onSpeedChange={setSpeed}
      />

      {/* Test Mode Modal */}
      <TestModeModal
        isOpen={testModeOpen}
        onClose={() => setTestModeOpen(false)}
        questions={questions}
        onRetryNewQuestions={handleGenerate}
      />
    </div>
  );
};
