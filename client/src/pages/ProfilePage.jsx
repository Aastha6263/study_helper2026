import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { updateProfile } from '../features/auth/authSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const [edit, setEdit] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    skills: [],
    github: '',
    linkedin: '',
    xp: 0,
    streak: 0,
    tasks: 0,
    avatarUrl: '',
  });

  useEffect(() => {
    if (!authUser) return;

    setProfile({
      name: authUser.name || '',
      email: authUser.email || '',
      bio: authUser.bio || '',
      skills: authUser.skills || [],
      github: authUser.github || '',
      linkedin: authUser.linkedin || '',
      xp: authUser.xp || 0,
      streak: authUser.streak || 0,
      tasks: authUser.completedTasks || 0,
      avatarUrl: authUser.avatarUrl || '',
    });
  }, [authUser]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const result = await dispatch(
        updateProfile({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          github: profile.github,
          linkedin: profile.linkedin,
          avatarUrl: profile.avatarUrl,
          skills: profile.skills,
        }),
      ).unwrap();

      setProfile((prev) => ({
        ...prev,
        xp: result.user.xp || prev.xp,
        streak: result.user.streak || prev.streak,
        tasks: result.user.completedTasks || prev.tasks,
      }));
      setEdit(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;

    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.includes(value)
        ? prev.skills
        : [...prev.skills, value],
    }));
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={profile.avatarUrl || 'https://via.placeholder.com/100'}
            alt="profile"
            className="w-24 h-24 rounded-full object-cover border"
          />

          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-gray-500">{profile.email}</p>
              </div>
              {edit && (
                <label className="text-sm text-gray-500">
                  Change avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="mt-2 block w-full text-sm"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {edit ? (
          <div className="space-y-4">
            <input
              className="w-full p-2 border rounded"
              value={profile.name}
              placeholder="Name"
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />

            <input
              className="w-full p-2 border rounded"
              value={profile.email}
              placeholder="Email"
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />

            <textarea
              className="w-full p-2 border rounded"
              value={profile.bio}
              placeholder="Bio"
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />

            <input
              className="w-full p-2 border rounded"
              value={profile.github}
              placeholder="GitHub Link"
              onChange={(e) =>
                setProfile({ ...profile, github: e.target.value })
              }
            />

            <input
              className="w-full p-2 border rounded"
              value={profile.linkedin}
              placeholder="LinkedIn Link"
              onChange={(e) =>
                setProfile({ ...profile, linkedin: e.target.value })
              }
            />

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">Skills</div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-200 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills added yet.</p>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Add skill"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-blue-500 text-white px-4 rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-gray-700">
              {profile.bio || 'No bio added yet.'}
            </p>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-200 px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills added.</p>
                )}
              </div>
            </div>

            <div className="mb-4 space-y-1">
              {profile.github && (
                <p>
                  <strong>GitHub:</strong> {profile.github}
                </p>
              )}
              {profile.linkedin && (
                <p>
                  <strong>LinkedIn:</strong> {profile.linkedin}
                </p>
              )}
            </div>
          </>
        )}

        <div className="grid grid-cols-3 text-center gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xl font-bold">{profile.xp}</p>
            <p className="text-sm text-gray-500">XP</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xl font-bold">{profile.streak}</p>
            <p className="text-sm text-gray-500">Streak</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-xl font-bold">{profile.tasks}</p>
            <p className="text-sm text-gray-500">Tasks</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {edit ? (
            <>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-green-500 disabled:opacity-60 text-white px-4 py-2 rounded"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              <button
                onClick={() => setEdit(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEdit(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
