import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../constants';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (image: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser.");
      }

      const constraints = {
        video: { 
          facingMode: { ideal: facingMode }, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        // Some browsers require explicit play() even with autoPlay
        await videoRef.current.play().catch(e => {
          console.error("Autoplay failed:", e);
        });
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError(err instanceof Error ? err.message : "Could not access camera.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Handle mirroring if using front camera
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
        onClose();
      }
    } else {
      alert("Camera not ready. Please wait a moment.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {error ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <Icons.Camera className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white comic-font text-2xl uppercase">Camera Fault</h3>
            <p className="text-gray-400 max-w-xs mx-auto">{error}</p>
            <button 
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-contain"
            />
            
            <div className="absolute top-4 left-4">
              <button onClick={onClose} className="bg-black/50 p-3 rounded-full text-white hover:bg-black/80 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center space-x-12">
              <button 
                onClick={toggleCamera} 
                className="bg-black/40 p-4 rounded-full text-white hover:bg-black/60 transition-all active:scale-90"
                title="Switch Camera"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <button 
                onClick={capturePhoto} 
                className="w-24 h-24 bg-white rounded-full border-[6px] border-gray-300 flex items-center justify-center shadow-2xl active:scale-90 transition-transform p-1"
              >
                <div className="w-full h-full bg-white rounded-full border-2 border-gray-400" />
              </button>
              
              <div className="w-16 h-16 flex items-center justify-center opacity-0 pointer-events-none">
                 {/* Placeholder for balance */}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraModal;
