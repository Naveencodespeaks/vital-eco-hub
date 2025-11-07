import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ForecastChart = () => {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('eco_forecast');

      if (error) throw error;

      setForecast(data.forecast);
      toast({
        title: 'Forecast Generated',
        description: 'Your 7-day consumption forecast is ready!',
      });
    } catch (error: any) {
      console.error('Error fetching forecast:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate forecast',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch latest forecast on mount
    const fetchLatest = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('forecasts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setForecast(data);
    };

    fetchLatest();
  }, []);

  const chartData = forecast
    ? [
        {
          name: 'Predicted',
          energy: Number(forecast.predicted_energy_kwh),
          water: Number(forecast.predicted_water_liters),
          co2: Number(forecast.predicted_co2_kg),
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            7-Day Forecast
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered consumption predictions
          </p>
        </div>
        <Button onClick={fetchForecast} disabled={loading} size="sm">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Forecast'
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {forecast ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">Energy</div>
                <div className="text-lg font-bold text-primary">
                  {Number(forecast.predicted_energy_kwh).toFixed(1)} kWh
                </div>
              </div>
              <div className="text-center p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <div className="text-xs text-muted-foreground mb-1">Water</div>
                <div className="text-lg font-bold text-blue-500">
                  {Number(forecast.predicted_water_liters).toFixed(0)} L
                </div>
              </div>
              <div className="text-center p-3 bg-gray-500/5 rounded-lg border border-gray-500/20">
                <div className="text-xs text-muted-foreground mb-1">CO₂</div>
                <div className="text-lg font-bold text-gray-500">
                  {Number(forecast.predicted_co2_kg).toFixed(2)} kg
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>

            <p className="text-xs text-muted-foreground mt-4">
              📊 Forecast period: {new Date(forecast.period_start).toLocaleDateString()} -{' '}
              {new Date(forecast.period_end).toLocaleDateString()}
            </p>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No forecast available yet</p>
            <p className="text-sm mt-1">Click "Generate Forecast" to see predictions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastChart;
