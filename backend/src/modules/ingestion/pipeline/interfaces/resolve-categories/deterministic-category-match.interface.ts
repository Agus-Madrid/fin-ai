import type { RankedCategoryCandidate } from './ranked-category-candidate.interface';

export interface DeterministicCategoryMatch {
  selectedCategoryId: string | null;
  confidence: number;
  rankedCandidates: RankedCategoryCandidate[];
}
