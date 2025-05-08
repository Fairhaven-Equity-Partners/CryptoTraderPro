import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAlerts, createAlert, updateAlert, deleteAlert } from '../lib/api';
import { Alert } from '../types';
import { useToast } from '@/hooks/use-toast';

export function useAlerts(userId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Alert | null>(null);
  
  // Fetch alerts
  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['/api/alerts', userId],
    queryFn: () => fetchAlerts(userId),
    staleTime: 30000, // 30 seconds
  });
  
  // Create alert mutation
  const createMutation = useMutation({
    mutationFn: (newAlert: Omit<Alert, 'id' | 'isTriggered'>) => createAlert(newAlert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Alert Created",
        description: "Your price alert has been successfully created",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Alert",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update alert mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Alert> }) => updateAlert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Alert Updated",
        description: "Your alert has been successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Alert",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Alert Deleted",
        description: "Your alert has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Alert",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Function to show notification for triggered alert
  const showAlertNotification = (alert: Alert) => {
    setCurrentNotification(alert);
    setShowNotification(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
      setCurrentNotification(null);
    }, 5000);
  };
  
  // Function to dismiss notification
  const dismissNotification = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };
  
  return {
    alerts,
    isLoading,
    error,
    createAlert: createMutation.mutate,
    updateAlert: updateMutation.mutate,
    deleteAlert: deleteMutation.mutate,
    showNotification,
    currentNotification,
    showAlertNotification,
    dismissNotification
  };
}
