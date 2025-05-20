import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { chatApi } from '@/lib/api-client';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  botId?: string;
}

export interface SendMessageResponse {
  content: string;
  model: string;
  done: boolean;
}

export interface SendMessageParams {
  messages: ChatMessage[];
  botId: string;
}

export const useSendMessage = (
  configs?: UseMutationOptions<SendMessageResponse, Error, SendMessageParams>
) => {
  return useMutation<SendMessageResponse, Error, SendMessageParams>({
    mutationFn: async ({ messages, botId }) => {
      // Add bot ID to each message for tracking
      const messagesWithBotId = messages.map(msg => ({
        ...msg,
        botId: msg.role === 'assistant' ? botId : msg.botId,
      }));
      
      return chatApi.sendMessage(messagesWithBotId);
    },
    ...configs,
  });
};
