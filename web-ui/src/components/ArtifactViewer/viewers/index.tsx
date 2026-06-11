import { Suspense, lazy } from 'react';
import { apiClient } from '../../../api/client';
import { pickRenderer } from './extensions';
import { BinaryFallback } from './BinaryFallback';
import { ImageViewer } from './ImageViewer';
import { PdfViewer } from './PdfViewer';
import { MarkdownViewer } from './MarkdownViewer';
import { HtmlViewer } from './HtmlViewer';
import { CsvViewer } from './CsvViewer';

const MonacoViewer = lazy(() =>
  import('./MonacoViewer').then(m => ({ default: m.MonacoViewer })),
);
const ExcelViewer = lazy(() =>
  import('./ExcelViewer').then(m => ({ default: m.ExcelViewer })),
);

interface Props {
  convId: number;
  path: string;
  name: string;
  ext: string;
}

function Fallback() {
  return <div className="p-4 text-xs font-mono text-ink/45">Loading viewer…</div>;
}

export function ViewerDispatcher({ convId, path, name, ext }: Props) {
  const url = apiClient.readFsUrl(convId, path);
  const kind = pickRenderer(ext);
  switch (kind) {
    case 'csv':
      return <CsvViewer convId={convId} path={path} />;
    case 'excel':
      return (
        <Suspense fallback={<Fallback />}>
          <ExcelViewer convId={convId} path={path} />
        </Suspense>
      );
    case 'image':
      return <ImageViewer url={url} name={name} />;
    case 'pdf':
      return <PdfViewer url={url} name={name} />;
    case 'markdown':
      return <MarkdownViewer convId={convId} path={path} />;
    case 'html':
      return <HtmlViewer convId={convId} path={path} />;
    case 'monaco':
      return (
        <Suspense fallback={<Fallback />}>
          <MonacoViewer convId={convId} path={path} />
        </Suspense>
      );
    case 'binary':
    default:
      return <BinaryFallback convId={convId} path={path} url={url} />;
  }
}
