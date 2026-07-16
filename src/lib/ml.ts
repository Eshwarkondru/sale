import type { ModelResult, TrainingResult, Student, PerformanceCategory } from './types';
import { SUBJECTS } from './types';

export const ML_FEATURES = [
  'attendance',
  'math',
  'physics',
  'chemistry',
  'english',
  'computer',
  'previous_gpa',
  'study_hours',
  'assignments_completed',
  'internal_marks',
] as const;

export type FeatureName = (typeof ML_FEATURES)[number];

function featureVector(s: Pick<Student, FeatureName>): number[] {
  return ML_FEATURES.map((f) => Number(s[f] ?? 0));
}

// Standardize features (z-score) for linear regression stability.
function standardize(X: number[][]): { mean: number[]; std: number[]; out: number[][] } {
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const mean = new Array(d).fill(0);
  const std = new Array(d).fill(0);
  for (let j = 0; j < d; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += X[i][j];
    mean[j] = sum / n;
    let varSum = 0;
    for (let i = 0; i < n; i++) varSum += (X[i][j] - mean[j]) ** 2;
    std[j] = Math.sqrt(varSum / n) || 1;
  }
  const out = X.map((row) => row.map((v, j) => (v - mean[j]) / std[j]));
  return { mean, std, out };
}

// ---------- Linear Regression (closed-form via gradient descent) ----------
export interface LinearModel {
  weights: number[];
  bias: number;
  mean: number[];
  std: number[];
}

export function trainLinear(X: number[][], y: number[], epochs = 500, lr = 0.01): LinearModel {
  const { mean, std, out } = standardize(X);
  const n = out.length;
  const d = out[0].length;
  const weights = new Array(d).fill(0);
  let bias = 0;
  for (let e = 0; e < epochs; e++) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      let pred = bias;
      for (let j = 0; j < d; j++) pred += weights[j] * out[i][j];
      const err = pred - y[i];
      for (let j = 0; j < d; j++) gradW[j] += err * out[i][j];
      gradB += err;
    }
    for (let j = 0; j < d; j++) weights[j] -= (lr * gradW[j]) / n;
    bias -= (lr * gradB) / n;
  }
  return { weights, bias, mean, std };
}

export function predictLinear(m: LinearModel, X: number[][]): number[] {
  return X.map((row) => {
    let pred = m.bias;
    for (let j = 0; j < row.length; j++) pred += m.weights[j] * ((row[j] - m.mean[j]) / m.std[j]);
    return pred;
  });
}

// ---------- Decision Tree (regression, CART) ----------
export interface TreeNode {
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number;
}

function meanArr(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
}

function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = meanArr(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
}

function bestSplit(X: number[][], y: number[], features: number[]): { feature: number; threshold: number; gain: number } | null {
  const n = y.length;
  const parentVar = variance(y);
  let best: { feature: number; threshold: number; gain: number } | null = null;
  for (const f of features) {
    const vals = Array.from(new Set(X.map((r) => r[f]))).sort((a, b) => a - b);
    for (let k = 0; k < vals.length - 1; k++) {
      const t = (vals[k] + vals[k + 1]) / 2;
      const leftY: number[] = [];
      const rightY: number[] = [];
      for (let i = 0; i < n; i++) {
        if (X[i][f] <= t) leftY.push(y[i]);
        else rightY.push(y[i]);
      }
      if (leftY.length === 0 || rightY.length === 0) continue;
      const gain =
        parentVar -
        (leftY.length / n) * variance(leftY) -
        (rightY.length / n) * variance(rightY);
      if (!best || gain > best.gain) best = { feature: f, threshold: t, gain };
    }
  }
  return best;
}

export function trainTree(X: number[][], y: number[], depth = 0, maxDepth = 6, minSamples = 8, featureSubset?: number): TreeNode {
  const d = X[0].length;
  const features = featureSubset
    ? Array.from({ length: featureSubset }, () => randInt(0, d - 1))
    : Array.from({ length: d }, (_, i) => i);
  if (y.length <= minSamples || depth >= maxDepth || variance(y) < 1e-4) {
    return { value: meanArr(y) };
  }
  const split = bestSplit(X, y, Array.from(new Set(features)));
  if (!split || split.gain <= 0) return { value: meanArr(y) };
  const leftIdx: number[] = [];
  const rightIdx: number[] = [];
  for (let i = 0; i < X.length; i++) {
    if (X[i][split.feature!] <= split.threshold!) leftIdx.push(i);
    else rightIdx.push(i);
  }
  return {
    feature: split.feature,
    threshold: split.threshold,
    left: trainTree(leftIdx.map((i) => X[i]), leftIdx.map((i) => y[i]), depth + 1, maxDepth, minSamples, featureSubset),
    right: trainTree(rightIdx.map((i) => X[i]), rightIdx.map((i) => y[i]), depth + 1, maxDepth, minSamples, featureSubset),
  };
}

export function predictTree(node: TreeNode, row: number[]): number {
  if (node.value !== undefined) return node.value;
  if (row[node.feature!] <= node.threshold!) return predictTree(node.left!, row);
  return predictTree(node.right!, row);
}

// ---------- Random Forest ----------
export interface RandomForest {
  trees: TreeNode[];
  featureImportance: number[];
}

export function trainForest(X: number[][], y: number[], nTrees = 25, maxDepth = 6, minSamples = 6): RandomForest {
  const trees: TreeNode[] = [];
  const d = X[0].length;
  const featureSubset = Math.max(2, Math.round(Math.sqrt(d)));
  for (let t = 0; t < nTrees; t++) {
    const sample: number[] = [];
    for (let i = 0; i < X.length; i++) sample.push(randInt(0, X.length - 1));
    const Xs = sample.map((i) => X[i]);
    const ys = sample.map((i) => y[i]);
    trees.push(trainTree(Xs, ys, 0, maxDepth, minSamples, featureSubset));
  }
  // Feature importance via Gini-style: count split usage weighted by gain proxy (depth).
  const importance = new Array(d).fill(0);
  for (const tree of trees) accumulateImportance(tree, importance);
  return { trees, featureImportance: importance };
}

function accumulateImportance(node: TreeNode, imp: number[], depth = 1): void {
  if (node.feature === undefined) return;
  imp[node.feature] += 1 / depth;
  if (node.left) accumulateImportance(node.left, imp, depth + 1);
  if (node.right) accumulateImportance(node.right, imp, depth + 1);
}

export function predictForest(f: RandomForest, X: number[][]): number[] {
  return X.map((row) => {
    let sum = 0;
    for (const t of f.trees) sum += predictTree(t, row);
    return sum / f.trees.length;
  });
}

// ---------- Metrics ----------
function r2Score(yTrue: number[], yPred: number[]): number {
  const mean = meanArr(yTrue);
  const ssTot = yTrue.reduce((a, y) => a + (y - mean) ** 2, 0);
  const ssRes = yTrue.reduce((a, y, i) => a + (y - yPred[i]) ** 2, 0);
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}
function rmse(yTrue: number[], yPred: number[]): number {
  const n = yTrue.length;
  return Math.sqrt(yTrue.reduce((a, y, i) => a + (y - yPred[i]) ** 2, 0) / n);
}
function mae(yTrue: number[], yPred: number[]): number {
  const n = yTrue.length;
  return yTrue.reduce((a, y, i) => a + Math.abs(y - yPred[i]), 0) / n;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function trainTestSplit<T>(arr: T[], testRatio = 0.2): { train: T[]; test: T[] } {
  const shuffled = shuffle(arr);
  const cut = Math.floor(shuffled.length * (1 - testRatio));
  return { train: shuffled.slice(0, cut), test: shuffled.slice(cut) };
}

// ---------- Full training pipeline ----------
export function trainModels(students: Student[]): TrainingResult {
  const { train, test } = trainTestSplit(students, 0.2);
  const Xtr = train.map(featureVector);
  const ytr = train.map((s) => s.final_marks);
  const Xte = test.map(featureVector);
  const yte = test.map((s) => s.final_marks);

  const lin = trainLinear(Xtr, ytr);
  const tree = trainTree(Xtr, ytr);
  const forest = trainForest(Xtr, ytr);

  const results: ModelResult[] = [
    {
      name: 'Linear Regression',
      r2: r2Score(yte, predictLinear(lin, Xte)),
      rmse: rmse(yte, predictLinear(lin, Xte)),
      mae: mae(yte, predictLinear(lin, Xte)),
      predictions: predictLinear(lin, Xte),
      featureImportance: featureImportanceFromLinear(lin),
    },
    {
      name: 'Decision Tree',
      r2: r2Score(yte, Xte.map((r) => predictTree(tree, r))),
      rmse: rmse(yte, Xte.map((r) => predictTree(tree, r))),
      mae: mae(yte, Xte.map((r) => predictTree(tree, r))),
      predictions: Xte.map((r) => predictTree(tree, r)),
      featureImportance: featureImportanceFromTree(tree, ML_FEATURES.length),
    },
    {
      name: 'Random Forest',
      r2: r2Score(yte, predictForest(forest, Xte)),
      rmse: rmse(yte, predictForest(forest, Xte)),
      mae: mae(yte, predictForest(forest, Xte)),
      predictions: predictForest(forest, Xte),
      featureImportance: featureImportanceFromForest(forest),
    },
  ];

  const best = results.reduce((b, r) => (r.rmse < b.rmse ? r : b), results[0]);
  return { models: results, best, features: [...ML_FEATURES], yTest: yte, yActual: yte };
}

function featureImportanceFromLinear(m: LinearModel): Record<string, number> {
  const total = m.weights.reduce((a, w) => a + Math.abs(w), 0) || 1;
  const imp: Record<string, number> = {};
  ML_FEATURES.forEach((f, i) => {
    imp[f] = (Math.abs(m.weights[i]) / total) * 100;
  });
  return imp;
}

function featureImportanceFromTree(node: TreeNode, d: number): Record<string, number> {
  const imp = new Array(d).fill(0);
  accumulateImportance(node, imp);
  const total = imp.reduce((a, b) => a + b, 0) || 1;
  const out: Record<string, number> = {};
  ML_FEATURES.forEach((f, i) => {
    out[f] = (imp[i] / total) * 100;
  });
  return out;
}

function featureImportanceFromForest(f: RandomForest): Record<string, number> {
  const total = f.featureImportance.reduce((a, b) => a + b, 0) || 1;
  const out: Record<string, number> = {};
  ML_FEATURES.forEach((feat, i) => {
    out[feat] = (f.featureImportance[i] / total) * 100;
  });
  return out;
}

// ---------- Predictions for a single student ----------
export function predictStudent(finalMarks: number): {
  grade: string;
  passFail: string;
  category: PerformanceCategory;
} {
  const grade = gradeFromMarks(finalMarks);
  const passFail = finalMarks >= 40 ? 'Pass' : 'Fail';
  const category = categoryFromMarks(finalMarks);
  return { grade, passFail, category };
}

export function gradeFromMarks(m: number): string {
  if (m >= 90) return 'A+';
  if (m >= 80) return 'A';
  if (m >= 70) return 'B+';
  if (m >= 60) return 'B';
  if (m >= 50) return 'C';
  if (m >= 40) return 'D';
  return 'F';
}

export function categoryFromMarks(m: number): PerformanceCategory {
  if (m >= 85) return 'Excellent';
  if (m >= 70) return 'Good';
  if (m >= 50) return 'Average';
  return 'Poor';
}

export function subjectAverages(s: Pick<Student, typeof SUBJECTS[number]>): Record<string, number> {
  const out: Record<string, number> = {};
  SUBJECTS.forEach((sub) => {
    out[sub] = Number(s[sub] ?? 0);
  });
  return out;
}
