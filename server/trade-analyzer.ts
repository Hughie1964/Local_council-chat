import OpenAI from "openai";
import { Trade } from "@shared/schema";

// Check if we have a real API key or if we should use development mode
const apiKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY : "dummy_key_for_development";
const isDevMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "dummy_key_for_development";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey });

// Trade patterns that would need super user approval
const TRADE_INDICATORS = [
  "execute", "purchase", "buy", "sell", "invest", "place order", "transact",
  "proceed with", "go ahead with", "arrange", "acquire", "borrow", "loan",
  "deposit", "transfer", "trade", "exchange", "swap"
];

// Financial amounts pattern (£ and numbers)
const AMOUNT_PATTERN = /£?\s*\d+[\d,]*(\.\d+)?\s*(million|m|billion|bn|k|thousand)?/i;

export interface TradeDetails {
  isTradeRequest: boolean;
  tradeType: string;
  amount: string;
  details: string;
}

/**
 * Analyze a message to detect if it contains a trade execution request
 * @param message User message to analyze
 * @returns Object with trade detection and details
 */
export async function analyzeMessageForTrade(message: string): Promise<TradeDetails> {
  // Default result
  const defaultResult = {
    isTradeRequest: false,
    tradeType: "",
    amount: "",
    details: ""
  };

  try {
    // In development mode, do a simple text pattern analysis
    if (isDevMode) {
      const lowerMessage = message.toLowerCase();
      
      // Check if the message contains trade execution keywords
      const hasTradeTerm = TRADE_INDICATORS.some(term => 
        lowerMessage.includes(term.toLowerCase())
      );
      
      if (!hasTradeTerm) {
        return defaultResult;
      }
      
      // Look for monetary amounts
      const amountMatches = lowerMessage.match(AMOUNT_PATTERN);
      if (!amountMatches) {
        return defaultResult;
      }
      
      // Perform simple analysis
      let tradeType = "Unknown transaction";
      
      if (lowerMessage.includes("borrow") || lowerMessage.includes("loan") || lowerMessage.includes("pwlb")) {
        tradeType = "PWLB Borrowing";
      } else if (lowerMessage.includes("invest") || lowerMessage.includes("mmf") || lowerMessage.includes("fund")) {
        tradeType = "MMF Investment";
      } else if (lowerMessage.includes("treasury") || lowerMessage.includes("gilt") || lowerMessage.includes("bond")) {
        tradeType = "Treasury Bond";
      }
      
      return {
        isTradeRequest: true,
        tradeType,
        amount: amountMatches[0],
        details: message
      };
    }
    
    // Use GPT model to analyze the message for trade intent
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a trade detection system for UK local councils' financial transactions. 
            Analyze messages to identify if they contain explicit requests to execute financial transactions.
            
            Examples of what counts as a trade request:
            - "Please process a PWLB loan of £5 million at the 5-year fixed rate."
            - "Execute the investment of £2.5m into the BNY Mellon Sterling Liquidity Fund."
            - "Go ahead with the treasury bill purchase we discussed, £750,000 for 3-month maturity."
            
            Examples that are NOT trade requests:
            - "What are the current PWLB rates?"
            - "Should we consider investing in money market funds given current rates?"
            - "Can you explain the process for borrowing from PWLB?"
            
            Respond with a JSON object with these fields:
            - isTradeRequest: boolean (true if the message contains a direct request to execute a trade)
            - tradeType: string (e.g., "PWLB Borrowing", "MMF Investment", "Treasury Bond", etc.)
            - amount: string (the monetary amount mentioned, with £ symbol)
            - details: string (brief description of the transaction)
          `
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("Empty response from OpenAI");
    }
    
    const result = JSON.parse(response.choices[0].message.content);
    return {
      isTradeRequest: result.isTradeRequest || false,
      tradeType: result.tradeType || "",
      amount: result.amount || "",
      details: result.details || ""
    };
  } catch (error) {
    console.error("Error analyzing message for trade intent:", error);
    return defaultResult;
  }
}