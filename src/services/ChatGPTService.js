import { DEFAULT_PROMPT_TEMPLATES } from '@/config/promptTemplates';

export class ChatGPTService {
  constructor(promptTemplates = DEFAULT_PROMPT_TEMPLATES) {
    this.promptTemplates = promptTemplates;
    this.apiEndpoint = '/api/chat';
  }

  async _sendRequest({ message, promptType = 'DEFAULT' }) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message, 
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

  async promptArrow_Input_Output(inputText, promptText, output) {
    if(output === "textcard"){
      const prompt = this.promptTemplates.PROMPT_ARROW_TEXTCARD_INPUT({ inputText, promptText });
      return this._sendRequest({
        message: prompt,
        promptType: 'PROMPT_ARROW_TEXTCARD_INPUT'
      });
    }
    else{
      const prompt = this.promptTemplates.PROMPT_ARROW_INPUT({ inputText, promptText });
      return this._sendRequest({
        message: prompt,
        promptType: 'PROMPT_ARROW_INPUT'
      });
    }
  }

  async promptArrow_Output(promptText, output) {
    if(output === "textcard"){
      const prompt = this.promptTemplates.PROMPT_ARROW_TEXTCARD({ promptText });
      return this._sendRequest({
        message: prompt,
        promptType: 'PROMPT_ARROW_TEXTCARD'
      });
    }
    else{
      const prompt = this.promptTemplates.PROMPT_ARROW({ promptText });
      return this._sendRequest({
        message: prompt,
        promptType: 'PROMPT_ARROW'
      });
    }
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

  async neighborbasedTextcard(text, mousePosX, mousePosY) {
    const prompt = this.promptTemplates.NEIGHBOR_BASED_TEXTCARD({text, mousePosX, mousePosY});
    return this._sendRequest({
      message: prompt,
      promptType: 'NEIGHBOR_BASED_TEXTCARD' // Füge den promptType hinzu (System Prompt)
    });
  }

  async autoLayout(text) {
    const prompt = this.promptTemplates.AUTO_LAYOUT({text});
    return this._sendRequest({
      message: prompt,
      promptType: 'AUTO_LAYOUT' // Füge den promptType hinzu (System Prompt)
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