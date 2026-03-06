<script lang="ts">
  import type { AppPage, InfoTab } from "../stores/ui.store";

  export let currentPage: AppPage = "home";
  export let currentInfoTab: InfoTab = "match";
  export let onNavigate: (page: AppPage) => void = () => {};
  export let onOpenInfoTab: (tab: InfoTab) => void = () => {};

  interface NavItem {
    page: AppPage;
    icon: string;
    label: string;
  }

  const navItems: NavItem[] = [
    { page: "home", icon: "🏠", label: "HOME" },
    { page: "wars", icon: "⚔️", label: "WARS" },
    { page: "penalty", icon: "⚽", label: "PEN" },
    { page: "spin", icon: "🎯", label: "SPIN" },
    { page: "quiz", icon: "🧠", label: "QUIZ" },
    { page: "earn", icon: "💎", label: "EARN" }
  ];

  const infoQuickTabs: Array<{ key: InfoTab; label: string }> = [
    { key: "match", label: "Match Hub" },
    { key: "pulse", label: "Hot Signals" },
    { key: "rules", label: "Rules" },
    { key: "ai", label: "PIQUE" }
  ];
</script>

<nav class="nav">
  <div class="nav-main">
    {#each navItems as item}
      <button
        type="button"
        class={`nb ${currentPage === item.page ? "on" : ""}`}
        on:click={() => onNavigate(item.page)}
      >
        <span class="ni">{item.icon}</span>
        {item.label}
      </button>
    {/each}
  </div>

  <div class="nav-info-quick">
    {#each infoQuickTabs as tab}
      <button
        type="button"
        class={`nb-thin ${currentPage === "info" && currentInfoTab === tab.key ? "on" : ""}`}
        on:click={() => onOpenInfoTab(tab.key)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
</nav>
