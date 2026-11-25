// Crée les tables dans Neon : DATABASE_URL=... node scripts/migrate.mjs
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL manquante'); process.exit(1); }
const sql = neon(url);
const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')
  .split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
  await sql(stmt);
  console.log('OK :', stmt.split('\n')[0]);
}
const tables = await sql(`select table_name from information_schema.tables where table_schema = 'public' order by 1`);
console.log('Tables :', tables.map(t => t.table_name).join(', '));
