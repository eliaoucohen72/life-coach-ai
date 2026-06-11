import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from '../pages/OnboardingPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:conversationId" element={<ChatPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
