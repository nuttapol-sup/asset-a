import * as OTPAuth from 'otpauth';

const ISSUER = 'ระบบคุมครุภัณฑ์ TMD';

export function generateMfaSecret(username: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  return {
    secret: secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function verifyTotpCode(secretBase32: string, token: string): boolean {
  try {
    const cleanToken = token.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32.trim().toUpperCase()),
    });

    const delta = totp.validate({ token: cleanToken, window: 1 });
    return delta !== null;
  } catch (err) {
    console.error('Error verifying TOTP code:', err);
    return false;
  }
}
