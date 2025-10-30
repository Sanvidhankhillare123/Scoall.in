import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Calendar, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useOptimizedQueries } from "../hooks/useOptimizedQueries";
import { useLiveScoresSubscription } from "../hooks/useRealtimeSubscription";

export default function LiveScores() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchLiveMatches } = useOptimizedQueries();

  // Optimized match update handler
  const handleMatchUpdate = useCallback((updatedMatch) => {
    setMatches((prevMatches) =>
      prevMatches.map((match) =>
        match.id === updatedMatch.id ? { ...match, ...updatedMatch } : match
      )
    );
  }, []);

  // Use optimized real-time subscription
  useLiveScoresSubscription(handleMatchUpdate);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const data = await fetchLiveMatches();
        setMatches(data || []);
      } catch (error) {
        console.error("Error loading matches:", error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Loading timeout reached in LiveScores");
        setLoading(false);
        setMatches([]);
      }
    }, 5000);

    loadMatches();

    return () => clearTimeout(timeoutId);
  }, [fetchLiveMatches]);

  const getMatchStatus = (match) => {
    switch (match.status) {
      case "live":
        return { text: "LIVE", color: "bg-red-500" };
      case "scheduled":
        return { text: "SCHEDULED", color: "bg-blue-500" };
      case "finished":
        return { text: "FINISHED", color: "bg-green-500" };
      default:
        return { text: "UNKNOWN", color: "bg-gray-500" };
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading live scores...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </button>

            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-bold">Live Scores</h1>
            </div>

            <div className="text-sm text-slate-400">Auto-refreshing</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-400 mb-2">
              No Live Matches
            </h2>
            <p className="text-slate-500">
              Check back later for live matches and scores
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">
              {matches.filter((m) => m.status === "live").length > 0
                ? "Live & Upcoming Matches"
                : "Upcoming Matches"}
            </h2>

            <div className="grid gap-6">
              {matches.map((match) => {
                const status = getMatchStatus(match);

                return (
                  <div
                    key={match.id}
                    onClick={() => navigate(`/matches/${match.id}`)}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium text-white ${status.color}`}
                        >
                          {status.text}
                        </span>

                        <div className="text-sm text-slate-400">
                          {match.event?.sport?.name} • {match.event?.name}
                        </div>
                      </div>

                      <div className="text-sm text-slate-400">
                        Round {match.round_number}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-lg font-semibold mb-1">
                          {match.entry_a?.college?.name || "TBD"}
                          {match.entry_a?.label && (
                            <span className="text-sm text-slate-400 ml-2">
                              ({match.entry_a.label})
                            </span>
                          )}
                        </div>

                        <div className="text-lg font-semibold">
                          {match.entry_b?.college?.name || "TBD"}
                          {match.entry_b?.label && (
                            <span className="text-sm text-slate-400 ml-2">
                              ({match.entry_b.label})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-center mx-8">
                        <div className="text-2xl font-bold text-slate-300">
                          VS
                        </div>
                      </div>

                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end space-x-4 text-sm text-slate-400">
                          {match.scheduled_at && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(match.scheduled_at)}</span>
                            </div>
                          )}

                          {match.scheduled_at && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(match.scheduled_at)}</span>
                            </div>
                          )}

                          {match.venue && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{match.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {match.winner_entry_id && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-sm text-green-400">
                          Winner: {match.winner_entry?.college?.name}
                          {match.winner_entry?.label &&
                            ` (${match.winner_entry.label})`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
