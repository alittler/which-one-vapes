
export interface Candidate {
  id: string;
  name: string;
  image: string;
  category: string;
  baseVapeScore: number; // 0 to 100
}

export interface VoteRecord {
  chosenCount: number; // How many times they were picked as "the vaper"
  totalAppearances: number; // How many times they appeared in a matchup
}

export type GlobalVotes = Record<string, VoteRecord>;

export interface VerdictResponse {
  comparisonReasoning: string;
  vapeLeader: string; // The name of the person more likely to vape
  vibeSummary: string;
}
