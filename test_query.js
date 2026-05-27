const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hlsmznlopbcbhqnmyxwu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsc216bmxvcGJjYmhxbm15eHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NjU5NjYsImV4cCI6MjA5MjE0MTk2Nn0.M9afedp-fZcsqrtPEiwaqnZ-Mx9asT9Er5FfDSNiQ20'
);

async function test() {
  try {
    console.log("Fetching obligations...");
    const { data: obligations, error: errObligations } = await supabase.from('obligations').select('*').limit(5);
    console.log("Obligations:", obligations, "Error:", errObligations);

    console.log("Fetching user_profiles...");
    const { data: profiles, error: errProfiles } = await supabase.from('user_profiles').select('*').limit(5);
    console.log("User Profiles:", profiles, "Error:", errProfiles);
  } catch (e) {
    console.error("Caught error:", e);
  }
}

test();