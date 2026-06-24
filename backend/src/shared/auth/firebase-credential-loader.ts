import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import type { ServiceAccount } from 'firebase-admin/app';

export type CredentialForm = 'adc' | 'inline' | 'path' | 'base64';

export interface LoadedCredential {
  /** `null` means: fall back to Google Application Default Credentials. */
  credential: ServiceAccount | null;
  /** Which wire form the raw env var was interpreted as. */
  form: CredentialForm;
  /** Soft-failure message the caller should log at WARN level (e.g. path missing). */
  warning?: string;
}

const ENV_NAME = 'FIREBASE_SERVICE_ACCOUNT_JSON';

/**
 * Resolve the `FIREBASE_SERVICE_ACCOUNT_JSON` env value into a Firebase
 * `ServiceAccount` plus a label of which wire form it came in as.
 *
 * Four supported forms, detected in this priority order:
 *
 *   1. The literal string `"adc"` — caller falls back to
 *      `applicationDefault()`.
 *   2. Inline JSON (starts with `{`) — `JSON.parse(value)`.
 *   3. Path (starts with `/`, `./`, or `../`) — `readFileSync` then parse.
 *      A missing file is soft-failed: the loader returns the ADC fallback
 *      with a warning so non-runtime boots (openapi export, CI) keep working.
 *   4. Anything else — assume base64 of JSON. Decode, parse.
 *
 * The trade-off this shape encodes: one env var, four forms, no migration
 * for the existing local-dev path-form setup. See
 * [docs/adr/0007-firebase-admin-credential-wire-format.md] and issue #20
 * for the full rationale and rejected alternatives.
 *
 * Pure function — no Nest, no `Logger`. Only I/O is `readFileSync` for the
 * path form. Errors are thrown with the env-var name as prefix so operators
 * can grep them straight out of a deploy log.
 */
export function loadCredential(raw: string): LoadedCredential {
  const trimmed = raw.trim();

  if (trimmed === 'adc') {
    return { credential: null, form: 'adc' };
  }

  if (trimmed.startsWith('{')) {
    return {
      credential: parseAndValidate(trimmed, 'inline'),
      form: 'inline',
    };
  }

  if (looksLikePath(trimmed)) {
    return loadFromPath(trimmed);
  }

  return {
    credential: decodeBase64(trimmed),
    form: 'base64',
  };
}

function looksLikePath(value: string): boolean {
  return value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
}

function loadFromPath(value: string): LoadedCredential {
  const fullPath = isAbsolute(value) ? value : resolve(process.cwd(), value);
  if (!existsSync(fullPath)) {
    return {
      credential: null,
      form: 'adc',
      warning:
        `${ENV_NAME}: file not found at ${fullPath}; falling back to ADC. ` +
        'Token verification will fail until a real credential is provided.',
    };
  }
  const contents = readFileSync(fullPath, 'utf8');
  return {
    credential: parseAndValidate(contents, 'path'),
    form: 'path',
  };
}

function decodeBase64(value: string): ServiceAccount {
  let decoded: string;
  try {
    const buf = Buffer.from(value, 'base64');
    // Reject inputs that are valid as base64 but encode raw bytes
    // (the JSON is supposed to be UTF-8 text).
    decoded = buf.toString('utf8');
    if (decoded.length === 0) {
      throw new Error('decoded payload is empty');
    }
  } catch (err) {
    throw new Error(
      `${ENV_NAME}: looks like base64 but failed to decode: ${(err as Error).message}`,
    );
  }
  return parseAndValidate(decoded, 'base64');
}

function parseAndValidate(text: string, form: CredentialForm): ServiceAccount {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `${ENV_NAME}: ${form === 'base64' ? 'looks like base64 but decoded payload is not valid JSON' : `${form} value is not valid JSON`}: ${(err as Error).message}`,
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`${ENV_NAME}: ${form} value did not parse to an object`);
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.client_email !== 'string' || obj.client_email.length === 0) {
    throw new Error(`${ENV_NAME}: ${form} value missing required field "client_email"`);
  }
  if (typeof obj.private_key !== 'string' || obj.private_key.length === 0) {
    throw new Error(`${ENV_NAME}: ${form} value missing required field "private_key"`);
  }

  return parsed as ServiceAccount;
}
