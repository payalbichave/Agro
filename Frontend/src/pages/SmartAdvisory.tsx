import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Lightbulb, RefreshCw, AlertTriangle, CheckCircle2, Loader2, ArrowRight, CalendarPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Diagnosis {
  _id: string;
  plant: string;
  disease: string;
  confidence: number;
  severity: string;
  scannedAt: string;
  recommendations: string[];
  treatment_plan?: { action: string; days_later: number }[];
  symptoms: string[];
}

export default function SmartAdvisory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("http://localhost:5000/api/diagnosis", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  const handleScheduleActionPlan = async (diagnosis: Diagnosis) => {
    if (!user) return;
    setScheduling(diagnosis._id);
    try {
      const token = await user.getIdToken();
      // Use specialized treatment plan if available, otherwise fallback to simple index steps
      const hasPlan = diagnosis.treatment_plan && diagnosis.treatment_plan.length > 0;

      const taskPromises = hasPlan
        ? diagnosis.treatment_plan!.map((step, index) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (step.days_later || 0)); // Use specific days_later

          return fetch("http://localhost:5000/api/tasks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              title: `Step ${index + 1}: ${step.action} (${diagnosis.plant})`,
              type: "treatment",
              priority: index === 0 ? "High" : "Medium",
              dueDate: dueDate,
              relatedDiagnosis: diagnosis._id
            })
          });
        })
        : diagnosis.recommendations.slice(0, 3).map((rec, index) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + index);

          return fetch("http://localhost:5000/api/tasks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              title: `Step ${index + 1}: ${rec} (${diagnosis.plant})`,
              type: "treatment",
              priority: index === 0 ? "High" : "Medium",
              dueDate: dueDate,
              relatedDiagnosis: diagnosis._id
            })
          });
        });

      await Promise.all(taskPromises);

      toast.success("Action plan scheduled!");
      navigate("/scheduler");

    } catch (error) {
      toast.error("Error scheduling tasks");
    } finally {
      setScheduling(null);
    }
  };

  // Filter for diseased plants (latest first)
  const activeIssues = history.filter(h => !h.disease.toLowerCase().includes("healthy"));

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Smart Advisory</h1>
          <p className="text-muted-foreground">
            AI-powered recommendations based on your field scans
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4" />
          Refresh Logic
        </Button>
      </div>

      {/* Priority Recommendations */}
      <Card className="border-l-4 border-l-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            High Priority Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeIssues.length > 0 ? (
            activeIssues.slice(0, 3).map((issue) => (
              <div key={issue._id} className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      Treat {issue.plant} for {issue.disease}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Detected on {new Date(issue.scannedAt).toLocaleDateString()}. Severity: {issue.severity || 'High Risk'}.
                    </p>
                  </div>
                  <Badge variant="destructive">Urgent</Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-foreground">Reasoning:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Visual diagnosis confirmed {issue.disease} with {issue.confidence}% confidence</li>
                    {issue.symptoms?.slice(0, 1).map((s, i) => <li key={i}>{s}</li>)}
                    <li>Immediate action prevents spread to nearby {issue.plant}</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Recommended Treatment:</span>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/vision">
                      <Button variant="ghost" size="sm">View Report</Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      disabled={scheduling === issue._id}
                      onClick={() => handleScheduleActionPlan(issue)}
                    >
                      {scheduling === issue._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                      Schedule Action Plan
                    </Button>
                  </div>
                </div>
                <div className="mt-2 bg-white/50 p-3 rounded text-sm text-foreground">
                  <p className="font-medium mb-1 text-muted-foreground">Actionable Steps:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {issue.recommendations && issue.recommendations.length > 0
                      ? issue.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))
                      : <li>Consult a local agri-expert for specific advice.</li>
                    }
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground">No Critical Issues</h3>
              <p>Your recent scans show healthy plants. Keep up the good work!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Recommendations (Static fallback for now + dynamic mix) */}
      <Card className="border-l-4 border-l-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            General Field Advice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Optimize Irrigation Schedule
                </h3>
                <p className="text-sm text-muted-foreground">
                  Check soil moisture before watering. Over-watering can lead to fungal diseases like Root Rot.
                </p>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Regular Scouting
                </h3>
                <p className="text-sm text-muted-foreground">
                  Perform visual inspections weekly. Early detection of pests/diseases saves 40% in treatment costs.
                </p>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Last scan: {history.length > 0 ? new Date(history[0].scannedAt).toLocaleDateString() : "Never"}</span>
              <Link to="/vision">
                <Button variant="outline" size="sm" className="gap-2">
                  Start New Scan <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
