import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Activity, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const classificationData = [
  { month: "Jan", benign: 45, malignant: 12 },
  { month: "Feb", benign: 52, malignant: 8 },
  { month: "Mar", benign: 38, malignant: 15 },
  { month: "Apr", benign: 61, malignant: 11 },
  { month: "May", benign: 49, malignant: 9 },
  { month: "Jun", benign: 56, malignant: 13 }
];

const accuracyData = [
  { month: "Jan", accuracy: 94.2 },
  { month: "Feb", accuracy: 95.8 },
  { month: "Mar", accuracy: 93.1 },
  { month: "Apr", accuracy: 96.7 },
  { month: "May", accuracy: 95.3 },
  { month: "Jun", accuracy: 97.1 }
];

const pieData = [
  { name: "Benign", value: 301, color: "#10b981" },
  { name: "Malignant", value: 68, color: "#ef4444" }
];

const COLORS = ["#10b981", "#ef4444"];

export const Insights = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-xl shadow-dark">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-6">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:shadow-glow">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              System Insights & Analytics
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/20 rounded-lg">
                <Target className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Biopsies</p>
                <p className="text-2xl font-bold">369</p>
                <p className="text-xs text-success">+12% from last month</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                <p className="text-2xl font-bold">97.1%</p>
                <p className="text-xs text-success">+1.8% improvement</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/20 rounded-lg">
                <Activity className="w-8 h-8 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Confidence</p>
                <p className="text-2xl font-bold">94.3%</p>
                <p className="text-xs text-muted-foreground">Stable</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-lg">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Doctors</p>
                <p className="text-2xl font-bold">15</p>
                <p className="text-xs text-success">+3 new users</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Classification Trends */}
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6">Classification Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classificationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="benign" fill="#10b981" name="Benign" />
                <Bar dataKey="malignant" fill="#ef4444" name="Malignant" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Accuracy Over Time */}
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6">Model Accuracy Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[90, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Distribution and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Classification Distribution */}
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6">Classification Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity Summary */}
          <Card className="glass-card p-6 lg:col-span-2">
            <h3 className="text-xl font-bold mb-6">System Performance Summary</h3>
            <div className="space-y-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-semibold text-success mb-2">Excellent Performance</h4>
                <p className="text-sm text-muted-foreground">
                  The AI model has achieved 97.1% accuracy this month, exceeding the target of 95%. 
                  The system has successfully processed 369 biopsies with consistent high confidence rates.
                </p>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-semibold text-primary mb-2">Key Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Benign classifications represent 81.6% of total cases</li>
                  <li>• Average processing time: 3.2 seconds per biopsy</li>
                  <li>• Zero system downtime in the past 30 days</li>
                  <li>• 15 active medical professionals using the platform</li>
                </ul>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-semibold text-accent mb-2">Recommendations</h4>
                <p className="text-sm text-muted-foreground">
                  Continue monitoring model performance and consider expanding the training dataset 
                  for improved accuracy in edge cases. Regular calibration checks are recommended.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};