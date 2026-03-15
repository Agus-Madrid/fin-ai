import type { CategoryCandidateProfile } from './category-candidate-profile.interface';

export interface RankedCategoryCandidate {
  candidate: CategoryCandidateProfile;
  score: number;
}
