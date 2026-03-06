import type { HomeHeroSnapshot, HomeNationRow } from "./types";

export const HOME_HERO_SNAPSHOT: HomeHeroSnapshot = {
  warLive: "Nation War Live - Brazil vs Argentina",
  warDelta: "Brazil +2.8%",
  liveFans: 243_182
};

export const HOME_TOP_NATIONS: HomeNationRow[] = [
  { flag: "🇧🇷", name: "Brazil", points: "38.6M", delta: "+2.8%" },
  { flag: "🇦🇷", name: "Argentina", points: "21.9M", delta: "+1.9%" },
  { flag: "🇫🇷", name: "France", points: "19.3M", delta: "+1.4%" }
];
