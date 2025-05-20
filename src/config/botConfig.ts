import botConfig from './bots.json';

export interface BotBehavior {
  [key: string]: number | undefined;
}

export interface BotInstructions {
  basePrompt: string;
  behaviorDescription: string;
  traits: string[];
}

export interface BotConfig {
  id: string;
  name: string;
  avatar: string;
  instructions: BotInstructions;
  behaviors: BotBehavior;
}

// Type guard to validate bot config
const isBotConfig = (config: any): config is BotConfig => {
  return (
    typeof config?.id === 'string' &&
    typeof config?.name === 'string' &&
    typeof config?.avatar === 'string' &&
    typeof config?.instructions?.basePrompt === 'string' &&
    typeof config?.instructions?.behaviorDescription === 'string' &&
    Array.isArray(config?.instructions?.traits) &&
    typeof config?.behaviors === 'object'
  );
};

// Validate the config file
const validateBotsConfig = (config: unknown): config is BotConfig[] => {
  if (!Array.isArray(config)) {
    console.error('Bots config is not an array');
    return false;
  }

  const invalidBots = config.filter((bot) => !isBotConfig(bot));
  if (invalidBots.length > 0) {
    console.error('Invalid bot configurations found:', invalidBots);
    return false;
  }

  return true;
};

if (!validateBotsConfig(botConfig)) {
  console.error('Invalid bots configuration');
  throw new Error('Invalid bots configuration. Check console for details.');
}

/**
 * Generate a prompt for a bot based on the topic and its configuration
 */
export function generateBotPrompt(bot: BotConfig, topic: string): string {
  const { basePrompt, behaviorDescription, traits } = bot.instructions;
  const behavior = bot.behaviors;

  // Create a string of behavior traits for the prompt
  const behaviorTraits = Object.entries(behavior)
    .map(([trait, score]) => `${trait}: ${score}`)
    .join(' | ');

  return `
    ${basePrompt.replace('{{topic}}', topic)}
    
    Important rules:
    - NEVER use roleplay or narration (no *actions* or "I think that...")
    - NEVER explain your reasoning or thought process
    - ALWAYS respond as if posting a tweet reply
    - Use casual internet language, emojis, and abbreviations
    - Keep it under 60 characters
    - Be direct and to the point
    - No pleasantries or sign-offs
    
    Your style:
    ${behaviorDescription}
    
    Key traits:
    ${traits.map((trait) => `- ${trait}`).join('\n')}
    
    Behavior traits (0-1):
    ${behaviorTraits}
  `;
}

/**
 * Get the initial message to start a conversation
 */
export function getInitialMessage(topic: string): string {
  return `Let's discuss ${topic}. What are your thoughts?`;
}

/**
 * Find a bot by its ID
 */
export function getBotById(id: string): BotConfig | undefined {
  return botConfig.find((bot) => bot.id === id);
}

/**
 * Get a random selection of bots
 * @param count Number of bots to return (default: 2)
 */
export function getRandomBots(count = 2): BotConfig[] {
  if (count >= botConfig.length) {
    return [...botConfig];
  }

  const shuffled = [...botConfig].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get all available bots
 */
export const allBots: BotConfig[] = botConfig;

export default botConfig;
