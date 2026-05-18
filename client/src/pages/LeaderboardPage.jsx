import { useState } from 'react';

/* 🔥 Dummy Data (replace with API later) */
const initialUsers = [
  { id: 1, name: 'Rahul', xp: 120 },
  { id: 2, name: 'You', xp: 95 },
  { id: 3, name: 'Aman', xp: 80 },
  { id: 4, name: 'Priya', xp: 70 },
  { id: 5, name: 'Rohit', xp: 60 },
];

const LeaderboardPage = () => {
  const [users, setUsers] = useState(initialUsers);

  // 🔥 Sort users by XP
  const sortedUsers = [...users].sort((a, b) => b.xp - a.xp);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🏆 Leaderboard</h1>

      <div className="max-w-xl mx-auto space-y-3">
        {sortedUsers.map((user, index) => (
          <div
            key={user.id}
            className={`flex justify-between items-center p-4 rounded-xl shadow-md transition hover:scale-[1.02]
              ${
                index === 0
                  ? 'bg-yellow-200'
                  : index === 1
                    ? 'bg-gray-200'
                    : index === 2
                      ? 'bg-orange-200'
                      : 'bg-white'
              }`}
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-lg font-bold">{index + 1}.</span>

              {/* Name */}
              <span
                className={`font-semibold ${
                  user.name === 'You' ? 'text-green-600' : ''
                }`}
              >
                {user.name}
              </span>
            </div>

            {/* XP */}
            <span className="font-bold text-blue-600">{user.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;
