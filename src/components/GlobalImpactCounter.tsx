import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Users, Leaf } from 'lucide-react';

const GlobalImpactCounter = () => {
  const [impact, setImpact] = useState({
    total_users: 0,
    total_co2_saved: 0,
  });

  useEffect(() => {
    fetchGlobalImpact();
  }, []);

  const fetchGlobalImpact = async () => {
    try {
      const { data, error } = await supabase
        .from('global_impact')
        .select('*')
        .maybeSingle();

      if (data && !error) {
        setImpact(data);
      }
    } catch (error) {
      console.error('Error fetching global impact:', error);
    }
  };

  return (
    <div className="py-16 px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl border border-primary/20">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-primary/20 rounded-full mb-4 animate-pulse">
          <Globe className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Global Impact</h2>
        <p className="text-muted-foreground">Together, we're making a difference</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <div className="text-center p-6 bg-background/50 rounded-xl border border-border">
          <Users className="w-8 h-8 text-primary mx-auto mb-3" />
          <div className="text-4xl font-bold text-primary mb-2 animate-fade-in">
            {impact.total_users.toLocaleString()}+
          </div>
          <div className="text-sm text-muted-foreground">Active EcoPulse Users</div>
        </div>

        <div className="text-center p-6 bg-background/50 rounded-xl border border-border">
          <Leaf className="w-8 h-8 text-primary mx-auto mb-3" />
          <div className="text-4xl font-bold text-primary mb-2 animate-fade-in">
            {impact.total_co2_saved.toFixed(1)}kg
          </div>
          <div className="text-sm text-muted-foreground">Total CO₂ Reduced</div>
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          🌍 Join the green movement and make an impact today!
        </p>
      </div>
    </div>
  );
};

export default GlobalImpactCounter;
