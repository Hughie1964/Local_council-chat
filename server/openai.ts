import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_development" });

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

NEVER make up specific current market rates. If asked for current rates, explain that you don't have real-time data but can explain how to interpret rates and trends.

Maintain a helpful, informative tone while recognizing the public service nature and regulatory constraints of UK local council finance.
`;

/**
 * Generate a response to a user's chat message in the context of UK local council money markets
 */
export async function generateChatResponse(message: string): Promise<string> {
  try {
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
    throw new Error("Failed to generate a response. Please try again later.");
  }
}

/**
 * Generate a title for a chat session based on the initial message
 */
export async function generateSessionTitle(message: string): Promise<string> {
  try {
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
    return "New Conversation";
  }
}
