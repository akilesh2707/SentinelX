import { useEffect, useRef, useCallback } from "react";

export type ProctoringEventType =
    | "TAB_SWITCH"
    | "WINDOW_BLUR"
    | "FULLSCREEN_EXIT"
    | "NETWORK_DISCONNECT"
    | "NETWORK_RECONNECT"
    | "PAGE_RELOAD"
    | "CAMERA_UNAVAILABLE"
    | "MICROPHONE_UNAVAILABLE"
    | "EXAM_STARTED"
    | "EXAM_SUBMITTED"
    | "AI_NO_FACE"
    | "AI_MULTIPLE_FACES"
    | "AI_LOOKING_AWAY"
    | "AI_CAMERA_OBSTRUCTED";

interface ProctoringEventPayload {
    clientEventId: string;
    type: ProctoringEventType;
    clientTimestamp: string;
    metadata?: Record<string, any>;
}

interface UseProctoringEngineProps {
    attemptId: string | null;
    status: string; // Attempt status (IN_PROGRESS, etc)
    tabDetection?: boolean;
    browserLock?: boolean;
    onSecurityEvent?: (type: ProctoringEventType, clientEventId: string) => void;
    onIncidentsCreated?: (mapping: Record<string, string>) => void;
}

export function useProctoringEngine({ 
    attemptId, 
    status, 
    tabDetection = true,
    browserLock = true,
    onSecurityEvent, 
    onIncidentsCreated 
}: UseProctoringEngineProps) {
    const queueRef = useRef<ProctoringEventPayload[]>([]);
    const isActive = attemptId !== null && status === "IN_PROGRESS";
    const startedRef = useRef(false);

    const flushQueue = useCallback(async () => {
        if (!attemptId || queueRef.current.length === 0) return;

        // Copy and clear the queue
        const eventsToFlush = [...queueRef.current];
        queueRef.current = [];

        try {
            const response = await fetch(`/api/attempts/${attemptId}/proctoring-events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ events: eventsToFlush })
            });

            if (!response.ok) {
                // If it fails (e.g. rate limit, offline), we could push them back.
                // For MVP, if it fails, we push them back if it's not a 400/401/403.
                if (response.status >= 500) {
                    queueRef.current = [...eventsToFlush, ...queueRef.current];
                }
            } else {
                const data = await response.json();
                if (data.incidents && onIncidentsCreated) {
                    onIncidentsCreated(data.incidents);
                }
            }
        } catch (err) {
            // Network error, restore queue
            queueRef.current = [...eventsToFlush, ...queueRef.current];
        }
    }, [attemptId]);

    const recordEvent = useCallback((type: ProctoringEventType, metadata?: Record<string, any>) => {
        if (!isActive) return;

        const clientEventId = crypto.randomUUID();

        if (type === "TAB_SWITCH" || type === "WINDOW_BLUR" || type === "FULLSCREEN_EXIT") {
            if (onSecurityEvent) {
                onSecurityEvent(type, clientEventId);
            }
        }

        queueRef.current.push({
            clientEventId,
            type,
            clientTimestamp: new Date().toISOString(),
            metadata
        });

        // Immediately flush CRITICAL lifecycle events
        if (type === "EXAM_STARTED" || type === "EXAM_SUBMITTED") {
            flushQueue();
        }
    }, [isActive, flushQueue, onSecurityEvent]);

    // Setup periodic flush
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            flushQueue();
        }, 10000); // Flush every 10 seconds

        return () => clearInterval(interval);
    }, [isActive, flushQueue]);

    // Browser Listeners
    useEffect(() => {
        if (!isActive) return;

        if (!startedRef.current) {
            recordEvent("EXAM_STARTED");
            startedRef.current = true;
        }

        const handleVisibilityChange = () => {
            if (!tabDetection) return;
            if (document.visibilityState === "hidden") {
                recordEvent("TAB_SWITCH", { state: "hidden" });
            } else if (document.visibilityState === "visible") {
                recordEvent("TAB_SWITCH", { state: "visible" });
            }
        };

        const handleBlur = () => {
            if (!tabDetection) return;
            recordEvent("WINDOW_BLUR");
        };

        const handleFullscreenChange = () => {
            if (!browserLock) return;
            if (!document.fullscreenElement) {
                recordEvent("FULLSCREEN_EXIT");
            }
        };

        const handleOffline = () => {
            recordEvent("NETWORK_DISCONNECT");
        };

        const handleOnline = () => {
            recordEvent("NETWORK_RECONNECT");
            // Flush immediately upon reconnection
            flushQueue();
        };

        const handleBeforeUnload = () => {
            recordEvent("PAGE_RELOAD");
            // Attempt to flush synchronously before unload
            if (queueRef.current.length > 0 && attemptId) {
                const payload = JSON.stringify({ events: queueRef.current });
                // Use sendBeacon for reliable delivery during unload
                navigator.sendBeacon(`/api/attempts/${attemptId}/proctoring-events`, payload);
                queueRef.current = [];
            }
        };

        if (tabDetection) {
            document.addEventListener("visibilitychange", handleVisibilityChange);
            window.addEventListener("blur", handleBlur);
        }
        
        if (browserLock) {
            document.addEventListener("fullscreenchange", handleFullscreenChange);
        }
        
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            if (tabDetection) {
                document.removeEventListener("visibilitychange", handleVisibilityChange);
                window.removeEventListener("blur", handleBlur);
            }
            if (browserLock) {
                document.removeEventListener("fullscreenchange", handleFullscreenChange);
            }
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            // Flush on unmount
            flushQueue();
        };
    }, [isActive, recordEvent, flushQueue, attemptId, tabDetection, browserLock]);

    return {
        recordEvent
    };
}
