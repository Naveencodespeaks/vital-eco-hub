import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Home, Lightbulb } from 'lucide-react';

const Design = () => {
  const [prompt, setPrompt] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetAdvice = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a design question or idea',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('design_advisor', {
        body: { prompt },
      });

      if (error) throw error;

      setAdvice(data.advice);
      toast({
        title: 'Success',
        description: 'Design advice generated!',
      });
    } catch (error: any) {
      console.error('Error getting design advice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get design advice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-xl">
            <Home className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Eco Design Advisor</h1>
            <p className="text-muted-foreground">AI-powered sustainable design suggestions</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-foreground">Ask the Design AI</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get creative, sustainable design ideas for your home or workspace
                </p>
              </div>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., How can I create an eco-friendly home office? What sustainable materials should I use for kitchen renovation?"
              className="min-h-32 mb-4 bg-background"
              disabled={isLoading}
            />

            <Button
              onClick={handleGetAdvice}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Advice...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Get Design Advice
                </>
              )}
            </Button>
          </Card>

          {advice && (
            <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background animate-fade-in">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">AI Design Recommendations</h3>
              </div>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {advice}
              </div>
            </Card>
          )}

          <Card className="p-6 bg-muted/50 border-dashed">
            <h4 className="font-semibold mb-3 text-foreground">💚 Sample Questions</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>How can I maximize natural light in my living room?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>What are the best indoor plants for air purification?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Suggest eco-friendly flooring materials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>How to design an energy-efficient kitchen layout?</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Design;
