import { useState, useCallback, useRef, useEffect } from 'react';
import { useSendMessage } from '@/hooks/useChatApi';
import { Message } from '../Message';
import { Controls } from '../Controls';
import { EmptyState } from '../EmptyState';
import { LoadingIndicator } from '../LoadingIndicator';
import { useI18n } from '@/hooks/useI18n';
import { getRandomBots, type BotConfig } from '@/config/botConfig';
import { DEFAULT_TURNS, getBotPrompt, getInitialMessage } from './constants';
import { ChatMsg, ConversationState } from './types';
import styles from './Home.module.css';

const Home = () => {
  const { getText } = useI18n();
  const [messages, setMessages] = useState<
    Array<{
      speaker: string;
      text: string;
      botId: string;
      avatar: string;
    }>
  >([]);

  const [turns, setTurns] = useState<number>(DEFAULT_TURNS);
  const [topic, setTopic] = useState('artificial intelligence');
  const [conversationActive, setConversationActive] = useState(false);
  const topicInputRef = useRef<HTMLInputElement>(null);
  const [bots, setBots] = useState<BotConfig[]>([]);

  // Initialize with 2 random bots
  // Get new random bots
  const handleNewBots = useCallback(() => {
    setBots(getRandomBots(2));
  }, []);

  // Initialize with 2 random bots
  useEffect(() => {
    handleNewBots();
  }, [handleNewBots]);

  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      history: [],
      currentTurn: 0,
      maxTurns: DEFAULT_TURNS,
    }
  );

  const { mutate: sendMessage, isPending } = useSendMessage({
    onSuccess: (response, { botId }) => {
      setConversationState((prevState) => {
        const { history, currentTurn, maxTurns } = prevState;
        const currentBot = bots[currentTurn % bots.length];
        const content = response.content;
        const isLastTurn = currentTurn >= maxTurns * bots.length - 1;

        // Update the message in a single batch with React's state update
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          // Only add new message if the last message is different
          if (
            !lastMessage ||
            lastMessage.text !== content ||
            lastMessage.botId !== currentBot.id
          ) {
            return [
              ...prev,
              {
                speaker: currentBot.name,
                text: content,
                botId: currentBot.id,
                avatar: currentBot.avatar,
              },
            ];
          }
          return prev;
        });

        // If we've reached the maximum number of turns, stop the conversation
        if (isLastTurn) {
          setConversationActive(false);
          return {
            ...prevState,
            history: [
              ...history,
              { role: 'assistant', content, botId: currentBot.id },
            ],
            currentTurn: currentTurn + 1,
          };
        }

        // Prepare the next message
        const nextBot = bots[(currentTurn + 1) % bots.length];
        const nextMessage = {
          role: 'user' as const,
          content: getInitialMessage(topic),
          botId: nextBot.id,
        };

        // Update the history for the next turn
        const updatedHistory = [
          ...history,
          { role: 'assistant' as const, content, botId: currentBot.id },
          nextMessage,
        ];

        // Send the next message automatically
        setTimeout(() => {
          sendMessage({
            messages: [
              { role: 'system', content: getBotPrompt(nextBot, topic) },
              ...updatedHistory,
            ],
            botId: nextBot.id,
          });
        }, 0);

        return {
          history: updatedHistory,
          currentTurn: currentTurn + 1,
          maxTurns,
        };
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setConversationActive(false);
    },
  });

  const handleSendMessage = useCallback(
    (history: ChatMsg[]) => {
      const currentBot = bots[conversationState.currentTurn % bots.length];
      const systemPrompt = getBotPrompt(currentBot, topic);

      const messages: ChatMsg[] = [
        { role: 'system', content: systemPrompt },
        ...history,
      ];

      sendMessage({ messages, botId: currentBot.id });
    },
    [sendMessage, topic, conversationState.currentTurn, bots]
  );

  const startConversation = useCallback(
    (turnsCount: number) => {
      if (!topic.trim()) {
        alert('Please enter a topic');
        return;
      }

      if (bots.length < 2) {
        alert('Please select at least 2 bots');
        return;
      }

      setConversationActive(true);
      setMessages([]);

      const firstBot = bots[0];
      const systemPrompt = getBotPrompt(firstBot, topic);
      const initialMessage = getInitialMessage(topic);

      const initialHistory: ChatMsg[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: initialMessage, botId: firstBot.id },
      ];

      const newState = {
        history: initialHistory,
        currentTurn: 0,
        maxTurns: turnsCount,
      };

      setConversationState(newState);

      // Send the first message
      sendMessage({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: initialMessage, botId: firstBot.id },
        ],
        botId: firstBot.id,
      });
    },
    [topic, bots, sendMessage]
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
            onClick={handleNewBots}
            className={styles.newBotsButton}
            disabled={conversationActive}
          >
            🔄 New Bots
          </button>
        </div>
        <Controls
          isPending={isPending}
          isActive={conversationActive}
          turns={turns}
          onStart={() => startConversation(turns)}
          onStop={handleStopConversation}
          onTurnsChange={handleTurnsChange}
        />
      </div>

      {isPending && <LoadingIndicator />}

      <div className={styles.conversationContainer}>
        {messages.length > 0 ? (
          <div className={styles.messages}>
            {messages.map((message, index) => {
              const bot = bots.find((b) => b.id === message.botId);
              return (
                <div key={`${message.botId}-${index}`} className={styles.messageContainer}>
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
            {isPending && (
              <div className={styles.messageContainer}>
                <Message
                  message={{
                    speaker: 'assistant',
                    text: '...',
                    botId: bots[conversationState.currentTurn % bots.length]?.id,
                    avatar: bots[conversationState.currentTurn % bots.length]?.avatar
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
