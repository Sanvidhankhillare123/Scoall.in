import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Direct test with environment variables
const supabaseUrl = "https://lsllcoqtbctukuryrwsf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbGxjb3F0YmN0dWt1cnlyd3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzY1MzcsImV4cCI6MjA3MTE1MjUzN30.ucJ0AwIXz_ictLmRpZvt0LSzztTkYCXDWIZVa2xgm4g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add test data directly
async function addTestData() {
  try {
    console.log("Adding test data...");

    // Add sports
    console.log("Adding sports...");
    const { error: sportsError } = await supabase
      .from("sports")
      .insert([
        { name: "Cricket" },
        { name: "Football" },
        { name: "Basketball" },
        { name: "Volleyball" },
        { name: "Badminton" },
      ]);

    if (sportsError && !sportsError.message.includes("duplicate")) {
      console.error("Sports error:", sportsError);
    } else {
      console.log("✅ Sports added");
    }

    // Add colleges
    console.log("Adding colleges...");
    const { error: collegesError } = await supabase.from("colleges").insert([
      { name: "Indian Institute of Technology Bombay", code: "IITB" },
      { name: "Indian Institute of Technology Delhi", code: "IITD" },
      { name: "Indian Institute of Technology Madras", code: "IITM" },
      { name: "Indian Institute of Technology Kharagpur", code: "IITKGP" },
    ]);

    if (collegesError && !collegesError.message.includes("duplicate")) {
      console.error("Colleges error:", collegesError);
    } else {
      console.log("✅ Colleges added");
    }

    // Get sports and colleges for events
    const { data: sports } = await supabase.from("sports").select("*");
    const { data: colleges } = await supabase.from("colleges").select("*");

    console.log("Creating events...");
    if (sports && sports.length > 0) {
      const events = [];
      sports.slice(0, 3).forEach((sport) => {
        events.push({
          sport_id: sport.id,
          name: `Men's ${sport.name}`,
          gender: "male",
          participant_type: "team",
          team_size:
            sport.name === "Cricket" ? 11 : sport.name === "Football" ? 11 : 5,
          max_entries_per_college: 1,
          registration_deadline: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          locked: false,
        });
      });

      const { error: eventsError } = await supabase
        .from("events")
        .insert(events);
      if (eventsError) {
        console.error("Events error:", eventsError);
      } else {
        console.log("✅ Events added");
      }
    }

    console.log("Test data setup complete!");
  } catch (err) {
    console.error("Failed to add test data:", err);
  }
}

addTestData();
