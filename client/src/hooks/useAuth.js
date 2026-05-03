import { useSelector, useDispatch } from 'react-redux';
import { useNavigate }              from 'react-router-dom';
import { logoutUser }               from '../features/auth/authSlice';
import { disconnectSocket }         from '../socket/socket';
import { clearAll }                 from '../features/notifications/notificationSlice';

const useAuth = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const authState = useSelector((state) => state.auth);

  const logout = async () => {
    await dispatch(logoutUser());
    dispatch(clearAll());
    disconnectSocket();
    navigate('/login', { replace: true });
  };

  const isRole = (...roles) =>
    authState.user && roles.includes(authState.user.role);

  return {
    ...authState,
    isStudent: authState.user?.role === 'student',
    isTeacher: authState.user?.role === 'teacher',
    isParent:  authState.user?.role === 'parent',
    isRole,
    logout,
  };
};

export default useAuth;