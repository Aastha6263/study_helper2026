import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

/* 🎨 CARD */
const Card = ({ children }) => (
  <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow text-center">
    {children}
  </div>
);

export default function FlashcardsPage() {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [form, setForm] = useState({
    front: '',
    back: '',
    subject: 'General',
    difficulty: 'easy',
  });

  const [mode, setMode] = useState('create'); // create / study
  const [progress, setProgress] = useState(0);

  /* LOAD */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('flashcards')) || [];
    setCards(data);
  }, []);

  /* SAVE */
  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(cards));
  }, [cards]);

  /* CREATE */
  const createCard = () => {
    if (!form.front) return toast.error('Add question');

    setCards([...cards, { ...form, id: Date.now() }]);
    setForm({ front: '', back: '', subject: 'General', difficulty: 'easy' });
    toast.success('Card added');
  };

  /* NEXT */
  const nextCard = () => {
    setFlipped(false);
    setCurrent((prev) => (prev + 1) % cards.length);
  };

  /* PREV */
  const prevCard = () => {
    setFlipped(false);
    setCurrent((prev) => (prev - 1 + cards.length) % cards.length);
  };

  /* RATE */
  const rate = (type) => {
    setProgress((p) => p + 1);
    nextCard();
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      <h1 className="text-2xl font-bold mb-6">🃏 Flashcards</h1>

      {/* MODE SWITCH */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setMode('create')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create
        </button>
        <button
          onClick={() => setMode('study')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Study
        </button>
      </div>

      {/* CREATE MODE */}
      {mode === 'create' && (
        <Card>
          <input
            placeholder="Question"
            value={form.front}
            onChange={(e) => setForm({ ...form, front: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />

          <textarea
            placeholder="Answer"
            value={form.back}
            onChange={(e) => setForm({ ...form, back: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          />

          <div className="flex gap-2 mb-2">
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="p-2 border rounded"
            >
              <option>General</option>
              <option>DSA</option>
              <option>Physics</option>
            </select>

            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button
            onClick={createCard}
            className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2 items-center justify-center"
          >
            <Plus size={16} /> Add Card
          </button>
        </Card>
      )}

      {/* STUDY MODE */}
      {mode === 'study' && cards.length > 0 && (
        <div className="space-y-6">
          {/* FLASHCARD */}
          <div
            className="w-full max-w-md mx-auto h-60 perspective cursor-pointer"
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform ${flipped ? 'rotate-y-180' : ''}`}
            >
              {/* FRONT */}
              <div className="absolute w-full h-full backface-hidden bg-blue-500 text-white rounded-2xl flex items-center justify-center p-4">
                {cards[current].front}
              </div>

              {/* BACK */}
              <div className="absolute w-full h-full backface-hidden bg-green-500 text-white rounded-2xl flex items-center justify-center p-4 rotate-y-180">
                {cards[current].back}
              </div>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex justify-center gap-3">
            <button
              onClick={prevCard}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Prev
            </button>
            <button
              onClick={nextCard}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Next
            </button>
          </div>

          {/* SELF ASSESS */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => rate('again')}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Again
            </button>
            <button
              onClick={() => rate('hard')}
              className="bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Hard
            </button>
            <button
              onClick={() => rate('good')}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Good
            </button>
            <button
              onClick={() => rate('easy')}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Easy
            </button>
          </div>

          {/* PROGRESS */}
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 h-3 rounded">
              <div
                className="bg-blue-500 h-3 rounded"
                style={{ width: `${(progress / cards.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-center mt-1">
              {progress} / {cards.length} studied
            </p>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {mode === 'study' && cards.length === 0 && (
        <p className="text-center text-gray-500">No flashcards yet</p>
      )}
    </div>
  );
}
