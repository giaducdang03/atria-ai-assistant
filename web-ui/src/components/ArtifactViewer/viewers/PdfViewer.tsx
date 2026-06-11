interface Props { url: string; name: string }

export function PdfViewer({ url, name }: Props) {
  return (
    <iframe
      src={url}
      title={name}
      className="w-full h-full border-0"
    />
  );
}
