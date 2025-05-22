
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { InfoIcon } from "lucide-react";

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeyInput = ({ onKeySubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  
  useEffect(() => {
    // Check if API key is already stored in localStorage
    const storedKey = localStorage.getItem("rapidapi_key");
    if (storedKey) {
      setApiKey(storedKey);
      onKeySubmit(storedKey);
    }
  }, [onKeySubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }
    
    // Store API key in localStorage
    localStorage.setItem("rapidapi_key", apiKey);
    onKeySubmit(apiKey);
    
    toast({
      title: "Success",
      description: "API key saved successfully"
    });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">RapidAPI Key Required</CardTitle>
        <CardDescription className="text-slate-300">
          Enter your RapidAPI key to fetch stock prices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-sm text-slate-300">
              RapidAPI Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your RapidAPI key"
              className="bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-400 flex items-start gap-1">
              <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Get your key from <a href="https://rapidapi.com/suneetk92/api/latest-stock-price/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">RapidAPI</a>. Your key is stored locally and never sent to our servers.</span>
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save API Key
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
