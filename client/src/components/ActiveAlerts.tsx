import React, { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { formatPrice } from '../lib/calculations';
import { MoreVertical, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '../types';

interface ActiveAlertsProps {
  symbol: string;
  currentPrice: number;
}

const ActiveAlerts: React.FC<ActiveAlertsProps> = ({ symbol, currentPrice }) => {
  const { 
    alerts, 
    isLoading, 
    createAlert, 
    updateAlert, 
    deleteAlert 
  } = useAlerts();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState<Omit<Alert, 'id' | 'isTriggered'>>({
    symbol,
    direction: 'LONG',
    description: 'Price alert',
    targetPrice: currentPrice * 1.05, // 5% above current price
    isActive: true
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAlert(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle direction select change
  const handleDirectionChange = (value: string) => {
    setNewAlert(prev => ({
      ...prev,
      direction: value as 'LONG' | 'SHORT' | 'NEUTRAL'
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert(newAlert);
    setIsAddDialogOpen(false);
  };
  
  // Handle alert deactivation
  const handleDeactivateAlert = (id: number) => {
    updateAlert({ id, data: { isActive: false } });
  };
  
  // Handle alert deletion
  const handleDeleteAlert = (id: number) => {
    deleteAlert(id);
  };
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white text-lg font-medium">Active Alerts</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
              <Plus className="h-4 w-4 mr-1" /> Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-secondary text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={newAlert.symbol}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="direction">Direction</Label>
                <Select 
                  value={newAlert.direction} 
                  onValueChange={handleDirectionChange}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="LONG" className="text-success">LONG</SelectItem>
                    <SelectItem value="SHORT" className="text-danger">SHORT</SelectItem>
                    <SelectItem value="NEUTRAL" className="text-neutral">NEUTRAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={newAlert.description}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="targetPrice">Target Price ($)</Label>
                <Input
                  id="targetPrice"
                  name="targetPrice"
                  type="number"
                  value={newAlert.targetPrice}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-gray-700 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-primary hover:bg-amber-500">
                  Create Alert
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-800 rounded-lg p-2 flex justify-between items-center">
              <div>
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-700 rounded mt-1 animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-white text-sm font-medium">No active alerts. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-gray-800 rounded-lg p-2 flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <span className={`${
                    alert.direction === 'LONG' 
                      ? 'text-green-500 bg-green-900/30' 
                      : alert.direction === 'SHORT' 
                        ? 'text-red-500 bg-red-900/30' 
                        : 'text-yellow-500 bg-yellow-900/30'
                  } text-xs font-bold px-2 py-0.5 rounded mr-2`}>
                    {alert.direction}
                  </span>
                  <span className="text-white text-sm font-medium">{alert.symbol}</span>
                </div>
                <div className="text-white text-xs mt-0.5">{alert.description}</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-white text-right">
                  <div className="text-xs font-bold bg-gray-700 px-2 py-1 rounded mb-1">
                    {alert.direction === 'LONG' ? '≥' : '≤'} {formatPrice(alert.targetPrice, alert.symbol)}
                  </div>
                  <div className={`${
                    alert.isActive 
                      ? 'text-green-400 bg-green-900/30' 
                      : 'text-amber-400 bg-amber-900/30'
                    } text-xs font-medium px-2 py-0.5 rounded`}>
                    {alert.isActive ? 'Active' : 'Waiting'}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-400 hover:text-white">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem 
                      className="text-white hover:bg-gray-700"
                      onClick={() => handleDeactivateAlert(alert.id)}
                    >
                      {alert.isActive ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-400 hover:bg-gray-700"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveAlerts;
