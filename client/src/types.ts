export interface FeatureRequest {
  isFeatureRequest: true;
  feature: 'calendar' | 'documents' | 'forecasting' | 'trades' | 'quotes';
  action: 'view' | 'create' | 'update' | 'delete' | 'analyze' | 'execute';
  params?: Record<string, any>;
  message: string;
}

export interface Message {
  id: number;
  sessionId: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  loading?: boolean;
  featureRequest?: FeatureRequest; // Optional feature request info
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
