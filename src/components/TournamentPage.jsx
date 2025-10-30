import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  ListCollapse,
  BarChart,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { useOptimizedQueries } from "../hooks/useOptimizedQueries";
import AddTeamToTournamentModal from "./AddTeamToTournamentModal";

const SkeletonLoader = ({ count = 3, type = "card" }) => {
  if (type === "table") {
    return (
      <div className="space-y-2">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-brand-light/5 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-14 bg-brand-light/5 rounded-lg animate-pulse"
        ></div>
      ))}
    </div>
  );
};

export default function TournamentPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("teams");
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const { fetchTournamentData } = useOptimizedQueries();

  // Effect to fetch all tournament data using optimized query
  useEffect(() => {
    if (!tournamentId) return;

    const loadTournamentData = async () => {
      try {
        setLoading(true);
        const data = await fetchTournamentData(tournamentId);
        setTournament(data.tournament);
        setTeams(data.teams);
        setFixtures(data.matches);
      } catch (error) {
        toast.error("Error loading tournament: " + error.message);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadTournamentData();
  }, [tournamentId, fetchTournamentData, navigate]);

  // --- NEW: STANDINGS CALCULATION ---
  const standings = useMemo(() => {
    if (teams.length === 0) return [];

    // 1. Initialize stats for each team
    const stats = teams.reduce((acc, team) => {
      acc[team.id] = { name: team.name, P: 0, W: 0, L: 0, D: 0, Pts: 0 };
      return acc;
    }, {});

    // 2. Process only completed matches
    fixtures
      .filter((m) => m.status === "Completed")
      .forEach((match) => {
        const team1Stats = stats[match.team1_id];
        const team2Stats = stats[match.team2_id];

        if (team1Stats && team2Stats) {
          team1Stats.P += 1;
          team2Stats.P += 1;

          if (match.team1_score > match.team2_score) {
            team1Stats.W += 1;
            team1Stats.Pts += 3; // 3 points for a win
            team2Stats.L += 1;
          } else if (match.team2_score > match.team1_score) {
            team2Stats.W += 1;
            team2Stats.Pts += 3;
            team1Stats.L += 1;
          } else {
            team1Stats.D += 1;
            team2Stats.D += 1;
            team1Stats.Pts += 1; // 1 point for a draw
            team2Stats.Pts += 1;
          }
        }
      });

    // 3. Convert to array and sort by points
    return Object.values(stats).sort((a, b) => b.Pts - a.Pts);
  }, [teams, fixtures]);

  const handleGenerateFixtures = async () => {
    if (teams.length < 2) {
      toast.error("You need at least two teams to generate fixtures.");
      return;
    }
    const newFixtures = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        newFixtures.push({
          tournament_id: tournamentId,
          team1_id: teams[i].id,
          team2_id: teams[j].id,
          status: "Scheduled",
        });
      }
    }
    try {
      const { error: deleteError } = await supabase
        .from("matches")
        .delete()
        .eq("tournament_id", tournamentId);
      if (deleteError) throw deleteError;

      const { data, error } = await supabase
        .from("matches")
        .insert(newFixtures)
        .select(
          "*, team1:teams!matches_team1_id_fkey(name, id), team2:teams!matches_team2_id_fkey(name, id)"
        );
      if (error) throw error;
      setFixtures(data);
      toast.success(`${data.length} matches have been generated successfully!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark text-white p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold h-12 bg-brand-light/10 rounded w-1/2 mb-2 animate-pulse"></h1>
          <p className="text-xl h-8 bg-brand-light/10 rounded w-1/4 mb-12 animate-pulse"></p>
          <SkeletonLoader count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-brand-light/80 hover:text-brand-light mb-4"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <h1 className="text-4xl sm:text-5xl font-bold">{tournament.name}</h1>
          <p className="text-xl text-blue-400 mt-2">{tournament.sport}</p>
        </div>

        <div className="border-b border-brand-light/20 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("teams")}
              className={`py-4 px-1 font-semibold transition-colors ${
                activeTab === "teams"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-brand-light/80 hover:text-brand-light"
              }`}
            >
              <Users className="inline-block mr-2" size={20} />
              Teams
            </button>
            <button
              onClick={() => setActiveTab("fixtures")}
              className={`py-4 px-1 font-semibold transition-colors ${
                activeTab === "fixtures"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-brand-light/80 hover:text-brand-light"
              }`}
            >
              <ListCollapse className="inline-block mr-2" size={20} />
              Fixtures
            </button>
            <button
              onClick={() => setActiveTab("standings")}
              className={`py-4 px-1 font-semibold transition-colors ${
                activeTab === "standings"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-brand-light/80 hover:text-brand-light"
              }`}
            >
              <BarChart className="inline-block mr-2" size={20} />
              Standings
            </button>
          </nav>
        </div>

        <div>
          {activeTab === "teams" && (
            <div>
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setIsAddTeamModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle size={20} /> Add Registered Team
                </button>
              </div>
              <AddTeamToTournamentModal
                isOpen={isAddTeamModalOpen}
                onClose={() => setIsAddTeamModalOpen(false)}
                tournamentId={tournamentId}
                onTeamAdded={(newTeam) => setTeams([...teams, newTeam])}
              />
              {teams.length === 0 ? (
                <div className="text-center py-16 bg-brand-light/5 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-2">No Teams Yet</h2>
                  <p className="text-brand-light/60">
                    Add your first team to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-brand-light/5 p-4 rounded-lg font-semibold"
                    >
                      {team.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "fixtures" && (
            <div>
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleGenerateFixtures}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} /> Generate Fixtures
                </button>
              </div>
              {fixtures.length === 0 ? (
                <div className="text-center py-16 bg-brand-light/5 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-2">
                    No Fixtures Generated
                  </h2>
                  <p className="text-brand-light/60">
                    Add at least two teams and then generate the fixtures.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fixtures.map((match) => {
                    const isCompleted = match.status === "Completed";
                    return (
                      <button
                        key={match.id}
                        onClick={() => navigate(`/match/${match.id}/score`)}
                        disabled={isCompleted}
                        className="w-full bg-brand-light/5 p-4 rounded-lg flex justify-between items-center text-left border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:border-blue-500 enabled:hover:bg-brand-light/10"
                      >
                        {" "}
                        <div className="font-bold text-lg">
                          {match.team1.name}{" "}
                          <span className="text-brand-light/60 mx-2">vs</span>{" "}
                          {match.team2.name}
                        </div>{" "}
                        <div
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            isCompleted
                              ? "bg-green-500/20 text-green-400"
                              : "text-brand-light/80"
                          }`}
                        >
                          {isCompleted
                            ? tournament.sport === "Cricket"
                              ? `Final: ${match.team1_score}/${
                                  match.team1_wickets || 0
                                } - ${match.team2_score}/${
                                  match.team2_wickets || 0
                                }`
                              : `Final: ${match.team1_score} - ${match.team2_score}`
                            : match.status}
                        </div>{" "}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* --- NEW: STANDINGS TABLE UI --- */}
          {activeTab === "standings" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-brand-light/20 text-brand-light/80">
                  <tr>
                    <th className="p-4">Team</th>
                    <th className="p-4 text-center">Played</th>
                    <th className="p-4 text-center">Won</th>
                    <th className="p-4 text-center">Lost</th>
                    <th className="p-4 text-center">Draw</th>
                    <th className="p-4 text-center">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr
                      key={index}
                      className="border-b border-brand-light/5 hover:bg-brand-light/5"
                    >
                      <td className="p-4 font-bold">{team.name}</td>
                      <td className="p-4 text-center">{team.P}</td>
                      <td className="p-4 text-center">{team.W}</td>
                      <td className="p-4 text-center">{team.L}</td>
                      <td className="p-4 text-center">{team.D}</td>
                      <td className="p-4 text-center font-bold">{team.Pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
