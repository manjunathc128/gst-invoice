import { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Center, Loader, Text } from '@mantine/core';
import InvoiceDocument from './InvoiceDocument.jsx';

// Renders a live PDF preview by generating the document to a blob and showing
// it in a plain <iframe>. This avoids @react-pdf's <PDFViewer>, whose native
// browser-plugin embedding renders blank/dark in some browsers.
export default function PdfPreview({ data, height = 480 }) {
  const [instance, update] = usePDF({ document: <InvoiceDocument data={data} /> });

  // Re-render the PDF when the invoice data changes. Debounced so typing in the
  // form doesn't trigger a regenerate on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      update(<InvoiceDocument data={data} />);
    }, 400);
    return () => clearTimeout(id);
  }, [data, update]);

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

  return (
    <iframe
      title="Invoice preview"
      src={instance.url || undefined}
      style={{ width: '100%', height, border: 0 }}
    />
  );
}
