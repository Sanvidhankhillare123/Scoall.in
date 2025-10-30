import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { useOptimizedQueries } from "../hooks/useOptimizedQueries";

export default function RoleSelection({ session, onProfileCreated }) {
  const [role, setRole] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const navigate = useNavigate();
  const { fetchColleges } = useOptimizedQueries();

  React.useEffect(() => {
    const loadColleges = async () => {
      try {
        setLoadingColleges(true);
        const data = await fetchColleges();
        setColleges(data);
      } catch (error) {
        toast.error("Error fetching colleges");
      } finally {
        setLoadingColleges(false);
      }
    };

    loadColleges();
  }, [fetchColleges]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      toast.error("Please select a role");
      return;
    }

    if (role === "college_admin" && !collegeId) {
      toast.error("Please select your college");
      return;
    }

    try {
      setLoading(true);

      const profileData = {
        full_name: session.user.user_metadata?.full_name || session.user.email,
        role,
        college_id: role === "college_admin" ? collegeId : null,
      };

      // Try to update existing profile first, if that fails, create new one
      let { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", session.user.id)
        .select()
        .single();

      // If update failed because profile doesn't exist, create it
      if (error && error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("profiles")
          .insert([{ ...profileData, id: session.user.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      onProfileCreated(data);
      toast.success("Profile completed successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile creation error:", error);
      toast.error(error.message || "Error completing profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Complete Your Profile
        </h1>
        <p className="text-center text-slate-300 mb-8">
          Please select your role to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Your Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-900 p-4 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-white"
              required
            >
              <option value="">Choose a role...</option>
              <option value="organizer">Event Organizer</option>
              <option value="college_admin">College Representative</option>
              <option value="scorer">Scorer/Official</option>
            </select>
          </div>

          {role === "college_admin" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Your College
              </label>
              {loadingColleges ? (
                <div className="w-full bg-slate-900 p-4 rounded-lg border border-slate-600 text-slate-400">
                  Loading colleges...
                </div>
              ) : (
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full bg-slate-900 p-4 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-white"
                  required
                >
                  <option value="">Choose your college...</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name} ({college.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Profile..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
