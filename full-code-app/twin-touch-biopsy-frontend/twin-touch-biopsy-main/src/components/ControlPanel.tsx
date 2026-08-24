import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  RotateCcw, 
  RotateCw, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Syringe,
  Square,
  Power,
  Zap
} from "lucide-react";

interface ControlPanelProps {
  onControl: (action: string, value?: number) => void;
  isConnected: boolean;
  emergencyStop: boolean;
}

export const ControlPanel = ({ onControl, isConnected, emergencyStop }: ControlPanelProps) => {
  const handleControl = (action: string, value?: number) => {
    if (!emergencyStop) {
      onControl(action, value);
    }
  };

  return (
    <div className="h-full glass-card rounded-xl">
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Zap className="w-6 h-6 text-accent" />
              3 DOF Controls
            </h3>
            <p className="text-muted-foreground mt-1">Roll, Pitch, Yaw Controls</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? "secondary" : "destructive"} className="px-3 py-1">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {emergencyStop && (
              <Badge variant="destructive" className="animate-pulse px-3 py-1">
                EMERGENCY STOP
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Emergency Stop */}
        <div className="flex justify-center">
          <Button
            variant="emergency"
            size="control"
            onClick={() => onControl("emergency_stop")}
          >
            <Square className="w-6 h-6 mr-3" />
            EMERGENCY STOP
          </Button>
        </div>

        <Separator />

        {/* Base Rotation (DOF 1) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Base Rotation (Yaw)</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="control"
              size="control"
              onClick={() => handleControl("base_left")}
              disabled={emergencyStop}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Left
            </Button>
            <Button
              variant="control"
              size="control"
              onClick={() => handleControl("base_right")}
              disabled={emergencyStop}
            >
              <RotateCw className="w-5 h-5 mr-2" />
              Right
            </Button>
          </div>
        </div>

        {/* Pitch Control (DOF 2) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pitch Control</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="control"
              size="control"
              onClick={() => handleControl("pitch_up")}
              disabled={emergencyStop}
            >
              <ArrowUp className="w-5 h-5 mr-2" />
              Up
            </Button>
            <Button
              variant="control"
              size="control"
              onClick={() => handleControl("pitch_down")}
              disabled={emergencyStop}
            >
              <ArrowDown className="w-5 h-5 mr-2" />
              Down
            </Button>
          </div>
        </div>

        {/* Roll Control (DOF 3) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Roll Control</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="control"
              size="control"
              onClick={() => handleControl("roll_left")}
              disabled={emergencyStop}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Left
            </Button>
            <Button
              variant="control"
              size="control"
              onClick={() => handleControl("roll_right")}
              disabled={emergencyStop}
            >
              <RotateCw className="w-5 h-5 mr-2" />
              Right
            </Button>
          </div>
        </div>

        <Separator />

        {/* Biopsy Control */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Biopsy Operation</h4>
          <Button
            variant="accent"
            size="control"
            onClick={() => handleControl("perform_biopsy")}
            disabled={emergencyStop}
          >
            <Syringe className="w-5 h-5 mr-3" />
            Perform Biopsy
          </Button>
        </div>

        {/* System Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">System</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onControl("reset_position")}
              disabled={emergencyStop}
            >
              <Power className="w-5 h-5 mr-2" />
              Reset
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={() => onControl("resume")}
              disabled={!emergencyStop}
            >
              Resume
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};