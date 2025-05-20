import { useI18n } from '@/hooks/useI18n';
import { MESSAGE_THEMES } from '../Home/constants';
import styles from './Message.module.css';
import type { BotConfig } from '@/config/botConfig';

interface MessageProps {
  message: {
    speaker: string;
    text: string;
    botId?: string;
    avatar?: string;
  };
  bot?: BotConfig;
}

export const Message = ({ message, bot }: MessageProps) => {
  const { getText } = useI18n();
  // Use bot-specific theme if available, otherwise default to speaker-based theme
  const theme = bot ? 
    { 
      bgColor: `hsl(${bot.id.length * 100 % 360}, 70%, 90%)`,
      textColor: '#333',
      label: bot.name
    } : 
    MESSAGE_THEMES[message.speaker as keyof typeof MESSAGE_THEMES] || MESSAGE_THEMES.default;

  return (
    <div
      className={styles.message}
      style={{
        '--message-bg': theme.bgColor,
        '--message-text': theme.textColor,
        alignSelf: message.speaker === 'A' ? 'flex-start' : 'flex-end',
      } as React.CSSProperties}
    >
      <div className={styles.messageHeader}>
        {bot?.avatar && <span className={styles.avatar}>{bot.avatar}</span>}
        {bot?.name || getText('bot.label', { id: theme.label })}
      </div>
      <div className={styles.messageText}>{message.text}</div>
    </div>
  );
};
