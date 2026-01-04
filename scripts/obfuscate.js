import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, '../dist-server/index.cjs');

if (!fs.existsSync(targetFile)) {
    console.error(`[Obfuscator] Target file not found: ${targetFile}`);
    process.exit(1);
}

console.log(`[Obfuscator] Obfuscating: ${targetFile}...`);

const code = fs.readFileSync(targetFile, 'utf8');

const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: 4000,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.75,
    stringArrayEncoding: ['base64'],
    stringArrayIndexesType: ['number'],
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
}).getObfuscatedCode();

fs.writeFileSync(targetFile, obfuscatedCode);

console.log('[Obfuscator] ✅ Done!');
