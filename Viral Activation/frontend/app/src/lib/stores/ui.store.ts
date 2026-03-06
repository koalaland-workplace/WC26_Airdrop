import { writable } from "svelte/store";

export type AppPage = "home" | "wars" | "penalty" | "spin" | "quiz" | "earn" | "info";
export type InfoTab = "match" | "pulse" | "rules" | "ai";

export interface UiState {
  page: AppPage;
  infoTab: InfoTab;
}

const initialState: UiState = {
  page: "home",
  infoTab: "match"
};

function createUiStore() {
  const { subscribe, update, set } = writable<UiState>(initialState);

  function navigate(page: AppPage): void {
    update((state) => ({ ...state, page }));
  }

  function openInfoTab(tab: InfoTab): void {
    update((state) => ({ ...state, page: "info", infoTab: tab }));
  }

  function setInfoTab(tab: InfoTab): void {
    update((state) => ({ ...state, infoTab: tab }));
  }

  function reset(): void {
    set(initialState);
  }

  return {
    subscribe,
    navigate,
    openInfoTab,
    setInfoTab,
    reset
  };
}

export const uiStore = createUiStore();
