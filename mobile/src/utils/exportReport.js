import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://kabrak-exchange-pro-production.up.railway.app/api';

/**
 * Download an Excel file from the backend export API and share it
 * @param {'transactions'|'deposit-orders'|'clients'} type
 * @param {object} params - query params (startDate, endDate, currency, status)
 */
export const exportExcel = async (type, params = {}) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) throw new Error('Non authentifié');

  const query = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}/export/${type}${query ? '?' + query : ''}`;
  const filename = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
  const fileUri = FileSystem.documentDirectory + filename;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status !== 200) {
    throw new Error('Erreur lors du téléchargement');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Exporter ${type}`,
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }

  return result.uri;
};

/**
 * Generate and share a PDF report from HTML content
 * @param {string} html - HTML content for the PDF
 * @param {string} title - filename prefix
 */
export const exportPDF = async (html, title = 'rapport') => {
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Exporter ${title}`,
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
};

/**
 * Build HTML for a monthly report PDF
 */
export const buildMonthlyReportHTML = ({ report, month, year, businessName }) => {
  const fmt = (n) => parseFloat(n || 0).toLocaleString('fr-FR');
  const GREEN = '#0B6E4F';

  const currencyRows = Object.entries(report.byCurrency || {})
    .map(([code, data]) => `
      <tr>
        <td style="font-weight:700;color:${GREEN}">${code}</td>
        <td style="text-align:right">${fmt(data.total)}</td>
        <td style="text-align:right">${data.count}</td>
        <td style="text-align:right;color:${GREEN}">${fmt(data.paid)}</td>
      </tr>
    `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; }
  .header { text-align:center; border-bottom: 3px solid ${GREEN}; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { color: ${GREEN}; font-size: 22px; }
  .header p { color: #666; font-size: 12px; margin-top: 4px; }
  .summary { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  .stat { flex:1; min-width: 140px; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e2e8f0; }
  .stat .value { font-size: 20px; font-weight: 700; color: ${GREEN}; }
  .stat .label { font-size: 11px; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: ${GREEN}; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 10px; font-style: italic; }
</style>
</head>
<body>
  <div class="header">
    <h1>${businessName || 'KABRAK Exchange Pro'}</h1>
    <p>Rapport mensuel — ${month} ${year}</p>
    <p>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="value">${report.summary?.totalTransactions || 0}</div>
      <div class="label">Transactions</div>
    </div>
    <div class="stat">
      <div class="value">${fmt(report.summary?.totalTransactionAmount)}</div>
      <div class="label">Volume total</div>
    </div>
    <div class="stat">
      <div class="value" style="color:${GREEN}">${fmt(report.summary?.totalPaymentsReceived)}</div>
      <div class="label">Payé</div>
    </div>
    <div class="stat">
      <div class="value" style="color:#dc2626">${fmt(report.summary?.totalOutstanding)}</div>
      <div class="label">Impayé</div>
    </div>
  </div>

  ${currencyRows ? `
  <h3 style="margin-bottom:8px;color:${GREEN}">Par devise</h3>
  <table>
    <tr><th>Devise</th><th style="text-align:right">Volume</th><th style="text-align:right">Transactions</th><th style="text-align:right">Payé</th></tr>
    ${currencyRows}
  </table>
  ` : ''}

  <div class="footer">KABRAK Exchange Pro — Rapport automatique</div>
</body>
</html>`;
};
