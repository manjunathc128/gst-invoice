// Pure, layout-agnostic invoice helpers. No PDF or UI concerns here.

export const fmt = (n) => Number(n || 0).toFixed(2);

/** Convert a number to Indian-English words (rupees + paise). */
export function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (n) => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''));
  const threeDigits = (n) => {
    let str = '';
    if (n > 99) { str += a[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n) str += twoDigits(n) + ' ';
    return str;
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let n = rupees;
  let out = '';
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;

  if (crore) out += threeDigits(crore) + 'Crore ';
  if (lakh) out += threeDigits(lakh) + 'Lakh ';
  if (thousand) out += threeDigits(thousand) + 'Thousand ';
  if (n) out += threeDigits(n);

  out = out.trim() + ' Rupees';
  if (paise) out += ' and ' + twoDigits(paise) + ' Paise';
  return out + ' Only';
}

/** Compute per-line and aggregate totals for the invoice. */
export function computeTotals(items, interState) {
  let taxable = 0, cgst = 0, sgst = 0, igst = 0, totalQty = 0, totalTax = 0, amountWithTax = 0;
  const rows = items.map((it) => {
    const qty = parseFloat(it.qty) || 0;
    const rate = parseFloat(it.rate) || 0;
    const disc = parseFloat(it.disc) || 0; // discount % on rate, 0-100
    const gst = parseFloat(it.gst) || 0;
    const effectiveRate = rate * (1 - disc / 100);
    const lineTaxable = qty * effectiveRate;
    const lineTax = (lineTaxable * gst) / 100;
    const lineAmount = lineTaxable + lineTax;

    taxable += lineTaxable;
    totalQty += qty;
    totalTax += lineTax;
    amountWithTax += lineAmount;
    if (interState) igst += lineTax;
    else { cgst += lineTax / 2; sgst += lineTax / 2; }

    return { ...it, qty, rate, disc, gst, effectiveRate, taxable: lineTaxable, tax: lineTax, amount: lineAmount };
  });

  const grand = taxable + cgst + sgst + igst;
  const payable = Math.round(grand);
  const roundOff = payable - grand;
  // Half-rate for CGST/SGST labels, e.g. 18% -> 9.
  const halfRate = rows.length ? rows[0].gst / 2 : 0;
  const fullRate = rows.length ? rows[0].gst : 0;

  return {
    rows, taxable, cgst, sgst, igst, grand, roundOff, payable, interState,
    totalQty, totalTax, amountWithTax, halfRate, fullRate,
  };
}
