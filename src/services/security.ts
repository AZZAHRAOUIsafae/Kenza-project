/**
 * Utilitaires de Sécurité et Masquage des Clés d'API
 * Garantit qu'aucun token, secret d'API ou credential n'est jamais exposé en clair dans le code,
 * les logs console, les retours JSON ou l'interface utilisateur.
 */

export function maskApiKey(key?: string): string {
  if (!key || key.trim() === '') {
    return '[ENV_NON_DÉFINI]';
  }
  const clean = key.trim();
  if (clean.length <= 8) {
    return '••••••••';
  }
  return `${clean.substring(0, 3)}••••••••${clean.slice(-3)}`;
}

export function maskHeaders(headers: Record<string, string | undefined>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (!v) continue;
    const lower = k.toLowerCase();
    if (lower.includes('auth') || lower.includes('key') || lower.includes('token') || lower.includes('secret')) {
      sanitized[k] = maskApiKey(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export function isSecureProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
