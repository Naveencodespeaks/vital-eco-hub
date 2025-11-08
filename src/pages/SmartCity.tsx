import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Navigation, 
  Building2, 
  Zap, 
  Droplets, 
  Car, 
  Trees, 
  TrendingUp,
  MapPin,
  Route,
  Sparkles
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Layout from "@/components/Layout";

const SmartCity = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeData, setRouteData] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
    generateMockOptimization();
  }, []);

  const fetchMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: metricsData } = await supabase
      .from('metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (metricsData) setMetrics(metricsData);
  };

  const generateMockOptimization = () => {
    setOptimizationData({
      trafficFlow: 72,
      energyEfficiency: 85,
      waterManagement: 68,
      greenSpaces: 45,
      publicTransport: 78,
      recommendations: [
        "Increase green corridor coverage by 15% in Zone A",
        "Optimize traffic light timing at 5 key intersections",
        "Install solar panels on 3 municipal buildings",
        "Expand bike lanes in downtown area",
        "Upgrade water recycling infrastructure"
      ],
      zones: [
        { name: "Downtown", efficiency: 82, co2: 145, population: 12500 },
        { name: "Industrial", efficiency: 65, co2: 280, population: 8300 },
        { name: "Residential", efficiency: 78, co2: 95, population: 25600 },
        { name: "Commercial", efficiency: 71, co2: 168, population: 9800 }
      ]
    });
  };

  const handleRouteCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate route calculation with eco-metrics
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setRouteData({
        routes: [
          {
            name: "Eco-Optimized Route",
            distance: "12.5 km",
            time: "18 min",
            co2: "2.1 kg",
            cost: "$3.50",
            type: "eco",
            savings: "35%"
          },
          {
            name: "Public Transport",
            distance: "14.2 km",
            time: "25 min",
            co2: "0.8 kg",
            cost: "$2.00",
            type: "transit",
            savings: "62%"
          },
          {
            name: "Standard Route",
            distance: "11.8 km",
            time: "15 min",
            co2: "3.2 kg",
            cost: "$4.20",
            type: "standard",
            savings: "0%"
          }
        ],
        evStations: [
          { name: "Green Charge Hub", distance: "0.5 km", available: 3 },
          { name: "Solar Power Station", distance: "2.1 km", available: 5 }
        ]
      });

      toast({
        title: "Routes calculated!",
        description: "Eco-optimized routes are ready",
      });
    } catch (error: any) {
      toast({
        title: "Calculation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const zoneChartData = optimizationData?.zones || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Smart City Hub</h1>
          <p className="text-muted-foreground">Eco-routing and urban optimization powered by AI</p>
        </div>

        <Tabs defaultValue="routing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="routing" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              Eco-Routing
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Urban Optimization
            </TabsTrigger>
          </TabsList>

          {/* ECO-ROUTING TAB */}
          <TabsContent value="routing" className="space-y-6">
            {/* Route Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  <span>Calculate Eco-Route</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRouteCalculation} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Starting Point</Label>
                      <Input
                        id="origin"
                        placeholder="Enter origin address"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination</Label>
                      <Input
                        id="destination"
                        placeholder="Enter destination address"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Calculating..." : "Find Eco-Routes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Route Options */}
            {routeData && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  {routeData.routes.map((route: any, index: number) => (
                    <Card key={index} className={route.type === 'eco' ? 'border-primary' : ''}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          {route.name}
                          {route.type === 'eco' && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Recommended
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className="font-semibold">{route.distance}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-semibold">{route.time}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CO₂ Emissions:</span>
                          <span className="font-semibold text-green-600">{route.co2}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-semibold">{route.cost}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-sm text-primary font-semibold">
                            {route.savings} Carbon Savings
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* EV Charging Stations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span>Nearby EV Charging Stations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {routeData.evStations.map((station: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-semibold">{station.name}</p>
                              <p className="text-sm text-muted-foreground">{station.distance} from route</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {station.available} available
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* URBAN OPTIMIZATION TAB */}
          <TabsContent value="optimization" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Traffic Flow</CardTitle>
                  <Car className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimizationData?.trafficFlow}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Efficiency</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Energy Grid</CardTitle>
                  <Zap className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimizationData?.energyEfficiency}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Renewable</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Water System</CardTitle>
                  <Droplets className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimizationData?.waterManagement}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Optimized</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Green Spaces</CardTitle>
                  <Trees className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimizationData?.greenSpaces}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Coverage</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Public Transit</CardTitle>
                  <Navigation className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimizationData?.publicTransport}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Usage</p>
                </CardContent>
              </Card>
            </div>

            {/* Zone Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>City Zone Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={zoneChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="efficiency" fill="hsl(var(--primary))" name="Efficiency %" />
                    <Bar dataKey="co2" fill="#6b7280" name="CO₂ (kg/day)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Zone Details */}
            <Card>
              <CardHeader>
                <CardTitle>Zone Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationData?.zones.map((zone: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{zone.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Population: {zone.population.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{zone.efficiency}%</div>
                          <div className="text-xs text-muted-foreground">Efficiency</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">CO₂ Emissions:</span>
                          <span className="ml-2 font-semibold">{zone.co2} kg/day</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Per Capita:</span>
                          <span className="ml-2 font-semibold">
                            {((zone.co2 / zone.population) * 1000).toFixed(2)} g/day
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>AI-Powered Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {optimizationData?.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SmartCity;
