// Unified sport configuration combining sportDefinitions.js and sportScoringConfig.js
// This will be the single source of truth for all sports scoring

export const sports = [
  "Football",
  "Basketball",
  "Tennis",
  "Cricket",
  "Badminton",
  "Table Tennis",
  "Hockey",
  "Squash",
  "Kabaddi",
  "Volleyball",
  "Boxing",
  "Chess",
];

export const unifiedSportConfig = {
  Football: {
    actions: [
      {
        id: "goal",
        label: "Goal",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "yellow_card",
        label: "Yellow Card",
        type: "event",
        color: "bg-yellow-600 hover:bg-yellow-700",
      },
      {
        id: "red_card",
        label: "Red Card",
        type: "event",
        color: "bg-red-600 hover:bg-red-700",
      },
      {
        id: "substitution",
        label: "Substitution",
        type: "event",
        color: "bg-blue-600 hover:bg-blue-700",
      },
    ],
    scoreLabel: "Goals",
    displayFormat: "simple",
  },

  Basketball: {
    actions: [
      {
        id: "1_point",
        label: "Free Throw",
        type: "point",
        value: 1,
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "2_points",
        label: "2 Points",
        type: "point",
        value: 2,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "3_points",
        label: "3 Points",
        type: "point",
        value: 3,
        color: "bg-purple-600 hover:bg-purple-700",
      },
      {
        id: "foul",
        label: "Foul",
        type: "event",
        color: "bg-orange-600 hover:bg-orange-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  Tennis: {
    actions: [
      {
        id: "point_won",
        label: "Point Won",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "ace",
        label: "Ace",
        type: "event",
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "double_fault",
        label: "Double Fault",
        type: "event",
        color: "bg-red-600 hover:bg-red-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  Cricket: {
    actions: [
      {
        id: "dot",
        label: "Dot",
        type: "point",
        value: 0,
        color: "bg-gray-600 hover:bg-gray-700",
      },
      {
        id: "run_1",
        label: "1",
        type: "point",
        value: 1,
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "run_2",
        label: "2",
        type: "point",
        value: 2,
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "run_3",
        label: "3",
        type: "point",
        value: 3,
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "run_4",
        label: "4",
        type: "point",
        value: 4,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "run_6",
        label: "6",
        type: "point",
        value: 6,
        color: "bg-purple-600 hover:bg-purple-700",
      },
      {
        id: "wide",
        label: "Wide",
        type: "point",
        value: 1,
        color: "bg-orange-600 hover:bg-orange-700",
      },
      {
        id: "no_ball",
        label: "No Ball",
        type: "point",
        value: 1,
        color: "bg-red-600 hover:bg-red-700",
      },
      {
        id: "bye",
        label: "Bye",
        type: "point",
        value: 1,
        color: "bg-indigo-600 hover:bg-indigo-700",
      },
      {
        id: "leg_bye",
        label: "Leg Bye",
        type: "point",
        value: 1,
        color: "bg-pink-600 hover:bg-pink-700",
      },
      {
        id: "wicket",
        label: "Wicket",
        type: "wicket",
        color: "bg-red-700 hover:bg-red-800",
      },
    ],
    scoreLabel: "Runs",
    displayFormat: "runs-wickets",
    hasWickets: true,
  },

  Badminton: {
    actions: [
      {
        id: "point_won",
        label: "Point Won",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "double_hit",
        label: "Double Hit",
        type: "event",
        color: "bg-orange-600 hover:bg-orange-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  "Table Tennis": {
    actions: [
      {
        id: "point_won",
        label: "Point Won",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  Hockey: {
    actions: [
      {
        id: "goal",
        label: "Goal",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "penalty_corner",
        label: "Penalty Corner",
        type: "event",
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "yellow_card",
        label: "Yellow Card",
        type: "event",
        color: "bg-yellow-600 hover:bg-yellow-700",
      },
      {
        id: "red_card",
        label: "Red Card",
        type: "event",
        color: "bg-red-600 hover:bg-red-700",
      },
    ],
    scoreLabel: "Goals",
    displayFormat: "simple",
  },

  Squash: {
    actions: [
      {
        id: "point_won",
        label: "Point Won",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  Kabaddi: {
    actions: [
      {
        id: "raid_point",
        label: "Raid Point",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "tackle_point",
        label: "Tackle Point",
        type: "point",
        value: 1,
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "all_out",
        label: "All Out",
        type: "point",
        value: 2,
        color: "bg-purple-600 hover:bg-purple-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  Volleyball: {
    actions: [
      {
        id: "point_won",
        label: "Point Won",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "ace",
        label: "Ace",
        type: "point",
        value: 1,
        color: "bg-purple-600 hover:bg-purple-700",
      },
      {
        id: "block",
        label: "Block",
        type: "event",
        color: "bg-blue-600 hover:bg-blue-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  Boxing: {
    actions: [
      {
        id: "point_awarded",
        label: "Point Awarded",
        type: "point",
        value: 1,
        color: "bg-green-600 hover:bg-green-700",
      },
      {
        id: "knockdown",
        label: "Knockdown",
        type: "event",
        color: "bg-red-600 hover:bg-red-700",
      },
      {
        id: "foul",
        label: "Foul",
        type: "event",
        color: "bg-orange-600 hover:bg-orange-700",
      },
    ],
    scoreLabel: "Points",
    displayFormat: "simple",
  },

  Chess: {
    actions: [
      {
        id: "move",
        label: "Record Move",
        type: "event",
        color: "bg-blue-600 hover:bg-blue-700",
      },
      {
        id: "check",
        label: "Check",
        type: "event",
        color: "bg-yellow-600 hover:bg-yellow-700",
      },
      {
        id: "checkmate",
        label: "Checkmate",
        type: "event",
        color: "bg-red-600 hover:bg-red-700",
      },
      {
        id: "resign",
        label: "Resign",
        type: "event",
        color: "bg-gray-600 hover:bg-gray-700",
      },
    ],
    scoreLabel: "",
    displayFormat: "chess",
  },
};

// Default configuration for sports not defined above
export const defaultSportConfig = {
  actions: [
    {
      id: "point",
      label: "Point",
      type: "point",
      value: 1,
      color: "bg-green-600 hover:bg-green-700",
    },
  ],
  scoreLabel: "Points",
  displayFormat: "simple",
};

// Get sport configuration (case-insensitive)
export const getSportConfig = (sport) => {
  if (!sport) return defaultSportConfig;

  // Try exact match first
  if (unifiedSportConfig[sport]) {
    return unifiedSportConfig[sport];
  }

  // Try case-insensitive match
  const sportKey = Object.keys(unifiedSportConfig).find(
    (key) => key.toLowerCase() === sport.toLowerCase()
  );

  return sportKey ? unifiedSportConfig[sportKey] : defaultSportConfig;
};

// Legacy compatibility functions
export const sportDefinitions = unifiedSportConfig;

// Legacy getSportScoringConfig with buttons conversion for TempLiveScoring
export const getSportScoringConfig = (sport) => {
  const config = getSportConfig(sport);

  // Convert actions to buttons for legacy TempLiveScoring component
  if (config.actions && !config.buttons) {
    const buttons = config.actions.map((action) => ({
      value: action.value || 0,
      label: action.label,
      color: action.color,
      isWicket: action.type === "wicket",
    }));

    return {
      ...config,
      buttons,
    };
  }

  return config;
};
