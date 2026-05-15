function generateQrUrl({ bankId, accountNo, accountName, amount, addInfo, template = 'compact2' }) {
  const baseUrl = 'https://img.vietqr.io/image';

  const safeAddInfo = addInfo
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .substring(0, 50)
    .trim();
  
  const params = new URLSearchParams();
  params.append('amount', amount.toString());
  params.append('addInfo', safeAddInfo);
  params.append('accountName', accountName);
  
  return `${baseUrl}/${bankId}-${accountNo}-${template}.png?${params.toString()}`;
}

module.exports = { generateQrUrl };
