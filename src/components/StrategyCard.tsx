
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle } from "lucide-react";
import { TradingStrategy } from "@/pages/Index";

interface StrategyCardProps {
  strategy: TradingStrategy;
  onStart: () => void;
}

const StrategyCard = ({ strategy, onStart }: StrategyCardProps) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-1">{strategy.name}</CardTitle>
            {strategy.description && (
              <p className="text-slate-400 text-sm">{strategy.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {strategy.checklist.length} steps
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-green-400">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>{strategy.completedTrades} trades</span>
            </div>
          </div>
          <Button
            onClick={onStart}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play className="w-4 h-4 mr-1" />
            Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyCard;
