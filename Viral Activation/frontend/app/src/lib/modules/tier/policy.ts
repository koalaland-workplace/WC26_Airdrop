export interface TierPolicyItem {
  id: "rookie" | "starter" | "pro" | "champion" | "master" | "legend";
  label: string;
  minKick: number;
  kickLabel: string;
  bonusLabel: string;
  rightsLabel: string;
  gameplayLabel: string;
  rewardsLabel: string;
}

export const TIER_POLICY: TierPolicyItem[] = [
  {
    id: "rookie",
    label: "Rookie",
    minKick: 0,
    kickLabel: "0 - 25,000 KICK",
    bonusLabel: "",
    rightsLabel: "2.5% discount · Max 25 boxes",
    gameplayLabel: "+1 Daily Lucky Spin",
    rewardsLabel: "Rookie badge"
  },
  {
    id: "starter",
    label: "Starter",
    minKick: 25_000,
    kickLabel: "25,000 - 100,000 KICK",
    bonusLabel: "",
    rightsLabel: "5% discount · Max 25 boxes",
    gameplayLabel: "+2 Lucky Spins/day",
    rewardsLabel: "Starter badge · 1 Rising Box lottery ticket"
  },
  {
    id: "pro",
    label: "Pro",
    minKick: 100_000,
    kickLabel: "100,000 - 250,000 KICK",
    bonusLabel: "2,000 KICK",
    rightsLabel: "VIP whitelist · 10% discount · Max 20 boxes",
    gameplayLabel: "+3 Lucky Spins/day",
    rewardsLabel: "Pro badge · 2 Rising Box lottery ticket"
  },
  {
    id: "champion",
    label: "Champion",
    minKick: 250_000,
    kickLabel: "250,000 - 500,000 KICK",
    bonusLabel: "5,000 KICK",
    rightsLabel: "VIP whitelist · 12.5% discount · Max 15 boxes",
    gameplayLabel: "+4 Lucky Spins/day",
    rewardsLabel: "Champion badge · 1 Rising Box guaranteed"
  },
  {
    id: "master",
    label: "Master",
    minKick: 500_000,
    kickLabel: "500,000 - 1,000,000 KICK",
    bonusLabel: "10,000 KICK",
    rightsLabel: "VIP whitelist · 15% discount · Max 12 boxes",
    gameplayLabel: "+5 Lucky Spins/day",
    rewardsLabel: "Master badge · 1 Elite Box guaranteed"
  },
  {
    id: "legend",
    label: "Legend",
    minKick: 1_000_000,
    kickLabel: "1,000,000+ KICK",
    bonusLabel: "25,000 KICK",
    rightsLabel: "Ultra VIP whitelist · 20% discount · Max 10 boxes",
    gameplayLabel: "+6 Lucky Spins/day",
    rewardsLabel: "Legend badge · 1 Legacy Mystery Box guaranteed · Hall of Fame leaderboard"
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
