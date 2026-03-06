import { httpGet, httpPost } from "../../api/http";
import type {
  QuizAnswerRequest,
  QuizAnswerResponse,
  QuizDailyResponse,
  QuizFinalizeRequest,
  QuizFinalizeResponse
} from "./types";

const QUIZ_DAILY_ENDPOINT = "/api/quiz/daily";
const QUIZ_ANSWER_ENDPOINT = "/api/quiz/answer";
const QUIZ_FINALIZE_ENDPOINT = "/api/quiz/finalize";

export async function fetchDailyQuiz(sessionId: string): Promise<QuizDailyResponse> {
  const encodedSessionId = encodeURIComponent(sessionId);
  return httpGet<QuizDailyResponse>(`${QUIZ_DAILY_ENDPOINT}?sessionId=${encodedSessionId}`);
}

export async function submitQuizAnswer(payload: QuizAnswerRequest): Promise<QuizAnswerResponse> {
  return httpPost<QuizAnswerResponse, QuizAnswerRequest>(QUIZ_ANSWER_ENDPOINT, payload);
}

export async function finalizeQuiz(payload: QuizFinalizeRequest): Promise<QuizFinalizeResponse> {
  return httpPost<QuizFinalizeResponse, QuizFinalizeRequest>(QUIZ_FINALIZE_ENDPOINT, payload);
}
