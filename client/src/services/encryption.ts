import CryptoJS from 'crypto-js';

// Derive a unique symmetric conversation key deterministically based on Chat ID and salt
const deriveConversationKey = (chatId: string): string => {
  const salt = 'ConnectSphere_E2E_Salt_2026_Mukesh';
  return CryptoJS.SHA256(chatId + salt).toString();
};

export const encryptMessage = (text: string, chatId: string): { ciphertext: string; iv: string } => {
  try {
    const keyString = deriveConversationKey(chatId);
    const key = CryptoJS.enc.Hex.parse(keyString);
    const iv = CryptoJS.lib.WordArray.random(16); // 128-bit random IV
    
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: iv.toString(CryptoJS.enc.Hex)
    };
  } catch (error) {
    console.error('[Encryption] Failed to encrypt message:', error);
    return { ciphertext: text, iv: '' }; // Fallback to raw text on error
  }
};

export const decryptMessage = (ciphertext: string, chatId: string, ivHex?: string): string => {
  if (!ivHex || !ciphertext) return ciphertext; // Return raw text if not encrypted or missing IV
  
  try {
    const keyString = deriveConversationKey(chatId);
    const key = CryptoJS.enc.Hex.parse(keyString);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      // Return ciphertext if decryption result is empty (e.g. wrong key/IV or not actually encrypted)
      return '[Encrypted Message]';
    }
    return decryptedText;
  } catch (error) {
    console.error('[Decryption] Failed to decrypt message:', error);
    return '[Decryption Error]';
  }
};
