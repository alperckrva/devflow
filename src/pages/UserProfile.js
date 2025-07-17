import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff,
  Shield,
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebaseService from '../services/firebaseService';

const UserProfile = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changeStatus, setChangeStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailVerificationStatus, setEmailVerificationStatus] = useState('idle'); // 'idle', 'sending', 'sent', 'checking'
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const { darkMode } = useTheme();
  const { user } = useUser();
  const timeoutRefs = useRef([]);

  // Cleanup function
  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  // Component cleanup
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Safe timeout function
  const safeTimeout = useCallback((callback, delay) => {
    const timeoutId = setTimeout(() => {
      callback();
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId);
    }, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Şifre güvenlik kontrolü
  const validatePassword = useMemo(() => {
    const minLength = newPassword.length >= 6;
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    
    return {
      minLength,
      hasLower,
      hasUpper,
      hasNumber,
      isValid: minLength && hasLower && hasUpper && hasNumber
    };
  }, [newPassword]);

  // Form validation
  const isFormValid = useMemo(() => {
    return currentPassword && 
           newPassword && 
           confirmPassword && 
           validatePassword.isValid && 
           newPassword === confirmPassword;
  }, [currentPassword, newPassword, confirmPassword, validatePassword.isValid]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  // Clear email verification messages
  const clearEmailMessages = useCallback(() => {
    setEmailVerificationMessage('');
  }, []);

  // Cooldown timer kontrolü
  useEffect(() => {
    if (!user) return;
    
    const checkCooldown = () => {
      const lastSent = localStorage.getItem(`emailVerification_${user.uid}`);
      if (lastSent) {
        const timeSinceLastSent = Date.now() - parseInt(lastSent);
        const cooldownSeconds = 60;
        if (timeSinceLastSent < cooldownSeconds * 1000) {
          const remainingSeconds = Math.ceil((cooldownSeconds * 1000 - timeSinceLastSent) / 1000);
          setCooldownTime(remainingSeconds);
          return;
        }
      }
      setCooldownTime(0);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Email doğrulama gönder
  const handleSendEmailVerification = useCallback(async () => {
    clearEmailMessages();
    
    try {
      setEmailVerificationStatus('sending');
      const message = await firebaseService.emailDogrulamaGonder();
      setEmailVerificationMessage(message);
      setEmailVerificationStatus('sent');
      
      // 5 saniye sonra mesajı temizle
      safeTimeout(() => {
        setEmailVerificationMessage('');
        setEmailVerificationStatus('idle');
      }, 5000);
      
    } catch (error) {
      setEmailVerificationMessage(error.message);
      setEmailVerificationStatus('idle');
      
      // 5 saniye sonra hata mesajını temizle
      safeTimeout(() => {
        setEmailVerificationMessage('');
      }, 5000);
    }
  }, [clearEmailMessages, safeTimeout]);

  // Email doğrulama durumunu kontrol et
  const handleCheckEmailVerification = useCallback(async () => {
    clearEmailMessages();
    
    try {
      setEmailVerificationStatus('checking');
      const isVerified = await firebaseService.emailDogrulumunuKontrolEt();
      
      if (isVerified) {
        setEmailVerificationMessage('Email başarıyla doğrulandı! Sayfa yenileniyor...');
        setEmailVerificationStatus('idle');
        
        // Sayfayı yenile
        safeTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setEmailVerificationMessage('Email henüz doğrulanmamış. Lütfen email kutunuzu kontrol edin.');
        setEmailVerificationStatus('idle');
        
        safeTimeout(() => {
          setEmailVerificationMessage('');
        }, 3000);
      }
      
    } catch (error) {
      setEmailVerificationMessage(error.message);
      setEmailVerificationStatus('idle');
      
      safeTimeout(() => {
        setEmailVerificationMessage('');
      }, 5000);
    }
  }, [clearEmailMessages, safeTimeout]);

  // Şifre değiştirme
  const handlePasswordChange = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    clearMessages();
    
    if (!isFormValid) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setErrorMessage('Lütfen tüm alanları doldurun');
        setChangeStatus('error');
      } else if (newPassword !== confirmPassword) {
        setErrorMessage('Yeni şifreler eşleşmiyor');
        setChangeStatus('error');
      } else if (!validatePassword.isValid) {
        setErrorMessage('Yeni şifre güvenlik gereksinimlerini karşılamıyor');
        setChangeStatus('error');
      }
      return;
    }

    setChangeStatus('saving');
    
    try {
      await firebaseService.sifreDegistir(currentPassword, newPassword);
      
      setChangeStatus('success');
      setSuccessMessage('Şifreniz başarıyla değiştirildi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      safeTimeout(() => {
        setSuccessMessage('');
        setChangeStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      setErrorMessage(error.message);
      setChangeStatus('error');
      
      // Clear error message after 5 seconds
      safeTimeout(() => {
        setErrorMessage('');
        setChangeStatus('idle');
      }, 5000);
    }
  }, [isFormValid, currentPassword, newPassword, confirmPassword, validatePassword.isValid, clearMessages, safeTimeout]);

  // Toggle functions
  const toggleCurrentPassword = useCallback(() => setShowCurrentPassword(prev => !prev), []);
  const toggleNewPassword = useCallback(() => setShowNewPassword(prev => !prev), []);
  const toggleConfirmPassword = useCallback(() => setShowConfirmPassword(prev => !prev), []);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Giriş Yapmanız Gerekiyor
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Profil ayarlarını görüntülemek için lütfen giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sayfa Başlığı */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <User className="h-8 w-8 mr-3 text-blue-600" />
          Profil Ayarları
        </h1>
        <p className={`text-lg ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Hesap bilgilerini yönet ve güvenlik ayarlarını güncelle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Panel - Kullanıcı Bilgileri */}
        <div className="space-y-6">
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <User className="h-5 w-5 mr-2" />
              Kullanıcı Bilgileri
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  darkMode ? 'bg-blue-600' : 'bg-blue-100'
                }`}>
                  <User className={`h-6 w-6 ${
                    darkMode ? 'text-white' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className={`font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user.displayName || 'Kullanıcı'}
                  </p>
                  <p className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Hoş geldin!
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className={`h-5 w-5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Email</p>
                  <p className={`${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Shield className={`h-5 w-5 ${
                  user.emailVerified ? 'text-green-500' : 'text-orange-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Email Durumu</p>
                  <p className={`text-sm ${
                    user.emailVerified ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {user.emailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                  </p>
                </div>
              </div>
              
              {/* Email Doğrulama Aksiyonları */}
              {!user.emailVerified && (
                <div className={`p-4 rounded-lg border-2 border-dashed ${
                  darkMode ? 'border-orange-600 bg-orange-900/20' : 'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className={`text-sm font-medium mb-2 ${
                        darkMode ? 'text-orange-200' : 'text-orange-800'
                      }`}>
                        Email Adresinizi Doğrulayın
                      </p>
                                             <p className={`text-xs mb-3 ${
                         darkMode ? 'text-orange-300' : 'text-orange-700'
                       }`}>
                         Hesabınızın güvenliği için email adresinizi doğrulamanız önemlidir.
                       </p>
                       
                       <div className={`mb-3 p-2 rounded border-l-4 ${
                         darkMode 
                           ? 'bg-blue-900/20 border-blue-600 text-blue-200' 
                           : 'bg-blue-50 border-blue-400 text-blue-700'
                       }`}>
                         <p className="text-xs font-medium mb-1">📧 Email Gelmedi Mi?</p>
                         <p className="text-xs">
                           • Spam/Gereksiz klasörünüzü kontrol edin<br/>
                           • Email adresi: <span className="font-mono">noreply@devflow-platform.firebaseapp.com</span><br/>
                           • Gmail kullanıyorsanız "Sosyal" sekmesine bakın
                         </p>
                       </div>
                      
                      {/* Email Verification Messages */}
                      {emailVerificationMessage && (
                        <div className={`mb-3 p-2 rounded text-xs ${
                          emailVerificationStatus === 'sent' 
                            ? (darkMode ? 'bg-green-900/50 text-green-200 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200')
                            : (darkMode ? 'bg-red-900/50 text-red-200 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200')
                        }`}>
                          {emailVerificationMessage}
                        </div>
                      )}
                      
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={handleSendEmailVerification}
                          disabled={emailVerificationStatus === 'sending' || cooldownTime > 0}
                          className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                            emailVerificationStatus === 'sending' || cooldownTime > 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}
                        >
                          {emailVerificationStatus === 'sending' ? (
                            <>
                              <div className="inline-block animate-spin h-3 w-3 mr-1 border border-white border-t-transparent rounded-full"></div>
                              Gönderiliyor...
                            </>
                          ) : cooldownTime > 0 ? (
                            `${cooldownTime}s Bekleyin`
                          ) : (
                            'Doğrulama Emaili Gönder'
                          )}
                        </button>
                        
                        <button
                          onClick={handleCheckEmailVerification}
                          disabled={emailVerificationStatus === 'checking'}
                          className={`text-xs px-3 py-1.5 rounded font-medium border transition-colors ${
                            emailVerificationStatus === 'checking'
                              ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                              : darkMode 
                                ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20'
                                : 'border-orange-600 text-orange-600 hover:bg-orange-50'
                          }`}
                        >
                          {emailVerificationStatus === 'checking' ? (
                            <>
                              <div className="inline-block animate-spin h-3 w-3 mr-1 border border-orange-500 border-t-transparent rounded-full"></div>
                              Kontrol Ediliyor...
                            </>
                          ) : (
                            'Doğrulama Durumunu Kontrol Et'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Panel - Şifre Değiştirme */}
        <div className="lg:col-span-2">
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-6 flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Lock className="h-5 w-5 mr-2" />
              Şifre Değiştir
            </h2>

            {/* Messages - Always rendered with fixed height */}
            <div className="min-h-[60px] mb-6">
              <div className={`transition-all duration-300 ${
                errorMessage ? 'opacity-100 mb-4' : 'opacity-0 mb-0'
              }`}>
                <div className={`p-4 border rounded-lg ${
                  darkMode 
                    ? 'bg-red-900/50 border-red-700 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">{errorMessage || 'Hata mesajı'}</div>
                  </div>
                </div>
              </div>

              <div className={`transition-all duration-300 ${
                successMessage ? 'opacity-100 mb-4' : 'opacity-0 mb-0'
              }`}>
                <div className={`p-4 border rounded-lg ${
                  darkMode 
                    ? 'bg-green-900/50 border-green-700 text-green-300' 
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">{successMessage || 'Başarı mesajı'}</div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* Mevcut Şifre */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Mevcut Şifre
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Mevcut şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={toggleCurrentPassword}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Yeni Şifre */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Yeni Şifre
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Yeni şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={toggleNewPassword}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Şifre Güvenlik Göstergesi - Always rendered */}
                <div className="mt-3">
                  <div className={`transition-all duration-300 ${
                    newPassword ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
                  }`}>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center space-x-2 ${
                        validatePassword.minLength ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validatePassword.minLength ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        <span>En az 6 karakter</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${
                        validatePassword.hasLower ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validatePassword.hasLower ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        <span>Küçük harf</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${
                        validatePassword.hasUpper ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validatePassword.hasUpper ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        <span>Büyük harf</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${
                        validatePassword.hasNumber ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validatePassword.hasNumber ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        <span>Rakam</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Şifre Tekrar */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Yeni Şifre (Tekrar)
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${
                      confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : ''
                    }`}
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPassword}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password match indicator - Always rendered */}
                <div className="mt-1 h-6">
                  <div className={`transition-all duration-300 ${
                    confirmPassword && newPassword !== confirmPassword ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <p className="text-sm text-red-600">Şifreler eşleşmiyor</p>
                  </div>
                </div>
              </div>

              {/* Kaydet Butonu */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isFormValid || changeStatus === 'saving'}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center min-w-[140px] justify-center ${
                    !isFormValid || changeStatus === 'saving'
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {changeStatus === 'saving' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Değiştiriliyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Şifreyi Değiştir
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 