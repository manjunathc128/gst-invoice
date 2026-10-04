import { useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import {
  ActionIcon, Alert, AppShell, Avatar, Badge, Button, Card, Checkbox, Divider, Grid,
  Group, Modal, NumberInput, Select, SimpleGrid, Stack, Text, TextInput, Textarea,
  ThemeIcon, Title,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';
import { computeTotals, numberToWords, fmt } from '../utils/invoiceCalc.js';
import { STATE_OPTIONS, STATE_CODE_BY_NAME } from '../data/states.js';
import InvoiceDocument from '../pdf/InvoiceDocument.jsx';
import PdfPreview from '../pdf/PdfPreview.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);
const blankItem = () => ({ desc: '', hsn: '', qty: '', rate: '', disc: '', gst: '' });
const GST_OPTIONS = ['0', '0.25', '3', '5', '12', '18', '28'];

// PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F). Optional field.
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const validatePan = (v) => (!v || PAN_RE.test(v.trim().toUpperCase()) ? null : 'Invalid PAN (e.g. ABCDE1234F)');

export default function InvoiceGenerator() {
  const { user, logout } = useAuth();
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      seller: {
        name: '',
        address: '',
        gstin: '',
        pan: '',
        state: '',
        stateCode: '',
        email: '',
        phone: '',
      },
      buyer: {
        name: '',
        address: '',
        mobile: '',
        gstin: '',
        pan: '',
        state: '',
        stateCode: '',
      },
      ship: {
        name: '',
        address: '',
        mobile: '',
        gstin: '',
        pan: '',
        state: '',
        stateCode: '',
      },
      meta: {
        invoiceNo: '',
        invoiceDate: todayISO(),
        dueDate: '',
        poNumber: '',
        challanNo: '',
      },
      interState: false,
      items: [blankItem()],
      bank: { name: '', ifsc: '', account: '', bank: '' },
    },
    validate: {
      seller: {
        name: (v) => (v?.trim() ? null : 'Company name is required'),
        gstin: (v) => (v?.trim() ? null : 'Seller GSTIN is required'),
        pan: validatePan,
        email: (v) => (!v || /^\S+@\S+\.\S+$/.test(v) ? null : 'Invalid email'),
      },
      buyer: {
        name: (v) => (v?.trim() ? null : 'Buyer name is required'),
        pan: validatePan,
        state: (v) => (v ? null : 'Select a state'),
      },
      ship: {
        pan: validatePan,
      },
      meta: {
        invoiceNo: (v) => (v?.trim() ? null : 'Invoice number is required'),
        invoiceDate: (v) => (v ? null : 'Invoice date is required'),
      },
      items: {
        desc: (v) => (v?.trim() ? null : 'Description required'),
        qty: (v) => (Number(v) > 0 ? null : 'Qty > 0'),
        rate: (v) => (Number(v) >= 0 ? null : 'Invalid rate'),
      },
    },
  });

  const values = form.getValues();
  const { interState, items } = values;

  const totals = useMemo(() => computeTotals(items, interState), [items, interState]);
  const invoiceData = values;
  const isValid = form.isValid();

  // When a state is picked, auto-fill the matching GST code.
  const handleStateChange = (party, stateName) => {
    form.setFieldValue(`${party}.state`, stateName || '');
    form.setFieldValue(`${party}.stateCode`, stateName ? STATE_CODE_BY_NAME[stateName] || '' : '');
  };

  const addItem = () => form.insertListItem('items', blankItem());
  const removeItem = (idx) => form.removeListItem('items', idx);

  return (
    <AppShell header={{ height: 72 }} padding="md">
      <AppShell.Header
        style={{
          border: 'none',
          color: '#fff',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #4f46e5 100%)',
          boxShadow: '0 2px 12px rgba(37, 99, 235, 0.35)',
        }}
      >
        <Group h="100%" px="lg" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon
              size={44}
              radius="md"
              variant="white"
              color="indigo"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            >
              <InvoiceIcon />
            </ThemeIcon>
            <div>
              <Group gap={8} align="center">
                <Title order={4} c="white" fw={700} lh={1.1}>GST Tax Invoice Generator</Title>
                <Badge variant="white" color="indigo" size="sm" radius="sm">GST</Badge>
              </Group>
              <Text size="xs" c="blue.1">Fill in details and download a print-ready PDF.</Text>
            </div>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Group gap={8} wrap="nowrap" visibleFrom="xs">
              <Avatar color="indigo" variant="white" radius="xl" size={34}>
                {(user || '?').slice(0, 1).toUpperCase()}
              </Avatar>
              <div style={{ lineHeight: 1.1 }}>
                <Text size="xs" c="blue.1">Signed in as</Text>
                <Text size="sm" c="white" fw={600}>{user}</Text>
              </div>
            </Group>
            <Button variant="white" color="indigo" radius="md" onClick={logout}>Logout</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Grid gutter="md" align="flex-start">
          {/* FORM */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Card withBorder radius="md" padding="lg">
                <Title order={5} mb="sm">Seller (Your Company)</Title>
                <Stack gap="sm">
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Company Name" withAsterisk placeholder="e.g. Acme Pvt Ltd" {...form.getInputProps('seller.name')} />
                    <TextInput label="GSTIN" withAsterisk placeholder="15-digit GSTIN, e.g. 27ABCDE1234F1Z5" {...form.getInputProps('seller.gstin')} />
                  </SimpleGrid>
                  <TextInput label="PAN" placeholder="10-char PAN, e.g. ABCDE1234F" {...form.getInputProps('seller.pan')} />
                  <Textarea label="Address" autosize minRows={2} placeholder="Street, city, pincode" {...form.getInputProps('seller.address')} />
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Select
                      label="State"
                      searchable
                      clearable
                      placeholder="Select your state"
                      data={STATE_OPTIONS}
                      value={values.seller.state}
                      onChange={(v) => handleStateChange('seller', v)}
                    />
                    <TextInput label="State Code" readOnly placeholder="Auto-filled from state" {...form.getInputProps('seller.stateCode')} />
                  </SimpleGrid>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Email" placeholder="billing@company.com" {...form.getInputProps('seller.email')} />
                    <TextInput label="Phone" placeholder="+91 98765 43210" {...form.getInputProps('seller.phone')} />
                  </SimpleGrid>
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Title order={5} mb="sm">Invoice Details</Title>
                <Stack gap="sm">
                  <SimpleGrid cols={{ base: 1, sm: 3 }}>
                    <TextInput label="Invoice No." withAsterisk placeholder="e.g. SAE/2026-27/02" {...form.getInputProps('meta.invoiceNo')} />
                    <TextInput type="date" label="Invoice Date" withAsterisk {...form.getInputProps('meta.invoiceDate')} />
                    <TextInput type="date" label="Due Date" {...form.getInputProps('meta.dueDate')} />
                  </SimpleGrid>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="P.O. Number" placeholder="Purchase order no. (optional)" {...form.getInputProps('meta.poNumber')} />
                    <TextInput label="Challan / Reference" placeholder="Challan or reference no. (optional)" {...form.getInputProps('meta.challanNo')} />
                  </SimpleGrid>
                  <Checkbox
                    label="Inter-state supply (use IGST instead of CGST + SGST)"
                    {...form.getInputProps('interState', { type: 'checkbox' })}
                  />
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Title order={5} mb="sm">Bill To (Buyer)</Title>
                <Stack gap="sm">
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Name" withAsterisk placeholder="Customer / company name" {...form.getInputProps('buyer.name')} />
                    <TextInput label="GSTIN" placeholder="Buyer GSTIN (if registered)" {...form.getInputProps('buyer.gstin')} />
                  </SimpleGrid>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="PAN" placeholder="10-char PAN, e.g. ABCDE1234F" {...form.getInputProps('buyer.pan')} />
                    <TextInput label="Mobile" placeholder="Buyer contact number" {...form.getInputProps('buyer.mobile')} />
                  </SimpleGrid>
                  <Textarea label="Address" autosize minRows={2} placeholder="Billing address" {...form.getInputProps('buyer.address')} />
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Select
                      label="State"
                      withAsterisk
                      searchable
                      placeholder="Select buyer state"
                      data={STATE_OPTIONS}
                      value={values.buyer.state}
                      onChange={(v) => handleStateChange('buyer', v)}
                      error={form.errors['buyer.state']}
                    />
                    <TextInput label="State Code" readOnly placeholder="Auto-filled from state" {...form.getInputProps('buyer.stateCode')} />
                  </SimpleGrid>
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Title order={5} mb={4}>Ship To</Title>
                <Text c="dimmed" size="xs" mb="sm">Leave blank to use Bill To.</Text>
                <Stack gap="sm">
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Name" placeholder="Consignee name (defaults to buyer)" {...form.getInputProps('ship.name')} />
                    <TextInput label="GSTIN" placeholder="Consignee GSTIN (if registered)" {...form.getInputProps('ship.gstin')} />
                  </SimpleGrid>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="PAN" placeholder="10-char PAN, e.g. ABCDE1234F" {...form.getInputProps('ship.pan')} />
                    <TextInput label="Mobile" placeholder="Consignee contact number" {...form.getInputProps('ship.mobile')} />
                  </SimpleGrid>
                  <Textarea label="Address" autosize minRows={2} placeholder="Shipping address (defaults to buyer)" {...form.getInputProps('ship.address')} />
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Select
                      label="State"
                      searchable
                      clearable
                      placeholder="Select ship-to state"
                      data={STATE_OPTIONS}
                      value={values.ship.state}
                      onChange={(v) => handleStateChange('ship', v)}
                      error={form.errors['ship.state']}
                    />
                    <TextInput label="State Code" readOnly placeholder="Auto-filled from state" {...form.getInputProps('ship.stateCode')} />
                  </SimpleGrid>
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Title order={5} mb="sm">Line Items</Title>
                <Stack gap="sm">
                  {items.map((it, idx) => (
                    <Card key={idx} withBorder radius="sm" padding="sm" bg="gray.0">
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={600} c="dimmed">Item {idx + 1}</Text>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          aria-label="Remove item"
                        >
                          ×
                        </ActionIcon>
                      </Group>

                      {/* Stacks to 1 column on mobile, flows into columns on wider screens */}
                      <TextInput
                        label="Description"
                        placeholder="Item / service description"
                        {...form.getInputProps(`items.${idx}.desc`)}
                      />
                      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} mt="sm">
                        <TextInput
                          label="HSN/SAC"
                          placeholder="HSN/SAC"
                          {...form.getInputProps(`items.${idx}.hsn`)}
                        />
                        <NumberInput
                          label="Qty"
                          placeholder="0"
                          min={0}
                          {...form.getInputProps(`items.${idx}.qty`)}
                        />
                        <NumberInput
                          label="Rate (₹)"
                          placeholder="0.00"
                          min={0}
                          {...form.getInputProps(`items.${idx}.rate`)}
                        />
                        <NumberInput
                          label="Disc %"
                          placeholder="0"
                          min={0}
                          max={100}
                          clampBehavior="strict"
                          {...form.getInputProps(`items.${idx}.disc`)}
                        />
                        <Select
                          label="GST %"
                          placeholder="Select"
                          data={GST_OPTIONS}
                          {...form.getInputProps(`items.${idx}.gst`)}
                        />
                      </SimpleGrid>
                    </Card>
                  ))}
                  <Group>
                    <Button variant="light" onClick={addItem}>+ Add Item</Button>
                  </Group>
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Title order={5} mb="sm">Bank Details &amp; Payment</Title>
                <Stack gap="sm">
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Account Name" placeholder="Account holder name" {...form.getInputProps('bank.name')} />
                    <TextInput label="IFSC Code" placeholder="e.g. HDFC0001234" {...form.getInputProps('bank.ifsc')} />
                  </SimpleGrid>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput label="Account No." placeholder="Bank account number" {...form.getInputProps('bank.account')} />
                    <TextInput label="Bank" placeholder="Bank name & branch" {...form.getInputProps('bank.bank')} />
                  </SimpleGrid>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>

          {/* PREVIEW */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md" style={{ position: 'sticky', top: 80 }}>
              <Card withBorder radius="md" padding="lg">
                <Title order={5} mb="sm">Summary</Title>
                <Stack gap={6}>
                  <SummaryRow label="Taxable Amount" value={fmt(totals.taxable)} />
                  {interState ? (
                    <SummaryRow label="IGST" value={fmt(totals.igst)} />
                  ) : (
                    <>
                      <SummaryRow label="CGST" value={fmt(totals.cgst)} />
                      <SummaryRow label="SGST" value={fmt(totals.sgst)} />
                    </>
                  )}
                  <SummaryRow label="Round Off" value={fmt(totals.roundOff)} />
                  <Divider />
                  <Group justify="space-between">
                    <Text fw={700}>Total Payable</Text>
                    <Text fw={700}>₹ {fmt(totals.payable)}</Text>
                  </Group>
                  <Text size="xs" c="dimmed" fs="italic">{numberToWords(totals.payable)}</Text>
                </Stack>

                {!isValid && (
                  <Alert color="yellow" variant="light" mt="md">
                    Complete the required fields to enable download.
                  </Alert>
                )}

                <Button variant="light" fullWidth mt="md" onClick={openPreview}>
                  Preview full screen
                </Button>

                {isValid ? (
                  <PDFDownloadLink
                    document={<InvoiceDocument data={invoiceData} />}
                    fileName={`${values.meta.invoiceNo || 'invoice'}.pdf`}
                    style={{ textDecoration: 'none', display: 'block', marginTop: 12 }}
                  >
                    {({ loading }) => (
                      <Button fullWidth loading={loading}>
                        {loading ? 'Preparing PDF…' : 'Download PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <Button fullWidth mt="sm" onClick={() => form.validate()}>
                    Validate Form
                  </Button>
                )}
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Group justify="space-between" mb="sm">
                  <Title order={5}>Live Preview</Title>
                  <Button size="xs" variant="subtle" onClick={openPreview}>Expand</Button>
                </Group>
                <PdfPreview data={invoiceData} height={480} />
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        <Modal
          opened={previewOpened}
          onClose={closePreview}
          title="Invoice Preview"
          centered
          size="90%"
          withCloseButton
        >
          {previewOpened && <PdfPreview data={invoiceData} height="75vh" />}
        </Modal>
      </AppShell.Main>
    </AppShell>
  );
}

function SummaryRow({ label, value }) {
  return (
    <Group justify="space-between">
      <Text size="sm">{label}</Text>
      <Text size="sm">{value}</Text>
    </Group>
  );
}

function InvoiceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  );
}
