import { GradeLevel, SubjectId, TopicInfo } from './types.ts';

export const ALL_TOPICS: TopicInfo[] = [
  // MATEMATIKA
  {
    id: 'mat_add_sub',
    subject: 'matematika',
    name: 'Qo‘shish va ayirish',
    minGrade: 1,
    maxGrade: 4,
    description: 'Boshlang\'ich sinflar uchun qo\'shish va ayirish amallari'
  },
  {
    id: 'mat_mul_div',
    subject: 'matematika',
    name: 'Ko‘paytirish va bo‘lish',
    minGrade: 2,
    maxGrade: 6,
    description: 'Ko\'paytirish jadvali va bo\'lish amallari'
  },
  {
    id: 'mat_natural_numbers',
    subject: 'matematika',
    name: 'Natural sonlar',
    minGrade: 1,
    maxGrade: 6,
    description: 'Natural sonlar ustida to\'rtta amal, tartib va taqqoslash'
  },
  {
    id: 'mat_fractions',
    subject: 'matematika',
    name: 'Kasrlar',
    minGrade: 4,
    maxGrade: 7,
    description: 'Oddiy kasrlar, umumiy maxraj, qo\'shish va ayirish'
  },
  {
    id: 'mat_decimals',
    subject: 'matematika',
    name: 'O‘nli kasrlar',
    minGrade: 5,
    maxGrade: 8,
    description: 'O\'nli kasrlar ustida arifmetik amallar'
  },
  {
    id: 'mat_percentages',
    subject: 'matematika',
    name: 'Foizlar',
    minGrade: 5,
    maxGrade: 9,
    description: 'Sonning foizini topish, foiz hisob-kitoblari'
  },
  {
    id: 'mat_units',
    subject: 'matematika',
    name: 'O‘lchov birliklari',
    minGrade: 2,
    maxGrade: 7,
    description: 'Uzunlik, og\'irlik, vaqt va hajm o\'lchov birliklari'
  },
  {
    id: 'mat_perimeter_area',
    subject: 'matematika',
    name: 'Perimetr va yuza',
    minGrade: 3,
    maxGrade: 9,
    description: 'To\'g\'ri to\'rtburchak, kvadrat va uchburchak perimetri va yuzasi'
  },
  {
    id: 'mat_word_problems',
    subject: 'matematika',
    name: 'Matnli masalalar',
    minGrade: 1,
    maxGrade: 11,
    description: 'Hayotiy va mantiqiy matnli amaliy masalalar'
  },
  {
    id: 'mat_geometry',
    subject: 'matematika',
    name: 'Geometriya',
    minGrade: 4,
    maxGrade: 11,
    description: 'Burchaklar, shakllar xossalari, Pifagor teoremasi'
  },
  {
    id: 'mat_coordinates',
    subject: 'matematika',
    name: 'Koordinatalar',
    minGrade: 6,
    maxGrade: 11,
    description: 'Dekart koordinatalar tekisligi, nuqta koordinatalari'
  },

  // ALGEBRA
  {
    id: 'alg_negative_numbers',
    subject: 'algebra',
    name: 'Manfiy sonlar',
    minGrade: 6,
    maxGrade: 8,
    description: 'Musbat va manfiy sonlar ustida amallar, modul'
  },
  {
    id: 'alg_linear_equations',
    subject: 'algebra',
    name: 'Bir noma\'lumli tenglamalar',
    minGrade: 6,
    maxGrade: 9,
    description: 'Chiziqli bir noma\'lumli tenglamalarni yechish'
  },
  {
    id: 'alg_expressions',
    subject: 'algebra',
    name: 'Algebraik ifodalar',
    minGrade: 7,
    maxGrade: 11,
    description: 'Ifodalarni soddalashtirish, o\'xshash hadlarni ixchamlash'
  },
  {
    id: 'alg_powers',
    subject: 'algebra',
    name: 'Darajalar',
    minGrade: 7,
    maxGrade: 11,
    description: 'Natural va butun ko\'rsatkichli darajalar xossalari'
  },
  {
    id: 'alg_polynomials',
    subject: 'algebra',
    name: 'Ko‘phadlar',
    minGrade: 7,
    maxGrade: 10,
    description: 'Ko\'phadlarni ko\'paytuvchilarga ajratish va qisqa ko\'paytirish formulalari'
  },
  {
    id: 'alg_linear_functions',
    subject: 'algebra',
    name: 'Chiziqli funksiyalar',
    minGrade: 7,
    maxGrade: 10,
    description: 'y = kx + b ko\'rinishidagi funksiyalar va ularning xossalari'
  },
  {
    id: 'alg_inequalities',
    subject: 'algebra',
    name: 'Tengsizliklar',
    minGrade: 7,
    maxGrade: 11,
    description: 'Chiziqli va oraliqlar usulidagi tengsizliklar'
  },
  {
    id: 'alg_systems',
    subject: 'algebra',
    name: 'Tenglamalar sistemasi',
    minGrade: 7,
    maxGrade: 11,
    description: 'Ikki noma\'lumli chiziqli tenglamalar sistemalari'
  },
  {
    id: 'alg_quadratic_equations',
    subject: 'algebra',
    name: 'Kvadrat tenglamalar',
    minGrade: 8,
    maxGrade: 11,
    description: 'Diskriminant va Viyet teoremasi orqali kvadrat tenglamalar'
  },
  {
    id: 'alg_function_graphs',
    subject: 'algebra',
    name: 'Funksiyalar grafigi',
    minGrade: 8,
    maxGrade: 11,
    description: 'Parabola, giperbola va boshqa funksiyalar grafiklari'
  }
];

export function getTopicsFor(grade: GradeLevel, subject: SubjectId): TopicInfo[] {
  return ALL_TOPICS.filter(
    (t) => t.subject === subject && grade >= t.minGrade && grade <= t.maxGrade
  );
}
