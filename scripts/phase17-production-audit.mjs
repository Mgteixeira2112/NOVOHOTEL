import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const blockers = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function walk(dir, predicate = () => true, out = []) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const relative = join(dir, entry.name);
    if (entry.isDirectory()) walk(relative, predicate, out);
    else if (predicate(relative)) out.push(relative);
  }
  return out;
}

const sourceFiles = walk('src', file => /\.(ts|tsx|js|jsx)$/.test(file));
const migrationFiles = walk('supabase/migrations', file => file.endsWith('.sql'));

const forbiddenSourcePatterns = [
  [/service_role_key/i, 'service role key referenced in client source'],
  [/SUPABASE_SERVICE_ROLE/i, 'Supabase service-role environment variable referenced in client source'],
  [/187\.54\.120\.45/, 'hard-coded client IP address found'],
  [/backupCodes\s*=\s*\[/, 'universal/embedded MFA backup codes found'],
  [/HOTEL_PMS_SECRET_SALT/, 'client-side shared MFA secret found'],
  [/['\"](123456|888888|999999|000000|777777)['\"]/, 'known universal MFA bypass code found'],
];

for (const file of sourceFiles) {
  const content = read(file);
  for (const [pattern, reason] of forbiddenSourcePatterns) {
    if (pattern.test(content)) failures.push(`${file}: ${reason}`);
  }
}

const workflow = read('.github/workflows/hotel-os-validation.yml');
if (!workflow.includes('bun install --frozen-lockfile')) {
  failures.push('.github/workflows/hotel-os-validation.yml: reproducible Bun install is missing');
}
if (workflow.includes('npm ci')) {
  failures.push('.github/workflows/hotel-os-validation.yml: npm ci is invalid without package-lock.json');
}

const pkg = JSON.parse(read('package.json'));
if (!pkg.scripts?.['audit:production']) {
  failures.push('package.json: audit:production script is missing');
}
if (!pkg.scripts?.build || !pkg.scripts?.lint || !pkg.scripts?.test) {
  failures.push('package.json: required build/lint/test scripts are missing');
}

const envExample = read('.env.example');
if (/SERVICE_ROLE|PRIVATE_KEY|SECRET_KEY/i.test(envExample)) {
  failures.push('.env.example: private/service-role credential appears in client configuration');
}

const sw = read('public/sw.js');
if (/localStorage|sessionStorage|indexedDB/i.test(sw)) {
  failures.push('public/sw.js: browser data store is accessed by service worker');
}

// Known production blockers are intentionally reported, not hidden or reclassified as failures.
const hotelContext = read('src/context/HotelContext.tsx');
if (/user\.senha|currentUser\.senha|const expectedPassword = .*senha/.test(hotelContext)) {
  blockers.push('legacy/local password authentication remains in HotelContext; Supabase Auth migration is still required');
}

const rlsTrueMigrations = migrationFiles.filter(file => /USING\s*\(\s*true\s*\)|WITH\s+CHECK\s*\(\s*true\s*\)/i.test(read(file)));
if (rlsTrueMigrations.length) {
  blockers.push(`legacy permissive RLS expressions remain in historical migrations (${rlsTrueMigrations.length} file(s)); final live-schema policies must be validated in Supabase`);
}

const securityHelper = read('src/utils/securityHelper.ts');
if (/isProduction\(\)[\s\S]*server_mfa_required/.test(securityHelper) === false) {
  blockers.push('MFA production fail-closed marker was not found in securityHelper');
}

console.log('HOTEL OS — Phase 17 production audit');
console.log(`Source files scanned: ${sourceFiles.length}`);
console.log(`Migration files scanned: ${migrationFiles.length}`);

if (failures.length) {
  console.error('\nCRITICAL STATIC FAILURES:');
  for (const item of failures) console.error(`- ${item}`);
  process.exitCode = 1;
}

if (blockers.length) {
  console.warn('\nPRODUCTION BLOCKERS (must be resolved before Go-Live):');
  for (const item of blockers) console.warn(`- ${item}`);
}

if (!failures.length && !blockers.length) {
  console.log('\nNo static production blockers detected by this audit.');
} else if (!failures.length) {
  console.log('\nStatic audit passed; production blockers remain and are intentionally reported above.');
}
