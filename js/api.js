export const API_BASE = "http://localhost:5000";

// Export the singleton supabase client
const SUPABASE_URL = "https://ycplraanzktxpfbibwwb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcGxyYWFuemt0eHBmYmlid3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjY2MjksImV4cCI6MjA5MzI0MjYyOX0.Kd9l-hWbpaBMXqOp4MoaRML50Sv0E_LozC6k6SQNXm4";

// The supabase library is loaded globally via CDN in index.html
export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export async function searchSongs(query) {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to fetch songs");
    return await res.json();
}
