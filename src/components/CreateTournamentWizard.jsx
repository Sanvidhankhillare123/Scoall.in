import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Shield, Play } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { sports } from "../sportDefinitions"; // Import the centralized list

export default function CreateTournamentWizard({ session }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState(sports[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(""); // 1. NEW STATE
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !sport || !startDate || !endDate) {
      // Added endDate to validation
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.from("tournaments").insert([
        {
          name,
          sport,
          start_date: startDate,
          end_date: endDate, // 3. ADDED end_date to the submission
          user_id: session.user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Tournament created successfully!");
      navigate("/dashboard"); // Navigate back to dashboard on success
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-full hover:bg-brand-light/10 transition-colors mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Create a New Tournament
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-brand-light/5 border border-brand-light/10 rounded-xl p-6 sm:p-8 space-y-8"
        >
          <div>
            <label className="text-xl font-semibold mb-4 flex items-center gap-3">
              <Shield /> Tournament Name
            </label>
            <input
              type="text"
              placeholder="e.g., Summer Cricket League"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full bg-brand-dark p-4 rounded-lg border-2 border-brand-light/10 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xl font-semibold mb-4 flex items-center gap-3">
              <Play /> Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="mt-2 w-full bg-brand-dark p-4 rounded-lg border-2 border-brand-light/10 focus:border-blue-500 focus:outline-none transition-colors"
            >
              {sports.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xl font-semibold mb-4 flex items-center gap-3">
              <Calendar /> Tournament Dates
            </label>
            {/* 2. NEW INPUT FIELD in a grid for start and end dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-brand-gray mb-1"
                >
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-brand-dark p-4 rounded-lg border-2 border-brand-light/10 focus:border-blue-500 focus:outline-none transition-colors text-brand-gray"
                />
              </div>
              <div>
                <label
                  htmlFor="end-date"
                  className="block text-sm font-medium text-brand-gray mb-1"
                >
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-brand-dark p-4 rounded-lg border-2 border-brand-light/10 focus:border-blue-500 focus:outline-none transition-colors text-brand-gray"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-light/10">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-transform disabled:bg-brand-gray disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Tournament"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
