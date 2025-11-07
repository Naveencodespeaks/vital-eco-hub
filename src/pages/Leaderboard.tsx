import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PointsBadge from "@/components/points/PointsBadge";

export default function Leaderboard() {
  const { data: topUsers } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eco_points')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Fetch profiles separately
      const userIds = data?.map(ep => ep.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, eco_score')
        .in('id', userIds);

      // Merge data
      return data?.map(ep => ({
        ...ep,
        profile: profiles?.find(p => p.id === ep.user_id)
      }));
    }
  });

  const { data: myRank } = useQuery({
    queryKey: ['my-rank'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: myPoints } = await supabase
        .from('eco_points')
        .select('points')
        .eq('user_id', user.id)
        .single();

      if (!myPoints) return null;

      const { count } = await supabase
        .from('eco_points')
        .select('*', { count: 'exact', head: true })
        .gt('points', myPoints.points);

      return { rank: (count || 0) + 1, points: myPoints.points };
    }
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">EcoPulse Leaderboard</h1>
          <p className="text-muted-foreground">See how you rank among sustainability champions</p>
        </div>

        {/* Personal Stats */}
        {myRank && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Your Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Global Rank</p>
                <p className="text-3xl font-bold text-primary">#{myRank.rank}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">EcoPoints</p>
                <p className="text-3xl font-bold text-primary">{myRank.points}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Users */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Top Sustainability Champions
          </h2>

          <div className="space-y-3">
            {topUsers?.map((entry, index) => (
              <Card 
                key={entry.id} 
                className={`${
                  index < 3 
                    ? 'border-primary/30 bg-gradient-to-r from-primary/5 to-transparent' 
                    : ''
                }`}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-orange-600' :
                      'text-muted-foreground'
                    }`}>
                      #{index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{entry.profile?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <PointsBadge level={entry.badge_level} />
                        {entry.streak_days > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {entry.streak_days} day streak
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-2xl font-bold text-primary">{entry.points}</p>
                    <p className="text-xs text-muted-foreground">
                      EcoScore: {entry.profile?.eco_score || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!topUsers || topUsers.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No rankings yet</p>
                <p className="text-sm text-muted-foreground">Be the first to earn EcoPoints!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
