// Legacy compatibility bridge for old imports
// This ensures existing components still work while we transition

export {
  sports,
  unifiedSportConfig as sportDefinitions,
  getSportConfig as getSportScoringConfig,
  defaultSportConfig,
} from "./unifiedSportConfig.js";

// Also export the unified config as the default export for backward compatibility
import { unifiedSportConfig } from "./unifiedSportConfig.js";
export default unifiedSportConfig;
