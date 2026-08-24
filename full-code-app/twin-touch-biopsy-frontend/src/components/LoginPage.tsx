import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Stethoscope, Brain, Cpu } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-medical flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-medical">
              <Cpu className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">MedTwin Pro</h1>
            <p className="text-muted-foreground mt-2">Deep Learning-Enhanced Digital Twins for Advanced Biopsy Systems</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-medical border-0">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Doctor Login</CardTitle>
            <CardDescription className="text-center">
              Secure access to robotic biopsy system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" variant="medical" size="lg" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Secure Login
              </Button>
            </form>

            <Separator />

            {/* Features Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground text-center">System Features</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                    <Stethoscope className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground">3 DOF Control</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">AI Diagnosis</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center mx-auto">
                    <Cpu className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground">Digital Twin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          Secure • HIPAA Compliant • Real-time Control
        </div>
      </div>
    </div>
  );
};