import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Zap, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

export default function Challenges() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { data: challenges, isLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("end_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const completeChallengeMutation = useMutation({
    mutationFn: async (challenge: any) => {
      if (!userId) throw new Error("User not authenticated");

      // Add achievement
      const { error: achievementError } = await supabase
        .from("achievements")
        .insert({
          user_id: userId,
          title: `Completed: ${challenge.title}`,
          description: challenge.description,
        });

      if (achievementError) throw achievementError;

      // Update eco points
      const { data: currentPoints, error: pointsError } = await supabase
        .from("eco_points")
        .select("points")
        .eq("user_id", userId)
        .single();

      if (pointsError) throw pointsError;

      const newPoints = (currentPoints?.points || 0) + challenge.reward_points;

      const { error: updateError } = await supabase
        .from("eco_points")
        .update({ points: newPoints })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      return challenge;
    },
    onSuccess: (challenge) => {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });

      toast({
        title: "Challenge Completed! 🎉",
        description: `You've earned ${challenge.reward_points} EcoPoints for completing "${challenge.title}"`,
      });

      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.invalidateQueries({ queryKey: ["eco-points"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-primary">Loading challenges...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            Eco Challenges
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Take on sustainability challenges to earn EcoPoints, unlock achievements, and make a real impact!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges?.map((challenge) => {
            const daysLeft = getDaysLeft(challenge.end_date);
            return (
              <Card key={challenge.id} className="relative overflow-hidden border-border hover:border-primary transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Zap className="h-3 w-3 mr-1" />
                      {challenge.reward_points} pts
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {daysLeft}d left
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{challenge.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Button
                    onClick={() => completeChallengeMutation.mutate(challenge)}
                    disabled={completeChallengeMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {completeChallengeMutation.isPending ? "Completing..." : "Mark Complete"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {challenges?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Active Challenges</h3>
              <p className="text-muted-foreground">Check back soon for new eco challenges!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
