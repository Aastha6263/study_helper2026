import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { BookOpen } from 'lucide-react';

const NotesPage = () => (
  <div>

    <PageHeader
      title="My Notes"
      subtitle="All your notes in one place."
    />

    <Card className="flex items-center justify-center min-h-[300px]">

      <EmptyState
        icon={<BookOpen size={28} />}
        title="No notes yet"
        description="Start creating notes to organize your learning."
        className="py-6"
      />

    </Card>

  </div>
);

export default NotesPage;