import { apiRequest } from "@/lib/queryClient";
import { ChatResponse, Message } from "@/types";

export const sendMessage = async (message: string, sessionId?: string): Promise<ChatResponse> => {
  try {
    const response = await apiRequest(
      "POST",
      "/api/chat",
      { message, sessionId }
    );

    return await response.json();
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

export const getRecentConversations = async (): Promise<any> => {
  try {
    const response = await fetch("/api/sessions", {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get recent conversations:", error);
    throw error;
  }
};

export const getCouncilInfo = async (): Promise<any> => {
  try {
    const response = await fetch("/api/council", {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get council info:", error);
    throw error;
  }
};

export const getSessionMessages = async (sessionId: string): Promise<Message[]> => {
  try {
    const response = await fetch(`/api/messages/${sessionId}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get session messages:", error);
    throw error;
  }
};

export const createNewSession = async (): Promise<{ sessionId: string }> => {
  try {
    const response = await apiRequest(
      "POST",
      "/api/sessions",
      {}
    );

    return await response.json();
  } catch (error) {
    console.error("Failed to create new session:", error);
    throw error;
  }
};
