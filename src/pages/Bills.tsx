import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, TrendingUp, TrendingDown, Camera, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Bills() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 20MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAnalyzeBill = async () => {
    if (!selectedFile || !month) {
      toast({
        title: "Missing information",
        description: "Please provide both image and month",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke('analyze_bill', {
          body: { 
            file_url: base64Image,
            month 
          }
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
        setSelectedFile(null);
        setPreviewUrl("");
        setMonth("");
        setIsAnalyzing(false);
      };

      reader.onerror = () => {
        throw new Error("Failed to read file");
      };
    } catch (error: any) {
      console.error('Error analyzing bill:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze bill",
        variant: "destructive"
      });
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
            <CardDescription>Upload a photo of your utility bill or take a picture for AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Bill Image</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label htmlFor="file-upload">
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border hover:border-primary rounded-lg cursor-pointer transition-colors bg-background hover:bg-muted/50">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Choose File</span>
                    </div>
                  </Label>
                </div>
                <div>
                  <Input
                    id="camera-capture"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label htmlFor="camera-capture">
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border hover:border-primary rounded-lg cursor-pointer transition-colors bg-background hover:bg-muted/50">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Take Photo</span>
                    </div>
                  </Label>
                </div>
              </div>
              
              {previewUrl && (
                <div className="mt-3 relative">
                  <img 
                    src={previewUrl} 
                    alt="Bill preview" 
                    className="w-full max-h-64 object-contain rounded-lg border border-border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleAnalyzeBill} 
              disabled={isAnalyzing || !selectedFile}
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
