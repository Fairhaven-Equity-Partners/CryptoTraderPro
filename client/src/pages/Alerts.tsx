import React, { useState } from 'react';
import StatusBar from '../components/StatusBar';
import { useAlerts } from '../hooks/useAlerts';
import ActiveAlerts from '../components/ActiveAlerts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatPrice } from '../lib/calculations';
import { Alert, TimeFrame } from '../types';
import { ArrowDown, ArrowUp, Bell, Plus, Trash2, X } from 'lucide-react';
import { useAssetPrice } from '../hooks/useMarketData';

const Alerts: React.FC = () => {
  const [currentAsset, setCurrentAsset] = useState('BTC/USDT');
  const { price } = useAssetPrice(currentAsset);
  const { 
    alerts, 
    isLoading, 
    createAlert, 
    updateAlert, 
    deleteAlert 
  } = useAlerts();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState<Omit<Alert, 'id' | 'isTriggered'>>({
    symbol: 'BTC/USDT',
    direction: 'LONG',
    description: 'Price target',
    targetPrice: 45000,
    isActive: true
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAlert(prev => ({
      ...prev,
      [name]: name === 'targetPrice' ? parseFloat(value) : value
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
  
  // Get direction color class
  const getDirectionClass = (direction: string) => {
    return direction === 'LONG' 
      ? 'text-success' 
      : direction === 'SHORT' 
        ? 'text-danger' 
        : 'text-neutral';
  };
  
  // Get direction icon
  const getDirectionIcon = (direction: string) => {
    return direction === 'LONG' 
      ? <ArrowUp className="h-4 w-4" /> 
      : direction === 'SHORT' 
        ? <ArrowDown className="h-4 w-4" /> 
        : null;
  };
  
  return (
    <div className="flex flex-col h-screen">
      <StatusBar />
      
      <header className="bg-secondary px-4 py-3 shadow-md z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-semibold">Price Alerts</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-white">
                <Plus className="h-5 w-5" />
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
                      <SelectValue authentic="Select direction" />
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
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-16">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-white">Active Alerts</h2>
          <ActiveAlerts 
            symbol={currentAsset} 
            currentPrice={price?.lastPrice || 0}
          />
        </div>
        
        <h2 className="text-xl font-bold mb-4 text-white">All Alerts</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-secondary border-gray-700">
                <CardContent className="p-4">
                  <div className="h-20 bg-gray-700 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Bell className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-white text-xl font-medium mb-2">No Alerts</h2>
            <p className="text-gray-300 text-center mb-4">Create price alerts to be notified when cryptocurrencies hit your target prices</p>
            <Button 
              className="bg-accent text-primary hover:bg-amber-500"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Create Alert
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className="bg-secondary border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className={`
                        flex items-center px-2 py-0.5 rounded font-bold text-sm mr-2
                        ${alert.direction === 'LONG' 
                          ? 'bg-green-900/30 text-green-500' 
                          : alert.direction === 'SHORT' 
                            ? 'bg-red-900/30 text-red-500' 
                            : 'bg-yellow-900/30 text-yellow-500'}`
                      }>
                        {getDirectionIcon(alert.direction)}
                        <span className="ml-1">{alert.direction}</span>
                      </span>
                      <CardTitle className="text-white text-lg font-bold">{alert.symbol}</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-neutral hover:text-danger hover:bg-gray-700 h-8 w-8 p-0"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col">
                    <div className="bg-gray-900/50 rounded-md p-2 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">Target Price:</span>
                        <span className="text-amber-400 font-bold">
                          {formatPrice(alert.targetPrice, alert.symbol)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-white font-semibold">Description:</span>
                        <span className="text-white">{alert.description}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-white font-semibold">Status:</span>
                        <span className={`px-2 py-0.5 rounded font-medium ${
                          alert.isActive 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-700 text-white hover:bg-gray-700 w-full"
                    onClick={() => updateAlert({ id: alert.id, data: { isActive: !alert.isActive } })}
                  >
                    {alert.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Alerts;
