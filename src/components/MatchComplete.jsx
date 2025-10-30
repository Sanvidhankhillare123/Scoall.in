import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, CheckCircle, RotateCcw, User, Users } from "lucide-react";

export default function MatchComplete({ matchData }) {
  const navigate = useNavigate();

  if (!matchData) return null;

  const participant1 =
    matchData.matchType === "individual" ? matchData.player1 : matchData.team1;
  const participant2 =
    matchData.matchType === "individual" ? matchData.player2 : matchData.team2;

  // Use numeric scores for winner determination if available (for cricket), otherwise use regular scores
  const score1ToCompare =
    matchData.numericScore1 !== undefined
      ? matchData.numericScore1
      : matchData.score1;
  const score2ToCompare =
    matchData.numericScore2 !== undefined
      ? matchData.numericScore2
      : matchData.score2;

  const winner =
    score1ToCompare > score2ToCompare
      ? participant1
      : score2ToCompare > score1ToCompare
      ? participant2
      : "Draw";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
          <h2 className="text-3xl font-bold mb-4">Match Complete!</h2>

          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              {matchData.matchType === "individual" ? (
                <User className="text-blue-400" size={20} />
              ) : (
                <Users className="text-blue-400" size={20} />
              )}
              <span className="text-slate-300 capitalize">
                {matchData.sport} - {matchData.matchType}
              </span>
            </div>

            <div className="text-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <span>{participant1}</span>
                <span className="font-bold text-2xl">{matchData.score1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{participant2}</span>
                <span className="font-bold text-2xl">{matchData.score2}</span>
              </div>
            </div>

            {winner !== "Draw" && (
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Trophy size={20} />
                <span className="font-bold">Winner: {winner}</span>
              </div>
            )}

            {winner === "Draw" && (
              <div className="text-slate-300 font-bold">It's a Draw!</div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/quick-match")}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Start New Match
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium"
            >
              Back to Home
            </button>
          </div>

          <div className="mt-6 text-sm text-slate-400">
            Want to save your matches permanently?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Sign up now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
