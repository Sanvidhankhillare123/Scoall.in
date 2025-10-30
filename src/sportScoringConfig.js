// Legacy compatibility bridge for sportScoringConfig
// Re-exports from the new unified configuration

export {
  getSportScoringConfig,
  defaultSportConfig,
  unifiedSportConfig as sportScoringConfig,
} from "./unifiedSportConfig.js";
