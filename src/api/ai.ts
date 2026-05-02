import apiClient from './client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MovieRecommendation {
  id?: number;
  title?: string;
  name?: string;
  poster_path?: string;
  vote_average?: number;
  overview?: string;
  reason?: string;
}

export interface ChatResponse {
  response?: string;
  recommendations?: MovieRecommendation[];
  conversationId?: string;
}

export interface Conversation {
  id?: string;
  title?: string;
  messages?: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
}

export const aiApi = {
  chat: async (message: string, history?: ChatMessage[], conversationId?: string, imageBase64?: string): Promise<ChatResponse> => {
    try {
      const response = await apiClient.post<ChatResponse>('ai/chat', {
        message,
        history: history ?? [],
        conversationId,
        imageBase64: imageBase64 ?? null,
      }, {
        timeout: 60000,
      });
      return response?.data ?? { response: '' };
    } catch (error) {
      throw error;
    }
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    try {
      const response = await apiClient.get<Conversation>(`ai/conversations/${conversationId}`);
      return response?.data ?? { messages: [] };
    } catch (error) {
      console.error('Get conversation error:', error);
      throw error;
    }
  },

  getRecommendations: async (limit: number = 10): Promise<MovieRecommendation[]> => {
    try {
      const response = await apiClient.get<{ recommendations?: MovieRecommendation[] }>('ai/recommendations', {
        params: { limit },
      });
      return response?.data?.recommendations ?? [];
    } catch (error) {
      console.error('AI recommendations error:', error);
      throw new Error(error?.response?.data?.message ?? 'Öneriler alınamadı');
    }
  },
};
