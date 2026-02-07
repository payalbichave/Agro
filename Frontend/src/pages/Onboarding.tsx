import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { MapPin, Sprout, Tractor, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/config/firebase";

export default function Onboarding() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        phone: "",
        farmName: "",
        farmArea: "",
        mainCrop: "",
        location: { lat: 0, lng: 0 },
        soilType: "",
        soilN: "",
        soilP: "",
        soilK: ""
    });

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const { refreshUser } = useAuth(); // Put this at the top with other hooks
    const [locationName, setLocationName] = useState("Detecting...");

    // Validation Logic
    const isStep1Valid = formData.name && formData.age && formData.phone;
    const isStep2Valid = formData.farmName && formData.farmArea && formData.mainCrop;
    const isStep3Valid = formData.location.lat !== 0 && formData.location.lng !== 0;
    const isStep4Valid = formData.soilType && formData.soilN && formData.soilP && formData.soilK;

    // Determine if current step is complete
    const canProceed = () => {
        if (step === 1) return isStep1Valid;
        if (step === 2) return isStep2Valid;
        if (step === 3) return isStep3Valid;
        if (step === 4) return isStep4Valid;
        return false;
    };

    const handleLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    setFormData({
                        ...formData,
                        location: { lat: latitude, lng: longitude }
                    });

                    // Reverse Geocoding using OpenStreetMap (Nominatim)
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        const city = data.address.city || data.address.village || data.address.town || "Unknown Location";
                        const state = data.address.state || "";
                        setLocationName(`${city}, ${state}`);
                        toast({ title: "Location Found", description: `Detected: ${city}, ${state}` });
                    } catch (err) {
                        setLocationName("Location detected (Name unavailable)");
                        toast({ title: "Coordinates Found", description: "Could not fetch location name." });
                    } finally {
                        setLoading(false);
                    }
                },
                (error) => {
                    setLoading(false);
                    toast({ title: "Error", description: "Could not fetch location.", variant: "destructive" });
                }
            );
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user");

            const token = await user.getIdToken();

            const res = await fetch("http://localhost:5000/api/auth/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    age: parseInt(formData.age),
                    phone: formData.phone,
                    farmName: formData.farmName,
                    farmArea: parseFloat(formData.farmArea),
                    mainCrop: formData.mainCrop,
                    location: formData.location,
                    soilProfile: {
                        type: formData.soilType,
                        n: parseFloat(formData.soilN),
                        p: parseFloat(formData.soilP),
                        k: parseFloat(formData.soilK)
                    }
                })
            });

            if (!res.ok) throw new Error("Failed to save profile");

            await refreshUser(); // Critical: Update global auth state
            toast({ title: "Profile Complete!", description: "Redirecting to Dashboard..." });
            navigate("/");

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not save profile",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <CardTitle>Let's setup your farm</CardTitle>
                        <span className="text-sm text-muted-foreground">Step {step} of 4</span>
                    </div>
                    <Progress value={(step / 4) * 100} className="h-2" />
                </CardHeader>
                <CardContent className="pt-6">

                    {/* STEP 1: PERSONAL DETAILS */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Sprout className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium">Personal Details</h3>
                                <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Raj Patel" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="35" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: FARM DETAILS */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Tractor className="w-6 h-6 text-accent" />
                                </div>
                                <h3 className="text-lg font-medium">Farm Details</h3>
                                <p className="text-sm text-muted-foreground">About your land and crops</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Farm Name</Label>
                                <Input value={formData.farmName} onChange={(e) => setFormData({ ...formData, farmName: e.target.value })} placeholder="Green Valley Farm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Total Area (Acres)</Label>
                                    <Input type="number" value={formData.farmArea} onChange={(e) => setFormData({ ...formData, farmArea: e.target.value })} placeholder="5" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Main Crop</Label>
                                    <Input value={formData.mainCrop} onChange={(e) => setFormData({ ...formData, mainCrop: e.target.value })} placeholder="Wheat" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: LOCATION */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <MapPin className="w-6 h-6 text-warning" />
                                </div>
                                <h3 className="text-lg font-medium">Location</h3>
                                <p className="text-sm text-muted-foreground">Important for weather forecasts</p>
                            </div>

                            <div className="bg-muted p-6 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                    {formData.location.lat ?
                                        `Selected: ${locationName} (${formData.location.lat.toFixed(4)}, ${formData.location.lng.toFixed(4)})` :
                                        "We need your location to provide accurate weather and advisory."
                                    }
                                </p>
                                <Button onClick={handleLocation} variant="outline" className="gap-2" disabled={loading}>
                                    <MapPin className="w-4 h-4" />
                                    {loading ? "Detecting..." : "Detect My Location"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SOIL HEALTH */}
                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <TestTube className="w-6 h-6 text-destructive" />
                                </div>
                                <h3 className="text-lg font-medium">Soil Health</h3>
                                <p className="text-sm text-muted-foreground">Enter recent test results</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Soil Type</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, soilType: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Soil Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Clay">Clay</SelectItem>
                                        <SelectItem value="Sandy">Sandy</SelectItem>
                                        <SelectItem value="Loamy">Loamy</SelectItem>
                                        <SelectItem value="Silt">Silt</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>N (mg/kg)</Label>
                                    <Input type="number" placeholder="120" value={formData.soilN} onChange={(e) => setFormData({ ...formData, soilN: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>P (mg/kg)</Label>
                                    <Input type="number" placeholder="60" value={formData.soilP} onChange={(e) => setFormData({ ...formData, soilP: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>K (mg/kg)</Label>
                                    <Input type="number" placeholder="40" value={formData.soilK} onChange={(e) => setFormData({ ...formData, soilK: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={prevStep} disabled={step === 1}>Back</Button>
                    {step < 4 ? (
                        <Button onClick={nextStep} disabled={!canProceed()}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading || !canProceed()}>
                            {loading ? "Saving..." : "Complete Setup"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
