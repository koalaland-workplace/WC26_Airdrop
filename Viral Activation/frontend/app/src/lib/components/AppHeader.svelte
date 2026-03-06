<script lang="ts">
  import { formatKick } from "../modules/home/utils";
  import { resolveKickRingPct, resolveRankLine, resolveTierLabel } from "../modules/session/utils";
  import { languageStore } from "../stores/language.store";
  import { sessionStore } from "../stores/session.store";

  $: kick = $sessionStore.kick;
  $: tier = resolveTierLabel(kick);
  $: rankLine = resolveRankLine(kick);
  $: safePct = resolveKickRingPct(kick);
  $: ringOffset = 107 - (safePct / 100) * 107;
</script>

<header class="hdr">
  <div class="hdr-l">
    <img class="hdr-logo" src="/assets/wc26-logo.png" alt="WC26 official logo" />
    <div class="hdr-copy">
      <span class="brand-nm">WC26 NFT FANTASY</span>
      <span class="brand-sub">National Journey Airdrop - Viral Activation</span>

      <div class="hdr-kick-row">
        <button class="kick-chip" type="button">
          <span class="kick-lbl">KICK:</span>
          <span class="kick-val">{formatKick(kick)}</span>
        </button>
        <button class="tier-chip" type="button">{tier}</button>
      </div>

      <div class="hdr-rank">{rankLine}</div>
      <div class="lang-switch" aria-label="Language selector">
        {#each $languageStore.options as language}
          <button
            class={`lang-btn ${$languageStore.current === language.code ? "on" : ""}`}
            type="button"
            data-lang={language.code}
            on:click={() => languageStore.setLanguage(language.code)}
          >
            {language.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <button class="hdr-ring-wrap" type="button" aria-label="Open progress">
    <svg viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="4" />
      <circle
        cx="22"
        cy="22"
        r="17"
        fill="none"
        stroke="url(#hdrg)"
        stroke-width="4"
        stroke-dasharray="107"
        stroke-dashoffset={ringOffset}
        stroke-linecap="round"
      />
      <defs>
        <linearGradient id="hdrg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1FBF6A" />
          <stop offset="100%" stop-color="#F5C542" />
        </linearGradient>
      </defs>
    </svg>
    <span class="hdr-ring-txt">{safePct}%</span>
  </button>
</header>
