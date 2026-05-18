import { useState } from 'react';

/* 🔥 Dummy Badge Data */
const badgeData = [
  {
    id: 1,
    title: '🔥 3 Day Streak',
    desc: 'Study 3 days continuously',
    earned: true,
  },
  {
    id: 2,
    title: '📚 10 Hours Study',
    desc: 'Complete 10 hours of study',
    earned: true,
  },
  {
    id: 3,
    title: '✅ Task Master',
    desc: 'Complete 20 tasks',
    earned: false,
  },
  {
    id: 4,
    title: '🧠 Focus Master',
    desc: 'Complete 5 focus sessions',
    earned: false,
  },
  {
    id: 5,
    title: '🏆 Top Performer',
    desc: 'Reach top of leaderboard',
    earned: false,
  },
];

const BadgesPage = () => {
  const [badges] = useState(badgeData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        🏅 Achievements & Badges
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-5 rounded-xl shadow-md transition hover:scale-105
              ${badge.earned ? 'bg-green-100' : 'bg-gray-100 opacity-60'}
            `}
          >
            <h3 className="text-lg font-semibold mb-2">{badge.title}</h3>

            <p className="text-sm text-gray-600">{badge.desc}</p>

            <div className="mt-3">
              {badge.earned ? (
                <span className="text-green-600 font-bold">✅ Earned</span>
              ) : (
                <span className="text-gray-500">🔒 Locked</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgesPage;
