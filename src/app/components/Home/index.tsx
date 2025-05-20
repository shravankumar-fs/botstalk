import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSendMessage } from '@/hooks/useChatApi';
import { Message } from '../Message';
import { Controls } from '../Controls';
import { EmptyState } from '../EmptyState';
import { LoadingIndicator } from '../LoadingIndicator';
import { useI18n } from '@/hooks/useI18n';
import { getRandomBots, type BotConfig } from '@/config/botConfig';
import { DEFAULT_TURNS, getBotPrompt, getInitialMessage } from './constants';
import { ConversationState } from './types';

// Utility function to clean up bot responses
const cleanBotResponse = (text: string): string => {
  if (!text) return '';
  // Remove quotes and hashtags
  return text
    .replace(/["']/g, '') // Remove all quotes
    .replace(/#\w+\s?/g, '') // Remove hashtags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};
import styles from './Home.module.css';

const Home = () => {
  const { getText } = useI18n();
  const [turns, setTurns] = useState<number>(DEFAULT_TURNS);
  const [botCount, setBotCount] = useState<number>(2); // Default to 2 bots
  const [topic, setTopic] = useState('artificial intelligence');
  const [conversationActive, setConversationActive] = useState(false);
  const topicInputRef = useRef<HTMLInputElement>(null);
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [conversationState, setConversationState] = useState<
    ConversationState & { isProcessing: boolean; lastMessageTime?: number }
  >({
    history: [],
    currentTurn: 0,
    maxTurns: 10,
    currentBotIndex: 0,
    isProcessing: false,
    lastMessageTime: 0,
  });

  // Derive messages from conversation state
  const messages = useMemo(() => {
    return conversationState.history.map((msg) => {
      const bot = bots.find((b) => b.id === msg.botId);
      return {
        speaker: bot?.name || 'assistant',
        text: msg.content,
        botId: msg.botId,
        avatar: bot?.avatar || '',
      };
    });
  }, [conversationState.history, bots]);

  // Get new random bots
  const handleNewBots = useCallback((count: number) => {
    setBots(getRandomBots(count));
  }, []);

  // Handle bot count changes
  const handleBotCountChange = useCallback(
    (count: number) => {
      const newCount = Math.max(2, Math.min(4, count)); // Limit between 2 and 4 bots
      setBotCount(newCount);
      handleNewBots(newCount);
    },
    [handleNewBots]
  );

  // Initialize with random bots
  useEffect(() => {
    handleNewBots(botCount);
  }, [handleNewBots, botCount]);

  const { mutate: sendMessage } = useSendMessage({
    onSuccess: (response, { botId, lastSpeaker }) => {
      setConversationState((prevState) => {
        const { history, currentTurn, maxTurns, currentBotIndex } = prevState;
        const currentBot = bots.find((bot) => bot.id === botId);
        if (!currentBot) return prevState;

        // Extract content from the response object
        let responseContent = typeof response === 'string' ? response : response.content;
        
        // Clean up the response
        responseContent = cleanBotResponse(responseContent);
        
        // Format the response to include @mentions
        let formattedContent = responseContent;
        if (lastSpeaker && lastSpeaker !== 'Everyone') {
          // If the response doesn't already mention someone, add the mention
          if (!formattedContent.startsWith('@')) {
            formattedContent = `@${lastSpeaker} ${formattedContent}`;
          }
        }

        const newHistory = [
          ...history,
          { 
            role: 'assistant', 
            content: formattedContent, 
            botId,
            timestamp: Date.now()
          },
        ];
        const isConversationOver = currentTurn >= maxTurns - 1;

        if (isConversationOver) {
          setConversationActive(false);
          return {
            ...prevState,
            history: newHistory,
            isProcessing: false,
            lastMessageTime: Date.now(),
          };
        }

        // Move to next bot
        const nextBotIndex = (currentBotIndex + 1) % bots.length;
        const nextTurn = nextBotIndex === 0 ? currentTurn + 1 : currentTurn;

        return {
          ...prevState,
          history: newHistory,
          currentTurn: nextTurn,
          currentBotIndex: nextBotIndex,
          isProcessing: false,
          lastMessageTime: Date.now(),
        };
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setConversationState((prev) => ({
        ...prev,
        isProcessing: false,
      }));
    },
  });

  // Process next bot's turn
  const processBotTurn = useCallback(() => {
    if (conversationState.isProcessing || !conversationActive) return;

    const { currentBotIndex, currentTurn, maxTurns, history } = conversationState;
    const currentBot = bots[currentBotIndex];

    if (!currentBot || currentTurn >= maxTurns) {
      setConversationActive(false);
      return;
    }

    // Check if bot should skip their turn
    const shouldSkip = Math.random() < (currentBot.skipQuotient || 0);

    if (shouldSkip) {
      // Move to next bot
      const nextBotIndex = (currentBotIndex + 1) % bots.length;
      const nextTurn = nextBotIndex === 0 ? currentTurn + 1 : currentTurn;

      setConversationState((prev) => ({
        ...prev,
        currentBotIndex: nextBotIndex,
        currentTurn: nextTurn,
        lastMessageTime: Date.now(),
      }));
      return;
    }

    // Get the last message that wasn't from the current bot
    const lastMessage = [...history].reverse().find(msg => msg.botId !== currentBot.id);
    const lastSpeaker = lastMessage ? bots.find(b => b.id === lastMessage?.botId)?.name : 'Everyone';
    
    // For fact checker, always include the last message if it's not their own
    let contextMessages = [...history].slice(-5); // Keep last 5 messages for context
    
    // If this is the fact checker, make sure we have the message to fact check
    if (currentBot.id === 'factchecker' && lastMessage) {
      contextMessages = [lastMessage];
    }
    
    // Add the last speaker's name to the context
    const contextWithSpeaker = {
      lastSpeaker,
      messages: contextMessages
    };

    setConversationState((prev) => ({
      ...prev,
      isProcessing: true,
    }));

    // Prepare the prompt with context
    let prompt = getBotPrompt(currentBot, topic);
    
    // Add context about the last speaker
    if (lastSpeaker) {
      prompt += `\n\nYou are replying to @${lastSpeaker}'s message.`;
      
      // If this is the fact checker, add specific instructions
      if (currentBot.id === 'factchecker' && lastMessage) {
        const lastSpeakerBot = bots.find(b => b.id === lastMessage.botId);
        prompt += `\n\nFact check this message from @${lastSpeaker}: "${lastMessage.content}"`;
        if (lastSpeakerBot?.instructions) {
          prompt += `\n\nAbout @${lastSpeaker}: ${lastSpeakerBot.instructions.behaviorDescription}`;
        }
      }
    }
    
    sendMessage(
      {
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          ...contextMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            name: bots.find((b) => b.id === msg.botId)?.name,
          })),
        ],
        botId: currentBot.id,
        lastSpeaker: lastSpeaker || 'Everyone',
      },
      {
        onSuccess: (response) => {
          // Response is handled in the onSuccess callback
        },
      }
    );
  }, [bots, conversationState, conversationActive, topic, sendMessage]);

  // Process next bot's turn when conversation is active
  useEffect(() => {
    if (!conversationActive || conversationState.isProcessing) return;

    const timeSinceLastMessage = Date.now() - conversationState.lastMessageTime;
    const delay = Math.max(0, 2000 - timeSinceLastMessage); // At least 2 seconds between messages

    const timer = setTimeout(() => {
      processBotTurn();
    }, delay);

    return () => clearTimeout(timer);
  }, [conversationActive, conversationState, processBotTurn]);

  // Start a new conversation
  const startConversation = useCallback(
    (turnsCount: number) => {
      if (conversationActive) return;

      if (bots.length < 2) {
        alert('Please select at least 2 bots');
        return;
      }

      setConversationActive(true);

      const initialMessage = getInitialMessage(topic);

      // Set initial state with system message
      setConversationState({
        history: [
          {
            role: 'system',
            content: initialMessage,
            botId: 'system',
          },
        ],
        currentTurn: 0,
        maxTurns: turnsCount,
        currentBotIndex: 0,
        isProcessing: false,
        lastMessageTime: Date.now(),
      });
    },
    [topic, bots, conversationActive]
  );

  const handleStopConversation = useCallback(() => {
    setConversationActive(false);
    setConversationState((prev) => ({
      ...prev,
      history: [],
      currentTurn: 0,
    }));
  }, []);

  const handleTurnsChange = useCallback((newTurns: number) => {
    setTurns(Math.max(1, Math.min(10, newTurns))); // Limit turns between 1 and 10
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{getText('home.title')}</h1>
      </div>

      <div className={styles.controlsContainer}>
        <div className={styles.topicInputContainer}>
          <input
            ref={topicInputRef}
            type='text'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='Enter a topic to discuss'
            disabled={conversationActive}
            className={styles.topicInput}
          />
        </div>
        <div className={styles.botSelection}>
          {bots.map((bot) => (
            <div key={bot.id} className={styles.botBadge}>
              <span className={styles.botAvatar}>{bot.avatar}</span>
              <span>{bot.name}</span>
            </div>
          ))}
          <button
            onClick={() => handleNewBots(botCount)}
            className={styles.newBotsButton}
            disabled={conversationActive}
          >
            🔄 New Bots
          </button>
        </div>
        <Controls
          isPending={conversationState.isProcessing}
          isActive={conversationActive}
          turns={turns}
          botCount={botCount}
          onStart={() => startConversation(turns)}
          onStop={handleStopConversation}
          onTurnsChange={handleTurnsChange}
          onBotCountChange={handleBotCountChange}
        />
      </div>

      {conversationState.isProcessing && <LoadingIndicator />}

      <div className={styles.conversationContainer}>
        {messages.length > 0 ? (
          <div className={styles.messages}>
            {messages.map((message, index) => {
              const bot = bots.find((b) => b.id === message.botId);
              return (
                <div
                  key={`${message.botId}-${index}`}
                  className={styles.messageContainer}
                >
                  <Message
                    message={{
                      speaker: message.speaker,
                      text: message.text,
                      botId: message.botId,
                      avatar: message.avatar,
                    }}
                    bot={bot}
                  />
                </div>
              );
            })}
            {conversationState.isProcessing && (
              <div className={styles.messageContainer}>
                <Message
                  message={{
                    speaker: 'assistant',
                    text: '...',
                    botId: bots[conversationState.currentBotIndex]?.id,
                    avatar: bots[conversationState.currentBotIndex]?.avatar,
                  }}
                  bot={bots[conversationState.currentTurn % bots.length]}
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default Home;
