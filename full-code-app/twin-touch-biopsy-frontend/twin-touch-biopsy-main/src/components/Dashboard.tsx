import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SliderControlPanel } from "./SliderControlPanel";
import { CompactVideoFeed } from "./CompactVideoFeed";
import { AIDiagnosisPanel } from "./AIDiagnosisPanel";
import { RoboticArm3D } from "./RoboticArm3D";
import { LogOut, Settings, Wifi, AlertTriangle, CheckCircle, BarChart3, FileText, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useHardwareConnection, HARDWARE_CONFIG, ArmState } from "@/hooks/useHardwareConnection";
import { classifyImage, ClassificationResult } from "@/services/classificationService";

interface DashboardProps {
  onLogout: () => void;
}

// Toggle this to use real hardware or simulation
const USE_HARDWARE_CONNECTION = false;

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const navigate = useNavigate();

  // Hardware connection hook
  const {
    armState: hardwareArmState,
    hardwareStatus,
    connect,
    disconnect,
    sendCommand,
    emergencyStop: hwEmergencyStop,
    clearFault,
    setArmState: setHardwareArmState,
  } = useHardwareConnection();

  // Local state for simulation mode
  const [localArmState, setLocalArmState] = useState<ArmState>({
    yaw: 0,
    pitch: 0.3,
    roll: 0,
    biopsyExtension: 0
  });

  // Use hardware state when connected, otherwise use local state
  const armState = USE_HARDWARE_CONNECTION && hardwareStatus.isConnected
    ? hardwareArmState
    : localArmState;

  const setArmState = USE_HARDWARE_CONNECTION && hardwareStatus.isConnected
    ? setHardwareArmState
    : setLocalArmState;

  const [emergencyStop, setEmergencyStop] = useState(false);
  const [tumorDetected, setTumorDetected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);

  // Derived connection state
  const isConnected = USE_HARDWARE_CONNECTION ? hardwareStatus.isConnected : true;

  // Auto-connect to hardware on mount (if enabled)
  useEffect(() => {
    if (USE_HARDWARE_CONNECTION) {
      connect();
      return () => disconnect();
    }
  }, [connect, disconnect]);

  // Update tumor detected based on AI classification result
  useEffect(() => {
    if (classificationResult) {
      setTumorDetected(classificationResult.label === "Malignant");
    }
  }, [classificationResult]);

  // Handle slider changes - send position to hardware
  const handleArmStateChange = useCallback((newState: Partial<ArmState>) => {
    if (emergencyStop) {
      toast.error("System is in emergency stop mode");
      return;
    }

    // Update local state
    setArmState((prev: ArmState) => ({ ...prev, ...newState }));

    // Send to hardware if connected
    if (USE_HARDWARE_CONNECTION && hardwareStatus.isConnected) {
      const fullState = { ...armState, ...newState };
      sendCommand('set_position', undefined);
      // Send individual axis commands
      if (newState.yaw !== undefined) {
        sendCommand('set_yaw', newState.yaw);
      }
      if (newState.pitch !== undefined) {
        sendCommand('set_pitch', newState.pitch);
      }
      if (newState.roll !== undefined) {
        sendCommand('set_roll', newState.roll);
      }
    }
  }, [emergencyStop, hardwareStatus.isConnected, sendCommand, setArmState, armState]);

  const handleEmergencyStop = useCallback(() => {
    setEmergencyStop(true);
    if (USE_HARDWARE_CONNECTION) {
      hwEmergencyStop();
    }
    toast.error("EMERGENCY STOP ACTIVATED", { duration: 5000 });
  }, [hwEmergencyStop]);

  const handleResume = useCallback(() => {
    setEmergencyStop(false);
    if (USE_HARDWARE_CONNECTION) {
      clearFault();
    }
    toast.success("System resumed");
  }, [clearFault]);

  const handleBiopsy = useCallback(() => {
    if (emergencyStop) {
      toast.error("System is in emergency stop mode");
      return;
    }

    if (tumorDetected) {
      setArmState((prev: ArmState) => ({ ...prev, biopsyExtension: 0.8 }));

      if (USE_HARDWARE_CONNECTION && hardwareStatus.isConnected) {
        sendCommand('perform_biopsy');
      }

      setTimeout(() => {
        setArmState((prev: ArmState) => ({ ...prev, biopsyExtension: 0 }));
      }, 2000);

      toast.success("✓ Biopsy performed successfully");
    } else {
      toast.warning("No tumor detected at current position");
    }
  }, [emergencyStop, tumorDetected, hardwareStatus.isConnected, sendCommand, setArmState]);

  const handleReset = useCallback(() => {
    if (emergencyStop) {
      toast.error("System is in emergency stop mode");
      return;
    }

    setArmState({
      yaw: 0,
      pitch: 0.3,
      roll: 0,
      biopsyExtension: 0
    });

    if (USE_HARDWARE_CONNECTION && hardwareStatus.isConnected) {
      sendCommand('reset_position');
    }

    toast.success("✓ Arm position reset");
  }, [emergencyStop, hardwareStatus.isConnected, sendCommand, setArmState]);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setClassificationResult(null);
    setTumorDetected(false);

    try {
      // Send undefined to use hardware capture or mock fallback at backend
      const result = await classifyImage(undefined);
      setClassificationResult(result);
      toast.success(`Analysis complete: ${result.label} (${result.confidence}% confidence)`);
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Classification failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Convert radians to degrees for display
  const toDegrees = (rad: number) => (rad * 180 / Math.PI).toFixed(1);

  return (
    <div className="h-screen bg-gradient-dark flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/40 backdrop-blur-xl shadow-dark shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  MedTwin Pro
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "secondary" : "destructive"} className="px-2 py-0.5 text-xs">
                  <Wifi className="w-3 h-3 mr-1" />
                  {isConnected ? "Connected" : "Offline"}
                </Badge>
                {emergencyStop && (
                  <Badge variant="destructive" className="animate-pulse px-2 py-0.5 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    EMERGENCY
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/results">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <FileText className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/insights">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={onLogout} className="px-3 text-xs h-8">
                <LogOut className="w-3 h-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Three Column Layout: Controls | Digital Twin | Camera + AI */}
      <main className="flex-1 p-3 overflow-hidden">
        <div className="h-full flex gap-3">

          {/* Left Column - Controls */}
          <div className="w-64 shrink-0 flex flex-col">
            <SliderControlPanel
              armState={armState}
              onArmStateChange={handleArmStateChange}
              onEmergencyStop={handleEmergencyStop}
              onResume={handleResume}
              onBiopsy={handleBiopsy}
              onReset={handleReset}
              isConnected={isConnected}
              emergencyStop={emergencyStop}
            />
          </div>

          {/* Center Column - Digital Twin (Primary Focus) */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Digital Twin Header */}
            <div className="glass-card rounded-t-xl p-2 border-b-0 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="font-bold text-sm">Digital Twin - 3 DOF Robotic Arm</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                    Synced
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center px-3 py-1 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Yaw</span>
                    <p className="font-mono font-bold text-primary">{toDegrees(armState.yaw)}°</p>
                  </div>
                  <div className="text-center px-3 py-1 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Pitch</span>
                    <p className="font-mono font-bold text-primary">{toDegrees(armState.pitch)}°</p>
                  </div>
                  <div className="text-center px-3 py-1 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Roll</span>
                    <p className="font-mono font-bold text-primary">{toDegrees(armState.roll)}°</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Viewer - Large */}
            <div className="flex-1 glass-card rounded-b-xl rounded-t-none overflow-hidden border-t-0 min-h-0">
              <RoboticArm3D armState={armState} />
            </div>
          </div>

          {/* Right Column - Live Camera Feed + AI Panel */}
          <div className="w-[420px] shrink-0 flex flex-col gap-3">
            {/* Camera Feed - Takes 55% of right column */}
            <div className="flex-[1.2] min-h-0">
              <CompactVideoFeed
                isConnected={isConnected}
                tumorDetected={tumorDetected}
                classificationResult={classificationResult}
              />
            </div>

            {/* AI Panel - Takes 45% of right column for full button visibility */}
            <div className="flex-1 min-h-[280px] overflow-auto">
              <AIDiagnosisPanel
                isAnalyzing={isAnalyzing}
                classificationResult={classificationResult}
                onStartAnalysis={handleStartAnalysis}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
