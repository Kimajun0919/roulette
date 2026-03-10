export type DrawRecord = {
  id: string;
  title?: string;
  participants: string[];
  winner: string;
  createdAt: string;
};

export type CreateDrawRequest = {
  title?: string;
  participants: string[];
  winnerRank: number;
  winnerType: 'first' | 'last' | 'custom';
  winner?: string;
};
