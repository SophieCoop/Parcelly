/**
 * Runs the Parcelly message parser over real shipping emails, so you can see
 * what it gets right before any of it is wired to a database.
 *
 *   node scripts/check-inbox.mjs              # read the inbox over IMAP
 *   node scripts/check-inbox.mjs --days 60    # look further back
 *   node scripts/check-inbox.mjs --all        # every sender, not just shipping ones
 *   node scripts/check-inbox.mjs --show 3     # print the text handed to the parser
 *   node scripts/check-inbox.mjs --file a.eml # parse a saved .eml instead
 *
 * Nothing is stored and nothing is uploaded: it reads, parses in memory, prints
 * a table, and exits. Credentials come from .env (see .env.example).
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { build } from 'esbuild';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const ROOT = new URL('..', import.meta.url).pathname;

/* ---------------------------------------------------------------- options - */

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? fallback : (argv[index + 1] ?? true);
};

const OPTIONS = {
  days: Number(flag('days', 30)),
  all: argv.includes('--all'),
  show: Number(flag('show', 0)),
  file: flag('file', undefined),
  mailbox: flag('mailbox', 'INBOX'),
};

/** Senders worth reading. --all skips this filter. */
const SHIPPING_HINTS = [
  'shein', 'aliexpress', 'temu', 'amazon', 'iherb', 'zara', 'ebay', 'asos',
  'israelpost', 'post.co.il', 'hfd', 'cainiao', 'dhl', 'ups', 'fedex',
  'boxit', 'box-it', 'terminalx', 'next', 'shipping', 'delivery', 'order',
  'tracking', 'משלוח', 'חבילה', 'הזמנה', 'דואר',
];

/* ------------------------------------------------------------------- env -- */

const ENV_PATH = join(ROOT, '.env');

function loadEnv() {
  if (!existsSync(ENV_PATH)) return;
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}

/**
 * Asks for the mailbox details when .env has none, so the first run needs no
 * hand-edited config file. One readline interface serves every question —
 * opening a fresh one per question discards input already buffered on stdin.
 */
async function promptForCredentials() {
  if (!stdin.isTTY) {
    console.error(
      'No mailbox configured, and there is no terminal to ask on.\n' +
        'Run `npm run inbox` directly in a terminal, or put IMAP_USER and ' +
        'IMAP_PASSWORD in a .env file.',
    );
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  const ask = async (question, { secret = false } = {}) => {
    if (!secret) return (await rl.question(question)).trim();
    // Echo the prompt, then silence the terminal so the password isn't shown.
    stdout.write(question);
    rl._writeToOutput = () => {};
    const answer = await rl.question('');
    // Restore the prototype method; assigning null would break later prompts.
    delete rl._writeToOutput;
    stdout.write('\n');
    return answer.trim();
  };

  console.log(
    `\n${BOLD}Connect a mailbox${OFF}\n` +
      `${DIM}Gmail: turn on 2-step verification, then create an app password at\n` +
      `https://myaccount.google.com/apppasswords and paste it below.\n` +
      `It grants mail access only and can be revoked at any time.${OFF}\n`,
  );

  try {
    const user = await ask('Email address: ');
    // Google shows app passwords in groups of four; the spaces are not part of it.
    const password = (await ask('App password: ', { secret: true })).replace(/\s+/g, '');
    if (!user || !password) {
      console.error('\nBoth fields are required.');
      process.exit(1);
    }

    const host =
      user.includes('@gmail.') || user.includes('@googlemail.')
        ? 'imap.gmail.com'
        : (await ask('IMAP server (blank for imap.gmail.com): ')) || 'imap.gmail.com';

    const remember = await ask('\nSave these to .env so you are not asked again? [y/N] ');
    if (/^y(es)?$/i.test(remember)) {
      writeFileSync(ENV_PATH, `IMAP_USER=${user}\nIMAP_PASSWORD=${password}\nIMAP_HOST=${host}\n`, {
        mode: 0o600,
      });
      console.log(`${DIM}Saved to .env (gitignored, readable only by you).${OFF}`);
    }

    return { user, password, host };
  } catch {
    // Ctrl+C or Ctrl+D at a prompt: leave quietly, not with a stack trace.
    console.log('\nCancelled.');
    process.exit(1);
  } finally {
    rl.close();
  }
}

/* ---------------------------------------------------------------- parser -- */

/** The parser is app source (TypeScript); bundle it in memory to run it here. */
async function loadParser() {
  const result = await build({
    entryPoints: [join(ROOT, 'src/lib/parse.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
  });
  const code = result.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

/* ------------------------------------------------------------------ mail -- */

function htmlToText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The text an ingest function would hand the parser: subject plus body. */
function messageText(mail) {
  const body = mail.text?.trim() || (mail.html ? htmlToText(mail.html) : '');
  return `${mail.subject ?? ''}\n${body}`;
}

function isShipping(mail) {
  const haystack = `${mail.from?.text ?? ''} ${mail.subject ?? ''}`.toLowerCase();
  return SHIPPING_HINTS.some((hint) => haystack.includes(hint));
}

/* ----------------------------------------------------------------- output - */

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const OFF = '\x1b[0m';

function report(rows) {
  if (rows.length === 0) {
    console.log('\nNo matching messages found. Try --days 90 or --all.');
    return;
  }

  console.log(`\n${BOLD}${rows.length} messages read${OFF}\n`);
  for (const row of rows) {
    const { mail, parsed } = row;
    const date = mail.date ? mail.date.toISOString().slice(0, 10) : '?';
    const from = (mail.from?.value?.[0]?.address ?? '?').slice(0, 34);
    console.log(`${DIM}${date}  ${from}${OFF}`);
    console.log(`  ${(mail.subject ?? '(no subject)').slice(0, 78)}`);

    if (!parsed) {
      console.log(`  ${RED}✗ nothing recognised${OFF}\n`);
      continue;
    }

    const fields = [
      ['tracking', parsed.trackingNumber],
      ['retailer', parsed.retailerName],
      ['carrier', parsed.carrierId],
      ['status', parsed.readyForPickup ? 'ready_for_pickup' : parsed.status],
      ['eta', parsed.eta],
      ['action', parsed.action?.type],
    ].filter(([, value]) => value);

    const mark = parsed.trackingNumber ? `${GREEN}✓${OFF}` : `${RED}~${OFF}`;
    console.log(
      `  ${mark} ${fields.map(([key, value]) => `${key}=${value}`).join('  ')}` +
        `  ${DIM}(${Math.round(parsed.confidence * 100)}%)${OFF}\n`,
    );
  }

  const withTracking = rows.filter((row) => row.parsed?.trackingNumber).length;
  const withStatus = rows.filter((row) => row.parsed?.status).length;
  const withEta = rows.filter((row) => row.parsed?.eta).length;
  console.log(`${BOLD}Summary${OFF}`);
  console.log(`  tracking number  ${withTracking}/${rows.length}`);
  console.log(`  status           ${withStatus}/${rows.length}`);
  console.log(`  delivery date    ${withEta}/${rows.length}`);
  console.log(
    `\n${DIM}Anything wrong above is a parser gap — rerun with --show N to see the text it read.${OFF}`,
  );
}

/* ------------------------------------------------------------------- run -- */

loadEnv();
const { parseMessage } = await loadParser();
const rows = [];

/**
 * Dates like "18 באוגוסט" are relative to when the message was sent, not to
 * now — an old email must not resolve to this year's date.
 */
const parseAsOf = (mail) => parseMessage(messageText(mail), mail.date ?? new Date());

if (OPTIONS.file) {
  const mail = await simpleParser(readFileSync(OPTIONS.file));
  rows.push({ mail, parsed: parseAsOf(mail) });
} else {
  const fromEnv = process.env.IMAP_USER && process.env.IMAP_PASSWORD;
  const { user, password, host } = fromEnv
    ? {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD.replace(/\s+/g, ''),
        host: process.env.IMAP_HOST || 'imap.gmail.com',
      }
    : await promptForCredentials();

  const client = new ImapFlow({
    host,
    port: 465,
    secure: true,
    auth: { user, pass: password },
    logger: false,
  });

  try {
    await client.connect();
  } catch (error) {
    const message = String(error?.responseText || error?.message || error);
    console.error(`\n${RED}Could not sign in to ${user}${OFF}`);
    if (/invalid credentials|authentication failed/i.test(message)) {
      console.error(
        'The server rejected the password. Two things to check:\n' +
          '  1. It must be an app password, not your normal account password.\n' +
          '  2. IMAP has to be enabled in Gmail (Settings → Forwarding and POP/IMAP).',
      );
    } else {
      console.error(message);
    }
    process.exit(1);
  }

  console.log(`\n${DIM}Reading the last ${OPTIONS.days} days of ${OPTIONS.mailbox}…${OFF}`);
  const lock = await client.getMailboxLock(OPTIONS.mailbox);
  try {
    const since = new Date(Date.now() - OPTIONS.days * 86_400_000);
    for await (const message of client.fetch({ since }, { source: true })) {
      const mail = await simpleParser(message.source);
      if (!OPTIONS.all && !isShipping(mail)) continue;
      rows.push({ mail, parsed: parseAsOf(mail), text: messageText(mail) });
    }
  } finally {
    lock.release();
    await client.logout();
  }
}

report(rows);

if (OPTIONS.show > 0) {
  console.log(`\n${BOLD}First ${OPTIONS.show} messages as the parser saw them${OFF}`);
  for (const row of rows.slice(0, OPTIONS.show)) {
    console.log(`\n${DIM}${'─'.repeat(70)}${OFF}\n${row.text ?? messageText(row.mail)}`);
  }
}
