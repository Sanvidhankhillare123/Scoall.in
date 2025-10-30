// Test cricket scoring logic
const inningsScores = {
  innings1: { team: "team1", runs: 36, wickets: 1 },
  innings2: { team: "team2", runs: 24, wickets: 0 },
};

function getCricketScores() {
  // For cricket, use innings data to get correct team scores
  const team1Score =
    inningsScores.innings1.team === "team1"
      ? inningsScores.innings1.runs
      : inningsScores.innings2.runs;
  const team1Wickets =
    inningsScores.innings1.team === "team1"
      ? inningsScores.innings1.wickets
      : inningsScores.innings2.wickets;

  const team2Score =
    inningsScores.innings1.team === "team2"
      ? inningsScores.innings1.runs
      : inningsScores.innings2.runs;
  const team2Wickets =
    inningsScores.innings1.team === "team2"
      ? inningsScores.innings1.wickets
      : inningsScores.innings2.wickets;

  return {
    team1Score,
    team1Wickets,
    team2Score,
    team2Wickets,
  };
}

const result = getCricketScores();
console.log("Cricket Score Test:");
console.log(
  "Team 1:",
  result.team1Score,
  "runs,",
  result.team1Wickets,
  "wickets"
);
console.log(
  "Team 2:",
  result.team2Score,
  "runs,",
  result.team2Wickets,
  "wickets"
);
console.log(
  "Winner:",
  result.team1Score > result.team2Score ? "Team 1" : "Team 2"
);
