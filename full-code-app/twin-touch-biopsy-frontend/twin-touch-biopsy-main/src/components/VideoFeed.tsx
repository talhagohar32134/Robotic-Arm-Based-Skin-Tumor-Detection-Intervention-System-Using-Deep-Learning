import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX,
  Wifi,
  WifiOff,
  Target
} from "lucide-react";
import { HARDWARE_CONFIG } from "@/hooks/useHardwareConnection";
import { ClassificationResult } from "@/services/classificationService";

interface VideoFeedProps {
  isConnected: boolean;
  tumorDetected: boolean;
  classificationResult?: ClassificationResult | null;
}

export const VideoFeed = ({ isConnected, tumorDetected, classificationResult }: VideoFeedProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [frameRate, setFrameRate] = useState(30);
  const [streamError, setStreamError] = useState(false);

  // Simulate live feed data
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameRate(Math.floor(Math.random() * 5) + 28); // 28-32 fps simulation
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStreamError = () => {
    setStreamError(true);
  };

  const handleStreamLoad = () => {
    setStreamError(false);
  };

  return (
    <div className="h-full glass-card rounded-xl">
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Camera className="w-6 h-6 text-primary" />
              Live Camera Feed
            </h3>
            <p className="text-muted-foreground mt-1">Raspberry Pi Camera - Real-time biopsy site</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? "secondary" : "destructive"} className="px-3 py-1">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  {frameRate} FPS
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 mr-2" />
                  Offline
                </>
              )}
            </Badge>
            {tumorDetected && (
              <Badge variant="warning" className="animate-pulse px-3 py-1">
                <Target className="w-4 h-4 mr-2" />
                Tumor Detected
              </Badge>
            )}
            {classificationResult && (
              <Badge variant={classificationResult.label === "Malignant" ? "destructive" : "success"} className="px-3 py-1">
                {classificationResult.label}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl aspect-video overflow-hidden border border-border/30">
          {isConnected ? (
            <>
              {/* Live MJPEG stream from Raspberry Pi */}
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center relative">
                {/* 
                  For production, replace the simulated feed with:
                  <img 
                    src={HARDWARE_CONFIG.CAMERA_URL}
                    alt="Live Camera Feed"
                    className="w-full h-full object-cover"
                    onError={handleStreamError}
                    onLoad={handleStreamLoad}
                  />
                */}
                
                {/* Simulated video feed (remove in production) */}
                <div className="text-center text-slate-300">
                  <Camera className="w-20 h-20 mx-auto mb-6 opacity-60" />
                  <p className="text-xl font-medium">Live Camera Feed</p>
                  <p className="text-base opacity-75">Stream URL: {HARDWARE_CONFIG.CAMERA_URL}</p>
                </div>

                {/* Tumor detection overlay */}
                {tumorDetected && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-40 h-32 border-3 border-warning rounded-xl animate-pulse shadow-[0_0_20px_hsl(var(--warning)/0.5)]">
                      <div className="absolute -top-8 left-0 bg-warning text-warning-foreground px-4 py-2 rounded-lg text-sm font-semibold">
                        Lesion Detected
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced crosshair overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="w-px h-12 bg-primary/80 shadow-glow"></div>
                    <div className="w-12 h-px bg-primary/80 shadow-glow absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-primary/80 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Enhanced video controls overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className="bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm border border-white/20"
                  >
                    {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="bg-black/70 text-white hover:bg-black/90 backdrop-blur-sm border border-white/20"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              {/* Enhanced stream info overlay */}
              <div className="absolute top-6 left-6">
                <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-3 backdrop-blur-sm border border-white/20">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  <span className="font-semibold">LIVE • 1920x1080 • {frameRate} FPS</span>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <WifiOff className="w-20 h-20 mx-auto mb-6" />
                <p className="text-xl font-medium">Camera Offline</p>
                <p className="text-base">Check Raspberry Pi connection</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced stream statistics */}
        {isConnected && (
          <div className="mt-6 grid grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-card/30 rounded-lg border border-border/30">
              <p className="text-sm text-muted-foreground mb-1">Latency</p>
              <p className="text-lg font-bold text-success">45ms</p>
            </div>
            <div className="p-4 bg-card/30 rounded-lg border border-border/30">
              <p className="text-sm text-muted-foreground mb-1">Quality</p>
              <p className="text-lg font-bold text-primary">HD 1080p</p>
            </div>
            <div className="p-4 bg-card/30 rounded-lg border border-border/30">
              <p className="text-sm text-muted-foreground mb-1">Bitrate</p>
              <p className="text-lg font-bold text-accent">2.1 Mbps</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};