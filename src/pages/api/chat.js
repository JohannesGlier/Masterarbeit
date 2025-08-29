import { OpenAI } from 'openai';
import { SYSTEM_PROMPTS } from '@/config/systemPrompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, promptType = 'DEFAULT' } = req.body;

    console.log('Received request:', { message, promptType });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPTS[promptType] || SYSTEM_PROMPTS.DEFAULT },
      { role: 'user', content: message },
    ];
    
    const completion = await openai.chat.completions.create({
      messages,
      model: process.env.OPENAI_MODEL || 'gpt-4.1-2025-04-14',   // gpt-4o-mini-2024-07-18
      max_tokens: 3000,       // Maximale Anzahl von Tokens in der Antwort
      temperature: 0.7,       // Kreativität der Antwort (0 = deterministisch, 1 = kreativ)
      top_p: 1,               // Sampling-Methode (Alternative zu temperature)
      n: 1,                   // Anzahl der generierten Antworten
      stop: null,             // Stoppsequenz, um die Generierung zu beenden
      presence_penalty: 0,    // Bestraft neue Themen (positiver Wert = weniger neue Themen)
      frequency_penalty: 0,   // Bestraft Wiederholungen (positiver Wert = weniger Wiederholungen)
    });

    console.log('OpenAI response:', completion);

    res.status(200).json(completion.choices[0].message);
    
  } catch (error) {
    console.error('Detailed OpenAI API error:', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
        error: 'Error processing your request',
        details: error.message 
    });
  }
}