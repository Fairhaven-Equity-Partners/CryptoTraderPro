import React from 'react';

const StatusBar: React.FC = () => {
  // Get current time
  const [time, setTime] = React.useState(
    new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  );
  
  // Update time every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      );
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-secondary px-4 py-2 flex justify-between items-center">
      <div className="flex items-center">
        <span className="text-sm font-medium">{time}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="material-icons text-sm">signal_cellular_alt</span>
        <span className="material-icons text-sm">wifi</span>
        <span className="material-icons text-sm">battery_full</span>
      </div>
    </div>
  );
};

export default StatusBar;
