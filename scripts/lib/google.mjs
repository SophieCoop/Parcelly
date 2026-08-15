/**
 * Gmail access through OAuth, for the ingestion prototype.
 *
 * Only `gmail.readonly` is requested: read messages, nothing else — the token
 * cannot send mail, delete anything, or touch any other Google service, and it
 * can be revoked from the Google account page or with `npm run logout`.
 *
 * Uses the loopback flow Google recommends for desktop apps, with PKCE. No SDK:
 * the whole thing is three HTTPS calls.
 */
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
export const TOKEN_PATH = join(ROOT, '.gmail-token.json');

const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

/* ----------------------------------------------------------------- store -- */

export function loadStore() {
  if (!existsSync(TOKEN_PATH)) return undefined;
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
  } catch {
    return undefined;
  }
}

function saveStore(store) {
  // Owner-only: the refresh token is a credential, even a narrow one.
  writeFileSync(TOKEN_PATH, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
}

export function forgetStore() {
  if (existsSync(TOKEN_PATH)) unlinkSync(TOKEN_PATH);
}

/* ------------------------------------------------------------------ auth -- */

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function openBrowser(url) {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]];

  try {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    // A missing opener (headless Linux, minimal container) reports ENOENT on the
    // 'error' event, not as a throw — unhandled, it would kill the login.
    child.on('error', () => {});
    child.unref();
  } catch {
    // Either way the URL was printed above, so the flow still works.
  }
}

const DONE_PAGE = `<!doctype html><meta charset="utf-8">
<title>Parcelly</title>
<body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;background:#F6F5FA;color:#2B1B57">
<div style="text-align:center">
<h1 style="font-size:20px">Connected ✓</h1>
<p style="color:#6b6b80">You can close this tab and go back to the terminal.</p>
</div>`;

/** Runs the consent flow in the browser and returns a refresh token. */
export async function authorize(clientId, clientSecret) {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  const state = base64url(randomBytes(16));

  // Captured when the server binds: server.address() is null once it closes.
  let redirectUri;

  const code = await new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, redirectUri);
      if (url.pathname !== '/') {
        response.writeHead(404).end();
        return;
      }
      // Ignore anything that isn't our callback rather than ending the wait,
      // so a stray request cannot strand the login.
      if (url.searchParams.get('state') !== state) {
        response.writeHead(400, { 'content-type': 'text/plain' }).end('Unexpected request');
        return;
      }

      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(DONE_PAGE);
      server.close();

      const error = url.searchParams.get('error');
      if (error) return reject(new Error(`Google returned: ${error}`));
      resolve(url.searchParams.get('code'));
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      redirectUri = `http://127.0.0.1:${server.address().port}`;
      const url =
        `${AUTH_URL}?${new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: SCOPE,
          access_type: 'offline',
          prompt: 'consent',
          state,
          code_challenge: challenge,
          code_challenge_method: 'S256',
        })}`;

      console.log('\nOpening Google in your browser to ask for permission…');
      console.log(`If it does not open, paste this into your browser:\n\n${url}\n`);
      openBrowser(url);
    });
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Token exchange failed');
  if (!data.refresh_token) {
    throw new Error('Google did not return a refresh token. Remove the app under Third-party access and try again.');
  }

  saveStore({ clientId, clientSecret, refreshToken: data.refresh_token, createdAt: new Date().toISOString() });
  return data.refresh_token;
}

/** Trades the stored refresh token for a short-lived access token. */
export async function accessToken(store) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: store.clientId,
      client_secret: store.clientSecret,
      refresh_token: store.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (response.ok) return data.access_token;

  if (data.error === 'invalid_grant') {
    throw new Error(
      'The saved permission is no longer valid — it was revoked, or the app is still in ' +
        '"Testing" mode where Google expires it after 7 days.\nRun `npm run login` again.',
    );
  }
  throw new Error(data.error_description || data.error || 'Could not refresh the token');
}

export async function revoke(store) {
  await fetch(`${REVOKE_URL}?token=${encodeURIComponent(store.refreshToken)}`, { method: 'POST' });
}

/* ------------------------------------------------------------------ mail -- */

async function api(path, token) {
  const response = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API ${response.status}: ${body.slice(0, 200)}`);
  }
  return response.json();
}

/** Message ids newer than `days`, newest first. */
export async function* listMessageIds(token, days, limit = 200) {
  let pageToken;
  let seen = 0;
  do {
    const query = new URLSearchParams({ q: `newer_than:${days}d`, maxResults: '100' });
    if (pageToken) query.set('pageToken', pageToken);
    const page = await api(`/messages?${query}`, token);
    for (const message of page.messages ?? []) {
      yield message.id;
      if (++seen >= limit) return;
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
}

/** The original RFC822 bytes, so the same mail parser handles both sources. */
export async function getRawMessage(token, id) {
  const message = await api(`/messages/${id}?format=raw`, token);
  return Buffer.from(message.raw, 'base64url');
}
