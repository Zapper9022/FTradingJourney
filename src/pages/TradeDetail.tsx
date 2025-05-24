
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, DollarSign, Briefcase, TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { Trade } from "./Index";
import { format } from "date-fns";
import { toast } from "sonner";
import ApiKeyInput from "@/components/ApiKeyInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TradeDetail = () => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [currentPrice, setCurrentPrice] = useState<string>("");
  const [sharesQuantity, setSharesQuantity] = useState<string>("0");
  const [pnl, setPnl] = useState<number | null>(null);
  const [pnlValue, setPnlValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Default API key
  const defaultApiKey = "6a76194845mshbae6da7834eba7dp19b948jsnce44c51e371b";

  useEffect(() => {
    // Check if API key exists in localStorage or use default
    const storedKey = localStorage.getItem("rapidapi_key");
    if (storedKey) {
      setApiKey(storedKey);
      setHasApiKey(true);
    } else {
      // Auto-set default key if none exists
      localStorage.setItem("rapidapi_key", defaultApiKey);
      setApiKey(defaultApiKey);
      setHasApiKey(true);
    }

    // Fetch trade from Supabase
    if (tradeId && user) {
      fetchTradeFromSupabase();
    }
  }, [tradeId, user, defaultApiKey]);

  // New useEffect hook to fetch current price whenever trade changes
  useEffect(() => {
    // If we have both a trade with a ticker and an API key, fetch the price automatically
    if (trade?.ticker && apiKey && hasApiKey) {
      console.log(`Auto-fetching price for ${trade.ticker} on component mount...`);
      fetchCurrentPrice(trade.ticker, apiKey);
    }
  }, [trade, apiKey, hasApiKey]);

  const fetchTradeFromSupabase = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const fetchedTrade = {
          id: data.id,
          strategyId: data.strategy_id,
          ticker: data.ticker,
          entryPrice: data.entry_price,
          exitPrice: data.exit_price,
          entryDate: new Date(data.entry_date),
          exitDate: data.exit_date ? new Date(data.exit_date) : null,
          pnl: data.pnl,
          pnlValue: data.pnl_value,
          sharesQuantity: data.shares_quantity || 0,
          isOpen: data.is_open
        };
        
        setTrade(fetchedTrade);
        if (fetchedTrade.entryPrice) {
          setEntryPrice(fetchedTrade.entryPrice.toString());
        }
        if (fetchedTrade.pnl !== null) {
          setPnl(fetchedTrade.pnl);
        }
        if (fetchedTrade.sharesQuantity) {
          setSharesQuantity(fetchedTrade.sharesQuantity.toString());
        }
        
        // Auto-fetch current price with default or stored API key
        if (fetchedTrade.ticker) {
          fetchCurrentPrice(fetchedTrade.ticker, apiKey);
        }
      }
    } catch (error: any) {
      console.error("Error fetching trade:", error);
      toast.error("Error loading trade: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigate('/trades');
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setHasApiKey(true);
    
    // Fetch price with new API key if trade exists
    if (trade?.ticker) {
      fetchCurrentPrice(trade.ticker, key);
    }
  };

  // Function to clean and format ticker symbols for API compatibility
  const formatTickerSymbol = (ticker: string) => {
    // Fix common ticker issues (like APPL instead of AAPL)
    const commonFixes: Record<string, string> = {
      'APPL': 'AAPL',
      'GOOG': 'GOOGL',
      'FB': 'META',
      'TWTR': 'X'
    };
    
    const cleanedTicker = ticker.trim().toUpperCase();
    return commonFixes[cleanedTicker] || cleanedTicker;
  };

  const fetchCurrentPrice = async (ticker: string, key: string) => {
    setIsLoading(true);
    const formattedTicker = formatTickerSymbol(ticker);
    
    try {
      console.log(`Fetching price for ticker: ${formattedTicker}`);
      
      // Using Alpha Vantage API endpoint with the provided key
      const response = await fetch(
        `https://alpha-vantage.p.rapidapi.com/query?function=GLOBAL_QUOTE&symbol=${formattedTicker}&datatype=json`, 
        {
          headers: {
            'x-rapidapi-host': 'alpha-vantage.p.rapidapi.com',
            'x-rapidapi-key': key,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stock data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      if (data && data["Global Quote"] && data["Global Quote"]["05. price"]) {
        // Alpha Vantage format
        const price = parseFloat(data["Global Quote"]["05. price"]);
        setCurrentPrice(price.toString());
        
        // Calculate PnL automatically if we have entry price
        if (entryPrice) {
          calculatePnLWithPrice(parseFloat(entryPrice), price);
        }
        
        toast.success(`Current price for ${ticker}: $${price.toFixed(2)}`);
      } else if (data && data.Note) {
        // API limit reached
        throw new Error(`API limit reached: ${data.Note}`);
      } else {
        throw new Error('No price data available for this ticker');
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      
      let errorMessage = "Could not fetch current price. Please try again later.";
      if (error instanceof Error) {
        if (error.message.includes("API limit")) {
          errorMessage = "API call limit reached. Please try again in a minute or update manually.";
        } else if (error.message.includes("ticker")) {
          errorMessage = "No data available for this ticker symbol. Please check if it's correct.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePnLWithPrice = (entry: number, current: number) => {
    if (!entry || !current || entry <= 0 || current <= 0) {
      return;
    }
    
    const calculatedPnl = ((current - entry) / entry) * 100;
    setPnl(calculatedPnl);
    
    // Calculate PnL value if shares quantity is provided
    const shares = parseFloat(sharesQuantity || "0");
    if (shares > 0) {
      const pnlVal = shares * (current - entry);
      setPnlValue(pnlVal);
    }
  };

  const calculatePnL = () => {
    if (!entryPrice || !currentPrice || parseFloat(entryPrice) <= 0 || parseFloat(currentPrice) <= 0) {
      return;
    }

    const entry = parseFloat(entryPrice);
    const current = parseFloat(currentPrice);
    
    calculatePnLWithPrice(entry, current);

    // Update trade in Supabase
    if (trade && user) {
      updateTradeInSupabase({
        entryPrice: entry,
        pnl: pnl,
        sharesQuantity: parseFloat(sharesQuantity || "0"),
      });
    }
  };

  const updateTradeInSupabase = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          entry_price: updates.entryPrice,
          pnl: updates.pnl,
          shares_quantity: updates.sharesQuantity,
          is_open: true
        })
        .eq('id', tradeId);

      if (error) throw error;

      // Update local trade state
      setTrade(prev => prev ? {
        ...prev,
        entryPrice: updates.entryPrice,
        pnl: updates.pnl,
        sharesQuantity: updates.sharesQuantity,
        isOpen: true
      } : null);

      toast.success("Trade updated successfully");
    } catch (error: any) {
      console.error("Error updating trade:", error);
      toast.error("Error updating trade: " + error.message);
    }
  };

  const closeTrade = async () => {
    if (!trade || !entryPrice || !currentPrice) return;

    const entry = parseFloat(entryPrice);
    const current = parseFloat(currentPrice);
    const calculatedPnl = ((current - entry) / entry) * 100;
    const shares = parseFloat(sharesQuantity || "0");
    const pnlVal = shares > 0 ? shares * (current - entry) : null;

    try {
      const { error } = await supabase
        .from('trades')
        .update({
          entry_price: entry,
          exit_price: current,
          exit_date: new Date().toISOString(),
          pnl: calculatedPnl,
          pnl_value: pnlVal,
          shares_quantity: shares,
          is_open: false
        })
        .eq('id', tradeId);

      if (error) throw error;

      // Update local state
      setTrade(prev => prev ? {
        ...prev,
        entryPrice: entry,
        exitPrice: current,
        exitDate: new Date(),
        pnl: calculatedPnl,
        pnlValue: pnlVal,
        sharesQuantity: shares,
        isOpen: false
      } : null);

      toast.success(`${trade.ticker} trade closed with ${calculatedPnl.toFixed(2)}% P&L`);
    } catch (error: any) {
      console.error("Error closing trade:", error);
      toast.error("Error closing trade: " + error.message);
    }
  };

  const refreshPrice = () => {
    if (trade?.ticker && apiKey) {
      fetchCurrentPrice(trade.ticker, apiKey);
    }
  };

  // Loading state
  if (isLoading && !trade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300 mb-4">Loading trade information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-slate-300 mb-4">Trade not found</p>
            <Button onClick={goBack} className="bg-blue-600 hover:bg-blue-700 text-white">
              Back to Trades
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If API key is not set, show the API key input form
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
        <div className="max-w-md mx-auto space-y-6">
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
              <h1 className="text-xl font-semibold text-white">API Setup Required</h1>
            </div>
          </div>
          
          <ApiKeyInput onKeySubmit={handleApiKeySubmit} />
        </div>
      </div>
    );
  }

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
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white mr-2">{trade?.ticker}</h1>
              {trade && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  trade.isOpen 
                    ? 'bg-blue-900/30 text-blue-400 border border-blue-800/30' 
                    : 'bg-green-900/30 text-green-400 border border-green-800/30'
                }`}>
                  {trade.isOpen ? 'Open' : 'Closed'}
                </span>
              )}
            </div>
            {trade && (
              <p className="text-slate-400 text-sm">
                Entered on {format(trade.entryDate, 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Trade Details */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
              Trade Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="entry-price" className="text-sm text-slate-300 mb-1 block">
                Entry Price
              </Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <Input
                  id="entry-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={!trade.isOpen && trade.entryPrice !== null}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="shares-quantity" className="text-sm text-slate-300 mb-1 block">
                Number of Shares
              </Label>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-green-400" />
                <Input
                  id="shares-quantity"
                  type="number"
                  step="1"
                  min="0"
                  value={sharesQuantity}
                  onChange={(e) => setSharesQuantity(e.target.value)}
                  placeholder="0"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={!trade.isOpen && trade.entryPrice !== null}
                />
              </div>
            </div>

            {trade.isOpen && (
              <div>
                <Label htmlFor="current-price" className="text-sm text-slate-300 mb-1 block">
                  Current Price
                </Label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <Input
                    id="current-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    placeholder="0.00"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={refreshPrice} 
                    disabled={isLoading}
                    className="h-10 w-10 border-slate-600 text-blue-400 hover:text-blue-300"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            )}

            {!trade.isOpen && trade.exitPrice && (
              <div>
                <Label className="text-sm text-slate-300 mb-1 block">
                  Exit Price
                </Label>
                <div className="flex items-center space-x-2 bg-slate-700/50 rounded-md p-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <span className="text-white">${trade.exitPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {!trade.isOpen && trade.exitDate && (
              <div>
                <Label className="text-sm text-slate-300 mb-1 block">
                  Exit Date
                </Label>
                <div className="flex items-center space-x-2 bg-slate-700/50 rounded-md p-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-white">
                    {format(trade.exitDate, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* P&L Display */}
        {pnl !== null && (
          <Card className={`border-t-4 ${pnl >= 0 ? 'border-t-green-500' : 'border-t-red-500'} bg-slate-800/50 border-slate-700`}>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-lg text-slate-300 mb-2">Profit & Loss</h2>
                <div className={`text-3xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center justify-center mb-2`}>
                  {pnl >= 0 ? 
                    <TrendingUp className="w-6 h-6 mr-2" /> : 
                    <TrendingDown className="w-6 h-6 mr-2" />
                  }
                  {pnl.toFixed(2)}%
                </div>
                
                {/* P&L Value Display */}
                {pnlValue !== null && parseFloat(sharesQuantity) > 0 && (
                  <div className={`text-xl ${pnlValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${Math.abs(pnlValue).toFixed(2)} {pnlValue >= 0 ? 'profit' : 'loss'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {trade.isOpen && (
            <>
              <Button
                onClick={calculatePnL}
                disabled={!entryPrice || !currentPrice}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Calculate P&L
              </Button>
              
              <Button
                onClick={closeTrade}
                disabled={!entryPrice || !currentPrice}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Close Trade
              </Button>
            </>
          )}
          
          <Button
            onClick={goBack}
            variant="outline"
            className="w-full text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
          >
            Back to Trades
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradeDetail;
