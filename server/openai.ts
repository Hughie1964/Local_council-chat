import OpenAI from "openai";
import axios from "axios";
import * as cheerio from "cheerio";

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
7. Bank of England base rate and its implications for council finances

When responding:
- Use formal, professional language appropriate for government financial officials
- Cite relevant UK treasury guidelines, CIPFA codes, or financial regulations when applicable
- Provide specific, actionable advice tailored to UK local council contexts
- Format numerical data in clear tables when appropriate
- Present balanced views on investment options, always emphasizing prudence and risk management
- Highlight when certain strategies may require Section 151 Officer approval
- Use British pound (£) symbol for all currency values, not dollar signs

For Bank of England base rate questions, use the rate information provided in the conversation context.
If no specific rate information is provided, explain that you need up-to-date information to give accurate advice.

Maintain a helpful, informative tone while recognizing the public service nature and regulatory constraints of UK local council finance.
`;

// Sample response for development mode (when no API key is provided)
const DEV_MODE_RESPONSES = {
  chat: `Thank you for your inquiry regarding UK local council money market options.

I'm pleased to provide you with the current rates information available as of 27 March 2025:

**Bank of England Base Rate: 4.5%**

**Current PWLB Fixed Rates:**
- PWLB 1 Year Fixed Rate: 4.20%
- PWLB 5 Year Fixed Rate: 4.45%  
- PWLB 10 Year Fixed Rate: 4.63%
- PWLB 20 Year Fixed Rate: 4.78%
- PWLB 30 Year Fixed Rate: 4.85%
- PWLB 50 Year Fixed Rate: 4.90%

For money market investments, councils typically consider:

1. Treasury bills
2. Certificates of deposit 
3. Money market funds
4. Short-term bonds

Current best practices in treasury management for UK councils with the current rates include:

- Considering shorter-term PWLB borrowing given the inverted yield curve
- Diversification of investment portfolio
- Regular cash flow forecasting
- Adherence to CIPFA Treasury Management Code
- Setting appropriate risk parameters
- Regular reporting to the Section 151 Officer

Would you like more specific information about how your council should approach these rates or any other financial matters?`,

  titles: [
    "PWLB Borrowing Options",
    "Treasury Management Strategy",
    "Council Investment Portfolio",
    "Cash Flow Forecasting",
    "UK Council Finance Query"
  ]
};

/**
 * Fetch the current Bank of England base rate
 */
export async function fetchBankOfEnglandRate(): Promise<string | null> {
  try {
    console.log("Attempting to fetch Bank of England base rate data");
    const response = await axios.get('https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate');
    const $ = cheerio.load(response.data);
    
    // Try various selectors that might contain the Bank Rate information
    // The Bank of England website structure may change, so we try multiple possible selectors
    let rateText = '';
    
    // Try common selectors where the rate information might be found
    const possibleSelectors = [
      // Main heading and paragraph that often contains the rate
      'h1:contains("Bank Rate") + p',
      'h2:contains("Bank Rate") + p',
      // Elements with specific classes that might hold the rate
      '.rate-value', '.interest-rate', '.bank-rate', '.rate-information',
      // Common containers for the rate information
      '.monetary-policy-summary', '.key-facts',
      // Full sections that might contain the rate
      'section:contains("Bank Rate")'
    ];
    
    // Try each selector until we find content
    for (const selector of possibleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > 0) {
          rateText = text;
          console.log(`Found rate information using selector: ${selector}`);
          break;
        }
      }
    }
    
    // If selectors failed, try a broader approach - look for paragraphs containing rate keywords
    if (!rateText) {
      $('p').each((i, elem) => {
        const text = $(elem).text();
        if (text.includes('Bank Rate') || text.includes('interest rate') || text.includes('%')) {
          rateText = text.trim();
          console.log("Found rate information in paragraph text");
          return false; // break the each loop
        }
      });
    }
    
    if (rateText) {
      console.log("Successfully fetched Bank of England rate information");
      return rateText;
    }
    
    // If we still don't have rate info, try to get a more general extract from the page
    const pageTitle = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const fallbackContent = `${pageTitle}. ${metaDescription}`;
    
    if (fallbackContent.length > 30) { // Make sure it's substantial enough
      console.log("Using page metadata for Bank of England information");
      return fallbackContent;
    }
    
    console.log("Bank of England rate information not found in expected format");
    return null;
  } catch (error) {
    console.error("Error fetching Bank of England rate:", error);
    return null;
  }
}

/**
 * Check if the message is asking about Bank of England rates
 */
function isAskingAboutBankRate(message: string): boolean {
  const lowerCaseMsg = message.toLowerCase();
  
  // Core keywords for direct mentions
  const coreBankKeywords = [
    'bank of england', 
    'boe', 
    'base rate',
    'interest rate',
    'central bank'
  ];
  
  // Rate-related keywords that might indicate interest in rates
  const rateKeywords = [
    'rate',
    'interest',
    'percentage',
    'basis points',
    'monetary policy',
    'lending rate',
    'borrowing cost',
    'treasury rates',
    'gilt yields'
  ];
  
  // Question or request indicators
  const questionIndicators = [
    'what is',
    'what are',
    'how much',
    'tell me',
    'information on',
    'data on',
    'fetch',
    'get',
    'current',
    'latest',
    'today\'s',
    'updated'
  ];
  
  // If we have a direct match for Bank of England rate terms, return true
  const directMatches = [
    'bank of england rate', 
    'bank of england interest', 
    'boe rate', 
    'boe interest',
    'base rate', 
    'central bank rate',
    'uk interest rate',
    'current interest rate',
    'bank rate',
    'policy rate',
    'official rate'
  ];
  
  // First check direct matches
  if (directMatches.some(term => lowerCaseMsg.includes(term))) {
    return true;
  }
  
  // Then check for combinations of bank terms + rate terms
  const hasBankTerm = coreBankKeywords.some(term => lowerCaseMsg.includes(term));
  const hasRateTerm = rateKeywords.some(term => lowerCaseMsg.includes(term));
  
  // If we have both a bank term and a rate term, likely asking about rates
  if (hasBankTerm && hasRateTerm) {
    return true;
  }
  
  // Check for question patterns about rates
  for (const indicator of questionIndicators) {
    if (lowerCaseMsg.includes(indicator)) {
      // If asking "what is the current rate" or similar
      if (hasRateTerm) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Analyze interest rate information and provide council-specific recommendations
 */
export async function analyzeInterestRatesForCouncils(rateInfo: string): Promise<string> {
  try {
    if (isDevMode) {
      console.log("Using development mode for interest rate analysis");
      return "Based on current interest rate trends, councils should consider reviewing their investment strategy to optimize returns while maintaining necessary liquidity. The current environment suggests a balanced approach between short-term and medium-term investments.";
    }

    const analysisPrompt = `
    Analyze the following Bank of England interest rate information and provide strategic recommendations 
    for UK local councils regarding their money market investments, treasury management, and borrowing strategies.
    Focus on practical implications for council finance officers.
    
    Current rate information: ${rateInfo}
    
    Provide your analysis with these sections:
    1. Immediate implications for council cash investments
    2. Considerations for PWLB borrowing plans
    3. Recommendations for treasury management strategy updates
    4. Risk management considerations
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't analyze the interest rate information. Please try again.";
  } catch (error) {
    console.error("Error analyzing interest rates:", error);
    return "I apologize, but I couldn't analyze the interest rate information due to a technical issue. Please try again later.";
  }
}

/**
 * Intent detection for various features
 * This more advanced approach identifies the user's intent regardless of exact phrasing
 */
interface CommandIntent {
  feature: string;
  action: string;
  confidence: number;
  extractedParams?: Record<string, any>;
}

/**
 * Identify user's intent from their message
 */
function identifyCommandIntent(message: string): CommandIntent | null {
  const lowerCaseMsg = message.toLowerCase();
  
  // Feature keyword groups
  const featureKeywords = {
    calendar: [
      'calendar', 'schedule', 'event', 'meeting', 'appointment', 'agenda', 
      'upcoming', 'planned', 'financial calendar', 'events', 'when is', 
      'dates', 'timetable', 'maturity', 'maturation', 'maturing', 'due',
      'reminder', 'booking', 'invite'
    ],
    documents: [
      'document', 'file', 'report', 'attachment', 'paper', 'pdf', 
      'spreadsheet', 'financial report', 'statement', 'policy', 
      'guidance', 'records', 'presentation', 'memo', 'minutes',
      'agreements', 'contract', 'forms'
    ],
    forecasting: [
      'forecast', 'predict', 'projection', 'outlook', 'future', 'trend', 
      'analysis', 'cash flow', 'interest rate', 'rate forecast', 
      'financial forecast', 'projected', 'estimation', 'anticipate',
      'foresee', 'projection', 'scenario'
    ],
    trades: [
      'trade', 'transaction', 'deal', 'loan', 'lend', 'borrow', 'lending',
      'borrowing', 'money market', 'investment', 'deposit', 'rate', 'quote',
      'offer', 'placement', 'execution', 'settlement', 'maturity',
      'counterparty', 'interest'
    ],
    quotes: [
      'quote', 'offer', 'request for quote', 'rfq', 'rate', 'best price',
      'indicative', 'pricing', 'quote request', 'cost', 'fee', 'ask for quote',
      'bid', 'tender', 'proposal', 'inquiry'
    ]
  };
  
  // Action keyword groups
  const actionKeywords = {
    view: [
      'show', 'see', 'view', 'get', 'display', 'list', 'check', 'find',
      'search', 'tell me about', 'what are', 'look at', 'open', 'browse',
      'explore', 'fetch', 'give me', 'present', 'reveal'
    ],
    create: [
      'create', 'add', 'new', 'make', 'schedule', 'set up', 'arrange',
      'establish', 'generate', 'initiate', 'start', 'build', 'compose',
      'draft', 'prepare', 'develop'
    ],
    update: [
      'update', 'edit', 'modify', 'change', 'adjust', 'revise', 'amend',
      'alter', 'correct', 'fix', 'improve', 'enhance', 'refine'
    ],
    delete: [
      'delete', 'remove', 'cancel', 'eliminate', 'dispose', 'get rid of',
      'take out', 'erase', 'clear', 'drop', 'terminate', 'end', 'discontinue'
    ],
    analyze: [
      'analyze', 'examine', 'study', 'evaluate', 'assess', 'review', 
      'investigate', 'interpret', 'understand', 'measure', 'test',
      'research', 'explore', 'diagnose'
    ],
    execute: [
      'execute', 'perform', 'do', 'conduct', 'carry out', 'run', 'implement',
      'complete', 'finish', 'undertake', 'accomplish', 'achieve', 'fulfill'
    ]
  };
  
  // Direct phrase patterns (for high confidence matches)
  const directPhrases = {
    'calendar_view': [
      'show me the calendar', 'view calendar', 'financial calendar', 
      'check calendar', 'view my events', 'show events', 'upcoming events',
      'what events are coming up', 'when is my next meeting',
      'do i have any meetings', 'what is on the schedule',
      'what is due soon', 'any maturities coming up', 'trades maturing soon'
    ],
    'documents_view': [
      'show me the documents', 'view documents', 'document list', 
      'my documents', 'shared documents', 'document management',
      'search documents', 'recent documents', 'find me the report',
      'i need to see the files', 'where are the statements',
      'pull up that document about', 'do we have documentation on'
    ],
    'forecasting_view': [
      'show me the forecast', 'view forecasts', 'interest rate trends',
      'cash flow forecast', 'forecasting tools', 'rate predictions',
      'future rates', 'show me the projections', 'financial forecasts',
      'what will rates do', 'how are rates trending', 
      'predict future cash flow', 'anticipated market movements'
    ],
    'trades_view': [
      'show me my trades', 'view transactions', 'trade history',
      'see my deals', 'recent trades', 'view loan details',
      'check my investments', 'active loans', 'pending trades',
      'what trades do i have', 'show me what i have borrowed',
      'who have i lent to', 'transactions to date'
    ],
    'trades_create': [
      'create a new trade', 'i want to lend', 'i need to borrow',
      'place a new deposit', 'arrange a loan', 'new transaction',
      'start a new deal', 'execute a trade', 'i would like to invest',
      'can you place a trade', 'help me lend out some money',
      'i want to offer funds to', 'need to borrow from'
    ],
    'quotes_view': [
      'show me quotes', 'view current rates', 'what rates are available',
      'check the offers', 'see latest quotes', 'current lending rates',
      'best borrowing rates', 'view rate sheet', 'what is the market like',
      'where can i get the best rate', 'who is offering good rates'
    ],
    'quotes_create': [
      'request a quote', 'get me a rate', 'i need pricing', 
      'ask for a quote', 'get an offer', 'rfq', 'price inquiry', 
      'how much to borrow', 'what rate can i get', 'find me the best offer',
      'who will give me the best rate', 'shop around for rates'
    ]
  };
  
  // Check direct phrases first (highest confidence)
  for (const [intentKey, phrases] of Object.entries(directPhrases)) {
    const [feature, action] = intentKey.split('_');
    if (phrases.some(phrase => lowerCaseMsg.includes(phrase))) {
      return {
        feature,
        action,
        confidence: 0.9,
        extractedParams: extractParameters(lowerCaseMsg, feature)
      };
    }
  }
  
  // Analyze message for feature and action keywords
  let bestMatch: CommandIntent | null = null;
  let highestScore = 0;
  
  // Scan for feature + action combinations
  for (const [feature, featureTerms] of Object.entries(featureKeywords)) {
    for (const [action, actionTerms] of Object.entries(actionKeywords)) {
      // Calculate how many terms from each category are present
      const featureMatches = featureTerms.filter(term => lowerCaseMsg.includes(term)).length;
      const actionMatches = actionTerms.filter(term => lowerCaseMsg.includes(term)).length;
      
      if (featureMatches > 0 && actionMatches > 0) {
        // Calculate a confidence score based on matches
        const featureScore = featureMatches / featureTerms.length;
        const actionScore = actionMatches / actionTerms.length;
        const combinedScore = (featureScore * 0.6) + (actionScore * 0.4); // Feature slightly more important
        
        if (combinedScore > highestScore) {
          highestScore = combinedScore;
          bestMatch = {
            feature,
            action,
            confidence: combinedScore,
            extractedParams: extractParameters(lowerCaseMsg, feature)
          };
        }
      }
    }
  }
  
  // If we have a reasonable match, return it
  if (bestMatch && bestMatch.confidence > 0.3) {
    return bestMatch;
  }
  
  // Check for feature mentions even without clear actions
  for (const [feature, featureTerms] of Object.entries(featureKeywords)) {
    const featureMatches = featureTerms.filter(term => lowerCaseMsg.includes(term)).length;
    if (featureMatches > 1) { // Need at least 2 terms for confidence
      const featureScore = featureMatches / featureTerms.length;
      if (featureScore > 0.4) { // Need reasonable confidence
        return {
          feature,
          action: 'view', // Default to view as safest action
          confidence: featureScore * 0.7, // Reduce confidence as guessing the action
          extractedParams: extractParameters(lowerCaseMsg, feature)
        };
      }
    }
  }
  
  return null;
}

/**
 * Extract relevant parameters from the user message based on the feature
 */
function extractParameters(message: string, feature: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Extract dates if present
  const datePatterns = [
    /today/i,
    /tomorrow/i,
    /yesterday/i,
    /next week/i,
    /this week/i,
    /last week/i,
    /next month/i,
    /this month/i,
    /last month/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}/i,
    /\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i,
    /\d{1,2}\/\d{1,2}(\/\d{2,4})?/i,
    /\d{4}-\d{2}-\d{2}/i
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      params.date = match[0];
      break;
    }
  }
  
  // Extract amounts for trades/quotes
  if (feature === 'trades' || feature === 'quotes') {
    const amountPatterns = [
      /£\s*\d+(\.\d+)?\s*(million|m|k|thousand)?/i,
      /\d+(\.\d+)?\s*(million|m|k|thousand)?\s*pounds/i,
      /\d+(\.\d+)?\s*(million|m|k|thousand)?(\s*£|\s*gbp)/i
    ];
    
    for (const pattern of amountPatterns) {
      const match = message.match(pattern);
      if (match) {
        params.amount = match[0];
        break;
      }
    }
    
    // Extract rate percentages
    const ratePatterns = [
      /(\d+(\.\d+)?)\s*%/i,
      /(\d+(\.\d+)?)\s*percent/i,
      /rate\s*of\s*(\d+(\.\d+)?)/i
    ];
    
    for (const pattern of ratePatterns) {
      const match = message.match(pattern);
      if (match) {
        params.rate = match[0];
        break;
      }
    }
    
    // Extract duration/tenor
    const durationPatterns = [
      /(\d+)\s*(day|week|month|year)s?/i,
      /(overnight|on|tom next|spot|1w|2w|1m|2m|3m|6m|1y)/i
    ];
    
    for (const pattern of durationPatterns) {
      const match = message.match(pattern);
      if (match) {
        params.duration = match[0];
        break;
      }
    }
  }
  
  return params;
}

/**
 * Check if a message is asking about calendar events
 */
function isAskingAboutCalendar(message: string): boolean {
  const intent = identifyCommandIntent(message);
  return intent?.feature === 'calendar';
}

/**
 * Check if a message is asking about documents
 */
function isAskingAboutDocuments(message: string): boolean {
  const intent = identifyCommandIntent(message);
  return intent?.feature === 'documents';
}

/**
 * Check if a message is asking about forecasting or trends
 */
function isAskingAboutForecasting(message: string): boolean {
  const intent = identifyCommandIntent(message);
  return intent?.feature === 'forecasting';
}

/**
 * Check if a message is about trades
 */
function isAskingAboutTrades(message: string): boolean {
  const intent = identifyCommandIntent(message);
  return intent?.feature === 'trades';
}

/**
 * Check if a message is about quotes
 */
function isAskingAboutQuotes(message: string): boolean {
  const intent = identifyCommandIntent(message);
  return intent?.feature === 'quotes';
}

/**
 * Generate a response to a user's chat message in the context of UK local council money markets
 */
export async function generateChatResponse(message: string): Promise<string> {
  try {
    // Identify the intent of the message
    const intent = identifyCommandIntent(message);
    console.log("Identified intent:", intent);
    
    // If we have a valid intent, process it as a feature request
    if (intent && intent.confidence > 0.4) {
      const { feature, action, extractedParams } = intent;
      
      // Handle calendar requests
      if (feature === 'calendar') {
        console.log("User is asking about calendar events");
        return JSON.stringify({
          isFeatureRequest: true,
          feature: "calendar",
          action: action || "view",
          params: extractedParams,
          message: "Here's the financial calendar you requested. You can see all upcoming events, filter by category, or add new events."
        });
      }
      
      // Handle document requests
      if (feature === 'documents') {
        console.log("User is asking about documents");
        return JSON.stringify({
          isFeatureRequest: true,
          feature: "documents",
          action: action || "view",
          params: extractedParams,
          message: "Here are the council documents available. You can filter by type, search by keywords, or share documents with other councils."
        });
      }
      
      // Handle forecasting requests
      if (feature === 'forecasting') {
        console.log("User is asking about forecasting or trends");
        return JSON.stringify({
          isFeatureRequest: true,
          feature: "forecasting",
          action: action || "view",
          params: extractedParams,
          message: "Here are the forecasting tools you requested. You can view interest rate trends, create cash flow projections, or analyze financial scenarios."
        });
      }
      
      // Handle trade requests
      if (feature === 'trades') {
        console.log("User is asking about trades");
        const responseMessage = action === 'create' 
          ? "I'll help you set up a new trade. Please confirm the details below or make any needed adjustments."
          : "Here are the trades you requested. You can filter by status, counterparty, or date range.";
          
        return JSON.stringify({
          isFeatureRequest: true,
          feature: "trades",
          action: action || "view",
          params: extractedParams,
          message: responseMessage
        });
      }
      
      // Handle quote requests
      if (feature === 'quotes') {
        console.log("User is asking about quotes");
        const responseMessage = action === 'create' 
          ? "I'll help you request quotes from other councils. Please confirm the details below or make any needed adjustments."
          : "Here are the current quotes available. You can filter by rate, duration, or amount.";
          
        return JSON.stringify({
          isFeatureRequest: true,
          feature: "quotes",
          action: action || "view",
          params: extractedParams,
          message: responseMessage
        });
      }
    }
    
    // If in development mode and no API key is available, return sample response
    if (isDevMode) {
      console.log("Using development mode response for chat");
      return DEV_MODE_RESPONSES.chat;
    }

    let messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: message }
    ];
    
    // If the message is asking about Bank of England rates, try to fetch them
    if (isAskingAboutBankRate(message)) {
      console.log("User is asking about Bank of England rates, fetching current data...");
      const bankRateInfo = await fetchBankOfEnglandRate();
      
      if (bankRateInfo) {
        console.log("Successfully fetched Bank of England rate data");
        // Get analysis of the rate information for councils
        const rateAnalysis = await analyzeInterestRatesForCouncils(bankRateInfo);
        
        // Insert the fetched information and analysis as context
        messages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "user" as const, content: `Here is the current Bank of England rate information: ${bankRateInfo}` },
          { role: "user" as const, content: `Here is an analysis of the implications for local councils: ${rateAnalysis}` },
          { role: "user" as const, content: message }
        ];
      } else {
        console.log("Failed to fetch Bank of England rate data");
        // If we couldn't fetch the rate, add a note about it
        messages = [
          { role: "system" as const, content: SYSTEM_PROMPT },
          { role: "user" as const, content: "Note: I was unable to fetch the current Bank of England rate information. Please advise based on general principles and historical context." },
          { role: "user" as const, content: message }
        ];
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
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
