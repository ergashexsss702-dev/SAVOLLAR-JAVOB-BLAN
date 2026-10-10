import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { QuestionItem, TestResultResponse } from '../../shared/types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  onRetryNewQuestions: () => void;
}

export const TestModeModal: React.FC<TestModeModalProps> = ({
  isOpen,
  onClose,
  questions,
  onRetryNewQuestions,
}) => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<TestResultResponse | null>(null);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];

  const handleSelectOption = (opt: string) => {
    if (testResult) return; // Locked after submission
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt,
    }));
  };

  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSubmitTest = async () => {
    setShowConfirmSubmit(false);
    setIsSubmitting(true);

    try {
      const payload = {
        answers: questions.map((q) => ({
          id: q.id,
          selectedAnswer: userAnswers[q.id] || '',
          // Fallback if needed
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
        })),
      };

      const res = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data: TestResultResponse = await res.json();
      if (data.success) {
        setTestResult(data);
      }
    } catch (err) {
      console.error('Test submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTest = () => {
    setUserAnswers({});
    setTestResult(null);
    setCurrentIndex(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                {t('testTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {questions.length} ta savol | {answeredCount} ta belgilandi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!testResult ? (
            /* Active Test Mode */
            <>
              {/* Question Navigation Grid */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(userAnswers[q.id]);
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${
                        isCurrent
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900'
                          : isAnswered
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Savol {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="text-xs text-slate-400">{currentQ.topicName}</span>
                </div>

                <h4 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                  {currentQ.questionText}
                </h4>

                {currentQ.formula && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm text-indigo-300 text-center">
                    {currentQ.formula}
                  </div>
                )}

                {/* Option Choices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = userAnswers[currentQ.id] === opt;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(opt)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm text-left transition active:scale-[0.98] ${
                          isSelected
                            ? 'bg-indigo-600/25 border-indigo-500 text-white font-medium shadow-md shadow-indigo-600/10'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {optionLetters[i]}
                        </span>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Test Results View */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Score card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/30 text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-white tracking-tight">
                  {testResult.gradeScore}-baho ({testResult.percentage}%)
                </h4>
                <p className="text-sm text-indigo-200 max-w-md mx-auto">
                  {testResult.feedbackMessage}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto pt-4">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">{t('correctCount')}</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {testResult.correctCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">{t('incorrectCount')}</span>
                    <span className="text-lg font-bold text-rose-400">
                      {testResult.incorrectCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">{t('unansweredCount')}</span>
                    <span className="text-lg font-bold text-amber-400">
                      {testResult.totalQuestions - testResult.answeredCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review details */}
              <div className="space-y-4">
                <h5 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  {t('reviewDetails')}
                </h5>
                <div className="space-y-3">
                  {testResult.details.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border ${
                        item.isCorrect
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-rose-950/20 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                          <span className="text-xs font-mono font-bold text-slate-400">
                            #{item.questionNumber}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            item.isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.isCorrect ? 'To‘g‘ri' : 'Noto‘g‘ri'}
                        </span>
                      </div>

                      <p className="text-sm text-slate-200 mt-2 font-medium">
                        {item.questionText}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 block">Sizning javobingiz:</span>
                          <span
                            className={
                              item.isCorrect
                                ? 'text-emerald-400 font-bold'
                                : 'text-rose-400 font-bold'
                            }
                          >
                            {item.selectedAnswer || 'Belgilanmagan'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">To‘g‘ri javob:</span>
                          <span className="text-emerald-300 font-bold">
                            {item.correctAnswer}
                          </span>
                        </div>
                      </div>

                      {/* Solution steps */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                        <span className="font-semibold text-indigo-300 block mb-1">
                          Yechilishi:
                        </span>
                        {item.stepByStepSolution.map((s, idx) => (
                          <div key={idx}>{s}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
          {!testResult ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Oldingisi
                </button>
                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium transition"
                >
                  Keyingisi
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                {t('submitTest')}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={resetTest}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                <RotateCcw className="w-4 h-4" />
                Qayta yechish
              </button>

              <button
                onClick={() => {
                  onClose();
                  onRetryNewQuestions();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/25 transition"
              >
                {t('retryTest')}
              </button>
            </div>
          )}
        </div>

        {/* Confirmation Modal overlay */}
        {showConfirmSubmit && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">{t('confirmSubmit')}</h4>
              {unansweredCount > 0 ? (
                <p className="text-xs text-amber-300">
                  Diqqat: Siz {unansweredCount} ta savolga hali javob bermadingiz!
                </p>
              ) : (
                <p className="text-xs text-slate-300">
                  Barcha savollar belgilandi. Natijalarni ko‘rishga tayyormisiz?
                </p>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Qaytish
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmitTest}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  {isSubmitting ? 'Baholanmoqda...' : 'Ha, yakunlash'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
