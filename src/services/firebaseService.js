import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class FirebaseService {
  // ============ AUTH İŞLEMLERİ ============
  
  // Kullanıcı kaydı
  async kayitOl(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Profil güncelle
      await updateProfile(user, {
        displayName: name
      });
      
      // Kullanıcı profili oluştur
      await this.createUserProfile(user.uid, {
        name: name,
        email: email,
        createdAt: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }
  
  // Kullanıcı girişi
  async girisYap(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }
  
  // Çıkış yap
  async cikisYap() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Çıkış yapılırken hata oluştu');
    }
  }
  
  // Auth state dinleyici
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Şifre değiştir
  async sifreDegistir(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Mevcut şifre ile yeniden kimlik doğrulama
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Yeni şifreyi güncelle
      await updatePassword(user, newPassword);
      
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      throw new Error(this.getPasswordChangeErrorMessage(error.code));
    }
  }

  // Email benzersizlik kontrolü (Firebase Auth otomatik yapar)
  async emailKullanildaMi(email) {
    // Firebase Auth zaten email benzersizliğini kontrol eder
    // Kayıt sırasında 'auth/email-already-in-use' hatası döner
    return false; // Bu fonksiyon artık gerekli değil, Firebase otomatik kontrol ediyor
  }
  
  // Kullanıcı profili oluştur
  async createUserProfile(userId, profileData) {
    try {
      await doc(db, 'users', userId);
      await updateDoc(doc(db, 'users', userId), profileData);
    } catch (error) {
      // Eğer doküman yoksa oluştur
      await addDoc(collection(db, 'users'), {
        userId: userId,
        ...profileData
      });
    }
  }
  
  // ============ NOT İŞLEMLERİ ============
  
  // Not ekle
  async notEkle(userId, noteData) {
    try {
      const docRef = await addDoc(collection(db, 'users', userId, 'notes'), {
        ...noteData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Not eklenirken hata oluştu');
    }
  }
  
  // Notları getir
  async notlariGetir(userId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'users', userId, 'notes'),
          orderBy('updatedAt', 'desc')
        )
      );
      
      const notes = [];
      querySnapshot.forEach((doc) => {
        notes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return notes;
    } catch (error) {
      throw new Error('Notlar getirilirken hata oluştu');
    }
  }
  
  // Not güncelle
  async notGuncelle(userId, noteId, updateData) {
    try {
      await updateDoc(doc(db, 'users', userId, 'notes', noteId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Not güncellenirken hata oluştu');
    }
  }
  
  // Not sil
  async notSil(userId, noteId) {
    try {
      console.log('🔥 Firebase notSil çağrıldı:', { userId, noteId });
      const docPath = `users/${userId}/notes/${noteId}`;
      console.log('📂 Silinecek doküman yolu:', docPath);
      
      await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
      console.log('✅ Firebase doküman silindi');
    } catch (error) {
      console.error('❌ Firebase silme hatası:', error);
      throw new Error('Not silinirken hata oluştu');
    }
  }
  
  // ============ PLAN İŞLEMLERİ ============
  
  // Plan ekle
  async planEkle(userId, planData) {
    try {
      const docRef = await addDoc(collection(db, 'users', userId, 'plans'), {
        ...planData,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Plan eklenirken hata oluştu');
    }
  }
  
  // Planları getir
  async planlariGetir(userId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'users', userId, 'plans'),
          orderBy('createdAt', 'desc')
        )
      );
      
      const plans = [];
      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return plans;
    } catch (error) {
      throw new Error('Planlar getirilirken hata oluştu');
    }
  }
  
  // Plan güncelle
  async planGuncelle(userId, planId, updateData) {
    try {
      await updateDoc(doc(db, 'users', userId, 'plans', planId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Plan güncellenirken hata oluştu');
    }
  }
  
  // Plan sil
  async planSil(userId, planId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'plans', planId));
    } catch (error) {
      throw new Error('Plan silinirken hata oluştu');
    }
  }
  
  // Plan tamamla/tamamlama
  async planTamamla(userId, planId, completed) {
    try {
      await this.planGuncelle(userId, planId, { completed });
    } catch (error) {
      throw new Error('Plan durumu güncellenirken hata oluştu');
    }
  }

  // ============ PROJE İŞLEMLERİ ============
  
  // Proje ekle
  async projeEkle(userId, projectData) {
    try {
      const docRef = await addDoc(collection(db, 'users', userId, 'projects'), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      throw new Error('Proje eklenirken hata oluştu');
    }
  }
  
  // Projeleri getir
  async projeleriGetir(userId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'users', userId, 'projects'),
          orderBy('updatedAt', 'desc')
        )
      );
      
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return projects;
    } catch (error) {
      throw new Error('Projeler getirilirken hata oluştu');
    }
  }
  
  // Proje güncelle
  async projeGuncelle(userId, projectId, updateData) {
    try {
      await updateDoc(doc(db, 'users', userId, 'projects', projectId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Proje güncellenirken hata oluştu');
    }
  }
  
  // Proje sil
  async projeSil(userId, projectId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'projects', projectId));
    } catch (error) {
      throw new Error('Proje silinirken hata oluştu');
    }
  }

  // ============ İSTATİSTİK İŞLEMLERİ ============
  
  // Kullanıcı istatistiklerini getir
  async getStatistics(userId) {
    try {
      // Notları getir
      const notlar = await this.notlariGetir(userId);
      const yeniNot = notlar.length;

      // Planları getir
      const planlar = await this.planlariGetir(userId);
      const tamamlananGorev = planlar.filter(plan => plan.completed).length;

      // Projeleri getir
      const projeler = await this.projeleriGetir(userId);
      const toplamProje = projeler.length;

      // AI kod incelemesi sayısını localStorage'dan al (geçici çözüm)
      const kodIncelemesi = parseInt(localStorage.getItem(`aiAnalysisCount_${userId}`) || '0');

      return {
        kodIncelemesi,
        tamamlananGorev,
        yeniNot,
        toplamProje
      };
    } catch (error) {
      console.error('İstatistikler getirilirken hata:', error);
      return {
        kodIncelemesi: 0,
        tamamlananGorev: 0,
        yeniNot: 0,
        toplamProje: 0
      };
    }
  }

  // AI kod incelemesi sayısını artır
  async incrementAIAnalysis(userId) {
    try {
      const currentCount = parseInt(localStorage.getItem(`aiAnalysisCount_${userId}`) || '0');
      localStorage.setItem(`aiAnalysisCount_${userId}`, (currentCount + 1).toString());
    } catch (error) {
      console.error('AI analiz sayısı güncellenirken hata:', error);
    }
  }
  
  // ============ HATA MESAJLARI ============
  
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Bu email adresi zaten kullanılıyor';
      case 'auth/weak-password':
        return 'Şifre çok zayıf (en az 6 karakter)';
      case 'auth/invalid-email':
        return 'Geçersiz email adresi';
      case 'auth/user-not-found':
        return 'Kullanıcı bulunamadı';
      case 'auth/wrong-password':
        return 'Hatalı şifre';
      case 'auth/too-many-requests':
        return 'Çok fazla deneme. Lütfen sonra tekrar deneyin';
      default:
        return 'Bir hata oluştu. Lütfen tekrar deneyin';
    }
  }

  getPasswordChangeErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/requires-recent-login':
        return 'Lütfen son girişinizi tekrar yapın.';
      case 'auth/wrong-password':
        return 'Mevcut şifre hatalı.';
      default:
        return 'Şifre değiştirilirken bir hata oluştu.';
    }
  }
}

// Singleton pattern
const firebaseService = new FirebaseService();
export default firebaseService; 