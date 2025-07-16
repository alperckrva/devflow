import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, 
  Calendar, 
  BarChart,
  Clock,
  BookOpen
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import firebaseService from '../services/firebaseService';

const AnaSayfa = () => {
  const [istatistikler, setIstatistikler] = useState({
    kodIncelemesi: 0,
    tamamlananGorev: 0,
    yeniNot: 0,
    loading: true
  });
  const { user } = useUser();

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!user) {
        setIstatistikler({
          kodIncelemesi: 0,
          tamamlananGorev: 0,
          yeniNot: 0,
          loading: false
        });
        return;
      }

      try {
        const stats = await firebaseService.getStatistics(user.uid);
        setIstatistikler({
          kodIncelemesi: stats.kodIncelemesi || 0,
          tamamlananGorev: stats.tamamlananGorev || 0,
          yeniNot: stats.yeniNot || 0,
          loading: false
        });
      } catch (error) {
        console.error("İstatistikler getirilirken hata:", error);
        setIstatistikler({
          kodIncelemesi: 0,
          tamamlananGorev: 0,
          yeniNot: 0,
          loading: false
        });
      }
    };

    fetchStatistics();
  }, [user]);

  const hizliErisimKartlari = [
    {
      baslik: 'AI',
      aciklama: 'Kod İnceleyici',
      yol: '/ai-kod-inceleyici',
      ikon: Code,
      renk: 'bg-blue-500'
    },
    {
      baslik: 'Not Defteri',
      aciklama: 'Notlar ve Resimler',
      yol: '/not-defteri',
      ikon: BookOpen,
      renk: 'bg-orange-500'
    },
    {
      baslik: 'GitHub',
      aciklama: 'Projelerim',
      yol: '/github-projelerim',
      ikon: BarChart,
      renk: 'bg-purple-500'
    },
    {
      baslik: 'Planlama',
      aciklama: 'Görevler',
      yol: '/planlama',
      ikon: Calendar,
      renk: 'bg-green-500'
    }
  ];



  return (
    <div className="max-w-7xl mx-auto">
      {/* Hoş Geldin Mesajı */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
          Hoş Geldin! 👋
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Kişisel geliştirme platformuna hoş geldin. Buradan tüm araçlarına kolayca erişebilirsin.
        </p>
        <div className="mt-4 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
      </div>

      {/* Ana Menü Butonları */}
      <div className="flex justify-center mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hizliErisimKartlari.map((kart, index) => (
            <Link
              key={index}
              to={kart.yol}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 text-center min-w-[140px] backdrop-blur-sm"
            >
              <div className="flex justify-center mb-3">
                <div className={`${kart.renk} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {React.createElement(kart.ikon, { className: "h-6 w-6 text-white" })}
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {kart.baslik}
              </h3>
              <div className="mt-2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300 mx-auto"></div>
            </Link>
          ))}
        </div>
      </div>

      {/* İstatistikler ve Son Aktiviteler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* İstatistikler */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-blue-500" />
            Bu Hafta
          </h2>
          <div className="grid grid-cols-3 gap-4">
                         <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300">
               {istatistikler.loading ? (
                 <div className="animate-pulse">
                   <div className="h-8 bg-blue-200 dark:bg-blue-700 rounded mb-1"></div>
                   <div className="h-4 bg-blue-100 dark:bg-blue-800 rounded"></div>
                 </div>
               ) : (
                 <>
                   <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{istatistikler.kodIncelemesi}</div>
                   <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Kod İncelemesi</div>
                 </>
               )}
             </div>
             <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-300">
               {istatistikler.loading ? (
                 <div className="animate-pulse">
                   <div className="h-8 bg-green-200 dark:bg-green-700 rounded mb-1"></div>
                   <div className="h-4 bg-green-100 dark:bg-green-800 rounded"></div>
                 </div>
               ) : (
                 <>
                   <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{istatistikler.tamamlananGorev}</div>
                   <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Tamamlanan Görev</div>
                 </>
               )}
             </div>
             <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-300">
               {istatistikler.loading ? (
                 <div className="animate-pulse">
                   <div className="h-8 bg-orange-200 dark:bg-orange-700 rounded mb-1"></div>
                   <div className="h-4 bg-orange-100 dark:bg-orange-800 rounded"></div>
                 </div>
               ) : (
                 <>
                   <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{istatistikler.yeniNot}</div>
                   <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Yeni Not</div>
                 </>
               )}
             </div>
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Son Aktiviteler
          </h2>
                     <div className="text-center py-8">
             <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
             <p className="text-sm text-gray-500 dark:text-gray-400">Henüz aktivite yok</p>
             <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">İlk aktiviteleriniz burada görünecek</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnaSayfa; 