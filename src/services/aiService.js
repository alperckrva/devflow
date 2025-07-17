// OpenRouter API entegrasyonu
class AIServisi {
  constructor() {
    // 🔒 GÜVENLİK: API anahtarını environment variable'dan al
    this.apiAnahtari = process.env.REACT_APP_OPENROUTER_API_KEY;
    
    // 🚨 API anahtarı yoksa hata fırlat
    if (!this.apiAnahtari) {
      throw new Error('🚨 OPENROUTER_API_KEY environment variable bulunamadı! .env.local dosyasını kontrol edin.');
    }
    
    // Base URL environment'a göre ayarla
    this.baseURL = this.getBaseURL();
  }

  // Environment'a göre base URL belirle
  getBaseURL() {
    if (process.env.NODE_ENV === 'development') {
      return '/.netlify/functions/ai-analysis';
    }
    return '/.netlify/functions/ai-analysis';
  }

  // Mevcut modelleri getir
  getAvailableModels() {
    return [
      { 
        id: 'google/gemma-2-9b-it:free', 
        name: 'Gemma 2 9B (Ücretsiz)', 
        description: 'Google\'ın ücretsiz modeli',
        provider: 'Google',
        context: '8K',
        pricing: 'Ücretsiz'
      },
      { 
        id: 'microsoft/phi-3-mini-128k-instruct:free', 
        name: 'Phi-3 Mini (Ücretsiz)', 
        description: 'Microsoft\'un hafif modeli',
        provider: 'Microsoft', 
        context: '128K',
        pricing: 'Ücretsiz'
      },
      { 
        id: 'meta-llama/llama-3-8b-instruct:free', 
        name: 'Llama 3 8B (Ücretsiz)', 
        description: 'Meta\'nın açık kaynak modeli',
        provider: 'Meta',
        context: '8K', 
        pricing: 'Ücretsiz'
      }
    ];
  }

  // Kod analizi için sistem prompt'u
  getSystemPrompt() {
    return `Sen uzman bir yazılım geliştirici ve kod inceleyicisisin. Verilen kodu detaylıca analiz et ve aşağıdaki formatı kullanarak MUTLAKA TÜRKÇE yanıt ver:

🔍 **KOD ANALİZİ**

**📋 Kodun Amacı:**
Kodun ne yaptığını kısaca açıkla.

**✅ Güçlü Yönler:**
Kodda iyi olan kısımları listele.

**⚠️ Sorunlar ve Hatalar:**
Varsa hataları, güvenlik açıklarını ve sorunları belirt.

**🚀 İyileştirme Önerileri:**
Kodun nasıl iyileştirilebileceğini öner.

**📚 Best Practices:**
İlgili programming best practices önerilerini ver.

**⭐ Kod Kalitesi Puanı:**
10 üzerinden puan ver ve nedenini açıkla.

Yanıtını teknik ama anlaşılır şekilde ver. Kod örnekleri kullanabilirsin.`;
  }

  // Kod analizi ana fonksiyonu
  async kodAnalizi(kod, selectedModel = 'google/gemma-2-9b-it:free') {
    try {
      if (!kod.trim()) {
        throw new Error('Kod girişi boş olamaz');
      }

      const response = await this.openRouterAPIRequest(kod, selectedModel);
      return response;

    } catch (error) {
      console.error('AI Kod Analizi Hatası:', error);
      throw new Error(error.message || 'AI analizi yapılamadı. Lütfen tekrar deneyin.');
    }
  }

  // OpenRouter API isteği
  async openRouterAPIRequest(kod, model) {
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: `Aşağıdaki kodu analiz et:\n\n\`\`\`\n${kod}\n\`\`\``
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('API anahtarı geçersiz');
        } else if (response.status === 429) {
          throw new Error('Rate limit aşıldı. Lütfen birkaç dakika sonra tekrar deneyin.');
        } else if (response.status === 402) {
          throw new Error('Kredi limiti aşıldı');
        } else {
          throw new Error(errorData.error?.message || `API Hatası: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Geçersiz API yanıtı');
      }

      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('Detaylı API Hatası:', error);
      
      // Proxy server bağlantı hatası
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('Proxy server bağlantısı kurulamadı. Lütfen server.js çalıştığından emin olun.');
      }
      
      throw error;
    }
  }

  // Kod özetleme fonksiyonu
  async kodOzetleme(kod, selectedModel = 'google/gemma-2-9b-it:free') {
    const ozet_prompt = `Sen bir kod özetleme uzmanısın. Aşağıdaki kodu kısaca özetle:

**Format:**
📝 **KOD ÖZETİ**
• Ana fonksiyon: [açıklama]
• Kullanılan teknoloji: [teknoloji]
• Kod karmaşıklığı: [basit/orta/karmaşık]
• Satır sayısı: [sayı]

Kısa ve net ol.`;

    try {
      const requestBody = {
        model: selectedModel,
        messages: [
          { role: 'system', content: ozet_prompt },
          { role: 'user', content: kod }
        ],
        temperature: 0.3,
        max_tokens: 500
      };

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API Hatası: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('Kod özetleme hatası:', error);
      return 'Kod özetleme şu anda kullanılamıyor.';
    }
  }

  // Chat mesajı gönderme fonksiyonu
  async chatMesaj(messages, selectedModel = 'google/gemma-2-9b-it:free') {
    try {
      const requestBody = {
        model: selectedModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      };

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('API anahtarı geçersiz');
        } else if (response.status === 429) {
          throw new Error('Rate limit aşıldı. Lütfen birkaç dakika sonra tekrar deneyin.');
        } else if (response.status === 402) {
          throw new Error('Kredi limiti aşıldı');
        } else {
          throw new Error(errorData.error?.message || `API Hatası: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Geçersiz API yanıtı');
      }

      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('Chat API Hatası:', error);
      
      // Proxy server bağlantı hatası
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('Proxy server bağlantısı kurulamadı. Lütfen server.js çalıştığından emin olun.');
      }
      
      throw error;
    }
  }

  // Model durumu kontrolü
  async testModel(model) {
    try {
      const testCode = 'function hello() { return "test"; }';
      await this.kodAnalizi(testCode, model);
      return { status: 'success', message: 'Model çalışıyor' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

// Singleton pattern
const aiServisi = new AIServisi();
export default aiServisi; 