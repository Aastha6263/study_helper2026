import { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

const SmartPlannerPage = () => {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [time, setTime] = useState("");

  const addTask = () => {
    if (!input || !time) return;

    const newTask = {
      id: Date.now(),
      title: input,
      time,
    };

    setTasks([...tasks, newTask]);
    setInput("");
    setTime("");
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 p-6">

      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">Smart Planner 📅</h1>

      {/* Add Task */}
      <div className="flex gap-3 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter task..."
          className="flex-1 p-3 rounded-xl border"
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="p-3 rounded-xl border"
        />

        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 rounded-xl flex items-center gap-1"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Planner List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex justify-between items-center p-4 rounded-2xl bg-white/40 backdrop-blur-lg shadow"
          >
            <div>
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock size={14} /> {task.time}
              </p>
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              className="text-red-500"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SmartPlannerPage;