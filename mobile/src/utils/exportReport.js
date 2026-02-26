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
export const buildMonthlyReportHTML = ({ report, month, year, businessName, businessLogo, brandColor }) => {
  const fmt = (n) => parseFloat(n || 0).toLocaleString('fr-FR');
  const GREEN = brandColor || '#0B6E4F';

  const currencyRows = Object.entries(report.byCurrency || {})
    .map(([code, data]) => `
      <tr>
        <td style="font-weight:700;color:${GREEN}">${code}</td>
        <td style="text-align:right">${fmt(data.total)}</td>
        <td style="text-align:right">${data.count}</td>
        <td style="text-align:right;color:${GREEN}">${fmt(data.paid)}</td>
        <td style="text-align:right;color:#dc2626">${fmt(data.total - data.paid)}</td>
      </tr>
    `).join('');

  const operatorRows = (report.byOperator || []).map((op, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:600">${op.name || '—'}</td>
      <td style="text-align:right">${op.count}</td>
      <td style="text-align:right">${fmt(op.volume)}</td>
      <td style="text-align:right;color:${GREEN};font-weight:700">${op.profit > 0 ? '+' + fmt(op.profit) : '—'}</td>
    </tr>
  `).join('');

  const logoHtml = businessLogo
    ? `<img src="${businessLogo}" style="height:56px;object-fit:contain;margin-bottom:8px;" />`
    : `<div style="width:56px;height:56px;border-radius:12px;background:${GREEN};display:inline-flex;align-items:center;justify-content:center;margin-bottom:8px;"><span style="color:white;font-size:24px;">💱</span></div>`;

  const profitBanner = report.summary?.totalProfit > 0 ? `
    <div style="background:${GREEN};color:white;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;opacity:0.8;">💰 PROFIT NET DU MOIS</div>
        <div style="font-size:26px;font-weight:700;margin-top:4px;">${fmt(report.summary.totalProfit)} XOF</div>
      </div>
      <div style="font-size:40px;">📈</div>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; background: #f8fafc; }
  .header { text-align:center; background:white; border-bottom: 4px solid ${GREEN}; padding: 24px; margin-bottom: 24px; border-radius: 12px; }
  .header h1 { color: ${GREEN}; font-size: 22px; font-weight:800; margin-top:8px; }
  .header p { color: #666; font-size: 12px; margin-top: 4px; }
  .summary { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .stat { flex:1; min-width: 130px; background: white; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #e2e8f0; }
  .stat .value { font-size: 18px; font-weight: 800; color: ${GREEN}; }
  .stat .label { font-size: 11px; color: #64748b; margin-top: 4px; }
  .section { background:white; border-radius:10px; padding:20px; margin-bottom:20px; }
  .section h3 { color:${GREEN}; font-size:14px; margin-bottom:12px; border-bottom:2px solid #e2e8f0; padding-bottom:8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: ${GREEN}; color: white; padding: 8px 12px; text-align: left; font-size: 11px; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
  tr:hover { background: #f8fafc; }
  .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 10px; font-style: italic; padding: 16px; }
</style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <h1>${businessName || 'KABRAK Exchange Pro'}</h1>
    <p>📅 Rapport mensuel — ${month} ${year}</p>
    <p style="margin-top:4px;">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  ${profitBanner}

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
      <div class="value" style="color:#16a34a">${fmt(report.summary?.totalPaymentsReceived)}</div>
      <div class="label">Encaissé</div>
    </div>
    <div class="stat">
      <div class="value" style="color:#dc2626">${fmt(report.summary?.totalOutstanding)}</div>
      <div class="label">Impayé</div>
    </div>
  </div>

  ${currencyRows ? `
  <div class="section">
    <h3>📊 Activité par devise</h3>
    <table>
      <tr><th>Devise</th><th style="text-align:right">Volume</th><th style="text-align:right">Nb tx</th><th style="text-align:right">Encaissé</th><th style="text-align:right">Impayé</th></tr>
      ${currencyRows}
    </table>
  </div>
  ` : ''}

  ${operatorRows ? `
  <div class="section">
    <h3>👤 Performance par employé</h3>
    <table>
      <tr><th>#</th><th>Employé</th><th style="text-align:right">Transactions</th><th style="text-align:right">Volume</th><th style="text-align:right">Profit</th></tr>
      ${operatorRows}
    </table>
  </div>
  ` : ''}

  <div class="footer">${businessName || 'KABRAK Exchange Pro'} — Rapport généré automatiquement</div>
</body>
</html>`;
};
