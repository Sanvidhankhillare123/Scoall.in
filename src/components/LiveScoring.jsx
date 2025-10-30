import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ShieldX } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { sportDefinitions } from "../sportDefinitions";

export default function LiveScoring() {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState(null);
  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [secondaryScore, setSecondaryScore] = useState({ teamA: 0, teamB: 0 });
  const [events, setEvents] = useState([]);
  const [justScored, setJustScored] = useState(null); // For score animation
  const scoreRef = useRef(score); // Ref to compare old score

  useEffect(() => {
    const fetchMatchFromDb = async () => {
      try {
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
      } catch (error) {
        toast.error("Could not load match data.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    const setupQuickMatch = () => {
      const { sport: quickSport, matchData: quickMatchData } = location.state;
      setSport(quickSport);
      setMatchData(quickMatchData);
      addEvent("Match started!");
      setLoading(false);
    };

    if (matchId) fetchMatchFromDb();
    else if (location.state?.matchData) setupQuickMatch();
    else navigate("/"); // No data, go home
  }, [matchId, location.state, navigate]);

  // Find the correct scoring rules for the sport
  const definition = sportDefinitions[sport] || sportDefinitions.Football;

  // Effect for score change animation
  useEffect(() => {
    if (score.teamA !== scoreRef.current.teamA) setJustScored("A");
    else if (score.teamB !== scoreRef.current.teamB) setJustScored("B");

    scoreRef.current = score; // Update ref

    const timer = setTimeout(() => setJustScored(null), 500); // Reset animation state
    return () => clearTimeout(timer);
  }, [score]);

  const addEvent = (text) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setEvents((prevEvents) => [{ time, text, id: Date.now() }, ...prevEvents]);
  };

  const handleAction = async (action, team) => {
    const teamName = team === "A" ? matchData.team1.name : matchData.team2.name;
    const eventText = `${action.label} for ${teamName}`;
    addEvent(eventText);

    // Handle special scoring logic first (e.g., wickets in cricket)
    if (sport === "Cricket" && action.id === "wicket") {
      const newSecondaryScore = {
        ...secondaryScore,
        [team === "A" ? "teamA" : "teamB"]:
          secondaryScore[team === "A" ? "teamA" : "teamB"] + 1,
      };
      setSecondaryScore(newSecondaryScore);

      // Save wickets to database if this is a tournament match
      if (matchId) {
        try {
          const { error } = await supabase
            .from("matches")
            .update({
              team1_wickets: newSecondaryScore.teamA,
              team2_wickets: newSecondaryScore.teamB,
              status: "Live",
            })
            .eq("id", matchData.id);
          if (error) throw error;
        } catch (error) {
          toast.error("Error saving wickets: " + error.message);
          // Revert the wickets change in the UI if saving fails
          setSecondaryScore(secondaryScore);
        }
      }
      return; // Wicket is an event, not a primary score change.
    }

    if (action.type === "point") {
      let newScore = { ...score };
      const pointsToAdd = action.value || 1;
      if (team === "A") {
        newScore.teamA += pointsToAdd;
      } else {
        newScore.teamB += pointsToAdd;
      }
      setScore(newScore); // Update UI instantly for a responsive feel

      // If there's no matchData.id, it's a quick match, so don't save to DB.
      if (!matchId) return;

      // Save the new score to the database in the background
      try {
        const { error } = await supabase
          .from("matches")
          .update({
            team1_score: newScore.teamA,
            team2_score: newScore.teamB,
            status: "Live",
          })
          .eq("id", matchData.id);
        if (error) throw error;
      } catch (error) {
        toast.error("Error saving score: " + error.message);
        // Optionally, revert the score change in the UI if saving fails
        setScore(score);
      }
    }
  };

  const handleEndMatch = async () => {
    // If it's a quick match, just navigate back.
    if (!matchId) {
      navigate("/");
      return;
    }

    // For a tournament match, update status and navigate to tournament page.
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

  // Back button should go to tournament page or homepage
  const handleBack = () =>
    navigate(matchId ? `/tournament/${matchData.tournament.id}` : "/");

  // NEW: A function to render the correct scoreboard based on the sport
  const renderScoreboard = () => {
    // For sports like Chess where a simple score isn't applicable
    if (!definition.scoreLabel) {
      return (
        <div className="text-xl md:text-3xl font-bold">Match in Progress</div>
      );
    }

    switch (sport) {
      case "Cricket":
        const scoreClass = (team) =>
          `transition-all duration-300 ${
            justScored === team ? "text-yellow-400 scale-110" : ""
          }`;
        return (
          <div className="text-4xl md:text-6xl font-bold">
            <span className={scoreClass("A")}>
              {score.teamA}/{secondaryScore.teamA}
            </span>
            <span className="mx-2 sm:mx-4">-</span>
            <span className={scoreClass("B")}>
              {score.teamB}/{secondaryScore.teamB}
            </span>
          </div>
        );
      // You could add more cases here for Tennis (sets/games), etc.
      default:
        const defaultScoreClass = (team) =>
          `transition-all duration-300 ${
            justScored === team ? "text-yellow-400 scale-110" : ""
          }`;
        return (
          <div className="text-5xl md:text-7xl font-bold">
            <span className={defaultScoreClass("A")}>{score.teamA}</span>
            <span className="mx-2 sm:mx-4">-</span>
            <span className={defaultScoreClass("B")}>{score.teamB}</span>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-brand-dark" />; // Or a proper loading spinner
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light font-sans pb-16">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-brand-light/10 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-blue-400">{sport} Match</h1>
          </div>
          <div className="flex items-center gap-2 font-bold">
            <Clock size={20} /> 00:00
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-brand-light/5 border border-brand-light/10 rounded-xl flex items-center justify-around p-6 mb-6">
          <div className="text-center w-1/3">
            <h2 className="text-xl md:text-3xl font-bold truncate">
              {matchData.team1.name}
            </h2>
          </div>
          {renderScoreboard()}
          <div className="text-center w-1/3">
            <h2 className="text-xl md:text-3xl font-bold truncate">
              {matchData.team2.name}
            </h2>
          </div>
        </div>

        {/* Dynamic Action Panel */}
        <div className="space-y-4">
          {definition.actions.map((action) => (
            <div key={action.id} className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAction(action, "A")}
                className="bg-gray-800 text-white p-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-left truncate"
              >
                {action.label} ({matchData.team1.name})
              </button>
              <button
                onClick={() => handleAction(action, "B")}
                className="bg-gray-800 text-white p-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-right truncate"
              >
                {action.label} ({matchData.team2.name})
              </button>
            </div>
          ))}
        </div>

        {/* Events Log */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Match Events</h3>
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-brand-light/5 p-3 rounded-md flex items-center gap-4 animate-fade-in"
              >
                <span className="font-bold text-brand-gray">{event.time}</span>
                <p>{event.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* End Match Button */}
        <div className="mt-12 pt-8 border-t border-brand-light/10 flex justify-center">
          <button
            onClick={handleEndMatch}
            className="border-2 border-red-500/50 text-red-400 px-8 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-red-500/10 hover:border-red-500/80 transition-all"
          >
            <ShieldX /> End Match
          </button>
        </div>
      </div>
    </div>
  );
}
