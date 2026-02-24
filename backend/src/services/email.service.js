const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || null);
const FROM = process.env.EMAIL_FROM || 'KABRAK Exchange Pro <noreply@kabrakeng.com>';
const BASE_URL = process.env.BASE_URL || 'https://kabrak-exchange-pro-production.up.railway.app';

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`📧 [EMAIL SKIPPED - no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return { success: false, reason: 'No API key' };
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return { success: true, id: result.id };
  } catch (e) {
    console.error(`📧 Email error to ${to}:`, e.message);
    return { success: false, error: e.message };
  }
}

// Email: Trial activé
async function sendTrialActivated({ email, businessName, licenseKey, expiresAt }) {
  const expiry = new Date(expiresAt).toLocaleDateString('fr-FR');
  return sendEmail({
    to: email,
    subject: '🎁 Votre essai gratuit KABRAK Exchange Pro est activé !',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#071a12;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#0B6E4F;padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#e8a020;">KABRAK Exchange Pro</h1>
          <p style="margin:8px 0 0;opacity:0.8;">Essai gratuit activé</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#e8a020;">🎉 Bienvenue, ${businessName} !</h2>
          <p>Votre essai gratuit de <strong>14 jours</strong> est maintenant actif.</p>
          <div style="background:#0a3d22;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 8px;opacity:0.7;font-size:12px;letter-spacing:1px;">VOTRE CLÉ DE LICENCE</p>
            <p style="margin:0;font-size:22px;font-weight:bold;color:#e8a020;letter-spacing:3px;">${licenseKey}</p>
          </div>
          <p>📅 Expire le : <strong>${expiry}</strong></p>
          <p>Entrez cette clé dans l'application mobile KABRAK Exchange Pro pour accéder à toutes les fonctionnalités.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${BASE_URL}/payment.html" style="background:#0B6E4F;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Acheter une licence complète</a>
          </div>
          <hr style="border:none;border-top:1px solid #0a3d22;margin:24px 0;">
          <p style="opacity:0.5;font-size:12px;text-align:center;">KABRAK ENG — Bureau de Change Management System</p>
        </div>
      </div>
    `
  });
}

// Email: Paiement Orange Money reçu (en attente de validation)
async function sendPaymentReceived({ email, businessName, plan, amount, reference }) {
  const planLabel = plan === 'basic' ? 'BASIC (1 mois)' : 'PREMIUM (1 an)';
  return sendEmail({
    to: email,
    subject: '⏳ Votre paiement Orange Money est en cours de validation',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#071a12;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#0B6E4F;padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#e8a020;">KABRAK Exchange Pro</h1>
          <p style="margin:8px 0 0;opacity:0.8;">Confirmation de paiement</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#e8a020;">Bonjour ${businessName},</h2>
          <p>Nous avons bien reçu votre Transaction ID Orange Money. Votre paiement est en cours de validation.</p>
          <div style="background:#0a3d22;border-radius:8px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;"><strong>Plan :</strong> ${planLabel}</p>
            <p style="margin:0 0 8px;"><strong>Montant :</strong> ${parseInt(amount).toLocaleString('fr-FR')} XOF</p>
            <p style="margin:0;"><strong>Transaction ID :</strong> <span style="color:#e8a020;">${reference}</span></p>
          </div>
          <p>⏱️ Délai de validation : <strong>24 heures maximum</strong></p>
          <p>Vous recevrez un email avec votre clé de licence dès que votre paiement sera validé.</p>
          <hr style="border:none;border-top:1px solid #0a3d22;margin:24px 0;">
          <p style="opacity:0.5;font-size:12px;text-align:center;">KABRAK ENG — Bureau de Change Management System</p>
        </div>
      </div>
    `
  });
}

// Email: Licence activée après validation admin
async function sendLicenseActivated({ email, businessName, licenseKey, plan, expiresAt }) {
  const planLabel = plan === 'basic' ? 'BASIC (1 mois)' : plan === 'premium' ? 'PREMIUM (1 an)' : 'TRIAL (14 jours)';
  const expiry = new Date(expiresAt).toLocaleDateString('fr-FR');
  return sendEmail({
    to: email,
    subject: '✅ Votre licence KABRAK Exchange Pro est activée !',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#071a12;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#0B6E4F;padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#e8a020;">KABRAK Exchange Pro</h1>
          <p style="margin:8px 0 0;opacity:0.8;">Licence activée</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#e8a020;">🎉 Félicitations, ${businessName} !</h2>
          <p>Votre paiement a été validé. Votre licence <strong>${planLabel}</strong> est maintenant active.</p>
          <div style="background:#0a3d22;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 8px;opacity:0.7;font-size:12px;letter-spacing:1px;">VOTRE CLÉ DE LICENCE</p>
            <p style="margin:0;font-size:22px;font-weight:bold;color:#e8a020;letter-spacing:3px;">${licenseKey}</p>
          </div>
          <p>📅 Expire le : <strong>${expiry}</strong></p>
          <p>Entrez cette clé dans l'application mobile pour commencer à utiliser KABRAK Exchange Pro.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${BASE_URL}" style="background:#0B6E4F;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Accéder à l'application</a>
          </div>
          <hr style="border:none;border-top:1px solid #0a3d22;margin:24px 0;">
          <p style="opacity:0.5;font-size:12px;text-align:center;">KABRAK ENG — Bureau de Change Management System</p>
        </div>
      </div>
    `
  });
}

// Email: Paiement rejeté
async function sendPaymentRejected({ email, businessName, reason }) {
  return sendEmail({
    to: email,
    subject: '❌ Votre paiement KABRAK Exchange Pro n\'a pas pu être validé',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#071a12;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#dc2626;padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#fff;">KABRAK Exchange Pro</h1>
          <p style="margin:8px 0 0;opacity:0.8;">Paiement non validé</p>
        </div>
        <div style="padding:32px;">
          <h2>Bonjour ${businessName},</h2>
          <p>Malheureusement, votre paiement n'a pas pu être validé.</p>
          ${reason ? `<div style="background:#3d0a0a;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:0;"><strong>Raison :</strong> ${reason}</p></div>` : ''}
          <p>Veuillez réessayer ou nous contacter via WhatsApp pour assistance.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="https://wa.me/237653561862" style="background:#25D366;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Contacter le support</a>
          </div>
          <hr style="border:none;border-top:1px solid #3d0a0a;margin:24px 0;">
          <p style="opacity:0.5;font-size:12px;text-align:center;">KABRAK ENG — Bureau de Change Management System</p>
        </div>
      </div>
    `
  });
}

// Email: Réinitialisation de mot de passe
async function sendPasswordReset({ email, name, resetCode }) {
  return sendEmail({
    to: email,
    subject: '🔐 Code de réinitialisation — KABRAK Exchange Pro',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#071a12;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#0B6E4F;padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#e8a020;">KABRAK Exchange Pro</h1>
          <p style="margin:8px 0 0;opacity:0.8;">Réinitialisation du mot de passe</p>
        </div>
        <div style="padding:32px;">
          <h2>Bonjour ${name},</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code :</p>
          <div style="background:#0a3d22;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
            <p style="margin:0 0 8px;opacity:0.7;font-size:12px;letter-spacing:1px;">VOTRE CODE</p>
            <p style="margin:0;font-size:36px;font-weight:bold;color:#e8a020;letter-spacing:8px;">${resetCode}</p>
          </div>
          <p>⏱️ Ce code expire dans <strong>15 minutes</strong>.</p>
          <p>Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
          <hr style="border:none;border-top:1px solid #0a3d22;margin:24px 0;">
          <p style="opacity:0.5;font-size:12px;text-align:center;">KABRAK ENG — Bureau de Change Management System</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendEmail, sendTrialActivated, sendPaymentReceived, sendLicenseActivated, sendPaymentRejected, sendPasswordReset };
