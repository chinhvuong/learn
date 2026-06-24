/// <reference types="jest" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadCredential } from '@shared/auth/firebase-credential-loader';

const FIXTURE_PATH = resolve(__dirname, '../../../fixtures/firebase-service-account.json');
const FIXTURE_JSON = readFileSync(FIXTURE_PATH, 'utf8');
const FIXTURE_BASE64 = Buffer.from(FIXTURE_JSON, 'utf8').toString('base64');
const FIXTURE_PARSED = JSON.parse(FIXTURE_JSON);

describe('loadCredential', () => {
  describe('adc form', () => {
    it('returns null credential + form="adc" for the literal "adc" value', () => {
      const result = loadCredential('adc');
      expect(result).toEqual({ credential: null, form: 'adc' });
    });

    it('trims surrounding whitespace before detecting "adc"', () => {
      const result = loadCredential('   adc\n');
      expect(result.form).toBe('adc');
      expect(result.credential).toBeNull();
    });
  });

  describe('inline form', () => {
    it('parses inline JSON starting with "{"', () => {
      const result = loadCredential(FIXTURE_JSON);
      expect(result.form).toBe('inline');
      expect(result.credential).toMatchObject({
        client_email: FIXTURE_PARSED.client_email,
        private_key: FIXTURE_PARSED.private_key,
      });
    });

    it('throws prefixed error when inline JSON is missing client_email', () => {
      const missing = JSON.stringify({ private_key: 'x' });
      expect(() => loadCredential(missing)).toThrow(
        /^FIREBASE_SERVICE_ACCOUNT_JSON: inline value missing required field "client_email"/,
      );
    });

    it('throws prefixed error when inline value is not valid JSON', () => {
      expect(() => loadCredential('{not valid json')).toThrow(
        /^FIREBASE_SERVICE_ACCOUNT_JSON: inline value is not valid JSON/,
      );
    });
  });

  describe('path form', () => {
    it('reads + parses an absolute path', () => {
      const result = loadCredential(FIXTURE_PATH);
      expect(result.form).toBe('path');
      expect(result.warning).toBeUndefined();
      expect(result.credential).toMatchObject({
        client_email: FIXTURE_PARSED.client_email,
      });
    });

    it('reads + parses a relative path (./ prefix)', () => {
      const cwd = process.cwd();
      try {
        process.chdir(resolve(__dirname, '../../..'));
        const result = loadCredential('./fixtures/firebase-service-account.json');
        expect(result.form).toBe('path');
        expect(result.credential).toMatchObject({
          client_email: FIXTURE_PARSED.client_email,
        });
      } finally {
        process.chdir(cwd);
      }
    });

    it('falls back to ADC with a warning when the file is missing', () => {
      const result = loadCredential('/nonexistent/path/firebase-admin.json');
      expect(result.form).toBe('adc');
      expect(result.credential).toBeNull();
      expect(result.warning).toMatch(
        /^FIREBASE_SERVICE_ACCOUNT_JSON: file not found at \/nonexistent\/path\/firebase-admin\.json/,
      );
    });
  });

  describe('base64 form', () => {
    it('decodes a base64-encoded JSON blob', () => {
      const result = loadCredential(FIXTURE_BASE64);
      expect(result.form).toBe('base64');
      expect(result.credential).toMatchObject({
        client_email: FIXTURE_PARSED.client_email,
        private_key: FIXTURE_PARSED.private_key,
      });
    });

    it('trims surrounding whitespace before decoding', () => {
      const result = loadCredential(`  ${FIXTURE_BASE64}\n`);
      expect(result.form).toBe('base64');
      expect(result.credential).toMatchObject({
        client_email: FIXTURE_PARSED.client_email,
      });
    });

    it('throws prefixed error when decoded payload is not valid JSON', () => {
      // "not-json" base64-encoded
      const badPayload = Buffer.from('not-json', 'utf8').toString('base64');
      expect(() => loadCredential(badPayload)).toThrow(
        /^FIREBASE_SERVICE_ACCOUNT_JSON: looks like base64 but decoded payload is not valid JSON/,
      );
    });

    it('throws prefixed error when decoded JSON is missing private_key', () => {
      const missing = JSON.stringify({ client_email: 'x@y.z' });
      const encoded = Buffer.from(missing, 'utf8').toString('base64');
      expect(() => loadCredential(encoded)).toThrow(
        /^FIREBASE_SERVICE_ACCOUNT_JSON: base64 value missing required field "private_key"/,
      );
    });
  });
});
