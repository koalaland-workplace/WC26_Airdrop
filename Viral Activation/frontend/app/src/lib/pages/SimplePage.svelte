<script lang="ts">
  export let emoji = "📌";
  export let title = "Coming Soon";
  export let subtitle = "This section is being migrated to typed Svelte modules.";
</script>

<div class="pg on">
  <div class="card acc-b simple-page">
    <div class="simple-emoji">{emoji}</div>
    <h2 class="simple-title">{title}</h2>
    <p class="simple-sub">{subtitle}</p>
    <ul class="simple-list">
      <li>UI kept on original WC26 design tokens.</li>
      <li>Feature logic is moving into typed modules and stores.</li>
      <li>Next update keeps parity with the original interactions.</li>
    </ul>
  </div>
</div>
