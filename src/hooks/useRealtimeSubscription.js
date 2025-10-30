import { useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabaseClient";

export const useRealtimeSubscription = () => {
  const subscriptionsRef = useRef(new Map());

  const subscribe = useCallback((config) => {
    const {
      table,
      filter,
      event = "*",
      onUpdate,
      throttle = 1000, // Default 1 second throttle
      key,
    } = config;

    // Create unique key if not provided
    const subscriptionKey =
      key || `${table}-${event}-${JSON.stringify(filter)}`;

    // Unsubscribe existing subscription with same key
    if (subscriptionsRef.current.has(subscriptionKey)) {
      const existingChannel = subscriptionsRef.current.get(subscriptionKey);
      supabase.removeChannel(existingChannel);
    }

    // Throttle updates to prevent excessive re-renders
    let lastUpdate = 0;
    const throttledUpdate = (...args) => {
      const now = Date.now();
      if (now - lastUpdate >= throttle) {
        lastUpdate = now;
        onUpdate(...args);
      }
    };

    // Create new subscription
    const channel = supabase
      .channel(`realtime-${subscriptionKey}`)
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
          filter,
        },
        throttledUpdate
      )
      .subscribe();

    // Store subscription
    subscriptionsRef.current.set(subscriptionKey, channel);

    return subscriptionKey;
  }, []);

  const unsubscribe = useCallback((key) => {
    if (subscriptionsRef.current.has(key)) {
      const channel = subscriptionsRef.current.get(key);
      supabase.removeChannel(channel);
      subscriptionsRef.current.delete(key);
    }
  }, []);

  const unsubscribeAll = useCallback(() => {
    for (const [key, channel] of subscriptionsRef.current) {
      supabase.removeChannel(channel);
    }
    subscriptionsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    subscribe,
    unsubscribe,
    unsubscribeAll,
  };
};

// Specialized hook for live scores
export const useLiveScoresSubscription = (onMatchUpdate) => {
  const { subscribe, unsubscribeAll } = useRealtimeSubscription();

  useEffect(() => {
    if (!onMatchUpdate) return;

    const subscriptionKey = subscribe({
      table: "matches",
      event: "UPDATE",
      filter: "status=in.(live,scheduled)",
      onUpdate: (payload) => {
        // Only update if it's a score or status change
        const { new: newMatch, old: oldMatch } = payload;
        if (
          newMatch.team1_score !== oldMatch.team1_score ||
          newMatch.team2_score !== oldMatch.team2_score ||
          newMatch.team1_wickets !== oldMatch.team1_wickets ||
          newMatch.team2_wickets !== oldMatch.team2_wickets ||
          newMatch.status !== oldMatch.status
        ) {
          onMatchUpdate(newMatch);
        }
      },
      throttle: 500, // More frequent updates for live scores
      key: "live-scores",
    });

    return () => {
      unsubscribeAll();
    };
  }, [subscribe, unsubscribeAll, onMatchUpdate]);
};
