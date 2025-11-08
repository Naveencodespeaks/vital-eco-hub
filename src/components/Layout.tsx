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
    <div className="min-h-screen bg-background">
      <nav className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/design" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg text-foreground">EcoPulse AI</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 ${
                        isActive ? 'bg-accent' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Bell />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>

      {/* Floating Chat Button */}
      <Link 
        to="/chat"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-14 h-14 bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      >
        <MessagesSquare className="w-6 h-6" />
      </Link>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="flex flex-col items-center p-2"
              >
                <Icon className={`w-5 h-5 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className={`text-xs mt-1 ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
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