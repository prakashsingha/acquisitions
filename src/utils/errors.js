/**
 * Detects duplicate-email conflicts from our service or from Postgres (e.g. unique constraint / race).
 */
export function isEmailAlreadyExistsError(error) {
  let current = error;
  let depth = 0;

  while (current && depth < 12) {
    if (current.message === 'EMAIL_ALREADY_EXISTS') {
      return true;
    }

    const code = current.code;
    if (code === '23505') {
      const text = `${current.message ?? ''} ${current.detail ?? ''} ${current.constraint ?? ''}`;
      if (/email/i.test(text)) {
        return true;
      }
    }

    const msg = String(current.message ?? '');
    if (/duplicate key|unique constraint/i.test(msg) && /email/i.test(msg)) {
      return true;
    }

    current = current.cause;
    depth++;
  }

  return false;
}
