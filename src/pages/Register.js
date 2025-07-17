import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [emailValidating, setEmailValidating] = useState(false);
  
  const { kayitOl } = useUser();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Real-time email existence check
  const checkEmailExists = async (email) => {
    try {
      // Ücretsiz email validation API'si (Abstract API)
      const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=YOUR_API_KEY&email=${email}`);
      
      if (!response.ok) {
        // API çalışmıyorsa basic validation'a düş
        return validateEmailBasic(email);
      }
      
      const data = await response.json();
      
      if (data.is_valid_format?.value === false) {
        return { valid: false, message: 'Geçersiz email formatı' };
      }
      
      if (data.is_mx_found?.value === false) {
        return { valid: false, message: 'Bu email adresi bulunamadı' };
      }
      
      if (data.is_smtp_valid?.value === false) {
        return { valid: false, message: 'Bu email adresi mevcut değil' };
      }
      
      if (data.is_disposable?.value === true) {
        return { valid: false, message: 'Geçici email adresleri kabul edilmez' };
      }
      
      return { valid: true };
      
    } catch (error) {
      console.error('Email validation API error:', error);
      // API hatası durumunda basic validation kullan
      return validateEmailBasic(email);
    }
  };

  // Fallback basic email validation
  const validateEmailBasic = (email) => {
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Geçersiz email formatı' };
    }

    // Common disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
      'mailinator.com', 'throwaway.email', 'temp-mail.org'
    ];
    
    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) {
      return { valid: false, message: 'Geçici email adresleri kabul edilmez' };
    }

    // Check for common typos in popular domains
    const popularDomains = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com', 
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'yahooo.com': 'yahoo.com'
    };

    if (popularDomains[domain]) {
      return { 
        valid: false, 
        message: `"${domain}" yerine "${popularDomains[domain]}" demek istediniz mi?` 
      };
    }

    // Gmail için ek kontroller
    if (domain === 'gmail.com') {
      const localPart = email.split('@')[0];
      
      // Gmail'de çok kısa username kontrolü
      if (localPart.length < 3) {
        return { valid: false, message: 'Gmail adresi çok kısa görünüyor' };
      }
      
      // Gmail'de sadece random karakterler kontrolü
      const randomPattern = /^[a-z]{10,}$/; // sadece 10+ harf
      const numberPattern = /^\d+$/; // sadece rakam
      const gibberishPattern = /^[a-z]{3}[a-z]{3}[a-z]{3}[a-z]+$/; // gdfgsdfgsdfsdf gibi
      
      if (randomPattern.test(localPart) || numberPattern.test(localPart)) {
        return { 
          valid: false, 
          message: 'Gmail adresi şüpheli görünüyor. Lütfen gerçek email adresinizi girin.' 
        };
      }
      
      // Art arda aynı karakter kontrolü
      if (/(.)\1{3,}/.test(localPart)) {
        return { 
          valid: false, 
          message: 'Gmail adresi geçersiz karakter dizisi içeriyor' 
        };
      }
    }

    // Basic domain existence check (MX record simulation)
    const validDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    if (!validDomains.includes(domain) && !domain.includes('.edu') && !domain.includes('.gov')) {
      // Şüpheli domain uyarısı
      return { 
        valid: false, 
        message: `"${domain}" domain'i doğrulanamadı. Lütfen email adresinizi kontrol edin.` 
      };
    }

    return { valid: true };
  };

  const validateForm = async () => {
    const { name, email, password, confirmPassword } = formData;
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return false;
    }
    
    if (name.length < 2) {
      setError('İsim en az 2 karakter olmalı');
      return false;
    }

    // Real-time email validation
    setEmailValidating(true);
    const emailValidation = await checkEmailExists(email);
    setEmailValidating(false);
    
    if (!emailValidation.valid) {
      setError(emailValidation.message);
      return false;
    }
    
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Loading toast
      const loadingToast = toast.loading('Hesap oluşturuluyor...');
      
      await kayitOl(formData.email, formData.password, formData.name);
      
      // Success message
      const successMsg = 'Kayıt başarılı! Email doğrulama linki gönderildi. Spam klasörünüzü de kontrol etmeyi unutmayın.';
      setSuccess(successMsg);
      
      toast.success('Kayıt başarılı! 🎉', {
        id: loadingToast,
        duration: 3000,
      });
      
      // Email verification info toast
      toast('📧 Email doğrulama linki gönderildi', {
        icon: '📧',
        duration: 5000,
        style: {
          background: '#3b82f6',
          color: '#fff',
        },
      });
      
      // 3 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/ana-sayfa');
      }, 3000);
      
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss();
      
      setError(error.message);
      toast.error(error.message, {
        duration: 6000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Zayıf';
    if (password.length < 8) return 'Orta';
    return 'Güçlü';
  };

  const getPasswordColor = (password) => {
    const strength = getPasswordStrength(password);
    if (strength === 'Zayıf') return 'text-red-500';
    if (strength === 'Orta') return 'text-yellow-500';
    if (strength === 'Güçlü') return 'text-green-500';
    return '';
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Logo ve Başlık */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-600">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className={`mt-6 text-3xl font-extrabold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            DevFlow'a Kayıt Ol
          </h2>
          <p className={`mt-2 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Zaten hesabın var mı?{' '}
            <Link 
              to="/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Giriş yap
            </Link>
          </p>
        </div>

        {/* Kayıt Formu */}
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

          {success && (
            <div className={`rounded-md p-4 ${
              darkMode ? 'bg-green-900/50 border border-green-700' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                <div className={`text-sm ${
                  darkMode ? 'text-green-300' : 'text-green-700'
                }`}>
                  {success}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* İsim */}
            <div>
              <label htmlFor="name" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Adınız Soyadınız
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Adınız Soyadınız"
                disabled={loading}
              />
            </div>

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
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm ${
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm ${
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
              {formData.password && (
                <p className={`mt-1 text-xs ${getPasswordColor(formData.password)}`}>
                  Şifre gücü: {getPasswordStrength(formData.password)}
                </p>
              )}
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Şifre Tekrar
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm ${
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`mt-1 text-xs flex items-center ${
                  formData.password === formData.confirmPassword ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Şifreler eşleşiyor
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Şifreler eşleşmiyor
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Kayıt Butonu */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Kayıt Oluşturuluyor...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Kayıt Ol
                </>
              )}
            </button>
          </div>

          {/* Kullanım Şartları */}
          <div className={`text-center text-xs ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Kayıt olarak{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Kullanım Şartları
            </a>{' '}
            ve{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Gizlilik Politikası
            </a>'nı kabul etmiş olursunuz.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 