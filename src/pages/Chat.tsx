import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react";
import Layout from "@/components/Layout";

const Chat = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [energyUsage, setEnergyUsage] = useState("");
  const [waterUsage, setWaterUsage] = useState("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setReports(data);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('predict', {
        body: {
          energy_usage: parseFloat(energyUsage),
          water_usage: parseFloat(waterUsage)
        }
      });

      if (error) throw error;

      setPrediction(data);
      
      toast({
        title: "Analysis complete!",
        description: "View your personalized recommendations below.",
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Chat Assistant</h1>
          <p className="text-muted-foreground">Get personalized sustainability insights</p>
        </div>

        {/* Analysis Form */}
        <Card>
          <CardHeader>
            <CardTitle>Get AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chat-energy">Energy Usage (kWh)</Label>
                  <Input
                    id="chat-energy"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150"
                    value={energyUsage}
                    onChange={(e) => setEnergyUsage(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-water">Water Usage (Liters)</Label>
                  <Input
                    id="chat-water"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={waterUsage}
                    onChange={(e) => setWaterUsage(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Usage"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Prediction */}
        {prediction && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getRiskIcon(prediction.risk_level)}
                <span>Current Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Risk Level: {prediction.risk_level.toUpperCase()}</h3>
                <p className="text-muted-foreground">{prediction.ai_insight}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Recommended Actions:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {prediction.tips.map((tip: string, index: number) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm">
                  <span className="font-semibold">Predicted Savings:</span>{" "}
                  <span className="text-primary font-bold">{prediction.predicted_saving}%</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Recent Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No insights yet. Run your first analysis above!
                </p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {report.predicted_saving}% savings
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{report.ai_insight}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Chat;