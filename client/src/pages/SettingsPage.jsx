import { useState, useEffect } from "react";

const SettingsPage = () => {

  const [settings, setSettings] = useState({
    name: "",
    email: "",
    darkMode: false,
    notifications: true,
    language: "English",
  });

  /* 🔄 LOAD FROM LOCAL STORAGE */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("settings"));
    if (saved) setSettings(saved);
  }, []);

  /* 💾 SAVE SETTINGS */
  const saveSettings = () => {
    localStorage.setItem("settings", JSON.stringify(settings));
    alert("Settings Saved ✅");
  };

  /* 🔁 RESET */
  const resetSettings = () => {
    localStorage.removeItem("settings");
    window.location.reload();
  };

  /* 🚪 LOGOUT */
  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className={`min-h-screen p-6 ${
      settings.darkMode ? "bg-gray-900 text-white" : "bg-blue-100"
    }`}>

      <h1 className="text-3xl font-bold text-center mb-6">
        ⚙️ Settings
      </h1>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow space-y-4">

        {/* 👤 PROFILE */}
        <div>
          <label>Name</label>
          <input
            value={settings.name}
            onChange={(e) => setSettings({...settings, name: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Email</label>
          <input
            value={settings.email}
            onChange={(e) => setSettings({...settings, email: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* 🌙 DARK MODE */}
        <div className="flex justify-between">
          <span>Dark Mode</span>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={() => setSettings({
              ...settings,
              darkMode: !settings.darkMode
            })}
          />
        </div>

        {/* 🔔 NOTIFICATIONS */}
        <div className="flex justify-between">
          <span>Notifications</span>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={() => setSettings({
              ...settings,
              notifications: !settings.notifications
            })}
          />
        </div>

        {/* 🌐 LANGUAGE */}
        <div>
          <label>Language</label>
          <select
            value={settings.language}
            onChange={(e) => setSettings({
              ...settings,
              language: e.target.value
            })}
            className="w-full p-2 border rounded"
          >
            <option>English</option>
            <option>Hindi</option>
          </select>
        </div>

        {/* 💾 SAVE */}
        <button
          onClick={saveSettings}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Save Settings
        </button>

        {/* 🔁 RESET */}
        <button
          onClick={resetSettings}
          className="w-full bg-gray-500 text-white p-2 rounded"
        >
          Reset Settings
        </button>

        {/* 🚪 LOGOUT */}
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white p-2 rounded"
        >
          Logout
        </button>

      </div>

    </div>
  );
};

export default SettingsPage;