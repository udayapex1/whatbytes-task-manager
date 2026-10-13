const { readFileSync } = require('node:fs');

const requiredFirebaseVariables = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const missingVariables = requiredFirebaseVariables.filter((name) => {
  const value = process.env[name];
  return typeof value !== 'string' || value.trim().length === 0;
});

if (missingVariables.length > 0) {
  console.error(
    `Missing Firebase build configuration: ${missingVariables.join(', ')}. ` +
      'Set these variables in the EAS environment used by this build.',
  );
  process.exit(1);
}

console.log(
  `Firebase build configuration check passed (${requiredFirebaseVariables.length} variables present).`,
);

if (process.argv.includes('--compare-local')) {
  let localEnv;

  try {
    localEnv = readFileSync('.env', 'utf8');
  } catch {
    console.error('Cannot compare EAS values: local .env file was not found.');
    process.exit(1);
  }

  const localValues = new Map(
    localEnv.split(/\r?\n/).flatMap((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return [];

      const separator = trimmedLine.indexOf('=');
      if (separator < 0) return [];

      const name = trimmedLine.slice(0, separator).trim();
      let value = trimmedLine.slice(separator + 1).trim();
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1);
      }

      return [[name, value]];
    }),
  );

  const mismatchedVariables = requiredFirebaseVariables.filter(
    (name) => !localValues.has(name) || localValues.get(name) !== process.env[name],
  );

  if (mismatchedVariables.length > 0) {
    console.error(
      `EAS values do not match local .env for: ${mismatchedVariables.join(', ')}. Values were not printed.`,
    );
    process.exit(1);
  }

  console.log('All six EAS Firebase values match local .env; values were not printed.');
}
