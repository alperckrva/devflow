import React, { useState, useCallback, useMemo, memo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

// 🚀 Performance: Menu item bileşeni memoize edildi
const MenuItem = memo(({ item, location, darkMode }) => (
  <Link
    to={item.yol}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${
      location.pathname === item.yol
        ? 'bg-blue-600 text-white shadow-lg'
        : darkMode
          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <span className="mr-3">{item.ikon}</span>
    <span>{item.isim}</span>
  </Link>
));

MenuItem.displayName = 'MenuItem';

// 🚀 Performance: User info bileşeni memoize edildi
const UserInfo = memo(({ user, darkMode }) => (
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
));

UserInfo.displayName = 'UserInfo';

// 🚀 Performance: User actions bileşeni memoize edildi
const UserActions = memo(({ user, darkMode, location, handleLogout }) => (
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
));

UserActions.displayName = 'UserActions';

// 🚀 Performance: Login buttons bileşeni memoize edildi
const LoginButtons = memo(({ user, darkMode }) => (
  <div className={`space-y-2 transition-all duration-300 ${
    !user ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
  }`}>
    <Link
      to="/login"
      className={`block w-full text-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        darkMode
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      Giriş Yap
    </Link>
    <Link
      to="/register"
      className={`block w-full text-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
        darkMode
          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      Kayıt Ol
    </Link>
  </div>
));

LoginButtons.displayName = 'LoginButtons';

const Layout = memo(({ children }) => {
  const [sidebarAcik, setSidebarAcik] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, cikisYap } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // 🚀 Performance: Menu items memoize edildi
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
      id: 'not-defteri',
      isim: 'Not Defteri',
      yol: '/not-defteri',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'planlama',
      isim: 'Planlama',
      yol: '/planlama',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'github-projelerim',
      isim: 'GitHub Projelerim',
      yol: '/github-projelerim',
      ikon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ], []);

  // 🚀 Performance: Event handler memoize edildi
  const handleLogout = useCallback(async () => {
    try {
      await cikisYap();
    navigate('/login');
    } catch (error) {
      console.error('Çıkış yaparken hata:', error);
    }
  }, [cikisYap, navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarAcik(prev => !prev);
  }, []);

  // Login ve register sayfalarında sidebar gizle
  const hideSidebar = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {!hideSidebar && (
        <>
          {/* Mobile Sidebar Overlay */}
          {sidebarAcik && (
            <div
              className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
              onClick={toggleSidebar}
            />
          )}

        {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
          sidebarAcik ? 'translate-x-0' : '-translate-x-full'
        }`}>
            <div className={`flex flex-col h-full ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } border-r shadow-lg`}>
              {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
              <button
                    onClick={toggleSidebar}
                    className={`mr-3 p-1 rounded-lg ${
                      darkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
              </button>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src="/devfloww.ico" 
                      alt="DevFlow" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h1 className={`ml-3 text-xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    DevFlow
                  </h1>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {darkMode ? '🌞' : '🌙'}
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                  <React.Fragment key={item.id}>
                    <MenuItem 
                      item={item} 
                      location={location} 
                      darkMode={darkMode}
                    />
                    {item.id === 'github-projelerim' && (
                      <a
                        href="/indir/app-debug.apk"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#fff",
                          textDecoration: "none",
                          marginLeft: "32px",
                          marginTop: "8px",
                          display: "block"
                        }}
                      >
                        📱 Mobil Uygulama (APK) İndir (Beta Sürüm)
                      </a>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* User section */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <UserInfo user={user} darkMode={darkMode} />
                <UserActions 
                  user={user} 
                  darkMode={darkMode} 
                  location={location} 
                  handleLogout={handleLogout}
                />
                <LoginButtons user={user} darkMode={darkMode} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toggle Button - Sidebar Kapalıyken */}
      {!hideSidebar && !sidebarAcik && (
        <button
          onClick={toggleSidebar}
          className={`fixed top-4 left-4 z-40 p-3 rounded-lg shadow-lg ${
            darkMode
              ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          } transition-all duration-200`}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

        {/* Main Content */}
      <div className={`min-h-screen ${
        !hideSidebar && sidebarAcik ? 'lg:ml-64' : ''
      } transition-all duration-300 ease-in-out`}>
        {/* Mobile Header */}
        {!hideSidebar && (
          <div className={`lg:hidden ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border-b p-4 flex items-center justify-between`}>
                  <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg ${
                darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded flex items-center justify-center mr-2 overflow-hidden">
                <img 
                  src="/devfloww.ico" 
                  alt="DevFlow" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className={`text-lg font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                DevFlow
              </h1>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${
                darkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {darkMode ? '🌞' : '🌙'}
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="p-6">
            {children}
          </main>
      </div>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout; 