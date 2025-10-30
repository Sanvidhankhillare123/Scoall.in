import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lsllcoqtbctukuryrwsf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbGxjb3F0YmN0dWt1cnlyd3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzY1MzcsImV4cCI6MjA3MTE1MjUzN30.ucJ0AwIXz_ictLmRpZvt0LSzztTkYCXDWIZVa2xgm4g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addMatchData() {
  try {
    console.log("Adding entries and matches...");

    // Get some events and colleges
    const { data: events } = await supabase.from("events").select("*").limit(3);
    const { data: colleges } = await supabase
      .from("colleges")
      .select("*")
      .limit(4);

    if (!events || !colleges || events.length < 3 || colleges.length < 4) {
      console.error("Need at least 3 events and 4 colleges");
      return;
    }

    // Create some entries (teams/participants)
    const entries = [];

    // Create entries for the first event (team sport)
    if (events[0].participant_type === "team") {
      entries.push({
        event_id: events[0].id,
        college_id: colleges[0].id,
        label: `${colleges[0].code} Team 1`,
        registration_time: new Date().toISOString(),
      });
      entries.push({
        event_id: events[0].id,
        college_id: colleges[1].id,
        label: `${colleges[1].code} Team 1`,
        registration_time: new Date().toISOString(),
      });
    }

    // Create entries for the second event
    if (events[1].participant_type === "team") {
      entries.push({
        event_id: events[1].id,
        college_id: colleges[2].id,
        label: `${colleges[2].code} Team 1`,
        registration_time: new Date().toISOString(),
      });
      entries.push({
        event_id: events[1].id,
        college_id: colleges[3].id,
        label: `${colleges[3].code} Team 1`,
        registration_time: new Date().toISOString(),
      });
    }

    console.log("Adding entries:", entries);
    const { data: insertedEntries, error: entriesError } = await supabase
      .from("entries")
      .insert(entries)
      .select();

    if (entriesError) {
      console.error("Entries error:", entriesError);
      return;
    }

    console.log("✅ Entries added:", insertedEntries?.length);

    // Create some matches
    if (insertedEntries && insertedEntries.length >= 4) {
      const matches = [
        {
          event_id: events[0].id,
          entry_a_id: insertedEntries[0].id,
          entry_b_id: insertedEntries[1].id,
          status: "live",
          scheduled_at: new Date().toISOString(),
          venue: "Main Stadium",
          round: "Semi-Final 1",
        },
        {
          event_id: events[1].id,
          entry_a_id: insertedEntries[2].id,
          entry_b_id: insertedEntries[3].id,
          status: "scheduled",
          scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          venue: "Court 2",
          round: "Quarter-Final",
        },
      ];

      console.log("Adding matches:", matches);
      const { data: insertedMatches, error: matchesError } = await supabase
        .from("matches")
        .insert(matches)
        .select();

      if (matchesError) {
        console.error("Matches error:", matchesError);
      } else {
        console.log("✅ Matches added:", insertedMatches?.length);
      }
    }

    console.log("Sample data setup complete!");
  } catch (err) {
    console.error("Error:", err);
  }
}

addMatchData();
