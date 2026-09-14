import { useEffect } from "react";
import { Camera, Mic, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import { useMediaProctoring } from "./use-media-proctoring";

type MediaPreflightProps = {
    requiresCamera: boolean;
    requiresMic: boolean;
    onReadyStatusChange: (isReady: boolean) => void;
};

export function MediaPreflight({ requiresCamera, requiresMic, onReadyStatusChange }: MediaPreflightProps) {
    const { stream, cameraStatus, micStatus, errorMsg, retry } = useMediaProctoring({
        requiresCamera,
        requiresMic,
        isActive: false, // Preflight mode
    });

    const isMediaReady = 
        (!requiresCamera || cameraStatus === "ready") && 
        (!requiresMic || micStatus === "ready");

    useEffect(() => {
        onReadyStatusChange(isMediaReady);
    }, [isMediaReady, onReadyStatusChange]);

    if (!requiresCamera && !requiresMic) {
        return null;
    }

    return (
        <div className="mb-8 rounded-xl border border-[#dedbd2] p-6 bg-white">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#555955]" />
                Hardware Checks
            </h3>
            
            {errorMsg && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    {errorMsg}
                </div>
            )}

            <div className="space-y-4">
                {requiresCamera && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Camera size={18} className="text-gray-500" />
                                <span className="font-medium">Camera</span>
                            </div>
                            <div>
                                {cameraStatus === "loading" && <Loader2 size={16} className="animate-spin text-gray-400" />}
                                {cameraStatus === "ready" && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">READY</span>}
                                {cameraStatus === "unavailable" && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">UNAVAILABLE</span>}
                            </div>
                        </div>
                        {cameraStatus === "ready" && stream && (
                            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-200">
                                <video 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover scale-x-[-1]"
                                    ref={(video) => {
                                        if (video && video.srcObject !== stream) {
                                            video.srcObject = stream;
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {requiresMic && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <Mic size={18} className="text-gray-500" />
                            <span className="font-medium">Microphone</span>
                        </div>
                        <div>
                            {micStatus === "loading" && <Loader2 size={16} className="animate-spin text-gray-400" />}
                            {micStatus === "ready" && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">READY</span>}
                            {micStatus === "unavailable" && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">UNAVAILABLE</span>}
                        </div>
                    </div>
                )}
            </div>

            {!isMediaReady && (cameraStatus === "unavailable" || micStatus === "unavailable") && (
                <button
                    onClick={retry}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                    <RefreshCcw size={16} /> Try Again
                </button>
            )}
        </div>
    );
}
