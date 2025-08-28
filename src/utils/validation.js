/**
 * Validation utilities for forms and user input
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'L\'email è obbligatoria' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Formato email non valido' };
  }
  
  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'La password è obbligatoria' };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: 'La password deve essere di almeno 6 caratteri' };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { 
      isValid: false, 
      error: 'La password deve contenere almeno una lettera minuscola, una maiuscola e un numero' 
    };
  }
  
  return { isValid: true };
};

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Il nome è obbligatorio' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Il nome deve essere di almeno 2 caratteri' };
  }
  
  return { isValid: true };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const validateChatMessage = (message) => {
  if (!message || !message.trim()) {
    return { isValid: false, error: 'Il messaggio non può essere vuoto' };
  }
  
  if (message.length > 4000) {
    return { isValid: false, error: 'Il messaggio è troppo lungo (max 4000 caratteri)' };
  }
  
  const sanitized = sanitizeInput(message);
  return { isValid: true, sanitizedMessage: sanitized };
};