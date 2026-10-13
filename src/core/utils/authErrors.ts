const messages: Record<string, string> = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account was found for this email.',
  'auth/wrong-password': 'The email or password is incorrect.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/email-already-in-use': 'An account already exists with this email. Try logging in instead.',
  'auth/user-already-exists': 'An account already exists with this email. Try logging in instead.',
  'email-already-in-use': 'An account already exists with this email. Try logging in instead.',
  'user-already-exists': 'An account already exists with this email. Try logging in instead.',
  'auth/weak-password': 'Password must be at least 6 characters long.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'Email and password sign-in is not enabled yet.',
};

export const getAuthErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;

    if (typeof code === 'string' && messages[code]) {
      return messages[code];
    }
  }

  return 'Something went wrong. Please try again.';
};

export const authErrors = {
  getMessage: getAuthErrorMessage,
};
