import { Font, StyleSheet } from '@react-pdf/renderer';

// Register Roboto (served from /public/fonts) so the rupee glyph renders.
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

const DARK = '#1b1b1b';
const LINE = '#000000';
const SOFT = '#9aa0a6';

export const styles = StyleSheet.create({
  page: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    fontSize: 9,
    fontFamily: 'Roboto',
    color: DARK,
    lineHeight: 1.35,
  },

  /* Header */
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.2,
    marginBottom: 4,
  },
  headerLine: { fontSize: 8.5, textAlign: 'center', lineHeight: 1.3, marginBottom: 2 },
  headerMeta: { fontSize: 8.5, textAlign: 'center', lineHeight: 1.3 },

  /* Thick rules + meta band */
  thickRule: { borderBottomWidth: 2.5, borderBottomColor: LINE, marginTop: 8 },
  metaBand: {
    flexDirection: 'row',
    backgroundColor: '#ececec',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  metaCell: { flexDirection: 'row', width: '33.33%' },
  metaLabel: { fontWeight: 'bold' },

  /* Parties */
  parties: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 2 },
  partyCol: { width: '36%', paddingRight: 8 },
  poCol: { width: '28%' },
  partyHeading: { fontSize: 9, letterSpacing: 0.5, marginBottom: 3 },
  partyName: { fontWeight: 'bold', marginBottom: 2 },

  thinRule: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 8 },

  /* Items table */
  itemsHeader: { flexDirection: 'row', paddingBottom: 4 },
  itemsRow: { flexDirection: 'row', paddingVertical: 6 },
  hCell: { fontSize: 9, letterSpacing: 0.3 },
  cItems: { width: '38%' },
  cHsn: { width: '13%', textAlign: 'right' },
  cQty: { width: '12%', textAlign: 'right' },
  cRate: { width: '13%', textAlign: 'right' },
  cTax: { width: '12%', textAlign: 'right' },
  cAmt: { width: '12%', textAlign: 'right' },
  taxPct: { fontSize: 6.5, color: SOFT, textAlign: 'right' },

  /* Subtotal */
  subtotalRule: { borderBottomWidth: 1, borderBottomColor: LINE, marginTop: 60 },
  subtotalRow: { flexDirection: 'row', paddingVertical: 5 },
  subtotalLabel: { width: '38%', fontWeight: 'bold' },
  subtotalBold: { fontWeight: 'bold' },

  /* Bottom split */
  bottom: { flexDirection: 'row', borderTopWidth: 2.5, borderTopColor: LINE, paddingTop: 8 },
  bottomLeft: { width: '50%', paddingRight: 12 },
  bottomRight: { width: '50%', paddingLeft: 12 },

  sectionTitle: { fontWeight: 'bold', marginBottom: 3 },
  kv: { marginBottom: 1 },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
  totalDivider: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 4 },
  grandLabel: { fontWeight: 'bold' },
  grandValue: { fontWeight: 'bold' },
  words: { textAlign: 'right', marginTop: 8 },
  wordsLabel: { color: '#333', marginBottom: 1 },

  systemNote: { marginTop: 16, fontSize: 8, color: SOFT },
});
