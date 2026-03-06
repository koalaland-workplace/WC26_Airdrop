<script lang="ts">
  import { onDestroy } from "svelte";
  import { difficultyMeta, formatQuizDayLabel, optionLetter } from "../modules/quiz/utils";
  import { quizStore } from "../stores/quiz.store";
  import { sessionStore } from "../stores/session.store";
  import type { AppPage } from "../stores/ui.store";

  export let onNavigate: (page: AppPage) => void = () => {};

  let timerSeconds = 60;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let activeQuestionToken = "";
  let isSubmitting = false;

  $: sessionId = $sessionStore.sessionId;
  $: quiz = $quizStore;
  $: currentQuestion = quiz.questions[quiz.currentIndex] ?? null;
  $: currentAnswer = currentQuestion ? quiz.answers[currentQuestion.index] : undefined;
  $: questionToken = currentQuestion ? `${currentQuestion.id}:${quiz.answeredCount}` : "";
  $: dayLabel = formatQuizDayLabel(quiz.day);
  $: maxPoints = Math.max(
    1,
    quiz.questions.reduce((sum, question) => sum + Math.max(0, question.pts), 0)
  );
  $: donePct = Math.max(0, Math.min(100, Math.round((quiz.score / maxPoints) * 100)));
  $: doneRingOffset = 264 * (1 - donePct / 100);

  $: if (sessionId && quiz.status === "idle") {
    void quizStore.refresh(sessionId);
  }

  $: {
    if (questionToken && questionToken !== activeQuestionToken && !quiz.completedToday) {
      activeQuestionToken = questionToken;
      restartTimer();
    }

    if (!questionToken || quiz.completedToday) {
      stopTimer();
    }
  }

  function stopTimer(): void {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function restartTimer(): void {
    stopTimer();
    timerSeconds = 60;

    timerId = setInterval(() => {
      timerSeconds = Math.max(0, timerSeconds - 1);

      if (timerSeconds <= 0) {
        stopTimer();
        void answer(-1);
      }
    }, 1000);
  }

  async function answer(choice: number): Promise<void> {
    if (!sessionId || !currentQuestion || isSubmitting || currentAnswer) return;

    isSubmitting = true;
    stopTimer();

    try {
      await quizStore.submitAnswer(sessionId, currentQuestion.index, choice);
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 480);
      });
    } finally {
      isSubmitting = false;
    }
  }

  function optionClass(optionIndex: number): string {
    if (!currentAnswer) return "";
    if (optionIndex === currentAnswer.correctIndex) return "cor";
    if (optionIndex === currentAnswer.choice && !currentAnswer.correct) return "wrg";
    return "";
  }

  onDestroy(() => {
    stopTimer();
  });
</script>

<div id="page-quiz" class="pg on">
  <div class="qtop">
    <div>
      <div class="quiz-title">Daily Quiz</div>
      <div class="quiz-date">{dayLabel}</div>
    </div>
    <div class="pill p-g">🔥 Streak: {quiz.streak} day</div>
  </div>

  <div class="ptk">
    {#each Array(Math.max(quiz.requiredCount, 5)) as _, idx}
      <div class={`ps ${idx < quiz.answeredCount ? "done" : ""} ${idx === quiz.currentIndex && !quiz.completedToday ? "act" : ""}`} />
    {/each}
  </div>

  <div class="quiz-progress-row">
    <span>Question {Math.min(quiz.currentIndex + 1, Math.max(quiz.requiredCount, 1))} of {Math.max(quiz.requiredCount, 1)}</span>
    <span class="quiz-score">{quiz.score.toLocaleString("en-US")} / {maxPoints.toLocaleString("en-US")} pts</span>
  </div>

  {#if !quiz.completedToday && currentQuestion}
    <div class="qcard acc-g">
      <div class={`qdiff ${difficultyMeta(currentQuestion.diff).className}`}>
        {difficultyMeta(currentQuestion.diff).badge} · +{currentQuestion.pts} KICK
      </div>
      <div class="qtext">{currentQuestion.text}</div>
    </div>

    <div class="trow">
      <div class="tring">
        <svg width="37" height="37" viewBox="0 0 37 37">
          <circle class="ttrack" cx="18.5" cy="18.5" r="16" />
          <circle class="tfill" cx="18.5" cy="18.5" r="16" stroke-dashoffset={(60 - timerSeconds) * (100 / 60)} />
        </svg>
        <div class="tval">{timerSeconds}</div>
      </div>
      <div class="thint">Tap the correct answer · Timer running</div>
    </div>

    <div class="opts">
      {#each currentQuestion.opts as option, optionIndex}
        <button
          type="button"
          class={`opt ${optionClass(optionIndex)}`}
          on:click={() => answer(optionIndex)}
          disabled={isSubmitting || Boolean(currentAnswer)}
        >
          <span class="oltr">{optionLetter(optionIndex)}</span>
          <span>{option}</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="qdone on">
      <div class="dring">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42" fill="none" stroke="#172635" stroke-width="6" />
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="url(#dgg)"
            stroke-width="6"
            stroke-dasharray="264"
            stroke-dashoffset={doneRingOffset}
            stroke-linecap="round"
          />
          <defs>
            <linearGradient id="dgg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1FBF6A" />
              <stop offset="100%" stop-color="#1E88E5" />
            </linearGradient>
          </defs>
        </svg>
        <div class="dpct"><span class="big">{donePct}%</span><span class="sm">score</span></div>
      </div>

      <div class="dtitle">QUIZ DONE!</div>
      <div class="dsub">Complete all questions daily for streak bonus</div>

      <div class="ebox">
        <div class="num">+{quiz.totalEarned.toLocaleString("en-US")}</div>
        <div class="lbl">KICK<br />EARNED</div>
      </div>

      <div class="srow">
        {#each [1, 2, 3, 4, 5, 6, 7] as day}
          <div class={`sd ${day <= Math.min(quiz.streak, 3) ? "done" : ""} ${day === 4 ? "now" : ""}`}>{day <= Math.min(quiz.streak, 3) ? "✓" : day}</div>
        {/each}
      </div>

      <button class="btn b-g" type="button" on:click={() => onNavigate("wars")}>⚔️ Check Nation Wars →</button>
    </div>
  {/if}

  {#if quiz.errorMessage}
    <div class="quiz-error">{quiz.errorMessage}</div>
  {/if}
</div>
