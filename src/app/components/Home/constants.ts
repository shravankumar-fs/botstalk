import { generateBotPrompt, getBotById, getInitialMessage as getInitialMessageHelper, type BotConfig } from '@/config/botConfig';

export const DEFAULT_TURNS = 5;
export const MAX_TURNS = 20;
export const MIN_TURNS = 1;

export const getBotPrompt = (bot: BotConfig, topic: string) => 
  generateBotPrompt(bot, topic);

export const getBotPromptById = (botId: string, topic: string) => {
  const bot = getBotById(botId);
  if (!bot) throw new Error(`Bot with id ${botId} not found`);
  return generateBotPrompt(bot, topic);
};

export { getInitialMessageHelper as getInitialMessage };

export const MESSAGE_THEMES = {
  default: {
    label: 'User',
    bgColor: '#f3f4f6',
    textColor: '#111827',
  },
  A: {
    bgColor: '#e3f2fd',
    textColor: '#1565c0',
    label: 'A',
  },
  B: {
    bgColor: '#e8f5e9',
    textColor: '#2e7d32',
    label: 'B',
  },
} as const;
