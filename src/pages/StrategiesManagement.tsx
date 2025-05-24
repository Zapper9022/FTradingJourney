
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Award } from "lucide-react";
import { TradingStrategy } from "./Index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import EditStrategyModal from "@/components/EditStrategyModal";

interface StrategyWithStats extends TradingStrategy {
  totalTrades: number;
  winningTrades: number;
  winRate: number;
}

const StrategiesManagement = () => {
  const [strategies, setStrategies] = useState<StrategyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [strategyToEdit, setStrategyToEdit] = useState<TradingStrategy | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStrategiesWithStats();
    }
  }, [user]);

  const fetchStrategiesWithStats = async () => {
    try {
      setIsLoading(true);
      
      // Get strategies
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (strategiesError) throw strategiesError;

      // Get trades to calculate win rates
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('strategy_id, pnl');

      if (tradesError) throw tradesError;

      // Process strategies with statistics
      if (strategiesData) {
        const enhancedStrategies: StrategyWithStats[] = strategiesData.map(strategy => {
          const strategyTrades = tradesData?.filter(trade => 
            trade.strategy_id === strategy.id && trade.pnl !== null
          ) || [];
          
          const totalTrades = strategyTrades.length;
          const winningTrades = strategyTrades.filter(trade => trade.pnl > 0).length;
          const winRate = totalTrades > 0 
            ? (winningTrades / totalTrades) * 100 
            : 0;

          return {
            id: strategy.id,
            name: strategy.name,
            description: strategy.description || undefined,
            checklist: strategy.checklist as unknown as ChecklistItem[],
            createdAt: new Date(strategy.created_at),
            completedTrades: strategy.completed_trades,
            totalTrades,
            winningTrades,
            winRate
          };
        });

        setStrategies(enhancedStrategies);
      }
    } catch (error: any) {
      toast.error("Failed to load strategies: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStrategy = async () => {
    if (!strategyToDelete) return;
    
    try {
      // Check if strategy has related trades
      const { count, error: countError } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('strategy_id', strategyToDelete);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error("Cannot delete a strategy with existing trades");
        return;
      }

      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', strategyToDelete);

      if (error) throw error;

      toast.success("Strategy deleted successfully");
      fetchStrategiesWithStats(); // Refresh the list
    } catch (error: any) {
      toast.error("Failed to delete strategy: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setStrategyToDelete(null);
    }
  };

  const confirmDelete = (strategyId: string) => {
    setStrategyToDelete(strategyId);
    setDeleteDialogOpen(true);
  };

  const handleEditStrategy = (strategy: TradingStrategy) => {
    setStrategyToEdit(strategy);
    setEditModalOpen(true);
  };

  const handleUpdateStrategy = async (
    name: string, 
    description: string, 
    checklist: any[]
  ) => {
    if (!strategyToEdit) return;
    
    try {
      const { error } = await supabase
        .from('strategies')
        .update({ 
          name, 
          description: description || null, 
          checklist 
        })
        .eq('id', strategyToEdit.id);

      if (error) throw error;

      toast.success("Strategy updated successfully");
      fetchStrategiesWithStats(); // Refresh the list
      setEditModalOpen(false);
      setStrategyToEdit(null);
    } catch (error: any) {
      toast.error("Failed to update strategy: " + error.message);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">Strategy Management</h1>
            <p className="text-slate-400 text-sm">Manage your trading strategies and view performance</p>
          </div>
        </div>

        {/* Strategies List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-400" />
              Your Trading Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-slate-400">Loading strategies...</p>
              </div>
            ) : strategies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No strategies found</p>
                <Button 
                  onClick={goBack}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Your First Strategy
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Strategy</TableHead>
                      <TableHead className="text-slate-300">Description</TableHead>
                      <TableHead className="text-slate-300 text-center">Trades</TableHead>
                      <TableHead className="text-slate-300 text-center">Win Rate</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((strategy) => (
                      <TableRow key={strategy.id} className="border-slate-700">
                        <TableCell className="font-medium text-white">
                          {strategy.name}
                        </TableCell>
                        <TableCell className="text-slate-300 max-w-[200px] truncate">
                          {strategy.description || "-"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-center">
                          {strategy.totalTrades}
                        </TableCell>
                        <TableCell className="text-slate-300 text-center">
                          <span className={`${
                            strategy.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {strategy.totalTrades > 0 
                              ? `${strategy.winRate.toFixed(1)}%`
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStrategy(strategy)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(strategy.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              disabled={strategy.completedTrades > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={goBack}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete this trading strategy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStrategy}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Strategy Modal */}
      {strategyToEdit && (
        <EditStrategyModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setStrategyToEdit(null);
          }}
          onUpdate={handleUpdateStrategy}
          strategy={strategyToEdit}
        />
      )}
    </div>
  );
};

export default StrategiesManagement;
