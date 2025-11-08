import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Target, Trophy, Sparkles } from "lucide-react";
import { useEffect } from "react";

const Insights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname.includes('/challenges')) return 'challenges';
    if (location.pathname.includes('/achievements')) return 'achievements';
    if (location.pathname.includes('/image-analyzer')) return 'analyzer';
    return 'analytics';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (value: string) => {
    const routes: Record<string, string> = {
      analytics: '/analytics',
      challenges: '/challenges',
      achievements: '/achievements',
      analyzer: '/image-analyzer',
    };
    navigate(routes[value]);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insights Hub</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress, complete challenges, and analyze your impact
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Analyzer</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="text-center text-muted-foreground py-8">
              Select a tab to view content
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Insights;
