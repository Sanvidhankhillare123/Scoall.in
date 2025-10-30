import { createClient } from "@supabase/supabase-js";

// Direct test with environment variables
const supabaseUrl = "https://lsllcoqtbctukuryrwsf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbGxjb3F0YmN0dWt1cnlyd3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzY1MzcsImV4cCI6MjA3MTE1MjUzN30.ucJ0AwIXz_ictLmRpZvt0LSzztTkYCXDWIZVa2xgm4g";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test what tables exist
async function testConnection() {
  try {
    console.log("Testing Supabase connection...");

    // Check what tables exist
    const tables = [
      "sports",
      "colleges",
      "events",
      "participants",
      "entries",
      "matches",
      "profiles",
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(1);
        if (error) {
          console.log(`❌ Table '${table}' error:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists, rows:`, data?.length || 0);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' failed:`, err.message);
      }
    }

    return true;
  } catch (err) {
    console.error("Connection failed:", err);
    return false;
  }
}

testConnection();
