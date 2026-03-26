const DANGEROUS_PATTERNS = [
  /os\.system\s*\(/,
  /subprocess\.\w+\s*\(/,
  /(?:^|[\s=,(])eval\s*\(/,
  /(?:^|[\s=,(])exec\s*\(/,
  /__import__\s*\(/,
  /shutil\.rmtree\s*\(/,
  /open\s*\(\s*["']\/(?:etc|usr|bin|sbin|var|tmp|sys|proc)/,
  /open\s*\([^)]*,\s*["'][wa]/,
];

export function scanAndSanitizeCode(code: string): string {
  const lines = code.split("\n");

  const sanitized = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("#")) return line;

    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return `# SECURITY: blocked — ${line.trim()}`;
      }
    }

    return line;
  });

  return sanitized.join("\n");
}
