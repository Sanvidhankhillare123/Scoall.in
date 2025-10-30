import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Trophy, Plus, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { useOptimizedQueries } from "../hooks/useOptimizedQueries";

export default function Dashboard({ session, userProfile }) {
  const [dashboardData, setDashboardData] = useState({
    participants: [],
    entries: [],
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("participants");
  const navigate = useNavigate();
  const { fetchDashboardData } = useOptimizedQueries();

  useEffect(() => {
    if (!userProfile) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData(userProfile, activeTab);
        setDashboardData((prevData) => ({ ...prevData, ...data }));
      } catch (error) {
        toast.error("Error fetching data");
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userProfile, activeTab, fetchDashboardData]);

  const getDashboardContent = () => {
    switch (userProfile?.role) {
      case "organizer":
        return <OrganizerDashboard navigate={navigate} />;
      case "college_admin":
        return (
          <CollegeDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            participants={dashboardData.participants}
            entries={dashboardData.entries}
            events={dashboardData.events}
            loading={loading}
            userProfile={userProfile}
            navigate={navigate}
          />
        );
      case "scorer":
        return <ScorerDashboard navigate={navigate} />;
      default:
        return <div className="text-center py-16">Loading...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
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
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium">
                {userProfile?.full_name}
              </div>
              <div className="text-xs text-slate-400 capitalize">
                {userProfile?.role?.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getDashboardContent()}
      </div>
    </div>
  );
}

// Organizer Dashboard
function OrganizerDashboard({ navigate }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Organizer Dashboard</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => navigate("/admin")}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <Trophy className="h-8 w-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Manage Events</h3>
            <p className="text-slate-400">
              Create and manage sports, events, and colleges
            </p>
          </div>

          <div
            onClick={() => navigate("/live")}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <Calendar className="h-8 w-8 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Live Scores</h3>
            <p className="text-slate-400">
              Monitor ongoing matches and results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// College Dashboard
function CollegeDashboard({
  activeTab,
  setActiveTab,
  participants,
  entries,
  events,
  loading,
  userProfile,
  navigate,
}) {
  const tabs = [
    { id: "participants", label: "Participants", icon: Users },
    { id: "entries", label: "My Entries", icon: Trophy },
    { id: "events", label: "Available Events", icon: Calendar },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">College Dashboard</h2>
        <p className="text-slate-400">
          Manage your college's participation in events
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-16">Loading...</div>
      ) : (
        <div>
          {activeTab === "participants" && (
            <ParticipantsTab participants={participants} />
          )}
          {activeTab === "entries" && <EntriesTab entries={entries} />}
          {activeTab === "events" && (
            <EventsTab events={events} userProfile={userProfile} />
          )}
        </div>
      )}
    </div>
  );
}

// Scorer Dashboard
function ScorerDashboard({ navigate }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Scorer Dashboard</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate("/live")}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <Trophy className="h-8 w-8 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Assigned Matches</h3>
            <p className="text-slate-400">
              View and score your assigned matches
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Components
function ParticipantsTab({ participants }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Participants</h3>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Add Participant</span>
        </button>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          No participants added yet. Start by adding participants to your
          college.
        </div>
      ) : (
        <div className="grid gap-4">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4"
            >
              <h4 className="font-semibold">{participant.name}</h4>
              {participant.email && (
                <p className="text-sm text-slate-400">{participant.email}</p>
              )}
              {participant.phone && (
                <p className="text-sm text-slate-400">{participant.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EntriesTab({ entries }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">My Entries</h3>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          No entries submitted yet. Browse available events to submit entries.
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{entry.event?.name}</h4>
                  <p className="text-sm text-slate-400">
                    {entry.event?.sport?.name}
                  </p>
                  {entry.label && (
                    <p className="text-sm text-slate-300">{entry.label}</p>
                  )}
                </div>

                <span
                  className={`px-2 py-1 rounded text-xs ${
                    entry.status === "approved"
                      ? "bg-green-600"
                      : entry.status === "submitted"
                      ? "bg-blue-600"
                      : "bg-yellow-600"
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventsTab({ events, userProfile }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Available Events</h3>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          No events available yet. Check back later for event announcements.
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const collegeEntries =
              event.entries?.filter(
                (e) => e.college_id === userProfile.college_id
              ) || [];
            const canAddEntry =
              !event.locked &&
              collegeEntries.length < event.max_entries_per_college;

            return (
              <div
                key={event.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{event.name}</h4>

                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          event.locked ? "bg-red-600" : "bg-green-600"
                        }`}
                      >
                        {event.locked ? "Locked" : "Open"}
                      </span>

                      <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                        {event.participant_type}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mb-2">
                      {event.sport?.name}
                      {event.team_size && ` • Team Size: ${event.team_size}`}
                    </p>

                    <p className="text-sm text-slate-300">
                      Entries: {collegeEntries.length} /{" "}
                      {event.max_entries_per_college}
                    </p>
                  </div>

                  {canAddEntry && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Add Entry
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
