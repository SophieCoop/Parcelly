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
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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

function loadEnv() {
  const path = join(ROOT, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (!(match[1] in process.env)) process.env[match[1]] = value;
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
  const { IMAP_USER, IMAP_PASSWORD, IMAP_HOST = 'imap.gmail.com' } = process.env;
  if (!IMAP_USER || !IMAP_PASSWORD) {
    console.error(
      'Missing IMAP_USER / IMAP_PASSWORD.\n' +
        'Copy .env.example to .env and fill in a Gmail app password (see the README).',
    );
    process.exit(1);
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: 465,
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASSWORD },
    logger: false,
  });

  await client.connect();
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
