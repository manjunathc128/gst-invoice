import { useEffect, useRef, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useMediaQuery } from '@mantine/hooks';
import { Button, Center, Group, Loader, ScrollArea, Text } from '@mantine/core';
import InvoiceDocument from './InvoiceDocument.jsx';

// Point PDF.js at its worker. Using react-pdf's bundled pdfjs keeps the worker
// version in sync with the API version automatically.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.25;

// Live PDF preview backed by @react-pdf's usePDF blob.
//
// Rendering strategy differs by device because mobile browsers have no inline
// PDF plugin:
//   - Desktop: an <iframe src={blobUrl}> so users get the browser's native PDF
//     viewer (zoom, print, download, etc.) for free.
//   - Mobile: a PDF.js <canvas> with a custom toolbar, since an iframe would
//     only show an "Open" placeholder there.
export default function PdfPreview({ data, height = 480, fileName = 'invoice.pdf', showToolbar = true }) {
  const [instance, update] = usePDF({ document: <InvoiceDocument data={data} /> });
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Treat small/touch screens as "mobile". Defaults to false on the server /
  // first paint, which is fine for a client-only app.
  const isMobile = useMediaQuery('(max-width: 768px)') ?? false;

  // Regenerate the PDF when invoice data changes, debounced so typing in the
  // form doesn't trigger a regenerate on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      update(<InvoiceDocument data={data} />);
    }, 400);
    return () => clearTimeout(id);
  }, [data, update]);

  // Track container width so canvas pages scale to fit (mobile only).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  const download = () => {
    if (!instance.url) return;
    const a = document.createElement('a');
    a.href = instance.url;
    a.download = fileName;
    a.click();
  };

  const openInNewTab = () => {
    if (instance.url) window.open(instance.url, '_blank', 'noopener');
  };

  const print = () => {
    if (!instance.url) return;
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = instance.url;
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    };
    document.body.appendChild(frame);
  };

  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));

  if (instance.loading && !instance.url) {
    return (
      <Center style={{ height }}>
        <Loader size="sm" />
      </Center>
    );
  }

  if (instance.error) {
    return (
      <Center style={{ height }}>
        <Text c="red" size="sm">Could not render preview: {String(instance.error)}</Text>
      </Center>
    );
  }

  // Desktop: native browser PDF viewer via iframe (brings its own toolbar).
  if (!isMobile) {
    return (
      <iframe
        title="Invoice preview"
        src={instance.url || undefined}
        style={{ width: '100%', height, border: 0 }}
      />
    );
  }

  // Mobile: canvas rendering with a custom toolbar.
  const pageWidth = width ? width * scale : undefined;

  return (
    <div>
      {showToolbar && (
        <Group gap="xs" wrap="wrap" mb="sm">
          <Button size="xs" onClick={download} disabled={!instance.url}>Download</Button>
          <Button size="xs" variant="light" onClick={print} disabled={!instance.url}>Print</Button>
          <Button size="xs" variant="light" onClick={openInNewTab} disabled={!instance.url}>
            Open in new tab
          </Button>
          <Group gap={4} ml="auto">
            <Button size="xs" variant="default" onClick={zoomOut} disabled={scale <= MIN_SCALE}>
              −
            </Button>
            <Text size="xs" w={44} ta="center">{Math.round(scale * 100)}%</Text>
            <Button size="xs" variant="default" onClick={zoomIn} disabled={scale >= MAX_SCALE}>
              +
            </Button>
          </Group>
        </Group>
      )}

      <ScrollArea style={{ height }} type="auto">
        <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }}>
          <Document
            file={instance.url}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={<Center style={{ height }}><Loader size="sm" /></Center>}
            error={<Text c="red" size="sm" ta="center" p="md">Failed to load PDF.</Text>}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={`page_${i + 1}`}
                pageNumber={i + 1}
                width={pageWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            ))}
          </Document>
        </div>
      </ScrollArea>
    </div>
  );
}
