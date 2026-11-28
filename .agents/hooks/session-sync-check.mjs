import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function runGit(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout: 4000,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

const raw = readStdin();
let cwd = process.cwd();
if (raw) {
  try {
    const payload = JSON.parse(raw);
    cwd = payload.cwd || (Array.isArray(payload.workspacePaths) && payload.workspacePaths[0]) || cwd;
  } catch {
    // Ignore malformed stdin and fallback to process.cwd()
  }
}

try {
  // Best-effort fetch; silently ignored when offline or sandboxed without network.
  try {
    runGit(['fetch', '--quiet'], cwd);
  } catch {
    // Offline or restricted network; still inspect local tracking info.
  }

  const statusLine = runGit(['status', '-sb'], cwd).split(/\r?\n/)[0] || '';
  const behindMatch = statusLine.match(/\[(?:[^\]]*,\s*)?behind\s+(\d+)\]/i);

  if (behindMatch) {
    const count = behindMatch[1];
    const output = {
      injectSteps: [
        {
          systemMessage: {
            systemMessage: `Rule 3.10: O repositório local está ${count} commit(s) atrás do remoto (${statusLine}). Execute \`git pull\` antes de iniciar alterações ou criar branch/worktree.`,
          },
        },
      ],
    };
    process.stdout.write(JSON.stringify(output));
  } else {
    process.stdout.write('{}');
  }
} catch {
  process.stdout.write('{}');
}
