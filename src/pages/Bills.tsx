import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Bills() {
  const [fileUrl, setFileUrl] = useState("");
  const [month, setMonth] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const { data: bills, refetch } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleAnalyzeBill = async () => {
    if (!fileUrl || !month) {
      toast({
        title: "Missing information",
        description: "Please provide both image URL and month",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze_bill', {
        body: { file_url: fileUrl, month }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Bill analyzed successfully",
        description: "AI has extracted your bill details"
      });

      refetch();
      setFileUrl("");
      setMonth("");
    } catch (error: any) {
      console.error('Error analyzing bill:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze bill",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMonthComparison = (currentBill: any, prevBill: any) => {
    if (!prevBill) return null;
    const diff = currentBill.total_amount - prevBill.total_amount;
    const percentChange = ((diff / prevBill.total_amount) * 100).toFixed(1);
    return { diff, percentChange, increased: diff > 0 };
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Bills Management</h1>
          <p className="text-muted-foreground">Upload and analyze your utility bills with AI</p>
        </div>

        {/* Upload Section */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload & Analyze Bill
            </CardTitle>
            <CardDescription>Paste an image URL of your utility bill for AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileUrl">Bill Image URL</Label>
              <Input
                id="fileUrl"
                placeholder="https://example.com/bill.jpg"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month (YYYY-MM)</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleAnalyzeBill} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Bill"}
            </Button>
          </CardContent>
        </Card>

        {/* Bills History */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Bill History</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {bills?.map((bill, index) => {
              const prevBill = bills[index + 1];
              const comparison = getMonthComparison(bill, prevBill);

              return (
                <Card key={bill.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {bill.month}
                      </span>
                      <span className="text-2xl font-bold">${bill.total_amount}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Energy Usage</p>
                        <p className="font-semibold">{bill.energy_usage} kWh</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Water Usage</p>
                        <p className="font-semibold">{bill.water_usage} L</p>
                      </div>
                    </div>

                    {comparison && (
                      <div className={`flex items-center gap-2 p-2 rounded-md ${
                        comparison.increased ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>
                        {comparison.increased ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {comparison.increased ? '+' : ''}{comparison.percentChange}% vs last month
                        </span>
                      </div>
                    )}

                    {bill.ai_summary && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">AI Insights</p>
                        <p className="text-sm text-muted-foreground">{bill.ai_summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(!bills || bills.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No bills uploaded yet</p>
                <p className="text-sm text-muted-foreground">Upload your first bill to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
