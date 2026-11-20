import type { AHPWeightCriteria, AHPEvaluationData } from '../types';

/**
 * AHP (Analytic Hierarchy Process) Calculator Utility
 * ابزار محاسبات فرایند تحلیل سلسله‌مراتبی (روش ساعتی - Thomas L. Saaty)
 * کاربرد در مدیریت انرژی ISO 50001: اولویت‌بندی SEUها و غربالگری چندمعیاره فرصت‌ها و پروژه‌ها
 */

/**
 * اوزان پیش‌فرض استانداردهای ISO 50001 برای اولویت‌بندی فرصت‌های بهبود
 */
export const DEFAULT_AHP_WEIGHTS: AHPWeightCriteria = {
  energySavingWeight: 0.35,
  economicWeight: 0.25,
  feasibilityRiskWeight: 0.15,
  hseImpactWeight: 0.15,
  supplyChainWeight: 0.10,
};

/**
 * محاسبه نمره و رتبه AHP برای فرصت‌های بهبود بر مبنای معیارهای ۵‌گانه
 */
export function calculateAHPScore(
  scores: {
    energySavingScore: number;
    economicScore: number;
    feasibilityRiskScore: number;
    hseImpactScore: number;
    supplyChainScore: number;
  },
  weights: AHPWeightCriteria = DEFAULT_AHP_WEIGHTS
): AHPEvaluationData {
  const totalWeight =
    (weights.energySavingWeight || 0) +
    (weights.economicWeight || 0) +
    (weights.feasibilityRiskWeight || 0) +
    (weights.hseImpactWeight || 0) +
    (weights.supplyChainWeight || 0) || 1;

  const rawScore =
    scores.energySavingScore * (weights.energySavingWeight || 0) +
    scores.economicScore * (weights.economicWeight || 0) +
    scores.feasibilityRiskScore * (weights.feasibilityRiskWeight || 0) +
    scores.hseImpactScore * (weights.hseImpactWeight || 0) +
    scores.supplyChainScore * (weights.supplyChainWeight || 0);

  // تبدیل به مقیاس ۰ تا ۱۰۰ (با توجه به اینکه نمرات ورودی ۱ تا ۵ هستند)
  const finalScore = Number(((rawScore / (totalWeight * 5)) * 100).toFixed(1));

  let priorityRank: 'اولویت الف (اقدام فوری)' | 'اولویت ب (کوتاه‌مدت)' | 'اولویت ج (مشروط/بلندمدت)' =
    'اولویت ج (مشروط/بلندمدت)';

  if (finalScore >= 75) {
    priorityRank = 'اولویت الف (اقدام فوری)';
  } else if (finalScore >= 55) {
    priorityRank = 'اولویت ب (کوتاه‌مدت)';
  }

  return {
    energySavingScore: scores.energySavingScore,
    economicScore: scores.economicScore,
    feasibilityRiskScore: scores.feasibilityRiskScore,
    hseImpactScore: scores.hseImpactScore,
    supplyChainScore: scores.supplyChainScore,
    finalScore,
    priorityRank,
  };
}

/**
 * مقیاس استاندارد ۹ تایی ساعتی برای مقایسات زوجی
 */
export const SAATY_SCALE = {
  EQUAL: 1, // اهمیت یکسان
  MODERATE: 3, // اهمیت کمی بیشتر
  STRONG: 5, // اهمیت بیشتر / قوی
  VERY_STRONG: 7, // اهمیت خیلی بیشتر / بسیار قوی
  EXTREME: 9, // اهمیت بی‌نهایت بیشتر / مطلق
  // مقادیر واسطه‌ای: ۲، ۴، ۶، ۸
  INTERMEDIATE_2: 2,
  INTERMEDIATE_4: 4,
  INTERMEDIATE_6: 6,
  INTERMEDIATE_8: 8,
} as const;

/**
 * توضیحات مقیاس ساعتی به زبان فارسی
 */
export const SAATY_SCALE_DESCRIPTIONS: Record<number, string> = {
  1: 'اهمیت یکسان (Equal Importance)',
  2: 'کمی متمایل به اهمیت بیشتر (Weak or slight)',
  3: 'اهمیت متوسط / معتدل (Moderate importance)',
  4: 'اهمیت متوسط رو به قوی (Moderate plus)',
  5: 'اهمیت قوی / اساسی (Strong importance)',
  6: 'اهمیت قوی رو به خیلی قوی (Strong plus)',
  7: 'اهمیت بسیار قوی / محرز (Very strong)',
  8: 'اهمیت بسیار قوی رو به مطلق (Very, very strong)',
  9: 'اهمیت فوق‌العاده / مطلق (Extreme importance)',
};

/**
 * شاخص تصادفی بودن (Random Index - RI) بر اساس اندازه ماتریس (ساعتی)
 * n = 1 .. 15
 */
export const SAATY_RANDOM_INDEX: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
  11: 1.51,
  12: 1.54,
  13: 1.56,
  14: 1.57,
  15: 1.59,
};

export interface AhpConsistencyResult {
  matrixSize: number;
  weights: number[]; // بردار وزن‌های نرمال‌شده (جمع = ۱)
  lambdaMax: number; // بزرگترین مقدار ویژه (Principal Eigenvalue)
  consistencyIndex: number; // شاخص سازگاری (CI)
  randomConsistencyIndex: number; // شاخص تصادفی سازگاری (RI)
  consistencyRatio: number; // نسبت سازگاری (CR)
  isConsistent: boolean; // آیا CR <= 0.10 است؟
  statusMessage: string; // پیام وضعیت سازگاری به فارسی
}

export interface AhpCriterion {
  id: string;
  name: string;
  code?: string;
  description?: string;
  weight?: number;
}

export interface AhpAlternative {
  id: string;
  name: string;
  code?: string;
  department?: string;
  scores?: Record<string, number>; // امتیاز به ازای هر معیار (قبل از سنتز)
  finalScore?: number; // امتیاز نهایی ترکیب‌شده
  rank?: number; // رتبه نهایی
}

export interface AhpRankingResult {
  criteria: {
    id: string;
    name: string;
    weight: number;
  }[];
  alternatives: {
    id: string;
    name: string;
    compositeScore: number;
    percentage: number;
    rank: number;
  }[];
  consistency: AhpConsistencyResult;
}

/**
 * ایجاد یک ماتریس مقایسه زوجی با قطر ۱ و مقادیر متقابل پیش‌فرض ۱
 * @param size بعد ماتریس
 */
export function createEmptyComparisonMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(i === j ? 1 : 1);
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * به‌روزرسانی مقدار مقایسه زوجی عنصر (i, j) و تنظیم خودکار عنصر متقابل (j, i)
 * @param matrix ماتریس فعلی
 * @param row اندیس سطر (۰-ایندکس)
 * @param col اندیس ستون (۰-ایندکس)
 * @param value مقدار جدید مقایسه
 */
export function setPairwiseComparison(
  matrix: number[][],
  row: number,
  col: number,
  value: number
): number[][] {
  if (value <= 0) {
    throw new Error('مقدار مقایسه زوجی باید مثبت باشد');
  }

  const newMatrix = matrix.map((r) => [...r]);

  if (row === col) {
    newMatrix[row][col] = 1;
  } else {
    newMatrix[row][col] = value;
    newMatrix[col][row] = 1 / value;
  }

  return newMatrix;
}

/**
 * اعتبارسنجی ماتریس مقایسات زوجی (متقابل بودن و مثبت بودن)
 */
export function validateComparisonMatrix(matrix: number[][]): {
  isValid: boolean;
  error?: string;
} {
  const n = matrix.length;
  if (n === 0) {
    return { isValid: false, error: 'ماتریس خالی است' };
  }

  for (let i = 0; i < n; i++) {
    if (matrix[i].length !== n) {
      return { isValid: false, error: 'ماتریس باید مربعی باشد' };
    }
    if (Math.abs(matrix[i][i] - 1) > 1e-4) {
      return { isValid: false, error: `عناصر روی قطر اصلی باید ۱ باشند (عنصر [${i},${i}])` };
    }
    for (let j = 0; j < n; j++) {
      const val = matrix[i][j];
      if (val <= 0 || isNaN(val) || !isFinite(val)) {
        return { isValid: false, error: `مقدار نامعتبر در موقعیت [${i},${j}]` };
      }
      const recip = matrix[j][i];
      if (Math.abs(val * recip - 1) > 0.08) {
        return {
          isValid: false,
          error: `خاصیت تقابل ماتریس نقض شده است: M[${i},${j}]=${val} با M[${j},${i}]=${recip} معکوس نیستند`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * محاسبه بردار وزن‌ها به روش میانگین هندسی (Geometric Mean Method / Root Product)
 * روش مرسوم، دقیق و متقارن در تحلیل تصمیم‌گیری چندمعیاره AHP
 */
export function calculateGeometricMeanWeights(matrix: number[][]): number[] {
  const n = matrix.length;
  if (n === 0) return [];
  if (n === 1) return [1];

  // محاسبه ریشه n-ام حاصل‌ضرب سطرها
  const rowProducts: number[] = [];
  let sumOfProducts = 0;

  for (let i = 0; i < n; i++) {
    let product = 1;
    for (let j = 0; j < n; j++) {
      product *= matrix[i][j];
    }
    const nthRoot = Math.pow(product, 1 / n);
    rowProducts.push(nthRoot);
    sumOfProducts += nthRoot;
  }

  // نرمال‌سازی بردار وزن‌ها (مجموع وزن‌ها = ۱)
  return rowProducts.map((p) => (sumOfProducts > 0 ? p / sumOfProducts : 1 / n));
}

/**
 * محاسبه بردار وزن‌ها به روش میانگین حسابی ستون‌های نرمال‌شده (Normalized Column Average)
 */
export function calculateArithmeticMeanWeights(matrix: number[][]): number[] {
  const n = matrix.length;
  if (n === 0) return [];
  if (n === 1) return [1];

  // محاسبه مجموع هر ستون
  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  // نرمال‌سازی ماتریس و محاسبه میانگین سطرها
  const weights = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += matrix[i][j] / (colSums[j] || 1);
    }
    weights[i] = rowSum / n;
  }

  return weights;
}

/**
 * محاسبه سازگاری کامل و نسبت سازگاری (Consistency Ratio - CR) طبق روش پروفسور توماس ساعتی
 * @param matrix ماتریس مقایسات زوجی n x n
 * @param method روش محاسبه وزن ('geometric' یا 'arithmetic')
 */
export function calculateAhpConsistency(
  matrix: number[][],
  method: 'geometric' | 'arithmetic' = 'geometric'
): AhpConsistencyResult {
  const n = matrix.length;

  if (n <= 2) {
    const weights = n === 1 ? [1] : [0.5, 0.5];
    return {
      matrixSize: n,
      weights,
      lambdaMax: n,
      consistencyIndex: 0,
      randomConsistencyIndex: 0,
      consistencyRatio: 0,
      isConsistent: true,
      statusMessage: 'سازگاری کامل (ماتریس با خطای صفر)',
    };
  }

  // ۱. محاسبه وزن‌های نرمال‌شده
  const weights =
    method === 'geometric'
      ? calculateGeometricMeanWeights(matrix)
      : calculateArithmeticMeanWeights(matrix);

  // ۲. محاسبه بردار حاصل‌ضرب ماتریس در بردار وزن (A * w)
  const aw = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      aw[i] += matrix[i][j] * weights[j];
    }
  }

  // ۳. محاسبه بردار نسبت (Aw)_i / w_i و میانگین آن (Lambda Max)
  let lambdaSum = 0;
  for (let i = 0; i < n; i++) {
    if (weights[i] > 0) {
      lambdaSum += aw[i] / weights[i];
    } else {
      lambdaSum += n;
    }
  }
  const lambdaMax = lambdaSum / n;

  // ۴. محاسبه شاخص سازگاری CI = (lambdaMax - n) / (n - 1)
  const consistencyIndex = Math.max(0, (lambdaMax - n) / (n - 1));

  // ۵. استخراج شاخص تصادفی RI
  const randomConsistencyIndex = SAATY_RANDOM_INDEX[n] || 1.59;

  // ۶. محاسبه نسبت سازگاری CR = CI / RI
  const consistencyRatio =
    randomConsistencyIndex > 0 ? consistencyIndex / randomConsistencyIndex : 0;

  // قاعده ساعتی: اگر CR <= 0.10 باشد، سازگاری ماتریس پذیرفته است.
  const isConsistent = consistencyRatio <= 0.105;

  let statusMessage = '';
  if (consistencyRatio < 0.05) {
    statusMessage = 'سازگاری عالی (خطای قضاوتی کمتر از ۵٪)';
  } else if (consistencyRatio <= 0.105) {
    statusMessage = 'سازگاری قابل‌قبول بر اساس استاندارد ساعتی (CR ≤ 0.10)';
  } else {
    statusMessage = 'ناسازگاری بالا (CR > 0.10)؛ نیازمند بازنگری مقایسات زوجی';
  }

  return {
    matrixSize: n,
    weights: weights.map((w) => Number(w.toFixed(4))),
    lambdaMax: Number(lambdaMax.toFixed(4)),
    consistencyIndex: Number(consistencyIndex.toFixed(4)),
    randomConsistencyIndex,
    consistencyRatio: Number(consistencyRatio.toFixed(4)),
    isConsistent,
    statusMessage,
  };
}

/**
 * ترکیب و رتبه‌بندی گزینه‌ها بر اساس ماتریس عملکرد و بردار وزن معیارها (AHP Synthesis)
 */
export function synthesizeAhpRankings(
  criteriaNames: string[],
  criteriaMatrix: number[][],
  alternatives: { id: string; name: string }[],
  performanceMatrix: number[][]
): AhpRankingResult {
  const consistency = calculateAhpConsistency(criteriaMatrix);
  const weights = consistency.weights;

  const altCount = alternatives.length;
  const critCount = criteriaNames.length;

  const colSums = new Array(critCount).fill(0);
  for (let c = 0; c < critCount; c++) {
    for (let a = 0; a < altCount; a++) {
      colSums[c] += performanceMatrix[a]?.[c] || 0;
    }
  }

  const normalizedScores: number[][] = [];
  for (let a = 0; a < altCount; a++) {
    const row: number[] = [];
    for (let c = 0; c < critCount; c++) {
      const sum = colSums[c];
      const val = performanceMatrix[a]?.[c] || 0;
      row.push(sum > 0 ? val / sum : 1 / altCount);
    }
    normalizedScores.push(row);
  }

  const ranked = alternatives.map((alt, idx) => {
    let compositeScore = 0;
    for (let c = 0; c < critCount; c++) {
      compositeScore += normalizedScores[idx][c] * weights[c];
    }
    return {
      id: alt.id,
      name: alt.name,
      compositeScore: Number(compositeScore.toFixed(4)),
      percentage: Number((compositeScore * 100).toFixed(2)),
      rank: 0,
    };
  });

  ranked.sort((a, b) => b.compositeScore - a.compositeScore);

  ranked.forEach((item, index) => {
    item.rank = index + 1;
  });

  return {
    criteria: criteriaNames.map((name, i) => ({
      id: `crit-${i + 1}`,
      name,
      weight: weights[i],
    })),
    alternatives: ranked,
    consistency,
  };
}

/**
 * تابع اتصال مستقیم برای ارزیابی سریع کارت‌های فرصت بهبود بر مبنای امتیازات ۱ تا ۵
 */
export function evaluateOpportunityFromScores(
  scores: {
    energySavingScore: number;
    economicScore: number;
    feasibilityRiskScore: number;
    hseImpactScore: number;
    supplyChainScore: number;
  },
  weights: number[] = [0.35, 0.25, 0.15, 0.15, 0.10]
) {
  const rawScore =
    scores.energySavingScore * weights[0] +
    scores.economicScore * weights[1] +
    scores.feasibilityRiskScore * weights[2] +
    scores.hseImpactScore * weights[3] +
    scores.supplyChainScore * weights[4];

  const finalScore = Number(((rawScore / 5) * 100).toFixed(1));

  let priorityRank: 'اولویت الف (اقدام فوری)' | 'اولویت ب (کوتاه‌مدت)' | 'اولویت ج (مشروط/بلندمدت)' =
    'اولویت ج (مشروط/بلندمدت)';

  if (finalScore >= 75) {
    priorityRank = 'اولویت الف (اقدام فوری)';
  } else if (finalScore >= 55) {
    priorityRank = 'اولویت ب (کوتاه‌مدت)';
  }

  return {
    ...scores,
    finalScore,
    priorityRank,
  };
}

/**
 * الگوهای از پیش‌تعریف‌شده ماتریس مقایسه زوجی معیارهای استاندارد ISO 50001
 */
export const ISO50001_AHP_TEMPLATES = {
  SEU_CRITERIA: [
    'سهم از کل مصرف انرژی (حجم مصرف)',
    'پتانسیل فنی صرفه‌جویی انرژی',
    'قابلیت کنترل عملیاتی پارامترها',
    'حساسیت عملکردی تجهیز در خط تولید',
    'اثرات زیست‌محیطی و نشر CO2',
  ],

  SEU_DEFAULT_MATRIX: [
    [1.0, 2.0, 3.0, 4.0, 5.0],
    [0.5, 1.0, 2.0, 3.0, 4.0],
    [0.333333, 0.5, 1.0, 2.0, 3.0],
    [0.25, 0.333333, 0.5, 1.0, 2.0],
    [0.2, 0.25, 0.333333, 0.5, 1.0],
  ],

  PROJECT_CRITERIA: [
    'میزان صرفه‌جویی انرژی سالانه',
    'دوره بازگشت سرمایه (Payback)',
    'میزان سرمایه‌گذاری اولیه (CAPEX)',
    'سهولت و سرعت پیاده‌سازی',
    'قابلیت اطمینان و اثر بر تولید',
  ],

  PROJECT_DEFAULT_MATRIX: [
    [1.0, 1.0, 3.0, 4.0, 2.0],
    [1.0, 1.0, 3.0, 3.0, 2.0],
    [0.333333, 0.333333, 1.0, 2.0, 0.5],
    [0.25, 0.333333, 0.5, 1.0, 0.333333],
    [0.5, 0.5, 2.0, 3.0, 1.0],
  ],
};