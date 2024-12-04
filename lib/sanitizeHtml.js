/**
 * Edge functions-compatible HTML sanitization utility
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text with HTML and dangerous characters removed
 */
export const sanitizeHtml = (text) => {
  if (typeof text !== 'string') return '';
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Encode special characters
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
    
  // Remove control characters and potentially dangerous Unicode characters
  text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  return text.trim();
};

/**
 * Additional utility to decode HTML entities if needed
 * @param {string} text - The text with HTML entities to decode
 * @returns {string} Text with HTML entities decoded
 */
export const decodeHtmlEntities = (text) => {
  if (typeof text !== 'string') return '';
  
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#39;': "'",
    '&#34;': '"',
  };
  
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
};

/**
 * Strips all HTML tags and content between them
 * @param {string} text - The text to strip
 * @returns {string} Text with all HTML removed
 */
export const stripHtml = (text) => {
  if (typeof text !== 'string') return '';
  
  // First remove scripts and style tags and their content
  text = text.replace(/<(script|style)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  
  // Then remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

/**
 * Sanitizes a text for safe usage in HTML attributes
 * @param {string} text - The text to sanitize
 * @returns {string} Text safe for use in HTML attributes
 */
export const sanitizeAttribute = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/[^\w\s-]/g, '')  // Remove special characters
    .trim()
    .replace(/\s+/g, '-')      // Replace whitespace with hyphens
    .toLowerCase();
};

export default {
  sanitizeHtml,
  decodeHtmlEntities,
  stripHtml,
  sanitizeAttribute
};
