const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { Transaction, Client, Payment, DepositOrder, Deposit, Setting } = require('../models');
const moment = require('moment');

const GREEN = '0B6E4F';
const LIGHT_GREEN = 'E6F4EF';

const getBusinessName = async () => {
  try {
    const row = await Setting.findOne({ where: { key: 'businessName' } });
    return row?.value || 'KABRAK Exchange Pro';
  } catch (_) { return 'KABRAK Exchange Pro'; }
};

const addTitleRows = (ws, title, businessName, period, colCount) => {
  ws.spliceRows(1, 0, [], [], []);
  const r1 = ws.getRow(1);
  r1.getCell(1).value = businessName;
  r1.getCell(1).font = { bold: true, size: 14, color: { argb: `FF${GREEN}` } };
  if (colCount > 1) ws.mergeCells(1, 1, 1, colCount);

  const r2 = ws.getRow(2);
  r2.getCell(1).value = `${title}${period ? ' — ' + period : ''}`;
  r2.getCell(1).font = { size: 11, color: { argb: 'FF444444' } };
  if (colCount > 1) ws.mergeCells(2, 1, 2, colCount);

  const r3 = ws.getRow(3);
  r3.getCell(1).value = `Généré le ${moment().format('DD/MM/YYYY HH:mm')} — KABRAK Exchange Pro`;
  r3.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF999999' } };
  if (colCount > 1) ws.mergeCells(3, 1, 3, colCount);
};

const styleHeaderRow = (ws, colCount) => {
  const row = ws.getRow(4);
  row.height = 26;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GREEN}` } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }
};

// GET /api/export/transactions
const exportTransactions = async (req, res) => {
  try {
    const { startDate, endDate, currency, status } = req.query;
    const businessName = await getBusinessName();

    const where = {};
    if (startDate && endDate) where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    else if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    else if (endDate) where.createdAt = { [Op.lte]: new Date(endDate) };
    if (currency) where.currencyTo = currency;
    if (status) where.status = status;

    const transactions = await Transaction.findAll({
      where,
      include: [{ model: Client, as: 'client', attributes: ['name', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'KABRAK Exchange Pro';
    const ws = wb.addWorksheet('Transactions', { views: [{ state: 'frozen', ySplit: 4 }] });

    const cols = [
      { header: 'Référence', key: 'ref', width: 16 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Client', key: 'client', width: 24 },
      { header: 'Téléphone', key: 'phone', width: 16 },
      { header: 'Devise donnée', key: 'currFrom', width: 14 },
      { header: 'Montant donné', key: 'amtFrom', width: 16 },
      { header: 'Devise reçue', key: 'currTo', width: 14 },
      { header: 'Montant reçu', key: 'amtTo', width: 16 },
      { header: 'Taux', key: 'rate', width: 12 },
      { header: 'Payé', key: 'paid', width: 14 },
      { header: 'Reste', key: 'remaining', width: 14 },
      { header: 'Statut', key: 'status', width: 12 },
      { header: 'Type', key: 'type', width: 10 },
    ];
    ws.columns = cols;

    const statusLabel = { paid: 'Payé', partial: 'Partiel', unpaid: 'Non payé', cancelled: 'Annulé' };
    const statusBg = { paid: `FF${LIGHT_GREEN}`, partial: 'FFFFF3CD', unpaid: 'FFFEE2E2', cancelled: 'FFF3F4F6' };

    transactions.forEach((t, i) => {
      const row = ws.addRow({
        ref: t.reference,
        date: moment(t.createdAt).format('DD/MM/YYYY HH:mm'),
        client: t.client?.name || '—',
        phone: t.client?.phone || '—',
        currFrom: t.currencyFrom,
        amtFrom: parseFloat(t.amountFrom),
        currTo: t.currencyTo,
        amtTo: parseFloat(t.amountTo),
        rate: parseFloat(t.exchangeRate),
        paid: parseFloat(t.amountPaid),
        remaining: parseFloat(t.amountRemaining),
        status: statusLabel[t.status] || t.status,
        type: t.type?.toUpperCase() || '—',
      });
      const rowBg = i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFEEEEEE' } } };
        cell.alignment = { vertical: 'middle' };
      });
      const statusCell = row.getCell('status');
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg[t.status] || 'FFFFFFFF' } };
      statusCell.font = { bold: true };
      ['amtFrom', 'amtTo', 'paid', 'remaining'].forEach(k => {
        row.getCell(k).numFmt = '#,##0.00';
      });
      row.getCell('rate').numFmt = '#,##0.0000';
    });

    // Summary row
    ws.addRow([]);
    const sumRow = ws.addRow({
      ref: 'TOTAL',
      amtTo: transactions.reduce((s, t) => s + parseFloat(t.amountTo), 0),
      paid: transactions.reduce((s, t) => s + parseFloat(t.amountPaid), 0),
      remaining: transactions.reduce((s, t) => s + parseFloat(t.amountRemaining), 0),
    });
    sumRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_GREEN}` } };
    });

    const period = startDate || endDate
      ? `${startDate ? moment(startDate).format('DD/MM/YYYY') : '...'} → ${endDate ? moment(endDate).format('DD/MM/YYYY') : '...'}`
      : moment().format('MMMM YYYY');

    addTitleRows(ws, 'Rapport des Transactions', businessName, period, cols.length);
    styleHeaderRow(ws, cols.length);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${moment().format('YYYY-MM-DD')}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/export/deposit-orders
const exportDepositOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const businessName = await getBusinessName();

    const where = {};
    if (startDate && endDate) where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    if (status) where.status = status;

    const orders = await DepositOrder.findAll({
      where,
      include: [{ model: Deposit, as: 'payments', attributes: ['id', 'code', 'amount', 'status', 'confirmedAt', 'createdAt'] }],
      order: [['createdAt', 'DESC']],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'KABRAK Exchange Pro';
    const ws = wb.addWorksheet('Versements', { views: [{ state: 'frozen', ySplit: 4 }] });

    const cols = [
      { header: 'Référence', key: 'ref', width: 18 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Client', key: 'client', width: 24 },
      { header: 'Téléphone', key: 'phone', width: 16 },
      { header: 'Devise', key: 'currency', width: 10 },
      { header: 'Total', key: 'total', width: 16 },
      { header: 'Reçu', key: 'received', width: 16 },
      { header: 'Reste', key: 'remaining', width: 16 },
      { header: 'Banque', key: 'bank', width: 16 },
      { header: 'Statut', key: 'status', width: 14 },
      { header: 'Nb versements', key: 'payCount', width: 14 },
    ];
    ws.columns = cols;

    const statusLabel = { pending: 'En attente', partial: 'Partiel', completed: 'Complété', cancelled: 'Annulé' };
    const statusBg = { pending: 'FFFFF3CD', partial: 'FFE0F2FE', completed: `FF${LIGHT_GREEN}`, cancelled: 'FFF3F4F6' };

    orders.forEach((o, i) => {
      const row = ws.addRow({
        ref: o.reference,
        date: moment(o.createdAt).format('DD/MM/YYYY HH:mm'),
        client: o.clientName,
        phone: o.clientPhone || '—',
        currency: o.currency,
        total: parseFloat(o.totalAmount),
        received: parseFloat(o.receivedAmount),
        remaining: parseFloat(o.remainingAmount),
        bank: o.bank || '—',
        status: statusLabel[o.status] || o.status,
        payCount: (o.payments || []).length,
      });
      const rowBg = i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFEEEEEE' } } };
        cell.alignment = { vertical: 'middle' };
      });
      row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg[o.status] || 'FFFFFFFF' } };
      row.getCell('status').font = { bold: true };
      ['total', 'received', 'remaining'].forEach(k => { row.getCell(k).numFmt = '#,##0.00'; });
    });

    ws.addRow([]);
    const sumRow = ws.addRow({
      ref: 'TOTAL',
      total: orders.reduce((s, o) => s + parseFloat(o.totalAmount), 0),
      received: orders.reduce((s, o) => s + parseFloat(o.receivedAmount), 0),
      remaining: orders.reduce((s, o) => s + parseFloat(o.remainingAmount), 0),
    });
    sumRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_GREEN}` } };
    });

    const period = startDate && endDate
      ? `${moment(startDate).format('DD/MM/YYYY')} → ${moment(endDate).format('DD/MM/YYYY')}`
      : moment().format('MMMM YYYY');

    addTitleRows(ws, 'Rapport des Versements', businessName, period, cols.length);
    styleHeaderRow(ws, cols.length);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="versements_${moment().format('YYYY-MM-DD')}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/export/clients
const exportClients = async (req, res) => {
  try {
    const businessName = await getBusinessName();
    const { Client: ClientModel } = require('../models');

    const clients = await ClientModel.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'KABRAK Exchange Pro';
    const ws = wb.addWorksheet('Clients', { views: [{ state: 'frozen', ySplit: 4 }] });

    const cols = [
      { header: 'Code', key: 'code', width: 12 },
      { header: 'Nom', key: 'name', width: 26 },
      { header: 'Téléphone', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 26 },
      { header: "Type pièce", key: 'idType', width: 16 },
      { header: "N° pièce", key: 'idNumber', width: 18 },
      { header: 'Adresse', key: 'address', width: 28 },
      { header: 'Dette totale', key: 'debt', width: 16 },
      { header: 'Total payé', key: 'paid', width: 16 },
      { header: 'Date création', key: 'created', width: 18 },
    ];
    ws.columns = cols;

    clients.forEach((c, i) => {
      const row = ws.addRow({
        code: c.clientCode || '—',
        name: c.name,
        phone: c.phone || '—',
        email: c.email || '—',
        idType: c.idType || '—',
        idNumber: c.idNumber || '—',
        address: c.address || '—',
        debt: parseFloat(c.totalDebt || 0),
        paid: parseFloat(c.totalPaid || 0),
        created: moment(c.createdAt).format('DD/MM/YYYY'),
      });
      const rowBg = i % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFEEEEEE' } } };
        cell.alignment = { vertical: 'middle' };
      });
      ['debt', 'paid'].forEach(k => { row.getCell(k).numFmt = '#,##0.00'; });
    });

    addTitleRows(ws, 'Liste des Clients', businessName, `${clients.length} clients actifs`, cols.length);
    styleHeaderRow(ws, cols.length);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="clients_${moment().format('YYYY-MM-DD')}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { exportTransactions, exportDepositOrders, exportClients };
