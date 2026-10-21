import { CategoryId, Transaction } from '../types/expense';
import { getCurrentTimeString, getTodayString } from '../utils/formatters';

export interface PhonePeParsedTx {
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  category: CategoryId;
  date: string;
  time: string;
  bankReference?: string;
  matchedAccountId?: string;
  raw?: string;
}

// Indian merchant & keyword category mapping
const MERCHANT_CATEGORY_MAP: Record<string, CategoryId> = {
  // Groceries & Daily Needs
  dmart: 'groceries',
  bigbasket: 'groceries',
  blinkit: 'groceries',
  zepto: 'groceries',
  instamart: 'groceries',
  kirana: 'groceries',
  nature: 'groceries',
  spencer: 'groceries',
  reliance_fresh: 'groceries',
  reliance_retail: 'groceries',
  supermarket: 'groceries',
  milk: 'groceries',
  dairy: 'groceries',
  vegetable: 'groceries',
  fruits: 'groceries',

  // Dining & Food Delivery
  swiggy: 'dining',
  zomato: 'dining',
  starbucks: 'dining',
  mcdonalds: 'dining',
  dominos: 'dining',
  pizza: 'dining',
  cafe: 'dining',
  restaurant: 'dining',
  burger: 'dining',
  subway: 'dining',
  chai: 'dining',
  tea: 'dining',
  food: 'dining',
  baker: 'dining',

  // Transport & Fuel
  uber: 'transport',
  ola: 'transport',
  rapido: 'transport',
  petrol: 'transport',
  fuel: 'transport',
  hpcl: 'transport',
  bpcl: 'transport',
  iocl: 'transport',
  shell: 'transport',
  metro: 'transport',
  toll: 'transport',
  fastag: 'transport',
  parking: 'transport',
  auto: 'transport',
  railway: 'transport',
  irctc: 'transport',

  // Utilities & Recharges
  jio: 'utilities',
  airtel: 'utilities',
  vodafone: 'utilities',
  vi: 'utilities',
  electricity: 'utilities',
  bescom: 'utilities',
  mahadiscom: 'utilities',
  tata_power: 'utilities',
  adani_electricity: 'utilities',
  gas: 'utilities',
  water: 'utilities',
  recharge: 'utilities',
  broadband: 'utilities',
  wifi: 'utilities',
  dth: 'utilities',
  cylinder: 'utilities',

  // Shopping & Retail
  amazon: 'shopping',
  flipkart: 'shopping',
  myntra: 'shopping',
  nykaa: 'shopping',
  ajio: 'shopping',
  zara: 'shopping',
  croma: 'shopping',
  reliance_digital: 'shopping',
  mall: 'shopping',
  clothing: 'shopping',

  // Health & Medicine
  apollo: 'health',
  pharmacy: 'health',
  pharmeasy: 'health',
  netmeds: 'health',
  medplus: 'health',
  hospital: 'health',
  clinic: 'health',
  doctor: 'health',
  diagnostic: 'health',
  lab: 'health',

  // Entertainment
  pvr: 'entertainment',
  inox: 'entertainment',
  bookmyshow: 'entertainment',
  netflix: 'entertainment',
  prime: 'entertainment',
  hotstar: 'entertainment',
  spotify: 'entertainment',
  cinema: 'entertainment',
};

export class PhonePeSyncService {
  /**
   * Launch PhonePe App on mobile via Android Intent / Custom Scheme
   */
  static launchPhonePeApp(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        // Attempt native Android package intent directly for PhonePe
        window.location.href =
          'intent://#Intent;package=com.phonepe.app;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;';
        // Secondary fallback
        setTimeout(() => {
          window.location.href = 'phonepe://';
        }, 500);
      } else {
        // iOS or Desktop fallback
        window.location.href = 'phonepe://';
      }
      return true;
    } catch (e) {
      console.warn('Could not launch PhonePe app intent:', e);
      window.open('https://www.phonepe.com/', '_blank');
      return false;
    }
  }

  /**
   * Read transaction text from system clipboard (e.g. copied from PhonePe app)
   */
  static async readFromClipboard(): Promise<string | null> {
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.readText) {
      return null;
    }
    try {
      const text = await navigator.clipboard.readText();
      return text && text.trim() ? text.trim() : null;
    } catch (err) {
      console.warn('Clipboard read access was blocked or denied:', err);
      return null;
    }
  }

  /**
   * Auto-detect category from transaction description
   */
  static categorize(desc: string): CategoryId {
    const lower = desc.toLowerCase();
    for (const [key, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
      if (lower.includes(key)) {
        return category;
      }
    }
    if (lower.includes('salary') || lower.includes('payroll') || lower.includes('stipend')) return 'salary';
    if (lower.includes('rent') || lower.includes('flat') || lower.includes('maintenance')) return 'housing';
    if (lower.includes('dividend') || lower.includes('zerodha') || lower.includes('groww') || lower.includes('mutual')) return 'investment';
    if (lower.includes('freelance') || lower.includes('consulting') || lower.includes('upwork')) return 'freelance';
    return 'other';
  }

  /**
   * Parse a single PhonePe notification, SMS, WhatsApp receipt, or UPI alert text
   */
  static parsePhonePeAlert(text: string): PhonePeParsedTx | null {
    if (!text || !text.trim()) return null;

    const clean = text.trim();
    const lower = clean.toLowerCase();

    // 1. Detect Type (Debit or Credit)
    // Credit signals
    const isCredit =
      (lower.includes('credited') ||
        lower.includes('received') ||
        lower.includes('cashback') ||
        lower.includes('refund') ||
        lower.includes('deposited') ||
        lower.includes('added to your a/c') ||
        lower.includes('money received')) &&
      !lower.includes('debited') &&
      !lower.includes('paid to') &&
      !lower.includes('sent to');

    const type: 'debit' | 'credit' = isCredit ? 'credit' : 'debit';

    // 2. Extract Amount
    // Matches: Rs 450, Rs. 450, INR 450, ₹450, 450.00
    const amountRegex = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:rs|inr|₹)/i;
    const amountMatch = clean.match(amountRegex);

    let amount = 0;
    if (amountMatch) {
      const numStr = (amountMatch[1] || amountMatch[2] || '').replace(/,/g, '');
      amount = parseFloat(numStr) || 0;
    } else {
      // Decimal match fallback
      const fallbackMatch = clean.match(/\b\d{1,6}(?:\.\d{2})\b/);
      if (fallbackMatch) {
        amount = parseFloat(fallbackMatch[0]) || 0;
      }
    }

    if (!amount || amount <= 0) {
      return null;
    }

    // 3. Extract Merchant / Beneficiary / Sender
    let description = type === 'debit' ? 'PhonePe UPI Payment' : 'PhonePe Transfer Received';
    const paidToMatch = clean.match(/(?:paid to|transfer to|sent to|spent at|to)\s+([A-Za-z0-9\s&'.-]+?)(?:\s+(?:via|on|for|from|ref|utr|rrn|avl)|\.|$)/i);
    const receivedFromMatch = clean.match(/(?:received from|credited by|transfer from|from)\s+([A-Za-z0-9\s&'.-]+?)(?:\s+(?:via|on|for|to|ref|utr|rrn|avl)|\.|$)/i);

    if (type === 'debit' && paidToMatch && paidToMatch[1]) {
      description = paidToMatch[1].trim();
    } else if (type === 'credit' && receivedFromMatch && receivedFromMatch[1]) {
      description = `Received from ${receivedFromMatch[1].trim()}`;
    } else {
      // Try to grab leading merchant phrase before UTR/A/C
      const parts = clean.split(/(?:ref|utr|rrn|a\/c|via)/i)[0];
      if (parts && parts.length > 4 && parts.length < 50) {
        description = parts.trim();
      }
    }

    // Clean up description
    description = description.replace(/^(rs\.?|inr|₹)\s*\d+(\.\d+)?\s*/i, '').trim();
    if (!description || description.length < 2) {
      description = type === 'debit' ? 'PhonePe Payment' : 'PhonePe Transfer Received';
    }

    // 4. Extract UTR / Reference
    const utrMatch = clean.match(/(?:utr|ref|rrn|txn\s*id)[\s:#]+([A-Za-z0-9]+)/i);
    const bankReference = utrMatch ? `UPI/${utrMatch[1]}` : `UPI/PP-${Date.now().toString().slice(-6)}`;

    // 5. Extract bank account hint (e.g. ending 4128 or A/C XX4128)
    const accMatch = clean.match(/(?:a\/c|ac|account|ending|card)\s*(?:no\.?)?\s*(?:ending)?\s*[x*]*(\d{4})/i);
    const matchedAccountId = accMatch ? accMatch[1] : undefined;

    // 6. Category
    const category = this.categorize(description);

    return {
      type,
      amount,
      description,
      category,
      date: getTodayString(),
      time: getCurrentTimeString(),
      bankReference,
      matchedAccountId,
      raw: text,
    };
  }

  /**
   * Parse a PhonePe CSV, Statement text, or multiple alert lines
   */
  static parsePhonePeStatement(content: string): PhonePeParsedTx[] {
    if (!content || !content.trim()) return [];

    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results: PhonePeParsedTx[] = [];

    for (const line of lines) {
      // Skip CSV headers
      if (/^(date|time|transaction|details|type|amount|status|utr|merchant)/i.test(line)) {
        continue;
      }

      if (line.includes(',') || line.includes('\t')) {
        // Delimited row parsing
        const delimiter = line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length >= 2) {
          let foundAmount = 0;
          let foundType: 'debit' | 'credit' = 'debit';
          let foundDesc = 'PhonePe UPI Transaction';
          let foundDate = getTodayString();
          let foundUtr: string | undefined = undefined;

          cols.forEach((col) => {
            // Check for date: YYYY-MM-DD or DD/MM/YYYY or DD-MMM-YYYY
            if (/^\d{4}-\d{2}-\d{2}$/.test(col) || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(col) || /^\d{1,2}-[a-zA-Z]{3}-\d{2,4}$/.test(col)) {
              foundDate = col;
            }
            // Check for type
            if (/^(debit|dr|paid|sent|transfer out)$/i.test(col)) {
              foundType = 'debit';
            } else if (/^(credit|cr|received|refund|cashback|transfer in)$/i.test(col)) {
              foundType = 'credit';
            }
            // Check for amount
            const num = parseFloat(col.replace(/[^0-9.]/g, ''));
            if (!isNaN(num) && num > 0 && num < 10000000 && !col.includes('-') && !col.includes('/')) {
              if (foundAmount === 0) foundAmount = num;
            }
            // Check for description
            if (col.length > 3 && !foundDesc.includes(col) && !col.match(/^\d+$/) && !col.toLowerCase().includes('success')) {
              foundDesc = col;
            }
            // Check for UTR
            if (/^\d{12}$/.test(col) || col.startsWith('UPI')) {
              foundUtr = col.startsWith('UPI') ? col : `UPI/${col}`;
            }
          });

          if (foundAmount > 0) {
            results.push({
              type: foundType,
              amount: foundAmount,
              description: foundDesc,
              category: this.categorize(foundDesc),
              date: foundDate,
              time: getCurrentTimeString(),
              bankReference: foundUtr || `UPI/PP-${Date.now()}-${results.length}`,
              raw: line,
            });
            continue;
          }
        }
      }

      // Try single line alert text parsing
      const parsed = this.parsePhonePeAlert(line);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }
}
