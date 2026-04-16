type KeyCallback = (event: KeyboardEvent) => void;

interface Listener {
    id: string;
    callback: KeyCallback;
}

// key => listeners[]
const keyListeners: Record<string, Listener[]> = {};

// 🔥 Normalize event → combo string
const getKeyCombo = (e: KeyboardEvent) => {
    const keys: string[] = [];

    if (e.ctrlKey) keys.push("ctrl");
    if (e.shiftKey) keys.push("shift");
    if (e.altKey) keys.push("alt");
    if (e.metaKey) keys.push("meta");

    let key = e.key.toLowerCase();

    // Normalize special keys
    if (key === " ") key = "space";
    if (key === "arrowdown") key = "arrowdown";
    if (key === "arrowup") key = "arrowup";
    if (key === "arrowleft") key = "arrowleft";
    if (key === "arrowright") key = "arrowright";

    keys.push(key);

    return keys.join("+");
};

// 🔥 Global listener
const handleKeyDown = (event: KeyboardEvent) => {
    const combo = getKeyCombo(event);

    const listeners = keyListeners[combo];

    if (!listeners || listeners.length === 0) return;

    console.log("Key Combo:", combo);

    event.preventDefault();

    // ✅ Latest registered wins (important for modals etc.)
    const latestListener = listeners[listeners.length - 1];
    latestListener.callback(event);
};

// Attach once
if (typeof document !== "undefined") {
    document.addEventListener("keydown", handleKeyDown, true);
}

// ✅ Register
export function registerKey(id: string, key: string, callback: KeyCallback) {
    const normalizedKey = key.toLowerCase();

    if (!keyListeners[normalizedKey]) {
        keyListeners[normalizedKey] = [];
    }

    // Remove duplicate
    keyListeners[normalizedKey] = keyListeners[normalizedKey].filter(
        (l) => l.id !== id
    );

    keyListeners[normalizedKey].push({ id, callback });
}

// ✅ Unregister
export function unregisterKey(id: string, key: string) {
    const normalizedKey = key.toLowerCase();

    if (!keyListeners[normalizedKey]) return;

    keyListeners[normalizedKey] = keyListeners[normalizedKey].filter(
        (l) => l.id !== id
    );

    if (keyListeners[normalizedKey].length === 0) {
        delete keyListeners[normalizedKey];
    }
}