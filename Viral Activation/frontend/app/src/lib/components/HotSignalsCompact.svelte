<script lang="ts">
  import type { HotSignal } from "../modules/news/types";
  import { impactMeta, timeAgo } from "../modules/news/utils";

  export let items: HotSignal[] = [];
</script>

<div class="pulse-hot-list home-hot-list">
  {#each items.slice(0, 5) as item (item.id)}
    {@const meta = impactMeta(item.impact)}
    <div class="pulse-hot-item">
      <div class="pulse-hot-head">
        <div class="pulse-hot-title">🚨 {item.title}</div>
        <div class="pulse-hot-time">{timeAgo(item.publishedAt)}</div>
      </div>

      <span class={`pulse-impact ${meta.level}`}>{meta.icon} {meta.label}</span>

      {#if item.sourceName}
        <div class="pulse-hot-meta">Source: {item.sourceName}</div>
      {/if}
    </div>
  {/each}
</div>
