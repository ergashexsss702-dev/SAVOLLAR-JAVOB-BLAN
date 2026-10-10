import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { QuestionItem } from '../../shared/types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface QuestionCardProps {
  question: QuestionItem;
  globalShowAnswers: boolean;
  onSpeak: (text: string) => void;
  isCurrentlySpeaking?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  globalShowAnswers,
  onSpeak,
  isCurrentlySpeaking,
}) => {
  const { t } = useLanguage();
  const [localShowAnswer, setLocalShowAnswer] = useState<boolean | null>(null);

  // If local toggle is touched, respect it, otherwise follow global
  const showAnswer = localShowAnswer !== null ? localShowAnswer : globalShowAnswers;

  const toggleShow = () => {
    setLocalShowAnswer(!showAnswer);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'oson':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {t('diffEasy')}
          </span>
        );
      case 'qiyin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {t('diffHard')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {t('diffMedium')}
          </span>
        );
    }
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 p-5 sm:p-6 backdrop-blur-md ${
        isCurrentlySpeaking
          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-lg shadow-indigo-500/15'
          : 'bg-slate-900/60 hover:bg-slate-900/80 border-slate-800/80 shadow-md'
      }`}
    >
      {/* Top Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono">
            #{question.questionNumber}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {question.topicName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getDifficultyBadge(question.difficulty)}

          {question.isAiGenerated ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              AI
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              <Cpu className="w-2.5 h-2.5 text-blue-400" />
              Math
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
            {question.questionText}
          </h4>

          {/* Quick audio button for question */}
          <button
            onClick={() => onSpeak(question.questionText)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition shrink-0"
            title={t('listenQuestion')}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Optional mathematical formula display */}
        {question.formula && (
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-sm text-indigo-300 text-center tracking-wide overflow-x-auto">
            {question.formula}
          </div>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {question.options.map((opt, i) => {
            const isCorrect = showAnswer && opt === question.correctAnswer;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-all duration-200 ${
                  isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 font-semibold'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                    isCorrect
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {optionLetters[i]}
                </span>
                <span className="truncate">{opt}</span>
                {isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Answer & Explanation Section */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleShow}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition py-1"
          >
            {showAnswer ? (
              <>
                <ChevronUp className="w-4 h-4" />
                {t('hideAnswersBtn')}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {t('showAnswersBtn')}
              </>
            )}
          </button>

          {showAnswer && (
            <button
              onClick={() =>
                onSpeak(
                  `To'g'ri javob: ${question.correctAnswer}. ${question.simpleExplanation}`
                )
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition"
              title={t('listenAnswer')}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {t('listenAnswer')}
            </button>
          )}
        </div>

        {showAnswer && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-indigo-500/25 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Correct answer callout */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                {t('correctAnswer')}:
              </span>
              <span className="text-sm font-bold text-white bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 font-mono">
                {question.correctAnswer}
              </span>
            </div>

            {/* Step by step solution */}
            {question.stepByStepSolution && question.stepByStepSolution.length > 0 && (
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  {t('solutionSteps')}:
                </span>
                <div className="space-y-1 text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {question.stepByStepSolution.map((step, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simple explanation */}
            {question.simpleExplanation && (
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  {t('explanation')}:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                  {question.simpleExplanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
