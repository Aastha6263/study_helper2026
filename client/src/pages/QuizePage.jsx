import { useState, useEffect } from 'react';

const questions = [
  {
    q: 'What is React?',
    options: ['Library', 'Framework', 'Language', 'Database'],
    answer: 'Library',
  },
  {
    q: 'Which hook is used for state?',
    options: ['useEffect', 'useState', 'useRef', 'useMemo'],
    answer: 'useState',
  },
  {
    q: 'Which language is used in MERN?',
    options: ['Python', 'Java', 'JavaScript', 'C++'],
    answer: 'JavaScript',
  },
  {
    q: 'MongoDB is?',
    options: ['SQL DB', 'NoSQL DB', 'Language', 'Framework'],
    answer: 'NoSQL DB',
  },
  {
    q: 'Node.js is?',
    options: ['Frontend', 'Backend runtime', 'DB', 'API'],
    answer: 'Backend runtime',
  },
];

const QuizPage = () => {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState({});
  const [time, setTime] = useState(60);
  const [submitted, setSubmitted] = useState(false);

  /* ⏱ TIMER */
  useEffect(() => {
    if (time > 0 && !submitted) {
      const timer = setInterval(() => setTime((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [time, submitted]);

  /* SCORE */
  const score = questions.reduce((acc, q, i) => {
    return selected[i] === q.answer ? acc + 1 : acc;
  }, 0);

  /* SUBMIT */
  const handleSubmit = () => {
    setSubmitted(true);
  };

  /* PROGRESS */
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-indigo-300 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">🧠 Quiz Challenge</h1>

      {/* TIMER */}
      <div className="text-center mb-4 text-xl font-semibold text-red-600">
        ⏱ {time}s
      </div>

      {/* PROGRESS */}
      <div className="w-full bg-gray-200 h-3 rounded mb-6">
        <div
          className="bg-blue-600 h-3 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!submitted ? (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-semibold mb-4">
            Q{index + 1}. {questions[index].q}
          </h2>

          {/* OPTIONS */}
          <div className="space-y-3">
            {questions[index].options.map((opt) => (
              <div
                key={opt}
                onClick={() => setSelected({ ...selected, [index]: opt })}
                className={`p-3 rounded-xl border cursor-pointer transition
                  ${
                    selected[index] === opt
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                {opt}
              </div>
            ))}
          </div>

          {/* NAV BUTTONS */}
          <div className="flex justify-between mt-6">
            <button
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              className="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50"
            >
              Prev
            </button>

            {index === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Submit
              </button>
            ) : (
              <button
                onClick={() => setIndex(index + 1)}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Next
              </button>
            )}
          </div>
        </div>
      ) : (
        /* RESULT SCREEN */
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow text-center">
          <h2 className="text-2xl font-bold mb-4">🎉 Quiz Completed</h2>

          <p className="text-xl">
            Score: {score} / {questions.length}
          </p>

          <p className="mt-2 text-gray-500">
            {score >= 4 ? '🔥 Excellent!' : '👍 Keep practicing!'}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
