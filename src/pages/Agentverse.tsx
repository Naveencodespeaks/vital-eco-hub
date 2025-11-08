import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, Play, Network, TrendingUp, Award, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "@/components/Layout";

export default function Agentverse() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Context inputs
  const [context, setContext] = useState({
    avg_kwh: 250,
    avg_liters: 5000,
    grid_price_rs_per_kwh: 8.5,
    lst_c: 32
  });

  // Current plan data
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [dtRun, setDtRun] = useState<any>(null);
  
  // Historical policies
  const [policies, setPolicies] = useState<any[]>([]);
  
  // Causal edges
  const [edges, setEdges] = useState<any[]>([]);
  
  // User goals
  const [goals, setGoals] = useState<any>(null);
  
  // Points and achievements
  const [ecoPoints, setEcoPoints] = useState<any>(null);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchPolicies();
      fetchEdges();
      fetchGoals();
      fetchEcoPoints();
      fetchAchievements();
    }
  }, [userId]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const fetchPolicies = async () => {
    const { data } = await supabase
      .from('policies')
      .select('*, dt_runs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setPolicies(data);
  };

  const fetchEdges = async () => {
    const { data } = await supabase
      .from('scm_edges')
      .select('*')
      .eq('user_id', userId)
      .order('weight', { ascending: false });
    
    if (data) setEdges(data);
  };

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) setGoals(data);
  };

  const fetchEcoPoints = async () => {
    const { data } = await supabase
      .from('eco_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) setEcoPoints(data);
  };

  const fetchAchievements = async () => {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(3);
    
    if (data) setRecentAchievements(data);
  };

  const handleGeneratePlan = async () => {
    if (!userId) {
      toast.error("Please log in to generate a plan");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcwno_plan', {
        body: { user_id: userId, context }
      });

      if (error) throw error;

      setCurrentPlan(data.policy);
      setDtRun(data.dt_run);
      toast.success("Prescriptive plan generated successfully!");
      fetchPolicies();
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast.error(error.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyPlan = async () => {
    if (!userId || !currentPlan?.id) {
      toast.error("No plan to apply");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcwno_apply', {
        body: { user_id: userId, policy_id: currentPlan.id }
      });

      if (error) throw error;

      toast.success(data.message || "Plan applied successfully!");
      
      // Refresh data after applying plan
      fetchEcoPoints();
      fetchAchievements();
      fetchPolicies();
    } catch (error: any) {
      console.error('Error applying plan:', error);
      toast.error(error.message || "Failed to apply plan");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDiscoverEdges = async () => {
    if (!userId) {
      toast.error("Please log in to discover edges");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pcwno_discover_edges', {
        body: { user_id: userId }
      });

      if (error) throw error;

      toast.success(data.message || "Causal edges discovered successfully!");
      fetchEdges();
    } catch (error: any) {
      console.error('Error discovering edges:', error);
      toast.error(error.message || "Failed to discover edges");
    } finally {
      setLoading(false);
    }
  };

  const goalProgress = goals && dtRun 
    ? Math.min((dtRun.total_kg / goals.target_energy_saving) * 100, 100)
    : 0;

  // Chart data preparation
  const interventionChartData = currentPlan?.interventions?.map((int: any, idx: number) => ({
    name: int.type?.replace(/_/g, ' ').substring(0, 15),
    co2: int.expected_kg || 0,
    water: int.expected_water_kl || 0,
    fill: `hsl(${140 + idx * 40}, 70%, 50%)`
  })) || [];

  const policyTimelineData = policies.slice(0, 5).reverse().map((pol, idx) => ({
    name: `Plan ${idx + 1}`,
    co2Savings: pol.dt_runs?.[0]?.total_kg || 0,
    waterSavings: pol.dt_runs?.[0]?.total_water_kl || 0,
    confidence: (pol.dt_runs?.[0]?.confidence_level || 0) * 100
  }));

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-success-light/20">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 animate-fade-in">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-success via-chart-2 to-chart-3 bg-clip-text text-transparent">
              PCW-NO: Prescriptive Nexus Optimizer
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              AI-powered causal inference for sustainability optimization using digital twin simulation
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left Column: Causal Policy Engine */}
            <Card className="bg-card/80 backdrop-blur-md border-success/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-success" />
                  Causal Policy Engine
                </CardTitle>
                <CardDescription className="text-sm">Input your context to generate a prescriptive plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="avg_kwh" className="text-sm font-medium">Avg kWh</Label>
                    <Input
                      id="avg_kwh"
                      type="number"
                      value={context.avg_kwh}
                      onChange={(e) => setContext({ ...context, avg_kwh: Number(e.target.value) })}
                      className="transition-all focus:ring-2 focus:ring-success"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avg_liters" className="text-sm font-medium">Avg Liters</Label>
                    <Input
                      id="avg_liters"
                      type="number"
                      value={context.avg_liters}
                      onChange={(e) => setContext({ ...context, avg_liters: Number(e.target.value) })}
                      className="transition-all focus:ring-2 focus:ring-success"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grid_price" className="text-sm font-medium">Grid Price (₹/kWh)</Label>
                    <Input
                      id="grid_price"
                      type="number"
                      step="0.1"
                      value={context.grid_price_rs_per_kwh}
                      onChange={(e) => setContext({ ...context, grid_price_rs_per_kwh: Number(e.target.value) })}
                      className="transition-all focus:ring-2 focus:ring-success"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lst" className="text-sm font-medium">LST (°C)</Label>
                    <Input
                      id="lst"
                      type="number"
                      value={context.lst_c}
                      onChange={(e) => setContext({ ...context, lst_c: Number(e.target.value) })}
                      className="transition-all focus:ring-2 focus:ring-success"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGeneratePlan} 
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-success via-chart-2 to-chart-3 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Prescriptive Plan
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {currentPlan && (
                  <div className="space-y-4 p-5 bg-gradient-to-br from-success-light/30 to-success-light/10 rounded-xl border border-success/30 shadow-sm animate-fade-in">
                    <div>
                      <h3 className="font-semibold text-success mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Rationale
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">{currentPlan.rationale}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-success mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Interventions
                      </h3>
                      <div className="space-y-3">
                        {currentPlan.interventions?.map((intervention: any, idx: number) => (
                          <div key={idx} className="p-4 bg-background/80 backdrop-blur rounded-lg border border-success/20 hover:border-success/40 transition-all duration-200 hover:shadow-md">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="font-medium capitalize text-base">{intervention.type?.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-muted-foreground mt-1">⏱️ {intervention.window}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-success">🌱 {intervention.expected_kg} kg CO₂</div>
                                {intervention.expected_water_kl > 0 && (
                                  <div className="text-xs text-info mt-1">💧 {intervention.expected_water_kl} kL H₂O</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

            {/* Right Column: Digital Twin Simulation */}
            <Card className="bg-card/80 backdrop-blur-md border-chart-2/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Play className="h-5 w-5 text-chart-2" />
                  Digital Twin Simulation
                </CardTitle>
                <CardDescription className="text-sm">Simulated outcomes and savings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {dtRun ? (
                  <div className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 bg-gradient-to-br from-success-light/40 to-success-light/20 rounded-xl border border-success/30 shadow-sm hover:shadow-md transition-all">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Total CO₂ Savings</p>
                        <p className="text-3xl font-bold text-success">{dtRun.total_kg} <span className="text-lg">kg</span></p>
                        <p className="text-xs text-success/70 mt-1">🌱 Carbon reduced</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-info-light/40 to-info-light/20 rounded-xl border border-info/30 shadow-sm hover:shadow-md transition-all">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Water Savings</p>
                        <p className="text-3xl font-bold text-info">{dtRun.total_water_kl} <span className="text-lg">kL</span></p>
                        <p className="text-xs text-info/70 mt-1">💧 Water conserved</p>
                      </div>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-chart-5/10 to-chart-5/5 rounded-xl border border-chart-5/30 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Confidence Level</p>
                        <span className="text-sm font-bold text-chart-5">
                          {(dtRun.confidence_level * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={dtRun.confidence_level * 100} className="h-2.5" />
                      <p className="text-xs text-muted-foreground mt-2">AI simulation accuracy</p>
                    </div>

                    {goals && (
                      <div className="p-5 bg-gradient-to-br from-warning-light/40 to-warning-light/20 rounded-xl border border-warning/30 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-muted-foreground">Progress vs Target</p>
                          <span className="text-xs text-muted-foreground">
                            {Math.min(goalProgress, 100).toFixed(0)}% complete
                          </span>
                        </div>
                        <Progress value={goalProgress} className="h-2.5" />
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-warning font-semibold">Current: {dtRun.total_kg} kg</span>
                          <span className="text-muted-foreground">Goal: {goals.target_energy_saving} kg</span>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleApplyPlan} 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-chart-2 via-chart-3 to-chart-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Applying Plan...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Apply Plan Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-4">
                      <Play className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-medium">No simulation data yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Generate a plan to see predicted outcomes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        {/* Bottom: Causal Graph */}
        <Card className="bg-card/50 backdrop-blur border-chart-3/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-chart-3" />
                  Causal Graph (XAI)
                </CardTitle>
                <CardDescription>Structural causal model edges</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAutoDiscoverEdges}
                disabled={loading}
                className="border-chart-3/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Network className="mr-2 h-4 w-4" />
                    Auto-Discover Edges
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {edges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {edges.map((edge) => (
                  <div 
                    key={edge.id} 
                    className="p-3 bg-info-light/50 rounded-lg border border-info-border/30 hover:border-info-border/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        {edge.source_node} → {edge.target_node}
                      </span>
                      <span className="text-xs text-info font-semibold">
                        {edge.weight.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No causal edges discovered yet</p>
                <p className="text-sm mt-2">Click "Auto-Discover Edges" to generate</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics & Visualizations */}
        {currentPlan && interventionChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Intervention Breakdown */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Intervention Breakdown
                </CardTitle>
                <CardDescription>CO₂ and water savings by intervention type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interventionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    /> 
                    <Legend />
                    <Bar dataKey="co2" name="CO₂ (kg)" fill="hsl(var(--success))" />
                    <Bar dataKey="water" name="Water (kL)" fill="hsl(var(--info))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Intervention Distribution Pie */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-chart-2" />
                  CO₂ Savings Distribution
                </CardTitle>
                <CardDescription>Impact share by intervention</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={interventionChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="co2"
                    >
                      {interventionChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Policy Timeline Chart */}
        {policyTimelineData.length > 0 && (
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-chart-3" />
                Policy Performance Timeline
              </CardTitle>
              <CardDescription>Historical comparison of generated plans</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={policyTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="co2Savings" 
                    name="CO₂ Savings (kg)" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))', r: 4 }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="waterSavings" 
                    name="Water Savings (kL)" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--info))', r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="confidence" 
                    name="Confidence (%)" 
                    stroke="hsl(var(--chart-5))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--chart-5))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* User Stats & Achievements */}
        {ecoPoints && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur border-warning-border/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-warning" />
                  Your Eco Impact
                </CardTitle>
                <CardDescription>Points and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-warning-light/50 rounded-lg border border-warning-border/30">
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-3xl font-bold text-warning">{ecoPoints.points}</p>
                  </div>
                  <div className="p-4 bg-chart-5/10 rounded-lg border border-chart-5/30">
                    <p className="text-sm text-muted-foreground">Badge Level</p>
                    <p className="text-lg font-semibold text-chart-5">{ecoPoints.badge_level}</p>
                  </div>
                </div>
                <div className="p-4 bg-success-light/50 rounded-lg border border-success-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Streak Days</p>
                    <p className="text-2xl font-bold text-success">{ecoPoints.streak_days}</p>
                  </div>
                  <Progress value={(ecoPoints.streak_days % 7) * (100 / 7)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {7 - (ecoPoints.streak_days % 7)} days to next milestone
                  </p>
                </div>
              </CardContent>
            </Card>

            {recentAchievements.length > 0 && (
              <Card className="bg-card/50 backdrop-blur border-warning-border/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-warning" />
                    Recent Achievements
                  </CardTitle>
                  <CardDescription>Your latest milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAchievements.map((achievement) => (
                      <div 
                        key={achievement.id}
                        className="p-3 bg-warning-light/50 rounded-lg border border-warning-border/30"
                      >
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-warning">{achievement.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(achievement.earned_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Historical Policies */}
        {policies.length > 0 && (
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Recent Policies</CardTitle>
              <CardDescription>Your last 5 generated prescriptive plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {policies.map((policy) => (
                  <div 
                    key={policy.id} 
                    className="p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentPlan(policy);
                      setDtRun(policy.dt_runs?.[0]);
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{policy.rationale}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(policy.created_at).toLocaleDateString()} • {policy.interventions?.length || 0} interventions
                        </p>
                      </div>
                      {policy.dt_runs?.[0] && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-success">
                            {policy.dt_runs[0].total_kg} kg CO₂
                          </p>
                          <p className="text-xs text-info">
                            {policy.dt_runs[0].total_water_kl} kL H₂O
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </Layout>
  );
}