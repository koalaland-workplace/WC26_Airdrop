<script lang="ts">
  import { sessionStore } from "../stores/session.store";

  export let shareType: "story" | "quiz_result" | "penalty_win" = "story";
  export let label: string = "Share & Earn 200 KICK";
  export let onShare: ((type: string) => void) | null = null;

  let sharing = false;

  async function handleShare() {
    if (sharing) return;
    const sid = $sessionStore.sessionId;
    if (!sid) return;

    sharing = true;
    try {
      const telegram = (window as typeof window & {
        Telegram?: { WebApp?: { shareToStory?: (url: string) => void; openTelegramLink?: (url: string) => void } };
      }).Telegram?.WebApp;

      const botUrl = `https://t.me/wc26viral_bot?startapp=ref_${sid}`;
      const shareText = `I'm earning KICK tokens playing WC26! Join me and earn 500 bonus KICK!`;

      if (shareType === "story" && telegram?.shareToStory) {
        telegram.shareToStory(botUrl);
      } else if (telegram?.openTelegramLink) {
        telegram.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(shareText)}`);
      }

      if (onShare) onShare(shareType);
    } finally {
      sharing = false;
    }
  }
</script>

<button class="share-btn" type="button" on:click={handleShare} disabled={sharing}>
  <span class="share-icon">📤</span>
  <span class="share-label">{sharing ? "Sharing..." : label}</span>
</button>

<style>
  .share-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #1e88e5, #1565c0);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    justify-content: center;
    transition: opacity 0.2s;
  }
  .share-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .share-btn:active:not(:disabled) { opacity: 0.8; }
  .share-icon { font-size: 1.1rem; }
  .share-label { white-space: nowrap; }
</style>
