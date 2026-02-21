const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const outPath = path.join(projectRoot, 'public', 'env.json');

const defaultConfig = {
  apiBaseUrl: 'http://localhost:3000'
};

function parseEnv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const idx = trimmed.indexOf('=');
    if (idx === -1) {
      continue;
    }
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

let envVars = {};
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  envVars = parseEnv(raw);
}

const config = {
  apiBaseUrl: envVars.API_BASE_URL || defaultConfig.apiBaseUrl
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
console.log(`[generate-env] Wrote ${outPath}`);
