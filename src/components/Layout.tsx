import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, LayoutDashboard, MessageSquare, BarChart3, Settings, LogOut, FileText, Trophy, Users, Sparkles, Target, Home, MessagesSquare } from "lucide-react";
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
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/bills", icon: FileText, label: "Bills" },
    { path: "/challenges", icon: Target, label: "Challenges" },
    { path: "/achievements", icon: Trophy, label: "Achievements" },
    { path: "/image-analyzer", icon: Sparkles, label: "Analyzer" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-eco-light">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/design" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">EcoPulse AI</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Bell />
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>

      {/* Floating Chat Button */}
      <Link 
        to="/chat"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      >
        <MessagesSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </Link>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-lg">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col items-center p-2">
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs mt-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
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