function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeLink(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return "#";
}

function formatInlineMarkdown(input: string): string {
  let output = escapeHtml(input);
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    const safeHref = escapeHtml(sanitizeLink(href));
    return `<a href="${safeHref}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  output = output.replace(/`([^`]+?)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
  return output;
}

export function renderMarkdownToHtml(markdown: string): string {
  const lines = String(markdown ?? "").replaceAll("\r\n", "\n").split("\n");
  const html: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = (): void => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeLists();
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${formatInlineMarkdown(bulletMatch[1])}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${formatInlineMarkdown(orderedMatch[1])}</li>`);
      continue;
    }

    closeLists();

    if (line.startsWith("### ")) {
      html.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      html.push(`<h1>${formatInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    html.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  closeLists();
  return html.join("");
}
