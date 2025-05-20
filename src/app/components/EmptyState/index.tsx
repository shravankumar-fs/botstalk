import { useI18n } from '@/hooks/useI18n';
import styles from './EmptyState.module.css';

export const EmptyState = () => {
  const { getText } = useI18n();

  return (
    <div className={styles.emptyState}>
      <h3 className={styles.emptyStateTitle}>
        {getText('home.emptyState.title')}
      </h3>
      <p className={styles.emptyStateDescription}>
        {getText('home.emptyState.description')}
      </p>
    </div>
  );
};
