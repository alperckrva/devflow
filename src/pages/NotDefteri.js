import React, { useState, useRef, Suspense, useEffect, useCallback, useMemo } from 'react';
import TiptapEditor from '../components/TiptapEditor';
import ErrorBoundary from '../components/ErrorBoundary';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import firebaseService from '../services/firebaseService';
// Icons artık inline SVG olarak kullanılacak
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const NotDefteri = () => {
  const [notlar, setNotlar] = useState([]);
  const [aktifNot, setAktifNot] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();
  const { user } = useUser();
  
  const [yeniNot, setYeniNot] = useState({
    isim: '',
    baslik: '',
    icerik: '',
    kategori: 'Genel',
    tarih: new Date().toISOString().split('T')[0]
  });

  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenKategori, setSecilenKategori] = useState('Tümü');
  const [notEklemeAcik, setNotEklemeAcik] = useState(false);
  const [silmeUyarisi, setSilmeUyarisi] = useState({ acik: false, notId: null, notIsim: '' });
  
  const printRef = useRef();

  const kategoriler = ['Genel', 'React', 'JavaScript', 'CSS', 'Node.js', 'Python', 'Matematik', 'Algoritma', 'Ders Notları'];

  // Firebase'den notları yükle
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const notes = await firebaseService.notlariGetir(user.uid);
        const formattedNotes = notes.map(note => ({
          id: Date.now() + Math.random(), // Unique local ID
          firebaseId: note.id, // Firebase document ID'si
          isim: note.title || 'Başlıksız Not',
          baslik: note.title || 'Başlıksız Not',
          icerik: note.content || '',
          kategori: note.category || 'Genel',
          tarih: note.createdAt?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          sonGuncelleme: note.updatedAt?.toDate().toISOString() || new Date().toISOString()
        }));
        setNotlar(formattedNotes);
      } catch (error) {
        console.error('Notlar yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [user]);

  // Unsaved changes tracking
  useEffect(() => {
    if (aktifNot && aktifNot.icerik !== lastSavedContent) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [aktifNot?.icerik, lastSavedContent]);

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

  // Not kaydet - DOM-safe versiyon
  const saveNote = useCallback(async () => {
    const currentNote = aktifNot;
    const currentUser = user;
    
    if (!currentNote || !currentUser) return;

    try {
      // UI state değişikliğini hemen yap
      setSaveStatus('saving');
      
      const noteData = {
        title: currentNote.isim,
        content: currentNote.icerik,
        category: currentNote.kategori
      };

      if (currentNote.firebaseId) {
        // Mevcut notu güncelle
        await firebaseService.notGuncelle(currentUser.uid, currentNote.firebaseId, noteData);
      } else {
        // Yeni not oluştur
        const firebaseId = await firebaseService.notEkle(currentUser.uid, noteData);
        
        // State updates'i bir sonraki tick'te yap
        setTimeout(() => {
          setAktifNot(prev => prev ? { ...prev, firebaseId } : null);
          setNotlar(prev => prev.map(not => 
            not.id === currentNote.id 
              ? { ...not, firebaseId, sonGuncelleme: new Date().toISOString() }
              : not
          ));
        }, 0);
      }

      // Başarı state'ini güvenli şekilde güncelle
      setTimeout(() => {
        setLastSavedContent(currentNote.icerik);
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        
        // Cleanup
        setTimeout(() => {
          setSaveStatus('');
        }, 2000);
      }, 10);
      
    } catch (error) {
      console.error('Not kaydedilirken hata:', error);
      setTimeout(() => {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(''), 3000);
      }, 10);
    }
  }, [aktifNot, user]);

  const notOlustur = useCallback(async () => {
    if (!yeniNot.isim.trim()) {
      alert('Lütfen not için bir isim girin!');
      return;
    }

    if (!user) {
      alert('Not oluşturmak için giriş yapmalısınız!');
      return;
    }

    try {
      const noteData = {
        title: yeniNot.isim,
        content: yeniNot.icerik,
        category: yeniNot.kategori
      };

      // Firebase'e kaydet
      const firebaseId = await firebaseService.notEkle(user.uid, noteData);

      const yeniNotObjesi = {
        id: Date.now(),
        firebaseId,
        isim: yeniNot.isim,
        baslik: yeniNot.baslik || yeniNot.isim,
        icerik: yeniNot.icerik,
        kategori: yeniNot.kategori,
        tarih: new Date().toISOString().split('T')[0],
        sonGuncelleme: new Date().toISOString()
      };

      // State güncellemelerini normal şekilde yap
      setNotlar(prev => [yeniNotObjesi, ...prev]);
      setYeniNot({ 
        isim: '', 
        baslik: '', 
        icerik: '', 
        kategori: 'Genel', 
        tarih: new Date().toISOString().split('T')[0] 
      });
      setNotEklemeAcik(false);
      setAktifNot(yeniNotObjesi);
      setLastSavedContent(yeniNot.icerik);
      setEditMode(true);
    } catch (error) {
      console.error('Not oluşturulurken hata:', error);
      alert('Not oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [yeniNot, user, notlar]);

  // Aktif notu güncelle (otomatik kaydetme için)
  React.useEffect(() => {
    if (aktifNot && aktifNot.id && aktifNot.icerik !== undefined) {
      const timeoutId = setTimeout(() => {
        const guncelNot = { ...aktifNot, sonGuncelleme: new Date().toISOString() };
        setNotlar(prevNotlar => 
          prevNotlar.map(not =>
            not.id === aktifNot.id ? guncelNot : not
          )
        );
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [aktifNot]);

  const notSil = (id) => {
    const silinecekNot = notlar.find(not => not.id === id);
    setSilmeUyarisi({ 
      acik: true, 
      notId: id, 
      notIsim: silinecekNot?.isim || 'Bu not' 
    });
  };

  const notSilmeOnay = useCallback(async () => {
    const { notId } = silmeUyarisi;
    const silinecekNot = notlar.find(not => not.id === notId);
    
    try {
      // Firebase'den sil
      if (silinecekNot?.firebaseId && user) {
        await firebaseService.notSil(user.uid, silinecekNot.firebaseId);
      }
      
      // Local state'den sil
      setNotlar(prev => prev.filter(not => not.id !== notId));

      if (aktifNot && aktifNot.id === notId) {
        setAktifNot(null);
        setEditMode(false);
        setHasUnsavedChanges(false);
        setLastSavedContent('');
      }

      setSilmeUyarisi({ acik: false, notId: null, notIsim: '' });
    } catch (error) {
      console.error('Not silinirken hata:', error);
      alert('Not silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [silmeUyarisi, notlar, user, aktifNot]);

  const notSilmeIptal = useCallback(() => {
    setSilmeUyarisi({ acik: false, notId: null, notIsim: '' });
  }, []);

  const pdfOlustur = useCallback(async () => {
    if (!aktifNot) {
      alert('PDF oluşturmak için bir not seçin.');
      return;
    }

    // Önizleme modunda değilsek, önce önizleme moduna geç
    if (editMode) {
      setEditMode(false);
      // DOM güncellemesi için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const element = printRef.current;
    if (!element) {
      alert('PDF oluşturulamadı. Lütfen tekrar deneyin.');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${aktifNot.isim}.pdf`);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [aktifNot, editMode]);

  // Editör içerik değişikliği - Stable callback
  const handleEditorChange = useCallback((content) => {
    setAktifNot(prev => prev ? {...prev, icerik: content} : null);
  }, []); // Dependencies kaldırıldı - daha stable

  // Aktif not değiştiğinde lastSavedContent'i güncelle
  const handleNotSelect = useCallback((not) => {
    // Eğer unsaved changes varsa uyar
    if (hasUnsavedChanges && aktifNot) {
      const confirm = window.confirm('Kaydedilmemiş değişiklikleriniz var. Başka nota geçmek istediğinizden emin misiniz?');
      if (!confirm) return;
    }
    
    // State güncellemelerini normal şekilde yap
    setAktifNot(not);
    setLastSavedContent(not.icerik || '');
    setHasUnsavedChanges(false);
    setEditMode(false);
  }, [hasUnsavedChanges, aktifNot]);

  // Filtreleme - useMemo ile optimize edildi
  const filtrelenmisNotlar = useMemo(() => {
    return notlar.filter(not => {
      const aramaKoşulu = not.isim.toLowerCase().includes(aramaMetni.toLowerCase()) ||
                          not.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) ||
                          not.icerik.toLowerCase().includes(aramaMetni.toLowerCase());
      const kategoriKoşulu = secilenKategori === 'Tümü' || not.kategori === secilenKategori;
      
      return aramaKoşulu && kategoriKoşulu;
    });
  }, [notlar, aramaMetni, secilenKategori]);

  const kategoriRenkleri = {
    'Genel': 'bg-gray-100 text-gray-800',
    'React': 'bg-blue-100 text-blue-800',
    'JavaScript': 'bg-yellow-100 text-yellow-800',
    'CSS': 'bg-purple-100 text-purple-800',
    'Node.js': 'bg-green-100 text-green-800',
    'Python': 'bg-indigo-100 text-indigo-800',
    'Matematik': 'bg-red-100 text-red-800',
    'Algoritma': 'bg-orange-100 text-orange-800',
    'Ders Notları': 'bg-pink-100 text-pink-800'
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
            Not defterini kullanmak için lütfen giriş yapın.
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Notlar Yükleniyor...
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Notlarınız hazırlanıyor, lütfen bekleyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="mb-3">
        <h1 className={`text-2xl font-bold mb-1 flex items-center ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <svg className="h-6 w-6 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Not Defteri
        </h1>
        <p className={`text-sm ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Notlarını oluştur, düzenle ve PDF olarak kaydet.
        </p>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sol Panel - Not Listesi */}
        <div className={`w-1/3 rounded-lg shadow-sm border ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Not Ekleme Butonu */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setNotEklemeAcik(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Not
            </button>
          </div>

          {/* Arama ve Filtreleme */}
          <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <svg className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Notlarda ara..."
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <select
              value={secilenKategori}
              onChange={(e) => setSecilenKategori(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="Tümü">Tüm Kategoriler</option>
              {kategoriler.map((kategori, index) => (
                <option key={`kategori-${index}-${kategori}`} value={kategori}>{kategori}</option>
              ))}
            </select>
          </div>

          {/* Not Listesi */}
          <div className="p-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtrelenmisNotlar.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {aramaMetni || secilenKategori !== 'Tümü' ? 'Arama kriterlerine uygun not bulunamadı' : 'Henüz not yok'}
                  </p>
                </div>
              ) : (
                filtrelenmisNotlar.map(not => (
                  <div
                    key={`note-${not.id}-${not.firebaseId || 'local'}`}
                    onClick={() => handleNotSelect(not)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 border ${
                      aktifNot && aktifNot.id === not.id
                        ? darkMode
                          ? 'bg-orange-600/10 border-orange-600/20 text-white'
                          : 'bg-orange-50 border-orange-200 text-gray-900'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{not.isim}</h3>
                        <p className={`text-sm mt-1 truncate ${
                          aktifNot && aktifNot.id === not.id
                            ? darkMode ? 'text-gray-300' : 'text-gray-600'
                            : darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {not.icerik ? not.icerik.replace(/<[^>]*>/g, '').substring(0, 50) + '...' : 'İçerik yok'}
                        </p>
                        <div className="flex items-center mt-2 gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${kategoriRenkleri[not.kategori]}`}>
                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {not.kategori}
                          </span>
                          <span className={`text-xs ${
                            aktifNot && aktifNot.id === not.id
                              ? darkMode ? 'text-gray-400' : 'text-gray-500'
                              : darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {not.tarih}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          notSil(not.id);
                        }}
                        className={`ml-2 p-1 rounded-md transition-colors duration-200 ${
                          darkMode 
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10' 
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sağ Panel - Editör/Önizleme */}
        <div className="flex-1 flex flex-col min-h-0">
          {aktifNot ? (
            <>
              {/* Not Başlığı ve Kontroller */}
              <div className={`p-3 rounded-lg shadow-sm border mb-2 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{aktifNot.isim}</h2>
                    <p className={`text-xs mt-0.5 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Son güncelleme: {new Date(aktifNot.sonGuncelleme).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Kaydet Butonu - Stable UI */}
                    <button
                      onClick={saveNote}
                      disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                      className={`flex items-center px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm min-w-[100px] ${
                        hasUnsavedChanges && saveStatus !== 'saving'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {saveStatus === 'saving' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {saveStatus === 'saved' && (
                        <svg className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {saveStatus === 'error' && (
                        <svg className="h-4 w-4 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {!saveStatus && (
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                      <span>
                        {saveStatus === 'saving' ? 'Kaydediliyor...' :
                         saveStatus === 'saved' ? 'Kaydedildi' :
                         saveStatus === 'error' ? 'Hata' : 'Kaydet'}
                      </span>
                    </button>

                    {/* Önizleme/Düzenle Butonu */}
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className={`flex items-center px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 text-sm ${
                      editMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {editMode ? (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Önizleme
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Düzenle
                      </>
                    )}
                  </button>

                  {/* PDF Butonu */}
                  <button
                    onClick={pdfOlustur}
                    className={`flex items-center px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 text-sm ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF
                </button>
                </div>
                </div>
              </div>

              {/* Editor / Önizleme */}
              <div className={`flex-1 rounded-lg shadow-sm border overflow-hidden ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`} style={{ height: 'calc(100vh - 80px)' }}>
                                  {editMode ? (
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Editor yükleniyor...</p>
                          </div>
                        </div>
                      }>
                        <TiptapEditor
                          value={aktifNot.icerik}
                          onChange={handleEditorChange}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  ) : (
                  <div ref={printRef} className={`p-6 h-full overflow-y-auto prose prose-lg max-w-none ${
                    darkMode ? 'prose-invert' : ''
                  }`}>
                    <div dangerouslySetInnerHTML={{ __html: aktifNot.icerik }} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`flex-1 flex items-center justify-center rounded-lg shadow-sm border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="text-center">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className={`text-lg font-medium mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Not Seçin</h3>
                <p className={`${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>Düzenlemek için sol panelden bir not seçin veya yeni not oluşturun.</p>
              </div>
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
                Notu Sil
              </h3>
              
              {/* Mesaj */}
              <p className={`text-sm mb-6 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>"{silmeUyarisi.notIsim}"</span> adlı notu silmek istediğinizden emin misiniz? 
                <br />
                <span className="text-red-600 font-medium">Bu işlem geri alınamaz.</span>
              </p>
              
              {/* Butonlar */}
              <div className="flex space-x-3">
                <button
                  onClick={notSilmeIptal}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={notSilmeOnay}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Not Modal */}
      {notEklemeAcik && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-xl max-w-md w-full ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>Yeni Not Oluştur</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Not Adı *</label>
                  <input
                    type="text"
                    value={yeniNot.isim}
                    onChange={(e) => setYeniNot({...yeniNot, isim: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Örn: JavaScript Notlarım"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Başlık</label>
                  <input
                    type="text"
                    value={yeniNot.baslik}
                    onChange={(e) => setYeniNot({...yeniNot, baslik: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Başlık (isteğe bağlı)"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Kategori</label>
                  <select
                    value={yeniNot.kategori}
                    onChange={(e) => setYeniNot({...yeniNot, kategori: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {kategoriler.map(kategori => (
                      <option key={kategori} value={kategori}>{kategori}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setNotEklemeAcik(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={notOlustur}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotDefteri; 