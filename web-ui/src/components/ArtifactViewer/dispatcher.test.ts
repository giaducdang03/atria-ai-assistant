import { describe, it, expect } from 'vitest';
import { pickRenderer, monacoLanguageFor } from './viewers/extensions';

describe('pickRenderer', () => {
  it('routes csv to csv', () => {
    expect(pickRenderer('.csv')).toBe('csv');
  });
  it('routes xlsx/xls to excel', () => {
    expect(pickRenderer('.xlsx')).toBe('excel');
    expect(pickRenderer('.xls')).toBe('excel');
  });
  it('routes images to image', () => {
    for (const e of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico']) {
      expect(pickRenderer(e)).toBe('image');
    }
  });
  it('routes pdf to pdf', () => {
    expect(pickRenderer('.pdf')).toBe('pdf');
  });
  it('routes md/markdown to markdown', () => {
    expect(pickRenderer('.md')).toBe('markdown');
    expect(pickRenderer('.markdown')).toBe('markdown');
  });
  it('routes known text/code to monaco', () => {
    for (const e of ['.py', '.ts', '.tsx', '.json', '.yaml', '.sh', '.sql', '.css', '.txt']) {
      expect(pickRenderer(e)).toBe('monaco');
    }
  });
  it('routes html/htm to html', () => {
    expect(pickRenderer('.html')).toBe('html');
    expect(pickRenderer('.htm')).toBe('html');
  });
  it('routes unknown extension to binary', () => {
    expect(pickRenderer('.zzz')).toBe('binary');
    expect(pickRenderer('')).toBe('binary');
  });
});

describe('monacoLanguageFor', () => {
  it('maps known extensions', () => {
    expect(monacoLanguageFor('.py')).toBe('python');
    expect(monacoLanguageFor('.ts')).toBe('typescript');
    expect(monacoLanguageFor('.json')).toBe('json');
  });
  it('falls back to plaintext', () => {
    expect(monacoLanguageFor('.unknownext')).toBe('plaintext');
  });
});
