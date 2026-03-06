<script lang="ts">
  import type { HotSignal } from "../modules/news/types";
  import { impactMeta, timeAgo } from "../modules/news/utils";

  export let items: HotSignal[] = [];
</script>

<div class="pulse-feed">
  {#each items.slice(0, 5) as item (item.id)}
    {@const meta = impactMeta(item.impact)}
    <article class="pulse-post">
      <div class="pulse-head">
        <div class="pulse-avatar sig">📡</div>
        <div class="pulse-meta">
          <div class="pulse-name">
            WC26 Hot Signal
            <span class="pulse-handle">@wc26_hotdesk</span>
            <span class="pulse-dot">·</span>
            <span class="pulse-time">{timeAgo(item.publishedAt)}</span>
          </div>
          <div class="pulse-tag">{item.sourceName ?? "Live feed"}</div>
        </div>
      </div>

      <div class="pulse-main">
        <div class="pulse-body">🚨 {item.title}</div>
        {#if item.summary}
          <div class="pulse-hot-meta">{item.summary}</div>
        {/if}
        <span class={`pulse-impact ${meta.level}`}>{meta.icon} {meta.label}</span>
      </div>
    </article>
  {/each}
</div>
