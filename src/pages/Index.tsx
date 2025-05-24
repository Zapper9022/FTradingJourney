
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, CheckCircle, Clock, BarChart3, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StrategyCard from "@/components/StrategyCard";
import CreateStrategyModal from "@/components/CreateStrategyModal";
import ActiveChecklist from "@/components/ActiveChecklist";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Trade {
  id: string;
  strategyId: string;
  ticker: string;
  entryPrice: number | null;
  exitPrice: number | null;
  entryDate: Date;
  exitDate: Date | null;
  pnl: number | null;
  pnlValue: number | null;
  sharesQuantity: number | null;
  isOpen: boolean;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description?: string;
  checklist: ChecklistItem[];
  createdAt: Date;
  completedTrades: number;
}

const Index = () => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<TradingStrategy | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentTicker, setCurrentTicker] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStrategies();
    }
  }, [user]);

  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedStrategies = data.map(strategy => ({
          id: strategy.id,
          name: strategy.name,
          description: strategy.description || undefined,
          checklist: strategy.checklist as unknown as ChecklistItem[],
          createdAt: new Date(strategy.created_at),
          completedTrades: strategy.completed_trades
        }));
        setStrategies(formattedStrategies);
      }
    } catch (error: any) {
      toast.error("Error loading strategies: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStrategy = async (name: string, description: string, checklist: string[]) => {
    try {
      const checklistItems = checklist.map((item, index) => ({
        id: (index + 1).toString(),
        text: item,
        completed: false,
      }));

      const { data, error } = await supabase
        .from('strategies')
        .insert([
          {
            name,
            description: description || null,
            checklist: checklistItems,
            user_id: user!.id,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Strategy created successfully!");
      fetchStrategies();
    } catch (error: any) {
      toast.error("Error creating strategy: " + error.message);
    } finally {
      setIsCreateModalOpen(false);
    }
  };

  const handleStartChecklist = (strategy: TradingStrategy) => {
    const resetStrategy = {
      ...strategy,
      checklist: strategy.checklist.map(item => ({ ...item, completed: false }))
    };
    setActiveStrategy(resetStrategy);
    setCurrentTicker("");
  };

  const handleCompleteChecklist = async () => {
    if (activeStrategy && user) {
      try {
        // Create new trade in Supabase
        const { error } = await supabase
          .from('trades')
          .insert([
            {
              strategy_id: activeStrategy.id,
              ticker: currentTicker,
              is_open: true,
              user_id: user.id
            },
          ]);

        if (error) {
          throw error;
        }

        // Update strategy completed_trades count
        await supabase
          .from('strategies')
          .update({ completed_trades: activeStrategy.completedTrades + 1 })
          .eq('id', activeStrategy.id);

        toast.success("Trade started successfully!");
        
        // Refresh strategies to get updated count
        fetchStrategies();
        setActiveStrategy(null);
        setCurrentTicker("");
      } catch (error: any) {
        toast.error("Error creating trade: " + error.message);
      }
    }
  };

  const updateChecklistItem = (itemId: string, completed: boolean) => {
    if (activeStrategy) {
      setActiveStrategy({
        ...activeStrategy,
        checklist: activeStrategy.checklist.map(item =>
          item.id === itemId ? { ...item, completed } : item
        )
      });
    }
  };

  const handleTickerChange = (ticker: string) => {
    setCurrentTicker(ticker.toUpperCase());
  };

  const navigateToTradesHistory = () => {
    navigate('/trades');
  };

  const navigateToStrategiesManagement = () => {
    navigate('/strategies');
  };

  const completedItems = activeStrategy?.checklist.filter(item => item.completed).length || 0;
  const totalItems = activeStrategy?.checklist.length || 0;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (activeStrategy) {
    return (
      <ActiveChecklist
        strategy={activeStrategy}
        onComplete={handleCompleteChecklist}
        onBack={() => setActiveStrategy(null)}
        onUpdateItem={updateChecklistItem}
        progressPercentage={progressPercentage}
        ticker={currentTicker}
        onTickerChange={handleTickerChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Centered Header with User Menu */}
        <div className="flex flex-col items-center py-6">
          <div className="flex items-center justify-center w-full mb-2">
            <TrendingUp className="w-8 h-8 text-green-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">FTrading Journal</h1>
          </div>
          <p className="text-slate-300 text-center">Master your trading strategies</p>
          <div className="absolute top-4 right-4">
            <UserMenu />
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors" onClick={navigateToTradesHistory}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {strategies.reduce((acc, s) => acc + s.completedTrades, 0)}
              </div>
              <div className="text-sm text-slate-400">Total Trades</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors" onClick={navigateToStrategiesManagement}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{strategies.length}</div>
              <div className="text-sm text-slate-400">Strategies</div>
            </CardContent>
          </Card>
        </div>

        {/* Strategies Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Trading Strategies</h2>
            <div className="flex space-x-2">
              <Button
                onClick={navigateToStrategiesManagement}
                size="sm"
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Settings className="w-4 h-4 mr-1" />
                Manage
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-slate-400">Loading strategies...</div>
            </div>
          ) : strategies.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 p-6 text-center">
              <p className="text-slate-400 mb-4">No strategies found</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Your First Strategy
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onStart={() => handleStartChecklist(strategy)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={navigateToTradesHistory}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              View All Trades
            </Button>
          </CardContent>
        </Card>
      </div>

      <CreateStrategyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateStrategy}
      />
    </div>
  );
};

export default Index;
