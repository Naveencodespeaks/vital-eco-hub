import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonCard = ({ className = "" }: { className?: string }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
};

export const SkeletonStat = () => {
  return (
    <div className="p-5 bg-muted/20 rounded-xl border animate-pulse">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-28 mt-2" />
    </div>
  );
};

export const SkeletonChart = () => {
  return (
    <Card className="bg-card/80 backdrop-blur-md">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 animate-pulse" 
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const SkeletonInterventionCard = () => {
  return (
    <div className="p-4 bg-muted/20 rounded-lg border animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonEdge = () => {
  return (
    <div className="p-3 bg-muted/20 rounded-lg border animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
};
