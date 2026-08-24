import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  RotateCcw, 
  Syringe,
  Square,
  Power,
  Zap,
  RotateCw,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { ArmState } from "@/hooks/useHardwareConnection";

interface SliderControlPanelProps {
  armState: ArmState;
  onArmStateChange: (newState: Partial<ArmState>) => void;
  onEmergencyStop: () => void;
  onResume: () => void;
  onBiopsy: () => void;
  onReset: () => void;
  isConnected: boolean;
  emergencyStop: boolean;
}

export const SliderControlPanel = ({ 
  armState, 
  onArmStateChange, 
  onEmergencyStop,
  onResume,
  onBiopsy,
  onReset,
  isConnected, 
  emergencyStop 
}: SliderControlPanelProps) => {

  // Convert radians to degrees for display
  const toDegrees = (rad: number) => (rad * 180 / Math.PI).toFixed(1);
  
  // Convert degrees to radians for state
  const toRadians = (deg: number) => (deg * Math.PI / 180);

  const handleYawChange = (value: number[]) => {
    if (!emergencyStop) {
      onArmStateChange({ yaw: toRadians(value[0]) });
    }
  };

  const handlePitchChange = (value: number[]) => {
    if (!emergencyStop) {
      onArmStateChange({ pitch: toRadians(value[0]) });
    }
  };

  const handleRollChange = (value: number[]) => {
    if (!emergencyStop) {
      onArmStateChange({ roll: toRadians(value[0]) });
    }
  };

  return (
    <div className="h-full glass-card rounded-xl flex flex-col">
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Arm Control
            </h3>
            <p className="text-muted-foreground text-sm">Precision 3-DOF Control</p>
          </div>
          <Badge variant={isConnected ? "secondary" : "destructive"} className="px-2 py-1 text-xs">
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Emergency Stop */}
        <Button
          variant="emergency"
          className="w-full h-12"
          onClick={onEmergencyStop}
        >
          <Square className="w-5 h-5 mr-2" />
          EMERGENCY STOP
        </Button>

        {emergencyStop && (
          <Button
            variant="success"
            className="w-full h-10"
            onClick={onResume}
          >
            Resume System
          </Button>
        )}

        <Separator />

        {/* Yaw Control (Base Rotation) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Base Rotation (Yaw)</span>
            </div>
            <span className="text-sm font-mono font-bold text-primary">
              {toDegrees(armState.yaw)}°
            </span>
          </div>
          <Slider
            value={[armState.yaw * 180 / Math.PI]}
            min={-180}
            max={180}
            step={1}
            onValueChange={handleYawChange}
            disabled={emergencyStop}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-180°</span>
            <span>0°</span>
            <span>+180°</span>
          </div>
        </div>

        {/* Pitch Control (Shoulder) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Shoulder (Pitch)</span>
            </div>
            <span className="text-sm font-mono font-bold text-primary">
              {toDegrees(armState.pitch)}°
            </span>
          </div>
          <Slider
            value={[armState.pitch * 180 / Math.PI]}
            min={-90}
            max={90}
            step={1}
            onValueChange={handlePitchChange}
            disabled={emergencyStop}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-90°</span>
            <span>0°</span>
            <span>+90°</span>
          </div>
        </div>

        {/* Roll Control (Wrist) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Wrist (Roll)</span>
            </div>
            <span className="text-sm font-mono font-bold text-primary">
              {toDegrees(armState.roll)}°
            </span>
          </div>
          <Slider
            value={[armState.roll * 180 / Math.PI]}
            min={-180}
            max={180}
            step={1}
            onValueChange={handleRollChange}
            disabled={emergencyStop}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-180°</span>
            <span>0°</span>
            <span>+180°</span>
          </div>
        </div>

        <Separator />

        {/* Biopsy & Reset */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="accent"
            className="h-12"
            onClick={onBiopsy}
            disabled={emergencyStop}
          >
            <Syringe className="w-4 h-4 mr-2" />
            Biopsy
          </Button>
          <Button
            variant="secondary"
            className="h-12"
            onClick={onReset}
            disabled={emergencyStop}
          >
            <Power className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};