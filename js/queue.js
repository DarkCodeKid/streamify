export let queue = [];
export let currentIndex = -1;

export function setQueue(songs, index = 0) {
    // Make a copy of the songs array so we don't mutate external state
    queue = [...songs];
    currentIndex = index;
}

export function getCurrent() {
    if (currentIndex >= 0 && currentIndex < queue.length) {
        return queue[currentIndex];
    }
    return null;
}

export function getNext() {
    if (queue.length === 0) return null;
    
    if (currentIndex < queue.length - 1) {
        currentIndex++;
        return queue[currentIndex];
    }
    
    // Reached the end of the queue
    return null;
}

export function getPrev() {
    if (queue.length === 0) return null;
    
    if (currentIndex > 0) {
        currentIndex--;
        return queue[currentIndex];
    }
    
    // Already at the beginning, just return the first song
    return queue[0];
}

export function appendToQueue(songs) {
    queue = [...queue, ...songs];
}

export function getQueue() {
    return queue;
}
