import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

/**
 * Verify webhook signature for Twitter, LinkedIn, Reddit
 */
export function verifyWebhookSignature(
  signature: string | null,
  body: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  if (!signature) {
    logger.warn('Webhook verification: Missing signature');
    return false;
  }

  try {
    const expectedSignature = createHmac(algorithm, secret)
      .update(body)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
      logger.warn('Webhook verification: Signature length mismatch');
      return false;
    }

    const isValid = timingSafeEqual(sigBuffer, expectedBuffer);
    
    if (!isValid) {
      logger.warn('Webhook verification: Invalid signature');
    }

    return isValid;
  } catch (error) {
    logger.error('Webhook verification: Error', { error });
    return false;
  }
}

/**
 * Twitter CRC verification (for webhook registration)
 */
export function verifyTwitterCRC(crcToken: string, consumerSecret: string): string {
  const hmac = createHmac('sha256', consumerSecret);
  hmac.update(crcToken);
  return hmac.digest('base64');
}

/**
 * Generate webhook signature (for testing)
 */
export function generateWebhookSignature(body: string, secret: string, algorithm: 'sha256' | 'sha1' = 'sha256'): string {
  return createHmac(algorithm, secret)
    .update(body)
    .digest('hex');
}

/**
 * Verify GitHub style webhook (for future use)
 */
export function verifyGitHubWebhook(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature) return false;

  // GitHub uses "sha256=..." format
  const parts = signature.split('=');
  if (parts.length !== 2) return false;

  const algorithm = parts[0];
  const providedHash = parts[1];

  const expectedHash = createHmac(algorithm, secret)
    .update(body)
    .digest('hex');

  return timingSafeEqual(
    Buffer.from(providedHash),
    Buffer.from(expectedHash)
  );
}
