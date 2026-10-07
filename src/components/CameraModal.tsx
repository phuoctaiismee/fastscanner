"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  X,
  SwitchCamera,
  Zap,
  ZapOff,
  Check,
  Upload,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePage: (dataUrl: string, width: number, height: number) => void;
  capturedCount: number;
}

export default function CameraModal({
  isOpen,
  onClose,
  onCapturePage,
  capturedCount,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  // Play subtle shutter sound using Web Audio API
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio playback ignore error
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setErrorMsg(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if ("torch" in capabilities) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMsg("Vào qua HTTP IP trình duyệt chặn camera trực tiếp. Hãy chọn chụp ảnh trực tiếp bằng app Camera bên dưới!");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMsg("Không tìm thấy camera trên thiết bị. Vui lòng chọn ảnh từ thư viện.");
      } else {
        setErrorMsg("Không thể mở live camera (do HTTP IP). Bạn có thể bấm chụp từ app Camera máy bên dưới!");
      }
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startStream();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startStream, stopStream]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch failed", e);
    }
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleCapture = () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setFlashEffect(true);
    playShutterSound();

    setTimeout(() => {
      setFlashEffect(false);
    }, 150);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      onCapturePage(dataUrl, canvas.width, canvas.height);
    }

    setTimeout(() => {
      setIsCapturing(false);
    }, 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const img = new Image();
          img.onload = () => {
            onCapturePage(dataUrl, img.width, img.height);
          };
          img.src = dataUrl;
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) {
      e.target.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-dvh z-50 bg-black text-white flex flex-col justify-between overflow-hidden">
      {/* Visual Flash Effect on Capture */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150" />
      )}

      {/* Top Action Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <X className="w-5 h-5" />
        </Button>

        <Badge variant="secondary" className="px-3 py-1 font-semibold text-xs gap-1.5 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          {capturedCount > 0 ? `Đã chụp ${capturedCount} trang` : "Chụp trang mới"}
        </Badge>

        <div className="flex items-center gap-2">
          {torchSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTorch}
              className={`rounded-full backdrop-blur-md ${
                torchOn ? "bg-amber-400 text-black hover:bg-amber-300" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFlipCamera}
            className="rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <SwitchCamera className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        {errorMsg ? (
          <div className="p-6 max-w-xs text-center flex flex-col items-center gap-4 bg-card text-card-foreground rounded-2xl border border-border shadow-xl">
            <div className="w-12 h-12 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</p>
            
            <div className="w-full space-y-2">
              <Button
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full text-xs font-semibold gap-2"
              >
                <Camera className="w-4 h-4" />
                Chụp ảnh từ App Camera
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-xs font-semibold gap-2"
              >
                <Upload className="w-4 h-4" />
                Chọn ảnh từ thư viện
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Document Frame Guide Lines */}
            <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-4 shadow-2xl">
              <div className="flex justify-between items-start">
                <div className="w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-sm" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-sm" />
              </div>
              <div className="text-center text-[11px] font-medium text-white/90 bg-black/50 backdrop-blur-xs py-1 px-3 rounded-full self-center border border-white/10">
                Căn chỉnh tài liệu trong khung
              </div>
              <div className="flex justify-between items-end">
                <div className="w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-sm" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-sm" />
              </div>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Bottom Control Dock */}
      <div className="relative z-20 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-around">
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium">Tải ảnh</span>
        </button>

        {/* Big Capture Shutter Button */}
        <button
          onClick={errorMsg ? () => nativeCameraInputRef.current?.click() : handleCapture}
          disabled={isCapturing}
          aria-label="Chụp ảnh tài liệu"
          className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition disabled:opacity-50 shadow-xl"
        >
          <div className="w-full h-full rounded-full bg-primary text-primary-foreground flex items-center justify-center transition">
            <Camera className="w-8 h-8" />
          </div>
        </button>

        {/* Done / Finish Button */}
        <button
          onClick={onClose}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Check className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-medium">Hoàn thành</span>
        </button>
      </div>
    </div>
  );
}
