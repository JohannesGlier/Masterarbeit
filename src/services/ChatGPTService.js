import { DEFAULT_PROMPT_TEMPLATES } from '@/config/promptTemplates';

export class ChatGPTService {
  constructor(promptTemplates = DEFAULT_PROMPT_TEMPLATES) {
    this.promptTemplates = promptTemplates;
    this.apiEndpoint = '/api/chat';
  }

  async _sendRequest(prompt) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      throw error;
    }
  }

  async analyzeArrow(startText, endText, position) {
    const prompt = this.promptTemplates.ARROW_ANALYSIS({
      startText,
      endText,
      position
    });
    
    return this._sendRequest(prompt);
  }

  async summarizeText(text) {
    const prompt = this.promptTemplates.TEXT_SUMMARY(text);
    return this._sendRequest(prompt);
  }

  async customRequest(message) {
    const prompt = this.promptTemplates.DEFAULT(message);
    return this._sendRequest(prompt);
  }
}