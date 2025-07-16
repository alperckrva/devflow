import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarAcik, setSidebarAcik] = useState(true);
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, cikisYap } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo(() => [
    {
      id: 'ana-sayfa',
      isim: 'Ana Sayfa',
      yol: '/ana-sayfa',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'ai-kod-inceleyici',
      isim: 'AI Kod İnceleyici',
      yol: '/ai-kod-inceleyici',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: 'ai-chat',
      isim: 'AI Chat',
      yol: '/ai-chat',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'planlama',
      isim: 'Planlama Sistemi',
      yol: '/planlama',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'not-defteri',
      isim: 'Not Defteri',
      yol: '/not-defteri',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'github-projelerim',
      isim: 'GitHub Projelerim',
      yol: '/github-projelerim',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    }
  ], []);

  const handleLogout = useCallback(() => {
    cikisYap();
    navigate('/login');
  }, [cikisYap, navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarAcik(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarAcik(false);
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarAcik(true);
  }, []);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          sidebarAcik ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Logo/Başlık */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DevFlow</h1>
              <button
                onClick={closeSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item, index) => (
                <Link
                  key={item.id}
                  to={item.yol}
                  className={`flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    location.pathname === item.yol 
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' 
                      : ''
                  }`}
                >
                  <span className="mr-3">{item.ikon}</span>
                  {item.isim}
                </Link>
              ))}
            </nav>

            {/* Dark Mode Toggle */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={toggleDarkMode}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? (
                  <>
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Açık Tema
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Koyu Tema
                  </>
                )}
              </button>
            </div>

            {/* User Section - Always rendered */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {/* User info - visible when logged in */}
              <div className={`transition-all duration-300 ${
                user ? 'opacity-100 mb-3' : 'opacity-0 mb-0 h-0 overflow-hidden'
              }`}>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user?.displayName || 'Kullanıcı'}
                    </p>
                    <p className={`text-xs truncate ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* User actions - visible when logged in */}
              <div className={`space-y-1 transition-all duration-300 ${
                user ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
              }`}>
                <Link
                  to="/profile"
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <User className="h-4 w-4 mr-3" />
                  Profil Ayarları
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Çıkış Yap
                </button>
              </div>

              {/* Login buttons - visible when not logged in */}
              <div className={`space-y-2 transition-all duration-300 ${
                !user ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
              }`}>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Kayıt Ol
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay - Always rendered but conditionally visible */}
        <div
          className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ${
            sidebarAcik ? 'bg-opacity-50 pointer-events-auto' : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={closeSidebar}
        />

        {/* Main Content */}
        <div className={`${sidebarAcik ? 'lg:ml-64' : ''} transition-all duration-300`}>
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={openSidebar}
                    className={`p-2 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      sidebarAcik ? 'lg:hidden' : ''
                    }`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <main className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout; 