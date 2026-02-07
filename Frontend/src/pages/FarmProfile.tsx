import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Droplets, Thermometer, Wind, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/config/firebase";

export default function FarmProfile() {
  const { mongoUser, loading } = useAuth();
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch('http://localhost:5000/api/advisory/general', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.location) {
          setLocationName(data.location);
        }
      } catch (error) {
        console.error("Failed to fetch location name:", error);
      }
    };

    if (mongoUser) {
      fetchLocationName();
    }
  }, [mongoUser]);

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!mongoUser) {
    return <div className="p-10 text-center">Please log in to view farm profile.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Farm Profile</h1>
        <p className="text-muted-foreground">
          Complete information about your farm and agricultural practices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Farm Location & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Farm Name</label>
                <p className="text-lg font-semibold text-foreground mt-1">{mongoUser.farmName || "Not Set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {locationName || (typeof mongoUser.location === 'string' ? mongoUser.location : "Coordinates Set")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Acreage</label>
                <p className="text-lg font-semibold text-foreground mt-1">{mongoUser.farmArea ? `${mongoUser.farmArea} acres` : "Not Set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Main Crop</label>
                <p className="text-lg font-semibold text-foreground mt-1 capitalize">{mongoUser.mainCrop || "Not Set"}</p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold text-foreground mb-4">Active Crops</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground capitalize">{mongoUser.mainCrop || "Wheat"}</p>
                    <p className="text-sm text-muted-foreground">Primary Crop</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{mongoUser.farmArea ? `${mongoUser.farmArea} acres` : "-"}</p>
                    <Badge variant="secondary" className="mt-1">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-accent" />
              Irrigation System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Primary Method</label>
              <p className="text-lg font-semibold text-foreground mt-1">Drip Irrigation</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Water Source</label>
              <p className="text-lg font-semibold text-foreground mt-1">Borewell</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground italic mt-2">
                (Irrigation data is currently default. Go to Settings to update.)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-secondary" />
            Soil Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Soil Type & Composition</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Soil Type</span>
                  <span className="text-sm font-medium text-foreground capitalize">{mongoUser.soilProfile?.type || "Not Set"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Nutrient Levels</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nitrogen (N)</span>
                  <Badge variant="secondary">{mongoUser.soilProfile?.n || "-"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phosphorus (P)</span>
                  <Badge variant="default">{mongoUser.soilProfile?.p || "-"}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Potassium (K)</span>
                  <Badge variant="secondary">{mongoUser.soilProfile?.k || "-"}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
