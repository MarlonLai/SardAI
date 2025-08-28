import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateChatMessage,
  sanitizeInput
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email format', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non valido');
    });

    it('rejects empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('obbligatoria');
    });
  });

  describe('validatePassword', () => {
    it('validates strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
    });

    it('rejects short password', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('6 caratteri');
    });

    it('rejects password without requirements', () => {
      const result = validatePassword('weakpass');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('maiuscola');
    });
  });

  describe('validateChatMessage', () => {
    it('validates normal message', () => {
      const result = validateChatMessage('Ciao, come stai?');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedMessage).toBe('Ciao, come stai?');
    });

    it('rejects empty message', () => {
      const result = validateChatMessage('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vuoto');
    });

    it('rejects too long message', () => {
      const longMessage = 'a'.repeat(5000);
      const result = validateChatMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('troppo lungo');
    });
  });

  describe('sanitizeInput', () => {
    it('removes script tags', () => {
      const malicious = '<script>alert("hack")</script>Hello';
      const result = sanitizeInput(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('removes javascript protocols', () => {
      const malicious = 'javascript:alert("hack")';
      const result = sanitizeInput(malicious);
      expect(result).not.toContain('javascript:');
    });

    it('preserves normal text', () => {
      const normal = 'Ciao, come va tutto?';
      const result = sanitizeInput(normal);
      expect(result).toBe(normal);
    });
  });
});