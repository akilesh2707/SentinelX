import { useState, useEffect, useCallback, useRef } from "react";
import { ProctoringEventType } from "./use-proctoring-engine";

interface UseMediaProctoringProps {
    requiresCamera: boolean;
    requiresMic: boolean;
    isActive: boolean; // True when the exam is actually in progress
    recordEvent?: (type: ProctoringEventType, metadata?: Record<string, any>) => void;
}

export function useMediaProctoring({
    requiresCamera,
    requiresMic,
    isActive,
    recordEvent,
}: UseMediaProctoringProps) {
    const [cameraStatus, setCameraStatus] = useState<"not_required" | "loading" | "ready" | "unavailable">(
        requiresCamera ? "loading" : "not_required"
    );
    const [micStatus, setMicStatus] = useState<"not_required" | "loading" | "ready" | "unavailable">(
        requiresMic ? "loading" : "not_required"
    );
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Refs to deduplicate event emission spam (max 1 event per 10s per device)
    const lastCameraEventRef = useRef<number>(0);
    const lastMicEventRef = useRef<number>(0);

    const hasBeenActiveRef = useRef(false);
    if (isActive) {
        hasBeenActiveRef.current = true;
    }
    const isPostExam = hasBeenActiveRef.current && !isActive;

    const emitEventThrottled = useCallback((type: ProctoringEventType, metadata: any) => {
        if (!isActive || !recordEvent) return;

        const now = Date.now();
        if (type === "CAMERA_UNAVAILABLE") {
            if (now - lastCameraEventRef.current > 10000) {
                recordEvent(type, metadata);
                lastCameraEventRef.current = now;
            }
        } else if (type === "MICROPHONE_UNAVAILABLE") {
            if (now - lastMicEventRef.current > 10000) {
                recordEvent(type, metadata);
                lastMicEventRef.current = now;
            }
        }
    }, [isActive, recordEvent]);

    const stopTracks = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                track.onended = null;
            });
            streamRef.current = null;
            setStream(null);
        }
    }, []);

    const checkDevices = useCallback(async () => {
        // Do not request media if we are in post-exam state
        if (isPostExam) return;

        if (!requiresCamera && !requiresMic) {
            setCameraStatus("not_required");
            setMicStatus("not_required");
            return;
        }

        setCameraStatus(requiresCamera ? "loading" : "not_required");
        setMicStatus(requiresMic ? "loading" : "not_required");
        setErrorMsg(null);
        
        stopTracks();

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser unsupported");
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: requiresCamera,
                audio: requiresMic
            });

            streamRef.current = mediaStream;
            setStream(mediaStream);

            if (requiresCamera) {
                const videoTracks = mediaStream.getVideoTracks();
                if (videoTracks.length > 0) {
                    setCameraStatus("ready");
                    // Listen for track ending (e.g. user unplugs camera or revokes permission)
                    videoTracks[0].onended = () => {
                        setCameraStatus("unavailable");
                        emitEventThrottled("CAMERA_UNAVAILABLE", { reason: "track_ended" });
                    };
                } else {
                    setCameraStatus("unavailable");
                    emitEventThrottled("CAMERA_UNAVAILABLE", { reason: "no_video_tracks" });
                }
            }

            if (requiresMic) {
                const audioTracks = mediaStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    setMicStatus("ready");
                    audioTracks[0].onended = () => {
                        setMicStatus("unavailable");
                        emitEventThrottled("MICROPHONE_UNAVAILABLE", { reason: "track_ended" });
                    };
                } else {
                    setMicStatus("unavailable");
                    emitEventThrottled("MICROPHONE_UNAVAILABLE", { reason: "no_audio_tracks" });
                }
            }
        } catch (err: any) {
            console.error("Media access error:", err);
            
            let msg = "Failed to access required hardware.";
            if (err.name === "NotAllowedError") {
                msg = "Permission denied. Please allow access in your browser settings.";
            } else if (err.name === "NotFoundError") {
                msg = "Required device not found. Please connect it.";
            } else if (err.name === "NotReadableError") {
                msg = "Device is already in use by another application.";
            } else if (err.message === "Browser unsupported") {
                msg = "Your browser does not support media devices. Please use a modern browser.";
            }

            setErrorMsg(msg);
            
            if (requiresCamera) {
                setCameraStatus("unavailable");
                emitEventThrottled("CAMERA_UNAVAILABLE", { reason: "get_user_media_failed", error: err.name });
            }
            if (requiresMic) {
                setMicStatus("unavailable");
                emitEventThrottled("MICROPHONE_UNAVAILABLE", { reason: "get_user_media_failed", error: err.name });
            }
        }
    }, [requiresCamera, requiresMic, stopTracks, emitEventThrottled, isPostExam]);

    // Initial check and cleanup
    useEffect(() => {
        if (isPostExam) {
            stopTracks();
        } else {
            checkDevices();
        }
        return () => {
            stopTracks();
        };
    }, [checkDevices, stopTracks, isPostExam]);

    // Listen for global device changes (e.g. plugging/unplugging)
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) return;
        
        const handleDeviceChange = () => {
            // Re-evaluate devices when hardware changes
            // Only re-trigger if we are currently active (so we don't prompt unexpectedly)
            if (isActive) {
                checkDevices();
            }
        };

        navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
        };
    }, [isActive, checkDevices]);

    return {
        stream,
        cameraStatus,
        micStatus,
        errorMsg,
        retry: checkDevices
    };
}
