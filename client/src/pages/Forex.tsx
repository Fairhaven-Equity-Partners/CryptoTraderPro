import ForexDashboard from '@/components/ForexDashboard';

export default function Forex() {
  return (
    <div className="container mx-auto p-6">
      <ForexDashboard pair="EUR/USD" />
    </div>
  );
}