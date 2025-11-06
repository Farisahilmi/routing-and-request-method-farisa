function formatCurrency(amount, currency = 'IDR') {
  const exchangeRates = {
    'USD': 1,
    'IDR': 15000
  };
  
  const convertedAmount = currency === 'IDR' ? 
    amount * exchangeRates['IDR'] : 
    amount;
  
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(convertedAmount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(convertedAmount);
  }
}

module.exports = { formatCurrency };