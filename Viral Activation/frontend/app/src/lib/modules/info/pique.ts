export interface PiquePreset {
  id: string;
  label: string;
  prompt: string;
}

export const PIQUE_PRESETS: PiquePreset[] = [
  {
    id: "group-c",
    label: "Who tops Group C?",
    prompt: "Who can top Group C?"
  },
  {
    id: "earn-kick",
    label: "Earn KICK faster?",
    prompt: "How do I earn KICK faster?"
  },
  {
    id: "kick-to-wc26",
    label: "KICK to WC26?",
    prompt: "How does KICK convert to WC26?"
  },
  {
    id: "nation-wars",
    label: "Nation Wars points?",
    prompt: "How do Nation Wars points work?"
  },
  {
    id: "referral",
    label: "Referral rewards?",
    prompt: "How does referral reward work?"
  }
];

const PIQUE_RESPONSES: Record<string, string> = {
  default:
    "PIQUE online. Ask about groups, Nation Wars, KICK growth, conversion rules, and referral strategy.",
  group: "Group C is balanced. Brazil has the highest baseline, but Morocco can disrupt with transitions.",
  kick: "Fastest route: Daily Spin + Quiz cap + Penalty free turns + Social tasks + referrals every day.",
  convert:
    "Conversion snapshot uses your eligible KICK share against system total, then maps into the 10,000,000 WC26 pool.",
  wars:
    "Nation Wars score tracks qualified-user KICK contribution and momentum, not just raw user count.",
  referral:
    "Referral rewards stack by F1/F2 quality and sustained activity, not only invite quantity."
};

export function resolvePiqueReply(input: string): string {
  const q = input.trim().toLowerCase();
  if (!q) return PIQUE_RESPONSES.default;
  if (q.includes("group")) return PIQUE_RESPONSES.group;
  if (q.includes("kick") && q.includes("wc26")) return PIQUE_RESPONSES.convert;
  if (q.includes("kick")) return PIQUE_RESPONSES.kick;
  if (q.includes("war")) return PIQUE_RESPONSES.wars;
  if (q.includes("ref")) return PIQUE_RESPONSES.referral;
  return PIQUE_RESPONSES.default;
}
