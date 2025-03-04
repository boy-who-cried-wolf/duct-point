
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BookOpen, Users, Activity } from "lucide-react";

interface StatCardsProps {
  stats: Array<{
    title: string;
    value: string;
    description: string;
    icon: string;
    trend: string;
    trendUp: boolean | null;
  }>;
}

const StatCards = ({ stats }: StatCardsProps) => {
  // Map icon strings to their component versions
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "TrendingUp": return TrendingUp;
      case "BookOpen": return BookOpen;
      case "Users": return Users;
      case "Activity": return Activity;
      default: return Activity;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((card, index) => {
        const IconComponent = getIconComponent(card.icon);
        
        return (
          <Card key={index} className="overflow-hidden card-hover shadow-none border-none bg-slate-50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {card.trend && <p className={`text-xs mt-2 ${card.trendUp === true ? 'text-green-500' : card.trendUp === false ? 'text-red-500' : 'text-muted-foreground'}`}>
                {card.trend}
              </p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatCards;
