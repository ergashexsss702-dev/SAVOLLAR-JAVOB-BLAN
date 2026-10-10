export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type SubjectId = 'matematika' | 'algebra';

export type DifficultyLevel = 'oson' | 'ortacha' | 'qiyin';

export interface TopicInfo {
  id: string;
  subject: SubjectId;
  name: string;
  minGrade: GradeLevel;
  maxGrade: GradeLevel;
  description: string;
}

export interface QuestionItem {
  id: string;
  questionNumber: number;
  grade: GradeLevel;
  subject: SubjectId;
  topicId: string;
  topicName: string;
  difficulty: DifficultyLevel;
  questionText: string;
  formula?: string;
  options: string[]; // 4 options [A, B, C, D]
  correctAnswer: string;
  stepByStepSolution: string[];
  simpleExplanation: string;
  isAiGenerated: boolean;
}

export interface GenerateQuestionsRequest {
  grade: GradeLevel;
  subject: SubjectId;
  topicId: string;
  count: number;
  difficulty?: DifficultyLevel;
  language?: string;
  useAi?: boolean;
}

export interface GenerateQuestionsResponse {
  success: boolean;
  questions: QuestionItem[];
  source: 'deterministic' | 'gemini-ai' | 'fallback';
  message?: string;
}

export interface UserSession {
  userId: string;
  fullName: string;
  phone: string;
  role: 'student' | 'admin';
  codeUsed?: string;
  createdAt: number;
  expiresAt: number;
}

export interface AccessCodeRecord {
  id: string;
  code: string;
  description: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface PaymentRecord {
  id: string;
  userId?: string;
  userName: string;
  phone: string;
  amount: number;
  status: 'Kutilmoqda' | 'Tasdiqlangan' | 'Rad etilgan';
  codeIssued?: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  actor: string;
}

export interface TestSubmissionRequest {
  questions: {
    id: string;
    selectedAnswer: string;
  }[];
}

export interface TestScoredItem {
  id: string;
  questionNumber: number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  stepByStepSolution: string[];
  simpleExplanation: string;
}

export interface TestResultResponse {
  success: boolean;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
  gradeScore: number; // e.g. 5, 4, 3, 2 (Uzbek 5-point scale)
  feedbackMessage: string;
  details: TestScoredItem[];
}
