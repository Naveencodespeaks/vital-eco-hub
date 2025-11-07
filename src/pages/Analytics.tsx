import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Layout from "@/components/Layout";

const Analytics = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [goals, setGoals] = useState<any>(null);
  const [ecoScore, setEcoScore] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: metricsData } = await supabase
      .from('metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(30);

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (metricsData) {
      setMetrics(metricsData);
      calculateEcoScore(metricsData);
    }
    if (goalsData) setGoals(goalsData);
  };

  const calculateEcoScore = (data: any[]) => {
    if (data.length < 2) {
      setEcoScore(50);
      return;
    }

    const recent = data.slice(0, 7);
    const avgEnergy = recent.reduce((sum, m) => sum + m.energy_usage, 0) / recent.length;
    const avgWater = recent.reduce((sum, m) => sum + m.water_usage, 0) / recent.length;

    // Simple scoring: lower usage = higher score
    const energyScore = Math.max(0, 100 - (avgEnergy / 10));
    const waterScore = Math.max(0, 100 - (avgWater / 50));
    const score = Math.round((energyScore + waterScore) / 2);
    
    setEcoScore(Math.min(100, Math.max(0, score)));
  };

  const chartData = metrics.slice(0, 14).reverse().map((m) => ({
    date: new Date(m.timestamp).toLocaleDateString(),
    energy: m.energy_usage,
    water: m.water_usage,
    co2: m.co2_emission,
  }));

  const energyProgress = goals && metrics.length > 0
    ? Math.min(100, ((metrics[0].energy_usage / goals.target_energy_saving) * 100))
    : 0;

  const waterProgress = goals && metrics.length > 0
    ? Math.min(100, ((metrics[0].water_usage / goals.target_water_saving) * 100))
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your sustainability metrics</p>
        </div>

        {/* EcoScore */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>EcoScore</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-2">{ecoScore}</div>
                  <p className="text-sm text-muted-foreground">out of 100</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {ecoScore >= 80 ? "Excellent!" : ecoScore >= 60 ? "Good progress" : "Room for improvement"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Goal Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {goals ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Energy Target</span>
                      <span className="font-semibold">{energyProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={energyProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Target: {goals.target_energy_saving} kWh
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Water Target</span>
                      <span className="font-semibold">{waterProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={waterProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Target: {goals.target_water_saving} L
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No goals set yet. Set your targets in Settings!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Combined Metrics Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends (14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="energy" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Energy (kWh)" />
                <Area type="monotone" dataKey="water" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Water (L)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CO2 Emissions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Emissions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="co2" stroke="#6b7280" strokeWidth={2} name="CO₂ (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;