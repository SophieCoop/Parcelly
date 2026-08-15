/**
 * Connects a Gmail account with a revocable, read-only token.
 *
 *   npm run login     # grant access
 *   npm run logout    # revoke it and delete the local copy
 *
 * Setup, once, at https://console.cloud.google.com:
 *   1. Create a project (any name).
 *   2. APIs & Services → Library → enable "Gmail API".
 *   3. APIs & Services → OAuth consent screen → External → add yourself
 *      under "Test users".
 *   4. Credentials → Create credentials → OAuth client ID → Desktop app.
 *   5. Copy the client ID and client secret; this script asks for them once.
 */
import { authorize, forgetStore, loadStore, revoke, TOKEN_PATH } from './lib/google.mjs';
import { createPrompter } from './lib/prompt.mjs';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const OFF = '\x1b[0m';

if (process.argv.includes('--revoke') || process.argv.includes('--logout')) {
  const store = loadStore();
  if (!store) {
    console.log('No Gmail account is connected.');
    process.exit(0);
  }
  try {
    await revoke(store);
    console.log('Access revoked with Google.');
  } catch (error) {
    console.log(`Could not reach Google to revoke (${error.message}).`);
    console.log('Revoke manually at https://myaccount.google.com/permissions');
  }
  forgetStore();
  console.log('Local token deleted.');
  process.exit(0);
}

const existing = loadStore();
if (existing && !process.argv.includes('--force')) {
  console.log(
    `A Gmail account is already connected ${DIM}(${TOKEN_PATH})${OFF}\n` +
      'Run `npm run inbox` to use it, `npm run login -- --force` to reconnect, ' +
      'or `npm run logout` to revoke.',
  );
  process.exit(0);
}

console.log(
  `\n${BOLD}Connect Gmail${OFF}\n` +
    `${DIM}Parcelly will ask Google for read-only access to your mail.\n` +
    `The permission is revocable at any time — with \`npm run logout\`, or at\n` +
    `https://myaccount.google.com/permissions.\n\n` +
    `You need an OAuth client ID from console.cloud.google.com (see the README).${OFF}\n`,
);

const prompt = createPrompter();
try {
  const clientId = await prompt.ask('Client ID: ');
  const clientSecret = await prompt.ask('Client secret: ');
  if (!clientId || !clientSecret) {
    console.error('\nBoth values are required.');
    process.exit(1);
  }
  prompt.close();

  await authorize(clientId, clientSecret);
  console.log(`\n${BOLD}Connected.${OFF} Run \`npm run inbox\` to read your shipping mail.`);
  console.log(`${DIM}Token stored in ${TOKEN_PATH} (gitignored, owner-only).${OFF}`);
} catch (error) {
  console.error(`\n${error.message}`);
  process.exit(1);
} finally {
  prompt.close();
}
