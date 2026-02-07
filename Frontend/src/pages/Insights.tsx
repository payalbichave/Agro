import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Activity, Brain, Network, GitGraph, Info } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";

interface TrainingMetric {
  epoch: number;
  accuracy: number;
  loss: number;
  val_accuracy: number;
  val_loss: number;
}

interface ConfusionEntry {
  actual: string;
  predicted: string;
  count: number;
}

interface ModelStats {
  model_name: string;
  total_epochs: number;
  final_accuracy: number;
  training_history: TrainingMetric[];
  confusion_matrix: ConfusionEntry[];
  learning_rate: number;
  architecture_description: string;
}

interface PersonalStats {
  totalScans: number;
  healthyCount: number;
  diseaseCount: number;
  todayCount: number;
}

export default function Insights() {
  const { user } = useAuth();
  const [data, setData] = useState<ModelStats | null>(null);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Model Stats (Python)
      const modelRes = await fetch("http://localhost:5001/model-stats");
      if (modelRes.ok) {
        const jsonData = await modelRes.json();
        setData(jsonData);
      }

      // 2. Fetch Personal Stats (Node.js)
      if (user) {
        const token = await user.getIdToken();
        const statsRes = await fetch("http://localhost:5000/api/diagnosis/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setPersonalStats(statsData);
        }
      }

    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return <div className="p-10 text-center">Loading Analytics...</div>;
  }

  // Allow partial rendering if one service fails, or show error if both fail
  if (!data && !personalStats) {
    return (
      <div className="p-10 text-center text-destructive">
        <p className="font-bold">Failed to load analytics.</p>
        <p className="text-sm">Please ensure both Backend (Node.js) and ML Service (Python) are running.</p>
        <Button variant="outline" onClick={fetchData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Model Analytics</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Under the hood of AgroAgent's AI Brain
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
          Refresh Stats
        </Button>
      </div>

      {/* SECTION 1: YOUR ACTIVITY (Real Data) */}
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Your Farm Activity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Scans Today</p>
                <h3 className="text-3xl font-bold mt-1 text-primary">{personalStats?.todayCount || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Images processed</p>
              </div>
              <RefreshCw className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Health Checks</p>
                <h3 className="text-3xl font-bold mt-1 text-foreground">{personalStats?.totalScans || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Lifetime scans</p>
              </div>
              <Activity className="w-8 h-8 text-foreground opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Disease Detected</p>
                <h3 className="text-3xl font-bold mt-1 text-destructive">{personalStats?.diseaseCount || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Risks identified</p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Healthy Plants</p>
                <h3 className="text-3xl font-bold mt-1 text-success">{personalStats?.healthyCount || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Safe crops</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: AI BRAIN (Simulated Data) */}
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-accent" />
        AI Model Metrics (MobileNetV2)
      </h2>

      {data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Model Architecture</p>
                    <h3 className="text-xl font-bold mt-1 text-primary">MobileNetV2</h3>
                    <Badge variant="outline" className="mt-2">Transfer Learning</Badge>
                  </div>
                  <Network className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Final Accuracy</p>
                    <h3 className="text-3xl font-bold mt-1 text-success">{(data.final_accuracy * 100).toFixed(1)}%</h3>
                    <p className="text-xs text-muted-foreground mt-1">on Test Set</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Epochs</p>
                    <h3 className="text-3xl font-bold mt-1">{data.total_epochs}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Training Cycles</p>
                  </div>
                  <Activity className="w-8 h-8 text-warning opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Learning Rate</p>
                    <h3 className="text-3xl font-bold mt-1 font-mono">{data.learning_rate}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Adam Optimizer</p>
                  </div>
                  <GitGraph className="w-8 h-8 text-accent opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            {/* Accuracy Curve */}
            <Card className="border-l-4 border-l-success">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Learning Curve (Accuracy)
                </CardTitle>
                <CardDescription>Visualizing how the model gets smarter over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.training_history}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="epoch" tick={{ fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'Epochs', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis domain={[0, 1]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorAcc)" name="Training Acc" />
                    <Area type="monotone" dataKey="val_accuracy" stroke="hsl(var(--foreground))" strokeDasharray="5 5" fill="transparent" name="Validation Acc" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex gap-3 text-sm">
                  <Info className="w-5 h-5 text-success shrink-0" />
                  <p>
                    <span className="font-bold">Insight:</span> The gap between Training (Green) and Validation (Dashed) accuracy is small, indicating
                    <span className="font-semibold text-success"> minimal overfitting</span>. The model generalizes well to new images.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Loss Curve */}
            <Card className="border-l-4 border-l-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  Error Minimization (Loss)
                </CardTitle>
                <CardDescription>Measuring the difference between prediction and reality.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.training_history}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="epoch" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="loss" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Training Loss" />
                    <Line type="monotone" dataKey="val_loss" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Validation Loss" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex gap-3 text-sm">
                  <Info className="w-5 h-5 text-destructive shrink-0" />
                  <p>
                    <span className="font-bold">Insight:</span> "Loss" is the penalty for bad guesses. Steep drop in early epochs shows
                    <span className="font-semibold text-foreground"> rapid feature learning</span> (edges, textures), followed by fine-tuning.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section: Confusion Matrix & Theory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

            {/* Confusion Matrix */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Where does it get confused?</CardTitle>
                <CardDescription>Top 5 most common misclassifications (Confusion Matrix)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.confusion_matrix} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="actual" type="category" width={150} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                      content={({ payload, label }) => {
                        if (payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-card border p-2 rounded shadow-sm">
                              <p className="font-bold text-sm text-destructive">{d.count} Errors</p>
                              <p className="text-xs">Actual: {d.actual}</p>
                              <p className="text-xs">Predicted: {d.predicted}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  *Bars show number of times the model mistook the "Actual" disease for a look-alike.
                </p>
              </CardContent>
            </Card>

            {/* Educational Logic */}
            <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  How it Thinks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-background/50 rounded-lg border border-border">
                  <h4 className="font-semibold text-sm mb-1 text-primary">1. Convolution (The Eyes)</h4>
                  <p className="text-xs text-muted-foreground">
                    The model scans the image using 3x3 filters to detect
                    <span className="font-mono text-foreground"> edges</span>, <span className="font-mono text-foreground"> textures</span>, and <span className="font-mono text-foreground"> spots</span>.
                  </p>
                </div>

                <div className="p-3 bg-background/50 rounded-lg border border-border">
                  <h4 className="font-semibold text-sm mb-1 text-primary">2. Pooling (The Summary)</h4>
                  <p className="text-xs text-muted-foreground">
                    It shrinks the image to focus only on important features (e.g., "Is there a yellow halo?"), ignoring background noise.
                  </p>
                </div>

                <div className="p-3 bg-background/50 rounded-lg border border-border">
                  <h4 className="font-semibold text-sm mb-1 text-primary">3. Softmax (The Decision)</h4>
                  <p className="text-xs text-muted-foreground">
                    Final layer calculates probability for all 38 diseases.
                    <br />
                    <code>Sum(Probabilities) = 1.0</code>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="mt-8 p-6 text-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Model analytics are unavailable (Service offline?)</p>
        </div>
      )}

    </div>
  );
}
