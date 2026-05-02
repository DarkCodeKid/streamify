// state.js
// Centralized global state for the Streamify application

export const playerState = {
    queue: [],
    currentIndex: -1,
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    shuffle: false,
    repeat: 'none', // 'none', 'one', 'all'
    
    // Subscriptions for UI updates
    listeners: [],

    subscribe(listener) {
        this.listeners.push(listener);
    },

    notify() {
        this.listeners.forEach(listener => listener(this));
    },

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        this.notify();
    },

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIdx = modes.indexOf(this.repeat);
        this.repeat = modes[(currentIdx + 1) % modes.length];
        this.notify();
    },

    setQueue(songs, index = 0) {
        this.queue = [...songs];
        this.currentIndex = index;
        this.currentSong = this.queue[this.currentIndex] || null;
        this.notify();
    },

    playNext() {
        if (this.queue.length === 0) return false;
        
        if (this.currentIndex < this.queue.length - 1) {
            this.currentIndex++;
            this.currentSong = this.queue[this.currentIndex];
            this.notify();
            return true;
        }
        return false; // End of queue
    },

    playPrev() {
        if (this.queue.length === 0) return false;
        
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.currentSong = this.queue[this.currentIndex];
            this.notify();
            return true;
        }
        return false; // Already at the beginning
    },

    appendQueue(songs) {
        this.queue = [...this.queue, ...songs];
        this.notify();
    },

    setPlaying(isPlaying) {
        this.isPlaying = isPlaying;
        this.notify();
    },

    setTime(currentTime, duration) {
        this.currentTime = currentTime;
        this.duration = duration;
        // Optimization: Do not call notify() heavily on timeupdate. 
        // We will expose a specific event or handle it separately if needed, 
        // or just let the caller handle UI directly to avoid lag.
    },

    setVolume(vol, isMuted) {
        this.volume = vol;
        this.isMuted = isMuted;
        this.notify();
    }
};
