import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_VIEWER_DIR = 'apps/web/dist';
const DEFAULT_OUT_DIR = 'deploy/cloudflare/public';
const DEFAULT_REGISTRY_PATH = 'registry';

const usage = [
  'Usage: node scripts/package-cloudflare.mjs --bundle <path> [--viewer-dir <path>] [--out <path>]',
  '',
  'Required:',
  '  --bundle <path>         Exported bundle.json path',
  '',
  'Optional metadata flags:',
  '  --data-repo <slug>      Data repository slug or URL',
  '  --data-ref <ref>        Data repository ref',
  '  --data-commit <sha>     Data repository commit SHA',
  '  --registry-path <path>  Registry directory inside the data repo',
  '  --engine-repo <slug>    Engine repository slug or URL',
  '  --engine-ref <ref>      Engine release tag or ref',
  '  --engine-commit <sha>   Engine repository commit SHA',
  '  --generated-at <iso>    ISO-8601 timestamp override',
  '  --deployment-version <value>  Deployment version override'
].join('\n');

const parseArgs = (argv) => {
  const parsed = {
    viewerDir: DEFAULT_VIEWER_DIR,
    outDir: DEFAULT_OUT_DIR,
    registryPath: DEFAULT_REGISTRY_PATH
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === '--help' || token === '-h') {
      parsed.help = true;
      continue;
    }

    if (token === '--viewer-dir' && value) {
      parsed.viewerDir = value;
      index += 1;
      continue;
    }

    if (token === '--bundle' && value) {
      parsed.bundlePath = value;
      index += 1;
      continue;
    }

    if (token === '--out' && value) {
      parsed.outDir = value;
      index += 1;
      continue;
    }

    if (token === '--data-repo' && value) {
      parsed.dataRepo = value;
      index += 1;
      continue;
    }

    if (token === '--data-ref' && value) {
      parsed.dataRef = value;
      index += 1;
      continue;
    }

    if (token === '--data-commit' && value) {
      parsed.dataCommitSha = value;
      index += 1;
      continue;
    }

    if (token === '--registry-path' && value) {
      parsed.registryPath = value;
      index += 1;
      continue;
    }

    if (token === '--engine-repo' && value) {
      parsed.engineRepo = value;
      index += 1;
      continue;
    }

    if (token === '--engine-ref' && value) {
      parsed.engineRef = value;
      index += 1;
      continue;
    }

    if (token === '--engine-commit' && value) {
      parsed.engineCommitSha = value;
      index += 1;
      continue;
    }

    if (token === '--generated-at' && value) {
      parsed.generatedAt = value;
      index += 1;
      continue;
    }

    if (token === '--deployment-version' && value) {
      parsed.deploymentVersion = value;
      index += 1;
    }
  }

  return parsed;
};

const toShortSha = (value) => {
  if (!value) {
    return 'unknown';
  }

  return value.slice(0, 12);
};

const createDeploymentVersion = ({
  deploymentVersion,
  generatedAt,
  dataCommitSha,
  engineCommitSha
}) => {
  if (deploymentVersion) {
    return deploymentVersion;
  }

  const compactTimestamp = generatedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/u, 'Z');
  return `${toShortSha(dataCommitSha)}-${toShortSha(engineCommitSha)}-${compactTimestamp}`;
};

const ensureFile = (filePath, label) => {
  const resolvedPath = resolve(filePath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`${label} not found: ${resolvedPath}`);
  }

  const stats = statSync(resolvedPath);
  if (!stats.isFile()) {
    throw new Error(`${label} must be a file: ${resolvedPath}`);
  }

  return resolvedPath;
};

const ensureDirectory = (directoryPath, label) => {
  const resolvedPath = resolve(directoryPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`${label} not found: ${resolvedPath}`);
  }

  const stats = statSync(resolvedPath);
  if (!stats.isDirectory()) {
    throw new Error(`${label} must be a directory: ${resolvedPath}`);
  }

  return resolvedPath;
};

export const buildCloudflareMetadata = ({
  bundle,
  generatedAt,
  deploymentVersion,
  registryPath,
  dataRepo,
  dataRef,
  dataCommitSha,
  engineRepo,
  engineRef,
  engineCommitSha
}) => ({
  product: 'Ledra',
  deploymentVersion,
  generatedAt,
  engine: {
    repo: engineRepo ?? 'unknown',
    ref: engineRef ?? 'unknown',
    commitSha: engineCommitSha ?? 'unknown'
  },
  data: {
    repo: dataRepo ?? 'unknown',
    ref: dataRef ?? 'unknown',
    commitSha: dataCommitSha ?? 'unknown',
    registryPath
  },
  bundle: {
    path: '/bundle.json',
    schemaVersion: bundle.schemaVersion
  }
});

export const createCloudflarePackage = ({
  viewerDir = DEFAULT_VIEWER_DIR,
  bundlePath,
  outDir = DEFAULT_OUT_DIR,
  registryPath = DEFAULT_REGISTRY_PATH,
  dataRepo,
  dataRef,
  dataCommitSha,
  engineRepo,
  engineRef,
  engineCommitSha,
  generatedAt,
  deploymentVersion
}) => {
  if (!bundlePath) {
    throw new Error('--bundle is required');
  }

  const resolvedViewerDir = ensureDirectory(viewerDir, 'Viewer build directory');
  const resolvedBundlePath = ensureFile(bundlePath, 'Bundle file');
  ensureFile(join(resolvedViewerDir, 'index.html'), 'Viewer entrypoint');

  const bundle = JSON.parse(readFileSync(resolvedBundlePath, 'utf8'));
  const timestamp = generatedAt ?? new Date().toISOString();
  const version = createDeploymentVersion({
    deploymentVersion,
    generatedAt: timestamp,
    dataCommitSha,
    engineCommitSha
  });
  const metadata = buildCloudflareMetadata({
    bundle,
    generatedAt: timestamp,
    deploymentVersion: version,
    registryPath,
    dataRepo,
    dataRef,
    dataCommitSha,
    engineRepo,
    engineRef,
    engineCommitSha
  });
  const resolvedOutDir = resolve(outDir);

  rmSync(resolvedOutDir, { recursive: true, force: true });
  mkdirSync(dirname(resolvedOutDir), { recursive: true });
  cpSync(resolvedViewerDir, resolvedOutDir, { recursive: true });
  cpSync(resolvedBundlePath, join(resolvedOutDir, 'bundle.json'));
  writeFileSync(
    join(resolvedOutDir, 'metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8'
  );

  return {
    outDir: resolvedOutDir,
    bundlePath: join(resolvedOutDir, 'bundle.json'),
    metadataPath: join(resolvedOutDir, 'metadata.json'),
    metadata
  };
};

const isEntrypoint = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    console.log(usage);
    process.exit(0);
  }

  const result = createCloudflarePackage(parsed);
  console.log(JSON.stringify(result, null, 2));
}
