import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, Zap, BarChart3, Brain, ArrowRight } from "lucide-react";
import GlobalImpactCounter from "@/components/GlobalImpactCounter";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-eco-light to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">EcoPulse AI</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Sign In
          </Button>
        </nav>

        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Leaf className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Predict & Prevent
            <br />
            <span className="text-primary">Energy Waste</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered sustainability dashboard that helps you monitor, analyze, and reduce your
            energy and water consumption in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="group">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI Predictions</h3>
            <p className="text-muted-foreground">
              Get intelligent insights and recommendations to optimize your resource usage
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Real-time Monitoring</h3>
            <p className="text-muted-foreground">
              Track your energy and water consumption with live updates and alerts
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Detailed Analytics</h3>
            <p className="text-muted-foreground">
              Visualize trends, set goals, and measure your environmental impact
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32">
          <GlobalImpactCounter />
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-12">Why EcoPulse AI?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15-30%</div>
              <div className="text-muted-foreground">Average Savings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Real-time</div>
              <div className="text-muted-foreground">Monitoring</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">AI-Powered</div>
              <div className="text-muted-foreground">Insights</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center p-12 rounded-2xl bg-gradient-to-r from-primary/10 to-eco-accent/10 border border-primary/20">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join EcoPulse AI today and take control of your environmental impact with
            AI-powered sustainability insights.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Create Free Account
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-32 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 EcoPulse AI. Powered by Lovable Cloud & AI.</p>
            <Button variant="link" onClick={() => navigate("/about-ai")} className="text-sm">
              About Our AI Technology
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;