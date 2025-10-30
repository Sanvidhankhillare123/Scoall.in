import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lsllcoqtbctukuryrwsf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbGxjb3F0YmN0dWt1cnlyd3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzY1MzcsImV4cCI6MjA3MTE1MjUzN30.ucJ0AwIXz_ictLmRpZvt0LSzztTkYCXDWIZVa2xgm4g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addRealMatchData() {
  try {
    console.log("Creating entries and matches...");

    // Get team events (not individual)
    const { data: teamEvents } = await supabase
      .from("events")
      .select("*")
      .eq("participant_type", "team")
      .limit(3);

    const { data: colleges } = await supabase
      .from("colleges")
      .select("*")
      .limit(6);

    console.log("Found team events:", teamEvents?.length);
    console.log("Found colleges:", colleges?.length);

    if (
      !teamEvents ||
      !colleges ||
      teamEvents.length < 2 ||
      colleges.length < 4
    ) {
      console.error("Need at least 2 team events and 4 colleges");
      return;
    }

    // Create entries for team events
    const entries = [];

    // For first team event
    entries.push({
      event_id: teamEvents[0].id,
      college_id: colleges[0].id,
      label: `${colleges[0].code} ${teamEvents[0].name}`,
      registration_time: new Date().toISOString(),
    });
    entries.push({
      event_id: teamEvents[0].id,
      college_id: colleges[1].id,
      label: `${colleges[1].code} ${teamEvents[0].name}`,
      registration_time: new Date().toISOString(),
    });

    // For second team event
    entries.push({
      event_id: teamEvents[1].id,
      college_id: colleges[2].id,
      label: `${colleges[2].code} ${teamEvents[1].name}`,
      registration_time: new Date().toISOString(),
    });
    entries.push({
      event_id: teamEvents[1].id,
      college_id: colleges[3].id,
      label: `${colleges[3].code} ${teamEvents[1].name}`,
      registration_time: new Date().toISOString(),
    });

    console.log("Creating entries:", entries.length);
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
          round: "Final",
        },
        {
          event_id: teamEvents[1].id,
          entry_a_id: insertedEntries[2].id,
          entry_b_id: insertedEntries[3].id,
          status: "scheduled",
          scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          venue: "Court 1",
          round: "Semi-Final",
        },
      ];

      console.log("Creating matches:", matches.length);
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

    console.log("Match data setup complete!");
  } catch (err) {
    console.error("Error:", err);
  }
}

addRealMatchData();
