import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { Users } from 'lucide-react';

const RoomDetailPage = () => (
  <div>

    <PageHeader
      title="Room Details"
      subtitle="View and manage this study room."
    />

    <Card className="flex items-center justify-center min-h-[300px]">

      <EmptyState
        icon={<Users size={28} />}
        title="Room details coming soon"
        description="You'll be able to view members, tasks, and activity inside this room."
        className="py-6"
      />

    </Card>

  </div>
);

export default RoomDetailPage;