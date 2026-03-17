<script lang="ts">
  export let currentDays: number = 0;
  export let multiplier: number = 1;

  $: streakEmoji = currentDays >= 30 ? "🔥🔥🔥" : currentDays >= 14 ? "🔥🔥" : currentDays >= 7 ? "🔥" : currentDays >= 3 ? "⚡" : "📅";
  $: multLabel = multiplier > 1 ? `${multiplier}x` : "";
</script>

<div class="streak-counter">
  <div class="streak-icon">{streakEmoji}</div>
  <div class="streak-info">
    <div class="streak-days">{currentDays} day streak</div>
    {#if multLabel}
      <div class="streak-mult">{multLabel} multiplier</div>
    {/if}
  </div>
</div>

<style>
  .streak-counter {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05));
    border-radius: 12px;
    border: 1px solid rgba(245,166,35,0.3);
  }
  .streak-icon { font-size: 1.4rem; }
  .streak-info { display: flex; flex-direction: column; gap: 2px; }
  .streak-days { font-size: 0.85rem; font-weight: 600; color: #f5a623; }
  .streak-mult { font-size: 0.75rem; color: #e5a020; opacity: 0.85; }
</style>
