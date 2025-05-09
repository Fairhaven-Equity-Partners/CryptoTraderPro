import React from 'react';
import { Link, useLocation } from 'wouter';
import { AppTab } from '../types';

interface NavigationBarProps {
  currentTab: AppTab['id'];
  onChangeTab: (tab: AppTab['id']) => void;
}

const tabs: AppTab[] = [
  { id: 'analysis', label: 'Analysis', icon: 'analytics' },
  { id: 'alerts', label: 'Alerts', icon: 'notifications' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

const NavigationBar: React.FC<NavigationBarProps> = ({ currentTab, onChangeTab }) => {
  const [location, setLocation] = useLocation();
  
  const handleTabClick = (tab: AppTab['id']) => {
    onChangeTab(tab);
    setLocation(`/${tab === 'analysis' ? '' : tab}`);
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-gray-700 z-10 flex justify-around items-center py-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`p-2 flex flex-col items-center w-full active:bg-gray-700 rounded-md ${
            currentTab === tab.id ? 'text-accent' : 'text-neutral'
          }`}
          onClick={() => handleTabClick(tab.id)}
        >
          <span className="material-icons">{tab.icon}</span>
          <span className={`text-xs mt-0.5 ${currentTab === tab.id ? 'text-white' : 'text-neutral'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default NavigationBar;
