/**
 * Render helper functions for list cells
 * Temporary helpers until full framework migration
 */

import styles from './renderHelpers.module.css';

const statusColorClasses: Record<string, string> = {
  active: styles.badgeActive,
  inactive: styles.badgeInactive,
  pending: styles.badgePending,
  draft: styles.badgeDraft,
};

export function renderTwoLineCell(primary: string, secondary: string) {
  return (
    <div>
      <div>{primary}</div>
      <div className={styles.secondaryText}>{secondary}</div>
    </div>
  );
}

export function renderStatusBadge(status: string) {
  const badgeClass = statusColorClasses[status] || styles.badgeDefault;
  
  return (
    <span className={`${styles.badge} ${badgeClass}`}>
      {status}
    </span>
  );
}

export function renderDateCell(date: string | Date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString();
}
