import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, Users, Trophy, ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

export default function QuickMatchCreator() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [matchData, setMatchData] = useState({
    sport: "",
    matchType: "individual", // individual or team
    player1: "",
    player2: "",
    team1: "",
    team2: "",
    team1Players: [],
    team2Players: [],
  });

  const [team1PlayerInput, setTeam1PlayerInput] = useState("");
  const [team2PlayerInput, setTeam2PlayerInput] = useState("");

  const getSportPlayerLimits = (sportName) => {
    const limits = {
      Cricket: { min: 2, max: 11, recommended: 11 },
      Football: { min: 2, max: 11, recommended: 11 },
      Basketball: { min: 2, max: 5, recommended: 5 },
      Volleyball: { min: 2, max: 6, recommended: 6 },
      Hockey: { min: 2, max: 11, recommended: 11 },
      Tennis: { min: 1, max: 2, recommended: 1 },
      Badminton: { min: 1, max: 2, recommended: 1 },
      "Table Tennis": { min: 1, max: 2, recommended: 1 },
    };
    return limits[sportName] || { min: 1, max: 15, recommended: 11 };
  };

  const sports = [
    { id: "football", name: "Football", icon: "⚽" },
    { id: "basketball", name: "Basketball", icon: "🏀" },
    { id: "cricket", name: "Cricket", icon: "🏏" },
    { id: "tennis", name: "Tennis", icon: "🎾" },
    { id: "badminton", name: "Badminton", icon: "🏸" },
    { id: "volleyball", name: "Volleyball", icon: "🏐" },
    { id: "table_tennis", name: "Table Tennis", icon: "🏓" },
    { id: "hockey", name: "Hockey", icon: "🏒" },
  ];

  const handleSportSelect = (sportId) => {
    const selectedSport = sports.find((s) => s.id === sportId);

    // Set default players for cricket to make testing easier
    const defaultPlayers =
      sportId === "cricket"
        ? {
            team1Players: [
              "Player 1",
              "Player 2",
              "Player 3",
              "Player 4",
              "Player 5",
            ],
            team2Players: [
              "Player A",
              "Player B",
              "Player C",
              "Player D",
              "Player E",
            ],
          }
        : {};

    const newMatchData = {
      ...matchData,
      sport: selectedSport.name,
      // Force team mode for cricket (and other team sports)
      matchType: [
        "cricket",
        "football",
        "basketball",
        "volleyball",
        "hockey",
      ].includes(sportId)
        ? "team"
        : matchData.matchType,
      ...defaultPlayers,
    };
    setMatchData(newMatchData);
    setCurrentStep(2);
  };

  const handleMatchTypeSelect = (type) => {
    setMatchData({ ...matchData, matchType: type });
    setCurrentStep(3);
  };

  const handleStartMatch = () => {
    // Create a temporary match ID
    const tempMatchId = `temp_${uuidv4()}`;

    // Store match data in localStorage for temporary access
    const tempMatch = {
      id: tempMatchId,
      sport: matchData.sport,
      matchType: matchData.matchType,
      player1: matchData.player1,
      player2: matchData.player2,
      team1: matchData.team1,
      team2: matchData.team2,
      team1Players: matchData.team1Players,
      team2Players: matchData.team2Players,
      score1: 0,
      score2: 0,
      wickets1: 0,
      wickets2: 0,
      status: "live",
      startTime: new Date().toISOString(),
      isTemporary: true,
    };

    // Store in localStorage
    localStorage.setItem(`tempMatch_${tempMatchId}`, JSON.stringify(tempMatch));

    // Navigate to live scoring page
    navigate(`/temp-scoring/${tempMatchId}`);
  };

  const isFormValid = () => {
    if (matchData.matchType === "individual") {
      return matchData.player1.trim() && matchData.player2.trim();
    } else {
      return matchData.team1.trim() && matchData.team2.trim();
    }
  };

  const addPlayerToTeam = (team, playerName) => {
    if (!playerName.trim()) return;

    const playerData = matchData[`${team}Players`] || [];
    const sportLimits = getSportPlayerLimits(matchData.sport);

    if (playerData.length >= sportLimits.max) {
      toast.error(
        `Maximum ${sportLimits.max} players allowed per team for ${matchData.sport}`
      );
      return;
    }

    setMatchData({
      ...matchData,
      [`${team}Players`]: [...playerData, playerName.trim()],
    });

    if (team === "team1") {
      setTeam1PlayerInput("");
    } else {
      setTeam2PlayerInput("");
    }
  };

  const removePlayerFromTeam = (team, index) => {
    const playerData = matchData[`${team}Players`] || [];
    setMatchData({
      ...matchData,
      [`${team}Players`]: playerData.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-300 hover:text-white"
            >
              <ArrowLeft size={20} />
              Back to Home
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <PlayCircle className="text-green-400" />
              Quick Match
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step
                      ? "bg-green-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      currentStep > step ? "bg-green-500" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 text-slate-300">
            {currentStep === 1 && "Choose Your Sport"}
            {currentStep === 2 && "Select Match Type"}
            {currentStep === 3 && "Enter Participants"}
          </div>
        </div>

        {/* Step 1: Sport Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">
              Choose Your Sport
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => handleSportSelect(sport.id)}
                  className="bg-slate-800 hover:bg-slate-700 p-6 rounded-lg text-center transition-all hover:scale-105"
                >
                  <div className="text-4xl mb-2">{sport.icon}</div>
                  <div className="font-medium">{sport.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Match Type Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">
              Select Match Type for {matchData.sport}
            </h2>
            {(matchData.sport === "Tennis" ||
              matchData.sport === "Badminton" ||
              matchData.sport === "Table Tennis") && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm text-center">
                  💡 {matchData.sport} is typically played as individual matches
                  (1v1 or 2v2)
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleMatchTypeSelect("individual")}
                className="bg-slate-800 hover:bg-slate-700 p-8 rounded-lg text-center transition-all hover:scale-105"
              >
                <Users className="mx-auto mb-4 text-blue-400" size={48} />
                <h3 className="text-xl font-bold mb-2">Individual Match</h3>
                <p className="text-slate-300">
                  {matchData.sport === "Tennis" ||
                  matchData.sport === "Badminton" ||
                  matchData.sport === "Table Tennis"
                    ? "Singles Match (1v1)"
                    : "Player vs Player"}
                </p>
              </button>
              <button
                onClick={() => handleMatchTypeSelect("team")}
                className="bg-slate-800 hover:bg-slate-700 p-8 rounded-lg text-center transition-all hover:scale-105"
              >
                <Trophy className="mx-auto mb-4 text-yellow-400" size={48} />
                <h3 className="text-xl font-bold mb-2">Team Match</h3>
                <p className="text-slate-300">
                  {matchData.sport === "Tennis" ||
                  matchData.sport === "Badminton" ||
                  matchData.sport === "Table Tennis"
                    ? "Doubles Match (2v2)"
                    : "Team vs Team"}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Participant Entry */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">
              Enter Participants
            </h2>
            <div className="space-y-6">
              {matchData.matchType === "individual" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Player 1 Name
                    </label>
                    <input
                      type="text"
                      value={matchData.player1}
                      onChange={(e) =>
                        setMatchData({ ...matchData, player1: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter player 1 name"
                    />
                  </div>
                  <div className="text-center text-slate-400 font-bold">VS</div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Player 2 Name
                    </label>
                    <input
                      type="text"
                      value={matchData.player2}
                      onChange={(e) =>
                        setMatchData({ ...matchData, player2: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter player 2 name"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Team 1 Name
                    </label>
                    <input
                      type="text"
                      value={matchData.team1}
                      onChange={(e) =>
                        setMatchData({ ...matchData, team1: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter team 1 name"
                    />

                    {/* Team 1 Players */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">
                        Team 1 Players ({matchData.team1Players?.length || 0}/
                        {getSportPlayerLimits(matchData.sport).max})
                      </label>
                      <p className="text-xs text-slate-400 mb-2">
                        Recommended:{" "}
                        {getSportPlayerLimits(matchData.sport).recommended}{" "}
                        players for {matchData.sport}
                      </p>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={team1PlayerInput}
                          onChange={(e) => setTeam1PlayerInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addPlayerToTeam("team1", team1PlayerInput);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="Enter player name"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            addPlayerToTeam("team1", team1PlayerInput)
                          }
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Add
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {matchData.team1Players?.map((player, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-slate-700 px-3 py-2 rounded-lg mb-1"
                          >
                            <span className="text-sm">
                              {index + 1}. {player}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removePlayerFromTeam("team1", index)
                              }
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-slate-400 font-bold">VS</div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Team 2 Name
                    </label>
                    <input
                      type="text"
                      value={matchData.team2}
                      onChange={(e) =>
                        setMatchData({ ...matchData, team2: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter team 2 name"
                    />

                    {/* Team 2 Players */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">
                        Team 2 Players ({matchData.team2Players?.length || 0}/
                        {getSportPlayerLimits(matchData.sport).max})
                      </label>
                      <p className="text-xs text-slate-400 mb-2">
                        Recommended:{" "}
                        {getSportPlayerLimits(matchData.sport).recommended}{" "}
                        players for {matchData.sport}
                      </p>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={team2PlayerInput}
                          onChange={(e) => setTeam2PlayerInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              addPlayerToTeam("team2", team2PlayerInput);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="Enter player name"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            addPlayerToTeam("team2", team2PlayerInput)
                          }
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Add
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {matchData.team2Players?.map((player, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-slate-700 px-3 py-2 rounded-lg mb-1"
                          >
                            <span className="text-sm">
                              {index + 1}. {player}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removePlayerFromTeam("team2", index)
                              }
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleStartMatch}
                  disabled={!isFormValid()}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    isFormValid()
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Start Match
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
