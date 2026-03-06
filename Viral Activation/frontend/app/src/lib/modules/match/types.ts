export interface MatchTeam {
  flag: string;
  name: string;
  rank: number | "—";
  host?: boolean;
  tbd?: boolean;
}

export interface MatchFixture {
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
}

export interface MatchGroup {
  code: string;
  badge: string;
  name: string;
  teams: MatchTeam[];
  matches: MatchFixture[];
}

export interface MatchKnockoutRound {
  id: string;
  label: string;
  badge: string;
  matches: MatchFixtureWithSlot[];
}

export interface MatchFixtureWithSlot extends MatchFixture {
  slot: string;
}

export interface MatchGroupFilter {
  id: string;
  label: string;
}

export interface MatchKnockoutFilter {
  id: string;
  label: string;
}
