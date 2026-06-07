import { Request, Response, NextFunction } from 'express';

// Recursively sanitize objects to prevent NoSQL injection (e.g. keys containing $ or .)
const sanitizeInput = (obj: any): any => {
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeInput(obj[i]);
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        obj[key] = sanitizeInput(obj[key]);
      }
    }
  }
  return obj;
};

// Escape common HTML entities to prevent basic XSS scripts
const escapeXSS = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const sanitizeXSSFields = (obj: any): any => {
  if (typeof obj === 'string') {
    return escapeXSS(obj);
  } else if (obj instanceof Array) {
    return obj.map(sanitizeXSSFields);
  } else if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = sanitizeXSSFields(obj[key]);
    }
  }
  return obj;
};

export const mongoSanitize = (req: Request, res: Response, next: NextFunction) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};

export const xssSanitize = (req: Request, res: Response, next: NextFunction) => {
  // We sanitize body only, preserving binary file uploads from parsing issues
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeXSSFields(req.body);
  }
  next();
};
