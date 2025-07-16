import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Code, 
  Link, 
  Star, 
  Eye,
  Calendar,
  User,
  Trash2,
  Save
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebaseService from '../services/firebaseService';

const GitHubProjelerim = () => {
  const [projeUrl, setProjeUrl] = useState('');
  const [projeler, setProjeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [secilenProje, setSecilenProje] = useState(null);
  const [silmeUyarisi, setSilmeUyarisi] = useState({ acik: false, projeId: null, projeIsim: '' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();
  const { user } = useUser();

  // Firebase'den projeleri yükle
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const projects = await firebaseService.projeleriGetir(user.uid);
        const formattedProjects = projects.map(project => ({
          id: Date.now() + Math.random(), // Unique local ID
          firebaseId: project.id, // Firebase document ID'si
          isim: project.name || 'Başlıksız Proje',
          aciklama: project.description || 'Açıklama bulunmuyor',
          url: project.url || '',
          dil: project.language || 'Bilinmiyor',
          yildiz: project.stars || 0,
          fork: project.forks || 0,
          watchers: project.watchers || 0,
          guncellemeTarihi: project.updatedAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          sonCommit: project.lastCommit || 'Commit bulunamadı',
          commitler: project.commits || [],
          owner: project.owner || '',
          defaultBranch: project.defaultBranch || 'main'
        }));
        setProjeler(formattedProjects);
      } catch (error) {
        console.error('Projeler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  // Unsaved changes tracking
  useEffect(() => {
    if (projeUrl.trim()) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [projeUrl]);

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

  // Proje kaydet (Firebase'e)
  const saveProject = useCallback(async () => {
    if (!projeUrl.trim() || !user) return;

    // GitHub URL format kontrolü
    const githubUrlRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+/;
    if (!githubUrlRegex.test(projeUrl)) {
      setHata('Geçerli bir GitHub URL formatı girin! (örn: https://github.com/kullanici/proje)');
      return;
    }

    try {
      setSaveStatus('saving');
      setHata('');
      
      // GitHub API'den proje detaylarını al
      const projeDetaylari = await githubProjeDetaylariniAl(projeUrl);
      
      const projectData = {
        name: projeDetaylari.isim,
        description: projeDetaylari.aciklama,
        url: projeDetaylari.url,
        language: projeDetaylari.dil,
        stars: projeDetaylari.yildiz,
        forks: projeDetaylari.fork,
        watchers: projeDetaylari.watchers,
        lastCommit: projeDetaylari.sonCommit,
        commits: projeDetaylari.commitler,
        owner: projeDetaylari.owner,
        defaultBranch: projeDetaylari.defaultBranch
      };

      // Firebase'e kaydet
      const firebaseId = await firebaseService.projeEkle(user.uid, projectData);

      const yeniProje = {
        ...projeDetaylari,
        firebaseId
      };

      // State güncellemelerini güvenli şekilde yap
      setTimeout(() => {
        setProjeler(prev => [...prev, yeniProje]);
        setProjeUrl('');
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        
        // Cleanup
        setTimeout(() => {
          setSaveStatus('');
        }, 2000);
      }, 10);
      
    } catch (error) {
      console.error('Proje kaydedilirken hata:', error);
      setHata(error.message || 'Proje bilgileri alınamadı. URL\'yi kontrol edin.');
      setTimeout(() => {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 3000);
      }, 10);
    }
  }, [projeUrl, user]);

  // Gerçek GitHub API entegrasyonu
  const githubProjeDetaylariniAl = async (url) => {
    try {
      const urlParcalari = url.split('/');
      const owner = urlParcalari[urlParcalari.length - 2];
      const repo = urlParcalari[urlParcalari.length - 1];
      
      // Repo bilgilerini al
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!repoResponse.ok) {
        throw new Error('Repo bulunamadı');
      }
      const repoData = await repoResponse.json();
      
      // Son commit bilgilerini al
      const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`);
      let commitler = [];
      if (commitsResponse.ok) {
        const commitsData = await commitsResponse.json();
        commitler = commitsData.map((commit, index) => ({
          id: index + 1,
          mesaj: commit.commit.message,
          tarih: new Date(commit.commit.author.date).toISOString().split('T')[0],
          yazar: commit.commit.author.name,
          sha: commit.sha.substring(0, 7)
        }));
      }
      
      return {
        id: Date.now(),
        isim: repoData.name,
        aciklama: repoData.description || 'Açıklama bulunmuyor',
        url: repoData.html_url,
        dil: repoData.language || 'Bilinmiyor',
        yildiz: repoData.stargazers_count || 0,
        fork: repoData.forks_count || 0,
        watchers: repoData.watchers_count || 0,
        guncellemeTarihi: new Date(repoData.updated_at).toISOString().split('T')[0],
        sonCommit: commitler.length > 0 ? commitler[0].mesaj : 'Commit bulunamadı',
        commitler: commitler,
        owner: repoData.owner.login,
        defaultBranch: repoData.default_branch
      };
    } catch (error) {
      console.error('GitHub API Hatası:', error);
      throw new Error('Proje bilgileri alınamadı. Repo genel mi? URL doğru mu?');
    }
  };

  // Proje silme fonksiyonları
  const projeSil = useCallback((id) => {
    const silinecekProje = projeler.find(proje => proje.id === id);
    setSilmeUyarisi({ 
      acik: true, 
      projeId: id, 
      projeIsim: silinecekProje?.isim || 'Bu proje' 
    });
  }, [projeler]);

  const projeSilmeOnay = useCallback(async () => {
    const { projeId } = silmeUyarisi;
    const silinecekProje = projeler.find(proje => proje.id === projeId);
    
    try {
      // Firebase'den sil
      if (silinecekProje?.firebaseId && user) {
        await firebaseService.projeSil(user.uid, silinecekProje.firebaseId);
      }
      
      // Local state'den sil
      setProjeler(prev => prev.filter(proje => proje.id !== projeId));
      if (secilenProje && secilenProje.id === projeId) {
        setSecilenProje(null);
      }
      setSilmeUyarisi({ acik: false, projeId: null, projeIsim: '' });
    } catch (error) {
      console.error('Proje silinirken hata:', error);
      alert('Proje silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [silmeUyarisi, projeler, user, secilenProje]);

  const projeSilmeIptal = useCallback(() => {
    setSilmeUyarisi({ acik: false, projeId: null, projeIsim: '' });
  }, []);

  const dilRenkleri = {
    'JavaScript': 'bg-yellow-100 text-yellow-800',
    'TypeScript': 'bg-blue-100 text-blue-800',
    'Python': 'bg-green-100 text-green-800',
    'Java': 'bg-red-100 text-red-800',
    'HTML': 'bg-orange-100 text-orange-800',
    'CSS': 'bg-purple-100 text-purple-800'
  };

  // Giriş yapmamış kullanıcı kontrolü
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Giriş Yapmanız Gerekiyor
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            GitHub projelerini takip etmek için lütfen giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Projeler Yükleniyor...
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            GitHub projeleriniz hazırlanıyor, lütfen bekleyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Sayfa Başlığı */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Code className="h-8 w-8 mr-3 text-purple-600" />
          GitHub Projelerim
        </h1>
        <p className={`text-lg ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          GitHub projelerini ekle, takip et ve commit geçmişini görüntüle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sol Panel - Proje Ekleme */}
        <div className="space-y-6">
          <div className={`rounded-xl shadow-sm border p-6 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Link className="h-5 w-5 mr-2" />
              Proje Ekle
            </h2>
            
            <div className="space-y-4">
              <input
                type="url"
                value={projeUrl}
                onChange={(e) => setProjeUrl(e.target.value)}
                placeholder="https://github.com/kullanici/proje"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              
              {hata && (
                <div className={`p-3 border rounded-lg ${
                  darkMode 
                    ? 'bg-red-900 border-red-700 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <span className="text-sm">{hata}</span>
                </div>
              )}
              
              <button
                onClick={saveProject}
                disabled={!projeUrl.trim() || saveStatus === 'saving'}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-h-[48px] ${
                  !projeUrl.trim() || saveStatus === 'saving'
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
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
                   saveStatus === 'error' ? 'Hata' : 'Projeyi Kaydet'}
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
                }`}>Toplam Proje:</span>
                <span className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{projeler.length}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Toplam Yıldız:</span>
                <span className="font-semibold text-yellow-600">
                  {projeler.reduce((toplam, proje) => toplam + proje.yildiz, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Toplam Fork:</span>
                <span className="font-semibold text-blue-600">
                  {projeler.reduce((toplam, proje) => toplam + proje.fork, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Toplam Watching:</span>
                <span className="font-semibold text-green-600">
                  {projeler.reduce((toplam, proje) => toplam + (proje.watchers || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orta Panel - Proje Listesi */}
        <div className="lg:col-span-2 space-y-4">
          {projeler.length === 0 ? (
            <div className={`rounded-xl shadow-sm border p-8 text-center ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className={`${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Henüz proje eklenmemiş</p>
              <p className={`text-sm mt-2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>GitHub URL'si ile proje ekleyebilirsin</p>
            </div>
          ) : (
            projeler.map(proje => (
              <ProjeKarti 
                key={proje.id} 
                proje={proje} 
                dilRenkleri={dilRenkleri}
                onProjeSecimi={() => setSecilenProje(proje)}
                seciliMi={secilenProje?.id === proje.id}
                darkMode={darkMode}
                onProjeSil={projeSil}
              />
            ))
          )}
        </div>

        {/* Sağ Panel - Proje Detayları */}
        <div className="space-y-6">
          {secilenProje ? (
            <ProjeDetayi proje={secilenProje} darkMode={darkMode} />
          ) : (
            <div className={`rounded-xl shadow-sm border p-6 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-center ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Detayları görmek için bir proje seçin
              </p>
            </div>
          )}
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
                Projeyi Sil
              </h3>
              
              {/* Mesaj */}
              <p className={`text-sm mb-6 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>"{silmeUyarisi.projeIsim}"</span> adlı projeyi listeden kaldırmak istediğinizden emin misiniz? 
                <br />
                <span className="text-red-600 font-medium">Bu işlem geri alınamaz.</span>
              </p>
              
              {/* Butonlar */}
              <div className="flex space-x-3">
                <button
                  onClick={projeSilmeIptal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={projeSilmeOnay}
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

// Proje kartı bileşeni
const ProjeKarti = ({ proje, dilRenkleri, onProjeSecimi, seciliMi, darkMode, onProjeSil }) => {
  return (
    <div 
      onClick={onProjeSecimi}
      className={`rounded-xl shadow-sm border p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } ${
        seciliMi 
          ? 'border-purple-500 ring-2 ring-purple-200' 
          : darkMode 
            ? 'border-gray-700' 
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className={`text-lg font-semibold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{proje.isim}</h3>
        <div className="flex items-center space-x-2">
          <a 
            href={proje.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`hover:text-purple-600 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <Link className="h-5 w-5" />
          </a>
          <button
            onClick={(e) => {e.stopPropagation(); onProjeSil(proje.id);}}
            className={`hover:text-red-500 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <p className={`text-sm mb-4 ${
        darkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>{proje.aciklama}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${dilRenkleri[proje.dil] || 'bg-gray-100 text-gray-800'}`}>
            {proje.dil}
          </span>
          <div className={`flex items-center space-x-1 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Star className="h-4 w-4" />
            <span>{proje.yildiz}</span>
          </div>
          <div className={`flex items-center space-x-1 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Code className="h-4 w-4" />
            <span>{proje.fork}</span>
          </div>
          <div className={`flex items-center space-x-1 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Eye className="h-4 w-4" />
            <span>{proje.watchers || 0}</span>
          </div>
        </div>
        <span className={`text-xs ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>{proje.guncellemeTarihi}</span>
      </div>
    </div>
  );
};

// Proje detayı bileşeni
const ProjeDetayi = ({ proje, darkMode }) => {
  return (
    <div className={`rounded-xl shadow-sm border p-6 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>Proje Detayları</h3>
      
      <div className="space-y-4">
        <div>
          <span className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Son Commit:</span>
          <p className={`text-sm mt-1 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>{proje.sonCommit}</p>
        </div>
        
        <div>
          <span className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Son Commit Geçmişi:</span>
          <div className="mt-2 space-y-2">
            {proje.commitler.slice(0, 5).map(commit => (
              <div key={commit.id} className={`p-3 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{commit.mesaj}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{commit.yazar}</span>
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{commit.tarih}</span>
                  {commit.sha && (
                    <>
                      <Code className="h-3 w-3 text-gray-400" />
                      <span className={`text-xs font-mono ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{commit.sha}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <a 
          href={proje.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
        >
          GitHub'da Görüntüle
        </a>
      </div>
    </div>
  );
};

export default GitHubProjelerim; 