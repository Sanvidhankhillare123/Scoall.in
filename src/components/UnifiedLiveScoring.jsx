import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  ShieldX,
  Trophy,
  Users,
  RotateCcw,
  BarChart3,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { getSportConfig } from "../unifiedSportConfig.js";
import MatchComplete from "./MatchComplete";

export default function UnifiedLiveScoring() {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState(null);
  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTemporaryMatch, setIsTemporaryMatch] = useState(false);

  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [secondaryScore, setSecondaryScore] = useState({ teamA: 0, teamB: 0 });
  const [events, setEvents] = useState([]);
  const [justScored, setJustScored] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [showBowlerSelection, setShowBowlerSelection] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [playerStats, setPlayerStats] = useState({
    team1: {},
    team2: {},
  });

  // Cricket-specific state
  const [currentBatsmen, setCurrentBatsmen] = useState({
    striker: null,
    nonStriker: null,
    team: null, // 'team1' or 'team2'
  });
  const [currentBowler, setCurrentBowler] = useState(null);
  const [bowlingTeam, setBowlingTeam] = useState("team2"); // Opposite of batting team
  // Use a single source of truth to avoid drift: total legal balls bowled to each team
  const [totalLegalBalls, setTotalLegalBalls] = useState({
    team1: 0,
    team2: 0,
  });
  const [ballByBall, setBallByBall] = useState([]); // Track each ball
  const [showScorecard, setShowScorecard] = useState(false);
  const [battingTeam, setBattingTeam] = useState("team1"); // Current batting team
  const [lastOverBowler, setLastOverBowler] = useState(null);
  const [currentInnings, setCurrentInnings] = useState(1); // Track which innings (1 or 2)
  const [firstInningsComplete, setFirstInningsComplete] = useState(false);
  const [inningsScores, setInningsScores] = useState({
    innings1: { team: "team1", runs: 0, wickets: 0, overs: 0 },
    innings2: { team: "team2", runs: 0, wickets: 0, overs: 0 },
  });

  // New: Pre-match cricket setup (toss + openers)
  const [showCricketSetup, setShowCricketSetup] = useState(false);
  const [tossWinner, setTossWinner] = useState(null); // 'team1' | 'team2'
  const [tossDecision, setTossDecision] = useState(null); // 'bat' | 'bowl'
  const [setupStep, setSetupStep] = useState(1);
  const [selectedStriker, setSelectedStriker] = useState("");
  const [selectedNonStriker, setSelectedNonStriker] = useState("");
  const [selectedBowler, setSelectedBowler] = useState("");

  const scoreRef = useRef(score);

  useEffect(() => {
    const loadMatchData = async () => {
      try {
        // Check if it's a temporary match
        if (matchId?.startsWith("temp_")) {
          setIsTemporaryMatch(true);
          await loadTemporaryMatch();
        } else if (matchId) {
          setIsTemporaryMatch(false);
          await loadDatabaseMatch();
        } else if (location.state?.matchData) {
          setIsTemporaryMatch(true);
          await setupQuickMatch();
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading match data:", error);
        toast.error("Could not load match data");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [matchId, location.state, navigate]);

  const loadTemporaryMatch = async () => {
    const matchData = localStorage.getItem(`tempMatch_${matchId}`);
    if (matchData) {
      const parsedMatch = JSON.parse(matchData);
      console.log("Loading temporary match data:", parsedMatch); // Debug log
      setMatchData(parsedMatch);
      setSport(parsedMatch.sport);
      setScore({
        teamA: parsedMatch.score1 || 0,
        teamB: parsedMatch.score2 || 0,
      });
      setSecondaryScore({
        teamA: parsedMatch.wickets1 || 0,
        teamB: parsedMatch.wickets2 || 0,
      });

      // Calculate elapsed time
      const startTime = new Date(parsedMatch.startTime);
      const now = new Date();
      setElapsedTime(Math.floor((now - startTime) / 1000));

      // Initialize player stats if team players exist
      initializePlayerStats(parsedMatch);

      // If cricket team match with players, show setup
      if (
        parsedMatch.sport === "Cricket" &&
        parsedMatch.matchType === "team" &&
        (parsedMatch.team1Players?.length || 0) >= 2 &&
        (parsedMatch.team2Players?.length || 0) >= 1
      ) {
        setShowCricketSetup(true);
      }

      addEvent("Match loaded.");
    } else {
      throw new Error("Temporary match not found");
    }
  };

  const loadDatabaseMatch = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "*, team1:teams!matches_team1_id_fkey(name), team2:teams!matches_team2_id_fkey(name), tournament:tournaments(sport, id)"
      )
      .eq("id", matchId)
      .single();

    if (error) throw error;

    setMatchData(data);
    setSport(data.tournament.sport);
    setScore({
      teamA: data.team1_score || 0,
      teamB: data.team2_score || 0,
    });
    setSecondaryScore({
      teamA: data.team1_wickets || 0,
      teamB: data.team2_wickets || 0,
    });
    addEvent("Match loaded.");
  };

  const setupQuickMatch = async () => {
    const { sport: quickSport, matchData: quickMatchData } = location.state;
    setSport(quickSport);
    setMatchData(quickMatchData);
    initializePlayerStats(quickMatchData);
    addEvent("Match started!");

    // Trigger setup for cricket quick matches
    if (
      quickMatchData.sport === "Cricket" &&
      quickMatchData.matchType === "team" &&
      (quickMatchData.team1Players?.length || 0) >= 2 &&
      (quickMatchData.team2Players?.length || 0) >= 1
    ) {
      setShowCricketSetup(true);
    }
  };

  // Timer effect for temporary matches
  useEffect(() => {
    if (isTemporaryMatch) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isTemporaryMatch]);

  // Score animation effect
  useEffect(() => {
    if (score.teamA !== scoreRef.current.teamA) setJustScored("A");
    else if (score.teamB !== scoreRef.current.teamB) setJustScored("B");

    scoreRef.current = score;
    const timer = setTimeout(() => setJustScored(null), 500);
    return () => clearTimeout(timer);
  }, [score]);

  // Cricket-specific functions
  const handleCricketBall = (
    teamKey,
    action,
    runs = 0,
    deferOverCompletion = false
  ) => {
    const isLegalDelivery = !["wide", "no_ball"].includes(action.id);

    // Compute next counters based on a single running total
    const prevTotal = totalLegalBalls[teamKey] || 0;
    const nextTotal = isLegalDelivery ? prevTotal + 1 : prevTotal;
    const prevOverIdx = Math.floor(prevTotal / 6);
    const nextOverIdx = Math.floor(nextTotal / 6);
    const prevBallIdx = prevTotal % 6; // 0..5
    const nextBallIdx = isLegalDelivery ? (prevBallIdx + 1) % 6 : prevBallIdx; // 0..5
    const overCompleted = isLegalDelivery && nextBallIdx === 0; // completed an over

    // Persist total balls
    if (isLegalDelivery) {
      setTotalLegalBalls((prev) => ({
        ...prev,
        [teamKey]: (prev[teamKey] || 0) + 1,
      }));
    }

    // Log ball-by-ball using the over index of this delivery
    const overForThisBall = prevOverIdx; // e.g., first over is 0
    const ballNumberForThisBall = isLegalDelivery
      ? prevBallIdx + 1
      : prevBallIdx; // show 1..6 for legal deliveries

    setBallByBall((prev) => [
      {
        id: Date.now(),
        over: overForThisBall,
        ball: ballNumberForThisBall,
        bowler: currentBowler,
        batsman: currentBatsmen.striker,
        runs: runs,
        action: action.id || action.label, // Use action.id for consistent matching
        isLegal: isLegalDelivery,
        timestamp: new Date(),
      },
      ...prev,
    ]);

    // Handle end of over effects - but defer if requested (e.g., for wickets)
    if (overCompleted && !deferOverCompletion) {
      // Check if second innings should end before starting new over
      if (
        currentInnings === 2 &&
        firstInningsComplete &&
        (matchData?.sport || sport) === "Cricket"
      ) {
        const firstInningsTotalBalls = inningsScores.innings1.totalBalls;
        const currentTotalBalls = nextTotal; // Use the updated total

        if (currentTotalBalls >= firstInningsTotalBalls) {
          // Second innings completed - don't call handleOverCompletion
          addEvent(`Over ${nextOverIdx} completed`);

          const currentTeamScore =
            battingTeam === "team1" ? score.teamA : score.teamB;
          const target = inningsScores.innings1.runs + 1;

          if (currentTeamScore >= target) {
            const winningTeam =
              battingTeam === "team1"
                ? matchData?.team1 || "Team 1"
                : matchData?.team2 || "Team 2";
            const wicketsRemaining =
              10 -
              (battingTeam === "team1"
                ? secondaryScore.teamA
                : secondaryScore.teamB);
            addEvent(`🏆 ${winningTeam} wins by ${wicketsRemaining} wickets!`);
            toast.success(`🏆 ${winningTeam} wins the match!`);
          } else {
            const firstInningsTeam =
              inningsScores.innings1.team === "team1"
                ? matchData?.team1 || "Team 1"
                : matchData?.team2 || "Team 2";
            const margin = inningsScores.innings1.runs - currentTeamScore;
            const firstInningsOvers = inningsScores.innings1.overs;
            const firstInningsBalls = inningsScores.innings1.balls;
            addEvent(`🏆 ${firstInningsTeam} wins by ${margin} runs!`);
            addEvent(
              `Innings completed in ${firstInningsOvers}.${firstInningsBalls} overs - target not achieved`
            );
            toast.success(`🏆 ${firstInningsTeam} wins the match!`);
          }

          // Auto-end the match
          setTimeout(() => {
            try {
              if (isTemporaryMatch) {
                setShowComplete(true);
              } else {
                handleEndMatch();
              }
            } catch (error) {
              console.error("Error ending match:", error);
              toast.error("Error ending match. Please manually end the match.");
            }
          }, 2000);

          return { overCompleted, nextOverIdx, matchEnded: true };
        }
      }

      // Regular over completion
      handleOverCompletion(nextOverIdx);
    }

    // Return whether an over was completed for external handling
    return { overCompleted, nextOverIdx };
  };

  const handleOverCompletion = (nextOverIdx) => {
    addEvent(`Over ${nextOverIdx} completed`);

    // Regular over completion - switch strike and select new bowler
    switchStrike();
    setLastOverBowler(currentBowler);
    setCurrentBowler(null);
    setShowBowlerSelection(true);
    addEvent("Select a new bowler for the next over (no consecutive overs)");
  };

  const handleDeferredOverCompletion = (ballResult) => {
    if (!ballResult?.overCompleted) return;

    // Check if second innings should end before starting new over
    if (
      currentInnings === 2 &&
      firstInningsComplete &&
      (matchData?.sport || sport) === "Cricket"
    ) {
      const firstInningsTotalBalls = inningsScores.innings1.totalBalls;
      const currentTotalBalls = totalLegalBalls[battingTeam] || 0;

      if (currentTotalBalls >= firstInningsTotalBalls) {
        // Second innings completed - don't call handleOverCompletion
        addEvent(`Over ${ballResult.nextOverIdx} completed`);

        const currentTeamScore =
          battingTeam === "team1" ? score.teamA : score.teamB;
        const target = inningsScores.innings1.runs + 1;

        if (currentTeamScore >= target) {
          const winningTeam =
            battingTeam === "team1"
              ? matchData?.team1 || "Team 1"
              : matchData?.team2 || "Team 2";
          const wicketsRemaining =
            10 -
            (battingTeam === "team1"
              ? secondaryScore.teamA
              : secondaryScore.teamB);
          addEvent(`🏆 ${winningTeam} wins by ${wicketsRemaining} wickets!`);
          toast.success(`🏆 ${winningTeam} wins the match!`);
        } else {
          const firstInningsTeam =
            inningsScores.innings1.team === "team1"
              ? matchData?.team1 || "Team 1"
              : matchData?.team2 || "Team 2";
          const margin = inningsScores.innings1.runs - currentTeamScore;
          const firstInningsOvers = inningsScores.innings1.overs;
          const firstInningsBalls = inningsScores.innings1.balls;
          addEvent(`🏆 ${firstInningsTeam} wins by ${margin} runs!`);
          addEvent(
            `Innings completed in ${firstInningsOvers}.${firstInningsBalls} overs - target not achieved`
          );
          toast.success(`🏆 ${firstInningsTeam} wins the match!`);
        }

        // Auto-end the match
        setTimeout(() => {
          try {
            if (isTemporaryMatch) {
              setShowComplete(true);
            } else {
              handleEndMatch();
            }
          } catch (error) {
            console.error("Error ending match:", error);
            toast.error("Error ending match. Please manually end the match.");
          }
        }, 2000);
        return;
      }
    }

    // Regular over completion
    handleOverCompletion(ballResult.nextOverIdx);
  };

  const selectCurrentBatsmen = (teamKey) => {
    const teamPlayers = matchData?.[`${teamKey}Players`] || [];
    console.log(`Selecting batsmen for ${teamKey}:`, teamPlayers); // Debug log
    if (teamPlayers.length >= 2) {
      setCurrentBatsmen({
        striker: teamPlayers[0],
        nonStriker: teamPlayers[1],
        team: teamKey,
      });
      setBattingTeam(teamKey);

      // Set bowling team as opposite
      const bowlingTeamKey = teamKey === "team1" ? "team2" : "team1";
      setBowlingTeam(bowlingTeamKey);

      // Select first bowler from bowling team
      const bowlingPlayers = matchData?.[`${bowlingTeamKey}Players`] || [];
      if (bowlingPlayers.length > 0 && !currentBowler) {
        setCurrentBowler(bowlingPlayers[0]);
      }

      console.log(
        `Set batsmen - Striker: ${teamPlayers[0]}, Non-striker: ${teamPlayers[1]}`
      ); // Debug log
      console.log(
        `Bowling team: ${bowlingTeamKey}, Bowler: ${bowlingPlayers[0]}`
      ); // Debug log
    } else {
      console.log(`Not enough players in ${teamKey} to set batsmen`); // Debug log
    }
  };

  const switchStrike = () => {
    if (currentBatsmen.striker && currentBatsmen.nonStriker) {
      setCurrentBatsmen((prev) => ({
        ...prev,
        striker: prev.nonStriker,
        nonStriker: prev.striker,
      }));
    }
  };

  const selectNewBatsman = (teamKey, replacedPlayer, ballResult = null) => {
    console.log("selectNewBatsman called with:", {
      teamKey,
      replacedPlayer,
      ballResult,
    });
    const teamPlayers = matchData?.[`${teamKey}Players`] || [];
    const availablePlayers = teamPlayers.filter(
      (player) =>
        player !== replacedPlayer &&
        player !== currentBatsmen.striker &&
        player !== currentBatsmen.nonStriker &&
        (!playerStats[teamKey][player] || !playerStats[teamKey][player].isOut)
    );

    console.log("Available players for new batsman:", availablePlayers);

    if (availablePlayers.length > 0) {
      // Show player selection modal for new batsman
      console.log("Setting up new batsman selection modal");
      setPendingAction({
        action: { type: "new_batsman", label: "New Batsman" },
        team: teamKey === "team1" ? "A" : "B",
        teamKey,
        actionType: "new_batsman",
        replacedPlayer,
        ballResult, // Pass the ball result to handle over completion after batsman selection
      });
      setShowPlayerSelection(true);
    } else {
      // No players available - end of innings or match
      console.log("No more batsmen available!");
      toast.error("No more batsmen available!");

      // Still handle over completion if it was deferred
      if (ballResult?.overCompleted) {
        handleDeferredOverCompletion(ballResult);
      }
    }
  };

  const addEvent = (text) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setEvents((prevEvents) => [{ time, text, id: Date.now() }, ...prevEvents]);
  };

  const initializePlayerStats = (matchData) => {
    console.log("Initializing player stats for:", matchData); // Debug log
    if (!matchData || matchData.matchType === "individual") {
      console.log("Skipping player stats - individual match or no data"); // Debug log
      return;
    }

    const team1Stats = {};
    const team2Stats = {};

    // Initialize stats for each player based on sport
    const initPlayerForSport = (playerName) => {
      const baseStats = {
        name: playerName,
      };

      switch (matchData.sport || sport) {
        case "Cricket":
          return {
            ...baseStats,
            runs: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            isOut: false,
          };
        case "Basketball":
          return {
            ...baseStats,
            points: 0,
            freeThrows: 0,
            twoPointers: 0,
            threePointers: 0,
            fouls: 0,
          };
        case "Football":
          return {
            ...baseStats,
            goals: 0,
            yellowCards: 0,
            redCards: 0,
            substitutions: 0,
          };
        default:
          return {
            ...baseStats,
            points: 0,
            events: 0,
          };
      }
    };

    if (matchData.team1Players && matchData.team1Players.length > 0) {
      matchData.team1Players.forEach((player) => {
        team1Stats[player] = initPlayerForSport(player);
      });
      console.log("Initialized team1 stats:", team1Stats); // Debug log
    }

    if (matchData.team2Players && matchData.team2Players.length > 0) {
      matchData.team2Players.forEach((player) => {
        team2Stats[player] = initPlayerForSport(player);
      });
      console.log("Initialized team2 stats:", team2Stats); // Debug log
    }

    setPlayerStats({
      team1: team1Stats,
      team2: team2Stats,
    });

    // For cricket we will run a guided setup (toss + openers), so don't auto-select here
  };

  const updatePlayerStats = (team, action, playerName = null) => {
    if (!playerName || !playerStats[team][playerName]) return;

    const updatedStats = { ...playerStats };
    const player = updatedStats[team][playerName];

    switch (matchData?.sport || sport) {
      case "Cricket":
        if (action.type === "point" && action.value > 0) {
          player.runs += action.value;
          player.ballsFaced += 1;

          if (action.value === 4) player.fours += 1;
          if (action.value === 6) player.sixes += 1;

          player.strikeRate =
            player.ballsFaced > 0
              ? ((player.runs / player.ballsFaced) * 100).toFixed(2)
              : 0;
        } else if (action.id === "dot") {
          player.ballsFaced += 1;
          player.strikeRate =
            player.ballsFaced > 0
              ? ((player.runs / player.ballsFaced) * 100).toFixed(2)
              : 0;
        } else if (action.type === "wicket") {
          player.isOut = true;
          // New batsman selection is orchestrated by the wicket flow handler
        }
        break;

      case "Basketball":
        if (action.type === "point") {
          player.points += action.value;
          if (action.id === "1_point") player.freeThrows += 1;
          if (action.id === "2_points") player.twoPointers += 1;
          if (action.id === "3_points") player.threePointers += 1;
        } else if (action.id === "foul") {
          player.fouls += 1;
        }
        break;

      case "Football":
        if (action.id === "goal") {
          player.goals += 1;
        } else if (action.id === "yellow_card") {
          player.yellowCards += 1;
        } else if (action.id === "red_card") {
          player.redCards += 1;
        } else if (action.id === "substitution") {
          player.substitutions += 1;
        }
        break;

      default:
        if (action.type === "point") {
          player.points += action.value || 1;
        }
        player.events += 1;
        break;
    }

    setPlayerStats(updatedStats);
  };

  const saveMatchData = async (newScore, newSecondaryScore) => {
    if (isTemporaryMatch) {
      // Save to localStorage
      const updatedMatch = {
        ...matchData,
        score1: newScore.teamA,
        score2: newScore.teamB,
        wickets1: newSecondaryScore.teamA,
        wickets2: newSecondaryScore.teamB,
      };
      setMatchData(updatedMatch);
      localStorage.setItem(
        `tempMatch_${matchId}`,
        JSON.stringify(updatedMatch)
      );
    } else if (matchId) {
      // Save to database
      const { error } = await supabase
        .from("matches")
        .update({
          team1_score: newScore.teamA,
          team2_score: newScore.teamB,
          team1_wickets: newSecondaryScore.teamA,
          team2_wickets: newSecondaryScore.teamB,
          status: "Live",
        })
        .eq("id", matchData.id);

      if (error) throw error;
    }
  };

  const handleAction = async (action, team) => {
    const currentSport = matchData?.sport || sport;

    // Block actions until cricket setup completed
    if (
      currentSport === "Cricket" &&
      isTemporaryMatch &&
      matchData?.matchType === "team" &&
      showCricketSetup
    ) {
      toast.error("Complete toss and opening selections first");
      setShowCricketSetup(true);
      return;
    }

    // Special cricket handling with proper logic
    if (
      currentSport === "Cricket" &&
      isTemporaryMatch &&
      matchData?.matchType === "team"
    ) {
      const teamKey = team === "A" ? "team1" : "team2";

      // Ensure this is the batting team for batting actions
      if (
        battingTeam !== teamKey &&
        (action.type === "point" || action.id === "dot")
      ) {
        toast.error("Please select the batting team");
        return;
      }

      // Check if bowler is selected before any ball
      if (
        !currentBowler &&
        (action.type === "point" ||
          action.id === "dot" ||
          action.type === "wicket" ||
          ["wide", "no_ball", "bye", "leg_bye"].includes(action.id))
      ) {
        // Show bowler selection first
        setShowBowlerSelection(true);
        setPendingAction({ action, team, teamKey });
        return;
      }

      // Check if second innings should end before allowing more balls
      if (currentInnings === 2 && firstInningsComplete) {
        const isLegalDelivery = !["wide", "no_ball"].includes(action.id);
        if (isLegalDelivery) {
          const currentTotalBalls = totalLegalBalls[teamKey] || 0;
          const firstInningsTotalBalls = inningsScores.innings1.totalBalls;

          if (currentTotalBalls >= firstInningsTotalBalls) {
            // Second innings should end - same number of balls as first innings
            const currentTeamScore =
              teamKey === "team1" ? score.teamA : score.teamB;
            const target = inningsScores.innings1.runs + 1;

            if (currentTeamScore >= target) {
              const winningTeam =
                battingTeam === "team1"
                  ? matchData?.team1 || "Team 1"
                  : matchData?.team2 || "Team 2";
              const wicketsRemaining =
                10 -
                (teamKey === "team1"
                  ? secondaryScore.teamA
                  : secondaryScore.teamB);
              addEvent(
                `🏆 ${winningTeam} wins by ${wicketsRemaining} wickets!`
              );
              toast.success(`🏆 ${winningTeam} wins the match!`);
            } else {
              const firstInningsTeam =
                inningsScores.innings1.team === "team1"
                  ? matchData?.team1 || "Team 1"
                  : matchData?.team2 || "Team 2";
              const margin = inningsScores.innings1.runs - currentTeamScore;
              const firstInningsOvers = inningsScores.innings1.overs;
              const firstInningsBalls = inningsScores.innings1.balls;
              addEvent(`🏆 ${firstInningsTeam} wins by ${margin} runs!`);
              addEvent(
                `Innings completed in ${firstInningsOvers}.${firstInningsBalls} overs - target not achieved`
              );
              toast.success(`🏆 ${firstInningsTeam} wins the match!`);
            }

            // Auto-end the match
            setTimeout(() => {
              handleEndMatch();
            }, 2000);
            return; // Don't process this ball
          }
        }
      }

      // Handle different cricket actions
      if (action.type === "point" || action.id === "dot") {
        // For runs and dots, use current striker automatically - NO PLAYER SELECTION
        if (currentBatsmen.striker && currentBatsmen.team === teamKey) {
          await executeAction(action, team, currentBatsmen.striker);

          // Switch strike for odd runs (1, 3, 5)
          if (action.value && action.value % 2 === 1) {
            switchStrike();
          }

          // Handle ball count and overs
          handleCricketBall(teamKey, action, action.value || 0);
          return;
        } else {
          toast.error("No current batsmen found");
          return;
        }
      }

      // For wickets, show player selection to choose who got out (bowler is auto-credited)
      if (action.type === "wicket") {
        console.log("Wicket action triggered");

        // Check if second innings should end before allowing more balls
        if (currentInnings === 2 && firstInningsComplete) {
          const currentTotalBalls = totalLegalBalls[teamKey] || 0;
          const firstInningsTotalBalls = inningsScores.innings1.totalBalls;

          if (currentTotalBalls >= firstInningsTotalBalls) {
            // Second innings should end - same number of balls as first innings
            const currentTeamScore =
              teamKey === "team1" ? score.teamA : score.teamB;
            const target = inningsScores.innings1.runs + 1;

            if (currentTeamScore >= target) {
              const winningTeam =
                battingTeam === "team1"
                  ? matchData?.team1 || "Team 1"
                  : matchData?.team2 || "Team 2";
              const wicketsRemaining =
                10 -
                (teamKey === "team1"
                  ? secondaryScore.teamA
                  : secondaryScore.teamB);
              addEvent(
                `🏆 ${winningTeam} wins by ${wicketsRemaining} wickets!`
              );
              toast.success(`🏆 ${winningTeam} wins the match!`);
            } else {
              const firstInningsTeam =
                inningsScores.innings1.team === "team1"
                  ? matchData?.team1 || "Team 1"
                  : matchData?.team2 || "Team 2";
              const margin = inningsScores.innings1.runs - currentTeamScore;
              const firstInningsOvers = inningsScores.innings1.overs;
              const firstInningsBalls = inningsScores.innings1.balls;
              addEvent(`🏆 ${firstInningsTeam} wins by ${margin} runs!`);
              addEvent(
                `Innings completed in ${firstInningsOvers}.${firstInningsBalls} overs - target not achieved`
              );
              toast.success(`🏆 ${firstInningsTeam} wins the match!`);
            }

            // Auto-end the match
            setTimeout(() => {
              handleEndMatch();
            }, 2000);
            return; // Don't process this ball
          }
        }

        // Ensure we have a current bowler before processing wicket
        if (!currentBowler) {
          toast.error("Please select a bowler first");
          return;
        }

        console.log("Setting up wicket batsman selection");
        setPendingAction({
          action,
          team,
          teamKey,
          actionType: "wicket_batsman", // Ask which batsman got out
        });
        setShowPlayerSelection(true);
        return;
      }

      // For extras (wide, no ball, bye, leg bye)
      if (["wide", "no_ball", "bye", "leg_bye"].includes(action.id)) {
        // Extras go to team total, not individual player
        await executeAction(action, team, null);

        // Handle ball count (wides and no balls don't count as legal deliveries)
        handleCricketBall(teamKey, action, action.value || 0);
        return;
      }
    }

    // For team sports with team players, show player selection modal for relevant actions
    if (isTemporaryMatch && matchData?.matchType === "team") {
      const teamKey = team === "A" ? "team1" : "team2";
      const teamPlayers = matchData?.[`${teamKey}Players`] || [];

      // Show player selection for scoring actions and major events
      const shouldShowPlayerSelection =
        (currentSport === "Cricket" &&
          (action.type === "point" ||
            action.id === "dot" ||
            action.type === "wicket")) ||
        (currentSport === "Basketball" && action.type === "point") ||
        (currentSport === "Football" &&
          (action.id === "goal" ||
            action.id === "yellow_card" ||
            action.id === "red_card")) ||
        (currentSport !== "Cricket" &&
          currentSport !== "Basketball" &&
          currentSport !== "Football" &&
          action.type === "point");

      if (teamPlayers.length > 0 && shouldShowPlayerSelection) {
        setPendingAction({ action, team, teamKey });
        setShowPlayerSelection(true);
        return;
      }
    }

    await executeAction(action, team);
  };

  // Helpers for cricket setup
  const computeInningsFromToss = () => {
    if (!tossWinner || !tossDecision) return;
    const batting =
      tossDecision === "bat"
        ? tossWinner
        : tossWinner === "team1"
        ? "team2"
        : "team1";
    const bowling = batting === "team1" ? "team2" : "team1";
    setBattingTeam(batting);
    setBowlingTeam(bowling);
  };

  useEffect(() => {
    if (tossWinner && tossDecision) computeInningsFromToss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tossWinner, tossDecision]);

  const confirmCricketSetup = () => {
    const battingPlayers = matchData?.[`${battingTeam}Players`] || [];
    const bowlingPlayers = matchData?.[`${bowlingTeam}Players`] || [];

    if (!tossWinner || !tossDecision) {
      toast.error("Select toss result first");
      setSetupStep(1);
      return;
    }
    if (!selectedStriker || !selectedNonStriker) {
      toast.error("Select both opening batsmen");
      setSetupStep(3);
      return;
    }
    if (selectedStriker === selectedNonStriker) {
      toast.error("Striker and non-striker must be different players");
      setSetupStep(3);
      return;
    }
    if (!selectedBowler) {
      toast.error("Select opening bowler");
      setSetupStep(4);
      return;
    }

    if (
      !battingPlayers.includes(selectedStriker) ||
      !battingPlayers.includes(selectedNonStriker)
    ) {
      toast.error("Selected batsmen must be from batting team");
      setSetupStep(3);
      return;
    }
    if (!bowlingPlayers.includes(selectedBowler)) {
      toast.error("Selected bowler must be from bowling team");
      setSetupStep(4);
      return;
    }

    // Apply selections
    setCurrentBatsmen({
      striker: selectedStriker,
      nonStriker: selectedNonStriker,
      team: battingTeam,
    });
    setCurrentBowler(selectedBowler);
    addEvent(
      `${getParticipantName(
        battingTeam === "team1" ? 1 : 2
      )} to bat first. Openers: ${selectedStriker} and ${selectedNonStriker}. ${selectedBowler} to bowl.`
    );
    setShowCricketSetup(false);
  };

  const renderCricketSetupModal = () => {
    if (!showCricketSetup || (matchData?.sport || sport) !== "Cricket")
      return null;

    const team1Players = matchData?.team1Players || [];
    const team2Players = matchData?.team2Players || [];
    const team1Name = getParticipantName(1);
    const team2Name = getParticipantName(2);

    const battingPlayers = battingTeam
      ? matchData?.[`${battingTeam}Players`] || []
      : [];
    const bowlingPlayers = bowlingTeam
      ? matchData?.[`${bowlingTeam}Players`] || []
      : [];

    const StepIndicator = () => (
      <div className="flex items-center justify-center gap-2 text-xs text-slate-300 mb-4">
        {currentInnings === 1
          ? // First innings: 4 steps (toss winner, toss decision, batsmen, bowler)
            [1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`w-6 h-1 rounded ${
                  setupStep >= n ? "bg-blue-500" : "bg-slate-600"
                }`}
              />
            ))
          : // Second innings: 2 steps (batsmen, bowler)
            [3, 4].map((n) => (
              <div
                key={n}
                className={`w-6 h-1 rounded ${
                  setupStep >= n ? "bg-blue-500" : "bg-slate-600"
                }`}
              />
            ))}
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl max-w-xl w-full shadow-2xl ring-1 ring-black/20">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">
              {currentInnings === 1
                ? "Cricket Match Setup"
                : "Second Innings Setup"}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              {currentInnings === 1
                ? "Complete toss and opening selections before scoring."
                : "Select opening batsmen and bowler for the second innings."}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <StepIndicator />

            {setupStep === 1 && currentInnings === 1 && (
              <div>
                <h3 className="font-semibold mb-3 text-white">
                  Who won the toss?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setTossWinner("team1");
                      setSetupStep(2);
                    }}
                    className={`p-3 rounded-lg border text-white ${
                      tossWinner === "team1"
                        ? "bg-blue-600/30 border-blue-500 text-blue-200"
                        : "bg-slate-800/90 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    {team1Name}
                  </button>
                  <button
                    onClick={() => {
                      setTossWinner("team2");
                      setSetupStep(2);
                    }}
                    className={`p-3 rounded-lg border text-white ${
                      tossWinner === "team2"
                        ? "bg-blue-600/30 border-blue-500 text-blue-200"
                        : "bg-slate-800/90 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    {team2Name}
                  </button>
                </div>
              </div>
            )}

            {setupStep === 2 && currentInnings === 1 && (
              <div>
                <h3 className="font-semibold mb-3 text-white">
                  Toss decision by{" "}
                  {tossWinner === "team1" ? team1Name : team2Name}?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setTossDecision("bat");
                      setSetupStep(3);
                    }}
                    className={`p-3 rounded-lg border text-white ${
                      tossDecision === "bat"
                        ? "bg-green-600/30 border-green-500 text-green-200"
                        : "bg-slate-800/90 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    Bat
                  </button>
                  <button
                    onClick={() => {
                      setTossDecision("bowl");
                      setSetupStep(3);
                    }}
                    className={`p-3 rounded-lg border text-white ${
                      tossDecision === "bowl"
                        ? "bg-red-600/30 border-red-500 text-red-200"
                        : "bg-slate-800/90 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    Bowl
                  </button>
                </div>
                {tossWinner && tossDecision && (
                  <p className="text-xs text-slate-300 mt-3">
                    {tossDecision === "bat"
                      ? tossWinner === "team1"
                        ? team1Name
                        : team2Name
                      : tossWinner === "team1"
                      ? team2Name
                      : team1Name}{" "}
                    will bat first.
                  </p>
                )}
              </div>
            )}

            {setupStep === 3 && (
              <div>
                <h3 className="font-semibold mb-3 text-white">
                  Select opening batsmen (
                  {battingTeam === "team1" ? team1Name : team2Name})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                    <div className="text-xs text-slate-300 mb-2">Striker</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {battingPlayers.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedStriker(p)}
                          className={`w-full text-left p-2 rounded border text-white ${
                            selectedStriker === p
                              ? "bg-green-600/30 border-green-500 text-green-200"
                              : selectedNonStriker === p
                              ? "opacity-50 cursor-not-allowed border-slate-700/60"
                              : "bg-slate-900/80 border-slate-700/60 hover:bg-slate-800/80"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                    <div className="text-xs text-slate-300 mb-2">
                      Non-striker
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {battingPlayers.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedNonStriker(p)}
                          className={`w-full text-left p-2 rounded border text-white ${
                            selectedNonStriker === p
                              ? "bg-yellow-600/30 border-yellow-500 text-yellow-200"
                              : selectedStriker === p
                              ? "opacity-50 cursor-not-allowed border-slate-700/60"
                              : "bg-slate-900/80 border-slate-700/60 hover:bg-slate-800/80"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 4 && (
              <div>
                <h3 className="font-semibold mb-3 text-white">
                  Select opening bowler (
                  {bowlingTeam === "team1" ? team1Name : team2Name})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bowlingPlayers.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBowler(p)}
                      className={`w-full text-left p-2 rounded border text-white ${
                        selectedBowler === p
                          ? "bg-blue-600/30 border-blue-500 text-blue-200"
                          : "bg-slate-900/80 border-slate-700/60 hover:bg-slate-800/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setSetupStep(Math.max(1, setupStep - 1))}
                className="px-3 py-2 text-sm bg-slate-700/50 rounded text-white hover:bg-slate-700"
              >
                Back
              </button>
              {setupStep < 4 ? (
                <button
                  onClick={() => setSetupStep(setupStep + 1)}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={confirmCricketSetup}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 rounded text-white"
                >
                  Start Match
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const executeAction = async (action, team, selectedPlayer = null) => {
    const teamName = isTemporaryMatch
      ? team === "A"
        ? getParticipantName(1)
        : getParticipantName(2)
      : team === "A"
      ? matchData.team1.name
      : matchData.team2.name;

    const eventText = selectedPlayer
      ? `${action.label} by ${selectedPlayer} (${teamName})`
      : `${action.label} for ${teamName}`;
    addEvent(eventText);

    // Update player stats if applicable
    if (selectedPlayer && isTemporaryMatch && matchData?.matchType === "team") {
      const teamKey = team === "A" ? "team1" : "team2";
      updatePlayerStats(teamKey, action, selectedPlayer);
    }

    try {
      if (action.type === "wicket") {
        const newSecondaryScore = {
          ...secondaryScore,
          [team === "A" ? "teamA" : "teamB"]:
            secondaryScore[team === "A" ? "teamA" : "teamB"] + 1,
        };
        setSecondaryScore(newSecondaryScore);
        await saveMatchData(score, newSecondaryScore);

        // Check if all wickets are lost in second innings (Cricket only)
        if (
          (matchData?.sport || sport) === "Cricket" &&
          currentInnings === 2 &&
          firstInningsComplete
        ) {
          const currentTeamWickets =
            team === "A" ? newSecondaryScore.teamA : newSecondaryScore.teamB;
          const currentTeamScore = team === "A" ? score.teamA : score.teamB;
          const target = inningsScores.innings1.runs + 1;

          if (currentTeamWickets >= 10) {
            // All out! Check if target was achieved
            if (currentTeamScore >= target) {
              const winningTeam =
                battingTeam === "team1"
                  ? matchData?.team1 || "Team 1"
                  : matchData?.team2 || "Team 2";
              addEvent(
                `🏆 ${winningTeam} wins! Target achieved on the last wicket!`
              );
              toast.success(`🏆 ${winningTeam} wins the match!`);
            } else {
              const firstInningsTeam =
                inningsScores.innings1.team === "team1"
                  ? matchData?.team1 || "Team 1"
                  : matchData?.team2 || "Team 2";
              const margin = inningsScores.innings1.runs - currentTeamScore;
              addEvent(`🏆 ${firstInningsTeam} wins by ${margin} runs!`);
              addEvent(
                `Second innings all out for ${currentTeamScore}/${currentTeamWickets}`
              );
              toast.success(`🏆 ${firstInningsTeam} wins the match!`);
            }

            // Auto-end the match after a short delay
            setTimeout(() => {
              handleEndMatch();
            }, 2000);
          }
        }
      } else if (action.type === "point" && action.id !== "dot") {
        // Only score runs for non-dot balls
        const newScore = {
          ...score,
          [team === "A" ? "teamA" : "teamB"]: Math.max(
            0,
            score[team === "A" ? "teamA" : "teamB"] + (action.value || 1)
          ),
        };
        setScore(newScore);
        await saveMatchData(newScore, secondaryScore);

        // Check if target is achieved in second innings (Cricket only)
        if (
          (matchData?.sport || sport) === "Cricket" &&
          currentInnings === 2 &&
          firstInningsComplete
        ) {
          const currentTeamScore =
            team === "A" ? newScore.teamA : newScore.teamB;
          const target = inningsScores.innings1.runs + 1;

          if (currentTeamScore >= target) {
            // Target achieved! End the match
            const winningTeam =
              battingTeam === "team1"
                ? matchData?.team1 || "Team 1"
                : matchData?.team2 || "Team 2";
            const margin = currentTeamScore - inningsScores.innings1.runs;
            const wicketsRemaining =
              10 - (team === "A" ? secondaryScore.teamA : secondaryScore.teamB);

            addEvent(`🏆 ${winningTeam} wins by ${wicketsRemaining} wickets!`);
            addEvent(
              `Target of ${target} achieved with ${margin} run(s) to spare`
            );

            // Auto-end the match after a short delay
            setTimeout(() => {
              handleEndMatch();
            }, 2000);

            toast.success(`🏆 ${winningTeam} wins the match!`);
          }
        }
      } else if (action.id === "dot") {
        // Dot balls don't add to score but are still recorded
        // No score change needed, just save current state to maintain consistency
        await saveMatchData(score, secondaryScore);
      }
    } catch (error) {
      toast.error(`Error saving ${action.label}: ${error.message}`);
      // Revert changes on error
      if (action.type === "wicket") {
        setSecondaryScore(secondaryScore);
      } else {
        setScore(score);
      }
    }
  };

  const handleEndInnings = () => {
    if (currentInnings === 1) {
      // End first innings
      const currentTeamRuns =
        battingTeam === "team1" ? score.teamA : score.teamB;
      const currentTeamWickets =
        battingTeam === "team1" ? secondaryScore.teamA : secondaryScore.teamB;
      const currentTeamOvers = Math.floor(
        (totalLegalBalls[battingTeam] || 0) / 6
      );
      const currentTeamBalls = (totalLegalBalls[battingTeam] || 0) % 6;

      // Store first innings score
      setInningsScores((prev) => ({
        ...prev,
        innings1: {
          team: battingTeam,
          runs: currentTeamRuns,
          wickets: currentTeamWickets,
          overs: currentTeamOvers, // Complete overs only
          balls: currentTeamBalls, // Remaining balls
          totalBalls: totalLegalBalls[battingTeam] || 0, // Total legal deliveries
        },
      }));

      // Switch teams for second innings
      const newBattingTeam = battingTeam === "team1" ? "team2" : "team1";
      const newBowlingTeam = battingTeam === "team1" ? "team1" : "team2";

      setBattingTeam(newBattingTeam);
      setBowlingTeam(newBowlingTeam);
      setCurrentInnings(2);
      setFirstInningsComplete(true);

      // Reset cricket state for second innings
      setCurrentBatsmen({
        striker: null,
        nonStriker: null,
        team: newBattingTeam,
      });
      setCurrentBowler(null);
      setLastOverBowler(null);

      // Reset scores for second innings display (but keep total for comparison)
      const resetScore = { teamA: 0, teamB: 0 };
      const resetSecondaryScore = { teamA: 0, teamB: 0 };
      setScore(resetScore);
      setSecondaryScore(resetSecondaryScore);

      // Clear ball by ball for second innings
      setBallByBall([]);

      addEvent(
        `First innings ended. ${
          battingTeam === "team1"
            ? matchData?.team1 || "Team 1"
            : matchData?.team2 || "Team 2"
        } scored ${currentTeamRuns}/${currentTeamWickets} in ${currentTeamOvers}.${currentTeamBalls} overs`
      );
      addEvent(
        `Second innings begins. ${
          newBattingTeam === "team1"
            ? matchData?.team1 || "Team 1"
            : matchData?.team2 || "Team 2"
        } to bat`
      );

      // Show cricket setup for second innings (select new openers and bowler)
      setShowCricketSetup(true);
      setSetupStep(3); // Skip toss for second innings (start with batsmen selection)

      toast.success("First innings completed! Set up the second innings.");
    } else {
      // Already in second innings, just end the match
      handleEndMatch();
    }
  };

  const handleEndMatch = async () => {
    if (isTemporaryMatch) {
      setShowComplete(true);
      return;
    }

    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "Completed" })
        .eq("id", matchData.id);

      if (error) throw error;
      toast.success("Match has been completed!");
      navigate(`/tournament/${matchData.tournament.id}`);
    } catch (error) {
      toast.error("Error ending match: " + error.message);
    }
  };

  const handleReset = () => {
    if (!isTemporaryMatch) return; // Only allow reset for temp matches

    const resetScore = { teamA: 0, teamB: 0 };
    const resetSecondaryScore = { teamA: 0, teamB: 0 };

    setScore(resetScore);
    setSecondaryScore(resetSecondaryScore);
    setEvents([]);
    setElapsedTime(0);

    const resetMatch = {
      ...matchData,
      score1: 0,
      score2: 0,
      wickets1: 0,
      wickets2: 0,
      startTime: new Date().toISOString(),
    };

    setMatchData(resetMatch);
    localStorage.setItem(`tempMatch_${matchId}`, JSON.stringify(resetMatch));
    addEvent("Match reset");
  };

  const handleBack = () => {
    if (isTemporaryMatch) {
      navigate("/");
    } else {
      navigate(`/tournament/${matchData.tournament.id}`);
    }
  };

  const getParticipantName = (side) => {
    if (!matchData) return "";

    if (matchData.matchType === "individual") {
      return side === 1 ? matchData.player1 : matchData.player2;
    } else {
      return side === 1 ? matchData.team1 : matchData.team2;
    }
  };

  const formatScore = (
    teamScore,
    teamSecondaryScore,
    config,
    teamKey = null
  ) => {
    if (config.displayFormat === "runs-wickets") {
      let scoreText = `${teamScore}/${teamSecondaryScore}`;

      // Add overs for cricket
      if ((matchData?.sport || sport) === "Cricket" && teamKey) {
        const teamOvers = Math.floor((totalLegalBalls[teamKey] || 0) / 6);
        const teamBalls = (totalLegalBalls[teamKey] || 0) % 6;
        const oversText =
          teamBalls > 0 ? `${teamOvers}.${teamBalls}` : `${teamOvers}`;
        scoreText += ` (${oversText})`;
      }

      return scoreText;
    } else if (config.displayFormat === "chess") {
      return "In Progress";
    }
    return teamScore;
  };

  const renderScoreboard = (config) => {
    if (!config.scoreLabel) {
      return (
        <div className="text-xl md:text-3xl font-bold">Match in Progress</div>
      );
    }

    const scoreClassA = `transition-all duration-300 ${
      justScored === "A" ? "text-yellow-400 scale-110" : ""
    }`;
    const scoreClassB = `transition-all duration-300 ${
      justScored === "B" ? "text-yellow-400 scale-110" : ""
    }`;

    // Enhanced cricket scoreboard
    if ((matchData?.sport || sport) === "Cricket") {
      const team1Over = Math.floor((totalLegalBalls.team1 || 0) / 6);
      const team1Ball = (totalLegalBalls.team1 || 0) % 6;
      const team2Over = Math.floor((totalLegalBalls.team2 || 0) / 6);
      const team2Ball = (totalLegalBalls.team2 || 0) % 6;

      return (
        <div className="flex flex-col items-center w-1/3">
          {/* Current Match Status */}
          <div className="text-xs text-slate-400 mb-2">
            {currentInnings === 1
              ? `1st Innings - ${
                  battingTeam === "team1" ? team1Name : team2Name
                } batting`
              : `2nd Innings - ${
                  battingTeam === "team1" ? team1Name : team2Name
                } batting`}
          </div>

          {/* Score Display for Current Innings */}
          <div className="text-center">
            <div
              className={`text-4xl md:text-6xl font-bold mb-2 ${
                battingTeam === "team1" ? scoreClassA : scoreClassB
              }`}
            >
              {battingTeam === "team1" ? score.teamA : score.teamB}/
              {battingTeam === "team1"
                ? secondaryScore.teamA
                : secondaryScore.teamB}
            </div>
            <div className="text-sm text-slate-300">
              {battingTeam === "team1"
                ? `(${team1Over}.${team1Ball} overs)`
                : `(${team2Over}.${team2Ball} overs)`}
            </div>
          </div>

          {/* Target Information for Second Innings */}
          {currentInnings === 2 && firstInningsComplete && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
              <div className="text-sm text-orange-400 font-semibold">
                Target: {inningsScores.innings1.runs + 1}
              </div>
              <div className="text-xs text-slate-400">
                Need{" "}
                {Math.max(
                  0,
                  inningsScores.innings1.runs +
                    1 -
                    (battingTeam === "team1" ? score.teamA : score.teamB)
                )}{" "}
                runs to win
              </div>
            </div>
          )}

          {/* First Innings Summary (if completed) */}
          {currentInnings === 2 && firstInningsComplete && (
            <div className="mt-4 text-xs text-slate-400 text-center">
              <div className="font-semibold">1st Innings:</div>
              <div>
                {inningsScores.innings1.team === "team1"
                  ? team1Name
                  : team2Name}
                : {inningsScores.innings1.runs}/{inningsScores.innings1.wickets}
              </div>
            </div>
          )}

          {/* Current Rate/Required Rate */}
          <div className="mt-4 text-xs text-slate-400 text-center">
            <div>
              CRR:{" "}
              {totalLegalBalls[battingTeam] > 0
                ? (
                    (battingTeam === "team1" ? score.teamA : score.teamB) /
                    (totalLegalBalls[battingTeam] / 6)
                  ).toFixed(2)
                : "0.00"}
            </div>
            {currentInnings === 2 && firstInningsComplete && (
              <div>
                RRR:{" "}
                {totalLegalBalls[battingTeam] > 0
                  ? (
                      Math.max(
                        0,
                        inningsScores.innings1.runs +
                          1 -
                          (battingTeam === "team1" ? score.teamA : score.teamB)
                      ) /
                      ((120 - totalLegalBalls[battingTeam]) / 6)
                    ).toFixed(2)
                  : "0.00"}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Standard scoreboard for other sports
    return (
      <div className="text-4xl md:text-6xl font-bold">
        <span className={scoreClassA}>
          {formatScore(score.teamA, secondaryScore.teamA, config, "team1")}
        </span>
        <span className="mx-2 sm:mx-4">-</span>
        <span className={scoreClassB}>
          {formatScore(score.teamB, secondaryScore.teamB, config, "team2")}
        </span>
      </div>
    );
  };

  const renderPlayerSelectionModal = () => {
    if (!showPlayerSelection || !pendingAction) return null;

    const { action, team, teamKey, actionType } = pendingAction;
    const teamPlayers = matchData?.[`${teamKey}Players`] || [];
    const bowlingTeamKey = teamKey === "team1" ? "team2" : "team1";
    const bowlingPlayers = matchData?.[`${bowlingTeamKey}Players`] || [];
    const teamName = getParticipantName(team === "A" ? 1 : 2);
    const currentSport = matchData?.sport || sport;

    // Determine what we're selecting and available players
    let availablePlayers = teamPlayers;
    let modalTitle = `Select Player - ${action.label}`;
    let isSelectingBowler = false;

    if (currentSport === "Cricket") {
      if (actionType === "wicket_batsman") {
        // For wickets, only show current batsmen to select who got out
        availablePlayers = teamPlayers.filter(
          (player) =>
            player === currentBatsmen.striker ||
            player === currentBatsmen.nonStriker
        );
        modalTitle = "Which batsman got out?";
      } else if (actionType === "new_batsman") {
        // For new batsman selection, show available players (not out, not currently batting)
        availablePlayers = teamPlayers.filter((player) => {
          const playerStat = playerStats[teamKey][player];
          return (
            !playerStat?.isOut &&
            player !== currentBatsmen.striker &&
            player !== currentBatsmen.nonStriker &&
            player !== pendingAction.replacedPlayer
          );
        });
        modalTitle = "Select new batsman";
      } else {
        // For other cricket actions, filter out already out players
        availablePlayers = teamPlayers.filter((player) => {
          const playerStat = playerStats[teamKey][player];
          return !playerStat?.isOut;
        });
      }
    }

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl max-w-md w-full shadow-2xl ring-1 ring-black/20">
          <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
            <button
              onClick={() => {
                setShowPlayerSelection(false);
                setPendingAction(null);
              }}
              className="p-2 hover:bg-slate-700/50 rounded-lg text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <p className="text-slate-300 mb-4">
              {action.type === "wicket"
                ? `Which batsman got out for ${teamName}? (Wicket will be credited to ${currentBowler})`
                : actionType === "new_batsman"
                ? `Select the new batsman for ${teamName}`
                : `Who performed this action for ${teamName}?`}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availablePlayers.map((player, index) => {
                const playerStat = playerStats[teamKey][player];
                const isCurrentBatsman =
                  player === currentBatsmen.striker ||
                  player === currentBatsmen.nonStriker;
                const isStriker = player === currentBatsmen.striker;

                return (
                  <button
                    key={index}
                    onClick={async () => {
                      if (
                        currentSport === "Cricket" &&
                        actionType === "wicket_batsman"
                      ) {
                        // Wicket handling: auto-credit to current bowler
                        // Execute the wicket action (this updates player stats)
                        await executeAction(action, team, player);

                        // Log ball for wicket (legal delivery) but defer over completion
                        const ballResult = handleCricketBall(
                          teamKey,
                          action,
                          0,
                          true
                        );

                        // Close current modal and set pending action to null temporarily
                        setShowPlayerSelection(false);
                        setPendingAction(null);

                        // Use setTimeout to ensure state updates properly before opening new batsman selection
                        setTimeout(() => {
                          selectNewBatsman(teamKey, player, ballResult);
                        }, 100);
                      } else if (
                        currentSport === "Cricket" &&
                        actionType === "new_batsman"
                      ) {
                        // New batsman selection
                        setShowPlayerSelection(false);

                        const replacedPlayer = pendingAction.replacedPlayer;
                        const ballResult = pendingAction.ballResult;

                        // Update current batsmen
                        if (replacedPlayer === currentBatsmen.striker) {
                          setCurrentBatsmen((prev) => ({
                            ...prev,
                            striker: player,
                          }));
                        } else if (
                          replacedPlayer === currentBatsmen.nonStriker
                        ) {
                          setCurrentBatsmen((prev) => ({
                            ...prev,
                            nonStriker: player,
                          }));
                        }

                        addEvent(`${player} comes to bat`);
                        setPendingAction(null);

                        // Now handle deferred over completion if applicable
                        if (ballResult?.overCompleted) {
                          console.log(
                            "Handling deferred over completion after new batsman selection"
                          );
                          setTimeout(() => {
                            handleDeferredOverCompletion(ballResult);
                          }, 100);
                        }
                      } else {
                        // Regular player selection
                        setShowPlayerSelection(false);
                        await executeAction(action, team, player);
                        setPendingAction(null);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors text-white ${
                      playerStat?.isOut && action.type !== "wicket"
                        ? "bg-slate-700/30 border-slate-600 text-slate-400 cursor-not-allowed"
                        : isCurrentBatsman
                        ? "bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-white"
                        : "bg-slate-800/80 border-slate-700/60 hover:bg-slate-800/90 hover:border-blue-500 text-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {player}
                        {isStriker && (
                          <span className="text-green-400 ml-1">*</span>
                        )}
                        {isCurrentBatsman && !isStriker && (
                          <span className="text-yellow-400 ml-1">•</span>
                        )}
                      </span>
                      {playerStat && (
                        <div className="text-sm text-slate-300">
                          {currentSport === "Cricket" ? (
                            <>
                              {playerStat.runs || 0}(
                              {playerStat.ballsFaced || 0})
                              {playerStat.isOut && (
                                <span className="text-red-400 ml-1">OUT</span>
                              )}
                            </>
                          ) : (
                            <>
                              {playerStat.points || 0} pts
                              {playerStat.isOut && (
                                <span className="text-red-400 ml-1">OUT</span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-600">
              <button
                onClick={async () => {
                  setShowPlayerSelection(false);
                  await executeAction(action, team);
                  setPendingAction(null);
                }}
                className="w-full p-3 bg-slate-700/50 rounded-lg text-white hover:bg-slate-700"
              >
                Continue without player selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBowlerSelectionModal = () => {
    if (!showBowlerSelection) return null;

    const bowlingPlayers = matchData?.[`${bowlingTeam}Players`] || [];
    const bowlingTeamName = getParticipantName(bowlingTeam === "team1" ? 1 : 2);

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl max-w-md w-full shadow-2xl ring-1 ring-black/20">
          <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">
              Select Bowler - {bowlingTeamName}
            </h2>
            <button
              onClick={() => setShowBowlerSelection(false)}
              className="p-2 hover:bg-slate-700/50 rounded-lg text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {bowlingPlayers.map((player, index) => {
                const disabled = lastOverBowler && player === lastOverBowler;
                return (
                  <button
                    key={index}
                    onClick={async () => {
                      if (disabled) {
                        toast.error(
                          "A bowler cannot bowl two consecutive overs"
                        );
                        return;
                      }
                      setCurrentBowler(player);
                      setShowBowlerSelection(false);
                      addEvent(`${player} is now bowling`);

                      // If there's a pending action, execute it now
                      if (pendingAction) {
                        const { action, team } = pendingAction;
                        await handleAction(action, team);
                        setPendingAction(null);
                      }
                    }}
                    className={`w-full p-4 rounded-lg border text-left transition-colors text-white ${
                      player === currentBowler
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : disabled
                        ? "bg-slate-700/30 border-slate-600 opacity-60 cursor-not-allowed"
                        : "bg-slate-800/80 border-slate-700/60 hover:bg-slate-800/90"
                    }`}
                    disabled={!!disabled}
                    title={
                      disabled ? "Cannot bowl consecutive overs" : undefined
                    }
                  >
                    <div className="font-medium">{player}</div>
                    {player === currentBowler && (
                      <div className="text-sm text-blue-400">
                        Currently Bowling
                      </div>
                    )}
                    {disabled && (
                      <div className="text-xs text-slate-400">
                        Cannot bowl consecutive overs
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Reset consecutive-over restriction when bowling side changes (e.g., new innings)
  useEffect(() => {
    setLastOverBowler(null);
  }, [bowlingTeam]);

  const renderStatsModal = () => {
    if (!showStats) return null;

    const team1Players = isTemporaryMatch ? matchData?.team1Players : [];
    const team2Players = isTemporaryMatch ? matchData?.team2Players : [];

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-slate-600">
          <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-gradient-to-r from-blue-900/20 to-green-900/20">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Match Statistics
              </h2>
              <div className="text-sm text-slate-300 mt-1">
                {getParticipantName(1)} vs {getParticipantName(2)}
              </div>
            </div>
            <button
              onClick={() => setShowStats(false)}
              className="p-2 hover:bg-slate-700/50 rounded-lg text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Live Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                  <h4 className="font-semibold text-lg text-white">
                    {getParticipantName(1)}
                  </h4>
                </div>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {(matchData?.sport || sport) === "Cricket"
                    ? `${score.teamA}/${secondaryScore.teamA}`
                    : formatScore(
                        score.teamA,
                        secondaryScore.teamA,
                        getSportConfig(matchData?.sport || sport)
                      )}
                </div>
                {(matchData?.sport || sport) === "Cricket" && (
                  <div className="text-sm text-slate-300 mb-2">
                    ({Math.floor((totalLegalBalls.team1 || 0) / 6)}.
                    {(totalLegalBalls.team1 || 0) % 6} overs)
                  </div>
                )}
                <div className="text-sm text-slate-400">
                  {(matchData?.sport || sport) === "Cricket"
                    ? `${
                        Object.values(playerStats.team1 || {}).filter(
                          (p) => !p.isOut
                        ).length
                      } batsmen remaining`
                    : `${
                        Object.values(playerStats.team1 || {}).length
                      } players`}
                </div>
                {battingTeam === "team1" &&
                  (matchData?.sport || sport) === "Cricket" && (
                    <div className="inline-block bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full text-green-400 text-xs font-medium mt-2">
                      Currently Batting
                    </div>
                  )}
              </div>

              <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                  <h4 className="font-semibold text-lg text-white">
                    {getParticipantName(2)}
                  </h4>
                </div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {(matchData?.sport || sport) === "Cricket"
                    ? `${score.teamB}/${secondaryScore.teamB}`
                    : formatScore(
                        score.teamB,
                        secondaryScore.teamB,
                        getSportConfig(matchData?.sport || sport)
                      )}
                </div>
                {(matchData?.sport || sport) === "Cricket" && (
                  <div className="text-sm text-slate-300 mb-2">
                    ({Math.floor((totalLegalBalls.team2 || 0) / 6)}.
                    {(totalLegalBalls.team2 || 0) % 6} overs)
                  </div>
                )}
                <div className="text-sm text-slate-400">
                  {(matchData?.sport || sport) === "Cricket"
                    ? `${
                        Object.values(playerStats.team2 || {}).filter(
                          (p) => !p.isOut
                        ).length
                      } batsmen remaining`
                    : `${
                        Object.values(playerStats.team2 || {}).length
                      } players`}
                </div>
                {battingTeam === "team2" &&
                  (matchData?.sport || sport) === "Cricket" && (
                    <div className="inline-block bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full text-green-400 text-xs font-medium mt-2">
                      Currently Batting
                    </div>
                  )}
              </div>
            </div>

            {/* Team Batting Stats */}
            {team1Players?.length > 0 &&
              renderStatsTable(team1Players, "team1", getParticipantName(1))}

            {team2Players?.length > 0 &&
              renderStatsTable(team2Players, "team2", getParticipantName(2))}

            {/* Bowling Stats for Cricket */}
            {(matchData?.sport || sport) === "Cricket" && (
              <>
                {team1Players?.length > 0 &&
                  renderBowlingStatsTable(
                    team1Players,
                    "team1",
                    getParticipantName(1)
                  )}

                {team2Players?.length > 0 &&
                  renderBowlingStatsTable(
                    team2Players,
                    "team2",
                    getParticipantName(2)
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderScorecardModal = () => {
    if (!showScorecard || (matchData?.sport || sport) !== "Cricket")
      return null;

    const team1Players = isTemporaryMatch ? matchData?.team1Players : [];
    const team2Players = isTemporaryMatch ? matchData?.team2Players : [];

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-slate-600">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-gradient-to-r from-blue-900/20 to-green-900/20">
            <div>
              <h2 className="text-2xl font-bold text-white">Live Scorecard</h2>
              <div className="text-sm text-slate-300 mt-1">
                {getParticipantName(1)} vs {getParticipantName(2)}
              </div>
            </div>
            <button
              onClick={() => setShowScorecard(false)}
              className="p-2 hover:bg-slate-700/50 rounded-lg text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Live Score Summary */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 p-6 rounded-xl border border-slate-600/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2">
                    {getParticipantName(1)}
                  </h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {score.teamA}/{secondaryScore.teamA}
                  </div>
                  <div className="text-sm text-slate-300">
                    ({Math.floor((totalLegalBalls.team1 || 0) / 6)}.
                    {(totalLegalBalls.team1 || 0) % 6} overs)
                  </div>
                  {battingTeam === "team1" && (
                    <div className="inline-block bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full text-green-400 text-xs font-medium mt-2">
                      Currently Batting
                    </div>
                  )}
                </div>
                <div className="text-center md:text-right">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">
                    {getParticipantName(2)}
                  </h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {score.teamB}/{secondaryScore.teamB}
                  </div>
                  <div className="text-sm text-slate-300">
                    ({Math.floor((totalLegalBalls.team2 || 0) / 6)}.
                    {(totalLegalBalls.team2 || 0) % 6} overs)
                  </div>
                  {battingTeam === "team2" && (
                    <div className="inline-block bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full text-green-400 text-xs font-medium mt-2">
                      Currently Batting
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Match Status */}
            {(currentBatsmen.striker || currentBowler) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Partnership */}
                {currentBatsmen.striker && currentBatsmen.nonStriker && (
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-green-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Current Partnership
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">
                          {currentBatsmen.striker}
                        </span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">
                            {playerStats[battingTeam]?.[currentBatsmen.striker]
                              ?.runs || 0}
                            *
                          </div>
                          <div className="text-xs text-slate-400">
                            (
                            {playerStats[battingTeam]?.[currentBatsmen.striker]
                              ?.ballsFaced || 0}{" "}
                            balls)
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">
                          {currentBatsmen.nonStriker}
                        </span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-400">
                            {playerStats[battingTeam]?.[
                              currentBatsmen.nonStriker
                            ]?.runs || 0}
                          </div>
                          <div className="text-xs text-slate-400">
                            (
                            {playerStats[battingTeam]?.[
                              currentBatsmen.nonStriker
                            ]?.ballsFaced || 0}{" "}
                            balls)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Bowler */}
                {currentBowler && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-red-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      Current Bowler
                    </h4>
                    <div className="text-center">
                      <div className="font-medium text-lg text-white mb-2">
                        {currentBowler}
                      </div>
                      {(() => {
                        const st = computeBowlingStats(currentBowler);
                        return (
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-slate-400">O</div>
                              <div className="font-bold">
                                {st ? `${st.overs}.${st.balls}` : "0.0"}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-slate-400">R</div>
                              <div className="font-bold">
                                {st ? st.runs : 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-slate-400">W</div>
                              <div className="font-bold text-orange-400">
                                {st ? st.wickets : 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-slate-400">Eco</div>
                              <div className="font-bold">
                                {st ? st.economy : "0.00"}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Batting Scorecards */}
            {team1Players?.length > 0 && (
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-600/30">
                <h3 className="text-xl font-bold mb-4 text-blue-300 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                  {getParticipantName(1)} Batting
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">
                          Batsman
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          R
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          B
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          4s
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          6s
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          SR
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-slate-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {team1Players.map((player, index) => {
                        const stats = playerStats.team1[player] || {};
                        const isCurrent =
                          player === currentBatsmen.striker ||
                          player === currentBatsmen.nonStriker;
                        const isStriker = player === currentBatsmen.striker;
                        return (
                          <tr
                            key={index}
                            className={`border-b border-slate-700/30 hover:bg-slate-700/20 ${
                              isCurrent ? "bg-green-500/10" : ""
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">
                                  {player}
                                </span>
                                {isStriker && (
                                  <span className="text-green-400 text-sm">
                                    ●
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-white">
                              {stats.runs || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-slate-300">
                              {stats.ballsFaced || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-blue-400">
                              {stats.fours || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-orange-400">
                              {stats.sixes || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-slate-300">
                              {stats.ballsFaced
                                ? (
                                    ((stats.runs || 0) /
                                      (stats.ballsFaced || 1)) *
                                    100
                                  ).toFixed(1)
                                : "0.0"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {stats.isOut ? (
                                <span className="bg-red-500/20 border border-red-500/30 px-2 py-1 rounded text-red-400 text-xs">
                                  OUT
                                </span>
                              ) : isCurrent ? (
                                <span className="bg-green-500/20 border border-green-500/30 px-2 py-1 rounded text-green-400 text-xs">
                                  BATTING
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {team2Players?.length > 0 && (
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-600/30">
                <h3 className="text-xl font-bold mb-4 text-green-300 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                  {getParticipantName(2)} Batting
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">
                          Batsman
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          R
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          B
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          4s
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          6s
                        </th>
                        <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                          SR
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-slate-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {team2Players.map((player, index) => {
                        const stats = playerStats.team2[player] || {};
                        const isCurrent =
                          player === currentBatsmen.striker ||
                          player === currentBatsmen.nonStriker;
                        const isStriker = player === currentBatsmen.striker;
                        return (
                          <tr
                            key={index}
                            className={`border-b border-slate-700/30 hover:bg-slate-700/20 ${
                              isCurrent ? "bg-green-500/10" : ""
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">
                                  {player}
                                </span>
                                {isStriker && (
                                  <span className="text-green-400 text-sm">
                                    ●
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-white">
                              {stats.runs || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-slate-300">
                              {stats.ballsFaced || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-blue-400">
                              {stats.fours || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-orange-400">
                              {stats.sixes || 0}
                            </td>
                            <td className="py-3 px-2 text-center text-slate-300">
                              {stats.ballsFaced
                                ? (
                                    ((stats.runs || 0) /
                                      (stats.ballsFaced || 1)) *
                                    100
                                  ).toFixed(1)
                                : "0.0"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {stats.isOut ? (
                                <span className="bg-red-500/20 border border-red-500/30 px-2 py-1 rounded text-red-400 text-xs">
                                  OUT
                                </span>
                              ) : isCurrent ? (
                                <span className="bg-green-500/20 border border-green-500/30 px-2 py-1 rounded text-green-400 text-xs">
                                  BATTING
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bowling Statistics */}
            {renderBowlingStatsTable(
              team1Players,
              "team1",
              getParticipantName(1)
            )}
            {renderBowlingStatsTable(
              team2Players,
              "team2",
              getParticipantName(2)
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentBatsmen = (teamKey) => {
    const players = Object.values(playerStats[teamKey] || {});

    let activePlayers = [];
    let displayData = [];

    switch (matchData?.sport || sport) {
      case "Cricket":
        // For cricket, show current batsmen if this is the batting team
        if (
          teamKey === battingTeam &&
          currentBatsmen.striker &&
          currentBatsmen.nonStriker
        ) {
          const strikerStats = playerStats[teamKey][currentBatsmen.striker] || {
            name: currentBatsmen.striker,
            runs: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
          };

          const nonStrikerStats = playerStats[teamKey][
            currentBatsmen.nonStriker
          ] || {
            name: currentBatsmen.nonStriker,
            runs: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
          };

          displayData = [
            {
              name: `${strikerStats.name} *`,
              main: `${strikerStats.runs}(${strikerStats.ballsFaced})`,
              details: [
                `SR: ${strikerStats.strikeRate}`,
                strikerStats.fours > 0 ? `4s: ${strikerStats.fours}` : null,
                strikerStats.sixes > 0 ? `6s: ${strikerStats.sixes}` : null,
              ].filter(Boolean),
              isStriker: true,
            },
            {
              name: nonStrikerStats.name,
              main: `${nonStrikerStats.runs}(${nonStrikerStats.ballsFaced})`,
              details: [
                `SR: ${nonStrikerStats.strikeRate}`,
                nonStrikerStats.fours > 0
                  ? `4s: ${nonStrikerStats.fours}`
                  : null,
                nonStrikerStats.sixes > 0
                  ? `6s: ${nonStrikerStats.sixes}`
                  : null,
              ].filter(Boolean),
              isStriker: false,
            },
          ];
        } else {
          // Show top performers for non-batting team
          activePlayers = players
            .filter((player) => !player.isOut)
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 2);

          displayData = activePlayers.map((player) => ({
            name: player.name,
            main: `${player.runs}(${player.ballsFaced})`,
            details: [
              `SR: ${player.strikeRate}`,
              player.fours > 0 ? `4s: ${player.fours}` : null,
              player.sixes > 0 ? `6s: ${player.sixes}` : null,
            ].filter(Boolean),
          }));
        }
        break;

      case "Basketball":
        activePlayers = players.sort((a, b) => b.points - a.points).slice(0, 3); // Show top 3 scorers

        displayData = activePlayers.map((player) => ({
          name: player.name,
          main: `${player.points} pts`,
          details: [
            `FT: ${player.freeThrows}`,
            `2P: ${player.twoPointers}`,
            `3P: ${player.threePointers}`,
            player.fouls > 0 ? `Fouls: ${player.fouls}` : null,
          ].filter(Boolean),
        }));
        break;

      case "Football":
        activePlayers = players.sort((a, b) => b.goals - a.goals).slice(0, 3); // Show top 3 performers

        displayData = activePlayers.map((player) => ({
          name: player.name,
          main: `${player.goals} goals`,
          details: [
            player.yellowCards > 0 ? `Yellow: ${player.yellowCards}` : null,
            player.redCards > 0 ? `Red: ${player.redCards}` : null,
          ].filter(Boolean),
        }));
        break;

      default:
        activePlayers = players.sort((a, b) => b.points - a.points).slice(0, 3);

        displayData = activePlayers.map((player) => ({
          name: player.name,
          main: `${player.points} pts`,
          details: [`Events: ${player.events}`],
        }));
        break;
    }

    if (displayData.length === 0) {
      return (
        <div className="text-sm text-white/50 italic">No active players</div>
      );
    }

    return (
      <div className="space-y-1">
        {displayData.map((player, index) => (
          <div
            key={index}
            className={`flex justify-between items-center text-sm p-2 rounded ${
              player.isStriker
                ? "bg-green-500/20 border border-green-500/30"
                : "bg-slate-800/50"
            }`}
          >
            <span
              className={`font-medium ${
                player.isStriker ? "text-green-400" : ""
              }`}
            >
              {player.name}
            </span>
            <div className="flex gap-3 text-xs text-slate-400">
              <span className="font-medium">{player.main}</span>
              {player.details.map((detail, i) => (
                <span key={i}>{detail}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Compute current bowler's basic figures from ball-by-ball data
  const computeBowlingStats = (bowlerName) => {
    if (!bowlerName) return null;
    const deliveries = ballByBall.filter((b) => b.bowler === bowlerName);
    let legalDeliveries = 0;
    let runsConceded = 0;
    let wickets = 0;
    let wides = 0;
    let noBalls = 0;

    deliveries.forEach((b) => {
      const act = (b.action || "").toLowerCase();
      if (act === "wide" || act.includes("wide")) {
        wides += 1;
        runsConceded += Number(b.runs || 1);
      } else if (
        act === "no_ball" ||
        act.includes("no ball") ||
        act === "no ball"
      ) {
        noBalls += 1;
        runsConceded += Number(b.runs || 1);
      } else {
        // legal delivery
        legalDeliveries += 1;
        if (act === "wicket" || act.includes("wicket")) {
          wickets += 1;
        } else if (
          act !== "bye" &&
          act !== "leg_bye" &&
          act !== "leg bye" &&
          !act.includes("bye")
        ) {
          runsConceded += Number(b.runs || 0);
        }
      }
    });

    const overs = Math.floor(legalDeliveries / 6);
    const balls = legalDeliveries % 6;
    const econ = legalDeliveries > 0 ? runsConceded / (legalDeliveries / 6) : 0;
    return {
      overs,
      balls,
      runs: runsConceded,
      wickets,
      economy: econ.toFixed(2),
      wides,
      noBalls,
      totalDeliveries: legalDeliveries + wides + noBalls,
    };
  };

  // Get all bowlers and their stats for a team
  const getBowlersStats = (teamKey) => {
    // Get unique bowlers from ball-by-ball data
    const bowlers = [...new Set(ballByBall.map((b) => b.bowler))].filter(
      Boolean
    );

    // Get team players to filter only bowlers from this team
    const teamPlayers =
      teamKey === "team1"
        ? isTemporaryMatch
          ? matchData?.team1Players
          : []
        : isTemporaryMatch
        ? matchData?.team2Players
        : [];

    // Filter bowlers to only include those from this team
    const teamBowlers = bowlers.filter((bowler) =>
      teamPlayers.includes(bowler)
    );

    return teamBowlers
      .map((bowler) => ({
        name: bowler,
        ...computeBowlingStats(bowler),
      }))
      .filter((stats) => stats.totalDeliveries > 0) // Only include bowlers who have bowled
      .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy); // Sort by wickets, then economy
  };

  const renderCurrentBowlerSummary = () => {
    if (!currentBowler) {
      return (
        <div className="text-sm text-white/50 italic">No bowler selected</div>
      );
    }
    const stats = computeBowlingStats(currentBowler);

    // If no stats yet, show initial state
    if (!stats || stats.totalDeliveries === 0) {
      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm p-2 rounded bg-red-500/10 border border-red-500/30">
            <span className="font-medium text-red-300">{currentBowler}</span>
            <div className="flex gap-3 text-xs text-slate-400">
              <span className="font-medium">0.0 ov</span>
              <span>R: 0</span>
              <span>W: 0</span>
              <span>Eco: 0.00</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm p-2 rounded bg-red-500/10 border border-red-500/30">
          <span className="font-medium text-red-300">{currentBowler}</span>
          <div className="flex gap-3 text-xs text-slate-400">
            <span className="font-medium">
              {stats.overs}.{stats.balls} ov
            </span>
            <span>R: {stats.runs}</span>
            <span>W: {stats.wickets}</span>
            <span>Eco: {stats.economy}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStatsTable = (teamPlayers, teamKey, teamName) => {
    const getStatsHeaders = () => {
      switch (matchData?.sport || sport) {
        case "Cricket":
          return ["Player", "R", "B", "4s", "6s", "SR", "Status"];
        case "Basketball":
          return ["Player", "Points", "FT", "2P", "3P", "Fouls"];
        case "Football":
          return ["Player", "Goals", "Yellow", "Red", "Subs"];
        default:
          return ["Player", "Points", "Events"];
      }
    };

    const teamColor = teamKey === "team1" ? "blue" : "green";

    return (
      <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-600/30">
        <h3
          className={`text-xl font-bold mb-4 text-${teamColor}-300 flex items-center gap-2`}
        >
          <span className={`w-3 h-3 bg-${teamColor}-400 rounded-full`}></span>
          {teamName} Players
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600">
                {getStatsHeaders().map((header, index) => (
                  <th
                    key={index}
                    className={`py-3 px-4 text-sm font-semibold text-slate-300 ${
                      index === 0 ? "text-left" : "text-center"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamPlayers.map((player, index) => {
                const stats = playerStats[teamKey][player] || {};
                const isCurrent =
                  (matchData?.sport || sport) === "Cricket" &&
                  (player === currentBatsmen.striker ||
                    player === currentBatsmen.nonStriker);
                const isStriker = player === currentBatsmen.striker;

                return (
                  <tr
                    key={index}
                    className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${
                      isCurrent ? "bg-green-500/10" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{player}</span>
                        {isStriker && (
                          <span className="text-green-400 text-sm">●</span>
                        )}
                        {isCurrent && !isStriker && (
                          <span className="text-yellow-400 text-sm">•</span>
                        )}
                      </div>
                    </td>
                    {renderPlayerStatCells(stats, teamKey)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBowlingStatsTable = (teamPlayers, teamKey, teamName) => {
    if ((matchData?.sport || sport) !== "Cricket") return null;

    const bowlersStats = getBowlersStats(teamKey);

    if (bowlersStats.length === 0) {
      return (
        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-600/30">
          <h3 className="text-xl font-bold mb-4 text-red-300 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-400 rounded-full"></span>
            {teamName} Bowling
          </h3>
          <div className="text-sm text-slate-400 italic">
            No bowling statistics available
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-600/30">
        <h3
          className={`text-xl font-bold mb-4 text-red-300 flex items-center gap-2`}
        >
          <span className="w-3 h-3 bg-red-400 rounded-full"></span>
          {teamName} Bowling
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">
                  Bowler
                </th>
                <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                  O
                </th>
                <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                  R
                </th>
                <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                  W
                </th>
                <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                  Econ
                </th>
                <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                  WD
                </th>
                <th className="py-3 px-2 text-center text-sm font-semibold text-slate-300">
                  NB
                </th>
              </tr>
            </thead>
            <tbody>
              {bowlersStats.map((bowler, index) => {
                const isCurrent = bowler.name === currentBowler;

                return (
                  <tr
                    key={index}
                    className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${
                      isCurrent ? "bg-red-500/10" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {bowler.name}
                        </span>
                        {isCurrent && (
                          <span className="text-red-400 text-sm">●</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-300">
                      {bowler.overs}.{bowler.balls}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-white">
                      {bowler.runs}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs font-bold">
                        {bowler.wickets}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-300">
                      {bowler.economy}
                    </td>
                    <td className="py-3 px-2 text-center text-yellow-400">
                      {bowler.wides || 0}
                    </td>
                    <td className="py-3 px-2 text-center text-orange-400">
                      {bowler.noBalls || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPlayerStatCells = (stats, teamKey) => {
    const cells = [];

    switch (matchData?.sport || sport) {
      case "Cricket":
        cells.push(
          <td key="runs" className="py-3 px-4 text-center font-bold text-white">
            {stats.runs || 0}
          </td>,
          <td key="balls" className="py-3 px-4 text-center text-slate-300">
            {stats.ballsFaced || 0}
          </td>,
          <td key="fours" className="py-3 px-4 text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 text-xs font-bold">
              {stats.fours || 0}
            </span>
          </td>,
          <td key="sixes" className="py-3 px-4 text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 text-xs font-bold">
              {stats.sixes || 0}
            </span>
          </td>,
          <td key="sr" className="py-3 px-4 text-center text-slate-300">
            {stats.ballsFaced
              ? (((stats.runs || 0) / (stats.ballsFaced || 1)) * 100).toFixed(1)
              : "0.0"}
          </td>,
          <td key="status" className="py-3 px-4 text-center">
            {stats.isOut ? (
              <span className="bg-red-500/20 border border-red-500/30 px-2 py-1 rounded text-red-400 text-xs font-medium">
                OUT
              </span>
            ) : (stats.runs || 0) > 0 || (stats.ballsFaced || 0) > 0 ? (
              <span className="bg-green-500/20 border border-green-500/30 px-2 py-1 rounded text-green-400 text-xs font-medium">
                BATTING
              </span>
            ) : (
              <span className="text-slate-400 text-xs">YTB</span>
            )}
          </td>
        );
        break;

      case "Basketball":
        cells.push(
          <td
            key="points"
            className="py-3 px-4 text-center font-bold text-white"
          >
            {stats.points || 0}
          </td>,
          <td key="ft" className="py-3 px-4 text-center text-slate-300">
            {stats.freeThrows || 0}
          </td>,
          <td key="2p" className="py-3 px-4 text-center text-green-400">
            {stats.twoPointers || 0}
          </td>,
          <td key="3p" className="py-3 px-4 text-center text-purple-400">
            {stats.threePointers || 0}
          </td>,
          <td key="fouls" className="py-3 px-4 text-center text-red-400">
            {stats.fouls || 0}
          </td>
        );
        break;

      case "Football":
        cells.push(
          <td
            key="goals"
            className="py-3 px-4 text-center font-bold text-white"
          >
            {stats.goals || 0}
          </td>,
          <td key="yellow" className="py-3 px-4 text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
              {stats.yellowCards || 0}
            </span>
          </td>,
          <td key="red" className="py-3 px-4 text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs">
              {stats.redCards || 0}
            </span>
          </td>,
          <td key="subs" className="py-3 px-4 text-center text-slate-300">
            {stats.substitutions || 0}
          </td>
        );
        break;

      default:
        cells.push(
          <td
            key="points"
            className="py-3 px-4 text-center font-bold text-white"
          >
            {stats.points || 0}
          </td>,
          <td key="events" className="py-3 px-4 text-center text-slate-300">
            {stats.events || 0}
          </td>
        );
        break;
    }

    return cells;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (showComplete) {
    // Format cricket scores properly
    const formatCricketScore = (runs, wickets, teamKey) => {
      if ((matchData?.sport || sport) === "Cricket") {
        let totalBalls;

        // Determine which team's ball count to use based on current innings and team
        if (currentInnings === 1) {
          // First innings: use the batting team's ball count
          totalBalls = totalLegalBalls[battingTeam] || 0;
        } else {
          // Second innings: determine which team we're getting the score for
          if (teamKey === "team1") {
            // Getting team1 score - if team1 batted first, use their stored balls; otherwise use current balls
            totalBalls =
              inningsScores.innings1.team === "team1"
                ? inningsScores.innings1.totalBalls || 0
                : totalLegalBalls[battingTeam] || 0;
          } else {
            // Getting team2 score - if team2 batted first, use their stored balls; otherwise use current balls
            totalBalls =
              inningsScores.innings1.team === "team2"
                ? inningsScores.innings1.totalBalls || 0
                : totalLegalBalls[battingTeam] || 0;
          }
        }

        const overs = Math.floor(totalBalls / 6);
        const balls = totalBalls % 6;
        const oversDisplay = balls > 0 ? `${overs}.${balls}` : `${overs}`;
        return `${runs}/${wickets} (${oversDisplay} ov)`;
      }
      return runs;
    };

    // Get correct cricket scores based on innings data
    const getCricketScores = () => {
      if ((matchData?.sport || sport) === "Cricket") {
        // For cricket, determine correct scores based on current innings
        let team1Score, team1Wickets, team2Score, team2Wickets;

        if (currentInnings === 1) {
          // First innings: team1 batting, use current score
          team1Score = score.teamA;
          team1Wickets = secondaryScore.teamA;
          team2Score = 0;
          team2Wickets = 0;
        } else {
          // Second innings: use first innings data for team1 and current score for team2
          if (inningsScores.innings1.team === "team1") {
            team1Score = inningsScores.innings1.runs;
            team1Wickets = inningsScores.innings1.wickets;
            team2Score = score.teamB; // Current second innings score
            team2Wickets = secondaryScore.teamB;
          } else {
            team2Score = inningsScores.innings1.runs;
            team2Wickets = inningsScores.innings1.wickets;
            team1Score = score.teamA; // Current second innings score
            team1Wickets = secondaryScore.teamA;
          }
        }

        return {
          score1: formatCricketScore(team1Score, team1Wickets, "team1"),
          score2: formatCricketScore(team2Score, team2Wickets, "team2"),
          numericScore1: team1Score, // For winner comparison
          numericScore2: team2Score, // For winner comparison
        };
      } else {
        // For other sports, use regular scores
        return {
          score1: score.teamA,
          score2: score.teamB,
          numericScore1: score.teamA,
          numericScore2: score.teamB,
        };
      }
    };

    const cricketScores = getCricketScores();

    // Prepare proper data structure for MatchComplete
    const matchCompleteData = {
      team1: getParticipantName(1),
      team2: getParticipantName(2),
      score1: cricketScores.score1,
      score2: cricketScores.score2,
      numericScore1: cricketScores.numericScore1,
      numericScore2: cricketScores.numericScore2,
      sport: matchData?.sport || sport,
      matchType: matchData?.matchType || "team",
      // Add cricket-specific data if available
      ...(currentInnings === 2 &&
        firstInningsComplete && {
          innings1: inningsScores.innings1,
          currentInnings,
          wickets1: secondaryScore.teamA,
          wickets2: secondaryScore.teamB,
        }),
    };

    return (
      <MatchComplete
        matchData={matchCompleteData}
        onPlayAgain={handleReset}
        onGoHome={() => navigate("/")}
      />
    );
  }

  const config = getSportConfig(matchData?.sport || sport);
  const team1Name = isTemporaryMatch
    ? getParticipantName(1)
    : matchData.team1.name;
  const team2Name = isTemporaryMatch
    ? getParticipantName(2)
    : matchData.team2.name;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans pb-16">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-slate-700/50 transition-colors flex items-center gap-2 text-white"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-blue-400">{sport} Match</h1>
            {isTemporaryMatch && (
              <p className="text-sm text-slate-400">
                Temporary Match - Data will not be saved
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Stats Button - only show if we have team players */}
            {isTemporaryMatch &&
              matchData?.matchType === "team" &&
              (matchData?.team1Players?.length > 0 ||
                matchData?.team2Players?.length > 0) && (
                <button
                  onClick={() => setShowStats(true)}
                  className="p-2 rounded-full hover:bg-slate-700/50 transition-colors flex items-center gap-1 text-sm text-white"
                >
                  <BarChart3 size={18} />
                  Stats
                </button>
              )}
            {/* Scorecard Button - only for cricket */}
            {isTemporaryMatch &&
              (matchData?.sport || sport) === "Cricket" &&
              matchData?.matchType === "team" &&
              (matchData?.team1Players?.length > 0 ||
                matchData?.team2Players?.length > 0) && (
                <button
                  onClick={() => setShowScorecard(true)}
                  className="p-2 rounded-full hover:bg-slate-700/50 transition-colors flex items-center gap-1 text-sm text-white"
                >
                  📋 Scorecard
                </button>
              )}
            <div className="flex items-center gap-2 font-bold">
              <Clock size={20} />
              {isTemporaryMatch ? formatTime(elapsedTime) : "00:00"}
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 border border-slate-600/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
          {(matchData?.sport || sport) === "Cricket" ? (
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h2 className="text-lg md:text-2xl font-bold mb-2 text-blue-300">
                  {team1Name}
                </h2>
                <div className="text-xs text-slate-400 mb-1">
                  {battingTeam === "team1" ? "Batting" : "Bowling"}
                </div>
              </div>
              {renderScoreboard(config)}
              <div className="text-center flex-1">
                <h2 className="text-lg md:text-2xl font-bold mb-2 text-green-300">
                  {team2Name}
                </h2>
                <div className="text-xs text-slate-400 mb-1">
                  {battingTeam === "team2" ? "Batting" : "Bowling"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <div className="text-center w-1/3">
                <h2 className="text-xl md:text-3xl font-bold truncate">
                  {team1Name}
                </h2>
              </div>
              {renderScoreboard(config)}
              <div className="text-center w-1/3">
                <h2 className="text-xl md:text-3xl font-bold truncate">
                  {team2Name}
                </h2>
              </div>
            </div>
          )}
        </div>

        {/* Player Stats Summary Bar */}
        {isTemporaryMatch &&
          matchData?.matchType === "team" &&
          (matchData?.team1Players?.length > 0 ||
            matchData?.team2Players?.length > 0) && (
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 border border-slate-600/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
              {(matchData?.sport || sport) === "Cricket" ? (
                <div className="space-y-4">
                  {/* Current Partnership */}
                  <div className="text-center border-b border-slate-600/30 pb-3">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">
                      Current Partnership
                    </h3>
                    <div className="flex justify-center items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">
                          {currentBatsmen.striker || "Not Selected"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {currentBatsmen.striker
                            ? `${
                                playerStats[battingTeam]?.[
                                  currentBatsmen.striker
                                ]?.runs || 0
                              }* (${
                                playerStats[battingTeam]?.[
                                  currentBatsmen.striker
                                ]?.ballsFaced || 0
                              })`
                            : "Striker"}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-slate-400">•</div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">
                          {currentBatsmen.nonStriker || "Not Selected"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {currentBatsmen.nonStriker
                            ? `${
                                playerStats[battingTeam]?.[
                                  currentBatsmen.nonStriker
                                ]?.runs || 0
                              } (${
                                playerStats[battingTeam]?.[
                                  currentBatsmen.nonStriker
                                ]?.ballsFaced || 0
                              })`
                            : "Non-Striker"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Bowler */}
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">
                      Current Bowler
                    </h3>
                    <div className="inline-block bg-slate-700/50 rounded-lg px-4 py-2">
                      <div className="text-lg font-bold text-red-400">
                        {currentBowler || "Not Selected"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {(() => {
                          if (!currentBowler) return "O-R-W-Eco";
                          const st = computeBowlingStats(currentBowler);
                          if (!st || st.totalDeliveries === 0)
                            return "0.0-0-0-0.00";
                          return `${st.overs}.${st.balls}-${st.runs}-${st.wickets}-${st.economy}`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-center">
                    Top Performers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400">
                        {team1Name}
                      </h4>
                      {renderCurrentBatsmen("team1")}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400">
                        {team2Name}
                      </h4>
                      {renderCurrentBatsmen("team2")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Action Buttons */}
        {(matchData?.sport || sport) === "Cricket" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {currentInnings === 1 ? "1st Innings" : "2nd Innings"}
                </span>
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                  Batting: {battingTeam === "team1" ? team1Name : team2Name}
                </span>
                <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  Bowling: {bowlingTeam === "team1" ? team1Name : team2Name}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {config.actions.map((action) => {
                const battingSide = battingTeam === "team1" ? "A" : "B";
                const battingName =
                  battingTeam === "team1" ? team1Name : team2Name;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action, battingSide)}
                    className={`${action.color} w-full text-white p-4 rounded-lg font-semibold hover:scale-105 transition-all truncate`}
                  >
                    {action.label} ({battingName})
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {config.actions.map((action) => (
              <div key={action.id} className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction(action, "A")}
                  className={`${action.color} text-white p-4 rounded-lg font-semibold hover:scale-105 transition-all text-left truncate`}
                >
                  {action.label} ({team1Name})
                </button>
                <button
                  onClick={() => handleAction(action, "B")}
                  className={`${action.color} text-white p-4 rounded-lg font-semibold hover:scale-105 transition-all text-right truncate`}
                >
                  {action.label} ({team2Name})
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Match Controls */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          {/* Cricket-specific End Innings button */}
          {(matchData?.sport || sport) === "Cricket" &&
            currentInnings === 1 && (
              <button
                onClick={handleEndInnings}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
              >
                <Trophy size={20} />
                End First Innings
              </button>
            )}

          {isTemporaryMatch && (
            <button
              onClick={handleReset}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Reset Score
            </button>
          )}
          <button
            onClick={handleEndMatch}
            className="flex-1 border-2 border-red-500/50 text-red-400 px-8 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-red-500/10 hover:border-red-500/80 transition-all"
          >
            <ShieldX />
            {(matchData?.sport || sport) === "Cricket" && currentInnings === 2
              ? "End Second Innings"
              : isTemporaryMatch
              ? "End Match"
              : "Complete Match"}
          </button>
        </div>

        {/* Events Log */}
        {events.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Match Events</h3>
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-slate-800/30 p-3 rounded-md flex items-center gap-4 animate-fade-in"
                >
                  <span className="font-bold text-slate-400">{event.time}</span>
                  <p className="text-white">{event.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player Selection Modal */}
      {renderPlayerSelectionModal()}

      {/* Bowler Selection Modal */}
      {renderBowlerSelectionModal()}

      {/* Cricket Setup Modal */}
      {renderCricketSetupModal()}

      {/* Stats Modal */}
      {renderStatsModal()}

      {/* Cricket Scorecard Modal */}
      {renderScorecardModal()}
    </div>
  );
}
