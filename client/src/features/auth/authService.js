import API, { authAPI } from '../../services/api';

export const updateUserProfile = async (profileData) => {
  const response = await authAPI.updateProfile(profileData);

  if (response.data.success && response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return {
    success: response.data.success,
    user: response.data.user,
  };
};

/* ================= REGISTER ================= */
export const registerUser = async (userData) => {
  const response = await API.post('/auth/register', userData);

  if (response.data.success) {
    localStorage.setItem(
      'user',
      JSON.stringify(response.data.user)
    );

    if (response.data.token) {
      localStorage.setItem(
        'studysync_token',
        response.data.token
      );
    }
  }

  return {
    success: response.data.success,
    user: response.data.user,
    token: response.data.token || null,
  };
};

/* ================= LOGIN ================= */
export const loginUser = async (userData) => {
  const response = await authAPI.login(userData);

  if (response.data.success) {
    localStorage.setItem(
      'user',
      JSON.stringify(response.data.user)
    );

    if (response.data.token) {
      localStorage.setItem(
        'studysync_token',
        response.data.token
      );
    }
  }

  return {
    success: response.data.success,
    user: response.data.user,
    token:
      response.data.token ||
      response.data.user?.token ||
      null,
  };
};

/* ================= LOGOUT ================= */
export const logoutUser = async () => {
  const response = await authAPI.logout();

  localStorage.removeItem('user');
  localStorage.removeItem('studysync_token');

  return {
    success: response.data.success,
    message: response.data.message,
  };
};

/* ================= GET CURRENT USER ================= */
export const getMe = async () => {
  const response = await authAPI.getMe();

  return {
    success: response.data.success,
    user: response.data.user,
  };
};