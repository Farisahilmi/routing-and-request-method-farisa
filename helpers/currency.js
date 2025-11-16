// Mapping bahasa ke currency
function getCurrencyByLanguage(language) {
  const languageToCurrency = {
    'en': 'USD',
    'id': 'IDR',
    'es': 'MXN'
  };
  return languageToCurrency[language] || 'USD';
}

// Get currency name
function getCurrencyName(currency) {
  const names = {
    'USD': 'USD ($)',
    'IDR': 'IDR (Rp)',
    'EUR': 'EUR (€)',
    'MXN': 'MXN ($)'
  };
  return names[currency] || currency;
}

function formatCurrency(amount, currency = 'IDR') {
  const exchangeRates = {
    'USD': 1,
    'IDR': 15000,
    'EUR': 0.85,  // 1 USD = 0.85 EUR
    'MXN': 20     // 1 USD = 20 MXN
  };
  
  let convertedAmount;
  
  if (currency === 'IDR') {
    convertedAmount = amount * exchangeRates['IDR'];
  } else if (currency === 'EUR') {
    convertedAmount = amount * exchangeRates['EUR'];
  } else if (currency === 'MXN') {
    convertedAmount = amount * exchangeRates['MXN'];
  } else {
    convertedAmount = amount;
  }
  
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(convertedAmount);
  } else if (currency === 'EUR') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(convertedAmount);
  } else if (currency === 'MXN') {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(convertedAmount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(convertedAmount);
  }
}

module.exports = { 
  formatCurrency, 
  getCurrencyByLanguage, 
  getCurrencyName 
};