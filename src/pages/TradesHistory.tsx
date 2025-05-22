
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, Clock, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Trade } from "./Index";
import { format } from "date-fns";

const TradesHistory = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load trades from localStorage
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      setTrades(JSON.parse(savedTrades).map((trade: any) => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : null
      })));
    }
  }, []);

  const goBack = () => {
    navigate('/');
  };

  const viewTradeDetails = (tradeId: string) => {
    navigate(`/trades/${tradeId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
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
            <h1 className="text-xl font-semibold text-white">Trading History</h1>
            <p className="text-slate-400 text-sm">View and manage your past trades</p>
          </div>
        </div>

        {/* Trades List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No trades recorded yet</p>
                <Button 
                  onClick={goBack}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start a New Trade
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Ticker</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 text-right">P&L</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow 
                        key={trade.id} 
                        className="border-slate-700 cursor-pointer hover:bg-slate-700/30"
                        onClick={() => viewTradeDetails(trade.id)}
                      >
                        <TableCell className="font-medium text-white">
                          {trade.ticker}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {format(trade.entryDate, 'MMM d')}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            trade.isOpen 
                              ? 'bg-blue-900/30 text-blue-400 border border-blue-800/30' 
                              : 'bg-green-900/30 text-green-400 border border-green-800/30'
                          }`}>
                            {trade.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {trade.pnl !== null ? (
                            <span className={`flex items-center justify-end ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? 
                                <TrendingUp className="w-4 h-4 mr-1" /> : 
                                <TrendingDown className="w-4 h-4 mr-1" />
                              }
                              {trade.pnl.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
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
    </div>
  );
};

export default TradesHistory;
