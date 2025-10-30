import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";

export default function EventPage({ session, userProfile }) {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-bold">Event Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold text-slate-400 mb-2">
            Event Page
          </h2>
          <p className="text-slate-500">Event ID: {eventId}</p>
          <p className="text-slate-500 mt-4">
            This will show event details, entries, and bracket management.
          </p>
        </div>
      </div>
    </div>
  );
}
