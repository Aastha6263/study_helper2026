import { useState } from "react";

const FocusScorePage = () => {
  const [data] = useState({
    studyTime: 120,      // minutes
    pauses: 3,
    tabSwitches: 2,
    sessions: 4,
  });

  // 🔥 Calculate Score
  const score =
    data.studyTime * 2 -
    data.pauses * 5 -
    data.tabSwitches * 3 +
    data.sessions * 10;

  // Clamp score
  const finalScore = Math.max(0, Math.min(100, score));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">

      <h1 className="text-3xl font-bold text-center mb-6">
        🎯 Focus Score
      </h1>

      {/* Score Card */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow text-center">

        <div className="text-6xl font-bold text-blue-600">
          {finalScore}%
        </div>

        <p className="mt-2 text-gray-600">
          Your concentration level
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-3 rounded mt-4">
          <div
            className="bg-blue-500 h-3 rounded"
            style={{ width: `${finalScore}%` }}
          />
        </div>

      </div>

      {/* Details */}
      <div className="max-w-md mx-auto mt-6 bg-white p-4 rounded-xl shadow space-y-2">

        <p>⏱ Study Time: {data.studyTime} min</p>
        <p>⏸ Pauses: {data.pauses}</p>
        <p>🔄 Tab Switches: {data.tabSwitches}</p>
        <p>🍅 Sessions: {data.sessions}</p>

      </div>

    </div>
  );
};

export default FocusScorePage;