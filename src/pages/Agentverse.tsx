import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, Play, Network, TrendingUp, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
    toast.info("Auto-discovery feature coming soon!");
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

  const COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-950/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            PCW-NO: Prescriptive Nexus Optimizer
          </h1>
          <p className="text-muted-foreground">
            AI-powered causal inference for sustainability optimization
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Causal Policy Engine */}
          <Card className="bg-card/50 backdrop-blur border-emerald-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Causal Policy Engine
              </CardTitle>
              <CardDescription>Input your context to generate a prescriptive plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avg_kwh">Avg kWh</Label>
                  <Input
                    id="avg_kwh"
                    type="number"
                    value={context.avg_kwh}
                    onChange={(e) => setContext({ ...context, avg_kwh: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avg_liters">Avg Liters</Label>
                  <Input
                    id="avg_liters"
                    type="number"
                    value={context.avg_liters}
                    onChange={(e) => setContext({ ...context, avg_liters: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grid_price">Grid Price (₹/kWh)</Label>
                  <Input
                    id="grid_price"
                    type="number"
                    step="0.1"
                    value={context.grid_price_rs_per_kwh}
                    onChange={(e) => setContext({ ...context, grid_price_rs_per_kwh: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lst">LST (°C)</Label>
                  <Input
                    id="lst"
                    type="number"
                    value={context.lst_c}
                    onChange={(e) => setContext({ ...context, lst_c: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGeneratePlan} 
                disabled={generating}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Prescriptive Plan
                  </>
                )}
              </Button>

              {currentPlan && (
                <div className="mt-6 space-y-4 p-4 bg-emerald-950/20 rounded-lg border border-emerald-500/30">
                  <div>
                    <h3 className="font-semibold text-emerald-400 mb-2">Rationale</h3>
                    <p className="text-sm text-muted-foreground">{currentPlan.rationale}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-emerald-400 mb-2">Interventions</h3>
                    <div className="space-y-2">
                      {currentPlan.interventions?.map((intervention: any, idx: number) => (
                        <div key={idx} className="p-3 bg-background/50 rounded border border-emerald-500/20">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium capitalize">{intervention.type?.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-muted-foreground">{intervention.window}</p>
                            </div>
                            <div className="text-right text-sm">
                              <div className="text-emerald-400">CO₂: {intervention.expected_kg} kg</div>
                              {intervention.expected_water_kl && (
                                <div className="text-blue-400">H₂O: {intervention.expected_water_kl} kL</div>
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
          <Card className="bg-card/50 backdrop-blur border-teal-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-teal-500" />
                Digital Twin Simulation
              </CardTitle>
              <CardDescription>Simulated outcomes and savings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dtRun ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-950/20 rounded-lg border border-emerald-500/30">
                      <p className="text-sm text-muted-foreground">Total CO₂ Savings</p>
                      <p className="text-2xl font-bold text-emerald-400">{dtRun.total_kg} kg</p>
                    </div>
                    <div className="p-4 bg-blue-950/20 rounded-lg border border-blue-500/30">
                      <p className="text-sm text-muted-foreground">Water Savings</p>
                      <p className="text-2xl font-bold text-blue-400">{dtRun.total_water_kl} kL</p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/30">
                    <p className="text-sm text-muted-foreground mb-2">Confidence Level</p>
                    <Progress value={dtRun.confidence_level * 100} className="h-2" />
                    <p className="text-right text-sm mt-1 text-purple-400">
                      {(dtRun.confidence_level * 100).toFixed(1)}%
                    </p>
                  </div>

                  {goals && (
                    <div className="p-4 bg-amber-950/20 rounded-lg border border-amber-500/30">
                      <p className="text-sm text-muted-foreground mb-2">Progress vs Target</p>
                      <Progress value={goalProgress} className="h-2" />
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-amber-400">{dtRun.total_kg} kg</span>
                        <span className="text-muted-foreground">Target: {goals.target_energy_saving} kg</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleApplyPlan} 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Apply Plan
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Generate a plan to see simulation results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom: Causal Graph */}
        <Card className="bg-card/50 backdrop-blur border-cyan-500/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-cyan-500" />
                  Causal Graph (XAI)
                </CardTitle>
                <CardDescription>Structural causal model edges</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAutoDiscoverEdges}
                className="border-cyan-500/50"
              >
                Auto-Discover Edges
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {edges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {edges.map((edge) => (
                  <div 
                    key={edge.id} 
                    className="p-3 bg-cyan-950/20 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        {edge.source_node} → {edge.target_node}
                      </span>
                      <span className="text-xs text-cyan-400 font-semibold">
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
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
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
                    <Bar dataKey="co2" name="CO₂ (kg)" fill="#10b981" />
                    <Bar dataKey="water" name="Water (kL)" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Intervention Distribution Pie */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal-500" />
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
                <TrendingUp className="h-5 w-5 text-cyan-500" />
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
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="waterSavings" 
                    name="Water Savings (kL)" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="confidence" 
                    name="Confidence (%)" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#a855f7', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* User Stats & Achievements */}
        {ecoPoints && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur border-amber-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Your Eco Impact
                </CardTitle>
                <CardDescription>Points and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-950/20 rounded-lg border border-amber-500/30">
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-3xl font-bold text-amber-400">{ecoPoints.points}</p>
                  </div>
                  <div className="p-4 bg-purple-950/20 rounded-lg border border-purple-500/30">
                    <p className="text-sm text-muted-foreground">Badge Level</p>
                    <p className="text-lg font-semibold text-purple-400">{ecoPoints.badge_level}</p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-950/20 rounded-lg border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Streak Days</p>
                    <p className="text-2xl font-bold text-emerald-400">{ecoPoints.streak_days}</p>
                  </div>
                  <Progress value={(ecoPoints.streak_days % 7) * (100 / 7)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {7 - (ecoPoints.streak_days % 7)} days to next milestone
                  </p>
                </div>
              </CardContent>
            </Card>

            {recentAchievements.length > 0 && (
              <Card className="bg-card/50 backdrop-blur border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Recent Achievements
                  </CardTitle>
                  <CardDescription>Your latest milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAchievements.map((achievement) => (
                      <div 
                        key={achievement.id}
                        className="p-3 bg-yellow-950/20 rounded-lg border border-yellow-500/30"
                      >
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-yellow-400">{achievement.title}</p>
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
                          <p className="text-sm font-semibold text-emerald-400">
                            {policy.dt_runs[0].total_kg} kg CO₂
                          </p>
                          <p className="text-xs text-blue-400">
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
  );
}