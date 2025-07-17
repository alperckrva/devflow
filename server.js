const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS'u tamamen aç
app.use(cors());
app.use(express.json());

// 🔒 GÜVENLİK: API anahtarını kontrol et
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY environment variable bulunamadı!');
  console.error('🔧 .env dosyasında OPENROUTER_API_KEY=your-key-here şeklinde tanımlayın');
  process.exit(1);
}

// OpenRouter proxy endpoint
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { model, messages, temperature, max_tokens } = req.body;
    
    console.log('📤 AI isteği alındı:', { model, messageCount: messages?.length });
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000'
      }
    });

    console.log('✅ AI yanıtı alındı');
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy server hatası: ' + error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log('🔗 Ready to proxy AI requests!');
  console.log('🔑 API key configured:', apiKey ? '✅ Yes' : '❌ No');
}); 