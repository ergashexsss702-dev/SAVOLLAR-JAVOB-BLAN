import { GoogleGenAI, Type } from '@google/genai';
import { GenerateQuestionsRequest, QuestionItem } from '../../shared/types.ts';
import { ALL_TOPICS } from '../../shared/topics.ts';
import { generateDeterministicQuestions } from './mathEngine.ts';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateQuestionsWithGemini(
  request: GenerateQuestionsRequest
): Promise<{ questions: QuestionItem[]; source: 'gemini-ai' | 'fallback' | 'deterministic'; message?: string }> {
  const ai = getAiClient();
  const topic = ALL_TOPICS.find((t) => t.id === request.topicId) || ALL_TOPICS[0];

  // If AI is not requested or no API key configured, use deterministic
  if (!request.useAi || !ai) {
    const questions = generateDeterministicQuestions(
      request.grade,
      request.subject,
      request.topicId,
      request.count,
      request.difficulty
    );
    return {
      questions,
      source: 'deterministic',
      message: !ai && request.useAi
        ? 'GEMINI_API_KEY topilmadi, savollar deterministik matematika dvigateli orqali yaratildi.'
        : undefined,
    };
  }

  try {
    const prompt = `Siz maktab o'quvchilari uchun matematika va algebra fanlari bo'yicha professional metodist o'qituvchisiz.
Quyidagi parametrlar asosida aniq va xatosiz ${request.count} ta test savolini yaratib bering:
- Sinf: ${request.grade}-sinf
- Fan: ${request.subject === 'algebra' ? 'Algebra' : 'Matematika'}
- Mavzu: ${topic.name} (${topic.description})
- Qiyinlik darajasi: ${request.difficulty || 'o\'rtacha'}
- Savol tili: O'zbek tili (Lotin alifbosi)

TALABLAR:
1. Har bir savol uchun 4 ta variant (options) bering. To'g'ri javob ushbu variantlar orasida AYNAN mavjud bo'lishi shart.
2. Matematik hisob-kitoblar 100% to'g'ri va xatosiz bo'lishi shart.
3. stepByStepSolution ichida kamida 2-3 bosqichli tushunarli yechim qadamma-qadam keltirilsin (masalan: 1. ..., 2. ...).
4. simpleExplanation o'quvchiga tushunarli sodda xulosa bo'lsin.
5. Savollar bir-birini takrorlamasligi kerak.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Siz matematika va algebra bo\'yicha o\'zbek tilida to\'liq tekshirilgan o\'quv testlari tuzuvchi tizimsiz. Faqat JSON formatida javob bering.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              formula: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              stepByStepSolution: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              simpleExplanation: { type: Type.STRING },
            },
            required: ['questionText', 'options', 'correctAnswer', 'stepByStepSolution', 'simpleExplanation'],
          },
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Gemini javobidan bo\'sh matn qaytdi');
    }

    const rawList = JSON.parse(text);
    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error('Yaroqsiz JSON formati');
    }

    const validatedQuestions: QuestionItem[] = rawList.map((item, idx) => {
      // Ensure options has at least 4 items and contains correctAnswer
      let opts = Array.isArray(item.options) ? item.options.map(String) : [];
      const correct = String(item.correctAnswer || opts[0] || '1');

      if (!opts.includes(correct)) {
        opts.unshift(correct);
      }
      while (opts.length < 4) {
        opts.push(`Variant ${opts.length + 1}`);
      }
      opts = opts.slice(0, 4);

      return {
        id: `ai-q-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        questionNumber: idx + 1,
        grade: request.grade,
        subject: request.subject,
        topicId: request.topicId,
        topicName: topic.name,
        difficulty: request.difficulty || 'ortacha',
        questionText: String(item.questionText || ''),
        formula: item.formula ? String(item.formula) : undefined,
        options: opts,
        correctAnswer: correct,
        stepByStepSolution: Array.isArray(item.stepByStepSolution) && item.stepByStepSolution.length > 0
          ? item.stepByStepSolution.map(String)
          : [`1. To'g'ri javob: ${correct}`],
        simpleExplanation: String(item.simpleExplanation || `Ushbu savolning to'g'ri javobi: ${correct}`),
        isAiGenerated: true,
      };
    });

    return {
      questions: validatedQuestions,
      source: 'gemini-ai',
      message: 'Savollar Gemini 3.8 Flash AI modeli orqali yaratildi.',
    };
  } catch (error) {
    console.warn('Gemini API call failed, falling back to deterministic math engine:', error);
    const fallbackQuestions = generateDeterministicQuestions(
      request.grade,
      request.subject,
      request.topicId,
      request.count,
      request.difficulty
    );
    return {
      questions: fallbackQuestions,
      source: 'fallback',
      message: 'AI xizmati vaqtincha band bo\'lganligi sababli savollar aniq hisoblash dvigateli orqali shakllantirildi.',
    };
  }
}
