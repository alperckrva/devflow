import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  User,
  Bot,
  Copy,
  RefreshCw,
  Settings
} from 'lucide-react';
import aiServisi from '../services/aiService';
import { useTheme } from '../contexts/ThemeContext';

const AIChat = () => {
  const [mesajlar, setMesajlar] = useState([]);
  const [girilenMesaj, setGirilenMesaj] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [secilenModel, setSecilenModel] = useState('google/gemma-2-9b-it:free');
  const [availableModels, setAvailableModels] = useState([]);
  const messagesEndRef = useRef(null);
  const { darkMode } = useTheme();

  // Modelleri yükle
  useEffect(() => {
    const models = aiServisi.getAvailableModels();
    setAvailableModels(models);
  }, []);

  // Otomatik scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mesajlar, scrollToBottom]);

  // Mesaj gönder
  const mesajGonder = useCallback(async () => {
    if (!girilenMesaj.trim() || yukleniyor) return;

    const kullaniciMesaji = {
      id: Date.now(),
      role: 'user',
      content: girilenMesaj,
      timestamp: new Date()
    };

    setMesajlar(prev => [...prev, kullaniciMesaji]);
    setGirilenMesaj('');
    setYukleniyor(true);

    try {
      // Chat için özel sistem promptu
      const chatHistory = mesajlar.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await aiServisi.chatMesaj([
        {
          role: 'system',
          content: `Sen yardımsever ve samimi bir AI asistanısın. Türkçe konuş ve kullanıcıyla arkadaş gibi sohbet et. Kısa ve net yanıtlar ver. Emoji kullanabilirsin. Kodlama, teknoloji, günlük hayat hakkında her konuda yardım edebilirsin.`
        },
        ...chatHistory,
        {
          role: 'user',
          content: girilenMesaj
        }
      ], secilenModel);

      const aiMesaji = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMesajlar(prev => [...prev, aiMesaji]);
    } catch (error) {
      console.error('Chat hatası:', error);
      const hataMesaji = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '😅 Üzgünüm, bir hata oluştu. Tekrar dener misin?',
        timestamp: new Date(),
        isError: true
      };
      setMesajlar(prev => [...prev, hataMesaji]);
    } finally {
      setYukleniyor(false);
    }
  }, [girilenMesaj, yukleniyor, mesajlar, secilenModel]);

  // Enter tuşu ile gönder
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      mesajGonder();
    }
  }, [mesajGonder]);

  // Chat temizle
  const chatTemizle = useCallback(() => {
    setMesajlar([]);
  }, []);

  // Mesaj kopyala
  const mesajKopyala = useCallback(async (content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  }, []);

  // Zaman formatla
  const formatTime = useCallback((timestamp) => {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  }, []);

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className={`border-b p-4 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <h1 className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                AI Chat
              </h1>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                OpenRouter AI modelleri ile sohbet et
              </p>
            </div>
          </div>

          {/* Model Seçimi ve Kontroller */}
          <div className="flex items-center space-x-4">
            <select
              value={secilenModel}
              onChange={(e) => setSecilenModel(e.target.value)}
              className={`px-3 py-2 border rounded-lg text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {availableModels.map((model, index) => (
                <option key={`chat-model-${index}-${model.id}`} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={chatTemizle}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Chat'i Temizle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mesajlar.length === 0 ? (
              <div className="text-center py-12">
                <Bot className={`h-16 w-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Merhaba! 👋
                </h3>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Benimle sohbet etmeye başla. Her konuda yardımcı olabilirim!
                </p>
              </div>
            ) : (
              mesajlar.map((mesaj) => (
                <div
                  key={`message-${mesaj.id}`}
                  className={`flex ${
                    mesaj.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex max-w-[80%] ${
                    mesaj.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${
                      mesaj.role === 'user' ? 'ml-3' : 'mr-3'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        mesaj.role === 'user' 
                          ? 'bg-blue-600' 
                          : mesaj.isError 
                            ? 'bg-red-600' 
                            : 'bg-gray-600'
                      }`}>
                        {mesaj.role === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={`rounded-lg px-4 py-2 ${
                      mesaj.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : mesaj.isError
                          ? darkMode 
                            ? 'bg-red-900/50 text-red-300' 
                            : 'bg-red-50 text-red-700'
                          : darkMode 
                            ? 'bg-gray-800 text-gray-200' 
                            : 'bg-white text-gray-900'
                    } ${darkMode && mesaj.role !== 'user' && !mesaj.isError ? 'border border-gray-700' : ''}`}>
                      <div className="whitespace-pre-wrap text-sm">
                        {mesaj.content}
                      </div>
                      
                      {/* Message Footer */}
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
                        mesaj.role === 'user'
                          ? 'border-blue-500'
                          : mesaj.isError
                            ? 'border-red-400'
                            : darkMode 
                              ? 'border-gray-700' 
                              : 'border-gray-200'
                      }`}>
                        <span className={`text-xs ${
                          mesaj.role === 'user'
                            ? 'text-blue-200'
                            : mesaj.isError
                              ? darkMode ? 'text-red-400' : 'text-red-500'
                              : darkMode 
                                ? 'text-gray-500' 
                                : 'text-gray-400'
                        }`}>
                          {formatTime(mesaj.timestamp)}
                        </span>
                        
                        <button
                          onClick={() => mesajKopyala(mesaj.content)}
                          className={`p-1 rounded hover:bg-black/10 ${
                            mesaj.role === 'user'
                              ? 'text-blue-200 hover:text-white'
                              : darkMode 
                                ? 'text-gray-500 hover:text-gray-300' 
                                : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title="Kopyala"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {yukleniyor && (
              <div className="flex justify-start">
                <div className="flex mr-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className={`rounded-lg px-4 py-2 ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`border-t p-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={girilenMesaj}
                  onChange={(e) => setGirilenMesaj(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Mesajını yaz... (Enter ile gönder)"
                  className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="2"
                  disabled={yukleniyor}
                />
              </div>
              <button
                onClick={mesajGonder}
                disabled={yukleniyor || !girilenMesaj.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center min-w-[100px]"
              >
                {yukleniyor ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Gönder
                  </>
                )}
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Merhaba! Nasılsın?",
                "Kod yazma konusunda yardım eder misin?",
                "Bu projemi nasıl geliştirebilirim?",
                "React hakkında bir şey öğrenmek istiyorum"
              ].map((oneri, index) => (
                <button
                  key={`oneri-${index}`}
                  onClick={() => setGirilenMesaj(oneri)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    darkMode
                      ? 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                  disabled={yukleniyor}
                >
                  {oneri}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat; 