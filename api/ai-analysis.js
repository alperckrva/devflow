// Vercel Serverless Function for AI Analysis
import axios from 'axios';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 🔒 GÜVENLİK: API anahtarını kontrol et
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable bulunamadı!');
    res.status(500).json({ 
      error: 'Server configuration error: API key not found'
    });
    return;
  }

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
        'HTTP-Referer': process.env.CLIENT_URL || 'https://devflow-platform-p5hrpqrcr-alperencukurovas-projects.vercel.app'
      }
    });

    console.log('✅ AI yanıtı alındı');
    res.status(200).json(response.data);
    
  } catch (error) {
    console.error('❌ AI Analysis error:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'AI analiz hatası: ' + error.message });
    }
  }
} 