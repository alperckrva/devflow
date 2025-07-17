import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { Eye, EyeOff, LogIn, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import firebaseService from '../services/firebaseService';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  
  const { girisYap } = useUser();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      const errorMsg = 'Lütfen tüm alanları doldurun';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Loading toast
      const loadingToast = toast.loading('Giriş yapılıyor...');
      
      await girisYap(email, password);
      
      // Success toast
      toast.success('Başarıyla giriş yapıldı! 🎉', {
        id: loadingToast,
        duration: 2000,
      });
      
      // Navigate after short delay for user to see success message
      setTimeout(() => {
        navigate('/ana-sayfa');
      }, 1000);
      
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss();
      
      // Daha kullanıcı dostu hata mesajları
      let errorMessage = error.message;
      
      // Firebase'den gelen İngilizce hataları Türkçe'ye çevir
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'Bu email adresi ile kayıtlı hesap bulunamadı';
            break;
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Email veya şifre hatalı';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Çok fazla hatalı deneme. Lütfen bir süre bekleyip tekrar deneyin';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Bu hesap devre dışı bırakılmış';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Geçersiz email formatı';
            break;
          default:
            // FirebaseService'den gelen mesajı kullan
            errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
      
      // Hatalı giriş durumunda şifre alanını temizle
      if (errorMessage.includes('Email veya şifre hatalı') || 
          errorMessage.includes('hesap bulunamadı') ||
          errorMessage.includes('hatalı deneme')) {
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setError('Lütfen email adresinizi girin');
      return;
    }

    try {
      setForgotPasswordLoading(true);
      setError('');
      setForgotPasswordSuccess('');
      
      const message = await firebaseService.sifreSifirlamaGonder(forgotPasswordEmail);
      setForgotPasswordSuccess(message);
      
      // 5 saniye sonra login ekranına dön
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setForgotPasswordSuccess('');
      }, 5000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const resetForgotPasswordForm = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setError('');
    setForgotPasswordSuccess('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Logo ve Başlık */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h2 className={`mt-6 text-3xl font-extrabold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            DevFlow'a Giriş Yap
          </h2>
          <p className={`mt-2 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Hesabın yok mu?{' '}
            <Link 
              to="/register" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Kayıt ol
            </Link>
          </p>
        </div>

        {/* Giriş Formu */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`rounded-md p-4 ${
              darkMode ? 'bg-red-900/50 border border-red-700' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                <div className={`text-sm ${
                  darkMode ? 'text-red-300' : 'text-red-700'
                }`}>
                  {error}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="ornek@email.com"
                disabled={loading}
              />
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Şifre
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Giriş Butonu */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Giriş Yapılıyor...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Giriş Yap
                </>
              )}
            </button>
          </div>

          {/* Şifremi Unuttum */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className={`text-sm font-medium hover:underline transition-colors ${
                darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              Şifremi Unuttum
            </button>
          </div>

        </form>

        {/* Şifre Sıfırlama Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`max-w-md w-full rounded-xl shadow-lg p-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Şifre Sıfırlama
                </h3>
                <button
                  onClick={resetForgotPasswordForm}
                  className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>

              {/* Success Message */}
              {forgotPasswordSuccess && (
                <div className={`mb-4 p-4 rounded-lg ${
                  darkMode ? 'bg-green-900/50 border border-green-700' : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex">
                    <Mail className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                    <div className={`text-sm ${
                      darkMode ? 'text-green-300' : 'text-green-700'
                    }`}>
                      {forgotPasswordSuccess}
                      <br />
                      <span className="text-xs opacity-75">
                        Spam klasörünüzü de kontrol etmeyi unutmayın.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className={`mb-4 p-4 rounded-lg ${
                  darkMode ? 'bg-red-900/50 border border-red-700' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                    <div className={`text-sm ${
                      darkMode ? 'text-red-300' : 'text-red-700'
                    }`}>
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label htmlFor="forgot-email" className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email Adresiniz
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="ornek@email.com"
                    disabled={forgotPasswordLoading}
                  />
                  <p className={`mt-1 text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Şifre sıfırlama linki bu email adresine gönderilecek.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={resetForgotPasswordForm}
                    className={`flex-1 py-2 px-4 border rounded-md text-sm font-medium transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={forgotPasswordLoading}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <div className="inline-block animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      'Email Gönder'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 