import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Search, PlusCircle } from "lucide-react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import { debounce } from "lodash";

export default function AddTeamToTournamentModal({
  isOpen,
  onClose,
  tournamentId,
  onTeamAdded,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingTeamId, setAddingTeamId] = useState(null);

  const searchTeams = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .ilike("name", `%${query}%`) // Case-insensitive search
        .limit(10);

      if (error) throw error;
      setSearchResults(data);
    } catch (error) {
      toast.error("Failed to search for teams.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(searchTeams, 300), []);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const handleAddTeam = async (team) => {
    setAddingTeamId(team.id);
    try {
      const { data, error } = await supabase
        .from("tournament_participants")
        .insert({ tournament_id: tournamentId, team_id: team.id })
        .select("*, team:teams(*)") // Select the nested team data
        .single();

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          throw new Error("This team is already in the tournament.");
        }
        throw error;
      }
      toast.success(`${team.name} added to the tournament!`);
      onTeamAdded(data.team); // Pass the newly added team back to the parent
      onClose(); // Close modal on success
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAddingTeamId(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-brand-dark border border-brand-light/20 rounded-xl w-11/12 max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Add Team to Tournament</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray"
            size={20}
          />
          <input
            type="text"
            placeholder="Search for a team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-light/5 p-3 pl-10 rounded-lg border-2 border-brand-light/10 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2 h-64 overflow-y-auto">
          {loading ? (
            <p className="text-brand-gray text-center">Searching...</p>
          ) : (
            searchResults.map((team) => (
              <div
                key={team.id}
                className="flex justify-between items-center p-3 bg-brand-light/5 rounded-lg"
              >
                <span className="font-semibold">{team.name}</span>
                <button
                  onClick={() => handleAddTeam(team)}
                  disabled={addingTeamId === team.id}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold disabled:bg-brand-gray flex items-center gap-1"
                >
                  <PlusCircle size={16} />{" "}
                  {addingTeamId === team.id ? "Adding..." : "Add"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
