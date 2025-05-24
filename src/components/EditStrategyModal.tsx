
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { TradingStrategy } from "@/pages/Index";
import { ChecklistItem } from "@/pages/Index";

interface EditStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (name: string, description: string, checklist: ChecklistItem[]) => void;
  strategy: TradingStrategy;
}

const EditStrategyModal = ({ isOpen, onClose, onUpdate, strategy }: EditStrategyModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [checklist, setChecklist] = useState<string[]>([""]);

  useEffect(() => {
    // Initialize form with strategy data when modal opens
    if (isOpen && strategy) {
      setName(strategy.name);
      setDescription(strategy.description || "");
      setChecklist(strategy.checklist.map(item => item.text));
    }
  }, [isOpen, strategy]);

  const handleAddChecklistItem = () => {
    setChecklist([...checklist, ""]);
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleChecklistItemChange = (index: number, value: string) => {
    const newChecklist = [...checklist];
    newChecklist[index] = value;
    setChecklist(newChecklist);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validChecklist = checklist.filter(item => item.trim() !== "");
    if (name.trim() && validChecklist.length > 0) {
      // Format checklist items as needed by the API
      const formattedChecklist = validChecklist.map((item, index) => ({
        id: (index + 1).toString(),
        text: item.trim(),
        completed: false,
      }));
      
      onUpdate(name.trim(), description.trim(), formattedChecklist);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Strategy</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="strategy-name" className="text-slate-300">
              Strategy Name *
            </Label>
            <Input
              id="strategy-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Breakout Strategy"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              required
            />
          </div>

          <div>
            <Label htmlFor="strategy-description" className="text-slate-300">
              Description (Optional)
            </Label>
            <Textarea
              id="strategy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your strategy..."
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none h-20"
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">
              Checklist Items *
            </Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={item}
                    onChange={(e) => handleChecklistItemChange(index, e.target.value)}
                    placeholder={`Step ${index + 1}...`}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-1"
                  />
                  {checklist.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveChecklistItem(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddChecklistItem}
              className="mt-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Step
            </Button>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!name.trim() || checklist.every(item => item.trim() === "")}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStrategyModal;
