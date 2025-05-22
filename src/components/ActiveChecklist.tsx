
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Target } from "lucide-react";
import { TradingStrategy } from "@/pages/Index";

interface ActiveChecklistProps {
  strategy: TradingStrategy;
  onComplete: () => void;
  onBack: () => void;
  onUpdateItem: (itemId: string, completed: boolean) => void;
  progressPercentage: number;
}

const ActiveChecklist = ({ 
  strategy, 
  onComplete, 
  onBack, 
  onUpdateItem, 
  progressPercentage 
}: ActiveChecklistProps) => {
  const allCompleted = strategy.checklist.every(item => item.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">{strategy.name}</h1>
            <p className="text-slate-400 text-sm">Complete all steps before trading</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Progress</span>
              <span className="text-sm font-medium text-blue-400">
                {strategy.checklist.filter(item => item.completed).length} / {strategy.checklist.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-400" />
              Trading Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategy.checklist.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  item.completed 
                    ? 'bg-green-900/20 border border-green-700/30' 
                    : 'bg-slate-700/30 hover:bg-slate-700/50'
                }`}
              >
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={(checked) => 
                    onUpdateItem(item.id, checked as boolean)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-blue-400">
                      Step {index + 1}
                    </span>
                  </div>
                  <label
                    htmlFor={item.id}
                    className={`block text-sm cursor-pointer transition-colors ${
                      item.completed 
                        ? 'text-green-300 line-through' 
                        : 'text-slate-200'
                    }`}
                  >
                    {item.text}
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Complete Button */}
        <Button
          onClick={onComplete}
          disabled={!allCompleted}
          className={`w-full py-3 text-white font-medium ${
            allCompleted
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-slate-600 cursor-not-allowed'
          }`}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          {allCompleted ? 'Complete & Record Trade' : 'Complete All Steps First'}
        </Button>

        {allCompleted && (
          <div className="text-center">
            <p className="text-green-400 text-sm font-medium">
              ✅ All checks passed! Ready to trade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveChecklist;
