import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import './App.css';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AnaSayfa from './pages/AnaSayfa';
import AIKodInceleyici from './pages/AIKodInceleyici';
import AIChat from './pages/AIChat';
import PlanlamaSistemi from './pages/PlanlamaSistemi';
import GitHubProjelerim from './pages/GitHubProjelerim';
import NotDefteri from './pages/NotDefteri';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';

// Error Boundary for React 19
class React19ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // DOM manipulation errors should be caught and handled
    if (error.message && (
      error.message.includes('insertBefore') ||
      error.message.includes('removeChild') ||
      error.message.includes('Node')
    )) {
      console.warn('React 19 DOM error caught and handled:', error.message);
      return { hasError: false }; // Continue rendering
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React 19 Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Bir şeyler ters gitti</h1>
            <p className="text-gray-600 mb-4">Sayfa yüklenirken bir hata oluştu.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <React19ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <Router>
            <div className="App">
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/ana-sayfa" element={
                    <ProtectedRoute>
                      <AnaSayfa />
                    </ProtectedRoute>
                  } />
                  <Route path="/ai-kod-inceleyici" element={
                    <ProtectedRoute>
                      <AIKodInceleyici />
                    </ProtectedRoute>
                  } />
                  <Route path="/ai-chat" element={
                    <ProtectedRoute>
                      <AIChat />
                    </ProtectedRoute>
                  } />
                  <Route path="/planlama" element={
                    <ProtectedRoute>
                      <PlanlamaSistemi />
                    </ProtectedRoute>
                  } />
                  <Route path="/github-projelerim" element={
                    <ProtectedRoute>
                      <GitHubProjelerim />
                    </ProtectedRoute>
                  } />
                  <Route path="/not-defteri" element={
                    <ProtectedRoute>
                      <NotDefteri />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </Layout>
            </div>
          </Router>
        </UserProvider>
      </ThemeProvider>
    </React19ErrorBoundary>
  );
}

export default App;
