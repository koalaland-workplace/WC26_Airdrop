import { get, writable } from "svelte/store";
import { fetchEarnState, claimEarnTask } from "../modules/earn/api";
import { EARN_TASK_CAP } from "../modules/earn/data";
import { activateReferralBoost, fetchReferralState } from "../modules/referral/api";
import type { EarnClaimResult, EarnTask } from "../modules/earn/types";
import type { ReferralState } from "../modules/referral/types";
import { sessionStore } from "./session.store";

export type EarnStatus = "idle" | "loading" | "ready" | "error";

export interface EarnState {
  status: EarnStatus;
  taskCap: number;
  claimedTaskIds: string[];
  claimedKick: number;
  referral: ReferralState;
  isBoosting: boolean;
  errorMessage: string | null;
}

const DEFAULT_REFERRAL_STATE: ReferralState = {
  boostMult: 1,
  f1Registered: 0,
  f1Active7: 0,
  f2Registered: 0,
  f2Active7: 0
};

const initialState: EarnState = {
  status: "idle",
  taskCap: EARN_TASK_CAP,
  claimedTaskIds: [],
  claimedKick: 0,
  referral: DEFAULT_REFERRAL_STATE,
  isBoosting: false,
  errorMessage: null
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Earn service unavailable.";
}

function normalizeReferral(referral: ReferralState): ReferralState {
  return {
    boostMult: Math.max(1, Math.floor(Number(referral.boostMult) || 1)),
    f1Registered: Math.max(0, Math.floor(Number(referral.f1Registered) || 0)),
    f1Active7: Math.max(0, Math.floor(Number(referral.f1Active7) || 0)),
    f2Registered: Math.max(0, Math.floor(Number(referral.f2Registered) || 0)),
    f2Active7: Math.max(0, Math.floor(Number(referral.f2Active7) || 0))
  };
}

function createEarnStore() {
  const { subscribe, set, update } = writable<EarnState>(initialState);
  let initPromise: Promise<void> | null = null;

  async function init(sessionId: string | null, force = false): Promise<void> {
    if (initPromise && !force) return initPromise;

    const run = (async () => {
      update((state) => ({ ...state, status: "loading", errorMessage: null }));

      if (!sessionId) {
        update((state) => ({ ...state, status: "ready", errorMessage: null }));
        return;
      }

      const [earnPayload, referralPayload] = await Promise.all([
        fetchEarnState(sessionId),
        fetchReferralState(sessionId)
      ]);

      sessionStore.sync({ economy: earnPayload.economy });

      update((state) => ({
        ...state,
        status: "ready",
        taskCap: Math.max(0, Math.floor(Number(earnPayload.earn.taskCap) || EARN_TASK_CAP)),
        claimedKick: Math.max(0, Math.floor(Number(earnPayload.earn.claimedKick) || 0)),
        claimedTaskIds: earnPayload.earn.claimedTaskIds.filter((taskId) => typeof taskId === "string"),
        referral: normalizeReferral(referralPayload.referral),
        errorMessage: null
      }));
    })()
      .catch((error) => {
        update((state) => ({
          ...state,
          status: "error",
          errorMessage: toErrorMessage(error)
        }));
      })
      .finally(() => {
        initPromise = null;
      });

    initPromise = run;
    return run;
  }

  async function claimTask(sessionId: string | null, task: EarnTask): Promise<EarnClaimResult> {
    if (!sessionId) {
      return {
        taskId: task.id,
        appliedKick: 0,
        message: "Session chưa sẵn sàng."
      };
    }

    try {
      const payload = await claimEarnTask({
        sessionId,
        taskId: task.id,
        points: task.points
      });

      sessionStore.sync({ economy: payload.economy });

      update((state) => ({
        ...state,
        taskCap: Math.max(0, Math.floor(Number(payload.earn.taskCap) || state.taskCap)),
        claimedKick: Math.max(0, Math.floor(Number(payload.earn.claimedKick) || state.claimedKick)),
        claimedTaskIds: payload.earn.claimedTaskIds.filter((taskId) => typeof taskId === "string"),
        errorMessage: null
      }));

      const message = payload.alreadyClaimed
        ? "Task already completed."
        : payload.appliedKick > 0
          ? `✅ ${task.name} completed (+${payload.appliedKick.toLocaleString("en-US")} KICK)`
          : "✅ Task completed, but task cap reached.";

      return {
        taskId: task.id,
        appliedKick: payload.appliedKick,
        message
      };
    } catch (error) {
      const message = toErrorMessage(error);
      update((state) => ({ ...state, errorMessage: message }));
      return {
        taskId: task.id,
        appliedKick: 0,
        message
      };
    }
  }

  async function boostReferral(sessionId: string | null, mult = 3): Promise<void> {
    if (!sessionId) return;

    update((state) => ({ ...state, isBoosting: true, errorMessage: null }));

    try {
      const payload = await activateReferralBoost({ sessionId, mult });
      const referral = normalizeReferral(payload.referral);

      update((state) => ({
        ...state,
        referral,
        isBoosting: false,
        errorMessage: null
      }));

      const session = get(sessionStore);
      sessionStore.sync({
        boosts: {
          quizBoostMult: session.quizBoostMult,
          refBoostMult: referral.boostMult
        }
      });
    } catch (error) {
      update((state) => ({
        ...state,
        isBoosting: false,
        errorMessage: toErrorMessage(error)
      }));
    }
  }

  return {
    subscribe,
    init,
    claimTask,
    boostReferral,
    reset: () => set(initialState)
  };
}

export const earnStore = createEarnStore();
