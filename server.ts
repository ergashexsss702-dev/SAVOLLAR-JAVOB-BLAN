import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db/store.ts';
import {
  checkRateLimit,
  generateSessionToken,
  normalizePhone,
  validateAccessCode,
  verifySessionToken,
} from './src/server/services/authService.ts';
import { generateQuestionsWithGemini } from './src/server/services/geminiService.ts';
import { ALL_TOPICS, getTopicsFor } from './src/shared/topics.ts';
import {
  DifficultyLevel,
  GradeLevel,
  SubjectId,
  TestResultResponse,
  TestScoredItem,
  UserSession,
} from './src/shared/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// In-memory cache for questions for server-side test scoring
// Map: questionId -> QuestionItem
const questionCache = new Map<string, any>();

app.use(express.json({ limit: '5mb' }));

// Auth Middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Avtorizatsiya talab qilinadi' });
  }

  const token = authHeader.split(' ')[1];
  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Sessiya eskirgan yoki yaroqsiz' });
  }

  (req as any).user = session;
  next();
}

// Admin Middleware
function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as UserSession | undefined;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Ushbu amal uchun administrator huquqi zarur' });
  }
  next();
}

// ---------------- API ROUTES ----------------

// Rate limit helper
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
}

// 1. Auth Step A: Continue with Name & Phone
app.post('/api/auth/continue', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 20, 60000);
  if (!rl.allowed) {
    return res.status(429).json({ success: false, message: 'Ko\'p so\'rov yuborildi. Iltimos, 1 daqiqa kuting.' });
  }

  const { fullName, phone } = req.body;
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Iltimos, to\'liq ism-familiyangizni kiriting (kamida 3 harf).' });
  }

  const { isValid, normalized } = normalizePhone(phone || '');
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Telefon raqam noto\'g\'ri. O\'zbekiston raqami formatida kiriting (masalan: +998901234567 yoki 901234567).',
    });
  }

  // Create or record payment attempt for tracking
  db.createPayment(fullName.trim(), normalized, 70000);

  return res.json({
    success: true,
    normalizedPhone: normalized,
    fullName: fullName.trim(),
    price: '70 000 so‘m',
    telegramUrl: 'https://t.me/ergashexsss7o2',
  });
});

// 2. Auth Step B: Verify Access Code
app.post('/api/auth/verify-code', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 15, 60000);
  if (!rl.allowed) {
    return res.status(429).json({ success: false, message: 'Ko\'p xato urinishlar. Iltimos, 1 daqiqa kuting.' });
  }

  const { fullName, phone, accessCode } = req.body;
  if (!fullName || !phone || !accessCode) {
    return res.status(400).json({ success: false, message: 'Barcha maydonlarni to\'ldiring.' });
  }

  const validation = validateAccessCode(accessCode);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const role = validation.role || 'student';
  const now = Date.now();
  // Session valid for 7 days
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

  const session: UserSession = {
    userId: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    role,
    codeUsed: accessCode.trim(),
    createdAt: now,
    expiresAt,
  };

  db.addUserSession(session);
  const token = generateSessionToken(session);

  return res.json({
    success: true,
    message: validation.message,
    token,
    user: session,
  });
});

// 3. Auth Check Session
app.get('/api/auth/session', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user as UserSession;
  return res.json({ success: true, user });
});

// 4. Topics endpoint
app.get('/api/topics', (req: Request, res: Response) => {
  const grade = Number(req.query.grade) as GradeLevel;
  const subject = (req.query.subject as SubjectId) || 'matematika';

  if (grade && grade >= 1 && grade <= 11) {
    return res.json({ success: true, topics: getTopicsFor(grade, subject) });
  }
  return res.json({ success: true, topics: ALL_TOPICS });
});

// 5. Generate Questions
app.post('/api/questions/generate', authMiddleware, async (req: Request, res: Response) => {
  const { grade, subject, topicId, count, difficulty, language, useAi } = req.body;

  const parsedGrade = Number(grade) as GradeLevel;
  if (!parsedGrade || parsedGrade < 1 || parsedGrade > 11) {
    return res.status(400).json({ success: false, message: 'Sinf 1 dan 11 gacha bo\'lishi kerak.' });
  }

  const parsedSubject = subject === 'algebra' ? 'algebra' : 'matematika';
  const parsedCount = Math.min(Math.max(Number(count) || 10, 1), 50);
  const parsedDifficulty = (['oson', 'ortacha', 'qiyin'].includes(difficulty) ? difficulty : 'ortacha') as DifficultyLevel;

  try {
    const result = await generateQuestionsWithGemini({
      grade: parsedGrade,
      subject: parsedSubject,
      topicId: String(topicId || (parsedSubject === 'algebra' ? 'alg_linear_equations' : 'mat_add_sub')),
      count: parsedCount,
      difficulty: parsedDifficulty,
      language: language || 'uz',
      useAi: Boolean(useAi),
    });

    // Cache questions for test grading
    for (const q of result.questions) {
      questionCache.set(q.id, q);
    }

    return res.json({
      success: true,
      questions: result.questions,
      source: result.source,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Savollarni yaratishda xatolik yuz berdi.',
    });
  }
});

// 6. Test Submission & Server-Side Scoring
app.post('/api/tests/submit', authMiddleware, (req: Request, res: Response) => {
  const { answers } = req.body; // array of { id, selectedAnswer }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, message: 'Test javoblari yuborilmadi.' });
  }

  let correctCount = 0;
  let answeredCount = 0;
  const details: TestScoredItem[] = [];

  for (let i = 0; i < answers.length; i++) {
    const item = answers[i];
    const cached = questionCache.get(item.id);
    const selectedAnswer = item.selectedAnswer ? String(item.selectedAnswer).trim() : '';

    if (selectedAnswer) answeredCount++;

    const correctAnswer = cached ? cached.correctAnswer : (item.correctAnswer || '');
    const isCorrect = selectedAnswer !== '' && selectedAnswer === correctAnswer;

    if (isCorrect) correctCount++;

    details.push({
      id: item.id,
      questionNumber: i + 1,
      questionText: cached ? cached.questionText : (item.questionText || `Savol #${i + 1}`),
      selectedAnswer,
      correctAnswer,
      isCorrect,
      stepByStepSolution: cached ? cached.stepByStepSolution : ['Yechim mavjud emas'],
      simpleExplanation: cached ? cached.simpleExplanation : 'Tushuntirish',
    });
  }

  const totalQuestions = answers.length;
  const incorrectCount = totalQuestions - correctCount;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  // Uzbek 5-point grading scale:
  // >= 86% -> 5 (A'lo)
  // >= 71% -> 4 (Yaxshi)
  // >= 56% -> 3 (Qoniqarli)
  // < 56% -> 2 (Qoniqarsiz)
  let gradeScore = 2;
  let feedbackMessage = 'Ko\'proq mashq qiling, natijangizni yaxshilashingiz mumkin!';
  if (percentage >= 86) {
    gradeScore = 5;
    feedbackMessage = 'Ajoyib natija! Barcha bilimlaringiz mustahkam!';
  } else if (percentage >= 71) {
    gradeScore = 4;
    feedbackMessage = 'Yaxshi natija! Kichik xatolarni bartaraf qilsangiz, a\'lo bo\'ladi!';
  } else if (percentage >= 56) {
    gradeScore = 3;
    feedbackMessage = 'Qoniqarli. Mavzuni takrorlab, yana urinib ko\'ring!';
  }

  const response: TestResultResponse = {
    success: true,
    totalQuestions,
    answeredCount,
    correctCount,
    incorrectCount,
    percentage,
    gradeScore,
    feedbackMessage,
    details,
  };

  return res.json(response);
});

// 7. Admin Routes (Protected)
app.get('/api/admin/users', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  return res.json({ success: true, users: db.getUsers() });
});

app.get('/api/admin/access-codes', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  return res.json({ success: true, accessCodes: db.getAccessCodes() });
});

app.post('/api/admin/access-codes', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { code, description, maxUses, expiresAt } = req.body;
  if (!code || typeof code !== 'string' || code.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'Kirish kodi kamida 4 belgidan iborat bo\'lishi shart.' });
  }

  const newCode = db.addAccessCode({
    code: code.trim(),
    description: description || 'Administrator tomonidan yaratilgan',
    maxUses: Number(maxUses) || 50,
    isActive: true,
    expiresAt: expiresAt || undefined,
  });

  return res.json({ success: true, accessCode: newCode });
});

app.patch('/api/admin/access-codes/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const success = db.toggleAccessCode(id, Boolean(isActive));
  return res.json({ success });
});

app.get('/api/admin/payments', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  return res.json({ success: true, payments: db.getPayments() });
});

app.patch('/api/admin/payments/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, codeIssued, note } = req.body;
  const success = db.updatePaymentStatus(id, status, codeIssued, note);
  return res.json({ success });
});

app.get('/api/admin/audit-logs', authMiddleware, adminMiddleware, (_req: Request, res: Response) => {
  return res.json({ success: true, auditLogs: db.getAuditLogs() });
});

// System Status Endpoint
app.get('/api/system/status', (_req: Request, res: Response) => {
  return res.json({
    status: 'online',
    appName: 'Savollarni javobi bilan',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    allowDemoCode: process.env.ALLOW_DEMO_CODE === 'true' || !isProduction,
    nodeEnv: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// ---------------- VITE / STATIC SERVING ----------------
async function startServer() {
  if (!isProduction) {
    // Mount Vite dev server middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
