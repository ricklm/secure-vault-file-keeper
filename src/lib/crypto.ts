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
    // Verifica se o arquivo é válido
    if (!(await isEncryptedFile(encryptedFile))) {
      throw new Error('O arquivo não é um arquivo criptografado válido');
    }

    // Read encrypted file
    const fileText = await encryptedFile.text();
    let encryptedData;
    
    try {
      encryptedData = JSON.parse(fileText);
    } catch (error) {
      throw new Error('Formato de arquivo inválido: não é um JSON válido');
    }
    
    // Valida a estrutura do arquivo
    const requiredFields = ['encryptedData', 'iv', 'salt', 'filename', 'originalSize'];
    for (const field of requiredFields) {
      if (!(field in encryptedData)) {
        throw new Error(`Formato de arquivo inválido: campo obrigatório '${field}' não encontrado`);
      }
    }
    
    // Reconstruct ArrayBuffers from arrays
    let encryptedBuffer, iv, salt;
    
    try {
      encryptedBuffer = new Uint8Array(encryptedData.encryptedData).buffer;
      iv = new Uint8Array(encryptedData.iv);
      salt = new Uint8Array(encryptedData.salt);
    } catch (error) {
      throw new Error('Formato de dados inválido no arquivo criptografado');
    }
    
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
    if (error instanceof Error) {
      if (error.message.includes('decrypt') || error.message.includes('importKey')) {
        throw new Error('Senha incorreta ou arquivo corrompido');
      } else if (error.message.includes('JSON')) {
        throw new Error('Formato de arquivo inválido');
      } else if (error.message.includes('Formato de')) {
        // Já tem uma mensagem específica
        throw error;
      }
    }
    throw new Error('Falha na descriptografia do arquivo: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Validates if a file is encrypted (has .enc extension and valid structure)
 */
export async function isEncryptedFile(file: File): Promise<boolean> {
  // Verifica a extensão do arquivo
  if (!file.name.endsWith('.enc')) {
    return false;
  }

  try {
    // Tenta ler o conteúdo do arquivo para verificar se tem a estrutura esperada
    const fileText = await file.text();
    const fileData = JSON.parse(fileText);
    
    // Verifica se o arquivo tem a estrutura esperada
    return (
      'encryptedData' in fileData &&
      'iv' in fileData &&
      'salt' in fileData &&
      'filename' in fileData &&
      'originalSize' in fileData
    );
  } catch (error) {
    console.error('Erro ao validar arquivo criptografado:', error);
    return false;
  }
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
          if (a.parentNode === document.body) {
            document.body.removeChild(a);
          }
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