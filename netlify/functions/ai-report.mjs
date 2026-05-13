// Netlify Function for AI-powered reports using Gemini API
// This keeps the API key secure on the server side

export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // Return a demo response if no API key is configured
      return new Response(JSON.stringify({
        text: `# AI Operations Report (Demo Mode)

## Overall System Status
✅ All systems operational
- Video surveillance: Active
- POS integration: Connected
- AI detection: Running

## Key Behavioral Trends
- Normal customer flow patterns detected
- No suspicious activities in the last shift
- Average transaction time: 2.5 minutes

## Actionable Recommendations
1. **Staffing:** Current coverage is adequate for observed traffic
2. **Security:** Continue monitoring high-value item areas
3. **Operations:** Consider peak hour optimization

*Note: This is demo data. Configure GEMINI_API_KEY environment variable for real AI insights.*`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No insights generated.";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Report Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate report',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
