import { DifficultyLevel, GradeLevel, QuestionItem, SubjectId } from '../../shared/types.ts';
import { ALL_TOPICS } from '../../shared/topics.ts';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateOptions(correctAnswer: string | number, type: 'int' | 'float' | 'fraction' | 'equation' = 'int'): string[] {
  const strCorrect = String(correctAnswer);
  const optionsSet = new Set<string>();
  optionsSet.add(strCorrect);

  if (type === 'int') {
    const val = Number(correctAnswer);
    const deltas = [-3, -2, -1, 1, 2, 3, 5, 10, -5, -10];
    const shuffledDeltas = shuffle(deltas);
    for (const d of shuffledDeltas) {
      if (optionsSet.size >= 4) break;
      const candidate = val + d;
      if (candidate !== val) {
        optionsSet.add(String(candidate));
      }
    }
    let fallback = 1;
    while (optionsSet.size < 4) {
      optionsSet.add(String(val + fallback * 7));
      fallback++;
    }
  } else if (type === 'float') {
    const val = Number(correctAnswer);
    const deltas = [-0.5, -0.2, 0.1, 0.2, 0.5, 1.0, -1.0];
    for (const d of shuffle(deltas)) {
      if (optionsSet.size >= 4) break;
      const cand = Number((val + d).toFixed(2));
      optionsSet.add(String(cand));
    }
    let fallback = 0.3;
    while (optionsSet.size < 4) {
      optionsSet.add(String(Number((val + fallback).toFixed(2))));
      fallback += 0.4;
    }
  } else {
    // String or other
    const fallbacks = ['0', '1', '-1', '2', '-2', '3', '4', 'x = 0', 'x = 1', 'x = -2'];
    for (const fb of shuffle(fallbacks)) {
      if (optionsSet.size >= 4) break;
      if (fb !== strCorrect) optionsSet.add(fb);
    }
  }

  return shuffle(Array.from(optionsSet).slice(0, 4));
}

export function generateDeterministicQuestions(
  grade: GradeLevel,
  subject: SubjectId,
  topicId: string,
  count: number,
  difficulty: DifficultyLevel = 'ortacha'
): QuestionItem[] {
  const topic = ALL_TOPICS.find((t) => t.id === topicId) || ALL_TOPICS[0];
  const questions: QuestionItem[] = [];
  const usedSignatures = new Set<string>();

  for (let i = 1; i <= count; i++) {
    let q: QuestionItem | null = null;
    let attempts = 0;

    while (attempts < 20) {
      attempts++;
      const candidate = createSingleQuestion(i, grade, subject, topic.id, topic.name, difficulty);
      const signature = `${candidate.questionText}_${candidate.correctAnswer}`;
      if (!usedSignatures.has(signature)) {
        usedSignatures.add(signature);
        q = candidate;
        break;
      }
    }

    if (!q) {
      // Fallback if unique wasn't found
      q = createSingleQuestion(i, grade, subject, topic.id, topic.name, difficulty);
    }

    questions.push(q);
  }

  return questions;
}

function createSingleQuestion(
  num: number,
  grade: GradeLevel,
  subject: SubjectId,
  topicId: string,
  topicName: string,
  difficulty: DifficultyLevel
): QuestionItem {
  const id = `q-${Date.now()}-${num}-${Math.random().toString(36).substring(2, 7)}`;

  // 1. Qo‘shish va ayirish
  if (topicId === 'mat_add_sub') {
    const isAdd = Math.random() > 0.5;
    const maxVal = grade === 1 ? 20 : grade === 2 ? 100 : 1000;
    const a = randInt(grade === 1 ? 2 : 10, maxVal);
    const b = randInt(grade === 1 ? 1 : 5, isAdd ? maxVal : a - 1);

    if (isAdd) {
      const ans = a + b;
      return {
        id,
        questionNumber: num,
        grade,
        subject,
        topicId,
        topicName,
        difficulty,
        questionText: `Hisoblang: ${a} + ${b} = ?`,
        formula: `${a} + ${b}`,
        correctAnswer: String(ans),
        options: generateOptions(ans, 'int'),
        stepByStepSolution: [
          `1. Birinchi qo'shiluvchi: ${a}`,
          `2. Ikkinchi qo'shiluvchi: ${b}`,
          `3. ${a} + ${b} = ${ans}`
        ],
        simpleExplanation: `${a} ga ${b} ni qo'shganda natija ${ans} bo'ladi.`,
        isAiGenerated: false
      };
    } else {
      const ans = a - b;
      return {
        id,
        questionNumber: num,
        grade,
        subject,
        topicId,
        topicName,
        difficulty,
        questionText: `Hisoblang: ${a} - ${b} = ?`,
        formula: `${a} - ${b}`,
        correctAnswer: String(ans),
        options: generateOptions(ans, 'int'),
        stepByStepSolution: [
          `1. Kamayuvchi: ${a}`,
          `2. Ayriluvchi: ${b}`,
          `3. ${a} - ${b} = ${ans}`
        ],
        simpleExplanation: `${a} dan ${b} ni ayirganda ayirma ${ans} ga teng bo'ladi.`,
        isAiGenerated: false
      };
    }
  }

  // 2. Ko‘paytirish va bo‘lish
  if (topicId === 'mat_mul_div') {
    const isMul = Math.random() > 0.5;
    const a = randInt(2, grade <= 3 ? 10 : 25);
    const b = randInt(2, grade <= 3 ? 10 : 15);

    if (isMul) {
      const ans = a * b;
      return {
        id,
        questionNumber: num,
        grade,
        subject,
        topicId,
        topicName,
        difficulty,
        questionText: `Hisoblang: ${a} × ${b} = ?`,
        formula: `${a} \\times ${b}`,
        correctAnswer: String(ans),
        options: generateOptions(ans, 'int'),
        stepByStepSolution: [
          `1. Ko'paytuvchilar: ${a} va ${b}`,
          `2. ${a} ni ${b} marta o'ziga qo'shish yoki jadval bo'yicha: ${a} × ${b} = ${ans}`
        ],
        simpleExplanation: `${a} sonini ${b} ga ko'paytirganda ko'paytma ${ans} chiqadi.`,
        isAiGenerated: false
      };
    } else {
      const product = a * b;
      const ans = a;
      return {
        id,
        questionNumber: num,
        grade,
        subject,
        topicId,
        topicName,
        difficulty,
        questionText: `Hisoblang: ${product} ÷ ${b} = ?`,
        formula: `${product} \\div ${b}`,
        correctAnswer: String(ans),
        options: generateOptions(ans, 'int'),
        stepByStepSolution: [
          `1. Bo'linuvchi: ${product}, bo'luvchi: ${b}`,
          `2. ${b} × ? = ${product} tenglamasini tekshiramiz`,
          `3. ? = ${ans}`
        ],
        simpleExplanation: `${product} ni ${b} ga bo'lganda bo'linma ${ans} ga teng.`,
        isAiGenerated: false
      };
    }
  }

  // 3. Natural sonlar
  if (topicId === 'mat_natural_numbers') {
    const a = randInt(5, 50);
    const b = randInt(2, 10);
    const c = randInt(1, 20);
    const ans = a + b * c;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Amallarni to'g'ri tartibda bajaring: ${a} + ${b} × ${c} = ?`,
      formula: `${a} + ${b} \\times ${c}`,
      correctAnswer: String(ans),
      options: generateOptions(ans, 'int'),
      stepByStepSolution: [
        `1. Arifmetik amallar tartibiga ko'ra avval ko'paytirish bajariladi: ${b} × ${c} = ${b * c}`,
        `2. Keyin qo'shish amali bajariladi: ${a} + ${b * c} = ${ans}`
      ],
      simpleExplanation: `Amallar ketma-ketligida ko'paytirish birinchi bajariladi, so'ngra qo'shiladi: natija ${ans}.`,
      isAiGenerated: false
    };
  }

  // 4. Kasrlar
  if (topicId === 'mat_fractions') {
    const denom = randInt(3, 12);
    const num1 = randInt(1, denom - 2);
    const num2 = randInt(1, denom - num1);
    const sum = num1 + num2;
    const ans = `${sum}/${denom}`;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Maxrajlari bir xil kasrlarni qo'shing: ${num1}/${denom} + ${num2}/${denom} = ?`,
      formula: `\\frac{${num1}}{${denom}} + \\frac{${num2}}{${denom}}`,
      correctAnswer: ans,
      options: shuffle([ans, `${sum + 1}/${denom}`, `${sum}/${denom + 2}`, `${Math.max(1, sum - 1)}/${denom}`]),
      stepByStepSolution: [
        `1. Maxrajlar teng (${denom}), shuning uchun maxraj o'zgarishsiz qoladi.`,
        `2. Suratlarni qo'shamiz: ${num1} + ${num2} = ${sum}`,
        `3. Natijaviy kasr: ${ans}`
      ],
      simpleExplanation: `Maxrajlari bir xil kasrlar qo'shilganda faqat suratlar qo'shiladi va umumiy maxraj yoziladi.`,
      isAiGenerated: false
    };
  }

  // 5. O‘nli kasrlar
  if (topicId === 'mat_decimals') {
    const a = randInt(10, 80) / 10;
    const b = randInt(10, 50) / 10;
    const ans = Number((a + b).toFixed(1));
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `O'nli kasrlarni hisoblang: ${a} + ${b} = ?`,
      formula: `${a} + ${b}`,
      correctAnswer: String(ans),
      options: generateOptions(ans, 'float'),
      stepByStepSolution: [
        `1. Sonlarni vergul tagiga vergul tushadigan qilib ustun shaklida yozamiz.`,
        `2. ${a} + ${b} = ${ans}`
      ],
      simpleExplanation: `O'nli kasrlar vergullari mos keltirilib qo'shiladi, natija ${ans}.`,
      isAiGenerated: false
    };
  }

  // 6. Foizlar
  if (topicId === 'mat_percentages') {
    const percents = [10, 20, 25, 50];
    const p = percents[randInt(0, percents.length - 1)];
    const total = randInt(2, 20) * 100;
    const ans = (total * p) / 100;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `${total} sonining ${p}% qismini toping.`,
      formula: `${total} \\times \\frac{${p}}{100}`,
      correctAnswer: String(ans),
      options: generateOptions(ans, 'int'),
      stepByStepSolution: [
        `1. 1% ni topish uchun sonni 100 ga bo'lamiz: ${total} ÷ 100 = ${total / 100}`,
        `2. Berilgan foizga ko'paytiramiz: ${total / 100} × ${p} = ${ans}`
      ],
      simpleExplanation: `${total} ning ${p}% ini topish uchun ${total} × ${p} / 100 = ${ans} bo'ladi.`,
      isAiGenerated: false
    };
  }

  // 7. O‘lchov birliklari
  if (topicId === 'mat_units') {
    const meters = randInt(2, 15);
    const ans = meters * 100;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `${meters} metr necha santimetrga (sm) teng?`,
      correctAnswer: `${ans} sm`,
      options: shuffle([`${ans} sm`, `${meters * 10} sm`, `${ans + 50} sm`, `${meters * 1000} sm`]),
      stepByStepSolution: [
        `1. Ma'lumki, 1 metr = 100 santimetr.`,
        `2. Demak, ${meters} metr = ${meters} × 100 = ${ans} santimetr.`
      ],
      simpleExplanation: `1 m = 100 sm bo'lgani sababli, ${meters} m = ${ans} sm bo'ladi.`,
      isAiGenerated: false
    };
  }

  // 8. Perimetr va yuza
  if (topicId === 'mat_perimeter_area') {
    const isArea = Math.random() > 0.5;
    const a = randInt(3, 15);
    const b = randInt(2, 10);
    if (isArea) {
      const ans = a * b;
      return {
        id,
        questionNumber: num,
        grade,
        subject,
        topicId,
        topicName,
        difficulty,
        questionText: `Bo'yi ${a} sm, eni ${b} sm bo'lgan to'g'ri to'rtburchakning yuzini toping.`,
        formula: `S = a \\times b = ${a} \\times ${b}`,
        correctAnswer: `${ans} sm²`,
        options: shuffle([`${ans} sm²`, `${2 * (a + b)} sm²`, `${ans + 6} sm²`, `${ans - 4} sm²`]),
        stepByStepSolution: [
          `1. To'g'ri to'rtburchak yuzi formulasi: S = a × b`,
          `2. S = ${a} × ${b} = ${ans} sm²`
        ],
        simpleExplanation: `To'g'ri to'rtburchak yuzasi uning bo'yi va enining ko'paytmasiga teng.`,
        isAiGenerated: false
      };
    } else {
      const ans = 2 * (a + b);
      return {
        id,
        questionNumber: num,
        grade,
        subject,
        topicId,
        topicName,
        difficulty,
        questionText: `Bo'yi ${a} sm, eni ${b} sm bo'lgan to'g'ri to'rtburchakning perimetrini toping.`,
        formula: `P = 2 \\times (a + b) = 2 \\times (${a} + ${b})`,
        correctAnswer: `${ans} sm`,
        options: shuffle([`${ans} sm`, `${a * b} sm`, `${ans + 4} sm`, `${ans - 2} sm`]),
        stepByStepSolution: [
          `1. To'g'ri to'rtburchak perimetri formulasi: P = 2 × (a + b)`,
          `2. a + b = ${a} + ${b} = ${a + b}`,
          `3. P = 2 × ${a + b} = ${ans} sm`
        ],
        simpleExplanation: `Barcha tomonlar yig'indisi perimetrni beradi: 2 × (${a} + ${b}) = ${ans} sm.`,
        isAiGenerated: false
      };
    }
  }

  // 9. Matnli masalalar
  if (topicId === 'mat_word_problems') {
    const apples = randInt(12, 40);
    const eaten = randInt(3, 10);
    const added = randInt(5, 15);
    const ans = apples - eaten + added;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Savatda ${apples} ta olma bor edi. Undan ${eaten} tasi yeyildi va yana ${added} ta yangi olma solindi. Hozir savatda nechta olma bor?`,
      correctAnswer: String(ans),
      options: generateOptions(ans, 'int'),
      stepByStepSolution: [
        `1. Dastlabki olmalar soni: ${apples}`,
        `2. Yeyilgandan so'ng qoldi: ${apples} - ${eaten} = ${apples - eaten}`,
        `3. Yangi olmalar qo'shilgach: ${apples - eaten} + ${added} = ${ans}`
      ],
      simpleExplanation: `Masala sharti bo'yicha: ${apples} - ${eaten} + ${added} = ${ans} ta olma qoldi.`,
      isAiGenerated: false
    };
  }

  // 10. Geometriya
  if (topicId === 'mat_geometry') {
    const angleA = randInt(30, 80);
    const angleB = randInt(30, 180 - angleA - 20);
    const ans = 180 - (angleA + angleB);
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Uchburchakning ikki burchagi ${angleA}° va ${angleB}° ga teng. Uning uchinchi burchagini toping.`,
      formula: `180^\\circ - (${angleA}^\\circ + ${angleB}^\\circ)`,
      correctAnswer: `${ans}°`,
      options: shuffle([`${ans}°`, `${ans + 10}°`, `${ans - 15}°`, `${180 - ans}°`]),
      stepByStepSolution: [
        `1. Uchburchak ichki burchaklari yig'indisi doimo 180° ga teng.`,
        `2. Ikki burchak yig'indisi: ${angleA}° + ${angleB}° = ${angleA + angleB}°`,
        `3. Uchinchi burchak: 180° - ${angleA + angleB}° = ${ans}°`
      ],
      simpleExplanation: `Uchburchak burchaklari yig'indisi 180° bo'lgani sababli uchinchi burchak ${ans}° ga teng.`,
      isAiGenerated: false
    };
  }

  // 11. Koordinatalar
  if (topicId === 'mat_coordinates') {
    const x = randInt(-5, 5);
    const y = randInt(-5, 5);
    const quad = x > 0 && y > 0 ? 'I chorak' : x < 0 && y > 0 ? 'II chorak' : x < 0 && y < 0 ? 'III chorak' : x > 0 && y < 0 ? 'IV chorak' : 'O\'qda joylashgan';
    const cleanX = x === 0 ? 3 : x;
    const cleanY = y === 0 ? -4 : y;
    const cleanQuad = cleanX > 0 && cleanY > 0 ? 'I chorak' : cleanX < 0 && cleanY > 0 ? 'II chorak' : cleanX < 0 && cleanY < 0 ? 'III chorak' : 'IV chorak';
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `A(${cleanX}; ${cleanY}) nuqta koordinatalar tekisligining qaysi choragida joylashgan?`,
      correctAnswer: cleanQuad,
      options: shuffle(['I chorak', 'II chorak', 'III chorak', 'IV chorak']),
      stepByStepSolution: [
        `1. Nuqta absissasi x = ${cleanX} (${cleanX > 0 ? 'musbat' : 'manfiy'})`,
        `2. Nuqta ordinatasi y = ${cleanY} (${cleanY > 0 ? 'musbat' : 'manfiy'})`,
        `3. x ${cleanX > 0 ? '>' : '<'} 0 va y ${cleanY > 0 ? '>' : '<'} 0 bo'lgan soha: ${cleanQuad}`
      ],
      simpleExplanation: `Koordinatalar ishoralariga ko'ra nuqta ${cleanQuad}da yotadi.`,
      isAiGenerated: false
    };
  }

  // 12. ALGEBRA: Manfiy sonlar
  if (topicId === 'alg_negative_numbers') {
    const a = randInt(-25, -2);
    const b = randInt(-15, 15);
    const ans = a + b;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Hisoblang: (${a}) + (${b}) = ?`,
      formula: `(${a}) + (${b})`,
      correctAnswer: String(ans),
      options: generateOptions(ans, 'int'),
      stepByStepSolution: [
        `1. Birinchi son: ${a}`,
        `2. Ikkinchi son: ${b}`,
        `3. (${a}) + (${b}) = ${ans}`
      ],
      simpleExplanation: `Manfiy va musbat sonlarni qo'shish qoidasiga ko'ra natija ${ans}.`,
      isAiGenerated: false
    };
  }

  // 13. ALGEBRA: Bir noma'lumli tenglamalar
  if (topicId === 'alg_linear_equations') {
    const k = randInt(2, 7);
    const root = randInt(-8, 12);
    const b = randInt(3, 20);
    const c = k * root + b;
    const ans = root;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Tenglamani yeching: ${k}x + ${b} = ${c}`,
      formula: `${k}x + ${b} = ${c}`,
      correctAnswer: `x = ${ans}`,
      options: shuffle([`x = ${ans}`, `x = ${ans + 2}`, `x = ${ans - 3}`, `x = ${-ans}`]),
      stepByStepSolution: [
        `1. Ozod son ${b} ni o'ng tomonga qarama-qarshi ishora bilan o'tkazamiz: ${k}x = ${c} - ${b}`,
        `2. ${k}x = ${c - b}`,
        `3. Ikkala tomonni ${k} ga bo'lamiz: x = ${c - b} ÷ ${k} = ${ans}`
      ],
      simpleExplanation: `Chiziqli tenglamadan x = ${ans} kelib chiqadi.`,
      isAiGenerated: false
    };
  }

  // 14. ALGEBRA: Algebraik ifodalar
  if (topicId === 'alg_expressions') {
    const a = randInt(2, 6);
    const b = randInt(2, 6);
    const c = randInt(1, 8);
    const ansCoeff = a + b;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Ifodani soddalashtiring: ${a}a + ${c} + ${b}a = ?`,
      formula: `${a}a + ${c} + ${b}a`,
      correctAnswer: `${ansCoeff}a + ${c}`,
      options: shuffle([
        `${ansCoeff}a + ${c}`,
        `${ansCoeff + 2}a + ${c}`,
        `${ansCoeff}a + ${c + 3}`,
        `${a * b}a + ${c}`
      ]),
      stepByStepSolution: [
        `1. O'xshash hadlarni guruhlaymiz: (${a}a + ${b}a) + ${c}`,
        `2. Koeffitsiyentlarni qo'shamiz: (${a} + ${b})a = ${ansCoeff}a`,
        `3. Yakuniy ifoda: ${ansCoeff}a + ${c}`
      ],
      simpleExplanation: `O'xshash hadlar biriktirilib, ${ansCoeff}a + ${c} hosil bo'ladi.`,
      isAiGenerated: false
    };
  }

  // 15. ALGEBRA: Darajalar
  if (topicId === 'alg_powers') {
    const base = randInt(2, 5);
    const p1 = randInt(2, 4);
    const p2 = randInt(1, 3);
    const ansP = p1 + p2;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Darajalarni ko'paytiring: ${base}^${p1} × ${base}^${p2} = ?`,
      formula: `${base}^{${p1}} \\times ${base}^{${p2}}`,
      correctAnswer: `${base}^${ansP}`,
      options: shuffle([`${base}^${ansP}`, `${base}^${p1 * p2}`, `${base}^${ansP + 1}`, `${base * 2}^${ansP}`]),
      stepByStepSolution: [
        `1. Asoslari bir xil darajalar ko'paytirilganda daraja ko'rsatkichlari qo'shiladi: a^m × a^n = a^(m+n)`,
        `2. ${p1} + ${p2} = ${ansP}`,
        `3. Natija: ${base}^${ansP}`
      ],
      simpleExplanation: `Bir xil asosli darajalarni ko'paytirish qoidasiga binoan ko'rsatkichlar qo'shiladi: ${base}^${ansP}.`,
      isAiGenerated: false
    };
  }

  // 16. ALGEBRA: Ko‘phadlar
  if (topicId === 'alg_polynomials') {
    const a = randInt(2, 8);
    const a2 = a * a;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Qisqa ko'paytirish formulasini qo'llang: (x - ${a})(x + ${a}) = ?`,
      formula: `(x - ${a})(x + ${a})`,
      correctAnswer: `x² - ${a2}`,
      options: shuffle([`x² - ${a2}`, `x² + ${a2}`, `x² - ${2 * a}x + ${a2}`, `x² - ${a}`]),
      stepByStepSolution: [
        `1. Kvadratlar ayirmasi formulasi: (a - b)(a + b) = a² - b²`,
        `2. Bu yerda a = x, b = ${a}`,
        `3. x² - ${a}² = x² - ${a2}`
      ],
      simpleExplanation: `Kvadratlar ayirmasi formulasi bo'yicha: x² - ${a2}.`,
      isAiGenerated: false
    };
  }

  // 17. ALGEBRA: Kvadrat tenglamalar
  if (topicId === 'alg_quadratic_equations') {
    const r1 = randInt(1, 5);
    const r2 = randInt(1, 6);
    const b = -(r1 + r2);
    const c = r1 * r2;
    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Kvadrat tenglama ildizlarini toping: x² ${bSign}x + ${c} = 0`,
      formula: `x^2 ${bSign}x + ${c} = 0`,
      correctAnswer: `x₁ = ${r1}, x₂ = ${r2}`,
      options: shuffle([
        `x₁ = ${r1}, x₂ = ${r2}`,
        `x₁ = ${-r1}, x₂ = ${r2}`,
        `x₁ = ${r1 + 1}, x₂ = ${r2 - 1}`,
        `x₁ = ${-r1}, x₂ = ${-r2}`
      ]),
      stepByStepSolution: [
        `1. Diskriminant: D = b² - 4ac = (${b})² - 4 × 1 × ${c} = ${b * b - 4 * c}`,
        `2. Ildizlar: x = (-b ± √D) / 2`,
        `3. x₁ = ${r1}, x₂ = ${r2}`
      ],
      simpleExplanation: `Viyet teoremasi yoki diskriminant orqali yechimlar: x₁ = ${r1}, x₂ = ${r2}.`,
      isAiGenerated: false
    };
  }

  // 18. ALGEBRA: Tengsizliklar
  if (topicId === 'alg_inequalities') {
    const a = randInt(2, 5);
    const limit = randInt(6, 25);
    const boundary = Math.floor(limit / a);
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Tengsizlikni yeching: ${a}x < ${a * boundary}`,
      formula: `${a}x < ${a * boundary}`,
      correctAnswer: `x < ${boundary}`,
      options: shuffle([`x < ${boundary}`, `x > ${boundary}`, `x ≤ ${boundary}`, `x < ${boundary + 2}`]),
      stepByStepSolution: [
        `1. Tengsizlikning ikkala tomonini musbat ${a} soniga bo'lamiz (ishora o'zgarmaydi).`,
        `2. x < ${a * boundary} ÷ ${a}`,
        `3. x < ${boundary}`
      ],
      simpleExplanation: `Ikkala tomon musbat songa bo'linganda tengsizlik ishorasi saqlanadi: x < ${boundary}.`,
      isAiGenerated: false
    };
  }

  // 19. ALGEBRA: Tenglamalar sistemasi
  if (topicId === 'alg_systems') {
    const x = randInt(1, 6);
    const y = randInt(1, 6);
    const sum = x + y;
    const diff = x - y;
    return {
      id,
      questionNumber: num,
      grade,
      subject,
      topicId,
      topicName,
      difficulty,
      questionText: `Tenglamalar sistemasini yeching:\n{ x + y = ${sum}\n{ x - y = ${diff}`,
      formula: `\\begin{cases} x + y = ${sum} \\\\ x - y = ${diff} \\end{cases}`,
      correctAnswer: `x = ${x}, y = ${y}`,
      options: shuffle([
        `x = ${x}, y = ${y}`,
        `x = ${x + 1}, y = ${y - 1}`,
        `x = ${y}, y = ${x}`,
        `x = ${x + 2}, y = ${y}`
      ]),
      stepByStepSolution: [
        `1. Ikkala tenglamani hadma-had qo'shamiz: (x + y) + (x - y) = ${sum} + ${diff}`,
        `2. 2x = ${sum + diff} => x = ${x}`,
        `3. x ni birinchi tenglamaga qo'yamiz: ${x} + y = ${sum} => y = ${y}`
      ],
      simpleExplanation: `Qo'shish usuli orqali: x = ${x}, y = ${y}.`,
      isAiGenerated: false
    };
  }

  // Default fallback for linear functions or other topics
  const a = randInt(2, 6);
  const b = randInt(1, 8);
  const ans = a * 2 + b;
  return {
    id,
    questionNumber: num,
    grade,
    subject,
    topicId,
    topicName,
    difficulty,
    questionText: `y = ${a}x + ${b} funksiya berilgan. x = 2 bo'lganda y ning qiymatini toping.`,
    formula: `y = ${a}x + ${b}`,
    correctAnswer: String(ans),
    options: generateOptions(ans, 'int'),
    stepByStepSolution: [
      `1. Berilgan x = 2 qiymatni funksiyaga qo'yamiz: y = ${a} × 2 + ${b}`,
      `2. y = ${a * 2} + ${b} = ${ans}`
    ],
    simpleExplanation: `x o'rniga 2 qo'yilib hisoblanganda y = ${ans} bo'ladi.`,
    isAiGenerated: false
  };
}
