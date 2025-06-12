import React from 'react';
import { X } from 'lucide-react';
import { Alert } from '../types';

interface AlertNotificationProps {
  alert: Alert;
  onDismiss: () => void;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ alert, onDismiss }) => {
  if (!alert) return null;
  
  const bgColor = alert.direction === 'LONG' ? 'bg-success' : 'bg-danger';
  const icon = alert.direction === 'LONG' ? 'arrow_upward' : 'arrow_downward';
  
  return (
    <div className="fixed top-16 left-0 right-0 flex justify-center items-center px-4 z-20">
      <div className={`${bgColor} bg-opacity-90 text-white rounded-lg shadow-lg p-3 w-full max-w-xs flex items-center justify-between animate-bounce`}>
        <div className="flex items-center">
          <span className="material-icons mr-2">{icon}</span>
          <div>
            <p className="font-medium">{alert.direction} Signal Detected</p>
            <p className="text-xs">{alert.symbol} - {alert.description}</p>
          </div>
        </div>
        <button className="text-white" onClick={onDismiss}>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AlertNotification;
