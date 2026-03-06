export interface NationStat {
  code: string;
  flag: string;
  name: string;
  users: number;
  eligibleUsers: number;
  totalKick: number;
  changePct: number;
}

export interface NationRankItem extends NationStat {
  warPoint: number;
}
