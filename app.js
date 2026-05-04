import { searchSongs } from './js/api.js';
import { initAuth, requireLogin, currentUser } from './js/auth.js';
import { toggleFavorite, fetchFavorites, downloadSong, getDownloads } from './js/data.js';
import { initPlayer, playSongList, togglePlay, playNext, playPrev, seekTo, setVolume, toggleShuffle, toggleRepeat } from './js/player.js';
import { els, showTab, renderSongs, renderDownloads, initPlayerUI } from './js/ui.js';

// ================= APP INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    initAuth(onAuthChange);
    
    // Initialize Audio Engine
    initPlayer();
    
    // Initialize UI and pass player actions to it
    initPlayerUI({ 
        togglePlay, 
        playNext, 
        playPrev, 
        seekTo, 
        setVolume, 
        toggleShuffle, 
        toggleRepeat 
    });
    
    setupEventListeners();
    loadFavorites();
    
    // Init Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').catch(err => {
            console.error('Service Worker registration failed:', err);
        });
    }
});

function setupEventListeners() {
    // Navigation Tabs
    els.navs.home.addEventListener('click', () => handleTabSwitch('home'));
    els.navs.favorites.addEventListener('click', () => handleTabSwitch('favorites'));
    els.navs.downloads.addEventListener('click', () => handleTabSwitch('downloads'));

    // Mobile Navigation
    const mobileNavs = {
        home: document.getElementById('mobile-nav-home'),
        search: document.getElementById('mobile-nav-search'),
        library: document.getElementById('mobile-nav-library')
    };

    mobileNavs.home?.addEventListener('click', () => handleTabSwitch('home'));
    mobileNavs.search?.addEventListener('click', () => {
        handleTabSwitch('home'); // Focus home (which has search bar)
        document.getElementById('search').focus();
    });
    mobileNavs.library?.addEventListener('click', () => handleTabSwitch('favorites'));


    // Search Input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            els.containers.results.innerHTML = '<div class="empty-state"><i class="ph ph-music-notes"></i><p>Search for a song or artist</p></div>';
            return;
        }

        try {
            const songs = await searchSongs(query);
            renderSongsList(songs, 'results');
        } catch (err) {
            console.error("Search failed:", err);
        }
    });
}

// ================= HANDLERS =================

function onAuthChange(user) {
    if (user && els.navs.favorites.classList.contains('active')) {
        loadFavorites();
    } else if (!user && els.navs.favorites.classList.contains('active')) {
        els.containers.favorites.innerHTML = '<div class="empty-state"><p>Please log in to view favorites.</p></div>';
    }
}

function handleTabSwitch(tabId) {
    showTab(tabId);
    if (tabId === 'favorites') loadFavorites();
    if (tabId === 'downloads') loadDownloads();

    // Sync mobile nav active state
    document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
    if (tabId === 'home') document.getElementById('mobile-nav-home')?.classList.add('active');
    if (tabId === 'favorites') document.getElementById('mobile-nav-library')?.classList.add('active');
}


// Callbacks passed to the UI renderer
const songActionCallbacks = {
    onPlay: (songs, index) => {
        requireLogin(() => playSongList(songs, index));
    },
    onFavorite: async (id, title, thumb, favBtn) => {
        requireLogin(async () => {
            const isFav = await toggleFavorite(id, title, thumb);
            if (isFav !== null) {
                // Update ALL heart icons for this song
                const iconClass = isFav ? 'ph-fill' : 'ph';
                const actionClass = isFav ? 'active-heart' : '';
                
                // Update buttons in lists
                document.querySelectorAll(`#fav-icon-${id}`).forEach(i => {
                    i.className = `${iconClass} ph-heart`;
                    i.parentElement.classList.toggle('active-heart', isFav);
                });
                
                // Update expanded player favorite button if it's the current song
                const expandedFavBtn = document.getElementById('expanded-btn-fav');
                if (expandedFavBtn && playerState.currentSong && (playerState.currentSong.id === id || playerState.currentSong.song_id === id)) {
                    expandedFavBtn.innerHTML = `<i class="${iconClass} ph-heart"></i>`;
                    expandedFavBtn.classList.toggle('active-heart', isFav);
                }

                // Sync Right Panel & Other Views
                loadFavorites();
            }
        });
    },
    onDownload: (id, title, thumb) => {
        requireLogin(() => {
            const containers = document.querySelectorAll(`#dl-container-${id}`);
            const bars = document.querySelectorAll(`#dl-bar-${id}`);
            
            containers.forEach(c => c.style.display = 'block');

            downloadSong(id, title, thumb, (percent) => {
                bars.forEach(b => {
                    b.style.width = `${percent}%`;
                    if (percent === 100) {
                        setTimeout(() => {
                            const container = b.parentElement;
                            if (container) container.style.display = 'none';
                        }, 1000);
                    }
                });
            }).catch(() => {
                containers.forEach(c => c.style.display = 'none');
            });
        });
    }
};

function renderSongsList(songs, containerId) {
    renderSongs(songs, containerId, songActionCallbacks);
}

async function loadFavorites() {
    if (!currentUser) {
        els.containers.favorites.innerHTML = '<div class="empty-state"><p>Please log in to view favorites.</p></div>';
        return;
    }

    const favorites = await fetchFavorites();
    renderSongsList(favorites, 'favoritesList');
}

function loadDownloads() {
    const downloads = getDownloads();
    renderDownloads(downloads, songActionCallbacks);
}