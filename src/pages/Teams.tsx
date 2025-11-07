import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Award, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PointsBadge from "@/components/points/PointsBadge";

export default function Teams() {
  const [isCreating, setIsCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [joiningTeamId, setJoiningTeamId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: teams, refetch: refetchTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch creators separately
      const creatorIds = data?.map(t => t.created_by) || [];
      const { data: creators } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', creatorIds);

      // Count members for each team
      const teamsWithData = await Promise.all(
        (data || []).map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          return {
            ...team,
            creator: creators?.find(c => c.id === team.created_by),
            memberCount: count || 0
          };
        })
      );

      return teamsWithData;
    }
  });

  const { data: myTeams } = useQuery({
    queryKey: ['my-teams'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          teams(*)
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    }
  });

  const handleCreateTeam = async () => {
    if (!teamName) {
      toast({
        title: "Team name required",
        description: "Please provide a team name",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          team_name: teamName,
          description: description || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator
      await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'creator'
        });

      toast({
        title: "Team created!",
        description: `${teamName} is now ready`
      });

      refetchTeams();
      setTeamName("");
      setDescription("");
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (teamId: number) => {
    setJoiningTeamId(teamId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Joined team!",
        description: "You're now part of the team"
      });

      refetchTeams();
    } catch (error: any) {
      toast({
        title: "Failed to join",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setJoiningTeamId(null);
    }
  };

  const getTeamStats = async (teamId: number) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: members } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    if (!members) return { totalCO2Saved: 0, memberCount: 0 };

    const userIds = members.map(m => m.user_id);
    
    const { data: metrics } = await supabase
      .from('metrics')
      .select('co2_emission')
      .in('user_id', userIds)
      .gte('timestamp', sevenDaysAgo.toISOString());

    const totalCO2Saved = metrics?.reduce((sum, m) => sum + m.co2_emission, 0) || 0;
    
    return { totalCO2Saved: totalCO2Saved.toFixed(2), memberCount: members.length };
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Teams</h1>
          <p className="text-muted-foreground">Join forces to save the planet together</p>
        </div>

        {/* Create Team */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Team
            </CardTitle>
            <CardDescription>Start your own sustainability team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="Green Warriors"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Our mission is..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateTeam} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Team"}
            </Button>
          </CardContent>
        </Card>

        {/* My Teams */}
        {myTeams && myTeams.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">My Teams</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {myTeams.map((membership) => (
                <Card key={membership.id} className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {membership.teams.team_name}
                      </span>
                      <PointsBadge level={membership.role} />
                    </CardTitle>
                    {membership.teams.description && (
                      <CardDescription>{membership.teams.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Teams */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">All Teams</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {teams?.map((team) => {
              const isMember = myTeams?.some(m => m.teams.id === team.id);
              
              return (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {team.team_name}
                    </CardTitle>
                    {team.description && (
                      <CardDescription>{team.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created by</span>
                      <span className="font-medium">{team.creator?.name || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-medium">{team.memberCount}</span>
                    </div>

                    {!isMember && (
                      <Button 
                        onClick={() => handleJoinTeam(team.id)}
                        disabled={joiningTeamId === team.id}
                        className="w-full"
                        variant="outline"
                      >
                        {joiningTeamId === team.id ? "Joining..." : "Join Team"}
                      </Button>
                    )}

                    {isMember && (
                      <div className="bg-primary/10 text-primary p-2 rounded-md text-center text-sm font-medium">
                        ✓ Member
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(!teams || teams.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No teams yet</p>
                <p className="text-sm text-muted-foreground">Be the first to create one!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
