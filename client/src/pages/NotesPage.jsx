import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
  Pin,
  Star,
  FolderOpen,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { noteAPI } from '../services/api';

const defaultSubjects = [
  'General',
  'Mathematics',
  'Physics',
  'Chemistry',
  'DSA',
  'OS',
];

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-black"
        >
          <X size={22} />
        </button>
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
};

const Badge = ({ children, color = 'bg-slate-100 text-slate-700' }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

const NoteEditor = ({ note, subjects, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    subject: note?.subject || subjects[0],
    tags: note?.tags?.join(', ') || '',
    pinned: note?.pinned || false,
    favorite: note?.favorite || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    onSave({
      ...form,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Note title"
        className="w-full border rounded-2xl p-4 text-lg"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="border rounded-2xl p-3"
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="Tags (comma separated)"
          className="border rounded-2xl p-3"
        />
      </div>

      <textarea
        name="content"
        value={form.content}
        onChange={handleChange}
        placeholder="Write your note here..."
        rows={14}
        className="w-full border rounded-2xl p-4 resize-none"
      />

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="pinned"
            checked={form.pinned}
            onChange={handleChange}
          />
          Pin Note
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="favorite"
            checked={form.favorite}
            onChange={handleChange}
          />
          Favorite
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-3 rounded-2xl border"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-black text-white flex items-center gap-2"
        >
          <Save size={18} /> Save Note
        </button>
      </div>
    </form>
  );
};

const NoteCard = ({ note, onEdit, onDelete }) => (
  <Card className="p-5 hover:shadow-lg transition-all rounded-3xl border space-y-3">
    <div className="flex justify-between items-start gap-3">
      <div>
        <div className="flex gap-2 flex-wrap mb-2">
          {note.pinned && <Pin size={16} className="text-yellow-500" />}
          {note.favorite && <Star size={16} className="text-orange-500" />}
        </div>

        <h3 className="font-bold text-lg text-slate-800">{note.title}</h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-4">
          {note.content}
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onEdit(note)} className="text-blue-500">
          <Edit2 size={18} />
        </button>
        <button onClick={() => onDelete(note._id)} className="text-red-500">
          <Trash2 size={18} />
        </button>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <Badge color="bg-purple-100 text-purple-700">{note.subject}</Badge>
      {note.tags?.map((tag, idx) => (
        <Badge key={idx}>#{tag}</Badge>
      ))}
    </div>

    <p className="text-xs text-slate-400">
      Updated: {new Date(note.updatedAt).toLocaleString()}
    </p>
  </Card>
);

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState(defaultSubjects);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const notesRes = await noteAPI.getAll();
        const subjectsRes = await noteAPI.getSubjects();

        setNotes(notesRes.data || []);
        setSubjects([
          ...defaultSubjects,
          ...subjectsRes.data.map((s) => s.name),
        ]);
      } catch (err) {
        toast.error('Failed to load notes');
      }
    })();
  }, []);

  const saveNote = async (noteData) => {
    try {
      if (editingNote) {
        const res = await noteAPI.update(editingNote._id, noteData);

        setNotes((prev) =>
          prev.map((note) => (note._id === res.data._id ? res.data : note)),
        );

        toast.success('Note updated');
      } else {
        const res = await noteAPI.create(noteData);

        setNotes((prev) => [res.data, ...prev]);

        toast.success('Note created');
      }

      setShowEditor(false);
      setEditingNote(null);
    } catch {
      toast.error('Failed to save note');
    }
  };

  const deleteNote = async (id) => {
    try {
      await noteAPI.delete(id);

      setNotes((prev) => prev.filter((note) => note._id !== id));

      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;

    if (subjects.includes(newSubject)) {
      toast.error('Subject already exists');
      return;
    }

    try {
      const res = await noteAPI.addSubject(newSubject);

      setSubjects((prev) => [...prev, res.data.name]);
      setNewSubject('');
      toast.success('Subject added');
    } catch {
      toast.error('Failed to add subject');
    }
  };

  const filteredNotes = useMemo(() => {
    return [...notes]
      .filter((note) => {
        const query = search.toLowerCase();

        const matchesSearch =
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query));

        const matchesSubject = !subjectFilter || note.subject === subjectFilter;

        return matchesSearch && matchesSubject;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
  }, [notes, search, subjectFilter]);

  return (
    <div>
      <Toaster position="top-right" />

      <PageHeader
        title="My Notes"
        subtitle={`${notes.length} notes saved`}
        actions={
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setEditingNote(null);
                setShowEditor(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-2xl flex items-center gap-2"
            >
              <Plus size={18} /> New Note
            </button>
          </div>
        }
      />

      <Card className="p-4 mb-6 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute top-3 left-3 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, content, tags..."
              className="w-full border rounded-2xl pl-10 p-3"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="border rounded-2xl p-3"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Add subject"
              className="border rounded-2xl p-3 flex-1"
            />
            <button
              onClick={addSubject}
              className="bg-purple-600 text-white px-4 rounded-2xl"
            >
              <FolderOpen size={18} />
            </button>
          </div>
        </div>
      </Card>

      {filteredNotes.length === 0 ? (
        <Card className="flex items-center justify-center min-h-[300px] rounded-3xl">
          <EmptyState
            icon={<BookOpen size={28} />}
            title="No notes yet"
            description="Start creating notes to organize your learning."
            className="py-6"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={(note) => {
                setEditingNote(note);
                setShowEditor(true);
              }}
              onDelete={deleteNote}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingNote(null);
        }}
        title={editingNote ? 'Edit Note' : 'Create New Note'}
      >
        <NoteEditor
          note={editingNote}
          subjects={subjects}
          onSave={saveNote}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default NotesPage;
