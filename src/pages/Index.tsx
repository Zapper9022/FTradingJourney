
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StrategyCard from "@/components/StrategyCard";
import CreateStrategyModal from "@/components/CreateStrategyModal";
import ActiveChecklist from "@/components/ActiveChecklist";

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

const defaultStrategy: TradingStrategy = {
  id: "default",
  name: "Sector Momentum Strategy",
  description: "Default trading strategy focusing on sector strength and volume analysis",
  checklist: [
    { id: "1", text: "Check sector strength", completed: false },
    { id: "2", text: "Check sector top 5 stocks", completed: false },
    { id: "3", text: "Check pre-market time and sales - active buy > active sell by 2x", completed: false },
    { id: "4", text: "Check turnover rate > 20% in active trading session", completed: false },
    { id: "5", text: "Check volume breakout from 50-day AVOL", completed: false },
    { id: "6", text: "Check volume ratio > 2.5%", completed: false },
    { id: "7", text: "Check price above EMA 10 and 5", completed: false },
  ],
  createdAt: new Date(),
  completedTrades: 0,
};

const Index = () => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([defaultStrategy]);
  const [activeStrategy, setActiveStrategy] = useState<TradingStrategy | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentTicker, setCurrentTicker] = useState<string>("");
  const navigate = useNavigate();

  const handleCreateStrategy = (name: string, description: string, checklist: string[]) => {
    const newStrategy: TradingStrategy = {
      id: Date.now().toString(),
      name,
      description,
      checklist: checklist.map((item, index) => ({
        id: (index + 1).toString(),
        text: item,
        completed: false,
      })),
      createdAt: new Date(),
      completedTrades: 0,
    };
    setStrategies([...strategies, newStrategy]);
    setIsCreateModalOpen(false);
  };

  const handleStartChecklist = (strategy: TradingStrategy) => {
    const resetStrategy = {
      ...strategy,
      checklist: strategy.checklist.map(item => ({ ...item, completed: false }))
    };
    setActiveStrategy(resetStrategy);
    setCurrentTicker("");
  };

  const handleCompleteChecklist = () => {
    if (activeStrategy) {
      // Create new trade
      const newTrade: Trade = {
        id: Date.now().toString(),
        strategyId: activeStrategy.id,
        ticker: currentTicker,
        entryPrice: null,
        exitPrice: null,
        entryDate: new Date(),
        exitDate: null,
        pnl: null,
        isOpen: true
      };

      // Save trade to localStorage
      const existingTrades = JSON.parse(localStorage.getItem('trades') || '[]');
      localStorage.setItem('trades', JSON.stringify([...existingTrades, newTrade]));

      // Update strategy completedTrades count
      setStrategies(strategies.map(s => 
        s.id === activeStrategy.id 
          ? { ...s, completedTrades: s.completedTrades + 1 }
          : s
      ));
      
      // Save updated strategies to localStorage
      localStorage.setItem('strategies', JSON.stringify(strategies.map(s => 
        s.id === activeStrategy.id 
          ? { ...s, completedTrades: s.completedTrades + 1 }
          : s
      )));

      setActiveStrategy(null);
      setCurrentTicker("");
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

  const completedItems = activeStrategy?.checklist.filter(item => item.completed).length || 0;
  const totalItems = activeStrategy?.checklist.length || 0;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const navigateToTradesHistory = () => {
    navigate('/trades');
  };

  // Load strategies from localStorage on initial render
  React.useEffect(() => {
    const savedStrategies = localStorage.getItem('strategies');
    if (savedStrategies) {
      setStrategies(JSON.parse(savedStrategies));
    } else {
      localStorage.setItem('strategies', JSON.stringify([defaultStrategy]));
    }
  }, []);

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
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-8 h-8 text-green-400 mr-2" />
            <h1 className="text-3xl font-bold text-white">Trading Journal</h1>
          </div>
          <p className="text-slate-300">Master your trading strategies</p>
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
          <Card className="bg-slate-800/50 border-slate-700">
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
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Strategy
            </Button>
          </div>

          <div className="space-y-3">
            {strategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onStart={() => handleStartChecklist(strategy)}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleStartChecklist(defaultStrategy)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Default Strategy
            </Button>
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
