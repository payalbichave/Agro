import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Diagnosis {
  _id: string;
  plant: string;
  disease: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  recommendations: string[];
  treatment_plan?: { action: string; days_later: number }[];
  scannedAt: string;
}

export default function VisionDiagnosis() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string[] | null>(null);
  // kept selectedFile for compatibility with existing check, but will use selectedFiles
  const selectedFile = selectedFiles.length > 0 ? selectedFiles[0] : null;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch History on Mount
  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
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
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(0, 3); // Max 3
      setSelectedFiles(files);

      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrl(urls);
      setResult(null); // Clear previous result
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !user) return;

    setLoading(true);
    try {
      // 1. Send to ML Service
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file); // Note: key is 'files' now, matching Backend List<UploadFile>
      });

      const mlRes = await fetch("http://localhost:5001/predict-disease", {
        method: "POST",
        body: formData,
      });

      if (!mlRes.ok) throw new Error("ML Service failed to analyze image");

      const mlData = await mlRes.json();

      // 2. Save Result to Backend (MongoDB)
      const token = await user.getIdToken();
      const saveRes = await fetch("http://localhost:5000/api/diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plant: mlData.plant,
          disease: mlData.disease,
          confidence: mlData.confidence,
          severity: mlData.severity,
          symptoms: mlData.symptoms,
          recommendations: mlData.recommendations,
          treatment_plan: mlData.treatment_plan
        })
      });

      if (!saveRes.ok) throw new Error("Failed to save diagnosis record");

      const savedRecord = await saveRes.json();

      // 3. Update UI
      setResult(savedRecord);
      setHistory([savedRecord, ...history]); // Add to history instantly
      toast({ title: "Analysis Complete", description: `Detected: ${mlData.disease}` });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedFiles([]);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Derived Stats
  const totalScans = history.length;
  const diseaseCount = history.filter(h => h.disease.toLowerCase() !== "healthy").length;
  const healthyCount = totalScans - diseaseCount;
  const avgConfidence = totalScans > 0
    ? Math.round(history.reduce((acc, curr) => acc + curr.confidence, 0) / totalScans)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Vision & Diagnosis</h1>
        <p className="text-muted-foreground">
          Upload plant images for AI-powered disease detection.
        </p>
      </div>

      {/* Upload & Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left: Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              New Multi-Scan
            </CardTitle>
            <CardDescription>Upload up to 3 images of the same plant for better accuracy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                }`}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {/* We are reusing selectedFile/previewUrl state slightly differently now. 
                           To keep it simple without full refactor, we usually store arrays.
                           But here I assume I will refactor the state management below this replacement.
                           For now, let's visualize assuming 'previewUrl' is actually just one, 
                           BUT I will replace the state definition next. 
                           
                           Wait, I should replace the whole file content related to state first or do it all in one go.
                           Doing it all in one go is safer.
                           
                           Refactoring to show multiple images:
                        */}
                    {/* This block expects 'previewUrls' array which I will add in state */}
                    {/* @ts-ignore */}
                    {previewUrl && Array.isArray(previewUrl) ? previewUrl.map((url, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover rounded-md shadow-sm" />
                      </div>
                    )) : (
                      // Fallback for single image existing state
                      <div className="relative">
                        <img src={previewUrl as string} alt="Preview" className="max-h-64 mx-auto rounded-md shadow-sm" />
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full mt-2"
                    onClick={resetSelection}
                  >
                    Remove All
                  </Button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer py-8">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Click to Upload Images
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select 1-3 images (JPG/PNG). Different angles recommended.
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && !result && (
              <Button onClick={handleUpload} disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Analyzing Images..." : "Analyze Plant"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Right: Analysis Result */}
        {result ? (
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{result.plant}</CardTitle>
                  <CardDescription>Analysis Result</CardDescription>
                </div>
                <Badge variant={result.disease.toLowerCase().includes("healthy") ? "default" : "destructive"}>
                  {result.disease}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-semibold">{result.confidence}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Severity</p>
                  <p className="font-semibold capitalize">{result.severity || "N/A"}</p>
                </div>
              </div>

              {result.symptoms && result.symptoms.length > 0 && (
                <div>
                  <p className="font-semibold mb-2 text-sm">Symptoms:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {result.symptoms.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-semibold mb-2 text-sm">Recommendation:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {result.recommendations.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={resetSelection}>
                <RefreshCw className="mr-2 h-4 w-4" /> Scan Another
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-6 text-muted-foreground bg-muted/20 border-dashed">
            <div className="text-center">
              <p>Upload an image to see the diagnosis here.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Scans</p>
            <p className="text-3xl font-bold">{totalScans}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Diseases Detected</p>
            <p className="text-3xl font-bold text-destructive">{diseaseCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Healthy Scans</p>
            <p className="text-3xl font-bold text-success">{healthyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Avg. Confidence</p>
            <p className="text-3xl font-bold">{avgConfidence}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent History List */}
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Your recent field scans</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No scans yet. Try uploading an image above!
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${item.disease.toLowerCase().includes('healthy') ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {item.disease.toLowerCase().includes('healthy') ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.plant} - {item.disease}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.scannedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.confidence}% Confidence</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{item.severity || "Normal"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
