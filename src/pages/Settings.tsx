import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Target } from "lucide-react";
import Layout from "@/components/Layout";

const Settings = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetEnergy, setTargetEnergy] = useState("");
  const [targetWater, setTargetWater] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchGoals();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setName(data.name);
      setEmail(data.email);
    }
  };

  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTargetEnergy(data.target_energy_saving.toString());
      setTargetWater(data.target_water_saving.toString());
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({ name, email })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if goal exists
      const { data: existingGoal } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({
            target_energy_saving: parseFloat(targetEnergy),
            target_water_saving: parseFloat(targetWater)
          })
          .eq('id', existingGoal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            target_energy_saving: parseFloat(targetEnergy),
            target_water_saving: parseFloat(targetWater)
          });

        if (error) throw error;
      }

      toast({
        title: "Goals updated",
        description: "Your sustainability goals have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Goals Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Sustainability Goals</span>
            </CardTitle>
            <CardDescription>Set your monthly targets for energy and water usage</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateGoals} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-energy">Target Energy Saving (kWh/month)</Label>
                <Input
                  id="target-energy"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 100"
                  value={targetEnergy}
                  onChange={(e) => setTargetEnergy(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-water">Target Water Saving (L/month)</Label>
                <Input
                  id="target-water"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1000"
                  value={targetWater}
                  onChange={(e) => setTargetWater(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Goals"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data Source Info */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This application uses AI-powered predictions to analyze your energy and water usage patterns.
              All data is securely stored and processed through Lovable Cloud.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;