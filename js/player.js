import { API_BASE, searchSongs } from './api.js';
import { playerState } from './state.js';
import { updateActiveStateUI } from './ui.js';

export const audio = document.getElementById('player');

export function initPlayer() {
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            playerState.setTime(audio.currentTime, audio.duration);
            // Dispatch a custom event for time update to decouple from state.js notify spam
            window.dispatchEvent(new CustomEvent('player-timeupdate', {
                detail: { currentTime: audio.currentTime, duration: audio.duration }
            }));
        }
    });

    audio.addEventListener('ended', async () => {
        await playNext();
    });

    audio.addEventListener('play', () => playerState.setPlaying(true));
    audio.addEventListener('pause', () => playerState.setPlaying(false));

    setupMediaSession();
}

export function playSongList(songs, index) {
    playerState.setQueue(songs, index);
    startPlayback();
}

export function startPlayback() {
    const currentSong = playerState.currentSong;
    if (!currentSong) return;

    const id = currentSong.id || currentSong.song_id;
    
    audio.src = `${API_BASE}/stream/${id}`;
    audio.play().catch(e => console.error('Playback failed:', e));
    
    playerState.setPlaying(true);
    updateActiveStateUI();
    updateMediaSession();
}

export function togglePlay() {
    if (!audio.src) return;

    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

export async function playNext() {
    const hasNext = playerState.playNext();
    
    if (hasNext) {
        startPlayback();
    } else {
        // Autoplay Fallback if Queue ends
        const fallbackQueries = ['lofi', 'pop', 'rock', 'synthwave'];
        const query = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)];
        
        try {
            const newSongs = await searchSongs(query);
            if (newSongs && newSongs.length > 0) {
                playerState.appendQueue(newSongs);
                playerState.playNext();
                startPlayback();
            }
        } catch (e) {
            console.error("Smart fallback failed:", e);
        }
    }
}

export function playPrev() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        if (playerState.playPrev()) {
            startPlayback();
        }
    }
}

export function seekTo(percent) {
    if (audio.duration) {
        audio.currentTime = (percent / 100) * audio.duration;
    }
}

export function setVolume(percent) {
    audio.volume = percent / 100;
    playerState.setVolume(audio.volume, audio.volume === 0);
}

export function toggleShuffle() {
    playerState.toggleShuffle();
}

export function toggleRepeat() {
    playerState.toggleRepeat();
}

function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.fastSeek && ('fastSeek' in audio)) {
                audio.fastSeek(details.seekTime);
            } else {
                audio.currentTime = details.seekTime;
            }
        });
    }
}

function updateMediaSession() {
    const song = playerState.currentSong;
    if (song && 'mediaSession' in navigator) {
        const thumb = song.thumbnail || song.thumb;
        const title = song.title;
        const artist = song.artist || "Unknown Artist";
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: 'Streamify',
            artwork: [
                { src: thumb, sizes: '96x96', type: 'image/jpeg' },
                { src: thumb, sizes: '256x256', type: 'image/jpeg' },
                { src: thumb, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
}
