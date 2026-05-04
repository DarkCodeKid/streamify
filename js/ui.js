import { playerState } from './state.js';

// DOM Elements cache
// DOM Elements cache (Lazy-loaded to ensure DOM is ready)
export const els = {
    get authUnlogged() { return document.getElementById('auth-unlogged'); },
    get authLogged() { return document.getElementById('auth-logged'); },
    get userStatus() { return document.getElementById('userStatus'); },
    get authModal() { return document.getElementById('authModal'); },
    get authForm() { return document.getElementById('auth-form'); },
    get authModalTitle() { return document.getElementById('auth-modal-title'); },
    get authSwitchPrompt() { return document.getElementById('auth-switch-prompt'); },
    get btnSwitchAuth() { return document.getElementById('btn-switch-auth'); },
    get authError() { return document.getElementById('auth-error'); },
    get toastContainer() { return document.getElementById('toastContainer'); },
    get search() { return document.getElementById('search'); },
    
    get tabs() {
        return {
            home: document.getElementById('homeTab'),
            favorites: document.getElementById('favoritesTab'),
            downloads: document.getElementById('downloadsTab')
        };
    },
    get navs() {
        return {
            home: document.getElementById('nav-home'),
            favorites: document.getElementById('nav-favorites'),
            downloads: document.getElementById('nav-downloads')
        };
    },
    get containers() {
        return {
            results: document.getElementById('results'),
            favorites: document.getElementById('favoritesList'),
            downloads: document.getElementById('downloadsList')
        };
    },
    get player() {
        return {
            miniPlayer: document.getElementById('mini-player'),
            playIcon: document.getElementById('playIcon'),
            progress: document.getElementById('progress'),
            currentTime: document.getElementById('currentTime'),
            durationTime: document.getElementById('durationTime'),
            title: document.getElementById('songTitle'),
            thumb: document.getElementById('songThumb'),
            volume: document.getElementById('volume'),
            volumeIcon: document.getElementById('volumeIcon'),
            btnTogglePlay: document.getElementById('btn-toggle-play'),
            btnToggleMute: document.getElementById('btn-toggle-mute'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),

            expanded: document.getElementById('expanded-player'),
            btnCloseExpanded: document.getElementById('btn-close-expanded'),
            expandedThumb: document.getElementById('expanded-thumb'),
            expandedTitle: document.getElementById('expanded-title'),
            expandedArtist: document.getElementById('expanded-artist'),
            expandedProgress: document.getElementById('expanded-progress'),
            expandedCurrentTime: document.getElementById('expanded-currentTime'),
            expandedDurationTime: document.getElementById('expanded-durationTime'),
            btnShuffle: document.getElementById('btn-shuffle'),
            btnRepeat: document.getElementById('btn-repeat'),
            expandedBtnPrev: document.getElementById('expanded-btn-prev'),
            expandedBtnNext: document.getElementById('expanded-btn-next'),
            expandedBtnTogglePlay: document.getElementById('expanded-btn-toggle-play'),
            expandedPlayIcon: document.getElementById('expanded-playIcon')
        };
    }
};



// ================= UI Initialization =================
export function initPlayerUI(playerActions) {
    let isDragging = false;
    let seekLock = false;

    // State Subscription
    playerState.subscribe((state) => {
        updatePlayerUI(state);
    });

    window.addEventListener('player-timeupdate', (e) => {
        if (!isDragging && !seekLock) {
            updateTimeUI(e.detail.currentTime, e.detail.duration);
        }
    });

    // Modals & Panels
    els.player.miniPlayer.addEventListener('click', (e) => {
        if (e.target.closest('.control-btn') || e.target.closest('.progress-container') || e.target.closest('.player-right')) return;
        if (playerState.currentSong) {
            els.player.expanded.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    });

    els.player.btnCloseExpanded.addEventListener('click', () => {
        els.player.expanded.classList.add('hidden');
        document.body.style.overflow = '';
    });

    // Buttons
    const onPlayPause = (e) => { e.stopPropagation(); playerActions.togglePlay(); };
    els.player.btnTogglePlay.addEventListener('click', onPlayPause);
    els.player.expandedBtnTogglePlay.addEventListener('click', onPlayPause);

    const onNext = (e) => { e.stopPropagation(); playerActions.playNext(); };
    els.player.btnNext.addEventListener('click', onNext);
    els.player.expandedBtnNext.addEventListener('click', onNext);

    const onPrev = (e) => { e.stopPropagation(); playerActions.playPrev(); };
    els.player.btnPrev.addEventListener('click', onPrev);
    els.player.expandedBtnPrev.addEventListener('click', onPrev);

    els.player.btnToggleMute.addEventListener('click', (e) => {
        e.stopPropagation();
        const vol = playerState.isMuted ? 100 : 0;
        playerActions.setVolume(vol);
    });

    els.player.btnShuffle.addEventListener('click', (e) => {
        e.stopPropagation();
        playerActions.toggleShuffle();
    });

    els.player.btnRepeat.addEventListener('click', (e) => {
        e.stopPropagation();
        playerActions.toggleRepeat();
    });

    // Seek
    const onSeekInput = (e) => {
        isDragging = true;
        const val = e.target.value;
        
        // Update both sliders visually
        els.player.progress.value = val;
        els.player.expandedProgress.value = val;
        
        updateSliderBackground(els.player.progress);
        updateSliderBackground(els.player.expandedProgress);
        
        if (playerState.duration) {
            const t = (val / 100) * playerState.duration;
            const timeStr = formatTime(t);
            els.player.currentTime.textContent = timeStr;
            els.player.expandedCurrentTime.textContent = timeStr;
        }
    };

    const onSeekChange = (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            seekLock = true;
            playerActions.seekTo(val);
            // Brief timeout to let the audio element update its internal state
            setTimeout(() => {
                seekLock = false;
                isDragging = false;
            }, 500);
        } else {
            isDragging = false;
        }
    };

    els.player.progress.addEventListener('input', onSeekInput);
    els.player.progress.addEventListener('change', onSeekChange);
    els.player.expandedProgress.addEventListener('input', onSeekInput);
    els.player.expandedProgress.addEventListener('change', onSeekChange);

    // Volume
    els.player.volume.addEventListener('input', (e) => {
        playerActions.setVolume(e.target.value);
    });
}

function updatePlayerUI(state) {
    const song = state.currentSong;
    const defaultThumb = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&h=300&auto=format&fit=crop";

    if (!song) {
        els.player.title.textContent = "No song playing";
        els.player.thumb.classList.add('hidden');
        els.player.expandedTitle.textContent = "Streamify";
        els.player.expandedArtist.textContent = "Choose a song to start listening";
        els.player.expandedThumb.src = defaultThumb;
        return;
    }

    const title = song.title;
    const thumb = song.thumbnail || song.thumb || defaultThumb;
    const artist = song.artist || "Unknown Artist";

    els.player.title.textContent = title;
    els.player.thumb.src = thumb;
    els.player.thumb.classList.remove('hidden');

    els.player.expandedTitle.textContent = title;
    els.player.expandedArtist.textContent = artist;
    els.player.expandedThumb.src = thumb;

    const iconClass = state.isPlaying ? "ph-fill ph-pause-circle" : "ph-fill ph-play-circle";
    els.player.playIcon.className = iconClass;
    els.player.expandedPlayIcon.className = iconClass;

    // Update Favorite Icon in Expanded Player
    const id = song.id || song.song_id;
    const isFav = song.isFavorite || false;
    const favIconClass = isFav ? 'ph-fill' : 'ph';
    const expandedFavBtn = document.getElementById('expanded-btn-fav');
    if (expandedFavBtn) {
        expandedFavBtn.innerHTML = `<i class="${favIconClass} ph-heart"></i>`;
        expandedFavBtn.classList.toggle('active-heart', isFav);
    }

    els.player.volume.value = state.volume * 100;
    updateSliderBackground(els.player.volume);
    
    if (state.volume === 0 || state.isMuted) els.player.volumeIcon.className = "ph-fill ph-speaker-none";
    else if (state.volume < 0.5) els.player.volumeIcon.className = "ph-fill ph-speaker-low";
    else els.player.volumeIcon.className = "ph-fill ph-speaker-high";

    // Shuffle & Repeat states
    els.player.btnShuffle.classList.toggle('active-accent', state.shuffle);
    
    const repeatIcon = els.player.btnRepeat.querySelector('i');
    if (state.repeat === 'one') {
        repeatIcon.className = 'ph-fill ph-repeat-once';
        els.player.btnRepeat.classList.add('active-accent');
    } else if (state.repeat === 'all') {
        repeatIcon.className = 'ph ph-repeat';
        els.player.btnRepeat.classList.add('active-accent');
    } else {
        repeatIcon.className = 'ph ph-repeat';
        els.player.btnRepeat.classList.remove('active-accent');
    }

    updateActiveStateUI();
}

function updateTimeUI(currentTime, duration) {
    if (!duration) return;
    const percent = (currentTime / duration) * 100;
    els.player.progress.value = percent;
    els.player.expandedProgress.value = percent;
    
    const curStr = formatTime(currentTime);
    const durStr = formatTime(duration);
    
    els.player.currentTime.textContent = curStr;
    els.player.durationTime.textContent = durStr;
    els.player.expandedCurrentTime.textContent = curStr;
    els.player.expandedDurationTime.textContent = durStr;
    
    updateSliderBackground(els.player.progress);
    updateSliderBackground(els.player.expandedProgress);
}

export function updateActiveStateUI() {
    const song = playerState.currentSong;
    if (!song) return;
    const id = song.id || song.song_id;

    document.querySelectorAll('.card').forEach(c => c.classList.remove('playing'));
    document.querySelectorAll('.list-item').forEach(l => l.classList.remove('playing'));
    document.querySelectorAll('.mini-item').forEach(m => m.classList.remove('playing'));

    const activeCard = document.getElementById(`song-card-${id}`);
    if (activeCard) activeCard.classList.add('playing');

    const activeDlItem = document.getElementById(`dl-item-${id}`);
    if (activeDlItem) activeDlItem.classList.add('playing');

    const activeMiniItem = document.getElementById(`mini-item-${id}`);
    if (activeMiniItem) activeMiniItem.classList.add('playing');
}

function updateSliderBackground(slider) {
    const val = slider.value;
    slider.style.background = `linear-gradient(to right, var(--text-primary) ${val}%, #535353 ${val}%)`;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ================= TOASTS =================
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ph-check-circle';
    if (type === 'error') icon = 'ph-x-circle';
    if (type === 'info') icon = 'ph-info';

    toast.innerHTML = `<i class="ph ${icon}"></i> <span>${message}</span>`;
    els.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================= TABS =================
export function showTab(tabId) {
    Object.values(els.tabs).forEach(tab => tab?.classList.add('hidden'));
    Object.values(els.navs).forEach(nav => nav?.classList.remove('active'));

    if (els.tabs[tabId]) els.tabs[tabId].classList.remove('hidden');
    if (els.navs[tabId]) els.navs[tabId].classList.add('active');
}

// ================= RENDER SONGS =================
export function renderSongs(songs, containerId, callbacks) {
    const container = els.containers[containerId];
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!songs || songs.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No songs found.</p></div>';
        return;
    }

    songs.forEach((song, index) => {
        const id = song.id || song.song_id;
        const title = song.title;
        const thumb = song.thumbnail || song.thumb;
        const isFavorite = song.isFavorite || false;

        const div = document.createElement('div');
        div.className = 'card';
        div.id = `song-card-${id}`;
        
        div.innerHTML = `
            <div class="card-img-container">
                <img src="${thumb}" alt="${title}">
                <button class="card-play-btn play-trigger">
                    <i class="ph-fill ph-play"></i>
                </button>
            </div>
            <p class="card-title truncate" title="${title.replace(/"/g, '&quot;')}">${title}</p>
            
            <div class="download-progress-container" id="dl-container-${id}">
                <div class="download-progress-bar" id="dl-bar-${id}"></div>
            </div>

            <div class="card-actions">
                <button class="card-action-btn fav-trigger ${isFavorite ? 'active-heart' : ''}" title="Toggle Favorite">
                    <i class="${isFavorite ? 'ph-fill' : 'ph'} ph-heart" id="fav-icon-${id}"></i>
                </button>
                <button class="card-action-btn dl-trigger" title="Download">
                    <i class="ph ph-download-simple"></i>
                </button>
            </div>
        `;

        div.querySelector('.play-trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            callbacks.onPlay(songs, index);
        });

        div.querySelector('.fav-trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            callbacks.onFavorite(id, title, thumb, div.querySelector('.fav-trigger'));
        });

        div.querySelector('.dl-trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            callbacks.onDownload(id, title, thumb);
        });

        container.appendChild(div);
    });
    updateActiveStateUI();
}

export function renderDownloads(downloads, callbacks) {
    const container = els.containers.downloads;
    container.innerHTML = '';

    if (!downloads || downloads.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No downloaded songs yet.</p></div>';
        return;
    }

    downloads.forEach((song, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.id = `dl-item-${song.id}`;
        div.innerHTML = `
            <img src="${song.thumb}" alt="${song.title}">
            <span class="title truncate" title="${song.title.replace(/"/g, '&quot;')}">${song.title}</span>
            <button class="card-action-btn play-trigger">
                <i class="ph-fill ph-play-circle"></i>
            </button>
        `;

        div.querySelector('.play-trigger').addEventListener('click', () => {
            callbacks.onPlay(downloads, index);
        });

        container.appendChild(div);
    });
    updateActiveStateUI();
}
