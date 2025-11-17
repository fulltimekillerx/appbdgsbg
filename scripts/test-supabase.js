
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or anon key not found. Make sure you have set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase.from('paper_rolls').select('*').limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }

    console.log('Successfully connected to Supabase!');
    console.log('Sample data from paper_rolls:', data);
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
  }
}

testSupabase();
