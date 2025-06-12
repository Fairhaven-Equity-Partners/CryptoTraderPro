import React, { useState } from 'react';
import StatusBar from '../components/StatusBar';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Moon, 
  Shield, 
  ChevronRight, 
  RefreshCcw, 
  HelpCircle, 
  LogOut, 
  Zap 
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Settings: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState([2]);
  const [defaultLeverage, setDefaultLeverage] = useState('3');
  const [apiRefreshRate, setApiRefreshRate] = useState('15');
  
  const handleRiskToleranceChange = (value: number[]) => {
    setRiskTolerance(value);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <StatusBar />
      
      <header className="bg-secondary px-4 py-3 shadow-md z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-semibold">Settings</h1>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-16">
        {/* App Settings */}
        <Card className="bg-secondary border-gray-700 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">App Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="text-accent h-5 w-5" />
                <Label htmlFor="notifications" className="text-white">Notifications</Label>
              </div>
              <Switch 
                id="notifications" 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                className="data-[state=checked]:bg-accent"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Moon className="text-accent h-5 w-5" />
                <Label htmlFor="darkMode" className="text-white">Dark Mode</Label>
              </div>
              <Switch 
                id="darkMode" 
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-accent"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="text-accent h-5 w-5" />
                <Label htmlFor="highContrast" className="text-white">High Contrast</Label>
              </div>
              <Switch 
                id="highContrast" 
                checked={highContrastMode}
                onCheckedChange={setHighContrastMode}
                className="data-[state=checked]:bg-accent"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Trading Settings */}
        <Card className="bg-secondary border-gray-700 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Trading Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="text-accent h-5 w-5" />
                <Label htmlFor="riskTolerance" className="text-white">Risk Tolerance</Label>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-neutral text-sm">Low</span>
                <Slider
                  id="riskTolerance"
                  value={riskTolerance}
                  onValueChange={handleRiskToleranceChange}
                  max={10}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <span className="text-neutral text-sm">High</span>
              </div>
              <div className="text-center text-white text-sm">
                {riskTolerance[0]}% of portfolio per trade
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap className="text-accent h-5 w-5" />
                <Label htmlFor="defaultLeverage" className="text-white">Default Leverage</Label>
              </div>
              <Select value={defaultLeverage} onValueChange={setDefaultLeverage}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue authentic="Select default leverage" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="1" className="text-white">1x</SelectItem>
                  <SelectItem value="2" className="text-white">2x</SelectItem>
                  <SelectItem value="3" className="text-white">3x</SelectItem>
                  <SelectItem value="5" className="text-white">5x</SelectItem>
                  <SelectItem value="10" className="text-white">10x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RefreshCcw className="text-accent h-5 w-5" />
                <Label htmlFor="apiRefreshRate" className="text-white">API Refresh Rate</Label>
              </div>
              <Select value={apiRefreshRate} onValueChange={setApiRefreshRate}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue authentic="Select refresh rate" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="5" className="text-white">5 seconds</SelectItem>
                  <SelectItem value="15" className="text-white">15 seconds</SelectItem>
                  <SelectItem value="30" className="text-white">30 seconds</SelectItem>
                  <SelectItem value="60" className="text-white">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* About & Support */}
        <Card className="bg-secondary border-gray-700 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">About & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-between text-white hover:bg-gray-700">
              <div className="flex items-center">
                <HelpCircle className="text-accent h-5 w-5 mr-2" />
                <span>Help & Support</span>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            <Separator className="bg-gray-700" />
            
            <div className="px-2 py-3">
              <div className="text-neutral text-sm">App Version</div>
              <div className="text-white">CryptoSignal Pro 1.0.0</div>
            </div>
            
            <Separator className="bg-gray-700" />
            
            <Button variant="ghost" className="w-full justify-between text-danger hover:bg-gray-700 hover:text-danger">
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-2" />
                <span>Log Out</span>
              </div>
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center text-neutral text-xs mt-8 mb-4">
          &copy; 2023 CryptoSignal Pro. All rights reserved.
        </div>
      </main>
    </div>
  );
};

export default Settings;
