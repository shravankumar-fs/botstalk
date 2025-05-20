import axios from 'axios';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type SendMessageResponse = {
  content: string;
  model: string;
  done: boolean;
};

export const chatApi = {
  sendMessage: async (messages: ChatMessage[]): Promise<SendMessageResponse> => {
    const response = await axios.post<SendMessageResponse>('/api/ollamachat', { 
      messages 
    });
    
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    return response.data;
  },
};

export default {
  chatApi,
};
