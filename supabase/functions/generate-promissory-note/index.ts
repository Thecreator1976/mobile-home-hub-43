import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, corsHeaders, unauthorizedResponse } from "../_shared/auth.ts";

interface PromissoryNoteRequest {
  borrowerName: string;
  lenderName: string;
  amount: number;
  interestRate: number;
  repaymentTerms: string;
  issuedDate: string;
  dueDate?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const { userId } = await requireAuth(req);
    console.log("Authenticated user:", userId);

    const { borrowerName, lenderName, amount, interestRate, repaymentTerms, issuedDate, dueDate }: PromissoryNoteRequest = await req.json();

    if (!borrowerName || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formatCurrency = (amt: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amt);
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const note = `
================================================================================
                              PROMISSORY NOTE
================================================================================

Date: ${formatDate(issuedDate)}

FOR VALUE RECEIVED, the undersigned ("Borrower") promises to pay to the order of 
${lenderName} ("Lender"), the principal sum of ${formatCurrency(amount)} 
(${numberToWords(amount)} Dollars), together with interest thereon at the rate 
of ${interestRate}% per annum.

BORROWER:
Name: ${borrowerName}

LENDER:
Name: ${lenderName}

PRINCIPAL AMOUNT: ${formatCurrency(amount)}
INTEREST RATE: ${interestRate}% per annum
DATE OF NOTE: ${formatDate(issuedDate)}
${dueDate ? `MATURITY DATE: ${formatDate(dueDate)}` : 'MATURITY DATE: Upon Demand'}

REPAYMENT TERMS:
${repaymentTerms || 'Payment shall be made in full upon maturity or upon demand by the Lender.'}

================================================================================
                              TERMS AND CONDITIONS
================================================================================

1. PAYMENT: All payments shall be applied first to accrued interest and then to 
   principal. All payments shall be made in lawful money of the United States.

2. PREPAYMENT: Borrower may prepay this Note in whole or in part at any time 
   without penalty.

3. DEFAULT: Upon default in payment of any installment of principal or interest 
   when due, the entire unpaid balance of principal and accrued interest shall 
   become immediately due and payable at the option of the Lender.

4. LATE CHARGE: If any payment is not received within ten (10) days after its 
   due date, Borrower agrees to pay a late charge of 5% of the overdue amount.

5. COLLECTION COSTS: If this Note is placed in the hands of an attorney for 
   collection, Borrower agrees to pay reasonable attorney's fees and costs.

6. WAIVER: Borrower and all endorsers waive presentment, demand, protest, and 
   notice of dishonor.

7. GOVERNING LAW: This Note shall be governed by and construed in accordance 
   with the laws of the State where the Lender is located.

8. SEVERABILITY: If any provision of this Note is held invalid, the remaining 
   provisions shall continue in full force and effect.

================================================================================
                                 SIGNATURES
================================================================================

BORROWER:

_______________________________________
Signature

_______________________________________
Print Name: ${borrowerName}

Date: _________________________________


LENDER:

_______________________________________
Signature

_______________________________________
Print Name: ${lenderName}

Date: _________________________________


================================================================================
                                  WITNESS
================================================================================

Witness #1:

_______________________________________
Signature

_______________________________________
Print Name

Date: _________________________________


Witness #2:

_______________________________________
Signature

_______________________________________
Print Name

Date: _________________________________


================================================================================
This document was generated on ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
================================================================================
`.trim();

    return new Response(
      JSON.stringify({ note, generatedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating promissory note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle authentication errors
    if (errorMessage.includes("authenticated") || errorMessage.includes("token")) {
      return unauthorizedResponse(errorMessage);
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate promissory note' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + numberToWords(-num);

  const intPart = Math.floor(num);
  let words = '';

  if (intPart >= 1000000) {
    words += numberToWords(Math.floor(intPart / 1000000)) + ' Million ';
    num = intPart % 1000000;
  }

  if (intPart >= 1000) {
    words += numberToWords(Math.floor((intPart % 1000000) / 1000)) + ' Thousand ';
    num = intPart % 1000;
  } else {
    num = intPart;
  }

  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num = num % 100;
  }

  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num = num % 10;
  }

  if (num >= 10 && num < 20) {
    words += teens[num - 10] + ' ';
    num = 0;
  }

  if (num > 0) {
    words += ones[num] + ' ';
  }

  return words.trim();
}
