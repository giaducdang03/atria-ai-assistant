export type RendererKind =
  | 'monaco'
  | 'csv'
  | 'excel'
  | 'image'
  | 'pdf'
  | 'markdown'
  | 'html'
  | 'binary';

const IMAGE_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico',
]);

const MONACO_LANG: Record<string, string> = {
  '.py': 'python',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'ini',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.sql': 'sql',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.rs': 'rust',
  '.go': 'go',
  '.rb': 'ruby',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'cpp',
  '.xml': 'xml',
  '.ini': 'ini',
  '.env': 'shell',
  '.dockerfile': 'dockerfile',
  '.makefile': 'makefile',
  '.txt': 'plaintext',
  '.log': 'plaintext',
};

export function pickRenderer(ext: string): RendererKind {
  const e = ext.toLowerCase();
  if (e === '.csv') return 'csv';
  if (e === '.xlsx' || e === '.xls') return 'excel';
  if (IMAGE_EXTS.has(e)) return 'image';
  if (e === '.pdf') return 'pdf';
  if (e === '.md' || e === '.markdown') return 'markdown';
  if (e === '.html' || e === '.htm') return 'html';
  if (e in MONACO_LANG) return 'monaco';
  return 'binary';
}

export function monacoLanguageFor(ext: string): string {
  return MONACO_LANG[ext.toLowerCase()] ?? 'plaintext';
}
