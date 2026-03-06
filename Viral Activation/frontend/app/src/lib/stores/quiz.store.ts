import { get, writable } from "svelte/store";
import { fetchDailyQuiz, finalizeQuiz, submitQuizAnswer } from "../modules/quiz/api";
import type {
  QuizAnswerResult,
  QuizDifficulty,
  QuizQuestion
} from "../modules/quiz/types";
import { sessionStore } from "./session.store";

export type QuizStatus = "idle" | "loading" | "ready" | "error";

export interface QuizAnswerState {
  choice: number;
  correct: boolean;
  correctIndex: number;
  deltaApplied: number;
  alreadyAnswered: boolean;
}

export interface QuizState {
  status: QuizStatus;
  day: string;
  doneToday: boolean;
  completedToday: boolean;
  streak: number;
  quizBoostMult: number;
  score: number;
  answeredCount: number;
  requiredCount: number;
  bonusApplied: number;
  totalEarned: number;
  currentIndex: number;
  questions: QuizQuestion[];
  answers: Record<number, QuizAnswerState>;
  errorMessage: string | null;
}

export interface QuizSubmitOutcome {
  result: QuizAnswerResult;
  answer: QuizAnswerState;
}

const initialState: QuizState = {
  status: "idle",
  day: "",
  doneToday: false,
  completedToday: false,
  streak: 0,
  quizBoostMult: 1,
  score: 0,
  answeredCount: 0,
  requiredCount: 0,
  bonusApplied: 0,
  totalEarned: 0,
  currentIndex: 0,
  questions: [],
  answers: {},
  errorMessage: null
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Quiz service unavailable.";
}

function nextUnansweredIndex(
  questions: QuizQuestion[],
  answers: Record<number, QuizAnswerState>,
  fallback: number
): number {
  for (let index = 0; index < questions.length; index += 1) {
    if (!answers[index]) return index;
  }
  return Math.max(0, Math.min(fallback, Math.max(questions.length - 1, 0)));
}

function normalizeDiff(diff: string): QuizDifficulty {
  if (diff === "hard") return "hard";
  if (diff === "medium") return "medium";
  return "easy";
}

function createQuizStore() {
  const { subscribe, set, update } = writable<QuizState>(initialState);

  let refreshPromise: Promise<void> | null = null;
  let finalizePromise: Promise<void> | null = null;

  async function refresh(sessionId: string, force = false): Promise<void> {
    if (!sessionId) return;
    if (refreshPromise && !force) return refreshPromise;

    const run = (async () => {
      update((state) => ({ ...state, status: "loading", errorMessage: null }));
      const payload = await fetchDailyQuiz(sessionId);
      const questions = payload.quiz.questions.map((question) => ({
        ...question,
        diff: normalizeDiff(question.diff)
      }));

      sessionStore.sync({ economy: payload.economy });

      update((state) => {
        const requiredCount = questions.length;
        const currentIndex = Math.max(0, Math.min(payload.quiz.answeredCount, Math.max(requiredCount - 1, 0)));

        return {
          ...state,
          status: "ready",
          day: payload.quiz.day,
          doneToday: payload.quiz.doneToday,
          completedToday: payload.quiz.doneToday,
          streak: payload.quiz.streak,
          quizBoostMult: Math.max(1, Math.floor(Number(payload.quiz.quizBoostMult) || 1)),
          score: payload.quiz.score,
          answeredCount: payload.quiz.answeredCount,
          requiredCount,
          bonusApplied: 0,
          totalEarned: 0,
          currentIndex,
          questions,
          answers: {},
          errorMessage: null
        };
      });
    })()
      .catch((error) => {
        update((state) => ({
          ...state,
          status: "error",
          errorMessage: toErrorMessage(error)
        }));
      })
      .finally(() => {
        refreshPromise = null;
      });

    refreshPromise = run;
    return run;
  }

  async function submitAnswer(
    sessionId: string,
    index: number,
    choice: number
  ): Promise<QuizSubmitOutcome | null> {
    if (!sessionId) return null;

    const payload = await submitQuizAnswer({ sessionId, index, choice });
    sessionStore.sync({ economy: payload.economy });

    const answerState: QuizAnswerState = {
      choice,
      correct: payload.result.correct,
      correctIndex: payload.result.correctIndex,
      deltaApplied: payload.result.deltaApplied,
      alreadyAnswered: Boolean(payload.result.alreadyAnswered)
    };

    update((state) => {
      const answers = {
        ...state.answers,
        [index]: answerState
      };

      const answeredCount = payload.result.answeredCount;
      const doneByCount = answeredCount >= state.requiredCount && state.requiredCount > 0;

      return {
        ...state,
        score: payload.result.score,
        answeredCount,
        totalEarned: state.totalEarned + Math.max(0, payload.result.deltaApplied),
        answers,
        doneToday: Boolean(payload.result.doneToday) || state.doneToday,
        completedToday: doneByCount || state.completedToday,
        currentIndex: nextUnansweredIndex(state.questions, answers, state.currentIndex),
        errorMessage: null
      };
    });

    const currentState = get({ subscribe });

    if (
      currentState.answeredCount >= currentState.requiredCount &&
      currentState.requiredCount > 0
    ) {
      await finalize(sessionId);
    }

    return {
      result: payload.result,
      answer: answerState
    };
  }

  async function finalize(sessionId: string): Promise<void> {
    if (!sessionId) return;
    if (finalizePromise) return finalizePromise;

    const run = (async () => {
      const payload = await finalizeQuiz({ sessionId });
      sessionStore.sync({ economy: payload.economy });

      update((state) => ({
        ...state,
        doneToday: payload.quiz.doneToday,
        completedToday: payload.quiz.completedToday,
        answeredCount: payload.quiz.answeredCount,
        requiredCount: payload.quiz.requiredCount,
        streak: payload.quiz.streak,
        bonusApplied: payload.quiz.bonusApplied,
        totalEarned: state.totalEarned + Math.max(0, payload.quiz.bonusApplied),
        errorMessage: null
      }));
    })()
      .catch((error) => {
        update((state) => ({
          ...state,
          errorMessage: toErrorMessage(error)
        }));
      })
      .finally(() => {
        finalizePromise = null;
      });

    finalizePromise = run;
    return run;
  }

  function setCurrentIndex(index: number): void {
    update((state) => ({
      ...state,
      currentIndex: Math.max(0, Math.min(index, Math.max(state.questions.length - 1, 0)))
    }));
  }

  function reset(): void {
    set(initialState);
  }

  return {
    subscribe,
    refresh,
    submitAnswer,
    finalize,
    setCurrentIndex,
    reset
  };
}

export const quizStore = createQuizStore();
