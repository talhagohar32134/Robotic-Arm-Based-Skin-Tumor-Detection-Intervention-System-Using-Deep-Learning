import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Scan, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Eye,
  Activity
} from "lucide-react";
import { ClassificationResult, MODEL_CONFIG } from "@/services/classificationService";

interface AIDiagnosisPanelProps {
  isAnalyzing: boolean;
  classificationResult?: ClassificationResult | null;
  onStartAnalysis: () => void;
}

export const AIDiagnosisPanel = ({ 
  isAnalyzing, 
  classificationResult, 
  onStartAnalysis 
}: AIDiagnosisPanelProps) => {
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      setAnalysisProgress(0);
    }
  }, [isAnalyzing]);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "text-success";
    if (conf >= 70) return "text-warning";
    return "text-destructive";
  };

  const getResultIcon = () => {
    if (!classificationResult) return null;
    return classificationResult.label === "Benign" ? 
      <CheckCircle className="w-5 h-5 text-success" /> : 
      <AlertTriangle className="w-5 h-5 text-destructive" />;
  };

  return (
    <div className="h-full glass-card rounded-xl">
      <div className="p-6 border-b border-border/30">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <Brain className="w-6 h-6 text-primary" />
          AI Tumor Analysis
        </h3>
        <p className="text-muted-foreground mt-1">
          {MODEL_CONFIG.MODEL_ARCHITECTURE} Classification
        </p>
      </div>
      
      <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Analysis Button */}
        <Button
          variant="medical"
          size="control"
          onClick={onStartAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Scan className="w-5 h-5 mr-3" />
              Start AI Analysis
            </>
          )}
        </Button>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing</span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Extracting features and running classification...
            </p>
          </div>
        )}

        {/* Results */}
        {classificationResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                {getResultIcon()}
                <div>
                  <p className="font-medium">{classificationResult.label}</p>
                  <p className="text-sm text-muted-foreground">Classification Result</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${getConfidenceColor(classificationResult.confidence)}`}>
                  {classificationResult.confidence}%
                </p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>

            <Separator />

            {/* ABCD Analysis */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                ABCD Feature Analysis
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Asymmetry</span>
                  <div className="flex items-center gap-2">
                    <Progress value={classificationResult.features.asymmetry} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{classificationResult.features.asymmetry}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Border irregularity</span>
                  <div className="flex items-center gap-2">
                    <Progress value={classificationResult.features.border} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{classificationResult.features.border}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Color variation</span>
                  <div className="flex items-center gap-2">
                    <Progress value={classificationResult.features.color} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{classificationResult.features.color}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Diameter</span>
                  <div className="flex items-center gap-2">
                    <Progress value={classificationResult.features.diameter} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{classificationResult.features.diameter}%</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Model Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Model Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Architecture</p>
                  <p className="font-medium">{classificationResult.modelInfo.architecture}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{classificationResult.modelInfo.version}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">{classificationResult.modelInfo.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inference</p>
                  <p className="font-medium">{classificationResult.inferenceTime}ms</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {classificationResult.label === "Malignant" && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Urgent: Immediate Biopsy Recommended</p>
                    <p className="text-muted-foreground mt-1">
                      High malignancy probability detected. Proceed with tissue sampling for histopathological analysis.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!classificationResult && !isAnalyzing && (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="w-16 h-16 mx-auto mb-6 opacity-50" />
            <p className="text-base">Position arm over tumor and click "Start AI Analysis"</p>
            <p className="text-xs mt-2 opacity-75">Model: {MODEL_CONFIG.MODEL_PATH}</p>
          </div>
        )}
      </div>
    </div>
  );
};