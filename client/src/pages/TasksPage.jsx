import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Calendar,
  BookOpen,
  X,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { taskAPI } from '../services/api';

const STORAGE_KEY = 'student_tasks';
const SUBJECTS_KEY = 'task_subjects';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['todo', 'in_progress', 'completed'];

const defaultSubjects = ['Mathematics', 'Physics', 'Chemistry', 'DSA', 'OS'];

const loadSubjects = () => {
  try {
    return JSON.parse(localStorage.getItem(SUBJECTS_KEY)) || defaultSubjects;
  } catch {
    return defaultSubjects;
  }
};

const saveSubjects = (subjects) => {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
};

const Badge = ({ children, color }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

const priorityColor = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusColor = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-black"
        >
          <X />
        </button>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

const TaskForm = ({ onSubmit, subjects, initialData = {}, onClose }) => {
  const [form, setForm] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    subject: initialData.subject || subjects[0],
    priority: initialData.priority || 'medium',
    status: initialData.status || 'todo',
    dueDate: initialData.dueDate || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="title"
        placeholder="Task title"
        value={form.title}
        onChange={handleChange}
        className="w-full border rounded-xl p-3"
      />

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        className="w-full border rounded-xl p-3"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="border rounded-xl p-3"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
          className="border rounded-xl p-3"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="w-full border rounded-xl p-3"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        name="dueDate"
        value={form.dueDate}
        onChange={handleChange}
        className="w-full border rounded-xl p-3"
      />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-black text-white"
        >
          Save Task
        </button>
      </div>
    </form>
  );
};

const TaskCard = ({ task, onDelete, onEdit, onToggle }) => {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex gap-3 items-start border">
      <button onClick={() => onToggle(task._id)}>
        {task.status === 'completed' ? (
          <CheckCircle2 className="text-green-500" />
        ) : (
          <Circle className="text-gray-400" />
        )}
      </button>

      <div className="flex-1">
        <h3
          className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge color={priorityColor[task.priority]}>{task.priority}</Badge>
          <Badge color={statusColor[task.status]}>{task.status}</Badge>
          <Badge color="bg-purple-100 text-purple-700">{task.subject}</Badge>

          {task.dueDate && (
            <span className="text-xs flex items-center gap-1 text-gray-500">
              <Calendar size={14} />
              {new Date(task.dueDate).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onEdit(task)} className="text-blue-500">
          <Edit2 size={18} />
        </button>
        <button onClick={() => onDelete(task._id)} className="text-red-500">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState(loadSubjects());
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => saveSubjects(subjects), [subjects]);

  // Load tasks from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await taskAPI.getAll();
        const payload = res.data || {};
        const items = Array.isArray(payload) ? payload : payload.items || [];
        if (mounted) setTasks(items);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
        toast.error('Failed to load tasks from server');
      }
    })();
    return () => (mounted = false);
  }, []);

  const addTask = async (taskData) => {
    try {
      if (editingTask) {
        const res = await taskAPI.update(editingTask._id, taskData);
        const updated = res.data;
        setTasks((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t)),
        );
        toast.success('Task updated');
      } else {
        const res = await taskAPI.create(taskData);
        const created = res.data;
        setTasks((prev) => [created, ...prev]);
        toast.success('Task created');
      }
    } catch (err) {
      console.error('Task save failed', err);
      toast.error('Failed to save task');
    } finally {
      setEditingTask(null);
      setShowModal(false);
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.success('Task deleted');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete task');
    }
  };

  const toggleTask = async (id) => {
    try {
      const task = tasks.find((t) => t._id === id);
      if (!task) return;
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      const res = await taskAPI.updateStatus(id, newStatus);
      const updated = res.data;
      setTasks((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t)),
      );
    } catch (err) {
      console.error('Toggle failed', err);
      toast.error('Failed to update task status');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesSubject = !subjectFilter || task.subject === subjectFilter;
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority =
        !priorityFilter || task.priority === priorityFilter;

      return (
        matchesSearch && matchesSubject && matchesStatus && matchesPriority
      );
    });
  }, [tasks, search, subjectFilter, statusFilter, priorityFilter]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    pending: tasks.filter((t) => t.status !== 'completed').length,
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    if (subjects.includes(newSubject))
      return toast.error('Subject already exists');

    setSubjects((prev) => [...prev, newSubject]);
    setNewSubject('');
    toast.success('Subject added');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Subject Wise Task Manager</h1>
            <p className="text-gray-500">Manage your study tasks smartly</p>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setShowModal(true);
            }}
            className="bg-black text-white px-5 py-3 rounded-2xl flex items-center gap-2"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow">
            Total Tasks: {stats.total}
          </div>
          <div className="bg-white p-4 rounded-2xl shadow">
            Completed: {stats.completed}
          </div>
          <div className="bg-white p-4 rounded-2xl shadow">
            Pending: {stats.pending}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-xl pl-10 p-3"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="">All Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Add new subject"
              className="border rounded-xl p-3 flex-1"
            />
            <button
              onClick={addSubject}
              className="bg-purple-600 text-white px-4 rounded-xl"
            >
              <BookOpen />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow">
              No tasks found.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onDelete={deleteTask}
                onToggle={toggleTask}
                onEdit={(task) => {
                  setEditingTask(task);
                  setShowModal(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
      >
        <TaskForm
          subjects={subjects}
          initialData={editingTask || {}}
          onSubmit={addTask}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
        />
      </Modal>
    </div>
  );
}
