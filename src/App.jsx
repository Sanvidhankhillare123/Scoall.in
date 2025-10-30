import React from "react";
import { Toaster } from "react-hot-toast";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import Page Components
import Homepage from "./components/Homepage";
import Auth from "./components/Auth";
import RoleSelection from "./components/RoleSelection";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import EventPage from "./components/EventPage";
import MatchPage from "./components/MatchPage";
import LiveScores from "./components/LiveScores";
import LiveScoring from "./components/LiveScoring";
import UnifiedLiveScoring from "./components/UnifiedLiveScoring";
import TournamentPage from "./components/TournamentPage";
import CreateTournamentWizard from "./components/CreateTournamentWizard";
import QuickMatchCreator from "./components/QuickMatchCreator";

function AppContent() {
  const { session, userProfile, loading, updateProfile } = useAuth();

  // Role-based route protection
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!session) {
      return <Navigate to="/login" replace />;
    }

    // If user has no profile or incomplete profile (no role), redirect to role selection
    if (!userProfile || !userProfile.role) {
      return <Navigate to="/role-selection" replace />;
    }

    if (requiredRole && userProfile.role !== requiredRole) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "",
          style: {
            background: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<Homepage session={session} userProfile={userProfile} />}
        />
        <Route path="/live" element={<LiveScores />} />
        <Route path="/matches/:matchId" element={<MatchPage />} />

        {/* Temporary Match Routes - No auth required */}
        <Route path="/quick-match" element={<QuickMatchCreator />} />
        <Route path="/temp-scoring/:matchId" element={<UnifiedLiveScoring />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            !session ? <Auth mode="login" /> : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/signup"
          element={
            !session ? <Auth mode="signup" /> : <Navigate to="/dashboard" />
          }
        />

        {/* Role Selection */}
        <Route
          path="/role-selection"
          element={
            session && (!userProfile || !userProfile.role) ? (
              <RoleSelection
                session={session}
                onProfileCreated={updateProfile}
              />
            ) : session ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard session={session} userProfile={userProfile} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="organizer">
              <AdminPanel session={session} userProfile={userProfile} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:eventId"
          element={
            <ProtectedRoute>
              <EventPage session={session} userProfile={userProfile} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tournaments/:tournamentId"
          element={
            <ProtectedRoute>
              <TournamentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-tournament"
          element={
            <ProtectedRoute>
              <CreateTournamentWizard session={session} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/matches/:matchId/score"
          element={
            <ProtectedRoute>
              <LiveScoring />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
