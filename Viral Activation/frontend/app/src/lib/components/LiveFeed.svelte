<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fetchLiveStats, type LiveActivity } from "../modules/leaderboard/api";

  let activities: LiveActivity[] = [];
  let totalUsers = 0;
  let totalKick = 0;
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  const TYPE_ICONS: Record<string, string> = {
    kick_earn: "💰",
    quiz_complete: "❓",
    penalty_win: "⚽",
    referral: "👥",
    spin_win: "🎯",
    share: "📤",
    welcome: "🎉"
  };

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function refresh() {
    try {
      const data = await fetchLiveStats();
      if (data.ok) {
        activities = data.activities;
        totalUsers = data.globalStats.totalUsers;
        totalKick = data.globalStats.totalKickDistributed;
      }
    } catch { /* ignore */ }
  }

  onMount(() => {
    void refresh();
    refreshTimer = setInterval(refresh, 30_000);
  });

  onDestroy(() => {
    if (refreshTimer) clearInterval(refreshTimer);
  });
</script>

<div class="live-feed">
  <div class="live-stats-bar">
    <div class="live-stat">
      <span class="live-stat-val">{totalUsers.toLocaleString("en-US")}</span>
      <span class="live-stat-lbl">Players</span>
    </div>
    <div class="live-stat">
      <span class="live-stat-val">{totalKick.toLocaleString("en-US")}</span>
      <span class="live-stat-lbl">Total KICK</span>
    </div>
  </div>
  <div class="live-items">
    {#each activities.slice(0, 8) as activity}
      <div class="live-item">
        <span class="live-item-icon">{TYPE_ICONS[activity.type] ?? "📌"}</span>
        <span class="live-item-text">
          <strong>{activity.username ?? "Anonymous"}</strong>
          {#if activity.amount > 0}earned {activity.amount.toLocaleString("en-US")} KICK{/if}
          {#if activity.detail}({activity.detail}){/if}
        </span>
        <span class="live-item-time">{formatTimeAgo(activity.createdAt)}</span>
      </div>
    {/each}
    {#if activities.length === 0}
      <div class="live-empty">No recent activity</div>
    {/if}
  </div>
</div>

<style>
  .live-feed { display: flex; flex-direction: column; gap: 10px; }
  .live-stats-bar {
    display: flex;
    gap: 16px;
    padding: 8px 0;
  }
  .live-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }
  .live-stat-val {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f5c542;
  }
  .live-stat-lbl {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .live-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .live-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.85);
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .live-item-icon { font-size: 0.9rem; flex-shrink: 0; }
  .live-item-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .live-item-text strong { color: #fff; }
  .live-item-time { font-size: 0.68rem; color: rgba(255,255,255,0.45); flex-shrink: 0; }
  .live-empty { font-size: 0.8rem; color: rgba(255,255,255,0.4); text-align: center; padding: 12px 0; }
</style>
