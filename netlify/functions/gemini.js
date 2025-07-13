import fetch from 'node-fetch';

export const handler = async (event) => {
  // 1. Check if the request method is POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { question } = JSON.parse(event.body);
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // 2. Check if an API key is available
  if (!GEMINI_API_KEY) {
    console.error('CRITICAL: GEMINI_API_KEY is not set in Netlify environment variables.');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: API key is missing.' }) };
  }

  // 3. Check if a question was provided
  if (!question) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No question provided.' }) };
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }]
      })
    });

    const geminiData = await geminiRes.json();

    // 4. Check if the Gemini API itself returned an error
    if (geminiData.error) {
      console.error('Gemini API returned an error:', JSON.stringify(geminiData.error, null, 2));
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: `The AI service returned an error: ${geminiData.error.message}` }) 
      };
    }

    // 5. Extract the answer
    const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not get a valid answer from the AI.';
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    // 6. Catch any other network or unexpected errors
    console.error('A critical error occurred in the function:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'An unexpected error occurred while processing your request.' }) 
    };
  }
}; 