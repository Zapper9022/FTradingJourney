
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, DollarSign, Briefcase, TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { Trade } from "./Index";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import ApiKeyInput from "@/components/ApiKeyInput";

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

    // Load trade from localStorage
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      const parsedTrades = JSON.parse(savedTrades).map((t: any) => ({
        ...t,
        entryDate: new Date(t.entryDate),
        exitDate: t.exitDate ? new Date(t.exitDate) : null
      }));
      
      const foundTrade = parsedTrades.find((t: Trade) => t.id === tradeId);
      if (foundTrade) {
        setTrade(foundTrade);
        if (foundTrade.entryPrice) {
          setEntryPrice(foundTrade.entryPrice.toString());
        }
        if (foundTrade.pnl !== null) {
          setPnl(foundTrade.pnl);
        }
        
        // Set shares quantity if exists
        if (foundTrade.sharesQuantity) {
          setSharesQuantity(foundTrade.sharesQuantity.toString());
        }
        
        // Auto-fetch current price with default or stored API key
        if (foundTrade.ticker && (storedKey || defaultApiKey)) {
          const keyToUse = storedKey || defaultApiKey;
          fetchCurrentPrice(foundTrade.ticker, keyToUse);
        }
      }
    }
  }, [tradeId, defaultApiKey]);

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

  const fetchCurrentPrice = async (ticker: string, key: string) => {
    setIsLoading(true);
    try {
      // Using RapidAPI endpoint with the provided key
      const response = await fetch(
        `https://latest-stock-price.p.rapidapi.com/timeseries?Symbol=${ticker}&Timescale=1&Period=1DAY`, 
        {
          headers: {
            'x-rapidapi-host': 'latest-stock-price.p.rapidapi.com',
            'x-rapidapi-key': key,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        // RapidAPI format
        const price = data[0].Last;
        setCurrentPrice(price.toString());
        
        // Calculate PnL automatically if we have entry price
        if (entryPrice) {
          calculatePnLWithPrice(parseFloat(entryPrice), price);
        }
        
        toast({
          title: "Price Updated",
          description: `Current price for ${ticker}: $${parseFloat(price).toFixed(2)}`,
        });
      } else {
        throw new Error('No price data available');
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast({
        title: "API Error",
        description: "The API may have usage limits. You can try updating the price manually.",
        variant: "destructive",
      });
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

    // Update trade in localStorage
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades && trade) {
      const parsedTrades = JSON.parse(savedTrades);
      const updatedTrades = parsedTrades.map((t: Trade) => 
        t.id === trade.id 
          ? { 
              ...t, 
              entryPrice: entry,
              pnl: pnl,
              sharesQuantity: parseFloat(sharesQuantity || "0"),
              isOpen: true
            } 
          : t
      );
      localStorage.setItem('trades', JSON.stringify(updatedTrades));
      
      // Update current trade
      setTrade({
        ...trade,
        entryPrice: entry,
        pnl: pnl,
        sharesQuantity: parseFloat(sharesQuantity || "0"),
        isOpen: true
      });
    }
  };

  const closeTrade = () => {
    if (!trade || !entryPrice || !currentPrice) return;

    const entry = parseFloat(entryPrice);
    const current = parseFloat(currentPrice);
    const calculatedPnl = ((current - entry) / entry) * 100;
    const shares = parseFloat(sharesQuantity || "0");
    const pnlVal = shares > 0 ? shares * (current - entry) : null;

    // Update trade in localStorage
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      const parsedTrades = JSON.parse(savedTrades);
      const updatedTrades = parsedTrades.map((t: Trade) => 
        t.id === trade.id 
          ? { 
              ...t, 
              entryPrice: entry,
              exitPrice: current,
              exitDate: new Date(),
              pnl: calculatedPnl,
              pnlValue: pnlVal,
              sharesQuantity: shares,
              isOpen: false
            } 
          : t
      );
      localStorage.setItem('trades', JSON.stringify(updatedTrades));
      
      // Update current trade
      setTrade({
        ...trade,
        entryPrice: entry,
        exitPrice: current,
        exitDate: new Date(),
        pnl: calculatedPnl,
        pnlValue: pnlVal,
        sharesQuantity: shares,
        isOpen: false
      });
      
      toast({
        title: "Trade Closed",
        description: `${trade.ticker} trade has been closed with ${calculatedPnl.toFixed(2)}% P&L`,
      });
    }
  };

  const refreshPrice = () => {
    if (trade?.ticker && apiKey) {
      fetchCurrentPrice(trade.ticker, apiKey);
    }
  };

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
        {!trade ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <p className="text-slate-300 mb-4">Trade not found</p>
              <Button onClick={goBack} className="bg-blue-600 hover:bg-blue-700 text-white">
                Back to Trades
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default TradeDetail;
