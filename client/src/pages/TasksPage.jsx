import { useEffect, useState }       from 'react';
import { useDispatch, useSelector }  from 'react-redux';
import {
  Plus, Search, Filter, CheckSquare,
  Calendar, Flag, MoreVertical,
  Trash2, Edit2, CheckCircle2, Circle,
}                                    from 'lucide-react';
import toast                         from 'react-hot-toast';
import {
  fetchTasks, createTask,
  updateTaskStatus, deleteTask,
}                                    from '../features/tasks/taskSlice';
import PageHeader                    from '../components/common/PageHeader';
import Card                          from '../components/common/Card';
import Button                        from '../components/common/Button';
import Input                         from '../components/common/Input';
import Badge                         from '../components/common/Badge';
import Modal                         from '../components/common/Modal';
import Select                        from '../components/common/Select';
import Textarea                      from '../components/common/Textarea';
import Loader                        from '../components/common/Loader';
import EmptyState                    from '../components/common/EmptyState';
import { formatDueDate, truncate }   from '../utils/formatters';
import { TASK_STATUS, TASK_PRIORITY } from '../utils/constants';
import { useForm }                   from 'react-hook-form';
import useSocket                     from '../socket/useSocket';

const PRIORITY_OPTS = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_OPTS = [
  { value: 'todo',        label: 'To Do'       },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed'   },
];

// ── Task card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onStatusChange, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const due                     = formatDueDate(task.dueDate);
  const isDone                  = task.status === 'completed';

  return (
    <div className={`
      card-sm flex items-start gap-3 group relative
      ${task.status === 'overdue' ? 'border-danger-200 bg-danger-50/30' : ''}
    `}>
      {/* Complete toggle */}
      <button
        onClick={() =>
          onStatusChange(task._id, isDone ? 'todo' : 'completed')
        }
        className="mt-0.5 flex-shrink-0 text-slate-300
                   hover:text-primary-500 transition-colors"
      >
        {isDone
          ? <CheckCircle2 size={20} className="text-success-500" />
          : <Circle size={20} />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium
          ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </p>

        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant={task.priority}>{task.priority}</Badge>
          <Badge variant={task.status}>
            {task.status.replace('_', ' ')}
          </Badge>
          {task.subject && (
            <span className="text-2xs text-slate-400 bg-slate-100
                             px-2 py-0.5 rounded-full">
              {task.subject}
            </span>
          )}
          {due && (
            <span className={`text-xs font-medium ${due.color}`}>
              <Calendar size={10} className="inline mr-0.5" />
              {due.label}
            </span>
          )}
          {task.xpReward > 0 && !isDone && (
            <span className="text-2xs text-warning-600 font-medium">
              +{task.xpReward} XP
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-1 rounded text-slate-300 hover:text-slate-500
                     hover:bg-slate-100 transition-colors opacity-0
                     group-hover:opacity-100"
        >
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 w-36 bg-white rounded-xl
                          border border-slate-200 shadow-card z-10
                          animate-scale-in">
            <button
              onClick={() => { onDelete(task._id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs
                         text-danger-600 hover:bg-danger-50 rounded-xl
                         transition-colors"
            >
              <Trash2 size={13} />
              Delete task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Create task modal ─────────────────────────────────────────────────────────
const CreateTaskModal = ({ isOpen, onClose, onCreated }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, reset,
          formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    const result = await dispatch(createTask({
      ...data,
      dueDate: data.dueDate || null,
    }));
    if (createTask.fulfilled.match(result)) {
      toast.success('Task created!');
      reset();
      onClose();
      onCreated?.();
    } else {
      toast.error('Failed to create task');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create new task"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            Create task
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Finish math assignment"
          error={errors.title?.message}
          required
          {...register('title', { required: 'Title is required' })}
        />
        <Textarea
          label="Description"
          placeholder="Optional details..."
          rows={2}
          {...register('description')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Subject"
            placeholder="e.g. Mathematics"
            {...register('subject')}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTS}
            defaultValue="medium"
            {...register('priority')}
          />
        </div>
        <Input
          label="Due date"
          type="datetime-local"
          {...register('dueDate')}
        />
      </div>
    </Modal>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TasksPage
// ═════════════════════════════════════════════════════════════════════════════
const TasksPage = () => {
  const dispatch                   = useDispatch();
  const { items, loading, pagination } = useSelector((s) => s.tasks);
  const { emitTaskStatusUpdated }  = useSocket();

  const [showCreate, setShowCreate] = useState(false);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [priorityFilter,setPriority]= useState('');

  useEffect(() => {
    const params = {};
    if (search)         params.search   = search;
    if (statusFilter)   params.status   = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    dispatch(fetchTasks(params));
  }, [search, statusFilter, priorityFilter, dispatch]);

  const handleStatusChange = async (taskId, status) => {
    const result = await dispatch(updateTaskStatus({ taskId, status }));
    if (updateTaskStatus.fulfilled.match(result)) {
      toast.success(
        status === 'completed' ? '✅ Task completed!' : 'Task updated'
      );
      emitTaskStatusUpdated(result.payload, null);
    }
  };

  const handleDelete = async (taskId) => {
    const result = await dispatch(deleteTask(taskId));
    if (deleteTask.fulfilled.match(result)) {
      toast.success('Task deleted');
    }
  };

  const grouped = {
    overdue:     items.filter((t) => t.status === 'overdue'),
    todo:        items.filter((t) => t.status === 'todo'),
    in_progress: items.filter((t) => t.status === 'in_progress'),
    completed:   items.filter((t) => t.status === 'completed'),
  };

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle={`${pagination?.total || 0} tasks total`}
        actions={
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setShowCreate(true)}
          >
            Add task
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search tasks…"
            leftIcon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select
            options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTS]}
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="sm:w-40"
          />
          <Select
            options={[{ value: '', label: 'All priorities' }, ...PRIORITY_OPTS]}
            value={priorityFilter}
            onChange={(e) => setPriority(e.target.value)}
            className="sm:w-40"
          />
        </div>
      </Card>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={32} />}
          title="No tasks yet"
          description="Create your first task to get started."
          action={
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => setShowCreate(true)}
            >
              Add task
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([status, tasks]) => {
            if (tasks.length === 0) return null;
            const labels = {
              overdue:     '⏰ Overdue',
              todo:        '📋 To Do',
              in_progress: '🔄 In Progress',
              completed:   '✅ Completed',
            };
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {labels[status]}
                  </h3>
                  <span className="badge-slate">{tasks.length}</span>
                </div>
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => dispatch(fetchTasks({}))}
      />
    </div>
  );
};

export default TasksPage;