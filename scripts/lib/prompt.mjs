/**
 * Terminal questions for the setup scripts.
 *
 * A readline interface only works for a sequence of questions when stdin is a
 * TTY: with piped input it emits every buffered line immediately, so questions
 * asked after the first never see their answer. Piped runs therefore read stdin
 * once and answer from the buffer, which also makes these flows scriptable.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export function createPrompter() {
  if (stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    return {
      async ask(question, { secret = false } = {}) {
        if (!secret) return (await rl.question(question)).trim();
        // Echo the prompt, then silence the terminal so the secret isn't shown.
        stdout.write(question);
        rl._writeToOutput = () => {};
        const answer = await rl.question('');
        delete rl._writeToOutput; // Restore the prototype method for later prompts.
        stdout.write('\n');
        return answer.trim();
      },
      close: () => rl.close(),
    };
  }

  let lines;
  return {
    async ask(question) {
      if (!lines) {
        // Waits for the writer to close stdin, then answers from the buffer.
        const chunks = [];
        for await (const chunk of stdin) chunks.push(chunk);
        lines = Buffer.concat(chunks).toString('utf8').split('\n');
      }
      stdout.write(`${question}\n`);
      return (lines.shift() ?? '').trim();
    },
    close: () => {},
  };
}
