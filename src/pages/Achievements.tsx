import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PointsBadge from "@/components/points/PointsBadge";
import { Award, Flame, Calendar } from "lucide-react";

export default function Achievements() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
      }
    });
  }, [navigate]);

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: streak } = useQuery({
    queryKey: ["streak", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: ecoPoints } = useQuery({
    queryKey: ["eco-points", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("eco_points")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (achievementsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-primary">Loading achievements...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Award className="h-10 w-10 text-primary" />
            Your Achievements
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Track your sustainability journey and celebrate your eco wins!
          </p>
        </div>

        {/* Streak Card */}
        {streak && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                Your Eco Streak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">{streak.current_streak} Days</p>
                  <p className="text-sm text-muted-foreground">Current streak</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-foreground">{streak.best_streak} Days</p>
                  <p className="text-sm text-muted-foreground">Best streak</p>
                </div>
              </div>
              <Progress value={(streak.current_streak / (streak.best_streak || 1)) * 100} className="h-2" />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Keep logging eco actions to maintain your streak!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Current Badge */}
        {ecoPoints && (
          <Card>
            <CardHeader>
              <CardTitle>Current Badge Level</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <PointsBadge level={ecoPoints.badge_level} />
                <p className="text-sm text-muted-foreground mt-2">{ecoPoints.points} EcoPoints</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Next level at:</p>
                <p className="text-lg font-semibold">
                  {ecoPoints.badge_level === "Eco Starter" ? "100" :
                   ecoPoints.badge_level === "Green Hero" ? "300" : "Max"} pts
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements List */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Earned Achievements
          </h2>
          
          {achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="border-border hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <Award className="h-8 w-8 text-primary flex-shrink-0" />
                      <Badge variant="outline" className="text-xs">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{achievement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
                <p className="text-muted-foreground">
                  Complete challenges and eco actions to earn your first achievement!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
