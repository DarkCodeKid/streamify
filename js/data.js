import { API_BASE, supabaseClient } from './api.js';
import { currentUser } from './auth.js';
import { showToast } from './ui.js';

// ================= FAVORITES =================
export async function toggleFavorite(id, title, thumb) {
    if (!currentUser) return false;

    try {
        // Check if exists
        const { data: existing } = await supabaseClient
            .from("favorites")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("song_id", id)
            .single();

        if (existing) {
            // Remove it
            const { error } = await supabaseClient.from("favorites").delete().eq("id", existing.id);
            if (error) throw error;
            showToast("Removed from Favorites", "info");
            return false; // Not favorited anymore
        } else {
            // Add it
            const { error } = await supabaseClient.from("favorites").insert([
                { user_id: currentUser.id, song_id: id, title, thumb }
            ]);
            if (error) throw error;
            showToast("Added to Favorites");
            return true; // Favorited
        }
    } catch (err) {
        console.error(err);
        showToast("Failed to update favorites", "error");
        return null;
    }
}

export async function fetchFavorites() {
    if (!currentUser) return [];

    const { data, error } = await supabaseClient
        .from("favorites")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error(error);
        return [];
    }

    // Map so they look like regular songs, but mark them as favorite
    return data.map(song => ({
        id: song.song_id,
        title: song.title,
        thumb: song.thumb,
        isFavorite: true
    }));
}

// ================= DOWNLOADS =================
export async function downloadSong(id, title, thumb, progressCallback) {
    try {
        const streamUrl = `${API_BASE}/stream/${id}`;
        
        // Fetch to read stream for progress
        const response = await fetch(streamUrl);
        if (!response.ok) throw new Error("Network response was not ok");

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        // If no content length, we can't show accurate progress, but we still cache it
        const cache = await caches.open("music-cache-v1");
        
        if (!total) {
            // Just add to cache directly if stream size is unknown
            await cache.add(streamUrl);
            if (progressCallback) progressCallback(100);
        } else {
            const reader = response.body.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;
                if (progressCallback) {
                    progressCallback(Math.round((loaded / total) * 100));
                }
            }
            
            const blob = new Blob(chunks, { type: 'audio/mpeg' });
            const cacheResponse = new Response(blob, {
                headers: { 'Content-Type': 'audio/mpeg' }
            });
            await cache.put(streamUrl, cacheResponse);
        }

        // Save metadata
        const downloads = getDownloads();
        if (!downloads.some(d => d.id === id)) {
            downloads.push({ id, title, thumb, url: streamUrl });
            localStorage.setItem('streamify_downloads', JSON.stringify(downloads));
        }

        showToast("Download complete!");
        return true;
    } catch (err) {
        console.error("Download error:", err);
        showToast("Download failed. CORS or backend issue.", "error");
        return false;
    }
}

export function getDownloads() {
    try {
        return JSON.parse(localStorage.getItem('streamify_downloads') || '[]');
    } catch {
        return [];
    }
}
