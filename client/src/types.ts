export interface Message {
  id: number;
  sessionId: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  loading?: boolean;
}

export interface Session {
  id: number;
  sessionId: string;
  title: string;
  timestamp: string;
}

export interface Council {
  id: number;
  name: string;
  councilId: string;
  financialYear: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
}

export interface Rate {
  name: string;
  value: string;
  lastUpdated: string;
  source: string;
}
