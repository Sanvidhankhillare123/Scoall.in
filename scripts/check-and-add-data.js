import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lsllcoqtbctukuryrwsf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbGxjb3F0YmN0dWt1cnlyd3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzY1MzcsImV4cCI6MjA3MTE1MjUzN30.ucJ0AwIXz_ictLmRpZvt0LSzztTkYCXDWIZVa2xgm4g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchemaAndAddData() {
  try {
    console.log("Checking current data...");

    // Check sports data
    const { data: sports } = await supabase.from("sports").select("*");
    console.log("Sports:", sports);

    // Check colleges data
    const { data: colleges } = await supabase.from("colleges").select("*");
    console.log("Colleges:", colleges);

    // Check events data and schema
    const { data: events } = await supabase.from("events").select("*");
    console.log("Events:", events);

    // Try to add a simple event without gender field
    if (sports && sports.length > 0) {
      console.log("Adding a simple event...");
      const { data: newEvent, error } = await supabase
        .from("events")
        .insert({
          sport_id: sports[0].id,
          name: `${sports[0].name} Tournament`,
          participant_type: "team",
          team_size: 5,
          max_entries_per_college: 1,
          registration_deadline: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          locked: false,
        })
        .select();

      if (error) {
        console.error("Event creation error:", error);
      } else {
        console.log("✅ Event created:", newEvent);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

checkSchemaAndAddData();
