function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function extractSymbol(text: string) {
    const m = text.match(/[£$€]/);
    return m ? m[0] : null;
}

function getRandomTimeoutMs() {
    // 3 - 5 minutes
    const MAX_TIMEOUT = 5;
    const MIN_TIMEOUT = 3;
    return (
        (Math.floor(Math.random() * (MAX_TIMEOUT - MIN_TIMEOUT)) +
            MIN_TIMEOUT) *
        60 *
        1000
    );
}

function scheduleTimeout(fn: () => void, delay = 300) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
        timeout = setTimeout(() => {
            timeout = null;
            fn();
        }, delay);
    };

    return {
        start() {
            if (!timeout) run();
        },
        reset() {
            if (timeout) clearTimeout(timeout);
            run();
        },
        clear() {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
        },
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export {
    clamp,
    extractSymbol,
    getRandomTimeoutMs,
    scheduleTimeout,
    capitalize,
};
