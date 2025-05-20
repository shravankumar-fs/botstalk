import { useI18n } from '@/hooks/useI18n';
import { MAX_TURNS, MIN_TURNS } from '../Home/constants';
import styles from './Controls.module.css';

interface ControlsProps {
  isPending: boolean;
  isActive: boolean;
  turns: number;
  onStart: () => void;
  onStop: () => void;
  onTurnsChange: (turns: number) => void;
}

export const Controls = ({
  isPending,
  isActive,
  turns,
  onStart,
  onStop,
  onTurnsChange,
}: ControlsProps) => {
  const { getText } = useI18n();
  const handleTurnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || MIN_TURNS;
    onTurnsChange(Math.min(Math.max(value, MIN_TURNS), MAX_TURNS));
  };

  return (
    <>
      <div className={styles.controls}>
        <button
          onClick={isActive ? onStop : onStart}
          disabled={isPending}
          className={`${styles.button} ${styles.buttonPrimary} ${
            isActive ? styles.buttonStop : ''
          }`}
        >
          {isActive ? 'Stop Conversation' : 'Start Conversation'}
        </button>
      </div>

      <div className={styles.controls}>
        <label>
          <span>{getText('home.turns')}</span>
          <input
            type='number'
            min={MIN_TURNS}
            max={MAX_TURNS}
            value={turns}
            onChange={handleTurnsChange}
            disabled={isActive}
            className={styles.turnsInput}
          />
        </label>
      </div>
    </>
  );
};
