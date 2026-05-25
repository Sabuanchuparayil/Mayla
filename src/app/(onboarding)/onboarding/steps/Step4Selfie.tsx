'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  onNext: () => void;
}

type SelfieState = 'idle' | 'requesting' | 'streaming' | 'capturing' | 'preview' | 'uploading' | 'done' | 'error';

export default function Step4Selfie({ onNext }: Props) {
  const [selfieState, setSelfieState] = useState<SelfieState>('idle');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [stableFrames, setStableFrames] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [stopStream, capturedUrl]);

  const startCamera = async () => {
    setSelfieState('requesting');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setSelfieState('streaming');
      setStableFrames(0);

      // Poll for stable video frame (simple interval check)
      let count = 0;
      pollRef.current = setInterval(() => {
        const video = videoRef.current;
        if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          count++;
          setStableFrames(count);
          if (count >= 4) {
            // ~2s of stable frames (polling every 500ms)
            if (pollRef.current) clearInterval(pollRef.current);
            capturePhoto();
          }
        }
      }, 500);
    } catch (err) {
      console.error('Camera error', err);
      setSelfieState('error');
      setError('Could not access camera. Please allow camera permission and try again.');
    }
  };

  const capturePhoto = () => {
    setSelfieState('capturing');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image (front camera)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) { setSelfieState('error'); setError('Failed to capture photo.'); return; }
      const url = URL.createObjectURL(blob);
      setCapturedBlob(blob);
      setCapturedUrl(url);
      setSelfieState('preview');
      stopStream();
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setSelfieState('idle');
    setStableFrames(0);
  };

  const confirmAndUpload = async () => {
    if (!capturedBlob) return;
    setSelfieState('uploading');
    setError('');

    const formData = new FormData();
    formData.append('image', capturedBlob, 'selfie.jpg');

    // Get geolocation simultaneously
    const geoPromise = new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 },
      );
    });

    const geo = await geoPromise;
    if (geo) {
      formData.append('lat', String(geo.lat));
      formData.append('lng', String(geo.lng));
    }

    try {
      const res = await fetch('/api/verification/selfie', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Upload failed');
      }
      setSelfieState('done');
      setTimeout(() => onNext(), 800);
    } catch (err) {
      setSelfieState('preview');
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="px-4 py-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-foreground mb-1 text-center">Selfie verification</h1>
      <p className="text-foreground/60 mb-6 text-center text-sm">
        We need a selfie to verify you're a real person
      </p>

      {/* Camera / preview area */}
      <div className="relative w-full max-w-xs aspect-square mb-6">
        {/* Oval face guide overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <svg viewBox="0 0 300 300" className="w-full h-full">
            <defs>
              <mask id="oval-mask">
                <rect width="300" height="300" fill="white" />
                <ellipse cx="150" cy="150" rx="100" ry="130" fill="black" />
              </mask>
            </defs>
            <rect width="300" height="300" fill="rgba(0,0,0,0.45)" mask="url(#oval-mask)" />
            <ellipse
              cx="150" cy="150" rx="100" ry="130"
              fill="none"
              stroke="#E85D75"
              strokeWidth="3"
              strokeDasharray={selfieState === 'streaming' ? '8 4' : '0'}
            />
          </svg>
        </div>

        {selfieState === 'preview' || selfieState === 'uploading' || selfieState === 'done' ? (
          capturedUrl && (
            <img
              src={capturedUrl}
              alt="Captured selfie"
              className="w-full h-full object-cover rounded-3xl"
            />
          )
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover rounded-3xl bg-gray-900"
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        {/* Status overlay */}
        {selfieState === 'streaming' && (
          <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center z-20">
            <p className="text-white text-xs text-center bg-black/50 px-3 py-1 rounded-full">
              Look straight into the camera, then smile
            </p>
            <div className="mt-2 flex gap-1">
              {[0,1,2,3].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    stableFrames > i ? 'bg-primary-400' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {selfieState === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl z-20">
            <div className="w-8 h-8 border-4 border-white border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {selfieState === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl z-20">
            <div className="text-white text-4xl">✓</div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mb-4 text-center w-full max-w-xs">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        {selfieState === 'idle' && (
          <button
            type="button"
            onClick={startCamera}
            className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors"
          >
            Open Camera
          </button>
        )}

        {selfieState === 'requesting' && (
          <p className="text-center text-sm text-foreground/60">Requesting camera access...</p>
        )}

        {selfieState === 'streaming' && (
          <button
            type="button"
            onClick={capturePhoto}
            className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors"
          >
            Capture Now
          </button>
        )}

        {selfieState === 'preview' && (
          <>
            <button
              type="button"
              onClick={confirmAndUpload}
              className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors"
            >
              Use This Photo
            </button>
            <button
              type="button"
              onClick={retake}
              className="w-full py-3 border-2 border-primary-300 text-primary-600 rounded-xl font-semibold text-base hover:bg-primary-50 transition-colors"
            >
              Retake
            </button>
          </>
        )}

        {selfieState === 'error' && (
          <button
            type="button"
            onClick={retake}
            className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
