export const DEFAULT_PROMPT_TEMPLATES = {
    ARROW_ANALYSIS: ({ startText, endText }) => 
      `Generate 5 connecting points between the concepts "${startText}" and "${endText}".
      The list should represent a conceptual gradient from the first to the second term.
      Return only short headlines, keywords, or phrases.
      Return the result as a JSON array with each item as a string.`, 

    RELATIONSHIP_ARROW: ({ textFromTextcard }) => 
      `**Task Description:**
        Generate exactly 10 thematically related terms or short texts based on the provided input term. 
        These items should represent a conceptual gradient, moving from very close to distantly related.

        **Input:**
        Input Term: ${textFromTextcard}

        **Requirements:**
        1.  **Conceptual Gradient:**
            * The first item (Item 1) in the list must be thematically very close (e.g., synonym, direct association, hypernym/hyponym) to the Input Term (but not the input term itself).
            * The last item (Item 10) must be thematically distant from the Input Term but still possess a recognizable conceptual link or abstract connection. The connection might be indirect or metaphorical.
            * Items 2 through 9 must create a smooth, gradual thematic transition bridging the conceptual gap between the first and the last item. Each step should logically follow the previous one while subtly shifting the theme.
        2.  **Length Consistency:** Each of the 10 generated items should ideally have a character count that is approximately similar to the character count of the Input Term. Aim for within ±20% deviation, but prioritize the quality and coherence of the conceptual gradient if exact length matching conflicts with finding suitable terms.
        3.  **Quantity:** Ensure exactly 10 items are generated in the list.

        **Output Structure:**
        You MUST return the result **exclusively** as a single, valid JSON object.
        * This JSON object must contain exactly one top-level key named: "conceptual_gradient".
        * The value associated with the "conceptual_gradient" key must be a JSON array.
        * This JSON array must contain exactly 10 elements.
        * Each element within the array must be a string representing one of the generated terms or short texts, ordered according to the conceptual gradient (Item 1 = closest, Item 10 = most distant).

        **Example of the Required Output Format (Structure Only):**
        {
          "conceptual_gradient": [
            "string_representing_item_1",
            "string_representing_item_2",
            "string_representing_item_3",
            "string_representing_item_4",
            "string_representing_item_5",
            "string_representing_item_6",
            "string_representing_item_7",
            "string_representing_item_8",
            "string_representing_item_9",
            "string_representing_item_10"
          ]
        }`, 

    RELATIONSHIP_ARROW_2: ({ textFromTextcard }) => 
      `**Task Description:**
        Generate exactly 10 thematically related terms or short texts based on the provided input term.
        These items should represent a conceptual gradient moving from **concrete and closely related** to **abstract and thematically distant**.

        **Input:**
        Input Term: ${textFromTextcard}

        **Requirements:**
        1.  **Conceptual Gradient:**
            * The first item (Item 1) in the list must be **very concrete and thematically very close** (e.g., a specific instance of the input, a direct physical component, a synonym if the input is already concrete, or a closely related concrete concept) to the Input Term (but not the input term itself).
            * The last item (Item 10) must be **highly abstract and thematically distant** from the Input Term, while still possessing a recognizable conceptual or metaphorical link. The connection should emphasize abstraction and a more indirect relationship.
            * Items 2 through 9 must create a smooth, gradual transition, bridging the conceptual gap by **progressively increasing in abstraction and thematic distance** from the Input Term. Each step should logically follow the previous one while subtly shifting towards greater abstraction and a more distant (yet still discernible) thematic connection.
        2.  **Length Consistency:** Each of the 10 generated items should ideally have a character count that is approximately similar to the character count of the Input Term. Aim for within ±20% deviation, but prioritize the quality and coherence of the conceptual gradient if exact length matching conflicts with finding suitable terms.
        3.  **Quantity:** Ensure exactly 10 items are generated in the list.

        **Output Structure:**
        You MUST return the result **exclusively** as a single, valid JSON object.
        * This JSON object must contain exactly one top-level key named: "conceptual_gradient".
        * The value associated with the "conceptual_gradient" key must be a JSON array.
        * This JSON array must contain exactly 10 elements.
        * Each element within the array must be a string representing one of the generated terms or short texts, ordered according to the conceptual gradient (Item 1 = most concrete and closest, Item 10 = most abstract and most distant).

        **Example of the Required Output Format (Structure Only):**
        {
          "conceptual_gradient": [
            "string_representing_item_1",
            "string_representing_item_2",
            "string_representing_item_3",
            "string_representing_item_4",
            "string_representing_item_5",
            "string_representing_item_6",
            "string_representing_item_7",
            "string_representing_item_8",
            "string_representing_item_9",
            "string_representing_item_10"
          ]
        }`, 

    PROMPT_ARROW_INPUT: ({ inputText, promptText }) => 
      `Context: "${inputText}"
      User Prompt: "${promptText}"
      Apply the User Prompt to the Context.
      Return the results as JSON.
      The response must contain only the JSON object.`,

    PROMPT_ARROW: ({ promptText }) => 
      `User Prompt: "${promptText}". 
       Return the results as JSON.
       The response must contain only the JSON object.`,

    COMBINE_TEXTCARDS: ({ text1, text2 }) => 
      `Input:
      Concept 1 (C1): ${text1 || "No context"}
      Concept 2 (C2): ${text2 || "No context"}`,

    SUMMARIZE: ({ text }) => 
      `Summarize the following text concisely. Provide only the summary: ${text}`,

    SPLIT: ({ text }) => 
      `Split the following text into distinct thematic sections. 
      Format the output strictly as a JSON array where each object has an "id" (sequential, starting from 1) and a "text" field containing the content of that section. 
      If no meaningful split into multiple sections is possible, return an empty array ([]).

      Text to split:
      ${text}`,

    FRAME_BASED_TEXTCARD: ({ text }) => 
    `Analyze the following group of terms: "${text || "No input text provided."}".
    Generate exactly ONE new, specific, and concrete word (or a maximum 3-word phrase) that is thematically related but represents a clear, independent, and more specific idea or a concrete example.
    IMPORTANT: The answer must under no circumstances be a synonym, a repetition, or a slight modification of the input words. It must offer a genuine, distinct addition.
    Example: Input "vehicle types" -> Output "Amphibious vehicle". Input "dog breeds" -> Output "Shiba Inu". Input "painting, sculpture, art" -> Output "Performance art".`,

    NEIGHBOR_BASED_TEXTCARD: ({ text }) => 
    `Analyze the following group of terms: "${text || "No input text provided."}".
    Generate exactly ONE new, specific, and concrete word (or a maximum 3-word phrase) that is thematically related but represents a clear, independent, and more specific idea or a concrete example.
    IMPORTANT: The answer must under no circumstances be a synonym, a repetition, or a slight modification of the input words. It must offer a genuine, distinct addition.
    Example: Input "vehicle types" -> Output "Amphibious vehicle". Input "dog breeds" -> Output "Shiba Inu". Input "painting, sculpture, art" -> Output "Performance art".`,

    AUTO_LAYOUT: ({ text }) => 
    `Bitte analysiere die folgenden JSON-Daten, die Elemente (jeweils mit einer id) auf einem Canvas repräsentieren. Basierend auf dem Inhalt der 'Textkarte'-Elemente, ordne alle Elemente logisch und übersichtlich an.

    **Aufgaben:**
    1.  Gruppiere thematisch zusammengehörige Textkarten.
    2.  Erstelle bei Bedarf **neue** 'Bereich'-Elemente mit passenden Überschriften ('heading'), um diese Gruppen visuell zu umschließen.
    3.  Weise neu erstellten Bereichen fortlaufende ids zu, beginnend bei 1 (1, 2, ...).
    4.  Aktualisiere die 'position' (und optional 'size') aller Elemente für eine klare räumliche Strukturierung.
    5.  **WICHTIG:** Der 'text' von bestehenden 'Textkarte'-Elementen darf unter keinen Umständen verändert werden.
    6.  **WICHTIG:** Die id von bestehenden Elementen muss exakt beibehalten werden.

    Gib das Ergebnis als valides JSON-Array im exakt gleichen Format wie die Eingabe (inklusive id) zurück. 
    Das Array soll alle ursprünglichen Elemente (mit unveränderter id und aktualisierten Werten) und alle neu erstellten Bereiche (mit neuen ids) enthalten.

    Hier sind die aktuellen Elementdaten: "${text}"`,

    GENERATE_HEADING: ({ text }) => 
      `Generate a concise, objective, and informal heading for the following text. The heading can also serve as a categorization. Return only the heading text itself.
      Input text: ${text}`,

    GENERATE_FIRST_TEXTCARD: () => 
      `Surprise the user with a random topic, a provocative statement, a creative idea, or a critical question. The generated text must be no longer than one sentence.`,

    GENERATE_KEYWORD: ({ text }) => `${text}`,
    GENERATE_SHORT_PHRASE: ({ text }) => `${text}`,
    GENERATE_SHORT_TEXT: ({ text }) => `${text}`,
    GENERATE_MEDIUM_TEXT: ({ text }) => `${text}`,
    GENERATE_LONG_TEXT: ({ text }) => `${text}`,

    DEFAULT: (message) => message
};
  
// Optional: Weitere Template-Sets
export const TECHNICAL_PROMPTS = {
    ARROW_ANALYSIS: ({ startText, endText, position }) => 
      `Generate technical term between ${startText} and ${endText} at ${position}`
};