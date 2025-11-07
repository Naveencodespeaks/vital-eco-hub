import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, Droplets, Cloud, TrendingDown, Sparkles } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Layout from "@/components/Layout";

const Dashboard = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [energyUsage, setEnergyUsage] = useState("");
  const [waterUsage, setWaterUsage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('metrics-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'metrics' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: metricsData } = await supabase
      .from('metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    const { data: reportsData } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (metricsData) setMetrics(metricsData);
    if (reportsData) setReports(reportsData);
  };

  const handleRunPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call the predict edge function
      const { data, error } = await supabase.functions.invoke('predict', {
        body: {
          energy_usage: parseFloat(energyUsage),
          water_usage: parseFloat(waterUsage)
        }
      });

      if (error) throw error;

      // Save metrics
      const co2 = parseFloat(energyUsage) * 0.5; // Simple calculation
      await supabase.from('metrics').insert({
        user_id: user.id,
        energy_usage: parseFloat(energyUsage),
        water_usage: parseFloat(waterUsage),
        co2_emission: co2
      });

      // Save report
      await supabase.from('reports').insert({
        user_id: user.id,
        ai_insight: data.ai_insight,
        predicted_saving: data.predicted_saving
      });

      toast({
        title: "Prediction complete!",
        description: `Predicted saving: ${data.predicted_saving}%`,
      });

      setEnergyUsage("");
      setWaterUsage("");
      fetchData();
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

  const latestMetric = metrics[0];
  const carbonSavedToday = reports[0]?.predicted_saving || 0;

  const chartData = metrics.slice(0, 7).reverse().map((m) => ({
    time: new Date(m.timestamp).toLocaleDateString(),
    energy: m.energy_usage,
  }));

  const savingsData = reports.slice(0, 5).reverse().map((r) => ({
    date: new Date(r.created_at).toLocaleDateString(),
    saving: r.predicted_saving,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your energy and water usage in real-time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Energy Usage</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric?.energy_usage || 0} kWh</div>
              <p className="text-xs text-muted-foreground mt-1">Latest reading</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Water Usage</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric?.water_usage || 0} L</div>
              <p className="text-xs text-muted-foreground mt-1">Latest reading</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CO₂ Emissions</CardTitle>
              <Cloud className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric?.co2_emission.toFixed(2) || 0} kg</div>
              <p className="text-xs text-muted-foreground mt-1">Carbon footprint</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Predicted Saving</CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carbonSavedToday.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Latest prediction</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Energy Usage Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Predicted Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="saving" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Run AI Prediction</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRunPrediction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="energy">Energy Usage (kWh)</Label>
                  <Input
                    id="energy"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150"
                    value={energyUsage}
                    onChange={(e) => setEnergyUsage(e.target.value)}
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
                    value={waterUsage}
                    onChange={(e) => setWaterUsage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "Analyzing..." : "Get AI Insights"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;