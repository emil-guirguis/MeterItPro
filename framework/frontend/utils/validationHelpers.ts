export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCronExpression = (cron: string): boolean => {
  if (!cron || typeof cron !== 'string') return false;

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minute, hour, day, month, dayOfWeek] = parts;

  const isValidCronField = (field: string, min: number, max: number): boolean => {
    if (field === '*') return true;
    if (field.includes('-')) {
      const [start, end] = field.split('-');
      const s = parseInt(start, 10), e = parseInt(end, 10);
      return !isNaN(s) && !isNaN(e) && s >= min && e <= max && s <= e;
    }
    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const stepNum = parseInt(step, 10);
      if (isNaN(stepNum) || stepNum <= 0) return false;
      if (base === '*') return true;
      const baseNum = parseInt(base, 10);
      return !isNaN(baseNum) && baseNum >= min && baseNum <= max;
    }
    if (field.includes(',')) {
      return field.split(',').every((f) => {
        const num = parseInt(f, 10);
        return !isNaN(num) && num >= min && num <= max;
      });
    }
    const num = parseInt(field, 10);
    return !isNaN(num) && num >= min && num <= max;
  };

  return (
    isValidCronField(minute, 0, 59) &&
    isValidCronField(hour, 0, 23) &&
    isValidCronField(day, 1, 31) &&
    isValidCronField(month, 1, 12) &&
    isValidCronField(dayOfWeek, 0, 6)
  );
};

export const validateReportName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 255;
};

export const validateEmailList = (emails: string[]): boolean => {
  if (!Array.isArray(emails) || emails.length === 0) return false;
  return emails.every((email) => validateEmail(email));
};
