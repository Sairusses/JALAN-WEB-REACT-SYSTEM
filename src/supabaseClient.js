// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// It’s a good practice to use environment variables for sensitive info.
// Create a .env file at the root of your project with the following:
// REACT_APP_SUPABASE_URL=your_supabase_url
// REACT_APP_SUPABASE_ANON_KEY=your_anon_key

const supabaseUrl = 'https://pynphomcjomtibzybzgt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bnBob21jam9tdGlienliemd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MDMzMjUsImV4cCI6MjA1NTM3OTMyNX0.ljlAaC5h1Oo9S8B3uz2uAjT2kSs-khevOgDCxE8vuA4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


