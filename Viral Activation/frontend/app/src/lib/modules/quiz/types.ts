export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  index: number;
  diff: QuizDifficulty;
  pts: number;
  text: string;
  opts: string[];
}

export interface QuizDailyPayload {
  day: string;
  doneToday: boolean;
  streak: number;
  quizBoostMult: number;
  score: number;
  answeredCount: number;
  questions: QuizQuestion[];
}

export interface QuizDailyResponse {
  ok: boolean;
  quiz: QuizDailyPayload;
  economy: {
    kick: number;
    dailyEarned: number;
  };
}

export interface QuizAnswerRequest {
  sessionId: string;
  index: number;
  choice: number;
}

export interface QuizAnswerResult {
  index: number;
  correct: boolean;
  correctIndex: number;
  deltaApplied: number;
  alreadyAnswered?: boolean;
  score: number;
  answeredCount: number;
  doneToday?: boolean;
}

export interface QuizAnswerResponse {
  ok: boolean;
  result: QuizAnswerResult;
  economy: {
    kick: number;
    dailyEarned: number;
  };
}

export interface QuizFinalizeRequest {
  sessionId: string;
}

export interface QuizFinalizePayload {
  doneToday: boolean;
  completedToday: boolean;
  answeredCount: number;
  requiredCount: number;
  streak: number;
  bonusApplied: number;
}

export interface QuizFinalizeResponse {
  ok: boolean;
  quiz: QuizFinalizePayload;
  economy: {
    kick: number;
    dailyEarned: number;
  };
}
