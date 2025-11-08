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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-eco-light/30 relative overflow-hidden">
      {/* Animated background blurs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-info/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <nav className="glass backdrop-blur-2xl border-b border-border/20 sticky top-0 z-50 transition-all duration-500">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/design" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-eco-accent to-info flex items-center justify-center glass-button shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl animate-gradient">
                <Leaf className="w-6 h-6 text-primary-foreground drop-shadow-lg transition-transform group-hover:rotate-12" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary via-eco-accent to-info bg-clip-text text-transparent animate-gradient">EcoPulse AI</span>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 rounded-2xl glass transition-all duration-300 hover:scale-105 border-0 group relative overflow-hidden ${
                        isActive 
                          ? 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg' 
                          : 'hover:bg-primary/5'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-primary via-eco-accent to-info glass-button shadow-md' 
                          : 'glass group-hover:bg-primary/10'
                      }`}>
                        <Icon className={`w-4 h-4 transition-all duration-300 group-hover:scale-110 ${
                          isActive ? 'text-primary-foreground drop-shadow-lg' : 'text-foreground/70 group-hover:text-primary'
                        }`} />
                      </div>
                      <span className={`font-medium transition-all duration-300 ${
                        isActive ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'
                      }`}>{item.label}</span>
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-eco-accent to-info animate-gradient" />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="glass rounded-2xl p-1 hover:scale-105 transition-all duration-300">
                <Bell />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="glass rounded-2xl hover:scale-105 hover:bg-destructive/10 transition-all duration-300 border-0 group"
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
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-16 h-16 rounded-3xl bg-gradient-to-br from-primary via-eco-accent to-info text-primary-foreground glass-button shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-110 flex items-center justify-center group animate-gradient animate-float"
      >
        <MessagesSquare className="w-7 h-7 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
      </Link>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass backdrop-blur-2xl border-t border-border/20 z-50 shadow-2xl">
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
                    ? 'bg-gradient-to-br from-primary via-eco-accent to-info glass-button shadow-lg animate-gradient' 
                    : 'glass group-hover:bg-primary/10'
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
                    isActive ? 'text-primary-foreground drop-shadow-lg' : 'text-muted-foreground group-hover:text-primary'
                  }`} />
                </div>
                <span className={`text-xs mt-1.5 font-medium transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
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