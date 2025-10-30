// Test cricket score formatting
function formatCricketScore(runs, wickets, totalBalls) {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  const oversDisplay = balls > 0 ? `${overs}.${balls}` : `${overs}`;
  return `${runs}/${wickets} (${oversDisplay} ov)`;
}

// Test cases
console.log("Cricket Score Formatting Tests:");
console.log("6 runs, 1 wicket, 7 balls:", formatCricketScore(6, 1, 7)); // Should show: 6/1 (1.1 ov)
console.log("0 runs, 0 wickets, 0 balls:", formatCricketScore(0, 0, 0)); // Should show: 0/0 (0 ov)
console.log("25 runs, 3 wickets, 18 balls:", formatCricketScore(25, 3, 18)); // Should show: 25/3 (3 ov)
console.log("50 runs, 5 wickets, 35 balls:", formatCricketScore(50, 5, 35)); // Should show: 50/5 (5.5 ov)
