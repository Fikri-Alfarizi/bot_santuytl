import * as sodium from 'libsodium-wrappers';

// BLOCKING WAIT for Sodium to be ready
// This module must be imported BEFORE any discord/voice libraries
await sodium.ready;

console.log('✅ [Sodium Config] Libsodium-wrappers is READY!');
