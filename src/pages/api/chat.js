import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: message }, // Verwende die übergebene Nachricht
    ];
    
    const completion = await openai.chat.completions.create({
      messages,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      max_tokens: 100,        // Maximale Anzahl von Tokens in der Antwort
      temperature: 0.7,       // Kreativität der Antwort (0 = deterministisch, 1 = kreativ)
      top_p: 1,               // Sampling-Methode (Alternative zu temperature)
      n: 1,                   // Anzahl der generierten Antworten
      stop: null,             // Stoppsequenz, um die Generierung zu beenden
      presence_penalty: 0,    // Bestraft neue Themen (positiver Wert = weniger neue Themen)
      frequency_penalty: 0,   // Bestraft Wiederholungen (positiver Wert = weniger Wiederholungen)
    });

    res.status(200).json(completion.choices[0].message);
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
}