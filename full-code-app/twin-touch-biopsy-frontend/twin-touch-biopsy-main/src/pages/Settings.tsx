import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings as SettingsIcon, Wifi, Bell, Shield, Monitor, Brain, Download, Upload, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  loadSettings,
  saveSettings,
  resetSettings,
  exportSettings,
  SystemSettings,
} from "@/services/settingsService";

const Settings = () => {
  const [settings, setSettings] = useState<SystemSettings>(loadSettings);

  const handleSave = () => {
    const success = saveSettings(settings);
    if (success) {
      toast.success("Settings saved successfully");
    } else {
      toast.error("Failed to save settings");
    }
  };

  const handleReset = () => {
    const defaults = resetSettings();
    setSettings(defaults);
    toast.success("Settings reset to defaults");
  };

  const handleExport = () => {
    exportSettings();
    toast.success("Settings exported");
  };

  const update = <K extends keyof SystemSettings>(
    section: K,
    key: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-xl shadow-dark">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-3">
                  <SettingsIcon className="w-8 h-8 text-primary" />
                  System Settings
                </h1>
                <p className="text-muted-foreground mt-1">Configure robotic biopsy system parameters</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Connection Settings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Connection Settings
              </CardTitle>
              <CardDescription>Configure Raspberry Pi communication and network settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ip-address">Hardware IP / Hostname</Label>
                  <Input
                    id="ip-address"
                    value={settings.connection.hardwareIP}
                    onChange={e => update('connection', 'hardwareIP', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ws-port">WebSocket Port</Label>
                  <Input
                    id="ws-port"
                    value={settings.connection.wsPort}
                    onChange={e => update('connection', 'wsPort', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="camera-port">Camera Stream Port</Label>
                  <Input
                    id="camera-port"
                    value={settings.connection.cameraPort}
                    onChange={e => update('connection', 'cameraPort', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reconnect-attempts">Max Reconnect Attempts</Label>
                  <Input
                    id="reconnect-attempts"
                    type="number"
                    value={settings.connection.maxReconnectAttempts}
                    onChange={e => update('connection', 'maxReconnectAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-reconnect</Label>
                  <p className="text-sm text-muted-foreground">Automatically reconnect if connection is lost</p>
                </div>
                <Switch
                  checked={settings.connection.autoReconnect}
                  onCheckedChange={v => update('connection', 'autoReconnect', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Control Settings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Control Settings
              </CardTitle>
              <CardDescription>Adjust robotic arm control parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Movement Speed</Label>
                  <Select
                    value={settings.control.movementSpeed}
                    onValueChange={v => update('control', 'movementSpeed', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (Precise)</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Control Sensitivity</Label>
                  <Select
                    value={settings.control.controlSensitivity}
                    onValueChange={v => update('control', 'controlSensitivity', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hardware Sync Confirmation</Label>
                  <p className="text-sm text-muted-foreground">Show notifications when hardware confirms movement</p>
                </div>
                <Switch
                  checked={settings.control.hardwareSyncConfirmation}
                  onCheckedChange={v => update('control', 'hardwareSyncConfirmation', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Model Settings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Model Configuration
              </CardTitle>
              <CardDescription>Configure the skin lesion classification model on Raspberry Pi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model Path (on Raspberry Pi)</Label>
                  <Input
                    value={settings.aiModel.modelPath}
                    onChange={e => update('aiModel', 'modelPath', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Architecture</Label>
                  <Select
                    value={settings.aiModel.modelArchitecture}
                    onValueChange={v => update('aiModel', 'modelArchitecture', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ResNet-50">ResNet-50</SelectItem>
                      <SelectItem value="MobileNetV2">MobileNetV2</SelectItem>
                      <SelectItem value="EfficientNet">EfficientNet</SelectItem>
                      <SelectItem value="Custom CNN">Custom CNN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Confidence Threshold (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(settings.aiModel.confidenceThreshold * 100)}
                    onChange={e => update('aiModel', 'confidenceThreshold', parseInt(e.target.value) / 100)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Input Size</Label>
                  <Input
                    value={`${settings.aiModel.inputWidth}x${settings.aiModel.inputHeight}`}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tumor Detection Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify when AI detects potential tumors</p>
                </div>
                <Switch
                  checked={settings.notifications.tumorDetectionAlerts}
                  onCheckedChange={v => update('notifications', 'tumorDetectionAlerts', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Emergency Stop Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alert for emergency stop activation</p>
                </div>
                <Switch
                  checked={settings.notifications.emergencyStopAlerts}
                  onCheckedChange={v => update('notifications', 'emergencyStopAlerts', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Connection Status</Label>
                  <p className="text-sm text-muted-foreground">Notify on connection changes</p>
                </div>
                <Switch
                  checked={settings.notifications.connectionStatusAlerts}
                  onCheckedChange={v => update('notifications', 'connectionStatusAlerts', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>Configure security and data handling settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for system access</p>
                </div>
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={v => update('security', 'twoFactorAuth', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <Switch
                  checked={settings.security.sessionTimeout}
                  onCheckedChange={v => update('security', 'sessionTimeout', v)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
                <Input
                  id="timeout-duration"
                  type="number"
                  value={settings.security.timeoutDuration}
                  min={5}
                  max={120}
                  onChange={e => update('security', 'timeoutDuration', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Link to="/">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button variant="medical" onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
