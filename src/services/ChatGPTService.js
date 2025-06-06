import { DEFAULT_PROMPT_TEMPLATES } from '@/config/promptTemplates';

export class ChatGPTService {
  constructor(language = 'en', promptTemplates = DEFAULT_PROMPT_TEMPLATES) {
    this.promptTemplates = promptTemplates;
    this.apiEndpoint = '/api/chat';
    this.language = language;

    this.languageMap = {
      'de': 'Deutsch',
      'en': 'English',
    };
  }

  _getLanguageInstruction() {
    const languageName = this.languageMap[this.language] || this.language;

    if (this.language === 'de') {
        return `Antworte auf ${languageName}.`;
    } else if (this.language === 'en') {
        return `Answer in ${languageName}.`;
    } else {
        return "";
    }
  }

  async _sendRequest({ message, promptType = 'DEFAULT' }) {
    const languageInstruction = this._getLanguageInstruction();
    const finalMessage = `${languageInstruction}\n\n${message}`;

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: finalMessage, 
          promptType  // Sende den promptType mit
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      throw error;
    }
  }

  async analyzeArrow(startText, endText) {
    const prompt = this.promptTemplates.ARROW_ANALYSIS({ startText, endText });
    return this._sendRequest({
      message: prompt,
      promptType: 'ARROW_ANALYSIS'
    });
  }

  async relationshipArrow(textFromTextcard) {
    const prompt = this.promptTemplates.RELATIONSHIP_ARROW({ textFromTextcard });
    return this._sendRequest({
      message: prompt,
      promptType: 'RELATIONSHIP_ARROW'
    });
  }

  async promptArrow_Input(inputText, promptText) {
    const prompt = this.promptTemplates.PROMPT_ARROW_INPUT({ inputText, promptText });
    return this._sendRequest({
      message: prompt,
      promptType: 'PROMPT_ARROW_INPUT'  // Füge den promptType hinzu (System Prompt)
    });
  }

  async promptArrow(promptText) {
    const prompt = this.promptTemplates.PROMPT_ARROW({ promptText });
    return this._sendRequest({
      message: prompt,
      promptType: 'PROMPT_ARROW'  // Füge den promptType hinzu (System Prompt)
    });
  }

  async combineTextcards(text1, text2) {
    const prompt = this.promptTemplates.COMBINE_TEXTCARDS({text1, text2});
    return this._sendRequest({
      message: prompt,
      promptType: 'COMBINE_TEXTCARDS' // Füge den promptType hinzu (System Prompt)
    });
  }

  async getSummary(text) {
    const prompt = this.promptTemplates.SUMMARIZE({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'SUMMARIZE' // Füge den promptType hinzu (System Prompt)
    });
  }

  async splitTextcard(text) {
    const prompt = this.promptTemplates.SPLIT({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'SPLIT' // Füge den promptType hinzu (System Prompt)
    });
  }

  async frameBasedTextcard(text) {
    const prompt = this.promptTemplates.FRAME_BASED_TEXTCARD({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'FRAME_BASED_TEXTCARD' // Füge den promptType hinzu (System Prompt)
    });
  }

  async neighborbasedTextcard(text) {
    const prompt = this.promptTemplates.NEIGHBOR_BASED_TEXTCARD({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'NEIGHBOR_BASED_TEXTCARD' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateFirstTextcard() {
    const prompt = this.promptTemplates.GENERATE_FIRST_TEXTCARD();
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_FIRST_TEXTCARD' // Füge den promptType hinzu (System Prompt)
    });
  }

  async autoLayout(text) {
    const prompt = this.promptTemplates.AUTO_LAYOUT({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'AUTO_LAYOUT' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateHeading(text) {
    const prompt = this.promptTemplates.GENERATE_HEADING({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_HEADING' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateShortPhrase(text) {
    const prompt = this.promptTemplates.GENERATE_SHORT_PHRASE({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_SHORT_PHRASE' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateKeyword(text) {
    const prompt = this.promptTemplates.GENERATE_KEYWORD({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_KEYWORD' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateShortText(text) {
    const prompt = this.promptTemplates.GENERATE_SHORT_TEXT({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_SHORT_TEXT' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateMediumText(text) {
    const prompt = this.promptTemplates.GENERATE_MEDIUM_TEXT({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_MEDIUM_TEXT' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateLongText(text) {
    const prompt = this.promptTemplates.GENERATE_LONG_TEXT({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_LONG_TEXT' // Füge den promptType hinzu (System Prompt)
    });
  }

  async generateMindMap(text) {
    const prompt = this.promptTemplates.GENERATE_MINDMAP({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'GENERATE_MINDMAP' // Füge den promptType hinzu (System Prompt)
    });
  }

  async customRequest(message) {
    const prompt = this.promptTemplates.DEFAULT(message);
    return this._sendRequest({
      message: prompt,
      promptType: 'DEFAULT'
    });
  }
}