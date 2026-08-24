import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ImagePage from './pages/ImagePage';
import DocumentPage from './pages/DocumentPage';
import ResearchPage from './pages/ResearchPage';
import StudentPage from './pages/StudentPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12121a', color: '#f1f5f9', border: '1px solid #2a2a3e' },
        success: { iconTheme: { primary: '#10b981', secondary: '#12121a' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#12121a' } },
      }} />
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<HomePage />} />
            <Route path="/chat"      element={<ChatPage />} />
            <Route path="/image"     element={<ImagePage />} />
            <Route path="/documents" element={<DocumentPage />} />
            <Route path="/research"  element={<ResearchPage />} />
            <Route path="/student"   element={<StudentPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
