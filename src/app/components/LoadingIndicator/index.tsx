import { useI18n } from '@/hooks/useI18n';
import styles from './LoadingIndicator.module.css';

export const LoadingIndicator = () => {
  const { getText } = useI18n();

  return (
    <div className={styles.loadingIndicator}>
      <div className={styles.spinner} />
      <span>{getText('message.thinking')}</span>
    </div>
  );
};
