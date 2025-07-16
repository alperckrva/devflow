import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle,
  Clock,
  Trash2,
  Save
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebaseService from '../services/firebaseService';

const PlanlamaSistemi = () => {
  const [gorevler, setGorevler] = useState([]);
  const [gorevAdi, setGorevAdi] = useState('');
  const [gorevAciklamasi, setGorevAciklamasi] = useState('');
  const [secilenTarih, setSecilenTarih] = useState('');
  const [secilenKategori, setSecilenKategori] = useState('Önemli');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const [loading, setLoading] = useState(true);
  const [silmeUyarisi, setSilmeUyarisi] = useState({ acik: false, planId: null, planAdi: '' });
  const { darkMode } = useTheme();
  const { user } = useUser();

  const kategoriler = ['Önemli', 'Sınav', 'Spor', 'Ders', 'Bitirme Projesi','Dönem Projesi','İngilizce','American Life'];

  // Firebase'den planları yükle
  useEffect(() => {
    const loadPlans = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const plans = await firebaseService.planlariGetir(user.uid);
        const formattedPlans = plans.map(plan => ({
          id: Date.now() + Math.random(), // Unique local ID
          firebaseId: plan.id, // Firebase document ID'si
          baslik: plan.name || 'Başlıksız Plan',
          aciklama: plan.description || '',
          tamamlandi: plan.completed || false,
          tarih: plan.deadline?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          kategori: plan.category || 'Önemli'
        }));
        setGorevler(formattedPlans);
      } catch (error) {
        console.error('Planlar yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [user]);

  // Unsaved changes tracking
  useEffect(() => {
    if (gorevAdi.trim() || gorevAciklamasi.trim()) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [gorevAdi, gorevAciklamasi]);

  // Sayfa kapatma uyarısı
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfadan çıkmak istediğinizden emin misiniz?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Plan kaydet
  const savePlan = useCallback(async () => {
    if (!gorevAdi.trim() || !secilenTarih || !user) return;

    try {
      setSaveStatus('saving');
      
      const planData = {
        name: gorevAdi,
        description: gorevAciklamasi,
        category: secilenKategori,
        deadline: new Date(secilenTarih),
        completed: false
      };

      // Firebase'e kaydet
      const firebaseId = await firebaseService.planEkle(user.uid, planData);

      const yeniGorev = {
        id: Date.now() + Math.random(),
        firebaseId,
        baslik: gorevAdi,
        aciklama: gorevAciklamasi,
        tamamlandi: false,
        tarih: secilenTarih,
        kategori: secilenKategori
      };

      // State güncellemelerini güvenli şekilde yap
      setTimeout(() => {
        setGorevler(prev => [...prev, yeniGorev]);
        setGorevAdi('');
        setGorevAciklamasi('');
        setSecilenTarih('');
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        
        // Cleanup
        setTimeout(() => {
          setSaveStatus('');
        }, 2000);
      }, 10);
      
    } catch (error) {
      console.error('Plan kaydedilirken hata:', error);
      setTimeout(() => {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 3000);
      }, 10);
    }
  }, [gorevAdi, gorevAciklamasi, secilenTarih, secilenKategori, user]);

  // Görev durumu değiştir (Firebase'e sync)
  const gorevDurumDegistir = useCallback(async (id) => {
    const gorev = gorevler.find(g => g.id === id);
    if (!gorev || !user) return;

    try {
      const yeniDurum = !gorev.tamamlandi;
      
      // Firebase'i güncelle
      if (gorev.firebaseId) {
        await firebaseService.planTamamla(user.uid, gorev.firebaseId, yeniDurum);
      }
      
      // Local state'i güncelle
      setGorevler(prev => prev.map(g => 
        g.id === id ? { ...g, tamamlandi: yeniDurum } : g
      ));
    } catch (error) {
      console.error('Görev durumu güncellenirken hata:', error);
    }
  }, [gorevler, user]);

  // Görev sil için modal göster
  const gorevSil = useCallback((id) => {
    const gorev = gorevler.find(g => g.id === id);
    setSilmeUyarisi({ 
      acik: true, 
      planId: id, 
      planAdi: gorev?.baslik || 'Bu plan' 
    });
  }, [gorevler]);

  // Silme onayı
  const planSilmeOnay = useCallback(async () => {
    const { planId } = silmeUyarisi;
    const gorev = gorevler.find(g => g.id === planId);
    if (!gorev || !user) return;

    try {
      // Firebase'den sil
      if (gorev.firebaseId) {
        await firebaseService.planSil(user.uid, gorev.firebaseId);
      }
      
      // Local state'den sil
      setGorevler(prev => prev.filter(g => g.id !== planId));
      setSilmeUyarisi({ acik: false, planId: null, planAdi: '' });
    } catch (error) {
      console.error('Plan silinirken hata:', error);
      alert('Plan silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [silmeUyarisi, gorevler, user]);

  // Silme iptali
  const planSilmeIptal = useCallback(() => {
    setSilmeUyarisi({ acik: false, planId: null, planAdi: '' });
  }, []);

  const bugunTarihi = new Date().toISOString().split('T')[0];
  
  // Görevleri optimize edilmiş filtreleme
  const { bugunGorevleri, gelecekGorevler } = useMemo(() => {
    const bugun = gorevler.filter(gorev => gorev.tarih === bugunTarihi);
    const gelecek = gorevler.filter(gorev => gorev.tarih > bugunTarihi);
    return { bugunGorevleri: bugun, gelecekGorevler: gelecek };
  }, [gorevler, bugunTarihi]);

  // Giriş yapmamış kullanıcı kontrolü
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Giriş Yapmanız Gerekiyor
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Planlama sistemini kullanmak için lütfen giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Planlar Yükleniyor...
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Planlarınız hazırlanıyor, lütfen bekleyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sayfa Başlığı */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Calendar className="h-8 w-8 mr-3 text-green-600" />
          Planlama Sistemi
        </h1>
        <p className={`text-lg ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Günlük ve haftalık planlarını oluştur, takip et ve hedeflerine ulaş.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Panel - Görev Ekleme */}
        <div className="space-y-6">
          {/* Yeni Görev Ekleme */}
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Plus className="h-5 w-5 mr-2" />
              Yeni Görev Ekle
            </h2>
            
            <div className="space-y-4">
              <input
                type="text"
                value={gorevAdi}
                onChange={(e) => setGorevAdi(e.target.value)}
                placeholder="Görev adı..."
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <textarea
                value={gorevAciklamasi}
                onChange={(e) => setGorevAciklamasi(e.target.value)}
                placeholder="Görev açıklaması..."
                rows={4}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <input
                type="date"
                value={secilenTarih}
                onChange={(e) => setSecilenTarih(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              <select
                value={secilenKategori}
                onChange={(e) => setSecilenKategori(e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {kategoriler.map(kategori => (
                  <option key={kategori} value={kategori}>{kategori}</option>
                ))}
              </select>
              
              <button
                onClick={savePlan}
                disabled={!gorevAdi.trim() || !secilenTarih || saveStatus === 'saving'}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-h-[48px] ${
                  !gorevAdi.trim() || !secilenTarih || saveStatus === 'saving'
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {saveStatus === 'saving' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                )}
                {saveStatus === 'saved' && (
                  <svg className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {saveStatus === 'error' && (
                  <svg className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {!saveStatus && (
                  <Save className="h-5 w-5 mr-2" />
                )}
                <span>
                  {saveStatus === 'saving' ? 'Kaydediliyor...' :
                   saveStatus === 'saved' ? 'Kaydedildi' :
                   saveStatus === 'error' ? 'Hata' : 'Planı Kaydet'}
                </span>
              </button>
            </div>
          </div>

          {/* İstatistikler */}
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>İstatistikler</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Toplam Görev:</span>
                <span className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{gorevler.length}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Tamamlanan:</span>
                <span className="font-semibold text-green-600">
                  {gorevler.filter(g => g.tamamlandi).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Bekleyen:</span>
                <span className="font-semibold text-orange-600">
                  {gorevler.filter(g => !g.tamamlandi).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orta Panel - Bugünün Görevleri */}
        <div className="space-y-6">
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Bugünün Görevleri
            </h2>
            
            {bugunGorevleri.length === 0 ? (
              <p className={`text-center py-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Bugün için görev yok</p>
            ) : (
              <div className="space-y-3">
                {bugunGorevleri.map(gorev => (
                  <GorevKarti 
                    key={gorev.id} 
                    gorev={gorev} 
                    onDurumDegistir={gorevDurumDegistir}
                    onSil={gorevSil}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Panel - Gelecek Görevler */}
        <div className="space-y-6">
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Gelecek Görevler</h2>
            
            {gelecekGorevler.length === 0 ? (
              <p className={`text-center py-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Gelecek görev yok</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {gelecekGorevler.map(gorev => (
                  <GorevKarti 
                    key={gorev.id} 
                    gorev={gorev} 
                    onDurumDegistir={gorevDurumDegistir}
                    onSil={gorevSil}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Silme Uyarısı Modal */}
      {silmeUyarisi.acik && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl max-w-md w-full transform scale-100 transition-all ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6 text-center">
              {/* Uyarı İkonu */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Başlık */}
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Planı Sil
              </h3>
              
              {/* Mesaj */}
              <p className={`text-sm mb-6 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>"{silmeUyarisi.planAdi}"</span> adlı planı silmek istediğinizden emin misiniz? 
                <br />
                <span className="text-red-600 font-medium">Bu işlem geri alınamaz.</span>
              </p>
              
              {/* Butonlar */}
              <div className="flex space-x-3">
                <button
                  onClick={planSilmeIptal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={planSilmeOnay}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Görev kartı bileşeni
const GorevKarti = ({ gorev, onDurumDegistir, onSil, darkMode }) => {
  const kategoriRenkleri = {
    'Önemli': darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800',
    'Sınav': darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800',
    'Spor': darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800',
    'Ders': darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800',
    'Bitirme Projesi': darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-800',
    'Dönem Projesi': darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-800',
    'İngilizce': darkMode ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-800',
    'American Life': darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className={`p-4 border rounded-lg transition-all duration-200 ${
      gorev.tamamlandi 
        ? darkMode 
          ? 'bg-green-900/20 border-green-700' 
          : 'bg-green-50 border-green-200'
        : darkMode
          ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
          : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onDurumDegistir(gorev.id)}
            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              gorev.tamamlandi 
                ? 'bg-green-500 border-green-500' 
                : darkMode
                  ? 'border-gray-500 hover:border-green-500'
                  : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {gorev.tamamlandi && (
              <CheckCircle className="w-3 h-3 text-white" />
            )}
          </button>
          
          <div className="flex-1">
            <p className={`font-medium ${
              gorev.tamamlandi 
                ? darkMode ? 'line-through text-gray-400' : 'line-through text-gray-500'
                : darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {gorev.baslik}
            </p>
            {gorev.aciklama && (
              <p className={`text-sm mt-1 ${
                gorev.tamamlandi 
                  ? darkMode ? 'line-through text-gray-500' : 'line-through text-gray-400'
                  : darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {gorev.aciklama}
              </p>
            )}
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${kategoriRenkleri[gorev.kategori]}`}>
                {gorev.kategori}
              </span>
              <span className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{gorev.tarih}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onSil(gorev.id)}
          className={`p-1 ${
            darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PlanlamaSistemi; 