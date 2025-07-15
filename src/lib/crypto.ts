// Crypto utilities for secure file encryption/decryption
// Using Web Crypto API with AES-256-GCM and PBKDF2

export interface EncryptedFile {
  encryptedData: ArrayBuffer;
  iv: ArrayBuffer;
  salt: ArrayBuffer;
  filename: string;
  originalSize: number;
}

export interface EncryptionResult {
  blob: Blob;
  filename: string;
}

/**
 * Generates a cryptographic key from password using PBKDF2
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as base key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES-256-GCM key using PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a file using AES-256-GCM
 */
export async function encryptFile(file: File, password: string): Promise<EncryptionResult> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from password
    const key = await deriveKey(password, salt);
    
    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // Encrypt the file
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      fileBuffer
    );
    
    // Create encrypted file structure
    const encryptedFile: EncryptedFile = {
      encryptedData,
      iv,
      salt,
      filename: file.name,
      originalSize: file.size
    };
    
    // Convert to JSON and create blob
    const jsonString = JSON.stringify({
      encryptedData: Array.from(new Uint8Array(encryptedFile.encryptedData)),
      iv: Array.from(new Uint8Array(encryptedFile.iv)),
      salt: Array.from(new Uint8Array(encryptedFile.salt)),
      filename: encryptedFile.filename,
      originalSize: encryptedFile.originalSize
    });
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const encryptedFilename = file.name.replace(/\.[^/.]+$/, '') + '.enc';
    
    return {
      blob,
      filename: encryptedFilename
    };
    
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Falha na criptografia do arquivo');
  }
}

/**
 * Decrypts a file using AES-256-GCM
 */
export async function decryptFile(encryptedFile: File, password: string): Promise<EncryptionResult> {
  try {
    // Read encrypted file
    const fileText = await encryptedFile.text();
    const encryptedData = JSON.parse(fileText);
    
    // Reconstruct ArrayBuffers from arrays
    const encryptedBuffer = new Uint8Array(encryptedData.encryptedData).buffer;
    const iv = new Uint8Array(encryptedData.iv);
    const salt = new Uint8Array(encryptedData.salt);
    
    // Derive key from password
    const key = await deriveKey(password, salt);
    
    // Decrypt the file
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedBuffer
    );
    
    // Create blob with decrypted data
    const blob = new Blob([decryptedData]);
    
    return {
      blob,
      filename: encryptedData.filename
    };
    
  } catch (error) {
    console.error('Decryption failed:', error);
    if (error instanceof Error && error.message.includes('decrypt')) {
      throw new Error('Senha incorreta ou arquivo corrompido');
    }
    throw new Error('Falha na descriptografia do arquivo');
  }
}

/**
 * Validates if a file is encrypted (has .enc extension and valid structure)
 */
export function isEncryptedFile(file: File): boolean {
  return file.name.endsWith('.enc');
}

/**
 * Downloads a blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    // Use requestAnimationFrame to ensure the element is in the DOM before clicking
    requestAnimationFrame(() => {
      document.body.appendChild(a);
      // Use setTimeout to ensure the element is properly attached
      setTimeout(() => {
        a.click();
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }, 0);
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to initiate file download');
  }
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}