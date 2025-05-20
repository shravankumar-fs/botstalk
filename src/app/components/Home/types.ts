export type Role = 'user' | 'assistant' | 'system';

export interface Bot {
  id: string;
  avatar: string;
}

export interface Message {
  speaker: string;
  text: string;
  botId: string;
  avatar: string;
}

export interface ChatMsg {
  role: Role;
  content: string;
  bot?: Bot; // Only for assistant messages
  botId?: string; // Only for assistant messages
}

export interface ConversationState {
  history: ChatMsg[];
  currentTurn: number;
  maxTurns: number;
  currentBotIndex: number;
}

export interface SendMessageParams {
  messages: ChatMsg[];
  botId: string;
}
