import { DEFAULT_APP_LANGUAGE } from "./constants";
import { translateTemplate, translateText } from "./translate";
import type { AppLanguageCode } from "./types";

interface RegisteredTextNode extends Text {
  __i18nBase?: string;
}

interface RegisteredElement extends HTMLElement {
  __i18nBaseAttrs?: {
    placeholder: string | null;
    title: string | null;
    ariaLabel: string | null;
  };
}

const registry = {
  texts: [] as RegisteredTextNode[],
  attrs: [] as RegisteredElement[]
};

let observer: MutationObserver | null = null;
let mutationTimer: ReturnType<typeof setTimeout> | null = null;
let isMutating = false;

function rootNode(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById("app") ?? document.body;
}

function scan(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      if (!(node instanceof Text) || !node.nodeValue || node.nodeValue.trim().length === 0) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentNode;
      if (!(parent instanceof HTMLElement)) {
        return NodeFilter.FILTER_REJECT;
      }

      const tag = parent.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript" || tag === "textarea") {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let currentNode: Node | null = null;

  while ((currentNode = walker.nextNode())) {
    if (!(currentNode instanceof Text)) continue;
    const textNode = currentNode as RegisteredTextNode;

    if (typeof textNode.__i18nBase === "undefined") {
      textNode.__i18nBase = textNode.nodeValue ?? "";
      registry.texts.push(textNode);
    }
  }

  root.querySelectorAll<RegisteredElement>("[placeholder],[title],[aria-label]").forEach((element) => {
    if (element.__i18nBaseAttrs) return;

    element.__i18nBaseAttrs = {
      placeholder: element.getAttribute("placeholder"),
      title: element.getAttribute("title"),
      ariaLabel: element.getAttribute("aria-label")
    };
    registry.attrs.push(element);
  });
}

function restoreBase(): void {
  registry.texts = registry.texts.filter((node) => {
    if (!node.parentNode || typeof node.__i18nBase !== "string") return false;
    node.nodeValue = node.__i18nBase;
    return true;
  });

  registry.attrs = registry.attrs.filter((element) => {
    if (!element.isConnected || !element.__i18nBaseAttrs) return false;

    const base = element.__i18nBaseAttrs;

    if (base.placeholder !== null) {
      element.setAttribute("placeholder", base.placeholder);
    }
    if (base.title !== null) {
      element.setAttribute("title", base.title);
    }
    if (base.ariaLabel !== null) {
      element.setAttribute("aria-label", base.ariaLabel);
    }

    return true;
  });
}

function updateDocumentTitle(language: AppLanguageCode): void {
  if (typeof document === "undefined") return;
  const translatedTitle = translateTemplate(language, "app_title");
  if (translatedTitle.trim().length > 0) {
    document.title = translatedTitle;
  }
}

export function applyDomTranslations(language: AppLanguageCode): void {
  const root = rootNode();
  if (!root || isMutating) return;

  isMutating = true;

  try {
    scan(root);
    restoreBase();
    updateDocumentTitle(language);

    if (language !== DEFAULT_APP_LANGUAGE) {
      for (const node of registry.texts) {
        if (!node.parentNode || typeof node.__i18nBase !== "string") continue;
        node.nodeValue = translateText(language, node.__i18nBase);
      }

      for (const element of registry.attrs) {
        const base = element.__i18nBaseAttrs;
        if (!element.isConnected || !base) continue;

        if (base.placeholder !== null) {
          element.setAttribute("placeholder", translateText(language, base.placeholder));
        }
        if (base.title !== null) {
          element.setAttribute("title", translateText(language, base.title));
        }
        if (base.ariaLabel !== null) {
          element.setAttribute("aria-label", translateText(language, base.ariaLabel));
        }
      }
    }
  } finally {
    isMutating = false;
  }
}

export function queueDomTranslations(language: AppLanguageCode): void {
  if (language === DEFAULT_APP_LANGUAGE) return;

  if (mutationTimer) {
    clearTimeout(mutationTimer);
  }

  mutationTimer = setTimeout(() => {
    applyDomTranslations(language);
  }, 60);
}

export function initDomTranslationObserver(getLanguage: () => AppLanguageCode): void {
  if (observer || typeof MutationObserver === "undefined") return;

  const root = rootNode();
  if (!root) return;

  observer = new MutationObserver((mutations) => {
    const language = getLanguage();
    if (language === DEFAULT_APP_LANGUAGE || isMutating) return;

    for (const mutation of mutations) {
      if (
        mutation.type === "childList" ||
        mutation.type === "characterData" ||
        mutation.type === "attributes"
      ) {
        queueDomTranslations(language);
        return;
      }
    }
  });

  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"]
  });
}

export function destroyDomTranslationObserver(): void {
  if (mutationTimer) {
    clearTimeout(mutationTimer);
    mutationTimer = null;
  }

  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
