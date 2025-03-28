// WebSocket client service for real-time notifications

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting: boolean = false;

  // Initialize the WebSocket connection
  public connect(): void {
    if (this.socket || this.isConnecting) return;
    
    this.isConnecting = true;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket server at:', wsUrl);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.onOpen.bind(this);
      this.socket.onmessage = this.onMessage.bind(this);
      this.socket.onclose = this.onClose.bind(this);
      this.socket.onerror = this.onError.bind(this);
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Disconnect from the WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Add a listener for a specific notification type
  public addListener(type: string, callback: (data: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)?.add(callback);
  }

  // Remove a listener for a specific notification type
  public removeListener(type: string, callback: (data: any) => void): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(callback);
      if (typeListeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  // Send a message to the WebSocket server
  public send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, message not sent');
    }
  }

  // Check if the WebSocket is connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // WebSocket event handlers
  private onOpen(): void {
    console.log('WebSocket connection established');
    this.isConnecting = false;
  }

  private onMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);
      
      // Handle different message types
      if (message.type === 'notification' && message.data) {
        // Notify listeners for the specific notification type
        const notificationType = message.data.type;
        const typeListeners = this.listeners.get(notificationType);
        
        if (typeListeners) {
          typeListeners.forEach(callback => {
            try {
              callback(message.data);
            } catch (error) {
              console.error('Error in notification listener callback:', error);
            }
          });
        }
        
        // Also notify general notification listeners
        const allNotificationListeners = this.listeners.get('all_notifications');
        if (allNotificationListeners) {
          allNotificationListeners.forEach(callback => {
            try {
              callback(message.data);
            } catch (error) {
              console.error('Error in general notification listener callback:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  private onClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.isConnecting = false;
    this.scheduleReconnect();
  }

  private onError(error: Event): void {
    console.error('WebSocket error:', error);
    this.isConnecting = false;
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, 5000); // Reconnect after 5 seconds
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();

// Automatically connect when the module is imported
if (typeof window !== 'undefined') {
  // Only connect in browser environment, not during SSR
  websocketService.connect();
}