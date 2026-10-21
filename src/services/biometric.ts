// Web Authentication API (WebAuthn) Biometric Service for Fingerprint & Face Unlock

export class BiometricService {
  /**
   * Check if the device has a platform biometric authenticator (fingerprint/face)
   */
  static async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false;
    }

    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      }
      return false;
    } catch (e) {
      console.warn('Biometric availability check error:', e);
      return false;
    }
  }

  /**
   * Register device biometric authenticator (fingerprint / face ID)
   */
  static async register(userName: string = 'AuraSpend User'): Promise<{
    success: boolean;
    credentialId?: string;
    error?: string;
  }> {
    const isAvail = await this.isAvailable();
    if (!isAvail) {
      return {
        success: false,
        error: 'Biometric hardware (fingerprint/face unlock) is not available or not configured on this device.',
      };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      // Clean hostname for RP ID (remove port if any)
      const hostname = window.location.hostname;

      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'AuraSpend Ledger',
          ...(hostname && hostname !== 'localhost' ? { id: hostname } : {}),
        },
        user: {
          id: userId,
          name: userName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'auraspend_user',
          displayName: userName || 'AuraSpend User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // built-in fingerprint / face sensor
          userVerification: 'required', // forces fingerprint / biometric verification
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        return { success: false, error: 'Biometric registration was not completed.' };
      }

      // Convert rawId to Base64 string for persistent storage
      const rawIdBuffer = new Uint8Array(credential.rawId);
      const base64Id = btoa(String.fromCharCode(...rawIdBuffer));

      return {
        success: true,
        credentialId: base64Id,
      };
    } catch (err: any) {
      console.warn('Biometric registration error:', err);
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric prompt was cancelled or timed out.' };
      }
      return { success: false, error: err.message || 'Failed to register biometric authenticator.' };
    }
  }

  /**
   * Verify identity via device biometric authenticator (fingerprint / face ID)
   */
  static async verify(credentialId?: string): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined' || !navigator.credentials) {
      return { success: false, error: 'Web Authentication is not supported in this browser.' };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const hostname = window.location.hostname;

      let allowCredentials: PublicKeyCredentialDescriptor[] | undefined = undefined;
      if (credentialId) {
        try {
          const binaryStr = atob(credentialId);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          allowCredentials = [
            {
              type: 'public-key',
              id: bytes,
              transports: ['internal'],
            },
          ];
        } catch {
          // If decoding fails, proceed without allowCredentials filter
        }
      }

      const getOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: hostname && hostname !== 'localhost' ? hostname : undefined,
        userVerification: 'required', // forces biometric verification on device
        timeout: 60000,
        allowCredentials,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: getOptions,
      })) as PublicKeyCredential | null;

      if (assertion) {
        return { success: true };
      }

      return { success: false, error: 'Biometric verification failed.' };
    } catch (err: any) {
      console.warn('Biometric verification error:', err);
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric authentication was cancelled.' };
      }
      return { success: false, error: err.message || 'Biometric verification could not be completed.' };
    }
  }
}
