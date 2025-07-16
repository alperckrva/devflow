const axios = require('axios');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { model, messages, temperature, max_tokens } = JSON.parse(event.body);
    
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
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || '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'}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'https://devflow-platform.netlify.app'
      }
    });

    console.log('✅ AI yanıtı alındı');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
    
  } catch (error) {
    console.error('❌ AI Analysis error:', error.response?.data || error.message);
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI analiz hatası: ' + (error.response?.data?.error?.message || error.message)
      })
    };
  }
}; 