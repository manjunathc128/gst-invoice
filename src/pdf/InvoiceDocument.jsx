import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from './invoiceStyles.js';
import { computeTotals, numberToWords, fmt } from '../utils/invoiceCalc.js';

const RUPEE = '\u20B9';
const money = (n) => `${RUPEE} ${fmt(n)}`;

function MetaCell({ label, value }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label} </Text>
      <Text>{value}</Text>
    </View>
  );
}

function TotalRow({ label, value, bold }) {
  return (
    <View style={styles.totalRow}>
      <Text style={bold ? styles.grandLabel : null}>{label}</Text>
      <Text style={bold ? styles.grandValue : null}>{value}</Text>
    </View>
  );
}

export default function InvoiceDocument({ data }) {
  const { seller, buyer, ship, meta, items, interState, bank = {} } = data;
  const t = computeTotals(items, interState);

  // Ship To falls back to Bill To per-field when left blank.
  const shipTo = {
    name: ship.name || buyer.name,
    address: ship.address || buyer.address,
    mobile: ship.mobile || buyer.mobile,
    gstin: ship.gstin || buyer.gstin,
    pan: ship.pan || buyer.pan,
    state: ship.state || buyer.state,
    stateCode: ship.stateCode || buyer.stateCode,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.companyName}>{seller.name}</Text>
        <Text style={styles.headerLine}>{seller.address}</Text>
        <Text style={styles.headerMeta}>
          Mobile: {seller.phone}    GSTIN: {seller.gstin}    PAN Number: {seller.pan}
        </Text>

        <View style={styles.thickRule} />

        {/* Meta band */}
        <View style={styles.metaBand}>
          <MetaCell label="Invoice No.:" value={meta.invoiceNo} />
          <MetaCell label="Invoice Date:" value={meta.invoiceDate} />
          <MetaCell label="Due Date:" value={meta.dueDate || ''} />
        </View>
        <View style={styles.thickRule} />

        {/* Parties */}
        <View style={styles.parties}>
          <View style={styles.partyCol}>
            <Text style={styles.partyHeading}>BILL TO</Text>
            <Text style={styles.partyName}>{buyer.name}</Text>
            <Text>{buyer.address}</Text>
            <Text>Mobile: {buyer.mobile || ''}</Text>
            <Text>GSTIN: {buyer.gstin || ''}</Text>
            <Text>PAN Number: {buyer.pan || ''}</Text>
            <Text>Place of Supply: {buyer.state || ''}</Text>
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyHeading}>SHIP TO</Text>
            <Text style={styles.partyName}>{shipTo.name}</Text>
            <Text>{shipTo.address}</Text>
            <Text>Mobile: {shipTo.mobile || ''}</Text>
            <Text>GSTIN: {shipTo.gstin || ''}</Text>
            <Text>PAN Number: {shipTo.pan || ''}</Text>
            <Text>Place of Supply: {shipTo.state || ''}</Text>
          </View>
          <View style={styles.poCol}>
            <Text style={styles.partyHeading}>P.O. No.</Text>
            <Text>{meta.poNumber || ''}</Text>
          </View>
        </View>

        <View style={styles.thinRule} />

        {/* Items header */}
        <View style={styles.itemsHeader}>
          <Text style={[styles.hCell, styles.cItems]}>ITEMS</Text>
          <Text style={[styles.hCell, styles.cHsn]}>HSN</Text>
          <Text style={[styles.hCell, styles.cQty]}>QTY.</Text>
          <Text style={[styles.hCell, styles.cRate]}>RATE</Text>
          <Text style={[styles.hCell, styles.cTax]}>TAX</Text>
          <Text style={[styles.hCell, styles.cAmt]}>AMOUNT</Text>
        </View>

        {/* Items */}
        {t.rows.map((it, i) => (
          <View style={styles.itemsRow} key={i}>
            <Text style={styles.cItems}>{it.desc}</Text>
            <Text style={styles.cHsn}>{it.hsn}</Text>
            <Text style={styles.cQty}>{fmt(it.qty)}</Text>
            <View style={styles.cRate}>
              <Text>{fmt(it.rate)}</Text>
              {it.disc > 0 && <Text style={styles.taxPct}>(-{it.disc}%)</Text>}
            </View>
            <View style={styles.cTax}>
              <Text>{fmt(it.tax)}</Text>
              <Text style={styles.taxPct}>({it.gst}%)</Text>
            </View>
            <Text style={styles.cAmt}>{fmt(it.amount)}</Text>
          </View>
        ))}

        {/* Subtotal */}
        <View style={styles.subtotalRule} />
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>SUBTOTAL</Text>
          <Text style={styles.cHsn}> </Text>
          <Text style={[styles.cQty, styles.subtotalBold]}>{fmt(t.totalQty)}</Text>
          <Text style={styles.cRate}> </Text>
          <Text style={[styles.cTax, styles.subtotalBold]}>{money(t.totalTax)}</Text>
          <Text style={[styles.cAmt, styles.subtotalBold]}>{money(t.amountWithTax)}</Text>
        </View>

        {/* Bottom split */}
        <View style={styles.bottom}>
          <View style={styles.bottomLeft}>
            <Text style={styles.sectionTitle}>BANK DETAILS</Text>
            <Text style={styles.kv}>Name: {bank.name || ''}</Text>
            <Text style={styles.kv}>IFSC Code: {bank.ifsc || ''}</Text>
            <Text style={styles.kv}>Account No: {bank.account || ''}</Text>
            <Text style={styles.kv}>Bank: {bank.bank || ''}</Text>

            <Text style={[styles.systemNote]}>This is a system generated PDF.</Text>
          </View>

          <View style={styles.bottomRight}>
            <TotalRow label="Taxable Amount" value={money(t.taxable)} />
            {interState ? (
              <TotalRow label={`IGST @${t.fullRate}%`} value={money(t.igst)} />
            ) : (
              <>
                <TotalRow label={`CGST @${t.halfRate}%`} value={money(t.cgst)} />
                <TotalRow label={`SGST @${t.halfRate}%`} value={money(t.sgst)} />
              </>
            )}
            <TotalRow label="Round Off" value={money(t.roundOff)} />
            <View style={styles.totalDivider} />
            <TotalRow label="Total Amount" value={fmt(t.payable)} bold />

            <View style={styles.words}>
              <Text style={styles.wordsLabel}>Total Amount (in words)</Text>
              <Text>{numberToWords(t.payable)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
