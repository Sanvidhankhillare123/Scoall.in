import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lsllcoqtbctukuryrwsf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbGxjb3F0YmN0dWt1cnlyd3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzY1MzcsImV4cCI6MjA3MTE1MjUzN30.ucJ0AwIXz_ictLmRpZvt0LSzztTkYCXDWIZVa2xgm4g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAndAddMatches() {
  try {
    // Get team events
    const { data: teamEvents } = await supabase
      .from("events")
      .select("*")
      .eq("participant_type", "team")
      .limit(2);

    const { data: colleges } = await supabase
      .from("colleges")
      .select("*")
      .limit(4);

    if (
      !teamEvents ||
      !colleges ||
      teamEvents.length < 2 ||
      colleges.length < 4
    ) {
      console.error("Need at least 2 team events and 4 colleges");
      return;
    }

    // Create entries without registration_time
    const entries = [
      {
        event_id: teamEvents[0].id,
        college_id: colleges[0].id,
        label: `${colleges[0].code} Team`,
      },
      {
        event_id: teamEvents[0].id,
        college_id: colleges[1].id,
        label: `${colleges[1].code} Team`,
      },
      {
        event_id: teamEvents[1].id,
        college_id: colleges[2].id,
        label: `${colleges[2].code} Team`,
      },
      {
        event_id: teamEvents[1].id,
        college_id: colleges[3].id,
        label: `${colleges[3].code} Team`,
      },
    ];

    console.log("Creating simplified entries...");
    const { data: insertedEntries, error: entriesError } = await supabase
      .from("entries")
      .insert(entries)
      .select();

    if (entriesError) {
      console.error("Entries error:", entriesError);
      return;
    }

    console.log("✅ Entries created:", insertedEntries?.length);

    // Create matches
    if (insertedEntries && insertedEntries.length >= 4) {
      const matches = [
        {
          event_id: teamEvents[0].id,
          entry_a_id: insertedEntries[0].id,
          entry_b_id: insertedEntries[1].id,
          status: "live",
          scheduled_at: new Date().toISOString(),
          venue: "Main Stadium",
          round_number: 1,
        },
        {
          event_id: teamEvents[1].id,
          entry_a_id: insertedEntries[2].id,
          entry_b_id: insertedEntries[3].id,
          status: "scheduled",
          scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          venue: "Court 1",
          round_number: 1,
        },
      ];

      console.log("Creating matches...");
      const { data: insertedMatches, error: matchesError } = await supabase
        .from("matches")
        .insert(matches)
        .select();

      if (matchesError) {
        console.error("Matches error:", matchesError);
      } else {
        console.log("✅ Matches created:", insertedMatches?.length);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

fixAndAddMatches();
