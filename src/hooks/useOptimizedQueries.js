import { useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useDataCache } from "./useDataCache";

export const useOptimizedQueries = () => {
  const { fetchWithCache, invalidateCache } = useDataCache();

  // Optimized dashboard data fetching
  const fetchDashboardData = useCallback(
    async (userProfile, activeTab) => {
      const cacheKey = `dashboard-${userProfile.id}-${activeTab}`;

      return fetchWithCache(
        cacheKey,
        async (signal) => {
          if (userProfile?.role !== "college_admin") {
            return { participants: [], entries: [], events: [] };
          }

          const queries = [];

          if (activeTab === "participants") {
            queries.push(
              supabase
                .from("participants")
                .select("*")
                .eq("college_id", userProfile.college_id)
                .order("name")
                .abortSignal(signal)
            );
          }

          if (activeTab === "entries") {
            queries.push(
              supabase
                .from("entries")
                .select(
                  `
              *,
              event:events(
                name,
                participant_type,
                team_size,
                max_entries_per_college,
                locked,
                sport:sports(name)
              )
            `
                )
                .eq("college_id", userProfile.college_id)
                .order("created_at", { ascending: false })
                .abortSignal(signal)
            );
          }

          if (activeTab === "events") {
            queries.push(
              supabase
                .from("events")
                .select(
                  `
              *,
              sport:sports(name),
              entries!entries_event_id_fkey(
                count,
                college_id
              )
            `
                )
                .order("name")
                .abortSignal(signal)
            );
          }

          const results = await Promise.all(queries);
          const data = {};

          if (activeTab === "participants" && results[0]) {
            const { data: participants, error } = results[0];
            if (error) throw error;
            data.participants = participants || [];
          }

          if (activeTab === "entries" && results[0]) {
            const { data: entries, error } = results[0];
            if (error) throw error;
            data.entries = entries || [];
          }

          if (activeTab === "events" && results[0]) {
            const { data: events, error } = results[0];
            if (error) throw error;
            data.events = events || [];
          }

          return data;
        },
        { ttl: 2 * 60 * 1000 }
      ); // 2 minutes cache for dashboard data
    },
    [fetchWithCache]
  );

  // Optimized live matches fetching
  const fetchLiveMatches = useCallback(async () => {
    const cacheKey = "live-matches";

    return fetchWithCache(
      cacheKey,
      async (signal) => {
        const { data, error } = await supabase
          .from("matches")
          .select(
            `
          *,
          event:events(
            name,
            sport:sports(name)
          ),
          entry_a:entries!matches_entry_a_id_fkey(
            label,
            college:colleges(name, code)
          ),
          entry_b:entries!matches_entry_b_id_fkey(
            label,
            college:colleges(name, code)
          ),
          winner_entry:entries!matches_winner_entry_id_fkey(
            label,
            college:colleges(name, code)
          )
        `
          )
          .in("status", ["live", "scheduled"])
          .order("scheduled_at", { ascending: true })
          .limit(20) // Limit results
          .abortSignal(signal);

        if (error) throw error;
        return data || [];
      },
      { ttl: 30 * 1000 }
    ); // 30 seconds cache for live data
  }, [fetchWithCache]);

  // Optimized tournament data fetching
  const fetchTournamentData = useCallback(
    async (tournamentId) => {
      const cacheKey = `tournament-${tournamentId}`;

      return fetchWithCache(
        cacheKey,
        async (signal) => {
          // Fetch all tournament data in parallel
          const [tournamentQuery, teamsQuery, matchesQuery] = await Promise.all(
            [
              supabase
                .from("tournaments")
                .select("*")
                .eq("id", tournamentId)
                .single()
                .abortSignal(signal),

              supabase
                .from("tournament_participants")
                .select("team:teams(*)")
                .eq("tournament_id", tournamentId)
                .abortSignal(signal),

              supabase
                .from("matches")
                .select(
                  `
            *, 
            team1:teams!matches_team1_id_fkey(name, id), 
            team2:teams!matches_team2_id_fkey(name, id)
          `
                )
                .eq("tournament_id", tournamentId)
                .order("created_at")
                .abortSignal(signal),
            ]
          );

          if (tournamentQuery.error) throw tournamentQuery.error;
          if (teamsQuery.error) throw teamsQuery.error;
          if (matchesQuery.error) throw matchesQuery.error;

          return {
            tournament: tournamentQuery.data,
            teams: teamsQuery.data?.map((p) => p.team) || [],
            matches: matchesQuery.data || [],
          };
        },
        { ttl: 60 * 1000 }
      ); // 1 minute cache
    },
    [fetchWithCache]
  );

  // Optimized colleges fetching
  const fetchColleges = useCallback(async () => {
    const cacheKey = "colleges";

    return fetchWithCache(
      cacheKey,
      async (signal) => {
        const { data, error } = await supabase
          .from("colleges")
          .select("*")
          .order("name")
          .abortSignal(signal);

        if (error) throw error;
        return data || [];
      },
      { ttl: 10 * 60 * 1000 }
    ); // 10 minutes cache for static data
  }, [fetchWithCache]);

  return {
    fetchDashboardData,
    fetchLiveMatches,
    fetchTournamentData,
    fetchColleges,
    invalidateCache,
  };
};
