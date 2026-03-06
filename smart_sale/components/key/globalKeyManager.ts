type KeyCallback = (event: KeyboardEvent) => void;

interface Listener {
    id: string;
    callback: KeyCallback;
}

const keyListeners: Record<string, Listener[]> = {};

const handleKeyDown = (event: KeyboardEvent) => {

    console.log("Key pressed:", event.key, "Key code:", event.code);

    const key = event.key;
    const listeners = keyListeners[key];

    if (!listeners || listeners.length === 0) return;

    event.preventDefault();

    const latestListener = listeners[listeners.length - 1];
    latestListener.callback(event);
};

if (typeof document !== "undefined") {
    document.addEventListener("keydown", handleKeyDown, true);
}



export function registerKey(id: string, key: string, callback: KeyCallback) {
    if (!keyListeners[key]) keyListeners[key] = [];

    // prevent duplicates
    keyListeners[key] = keyListeners[key].filter(l => l.id !== id);

    keyListeners[key].push({ id, callback });
}

export function unregisterKey(id: string, key: string) {
    if (!keyListeners[key]) return;

    keyListeners[key] = keyListeners[key].filter(l => l.id !== id);

    if (keyListeners[key].length === 0) {
        delete keyListeners[key];
    }
}