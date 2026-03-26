const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|context)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|context)/gi,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|context)/gi,
  /override\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|context)/gi,
  /you\s+are\s+now\s+/gi,
  /act\s+as\s+(if\s+you\s+are|a)\s+/gi,
  /pretend\s+(you\s+are|to\s+be)\s+/gi,
  /new\s+instructions?:/gi,
  /system\s*prompt:/gi,
  /reveal\s+(your|the)\s+(system\s+)?prompt/gi,
  /output\s+(your|the)\s+(system\s+)?prompt/gi,
  /what\s+(is|are)\s+your\s+(system\s+)?instructions/gi,
];

const ROLE_MARKERS = [
  /<\|system\|>/g,
  /<\|user\|>/g,
  /<\|assistant\|>/g,
  /<\|endoftext\|>/g,
  /\[INST\]/g,
  /\[\/INST\]/g,
  /<<SYS>>/g,
  /<\/SYS>>/g,
];

export function sanitizePaperContent(text: string): string {
  if (!text) return "";

  let sanitized = text;

  sanitized = sanitized.replace(/[\x00-\x08\x0e-\x1f\x7f]/g, "");

  for (const marker of ROLE_MARKERS) {
    sanitized = sanitized.replace(marker, "");
  }

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[content removed]");
  }

  return sanitized;
}
