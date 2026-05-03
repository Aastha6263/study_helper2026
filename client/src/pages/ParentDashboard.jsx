import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { BarChart2 } from 'lucide-react';

const ParentDashboard = () => (
  <div>

    <PageHeader
      title="Parent Dashboard"
      subtitle="Monitor your child's progress."
    />

    <Card className="flex items-center justify-center min-h-[300px]">

      <EmptyState
        icon={<BarChart2 size={28} />}
        title="No data available yet"
        description="Your child's activity and performance will appear here once they start using the platform."
        className="py-6"
      />

    </Card>

  </div>
);

export default ParentDashboard;