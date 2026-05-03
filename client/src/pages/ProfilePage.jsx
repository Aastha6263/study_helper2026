import { useState, useEffect } from "react";

const ProfilePage = () => {
  const [edit, setEdit] = useState(false);

  const [profile, setProfile] = useState({
    name: "Thakur Saab",
    email: "thakur@email.com",
    bio: "Focused learner 🚀",
    skills: ["DSA", "React"],
    github: "",
    linkedin: "",
    xp: 120,
    streak: 5,
    tasks: 20,
    image: "",
  });

  const [skillInput, setSkillInput] = useState("");

  /* 🔄 LOAD */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("profile"));
    if (saved) setProfile(saved);
  }, []);

  /* 💾 SAVE */
  const saveProfile = () => {
    localStorage.setItem("profile", JSON.stringify(profile));
    setEdit(false);
    alert("Profile Updated ✅");
  };

  /* 📸 IMAGE */
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  /* ➕ ADD SKILL */
  const addSkill = () => {
    if (!skillInput) return;
    setProfile({
      ...profile,
      skills: [...profile.skills, skillInput],
    });
    setSkillInput("");
  };

  /* ❌ REMOVE SKILL */
  const removeSkill = (skill) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skill),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">

        {/* PROFILE HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={profile.image || "https://via.placeholder.com/100"}
            className="w-24 h-24 rounded-full object-cover"
            alt="profile"
          />

          {edit && (
            <input type="file" onChange={handleImage} />
          )}

          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-gray-500">{profile.email}</p>
          </div>
        </div>

        {/* EDIT FIELDS */}
        {edit && (
          <>
            <input
              className="w-full p-2 border mb-2"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
            />

            <input
              className="w-full p-2 border mb-2"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />

            <textarea
              className="w-full p-2 border mb-2"
              value={profile.bio}
              onChange={(e) =>
                setProfile({ ...profile, bio: e.target.value })
              }
            />

            <input
              placeholder="GitHub link"
              className="w-full p-2 border mb-2"
              value={profile.github}
              onChange={(e) =>
                setProfile({ ...profile, github: e.target.value })
              }
            />

            <input
              placeholder="LinkedIn link"
              className="w-full p-2 border mb-2"
              value={profile.linkedin}
              onChange={(e) =>
                setProfile({ ...profile, linkedin: e.target.value })
              }
            />
          </>
        )}

        {/* BIO */}
        <p className="mb-4">{profile.bio}</p>

        {/* SKILLS */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Skills</h3>

          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-200 px-3 py-1 rounded-full flex items-center gap-1"
              >
                {skill}
                {edit && (
                  <button onClick={() => removeSkill(skill)}>❌</button>
                )}
              </span>
            ))}
          </div>

          {edit && (
            <div className="flex gap-2 mt-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="p-2 border"
                placeholder="Add skill"
              />
              <button onClick={addSkill} className="bg-blue-500 text-white px-3">
                Add
              </button>
            </div>
          )}
        </div>

        {/* SOCIAL */}
        <div className="mb-4">
          {profile.github && <p>GitHub: {profile.github}</p>}
          {profile.linkedin && <p>LinkedIn: {profile.linkedin}</p>}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 text-center mb-4">
          <div>
            <p className="text-xl font-bold">{profile.xp}</p>
            <p>XP</p>
          </div>
          <div>
            <p className="text-xl font-bold">{profile.streak}</p>
            <p>Streak</p>
          </div>
          <div>
            <p className="text-xl font-bold">{profile.tasks}</p>
            <p>Tasks</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">
          {edit ? (
            <button
              onClick={saveProfile}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setEdit(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          )}

          {edit && (
            <button
              onClick={() => setEdit(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;