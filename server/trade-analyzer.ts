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
  "deposit", "transfer", "trade", "exchange", "swap", "agreed", "confirm",
  "confirmation", "deal", "offer", "counter", "accept"
];

// Financial amounts pattern (£ and numbers)
const AMOUNT_PATTERN = /£?\s*\d+[\d,]*(\.\d+)?\s*(million|m|billion|bn|k|thousand)?/i;

// Interest rate pattern (percentages)
const RATE_PATTERN = /\d+\.?\d*\s*%/i;

// GBP amount pattern (specific)
const GBP_AMOUNT_PATTERN = /(?:£|GBP)\s*\d+[\d,]*(\.\d+)?\s*(million|m|billion|bn|k|thousand)?/i;

// Time period pattern (days, months, years)
const PERIOD_PATTERN = /\d+\s*(day|days|week|weeks|month|months|year|years)/i;

// Trade confirmation pattern
const CONFIRMATION_PATTERN = /(confirm|agreed|trade confirmed|deal done)/i;

export interface TradeDetails {
  isTradeRequest: boolean;
  tradeType: string;
  amount: string;
  details: string;
  rate?: string;
  period?: string;
  counterparty?: string;
  isConfirmation?: boolean;
  isNegotiation?: boolean;
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
      
      // Extract key information using regex patterns
      const amountMatches = lowerMessage.match(AMOUNT_PATTERN);
      const gbpMatches = lowerMessage.match(GBP_AMOUNT_PATTERN);
      const rateMatches = lowerMessage.match(RATE_PATTERN);
      const periodMatches = lowerMessage.match(PERIOD_PATTERN);
      const confirmationMatches = lowerMessage.match(CONFIRMATION_PATTERN);
      
      // Check if this is a trade confirmation
      const isConfirmation: boolean = !!(confirmationMatches || 
        (lowerMessage.includes("trade") && lowerMessage.includes("confirm")) ||
        (lowerMessage.includes("deal") && lowerMessage.includes("done")));
      
      // Check if this is a negotiation message
      const isNegotiation: boolean = !!(
        (rateMatches && (lowerMessage.includes("offer") || lowerMessage.includes("counter") || lowerMessage.includes("price"))) ||
        (lowerMessage.includes("show") && rateMatches));
        
      // Check if the message contains any trade-related indicators
      const hasTradeTerm = TRADE_INDICATORS.some(term => 
        lowerMessage.includes(term.toLowerCase())
      );
      
      // Skip messages without any trade terms, amounts, or rates
      if (!hasTradeTerm && !amountMatches && !rateMatches && !isConfirmation) {
        return defaultResult;
      }
      
      // Determine trade type based on context clues
      let tradeType = "Money Market Transaction";
      let amount = "";
      let rate = "";
      let period = "";
      let counterparty = "";
      
      // Extract specific entities
      if (gbpMatches && gbpMatches[0]) {
        amount = gbpMatches[0];
      } else if (amountMatches && amountMatches[0]) {
        amount = amountMatches[0];
        if (!amount.includes("£") && !amount.includes("GBP")) {
          amount = "£" + amount;
        }
      }
      
      if (rateMatches && rateMatches[0]) {
        rate = rateMatches[0];
      }
      
      if (periodMatches && periodMatches[0]) {
        period = periodMatches[0];
      } else if (lowerMessage.includes("4 month") || lowerMessage.includes("4-month")) {
        period = "4 months";
      }
      
      // Look for potential counterparties
      if (lowerMessage.includes("council")) {
        const councilMatch = message.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*) Council/);
        if (councilMatch && councilMatch[1]) {
          counterparty = councilMatch[1] + " Council";
        }
      } else if (lowerMessage.includes("bank")) {
        const bankMatch = message.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*) Bank/);
        if (bankMatch && bankMatch[1]) {
          counterparty = bankMatch[1] + " Bank";
        }
      }
      
      // Detect more specific trade types based on message content
      if (lowerMessage.includes("borrow") || lowerMessage.includes("loan") || lowerMessage.includes("pwlb")) {
        tradeType = "Loan/Borrowing";
      } else if (lowerMessage.includes("invest") || lowerMessage.includes("mmf") || lowerMessage.includes("money market fund")) {
        tradeType = "MMF Investment";
      } else if (lowerMessage.includes("treasury") || lowerMessage.includes("gilt") || lowerMessage.includes("bond")) {
        tradeType = "Treasury/Bond"; 
      } else if (lowerMessage.includes("deposit")) {
        tradeType = "Deposit";
      }
      
      return {
        isTradeRequest: !!isConfirmation || !!(amount && rate && (hasTradeTerm || isNegotiation)),
        tradeType,
        amount,
        details: message,
        rate,
        period,
        counterparty,
        isConfirmation: !!isConfirmation,
        isNegotiation: !!isNegotiation
      };
    }
    
    // Use GPT model to analyze the message for trade intent
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a trade detection system for UK local councils' financial money market transactions. 
            Analyze messages to identify if they contain explicit requests to execute financial transactions,
            price negotiations between parties, or final trade confirmations.
            
            Examples of what counts as a trade request or confirmation:
            - "Please process a PWLB loan of £5 million at the 5-year fixed rate."
            - "Execute the investment of £2.5m into the BNY Mellon Sterling Liquidity Fund."
            - "Go ahead with the treasury bill purchase we discussed, £750,000 for 3-month maturity."
            - "Confirmation: Birmingham City Council borrows £20 million for 4 months from NatWest at 4.55%."
            
            Examples of trade negotiations:
            - "We can offer 4.56% for 20 million GBP for 4 months."
            - "I'll counter at 4.54% for the same amount."
            - "Can you show a price for £10m, 6-month deposit?"
            
            Examples that are NOT trade requests:
            - "What are the current PWLB rates?"
            - "Should we consider investing in money market funds given current rates?"
            - "Can you explain the process for borrowing from PWLB?"
            
            Respond with a JSON object with these fields:
            - isTradeRequest: boolean (true if the message contains a direct request to execute a trade, negotiation, or confirmation)
            - tradeType: string (e.g., "Loan/Borrowing", "Deposit", "Money Market Transaction", etc.)
            - amount: string (the monetary amount mentioned, with £ symbol)
            - rate: string (interest rate percentage mentioned, if any)
            - period: string (time period for the transaction, if mentioned)
            - counterparty: string (the other party in the transaction, if mentioned)
            - isConfirmation: boolean (true if this is a final trade confirmation)
            - isNegotiation: boolean (true if this is a negotiation or price discussion)
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
      details: result.details || "",
      rate: result.rate || "",
      period: result.period || "",
      counterparty: result.counterparty || "",
      isConfirmation: result.isConfirmation || false,
      isNegotiation: result.isNegotiation || false
    };
  } catch (error) {
    console.error("Error analyzing message for trade intent:", error);
    return defaultResult;
  }
}