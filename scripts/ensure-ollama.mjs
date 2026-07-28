/**
 * Vérifie qu'Ollama est installé, démarré et que le modèle par défaut est disponible.
 * Exécuté avant `pnpm dev` lorsque AI_PROVIDER=ollama (défaut).
 *
 * Ignorer : SKIP_OLLAMA_SETUP=true
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, 'apps/api/.env');

function loadEnvFile() {
  if (!existsSync(ENV_PATH)) return {};
  const env = {};
  for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const fileEnv = loadEnvFile();
const AI_PROVIDER = process.env.AI_PROVIDER ?? fileEnv.AI_PROVIDER ?? 'ollama';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? fileEnv.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? fileEnv.OLLAMA_MODEL ?? 'llama3.2';
const SKIP = process.env.SKIP_OLLAMA_SETUP === 'true';

function log(msg) {
  console.log(`[ollama] ${msg}`);
}

function commandExists(cmd) {
  const checker = platform() === 'win32' ? 'where' : 'which';
  const result = spawnSync(checker, [cmd], { shell: true, encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0;
}

function getOllamaBinary() {
  if (platform() === 'win32') {
    const local = join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Ollama', 'ollama.exe');
    if (existsSync(local)) return local;
  }
  return 'ollama';
}

function ollamaInstalled() {
  return commandExists('ollama') || existsSync(getOllamaBinary());
}

function runOllama(args, inherit = true) {
  const bin = getOllamaBinary();
  return spawnSync(bin, args, {
    shell: platform() === 'win32',
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
  });
}

async function isServerRunning() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(maxSeconds = 45) {
  for (let i = 0; i < maxSeconds; i++) {
    if (await isServerRunning()) return true;
    await sleep(1000);
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function installOllamaWindowsWinget() {
  if (!commandExists('winget')) return false;
  const r = spawnSync(
    'winget',
    [
      'install',
      'Ollama.Ollama',
      '--accept-package-agreements',
      '--accept-source-agreements',
      '--silent',
    ],
    { shell: true, stdio: 'inherit' },
  );
  return r.status === 0;
}

function installOllamaWindowsDownload() {
  log('Téléchargement de l’installateur Ollama…');
  const setupPath = join(process.env.TEMP ?? '', 'OllamaSetup.exe');
  const ps = `
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '${setupPath.replace(/\\/g, '\\\\')}' -UseBasicParsing
    Start-Process -FilePath '${setupPath.replace(/\\/g, '\\\\')}' -ArgumentList '/S' -Wait
  `;
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
    stdio: 'inherit',
  });
  return r.status === 0;
}

function installOllama() {
  const os = platform();
  log('Ollama introuvable — installation en cours…');

  if (os === 'win32') {
    if (installOllamaWindowsWinget()) return true;
    if (installOllamaWindowsDownload()) return true;
    log('Installation automatique impossible. Téléchargez Ollama : https://ollama.com/download');
    return false;
  }

  if (os === 'darwin') {
    if (commandExists('brew')) {
      const r = spawnSync('brew', ['install', 'ollama'], { stdio: 'inherit' });
      return r.status === 0;
    }
  }

  const r = spawnSync('sh', ['-c', 'curl -fsSL https://ollama.com/install.sh | sh'], {
    stdio: 'inherit',
  });
  return r.status === 0;
}

function startServer() {
  log('Démarrage du serveur Ollama…');
  const bin = getOllamaBinary();
  const child = spawn(bin, ['serve'], {
    detached: true,
    stdio: 'ignore',
    shell: platform() === 'win32',
  });
  child.unref();
}

async function modelIsPresent(model) {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    return (data.models ?? []).some(
      (m) => m.name === model || m.name.startsWith(`${model}:`),
    );
  } catch {
    return false;
  }
}

async function pullModel(model) {
  log(`Téléchargement du modèle « ${model} » (première fois, peut prendre plusieurs minutes)…`);
  const r = runOllama(['pull', model], true);
  return r.status === 0;
}

async function main() {
  if (SKIP) {
    log('SKIP_OLLAMA_SETUP=true — bootstrap ignoré');
    return;
  }

  if (AI_PROVIDER !== 'ollama') {
    log(`AI_PROVIDER=${AI_PROVIDER} — bootstrap Ollama ignoré`);
    return;
  }

  log(`Provider Ollama — modèle cible : ${OLLAMA_MODEL}`);

  if (!ollamaInstalled()) {
    const ok = installOllama();
    if (!ok) {
      log('Installation automatique impossible. L’API utilisera le fallback mock.');
      return;
    }
    await sleep(3000);
  }

  if (!(await isServerRunning())) {
    startServer();
    const ready = await waitForServer();
    if (!ready) {
      log('Serveur Ollama non joignable. L’API utilisera le fallback mock.');
      return;
    }
  }

  log('Serveur Ollama actif');

  if (!(await modelIsPresent(OLLAMA_MODEL))) {
    const pulled = await pullModel(OLLAMA_MODEL);
    if (!pulled) {
      log(`Impossible de télécharger « ${OLLAMA_MODEL} ». Vérifiez : ollama pull ${OLLAMA_MODEL}`);
    }
  } else {
    log(`Modèle « ${OLLAMA_MODEL} » disponible`);
  }

  log('Prêt');
}

main().catch((err) => {
  console.error('[ollama] Erreur bootstrap:', err);
  process.exit(0);
});
