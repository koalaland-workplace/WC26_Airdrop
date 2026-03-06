export interface TierPolicyItem {
  id: "rising" | "elite" | "legacy" | "vanguard";
  label: string;
  minKick: number;
  kickLabel: string;
  rightsLabel: string;
}

export const TIER_POLICY: TierPolicyItem[] = [
  {
    id: "rising",
    label: "Rising",
    minKick: 25_000,
    kickLabel: "25,000 KICK",
    rightsLabel: "Whitelist access · 2.5% discount · up to 25 boxes/user."
  },
  {
    id: "elite",
    label: "Elite",
    minKick: 100_000,
    kickLabel: "100,000 KICK",
    rightsLabel: "Whitelist access · 5% discount · up to 25 boxes/user."
  },
  {
    id: "legacy",
    label: "Legacy",
    minKick: 250_000,
    kickLabel: "250,000 KICK",
    rightsLabel: "Whitelist access · 10% discount · up to 10 boxes/user."
  },
  {
    id: "vanguard",
    label: "Vanguard",
    minKick: 1_000_000,
    kickLabel: "1,000,000 KICK",
    rightsLabel: "Whitelist access · 20% discount · up to 10 boxes/user."
  }
];

const TIER_POLICY_DESC = [...TIER_POLICY].sort((left, right) => right.minKick - left.minKick);

export function resolveTierPolicyByKick(kick: number): TierPolicyItem | null {
  const safeKick = Number.isFinite(kick) ? kick : 0;
  for (const tier of TIER_POLICY_DESC) {
    if (safeKick >= tier.minKick) {
      return tier;
    }
  }
  return null;
}
