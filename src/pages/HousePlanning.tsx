import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home, Compass, Building, Leaf, ArrowLeft, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlueprintResult {
  id: string;
  blueprint_image_url: string | null;
  energy_insights: string;
  sustainability_score: number;
  vastu_rating: number;
  ai_analysis: string;
}

const HousePlanning = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  
  const [plotSize, setPlotSize] = useState("");
  const [plotUnit, setPlotUnit] = useState("sqft");
  const [facing, setFacing] = useState("");
  const [numFloors, setNumFloors] = useState("1");
  const [numRooms, setNumRooms] = useState("");
  const [greenFeatures, setGreenFeatures] = useState<string[]>([]);

  const features = [
    { id: 'solar', label: 'Solar Panels' },
    { id: 'rainwater', label: 'Rainwater Harvesting' },
    { id: 'natural_ventilation', label: 'Natural Ventilation' },
    { id: 'green_roof', label: 'Green Roof' },
    { id: 'energy_efficient', label: 'Energy Efficient Windows' },
  ];

  const handleFeatureToggle = (featureId: string) => {
    setGreenFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleGenerate = async () => {
    if (!plotSize || !facing || !numRooms) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate_blueprint', {
        body: {
          plotSize: parseFloat(plotSize),
          plotUnit,
          facing,
          numFloors: parseInt(numFloors),
          numRooms: parseInt(numRooms),
          greenFeatures,
        }
      });

      if (error) throw error;

      setResult(data.blueprint);
      toast({
        title: "House Plan Generated!",
        description: "Your sustainable Vastu-compliant house plan is ready.",
      });
      
      // Navigate to impact page after successful generation
      setTimeout(() => {
        navigate(`/impact?design_id=${data.blueprint.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error generating house plan:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate house plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Home className="h-8 w-8 text-primary" />
              Sustainable House Planning
            </h1>
            <p className="text-muted-foreground">
              Generate AI-powered, Vastu-compliant house plans with sustainability insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Design Parameters</CardTitle>
                <CardDescription>Enter your house specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plotSize">Plot Size *</Label>
                    <Input
                      id="plotSize"
                      type="number"
                      placeholder="2000"
                      value={plotSize}
                      onChange={(e) => setPlotSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plotUnit">Unit</Label>
                    <Select value={plotUnit} onValueChange={setPlotUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sqft">Square Feet</SelectItem>
                        <SelectItem value="sqm">Square Meters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facing" className="flex items-center gap-2">
                    <Compass className="h-4 w-4" />
                    Facing Direction *
                  </Label>
                  <Select value={facing} onValueChange={setFacing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="East">East (Prosperity)</SelectItem>
                      <SelectItem value="West">West (Evening Sun)</SelectItem>
                      <SelectItem value="North">North (Wealth)</SelectItem>
                      <SelectItem value="South">South (Stability)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="floors" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Floors
                    </Label>
                    <Select value={numFloors} onValueChange={setNumFloors}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Floor</SelectItem>
                        <SelectItem value="2">2 Floors</SelectItem>
                        <SelectItem value="3">3 Floors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rooms">Number of Rooms *</Label>
                    <Input
                      id="rooms"
                      type="number"
                      placeholder="4"
                      value={numRooms}
                      onChange={(e) => setNumRooms(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-primary" />
                    Green Features
                  </Label>
                  {features.map((feature) => (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={feature.id}
                        checked={greenFeatures.includes(feature.id)}
                        onCheckedChange={() => handleFeatureToggle(feature.id)}
                      />
                      <Label
                        htmlFor={feature.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {feature.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating House Plan...
                    </>
                  ) : (
                    'Generate House Plan'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {result && (
                <>
                  {result.blueprint_image_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Generated House Plan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <img
                          src={result.blueprint_image_url}
                          alt="Generated House Plan"
                          className="w-full rounded-lg border"
                        />
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Sustainability Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Eco Index</span>
                          <span className="text-sm font-bold text-primary">
                            {result.sustainability_score}/100
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${result.sustainability_score}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Vastu Compliance</span>
                          <span className="text-sm font-bold text-primary">
                            {result.vastu_rating}/10
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${(result.vastu_rating / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Energy Efficiency Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {result.energy_insights}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-primary/30">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <TrendingUp className="h-12 w-12 text-primary mb-3" />
                      <h3 className="font-semibold mb-2">View Full Impact Report</h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        See detailed carbon savings, water efficiency, and energy metrics
                      </p>
                      <Button onClick={() => navigate(`/impact?design_id=${result.id}`)}>
                        View Impact Report
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {!result && !loading && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Home className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Fill in the parameters and click Generate to see your house plan
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HousePlanning;
