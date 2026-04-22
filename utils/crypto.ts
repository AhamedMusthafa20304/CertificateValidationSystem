/**
 * Generates a SHA-256 hash for a given text input (e.g., file content or metadata).
 * This mimics the hashing process that would happen before sending data to the blockchain.
 */
export async function generateCertificateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return '0x' + hashHex;
}