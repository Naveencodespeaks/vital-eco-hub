import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Brain, Database, Zap, Shield, Github, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AboutAI = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex p-4 bg-gradient-to-br from-primary to-primary/70 rounded-2xl mb-4">
            <Brain className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Powered by Advanced AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            EcoPulse AI combines cutting-edge technology to help you make sustainable choices
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-foreground">AI Intelligence</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Powered by <strong className="text-foreground">Google Gemini 2.5 Flash</strong> via Lovable AI Gateway. 
                  Our AI analyzes your consumption patterns and provides personalized, actionable sustainability tips.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Real-time Data</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Built on <strong className="text-foreground">Supabase</strong> with PostgreSQL and real-time subscriptions. 
                  Your metrics update instantly, providing live insights into your environmental impact.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Predictive Forecasting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Machine learning algorithms analyze historical data to predict future consumption, 
                  helping you stay ahead of your sustainability goals.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Privacy First</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your data is <strong className="text-foreground">private and secure</strong>. 
                  We use it only to generate personalized eco-insights. No data sharing with third parties.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30">
          <h2 className="text-2xl font-bold mb-6 text-center text-foreground">Technology Stack</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex p-4 bg-background rounded-xl mb-3 shadow-sm">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Lovable AI</h4>
              <p className="text-sm text-muted-foreground">Gemini 2.5 Flash Model</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-background rounded-xl mb-3 shadow-sm">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Supabase</h4>
              <p className="text-sm text-muted-foreground">PostgreSQL + Realtime</p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-background rounded-xl mb-3 shadow-sm">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-foreground">Edge Functions</h4>
              <p className="text-sm text-muted-foreground">Serverless AI Processing</p>
            </div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-6 text-foreground">Built for Hackathons 🚀</h3>
          <div className="flex justify-center gap-4">
            <Button variant="outline" className="gap-2" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href="https://replit.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Replit Demo
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutAI;
