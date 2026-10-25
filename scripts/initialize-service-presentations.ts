// Creates a one-time placement snapshot from a fresh public content response.
// Existing placement settings always win. No network or database writes here.
import {readFileSync,writeFileSync} from 'node:fs';
import {normalizeContent} from '../lib/content';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw new Error('Usage: initialize-service-presentations <content.json> <output.sql>');
const content=normalizeContent(JSON.parse(readFileSync(input,'utf8')));
if(!content)throw new Error('The content snapshot is invalid.');
const value=JSON.stringify(content.settings.service_presentations).replace(/'/g,"''");
writeFileSync(output,`INSERT INTO settings(key,value,updated_at) VALUES('service_presentations','${value}',datetime('now')) ON CONFLICT(key) DO UPDATE SET value=json_patch(excluded.value,settings.value),updated_at=datetime('now');\n`,{mode:0o600});
console.log('Prepared independent placement defaults; existing saved settings are preserved.');
