import { useEffect, useRef } from "react";
import { ProctoringEventType } from "./use-proctoring-engine";

export interface AIAnalyzerResult {
    type: "AI_NO_FACE" | "AI_MULTIPLE_FACES" | "AI_LOOKING_AWAY" | "AI_CAMERA_OBSTRUCTED";
    confidence: number;
    metadata?: Record<string, any>;
}

export class MockLocalAnalyzer {
    // A clearly labeled deterministic mock analyzer for local development.
    // Replaceable by a real CV model later.
    async analyze(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<AIAnalyzerResult | null> {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Deterministic test signals via localStorage for QA / automation (DEVELOPMENT ONLY)
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
            const mockSignal = window.localStorage.getItem("MOCK_AI_SIGNAL");
            if (mockSignal === "AI_NO_FACE" || 
                mockSignal === "AI_MULTIPLE_FACES" || 
                mockSignal === "AI_LOOKING_AWAY" || 
                mockSignal === "AI_CAMERA_OBSTRUCTED") {
                return {
                    type: mockSignal,
                    confidence: 0.95,
                    metadata: { source: "local_mock_analyzer" }
                };
            }
        }

        return null;
    }
}

export function useAiProctoring({
    stream,
    isActive,
    recordEvent
}: {
    stream: MediaStream | null;
    isActive: boolean;
    recordEvent?: (type: ProctoringEventType, metadata?: Record<string, any>) => void;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const analyzerRef = useRef(new MockLocalAnalyzer());

    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        const canvas = document.createElement("canvas");
        // Use a low resolution for performance (controlled frame sampling)
        canvas.width = 320;
        canvas.height = 240;

        videoRef.current = video;
        canvasRef.current = canvas;

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current = null;
            }
            canvasRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!isActive || !stream || !videoRef.current || !canvasRef.current || !recordEvent) return;

        if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
        }

        let intervalId: NodeJS.Timeout;

        const processFrame = async () => {
            if (!videoRef.current || !canvasRef.current || !recordEvent) return;
            // Wait for video to be fully ready
            if (videoRef.current.readyState < 2) return;

            try {
                const result = await analyzerRef.current.analyze(videoRef.current, canvasRef.current);
                if (result && result.confidence >= 0.8) {
                    recordEvent(result.type as ProctoringEventType, {
                        confidence: result.confidence,
                        ...result.metadata
                    });
                }
            } catch (err) {
                console.error("[SentinelX AI] Local analyzer error:", err);
                // Safe failure: Do not crash exam.
            }
        };

        // Controlled sampling: process 1 frame every 4 seconds
        intervalId = setInterval(processFrame, 4000);

        return () => {
            clearInterval(intervalId);
        };
    }, [stream, isActive, recordEvent]);
}
