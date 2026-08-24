import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, User, FileText, Download, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  getAllResults,
  exportResultsCSV,
  exportResultsJSON,
  exportResultReport,
  deleteResult,
  updateResultStatus,
  BiopsyResult,
} from "@/services/resultsService";

// Demo seed data for first load
const DEMO_RESULTS: BiopsyResult[] = [
  {
    id: "BX-2024-001",
    patientName: "Sarah Johnson",
    date: "2024-01-15",
    time: "14:30",
    classification: "Benign",
    confidence: 94,
    probabilities: { benign: 94, malignant: 6 },
    features: { asymmetry: 22, border: 18, color: 15, diameter: 20 },
    tumorLocation: "Right shoulder",
    doctorName: "Dr. Michael Chen",
    notes: "Small lesion, consistent with benign nevus. No further action required.",
    status: "Reviewed",
    createdAt: "2024-01-15T14:30:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
  },
  {
    id: "BX-2024-002",
    patientName: "Robert Smith",
    date: "2024-01-15",
    time: "10:15",
    classification: "Malignant",
    confidence: 87,
    probabilities: { benign: 13, malignant: 87 },
    features: { asymmetry: 65, border: 58, color: 72, diameter: 45 },
    tumorLocation: "Left forearm",
    doctorName: "Dr. Michael Chen",
    notes: "Suspicious melanoma characteristics. Recommend immediate surgical consultation.",
    status: "Completed",
    createdAt: "2024-01-15T10:15:00Z",
    updatedAt: "2024-01-15T10:15:00Z",
  },
  {
    id: "BX-2024-003",
    patientName: "Maria Garcia",
    date: "2024-01-14",
    time: "16:45",
    classification: "Benign",
    confidence: 91,
    probabilities: { benign: 91, malignant: 9 },
    features: { asymmetry: 15, border: 20, color: 25, diameter: 18 },
    tumorLocation: "Back",
    doctorName: "Dr. Sarah Williams",
    notes: "Seborrheic keratosis confirmed. Patient counseled on monitoring.",
    status: "Reviewed",
    createdAt: "2024-01-14T16:45:00Z",
    updatedAt: "2024-01-14T16:45:00Z",
  },
  {
    id: "BX-2024-004",
    patientName: "James Wilson",
    date: "2024-01-14",
    time: "11:20",
    classification: "Malignant",
    confidence: 89,
    probabilities: { benign: 11, malignant: 89 },
    features: { asymmetry: 70, border: 62, color: 55, diameter: 48 },
    tumorLocation: "Chest",
    doctorName: "Dr. Michael Chen",
    notes: "Basal cell carcinoma features present. Scheduled for excision.",
    status: "Pending Review",
    createdAt: "2024-01-14T11:20:00Z",
    updatedAt: "2024-01-14T11:20:00Z",
  },
];

export const Results = () => {
  const [filter, setFilter] = useState<"All" | "Benign" | "Malignant">("All");
  const [results, setResults] = useState<BiopsyResult[]>([]);

  useEffect(() => {
    let stored = getAllResults();
    // Seed demo data if empty
    if (stored.length === 0) {
      localStorage.setItem('medtwin_results', JSON.stringify(DEMO_RESULTS));
      stored = DEMO_RESULTS;
    }
    setResults(stored);
  }, []);

  const filteredResults = filter === "All"
    ? results
    : results.filter(result => result.classification === filter);

  const handleDelete = (id: string) => {
    deleteResult(id);
    setResults(prev => prev.filter(r => r.id !== id));
    toast.success("Result deleted");
  };

  const handleExportCSV = () => {
    exportResultsCSV();
    toast.success("Results exported as CSV");
  };

  const handleExportJSON = () => {
    exportResultsJSON();
    toast.success("Results exported as JSON");
  };

  const handleExportReport = (result: BiopsyResult) => {
    exportResultReport(result);
    toast.success(`Report exported for ${result.id}`);
  };

  const handleStatusChange = (id: string, status: BiopsyResult['status']) => {
    updateResultStatus(id, status);
    setResults(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Status updated to ${status}`);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-xl shadow-dark">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/">
                <Button variant="ghost" size="icon" className="hover:shadow-glow">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Biopsy Results
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="px-4" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" className="px-4" onClick={handleExportJSON}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-muted-foreground">Filter by classification:</span>
          {(["All", "Benign", "Malignant"] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? "default" : "outline"}
              onClick={() => setFilter(filterOption)}
              className="px-6"
            >
              {filterOption}
            </Button>
          ))}
          <span className="ml-auto text-muted-foreground text-sm">{filteredResults.length} results</span>
        </div>

        {/* Results Grid */}
        <div className="grid gap-6">
          {filteredResults.map((result) => (
            <Card key={result.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{result.patientName}</h3>
                    <p className="text-muted-foreground">Case ID: {result.id}</p>
                  </div>
                  <Badge variant={result.classification === "Benign" ? "success" : "destructive"}>
                    {result.classification} ({result.confidence}%)
                  </Badge>
                  <Badge variant="secondary">
                    {result.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleExportReport(result)}>
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleStatusChange(result.id, 'Reviewed')}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(result.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{result.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{result.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{result.doctorName}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Location: </span>
                  {result.tumorLocation}
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Clinical Notes:</h4>
                <p className="text-sm text-muted-foreground">{result.notes}</p>
              </div>
            </Card>
          ))}

          {filteredResults.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No results found</p>
              <p className="text-sm mt-2">Run an AI analysis from the dashboard to generate results</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
