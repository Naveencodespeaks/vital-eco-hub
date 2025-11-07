import { Badge } from "@/components/ui/badge";
import { Leaf, Award, Globe } from "lucide-react";

interface PointsBadgeProps {
  level: string;
}

export default function PointsBadge({ level }: PointsBadgeProps) {
  const getBadgeConfig = (level: string) => {
    switch (level) {
      case 'Earth Guardian':
        return {
          icon: Globe,
          className: 'bg-gradient-to-r from-blue-500 to-green-500 text-white border-0',
          label: 'Earth Guardian'
        };
      case 'Green Hero':
        return {
          icon: Award,
          className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0',
          label: 'Green Hero'
        };
      default:
        return {
          icon: Leaf,
          className: 'bg-primary/10 text-primary border-primary/20',
          label: 'Eco Starter'
        };
    }
  };

  const config = getBadgeConfig(level);
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
