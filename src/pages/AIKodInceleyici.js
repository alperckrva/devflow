import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Code, 
  Sparkles, 
  Copy,
  AlertTriangle,
  CheckCircle,
  Info,
  Cpu,
  Zap
} from 'lucide-react';
import aiServisi from '../services/aiService';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebaseService from '../services/firebaseService';
import toast from 'react-hot-toast';

const AIKodInceleyici = () => {
  const [girilenKod, setGirilenKod] = useState('');
  const [aiCevabi, setAiCevabi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [secilenModel, setSecilenModel] = useState('google/gemma-2-9b-it:free');
  const [availableModels, setAvailableModels] = useState([]);
  const [modelTest, setModelTest] = useState({});
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

  // Modelleri yükle
  useEffect(() => {
    const models = aiServisi.getAvailableModels();
    setAvailableModels(models);
  }, []);

  // Debug: aiCevabi değişimini takip et (production'da kaldırılacak)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AI Cevabi state değişti:', aiCevabi);
      if (aiCevabi) {
        console.log('AI cevabı var, UI\'da görünmeli!');
      } else {
        console.log('AI cevabı yok');
      }
    }
  }, [aiCevabi]);

  // Model test et
  const testSelectedModel = useCallback(async (modelId) => {
    setModelTest(prev => ({ ...prev, [modelId]: { status: 'testing' } }));
    const result = await aiServisi.testModel(modelId);
    setModelTest(prev => ({ ...prev, [modelId]: result }));
  }, []);

  // Demo analiz sonucu
  const getDemoAnalysis = useCallback(() => {
    return `🔍 **KOD ANALİZİ** (Demo Sonucu)

**📋 Kodun Amacı:**
Bu kod bir React bileşeni oluşturuyor ve veri çekme işlemi gerçekleştiriyor. useState ve useEffect hook'larını kullanarak asenkron veri yönetimi yapıyor.

**✅ Güçlü Yönler:**
• React Hook'ları doğru şekilde kullanılmış
• Loading state'i uygulanmış
• Functional component yapısı modern React prensiplerine uygun
• Dependency array doğru şekilde tanımlanmış

**⚠️ Sorunlar ve Hatalar:**
• Error handling eksik - fetch işlemi başarısız olursa hata yakalanmıyor
• Memory leak riski - component unmount olduktan sonra setState çağrılabilir
• Response status kontrolü yapılmıyor
• Loading state sadece true/false, error state yok

**🚀 İyileştirme Önerileri:**
• Try-catch bloğu ekleyin
• Cleanup function ile component unmount kontrolü yapın
• Error state ekleyin
• Response.ok kontrolü yapın
• AbortController ile request iptal etme özelliği ekleyin

**📚 Best Practices:**
• Custom hook oluşturarak veri çekme logicini ayırın
• Error boundary kullanın
• Loading skeleton gösterin
• Retry mekanizması ekleyin

**⭐ Kod Kalitesi Puanı:**
6/10 - Temel yapı doğru ama error handling ve edge case'ler eksik.

*Not: Bu demo bir sonuçtur. Gerçek AI analizi için CORS sorunu çözülmelidir.*`;
  }, []);

  // AI analizi
  const kodAnalizi = useCallback(async () => {
    if (!girilenKod.trim()) {
      const errorMsg = 'Lütfen analiz edilecek kodu girin!';
      setHata(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setYukleniyor(true);
    setHata('');
    setAiCevabi('');

    // Loading toast
    const loadingToast = toast.loading('AI kod analizi yapılıyor...', {
      duration: 30000, // Longer duration for AI analysis
    });

    try {
      const analizSonucu = await aiServisi.kodAnalizi(girilenKod, secilenModel);
      console.log('AI Cevabı alındı:', analizSonucu);
      setAiCevabi(analizSonucu);
      
      // Success toast
      toast.success('Kod analizi tamamlandı! 🤖', {
        id: loadingToast,
        duration: 3000,
      });
      
      // AI analizi başarılı oldu - istatistik artır
      if (user) {
        await firebaseService.incrementAIAnalysis(user.uid);
        toast('📊 İstatistikler güncellendi', {
          icon: '📊',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('AI API Hatası:', error);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // CORS hatası özel mesajı
      if (error.message.includes('CORS') || error.message.includes('Network') || error.message.includes('fetch')) {
        const corsErrorMsg = 'API bağlantı sorunu tespit edildi. Demo sonucu gösteriliyor...';
        setHata(corsErrorMsg);
        
        toast.error('API bağlantı sorunu', {
          duration: 4000,
        });
        
        toast('🔄 Demo sonucu yükleniyor...', {
          icon: '🔄',
          duration: 2000,
        });
        
        // Demo sonuç göster ve istatistik artır
        safeTimeout(() => {
          const demoResult = getDemoAnalysis();
          console.log('Demo cevabı ayarlanıyor:', demoResult);
          setAiCevabi(demoResult);
          
          toast.success('Demo analizi hazır! 📝', {
            duration: 3000,
          });
          
          // Demo sonucu da sayılsın
          if (user) {
            firebaseService.incrementAIAnalysis(user.uid);
          }
        }, 1000);
      } else {
        const errorMsg = error.message || 'AI analizi sırasında bir hata oluştu.';
        setHata(errorMsg);
        toast.error(errorMsg, {
          duration: 5000,
        });
      }
    } finally {
      setYukleniyor(false);
    }
  }, [girilenKod, secilenModel, user, getDemoAnalysis, safeTimeout]);

  const kopyala = useCallback(async (metin) => {
    try {
      await navigator.clipboard.writeText(metin);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  }, []);

  const ornekKodlar = useMemo(() => [
    {
      baslik: 'React Hook Örneği',
      kod: `import React, { useState, useEffect } from 'react';

const DataFetcher = ({ url }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  if (loading) return <div>Loading...</div>;
  
  return <div>{JSON.stringify(data)}</div>;
};`
    },
    {
      baslik: 'JavaScript Async Function',
      kod: `async function processUserData(userId) {
  try {
    const user = await fetchUser(userId);
    const orders = await fetchUserOrders(userId);
    
    return {
      name: user.name,
      email: user.email,
      totalOrders: orders.length,
      lastOrder: orders[orders.length - 1]
    };
  } catch (error) {
    console.log("Error:", error);
    return null;
  }
}`
    },
    {
      baslik: 'Python Data Processing',
      kod: `def process_data(data_list):
    result = []
    for item in data_list:
        if item > 0:
            result.append(item * 2)
    return result

# Usage
numbers = [1, -2, 3, -4, 5]
processed = process_data(numbers)
print(processed)`
    }
  ], []);

  const getModelIcon = useCallback((modelName) => {
    if (modelName.includes('google')) return '🟢';
    if (modelName.includes('mistral')) return '🔵';
    if (modelName.includes('deepseek')) return '🟠';
    if (modelName.includes('openchat')) return '🟡';
    if (modelName.includes('qwen')) return '🟣';
    if (modelName.includes('llama')) return '🔴';
    if (modelName.includes('cypher')) return '⚫';
    return '⚪';
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sayfa Başlığı */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Sparkles className="h-8 w-8 mr-3 text-blue-600" />
          AI Kod İnceleyici
        </h1>
        <p className={`text-lg ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          OpenRouter AI modelleri ile kodlarını analiz et, hataları bul ve iyileştirme önerileri al.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sol Panel - Kod Girişi */}
        <div className="lg:col-span-3 space-y-6">
          {/* Model Seçimi */}
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Cpu className="h-5 w-5 mr-2" />
              AI Model Seçimi
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Model Seç:
                </label>
                <select
                  value={secilenModel}
                  onChange={(e) => setSecilenModel(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {getModelIcon(model.id)} {model.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => testSelectedModel(secilenModel)}
                  disabled={modelTest[secilenModel]?.status === 'testing'}
                  className={`p-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {modelTest[secilenModel]?.status === 'testing' ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      Test Ediliyor...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Modeli Test Et
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Model Bilgisi */}
            {availableModels.find(m => m.id === secilenModel) && (
              <div className={`mt-4 p-3 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {availableModels.find(m => m.id === secilenModel).description}
                </p>
                
                {/* Model test sonucu - Always rendered */}
                <div className={`mt-2 text-xs flex items-center transition-opacity duration-300 ${
                  modelTest[secilenModel] ? 'opacity-100' : 'opacity-0'
                } ${
                  modelTest[secilenModel]?.status === 'success' 
                    ? 'text-green-600' 
                    : modelTest[secilenModel]?.status === 'error'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                }`}>
                  {modelTest[secilenModel]?.status === 'success' && '✅ '}
                  {modelTest[secilenModel]?.status === 'error' && '❌ '}
                  {modelTest[secilenModel]?.message || 'Model durumu bekleniyor...'}
                </div>
              </div>
            )}
          </div>

          {/* Kod Giriş Alanı */}
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Code className="h-5 w-5 mr-2" />
                Kodunu Buraya Yapıştır
              </h2>
              <button
                onClick={() => setGirilenKod('')}
                className={`text-sm ${
                  darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Temizle
              </button>
            </div>
            
            <textarea
              value={girilenKod}
              onChange={(e) => setGirilenKod(e.target.value)}
              placeholder="Analiz edilecek kodunu buraya yapıştır..."
              className={`w-full h-96 p-4 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            {/* Hata mesajı - Stable rendering */}
            {hata && (
              <div className="mt-4">
                <div className={`p-4 border rounded-lg ${
                  darkMode 
                    ? 'bg-red-900/50 border-red-700 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm whitespace-pre-line">{hata}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <span className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {girilenKod.length} karakter • Model: {availableModels.find(m => m.id === secilenModel)?.name || secilenModel}
              </span>
              <button
                onClick={kodAnalizi}
                disabled={yukleniyor || !girilenKod.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                {yukleniyor ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI ile Analiz Et
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Cevabı - Always rendered */}
          <div className={`rounded-xl shadow-sm border p-6 transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } ${aiCevabi ? 'opacity-100 transform translate-y-0' : 'opacity-30 transform translate-y-2'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                AI Analiz Sonucu
              </h2>
              <div className="flex space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  {availableModels.find(m => m.id === secilenModel)?.name || secilenModel}
                </span>
                {aiCevabi && (
                  <button
                    onClick={() => kopyala(aiCevabi)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Sonucu Kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className={`rounded-lg p-4 text-sm ${
              darkMode 
                ? 'bg-gray-700 text-gray-200' 
                : 'bg-gray-50 text-gray-900'
            }`}>
              {aiCevabi ? (
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                  {aiCevabi}
                </pre>
              ) : (
                <div className={`text-center py-8 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>AI analiz sonucu burada görünecek...</p>
                  <p className="text-xs mt-2">Yukarıdan kodunu yapıştır ve "AI ile Analiz Et" butonuna tıkla</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Panel - Örnek Kodlar */}
        <div className="space-y-6">
          {/* Örnek Kodlar */}
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Örnek Kodlar
            </h3>
            <div className="space-y-3">
              {ornekKodlar.map((ornek) => (
                <button
                  key={ornek.baslik}
                  onClick={() => setGirilenKod(ornek.kod)}
                  className={`w-full text-left p-3 border rounded-lg transition-colors duration-200 ${
                    darkMode 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium text-sm ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {ornek.baslik}
                  </div>
                  <div className={`text-xs mt-1 font-mono ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {ornek.kod.substring(0, 50)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIKodInceleyici; 