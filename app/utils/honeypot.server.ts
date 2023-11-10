import { Honeypot } from 'remix-utils/honeypot/server';

export const honeypot = new Honeypot({
  validFromFieldName: null,
  // encryptionSeed: process.env.HONEY_POT_ENCRYPTION_SEED,
  // nameFieldName: 'name',
  // randomizeNameFieldName: true,
});
