/**
 * Catch count required to unlock the Permis de Travail (Story 2.4).
 *
 * Shared by `ApplyToListingUseCase` (fires the distinct unlock event exactly
 * once, on the 10th catch — `=== PERMIS_DE_TRAVAIL_THRESHOLD`) and
 * `GetMyBadgesUseCase` (persistent "have I unlocked it" status —
 * `>= PERMIS_DE_TRAVAIL_THRESHOLD`). Only the constant's declaration is
 * shared here; each use case keeps its own comparison semantics.
 */
export const PERMIS_DE_TRAVAIL_THRESHOLD = 10;
