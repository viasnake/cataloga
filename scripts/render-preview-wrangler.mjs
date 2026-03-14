import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = [
  'Usage: node scripts/render-preview-wrangler.mjs --input <path> --output <path> --worker-name <name>',
  '',
  'This writes a preview-only wrangler.toml with a PR-specific worker name.'
].join('\n');

const parseArgs = (argv) => {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === '--help' || token === '-h') {
      parsed.help = true;
      continue;
    }

    if (token === '--input' && value) {
      parsed.inputPath = value;
      index += 1;
      continue;
    }

    if (token === '--output' && value) {
      parsed.outputPath = value;
      index += 1;
      continue;
    }

    if (token === '--worker-name' && value) {
      parsed.workerName = value;
      index += 1;
    }
  }

  return parsed;
};

export const renderPreviewWrangler = ({ inputPath, outputPath, workerName }) => {
  if (!inputPath || !outputPath || !workerName) {
    throw new Error('--input, --output, and --worker-name are required');
  }

  const input = resolve(inputPath);
  const output = resolve(outputPath);
  const source = readFileSync(input, 'utf8');
  const previewOnly = source
    .replace(/name = ".*"/u, `name = "${workerName}"`)
    .replace(/\n\[env\.preview\][\s\S]*$/u, '\n');

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, previewOnly, 'utf8');
};

const isEntrypoint = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(usage);
    process.exit(0);
  }

  renderPreviewWrangler(parsed);
}
