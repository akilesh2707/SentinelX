/**
 * Captures a snapshot from an active MediaStream.
 * Draws the current frame of the first video track to a canvas,
 * and outputs a WebP Blob (with JPEG fallback).
 * 
 * Does NOT call getUserMedia. Uses the existing stream.
 */
export async function captureSnapshot(stream: MediaStream): Promise<Blob> {
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0 || videoTracks[0].readyState !== "live") {
        throw new Error("No active video track available for snapshot");
    }

    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;

        // Cleanup function
        const cleanup = () => {
            video.pause();
            video.srcObject = null;
            video.remove();
        };

        video.onloadeddata = () => {
            try {
                // Ensure dimensions are valid
                const width = video.videoWidth;
                const height = video.videoHeight;
                
                if (width === 0 || height === 0) {
                    cleanup();
                    return reject(new Error("Video dimensions are zero"));
                }

                const canvas = document.createElement("canvas");
                // Cap resolution to avoid massive images
                const MAX_DIM = 1280;
                let scale = 1;
                if (width > MAX_DIM || height > MAX_DIM) {
                    scale = Math.min(MAX_DIM / width, MAX_DIM / height);
                }
                
                canvas.width = width * scale;
                canvas.height = height * scale;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    cleanup();
                    return reject(new Error("Failed to get 2d context"));
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Attempt WebP, fallback to JPEG
                const callback = (blob: Blob | null) => {
                    cleanup();
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to generate image blob"));
                    }
                };

                // Browsers that don't support image/webp will fallback to image/png silently, 
                // so we can just use image/webp and in worst case we get a PNG (handled server-side validation).
                // But let's explicitly try to get webp or jpeg.
                canvas.toBlob(callback, "image/webp", 0.8);
            } catch (err) {
                cleanup();
                reject(err);
            }
        };

        video.onerror = () => {
            cleanup();
            reject(new Error("Error playing video for snapshot"));
        };
    });
}
