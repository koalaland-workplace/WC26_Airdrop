<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fetchActiveFlashEvent, type FlashEventInfo } from "../modules/flash-event/api";

  let event: FlashEventInfo["event"] = null;
  let active = false;
  let remainingText = "";
  let ticker: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let remainingSeconds = 0;

  function formatRemaining(secs: number): string {
    if (secs <= 0) return "EXPIRED";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    return `${m}m ${String(s).padStart(2, "0")}s`;
  }

  async function poll() {
    try {
      const res = await fetchActiveFlashEvent();
      active = res.active;
      event = res.event;
      if (res.event) {
        remainingSeconds = res.event.remainingSeconds;
        remainingText = formatRemaining(remainingSeconds);
      }
    } catch {
      // ignore
    }
  }

  onMount(() => {
    void poll();
    // Poll for new events every 60s
    pollTimer = setInterval(() => void poll(), 60_000);
    // Countdown tick every second
    ticker = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds -= 1;
        remainingText = formatRemaining(remainingSeconds);
        if (remainingSeconds <= 0) {
          active = false;
          event = null;
        }
      }
    }, 1000);
  });

  onDestroy(() => {
    if (ticker) clearInterval(ticker);
    if (pollTimer) clearInterval(pollTimer);
  });
</script>

{#if active && event}
  <div class="flash-banner">
    <div class="flash-icon">⚡</div>
    <div class="flash-content">
      <div class="flash-title">{event.title}</div>
      <div class="flash-meta">
        <span class="flash-mult">{event.multiplier}x KICK</span>
        <span class="flash-timer">⏱ {remainingText}</span>
      </div>
    </div>
    <div class="flash-pulse" />
  </div>
{/if}

<style>
  .flash-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #ff6b35 0%, #f7c948 100%);
    border-radius: 12px;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
    animation: flashPulse 2s ease-in-out infinite;
  }

  @keyframes flashPulse {
    0%, 100% { box-shadow: 0 0 8px rgba(255, 107, 53, 0.4); }
    50% { box-shadow: 0 0 20px rgba(255, 107, 53, 0.8); }
  }

  .flash-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .flash-content {
    flex: 1;
    min-width: 0;
  }

  .flash-title {
    font-weight: 700;
    font-size: 13px;
    color: #1a1a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .flash-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 2px;
  }

  .flash-mult {
    background: rgba(0,0,0,0.2);
    color: #fff;
    font-weight: 800;
    font-size: 13px;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .flash-timer {
    font-size: 12px;
    font-weight: 600;
    color: #1a1a2a;
    font-variant-numeric: tabular-nums;
  }

  .flash-pulse {
    position: absolute;
    top: 0;
    right: -40px;
    width: 40px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: flashShine 2.5s ease-in-out infinite;
  }

  @keyframes flashShine {
    0% { right: -40px; }
    100% { right: calc(100% + 40px); }
  }
</style>
