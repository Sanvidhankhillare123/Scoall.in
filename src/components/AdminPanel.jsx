import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";

export default function AdminPanel({ session, userProfile }) {
  const [activeTab, setActiveTab] = useState("colleges");
  const [colleges, setColleges] = useState([]);
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === "colleges") {
        const { data, error } = await supabase
          .from("colleges")
          .select("*")
          .order("name");
        if (error) throw error;
        setColleges(data || []);
      } else if (activeTab === "sports") {
        const { data, error } = await supabase
          .from("sports")
          .select("*")
          .order("name");
        if (error) throw error;
        setSports(data || []);
      } else if (activeTab === "events") {
        const { data, error } = await supabase
          .from("events")
          .select(
            `
            *,
            sport:sports(name),
            entries_count:entries(count)
          `
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        setEvents(data || []);
      }
    } catch (error) {
      toast.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setEditingItem(null);
  };

  const toggleEventLock = async (eventId, currentLocked) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ locked: !currentLocked })
        .eq("id", eventId);

      if (error) throw error;

      toast.success(
        `Event ${!currentLocked ? "locked" : "unlocked"} successfully`
      );
      fetchData();
    } catch (error) {
      toast.error("Error updating event status");
    }
  };

  const deleteItem = async (id, table) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;

      toast.success("Item deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Error deleting item");
    }
  };

  const tabs = [
    { id: "colleges", label: "Colleges" },
    { id: "sports", label: "Sports" },
    { id: "events", label: "Events" },
  ];

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
              <Trophy className="h-6 w-6 text-purple-400" />
              <h1 className="text-xl font-bold">Organizer Panel</h1>
            </div>

            <div className="text-sm text-slate-400">
              {userProfile?.full_name}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === "colleges" && (
          <CollegesTab
            colleges={colleges}
            loading={loading}
            onAdd={() => openModal("college")}
            onEdit={(college) => openModal("college", college)}
            onDelete={(id) => deleteItem(id, "colleges")}
          />
        )}

        {activeTab === "sports" && (
          <SportsTab
            sports={sports}
            loading={loading}
            onAdd={() => openModal("sport")}
            onEdit={(sport) => openModal("sport", sport)}
            onDelete={(id) => deleteItem(id, "sports")}
          />
        )}

        {activeTab === "events" && (
          <EventsTab
            events={events}
            loading={loading}
            onAdd={() => openModal("event")}
            onEdit={(event) => openModal("event", event)}
            onDelete={(id) => deleteItem(id, "events")}
            onToggleLock={toggleEventLock}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          type={modalType}
          item={editingItem}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Colleges Tab Component
function CollegesTab({ colleges, loading, onAdd, onEdit, onDelete }) {
  if (loading) {
    return <div className="text-center py-8">Loading colleges...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Colleges</h2>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add College</span>
        </button>
      </div>

      <div className="grid gap-4">
        {colleges.map((college) => (
          <div
            key={college.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{college.name}</h3>
                <p className="text-slate-400">Code: {college.code}</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(college)}
                  className="p-2 text-blue-400 hover:bg-slate-700 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(college.id)}
                  className="p-2 text-red-400 hover:bg-slate-700 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sports Tab Component
function SportsTab({ sports, loading, onAdd, onEdit, onDelete }) {
  if (loading) {
    return <div className="text-center py-8">Loading sports...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sports</h2>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Sport</span>
        </button>
      </div>

      <div className="grid gap-4">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{sport.name}</h3>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(sport)}
                  className="p-2 text-blue-400 hover:bg-slate-700 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(sport.id)}
                  className="p-2 text-red-400 hover:bg-slate-700 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Events Tab Component
function EventsTab({ events, loading, onAdd, onEdit, onDelete, onToggleLock }) {
  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Events</h2>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Event</span>
        </button>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{event.name}</h3>

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

                <p className="text-slate-400">
                  Sport: {event.sport?.name} • Max Entries:{" "}
                  {event.max_entries_per_college} •
                  {event.team_size && `Team Size: ${event.team_size}`}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onToggleLock(event.id, event.locked)}
                  className={`p-2 rounded ${
                    event.locked
                      ? "text-green-400 hover:bg-slate-700"
                      : "text-red-400 hover:bg-slate-700"
                  }`}
                >
                  {event.locked ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={() => onEdit(event)}
                  className="p-2 text-blue-400 hover:bg-slate-700 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onDelete(event.id)}
                  className="p-2 text-red-400 hover:bg-slate-700 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Modal Component (placeholder - needs full implementation)
function Modal({ type, item, onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {item ? `Edit ${type}` : `Add ${type}`}
        </h3>

        <p className="text-slate-400 mb-4">
          Modal implementation needed for {type}
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
