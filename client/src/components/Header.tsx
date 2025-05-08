import React, { useState } from 'react';
import { useAssetList } from '../hooks/useMarketData';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Menu, Star, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  currentAsset: string;
  onChangeAsset: (symbol: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentAsset, onChangeAsset }) => {
  const { assets, isLoading } = useAssetList();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const handleAssetChange = (symbol: string) => {
    onChangeAsset(symbol);
    setIsDropdownOpen(false);
  };
  
  return (
    <header className="bg-secondary px-4 py-3 shadow-md z-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-white text-xl font-semibold">CryptoSignal Pro</h1>
          <div className="h-5 w-0.5 bg-neutral opacity-30"></div>
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1 bg-secondary hover:bg-gray-700 rounded px-2 py-1">
                  <span className="text-white font-medium">{currentAsset}</span>
                  <ChevronDown className="text-accent h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-secondary border-gray-700">
                {isLoading ? (
                  <DropdownMenuItem disabled>Loading assets...</DropdownMenuItem>
                ) : (
                  assets.map((asset) => (
                    <DropdownMenuItem 
                      key={asset.symbol} 
                      className={`text-sm ${asset.symbol === currentAsset ? 'text-accent font-medium' : 'text-white'}`}
                      onClick={() => handleAssetChange(asset.symbol)}
                    >
                      {asset.symbol}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-neutral hover:text-white">
            <Star className="h-5 w-5" />
          </button>
          <button className="text-neutral hover:text-white">
            <Bell className="h-5 w-5" />
          </button>
          <button className="text-neutral hover:text-white">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
