<script lang="ts">
  import type { HotSignal } from "../modules/news/types";
  import { timeAgo } from "../modules/news/utils";

  export let items: HotSignal[] = [];
</script>

<div class="pulse-hot-list home-hot-list">
  {#each items.slice(0, 5) as item (item.id)}
    <div class="pulse-hot-item">
      <div class="pulse-hot-head">
        <div class="pulse-hot-title">
          <span class="pulse-alert-icon" aria-hidden="true">🚨</span>
          <span>{item.title}</span>
        </div>
        <div class="pulse-hot-time">{timeAgo(item.publishedAt)}</div>
      </div>

      {#if item.sourceName}
        <div class="pulse-hot-meta">Source: {item.sourceName}</div>
      {/if}

      <div class="pulse-actions pulse-actions-compact" aria-label="Signal actions">
        <span class="pulse-action"><span aria-hidden="true">♡</span> Like</span>
        <span class="pulse-action"><span aria-hidden="true">↗</span> Share</span>
        <span class="pulse-action"><span aria-hidden="true">💬</span> Comments</span>
      </div>
    </div>
  {/each}
</div>
