import OpenAI from "openai";

// Check if we have a real API key or if we should use development mode
const apiKey = process.env.OPENAI_API_KEY || "dummy_key_for_development";
const isDevMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy_key_for_development";

if (isDevMode) {
  console.warn("⚠️ WARNING: Running in development mode without a valid OpenAI API key");
  console.warn("Please provide OPENAI_API_KEY environment variable for full functionality");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey });

// System prompt for UK local council money market assistant
const SYSTEM_PROMPT = `
You are a specialized financial AI assistant for UK local councils focusing on money market information.
Your expertise includes:

1. PWLB (Public Works Loan Board) borrowing rates and strategies
2. Money market fund investments
3. Cash flow management for councils
4. Treasury management strategies
5. Debt restructuring options
6. Local government financial regulations in the UK

When responding:
- Use formal, professional language appropriate for government financial officials
- Cite relevant UK treasury guidelines, CIPFA codes, or financial regulations when applicable
- Provide specific, actionable advice tailored to UK local council contexts
- Format numerical data in clear tables when appropriate
- Present balanced views on investment options, always emphasizing prudence and risk management
- Highlight when certain strategies may require Section 151 Officer approval
- Use British pound (£) symbol for all currency values, not dollar signs

NEVER make up specific current market rates. If asked for current rates, explain that you don't have real-time data but can explain how to interpret rates and trends.

Maintain a helpful, informative tone while recognizing the public service nature and regulatory constraints of UK local council finance.
`;

// Sample response for development mode (when no API key is provided)
const DEV_MODE_RESPONSES = {
  chat: `Thank you for your inquiry regarding UK local council money market options.

While I don't have access to current market rates, I can advise that the PWLB (Public Works Loan Board) offers various borrowing options for local councils, with rates that vary based on loan duration and type.

For money market investments, councils typically consider:

1. Treasury bills
2. Certificates of deposit 
3. Money market funds
4. Short-term bonds

Current best practices in treasury management for UK councils include:

- Diversification of investment portfolio
- Regular cash flow forecasting
- Adherence to CIPFA Treasury Management Code
- Setting appropriate risk parameters
- Regular reporting to the Section 151 Officer

Would you like more specific information about any of these areas? I'm happy to provide guidance on how to interpret market rates and trends even though I cannot provide current rates.`,

  titles: [
    "PWLB Borrowing Options",
    "Treasury Management Strategy",
    "Council Investment Portfolio",
    "Cash Flow Forecasting",
    "UK Council Finance Query"
  ]
};

/**
 * Generate a response to a user's chat message in the context of UK local council money markets
 */
export async function generateChatResponse(message: string): Promise<string> {
  try {
    // If in development mode and no API key is available, return sample response
    if (isDevMode) {
      console.log("Using development mode response for chat");
      return DEV_MODE_RESPONSES.chat;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating OpenAI response:", error);
    
    // If API error, fall back to sample response
    console.log("Falling back to development mode response for chat");
    return DEV_MODE_RESPONSES.chat;
  }
}

/**
 * Generate a title for a chat session based on the initial message
 */
export async function generateSessionTitle(message: string): Promise<string> {
  try {
    // If in development mode and no API key is available, return sample title
    if (isDevMode) {
      console.log("Using development mode response for session title");
      const randomIndex = Math.floor(Math.random() * DEV_MODE_RESPONSES.titles.length);
      return DEV_MODE_RESPONSES.titles[randomIndex];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Generate a short, descriptive title (5 words or less) for a conversation based on the user's initial query about UK local council finances and money markets." 
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 60,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{"title": "New Conversation"}';
    const result = JSON.parse(content);
    return result.title || "New Conversation";
  } catch (error) {
    console.error("Error generating session title:", error);
    
    // If API error, fall back to sample title
    console.log("Falling back to development mode response for session title");
    const randomIndex = Math.floor(Math.random() * DEV_MODE_RESPONSES.titles.length);
    return DEV_MODE_RESPONSES.titles[randomIndex];
  }
}
