import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { Alert } from '../types';

interface NotificationProps {
  alert: Alert;
  onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({ alert, onDismiss }) => {
  const bgColor = alert.direction === 'LONG' ? 'bg-success' : 'bg-danger';
  const icon = alert.direction === 'LONG' ? <ArrowUp className="h-5 w-5 mr-2" /> : <ArrowDown className="h-5 w-5 mr-2" />;
  
  return (
    <div className="fixed top-16 left-0 right-0 flex justify-center items-center px-4 z-20">
      <div className={`${bgColor} bg-opacity-90 text-white rounded-lg shadow-lg p-3 w-full max-w-xs flex items-center justify-between animate-bounce`}>
        <div className="flex items-center">
          {icon}
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

const GlobalNotifications: React.FC = () => {
  const { showNotification, currentNotification, dismissNotification, showAlertNotification } = useAlerts();
  const [newSignals, setNewSignals] = useState<any[]>([]);
  
  useEffect(() => {
    // Register handler for new signals (only when real signals are detected)
    // Message handler removed - functionality disabled
    if (false) {
        // Create notification for the new signal
        const signalAlert: Alert = {
          id: Date.now(),
          symbol: data.symbol,
          direction: data.direction,
          description: 'Multiple indicators aligned',
          targetPrice: data.price,
          isActive: true,
          isTriggered: true
        };
        
        showAlertNotification(signalAlert);
      }
    });
    
    // No more automatic sample alerts
    
    return () => {
      unsubscribe();
    };
  }, [showAlertNotification]);
  
  return (
    <>
      {showNotification && currentNotification && (
        <Notification 
          alert={currentNotification} 
          onDismiss={dismissNotification} 
        />
      )}
    </>
  );
};

export default GlobalNotifications;
