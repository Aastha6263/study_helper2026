import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { getMe } from './features/auth/authSlice';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AIAssistantPage from './pages/AIAssistantPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Badge from './pages/BadgesPage';
import Distraction from './pages/DistractionTrackerPage';
import Filesharing from './pages/FileSharingAdvanced';
import Focusmode from './pages/FocusModePage';
import Focusscore from './pages/FocusScorePage';
import Leaderboard from './pages/LeaderboardPage';
import NotesPage from './pages/NotesPage';
import NotificationsPage from './pages/NotificationsPage';
import ParentDashboard from './pages/ParentDashboard';
import Pomodoro from './pages/PomodoroPage';
import ProfilePage from './pages/ProfilePage';
import RoomDetailPage from './pages/RoomDetailPage';
import SettingsPage from './pages/SettingsPage';
import SmartPlanner from './pages/SmartPlannerPage';
import StudyRoom from './pages/StudyRooms';
import TasksPage from './pages/TasksPage';
import RoomsPage from './pages/RoomsPage';
import Flash from './pages/FlashcardsPage';
import QuizesPage from './pages/QuizePage';




// Layout
import AppLayout from './components/layout/AppLayout';
import AI from './pages/AIAssistantPage';


// Loader
const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

// 🔐 Private Route
const PrivateRoute = ({ children, roles }) => {
  const { user, token, hydrated = true } = useSelector((s) => s.auth);

  if (!hydrated) return <Loader />;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// 🚀 APP
const App = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) dispatch(getMe());
  }, [dispatch, token]);

  return (
    <BrowserRouter>

      <Toaster position="top-right" />

      <Routes>

        {/* 🔥 ALWAYS START FROM LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* PUBLIC */}
        <Route
          path="/login"
          element={
            token
              ? <Navigate to="/dashboard" replace />
              : <LoginPage />
          }
        />

        <Route
          path="/register"
          element={
            token
              ? <Navigate to="/dashboard" replace />
              : <RegisterPage />
          }
        />

        {/* PROTECTED */}
        <Route element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }>

          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/tasks" element={
            <PrivateRoute roles={['student']}>
              <TasksPage />
            </PrivateRoute>
          } />

          <Route path="/notes" element={
            <PrivateRoute roles={['student']}>
              <NotesPage />
            </PrivateRoute>
          } />




          <Route path="/pomodoro" element={
            <PrivateRoute roles={['student']}>
              <Pomodoro />
            </PrivateRoute>
          } />
           <Route path="/focus-mode" element={
            <PrivateRoute roles={['student']}>
              <Focusmode />
            </PrivateRoute>
          } />
         <Route path="/flashcards" element={
            <PrivateRoute roles={['student']}>
              <Flash />
            </PrivateRoute>
          } /> 
            <Route path="/ai" element={
            <PrivateRoute roles={['student']}>
              <AIAssistantPage />
            </PrivateRoute>
          } /> 
          <Route path="/ai-planner" element={
            <PrivateRoute roles={['student']}>
              <SmartPlanner />
            </PrivateRoute>
          } /> 
          <Route path="/analytics" element={
            <PrivateRoute roles={['student']}>
              <AnalyticsPage />
            </PrivateRoute>
          } /> 
           <Route path="/study-room" element={
            <PrivateRoute roles={['student']}>
              <StudyRoom />
            </PrivateRoute>
          } /> 
            <Route path="/leaderboard" element={
            <PrivateRoute roles={['student']}>
              <Leaderboard  />
            </PrivateRoute>
          } /> 
           <Route path="/badges" element={
            <PrivateRoute roles={['student']}>
              <Badge  />
            </PrivateRoute>
          } /> 
          <Route path="/focus-score" element={
            <PrivateRoute roles={['student']}>
              <Focusscore  />
            </PrivateRoute>
          } /> 
             <Route path="/distraction" element={
            <PrivateRoute roles={['student']}>
              <Distraction  />
            </PrivateRoute>
          } /> 
            <Route path="/files" element={
            <PrivateRoute roles={['student']}>
              <Filesharing  />
            </PrivateRoute>
          } /> 
          <Route path="/settings" element={
            <PrivateRoute roles={['student']}>
              <SettingsPage  />
            </PrivateRoute>
          } /> 

             <Route path="/profile" element={
            <PrivateRoute roles={['student']}>
              <ProfilePage />
            </PrivateRoute>
          } /> 
          
             <Route path="/quizes" element={
            <PrivateRoute roles={['student']}>
              <QuizesPage />
            </PrivateRoute>
          } /> 









          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />

         

          <Route path="/notifications" element={<NotificationsPage />} />

          <Route path="/parent/*" element={
            <PrivateRoute roles={['parent']}>
              <ParentDashboard />
            </PrivateRoute>
          } />

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;