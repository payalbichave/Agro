import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Leaf,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import farmHero from "@/assets/farm-hero.jpg";

interface Diagnosis {
  _id: string;
  plant: string;
  disease: string;
  confidence: number;
  severity: string;
  scannedAt: string;
  recommendations: string[];
}

export default function Overview() {
  const { mongoUser, user } = useAuth();
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);

  const [marketData, setMarketData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
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
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    async function fetchMarket() {
      if (!mongoUser?.mainCrop) return;

      let locString = "India";
      if (mongoUser?.location) {
        if (typeof mongoUser.location === 'string') {
          locString = mongoUser.location;
        } else if (typeof mongoUser.location === 'object') {
          locString = "Local";
        }
      }

      try {
        const res = await fetch("http://localhost:5001/market-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crop: mongoUser.mainCrop, location: locString })
        });
        if (res.ok) {
          const data = await res.json();
          setMarketData(data);
        }
      } catch (e) {
        console.error("Failed to fetch market data", e);
      }
    }
    if (mongoUser) {
      fetchMarket();
    }
  }, [mongoUser]);

  // Derived Stats
  const totalScans = history.length;
  const recentIssues = history.filter(h => !h.disease.toLowerCase().includes("healthy"));
  const healthyCount = totalScans - recentIssues.length;

  // Get latest 2 issues for Alerts
  const activeAlerts = recentIssues.slice(0, 2);

  // Get latest recommendation
  const latestRec = recentIssues.length > 0 ? recentIssues[0] : null;

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Hero Section */}
      <div className="relative h-48 rounded-2xl overflow-hidden shadow-md">
        <img
          src={farmHero}
          alt="Farm landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-transparent flex items-center">
          <div className="p-8 text-primary-foreground">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {mongoUser?.name?.split(' ')[0] || 'Farmer'}!</h1>
            <p className="text-lg opacity-90 max-w-xl">
              {recentIssues.length > 0
                ? `You have ${recentIssues.length} plants requiring attention today.`
                : "Your farm is looking great! No diseases detected recently."}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalScans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded field inspections
            </p>
          </CardContent>
        </Card>

        {/* Dynamic Weather Card (Still Mocked until Weather API) */}
        <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive flex items-center gap-2">
              {recentIssues.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Plants verified as diseased
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Healthy Plants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{healthyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalScans > 0 ? Math.round((healthyCount / totalScans) * 100) : 0}% health rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Market Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketData ? (
              <>
                <div className="text-3xl font-bold text-foreground">{marketData.trend}</div>
                <p className={`text-xs mt-1 flex items-center gap-1 ${marketData.trend === 'Bullish' ? 'text-success' : 'text-destructive'}`}>
                  {marketData.trend === 'Bullish' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                  {marketData.trend_description}
                </p>
              </>
            ) : (
              <div className="flex animate-pulse flex-col gap-2">
                <div className="h-8 w-24 bg-muted rounded"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Recent Diagnosis Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <div key={alert._id} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">
                      {alert.disease} Detected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Found in {alert.plant}. Severity: {alert.severity || 'Moderate'}.
                    </p>
                    <Link to="/vision">
                      <Button size="sm" variant="destructive" className="mt-2 h-7 text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2 opacity-50" />
                <p>No active disease alerts. Good job!</p>
              </div>
            )}

            <Link to="/vision">
              <Button variant="outline" className="w-full mt-2">View All Scans</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-success" />
              Treatment Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestRec ? (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium text-sm">Treat {latestRec.plant} for {latestRec.disease}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">High Priority</Badge>
                </div>

                <div className="bg-muted/50 p-4 rounded-md border text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    {latestRec.recommendations?.slice(0, 3).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2 mt-2 pl-4">
                  <Badge variant="secondary" className="text-xs">Based on latest scan</Badge>
                  <span className="text-xs text-muted-foreground">Confidence: {latestRec.confidence}%</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No treatments needed right now.</p>
                <p className="text-xs mt-1">Upload a plant image to get instant advice.</p>
              </div>
            )}

            <Button className="w-full mt-4" variant="default" disabled={!latestRec}>
              View Full Guide
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
