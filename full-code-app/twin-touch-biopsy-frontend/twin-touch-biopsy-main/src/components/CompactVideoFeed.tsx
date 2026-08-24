import { useState, useEffect } from "react";
import { Camera, Maximize2, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HARDWARE_CONFIG } from "@/hooks/useHardwareConnection";
import type { ClassificationResult } from "@/services/classificationService";

interface CompactVideoFeedProps {
  isConnected: boolean;
  tumorDetected: boolean;
  classificationResult?: ClassificationResult | null;
  onFullscreen?: () => void;
}

export const CompactVideoFeed = ({
  isConnected,
  tumorDetected,
  classificationResult,
  onFullscreen
}: CompactVideoFeedProps) => {
  const [frameRate, setFrameRate] = useState(30);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameRate(Math.floor(Math.random() * 5) + 28);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header Info Banner */}
      <div className="flex items-center justify-between p-3 bg-card/60 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Camera className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Live Camera Feed</h3>
            <p className="text-xs text-muted-foreground font-mono">Pi Camera Module</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "secondary" : "destructive"} className="px-2 py-1 text-xs">
            {isConnected ? `${frameRate} FPS` : "Camera Offline"}
          </Badge>
          {classificationResult && (
            <Badge
              variant={classificationResult.label === 'Malignant' ? 'destructive' : 'default'}
              className="px-2 py-1 text-xs ml-2 animate-pulse"
            >
              AI: {classificationResult.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 p-2 min-h-0 relative">
        <div className="bg-gradient-to-br from-[#0c1626] to-[#060b13] rounded-xl h-full overflow-hidden border border-border/40  relative group">

          {/* Main Feed Box */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isConnected ? (
              <img
                src={HARDWARE_CONFIG.CAMERA_URL}
                alt="Live Camera Feed"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if hardware stream is unreachable during testing
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'text-center text-slate-400';
                    fallback.innerHTML = `
                      <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <svg class="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p class="text-sm font-semibold">Hardware Camera Stream Unreachable</p>
                      <p class="text-xs opacity-70">Waiting for Raspberry Pi...</p>
                    `;
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="text-center text-slate-400">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Camera className="w-8 h-8 opacity-60" />
                </div>
                <p className="text-sm font-semibold">Hardware Offline</p>
                <p className="text-xs opacity-70">Connect physical hardware to view feed.</p>
              </div>
            )}
          </div>

          {/* Overlays */}
          {isConnected && (
            <>
              {/* Target Hair */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-40 mix-blend-screen pointer-events-none">
                <Crosshair className="w-16 h-16 text-primary" />
              </div>

              {/* Status pill overlay */}
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-widest uppercase">REC 00:00:00</span>
                </div>
              </div>

              {/* Focus target overlay */}
              <div className="absolute top-4 right-4 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10">
                  <span className="text-[10px] font-mono text-green-400">AF-C []</span>
                </div>
              </div>

              {/* Bottom Telemetry Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-white/70">RES: 1920x1080</div>
                    <div className="text-[10px] font-mono text-white/70">EXPO: AUTO</div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-1 h-3 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="w-full bg-green-500 transition-all duration-300"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detection overlay - AI results */}
              {classificationResult && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className={`w-32 h-32 border-2 ${classificationResult.label === 'Malignant' ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'} rounded-lg transition-colors duration-500 flex items-end justify-center p-2`}>
                    <span className={`text-xs font-bold bg-black/70 px-2 py-1 rounded ${classificationResult.label === 'Malignant' ? 'text-red-400' : 'text-green-400'}`}>
                      {Math.round(classificationResult.confidence)}%
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-black/60 text-white/70 border border-white/10 hover:bg-black/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (onFullscreen) onFullscreen();
            }}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
