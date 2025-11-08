import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, Leaf, Zap, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface ImpactData {
  id: string;
  sustainability_score: number;
  vastu_rating: number;
  energy_insights: string;
  green_features: any;
  plot_size: number;
  created_at: string;
}

const Impact = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const designId = searchParams.get('design_id');
  
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImpactData = async () => {
      if (!designId) {
        setLoading(false);
        return;
      }

      const { data: blueprint, error } = await supabase
        .from('blueprints')
        .select('*')
        .eq('id', designId)
        .single();

      if (error) {
        console.error('Error fetching impact data:', error);
      } else {
        setData(blueprint);
      }
      setLoading(false);
    };

    fetchImpactData();
  }, [designId]);

  // Calculate estimated savings based on sustainability score and plot size
  const calculateSavings = () => {
    if (!data) return { co2: 0, water: 0, energy: 0 };
    
    const baseMultiplier = data.plot_size / 1000;
    const scoreMultiplier = data.sustainability_score / 100;
    
    return {
      co2: Math.round(1200 * baseMultiplier * scoreMultiplier),
      water: Math.round(25000 * baseMultiplier * scoreMultiplier),
      energy: Math.round(3500 * baseMultiplier * scoreMultiplier),
    };
  };

  const savings = calculateSavings();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/house-planning')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to House Planning
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              Sustainability Impact Report
            </h1>
            <p className="text-muted-foreground">
              Quantified environmental benefits of your eco-friendly house design
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading impact data...</p>
              </CardContent>
            </Card>
          ) : !data ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Leaf className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  No design data found. Generate a house plan first.
                </p>
                <Button onClick={() => navigate('/house-planning')}>
                  Go to House Planning
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Leaf className="h-5 w-5 text-primary" />
                      CO₂ Saved
                    </CardTitle>
                    <CardDescription>Annual carbon offset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {savings.co2.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">kg/year</div>
                    <Progress value={data.sustainability_score} className="mt-4" />
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Droplets className="h-5 w-5 text-primary" />
                      Water Saved
                    </CardTitle>
                    <CardDescription>Annual water conservation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {savings.water.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">liters/year</div>
                    <Progress value={data.sustainability_score} className="mt-4" />
                  </CardContent>
                </Card>

                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-primary" />
                      Energy Efficiency
                    </CardTitle>
                    <CardDescription>Annual energy savings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {savings.energy.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">kWh/year</div>
                    <Progress value={data.sustainability_score} className="mt-4" />
                  </CardContent>
                </Card>
              </div>

              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Sustainability Index</CardTitle>
                  <CardDescription>Combined eco-efficiency rating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Eco Index</span>
                      <span className="text-sm font-bold text-primary">
                        {data.sustainability_score}/100
                      </span>
                    </div>
                    <Progress value={data.sustainability_score} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Vastu Compliance</span>
                      <span className="text-sm font-bold text-primary">
                        {data.vastu_rating}/10
                      </span>
                    </div>
                    <Progress value={(data.vastu_rating / 10) * 100} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Green Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Green Features Implemented</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.green_features && data.green_features.length > 0 ? (
                      data.green_features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No specific features selected</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Energy Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Energy Efficiency Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {data.energy_insights}
                  </p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button onClick={() => navigate('/house-planning')} variant="outline">
                  Modify Design
                </Button>
                <Button onClick={() => navigate('/design')}>
                  Start New Design
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Impact;
