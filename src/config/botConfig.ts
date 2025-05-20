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
  skipQuotient?: number; // 0-1, where 0 means never skip, 1 means always skip
}

// Type guard to validate bot config
const isBotConfig = (config: unknown): config is BotConfig => {
  const bot = config as BotConfig;
  return (
    typeof bot?.id === 'string' &&
    typeof bot?.name === 'string' &&
    typeof bot?.avatar === 'string' &&
    typeof bot?.instructions?.basePrompt === 'string' &&
    typeof bot?.instructions?.behaviorDescription === 'string' &&
    Array.isArray(bot?.instructions?.traits) &&
    typeof bot?.behaviors === 'object' &&
    (bot.skipQuotient === undefined || 
     (typeof bot.skipQuotient === 'number' && 
      bot.skipQuotient >= 0 && 
      bot.skipQuotient <= 1))
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

  // Special handling for fact checker
  if (bot.id === 'factchecker') {
    return `
      You are a fact checker in a discussion about ${topic}.
      
      Your task is to fact check the previous message and point out inaccuracies.
      
      Rules:
      - ALWAYS start with @[username] to address the previous speaker
      - Point out specific inaccuracies in the previous message
      - Provide correct information with sources if possible
      - Keep it under 80 characters
      - Be direct and factual
      - No pleasantries or sign-offs
      - Use emojis to emphasize points
      - If the message is accurate, say "@[username] is correct about [topic]"
      
      Your style:
      ${behaviorDescription}
      
      Key traits:
      ${traits.map((trait) => `- ${trait}`).join('\n')}
      
      Behavior traits (0-1):
      ${behaviorTraits}
    `;
  }

  // Default prompt for other bots
  return `
    ${basePrompt.replace('{{topic}}', topic)}
    
    Important rules:
    - ALWAYS start with @[username] to indicate who you're replying to
    - NEVER use quotes (") or hashtags (#) in your responses
    - NEVER use roleplay or narration (no *actions* or "I think that...")
    - NEVER explain your reasoning or thought process
    - ALWAYS respond to the most recent message
    - Use casual internet language, emojis, and abbreviations
    - Keep it under 60 characters
    - Be direct and to the point
    - No pleasantries or sign-offs
    - Keep your response concise and conversational
    - Reference specific points from the message you're replying to
    
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
 * Get a random selection of bots with unique personalities
 * @param count Number of bots to return (default: 2)
 */
export const getRandomBots = (count = 2): BotConfig[] => {
  const shuffled = [...allBots].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, allBots.length));
};

/**
 * Get all available bots
 */
export const allBots: BotConfig[] = botConfig;

export default botConfig;
