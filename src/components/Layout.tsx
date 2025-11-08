import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, LayoutDashboard, MessageSquare, BarChart3, Settings, LogOut, FileText, Trophy, Users, Sparkles, Target, Home, MessagesSquare, TrendingUp, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Bell from "./notifications/Bell";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/design", icon: Sparkles, label: "Design" },
    { path: "/house-planning", icon: Home, label: "House Plan" },
    { path: "/predict", icon: TrendingUp, label: "Predict" },
    { path: "/smart-city", icon: Building2, label: "Smart City" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Crazy animated background with multiple orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-neon-cyan/20 via-neon-pink/20 to-neon-purple/20 animate-gradient-fast" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-neon-cyan/30 rounded-full blur-3xl animate-float neon-glow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-neon-pink/30 to-neon-purple/30 rounded-full blur-3xl animate-float neon-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-gradient-to-br from-neon-yellow/20 to-info/20 rounded-full blur-3xl animate-float neon-glow" style={{ animationDelay: '2s' }} />
      </div>

      <nav className="glass backdrop-blur-2xl border-b-0 sticky top-0 z-50 transition-all duration-500 border-animate-fast neon-glow">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/design" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-2xl border-animate-fast shadow-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Leaf className="w-6 h-6 text-primary-foreground drop-shadow-lg transition-transform group-hover:rotate-12" />
              </div>
              <span className="font-bold text-xl text-primary">EcoPulse AI</span>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 rounded-2xl transition-all duration-300 hover:scale-105 border-0 group relative overflow-hidden ${
                        isActive 
                          ? 'bg-primary/20 text-primary shadow-lg' 
                          : 'glass hover:bg-primary/10'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-primary to-primary/80 shadow-md' 
                          : 'glass group-hover:bg-primary/10'
                      }`}>
                        <Icon className={`w-4 h-4 transition-all duration-300 group-hover:scale-110 ${
                          isActive ? 'text-primary-foreground drop-shadow-lg' : 'text-foreground/70 group-hover:text-primary'
                        }`} />
                      </div>
                      <span className={`font-medium transition-all duration-300 ${
                        isActive ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'
                      }`}>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="border-animate rounded-2xl p-1 hover:scale-105 transition-all duration-300 hover:neon-glow">
                <Bell />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="border-animate rounded-2xl hover:scale-105 hover:bg-destructive/10 transition-all duration-300 border-0 group hover:neon-glow"
              >
                <LogOut className="w-5 h-5 text-foreground/70 group-hover:text-destructive transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 animate-fade-in">{children}</main>

      {/* Floating Chat Button */}
      <Link 
        to="/chat"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-16 h-16 rounded-3xl border-animate-fast neon-glow bg-gradient-to-br from-primary via-neon-cyan via-neon-pink to-neon-purple text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group animate-gradient-fast animate-float"
      >
        <MessagesSquare className="w-7 h-7 drop-shadow-lg group-hover:scale-110 transition-transform duration-300 animate-pulse" />
      </Link>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass backdrop-blur-2xl border-t-0 z-50 shadow-2xl border-animate-slow neon-glow">
        <div className="flex items-center justify-around py-3 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex flex-col items-center p-2 group transition-all duration-300 hover:scale-105"
              >
                <div className={`p-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'border-animate-fast neon-glow bg-gradient-to-br from-primary via-neon-cyan via-neon-pink to-neon-purple animate-gradient-fast shadow-lg' 
                    : 'glass group-hover:bg-primary/10 group-hover:border-animate'
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
                    isActive ? 'text-primary-foreground drop-shadow-lg animate-pulse' : 'text-muted-foreground group-hover:text-primary'
                  }`} />
                </div>
                <span className={`text-xs mt-1.5 font-medium transition-all duration-300 ${
                  isActive ? 'bg-gradient-to-r from-primary via-neon-cyan to-neon-pink bg-clip-text text-transparent' : 'text-muted-foreground group-hover:text-foreground'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;