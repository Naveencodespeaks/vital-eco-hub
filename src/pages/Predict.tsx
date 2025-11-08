import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Car, Droplets, Zap, TrendingUp, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Layout from "@/components/Layout";

const Predict = () => {
  const [trafficData, setTrafficData] = useState("");
  const [waterData, setWaterData] = useState("");
  const [electricityData, setElectricityData] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: metricsData } = await supabase
      .from('metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(30);

    if (metricsData) setMetrics(metricsData);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call the predict edge function with all three parameters
      const { data, error } = await supabase.functions.invoke('predict', {
        body: {
          energy_usage: parseFloat(electricityData),
          water_usage: parseFloat(waterData),
          traffic_data: parseFloat(trafficData)
        }
      });

      if (error) throw error;

      setPredictions(data);

      toast({
        title: "Prediction complete!",
        description: `Predicted saving: ${data.predicted_saving}%`,
      });

      setTrafficData("");
      setWaterData("");
      setElectricityData("");
    } catch (error: any) {
      toast({
        title: "Prediction failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = metrics.slice(0, 7).reverse().map((m) => ({
    time: new Date(m.timestamp).toLocaleDateString(),
    energy: m.energy_usage,
    water: m.water_usage,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Predictions</h1>
          <p className="text-muted-foreground">Predict traffic, water, and electricity usage patterns</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Traffic Prediction</CardTitle>
              <Car className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictions?.traffic_prediction || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Vehicles per hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Water Prediction</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictions?.water_prediction || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Liters per day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Electricity Prediction</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {predictions?.electricity_prediction || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">kWh per day</p>
            </CardContent>
          </Card>
        </div>

        {/* Historical Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historical Usage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} name="Energy (kWh)" />
                  <Line type="monotone" dataKey="water" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Water (L)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Prediction Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Run AI Prediction</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Input current data to get AI-powered predictions for future usage
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="traffic">Traffic Data (vehicles/hour)</Label>
                  <Input
                    id="traffic"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 120"
                    value={trafficData}
                    onChange={(e) => setTrafficData(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water">Water Usage (Liters)</Label>
                  <Input
                    id="water"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={waterData}
                    onChange={(e) => setWaterData(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electricity">Electricity Usage (kWh)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150"
                    value={electricityData}
                    onChange={(e) => setElectricityData(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "Analyzing..." : "Get AI Predictions"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {predictions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Analysis</h3>
                <p className="text-muted-foreground">{predictions.ai_insight}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Predicted Saving</h4>
                  <div className="text-2xl font-bold text-primary">{predictions.predicted_saving}%</div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Risk Level</h4>
                  <div className={`text-lg font-semibold ${
                    predictions.risk_level === 'low' ? 'text-green-500' :
                    predictions.risk_level === 'medium' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {predictions.risk_level?.toUpperCase()}
                  </div>
                </div>
              </div>
              {predictions.tips && (
                <div>
                  <h4 className="font-medium mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {predictions.tips.map((tip: string, index: number) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Predict;
