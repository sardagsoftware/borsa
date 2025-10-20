/**
 * 💰 Loan Comparison API
 * Compare loan offers from multiple banks
 */

/**
 * Turkish banks with typical loan rates
 */
const BANKS = [
  {
    name: 'Garanti BBVA',
    baseRate: 2.49,
    processingFee: 0,
    logo: '🏦'
  },
  {
    name: 'Yapı Kredi',
    baseRate: 2.59,
    processingFee: 0,
    logo: '🏦'
  },
  {
    name: 'İş Bankası',
    baseRate: 2.39,
    processingFee: 0,
    logo: '🏦'
  },
  {
    name: 'Akbank',
    baseRate: 2.69,
    processingFee: 0,
    logo: '🏦'
  },
  {
    name: 'Ziraat Bankası',
    baseRate: 2.29,
    processingFee: 0,
    logo: '🏦'
  },
  {
    name: 'Halkbank',
    baseRate: 2.35,
    processingFee: 0,
    logo: '🏦'
  }
];

/**
 * Calculate loan details
 */
function calculateLoan(amount, term, interestRate) {
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
    (Math.pow(1 + monthlyRate, term) - 1);
  const totalPayment = monthlyPayment * term;
  const totalInterest = totalPayment - amount;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    interestRate: Math.round(interestRate * 100) / 100
  };
}

/**
 * Compare loan offers
 */
async function compareLoan(req, res) {
  const { amount, term, loanType = 'consumer' } = req.body;

  // Validation
  if (!amount || amount < 1000) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be at least 1,000 TL'
    });
  }

  if (!term || term < 1 || term > 360) {
    return res.status(400).json({
      success: false,
      error: 'Term must be between 1 and 360 months'
    });
  }

  // Calculate offers from all banks
  const offers = BANKS.map((bank) => {
    // Add some variance based on loan type and amount
    let rateAdjustment = 0;

    if (loanType === 'mortgage') {
      rateAdjustment = -0.5; // Mortgage gets better rates
    } else if (loanType === 'auto') {
      rateAdjustment = 0.2;
    }

    // Higher amounts get better rates
    if (amount >= 500000) {
      rateAdjustment -= 0.3;
    } else if (amount >= 100000) {
      rateAdjustment -= 0.1;
    }

    const finalRate = bank.baseRate + rateAdjustment;
    const calculation = calculateLoan(amount, term, finalRate);

    return {
      bank: bank.name,
      logo: bank.logo,
      interestRate: calculation.interestRate,
      monthlyPayment: calculation.monthlyPayment,
      totalPayment: calculation.totalPayment,
      totalInterest: calculation.totalInterest,
      processingFee: bank.processingFee
    };
  });

  // Sort by total payment (best offer first)
  offers.sort((a, b) => a.totalPayment - b.totalPayment);

  res.json({
    success: true,
    requestedAmount: amount,
    requestedTerm: term,
    loanType,
    offers,
    bestOffer: offers[0],
    timestamp: new Date().toISOString()
  });
}

module.exports = { compareLoan };
