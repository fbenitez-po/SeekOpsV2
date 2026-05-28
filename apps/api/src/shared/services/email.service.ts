import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../logging/logger';

function createTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  link?: string;
}

async function send(opts: MailOptions): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    // SMTP not configured: dev fallback. The link is surfaced so devs can use it.
    logger.warn(
      { to: opts.to, subject: opts.subject, link: opts.link },
      'SMTP not configured, email not sent (dev fallback)',
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Seekops" <${env.EMAIL_FROM}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, 'email send failed');
    throw err;
  }
}

function baseTemplate(titulo: string, cuerpo: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Seekops</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${cuerpo}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Este email fue generado automáticamente. No respondas a este mensaje.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcome(email: string, nombres: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/activar-cuenta?token=${token}`;
  const cuerpo = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">¡Bienvenido/a a Seekops, ${nombres}!</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Tu cuenta fue creada por el administrador. Para activarla y comenzar a usarla, necesitás establecer tu contraseña.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Este link es válido por <strong>48 horas</strong>.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#0f172a;border-radius:8px;padding:12px 28px;">
          <a href="${link}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Activar mi cuenta</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Si el botón no funciona, copiá este link en tu navegador:<br/>
      <a href="${link}" style="color:#0f172a;word-break:break-all;">${link}</a>
    </p>`;
  await send({ to: email, subject: '¡Bienvenido/a a Seekops! Activá tu cuenta', html: baseTemplate('Activá tu cuenta', cuerpo), link });
}

export async function sendPasswordReset(email: string, nombres: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/reset?token=${token}`;
  const cuerpo = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Recuperar contraseña</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hola ${nombres}, recibimos una solicitud para restablecer la contraseña de tu cuenta en Seekops.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Este link es válido por <strong>1 hora</strong>. Si no solicitaste este cambio, ignorá este email.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#0f172a;border-radius:8px;padding:12px 28px;">
          <a href="${link}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Restablecer contraseña</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Si el botón no funciona, copiá este link en tu navegador:<br/>
      <a href="${link}" style="color:#0f172a;word-break:break-all;">${link}</a>
    </p>`;
  await send({ to: email, subject: 'Restablecer contraseña — Seekops', html: baseTemplate('Restablecer contraseña', cuerpo), link });
}

export async function sendHoursReminder(email: string, nombresSeeker: string, nombreGestor: string): Promise<void> {
  const link = env.FRONTEND_URL;
  const cuerpo = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Recordatorio de carga de horas</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hola ${nombresSeeker}, te escribimos porque tenés semanas pendientes de carga de horas en Seekops.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      <strong>${nombreGestor}</strong> te solicita que ingreses a la plataforma y registres tus horas a la brevedad.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#0f172a;border-radius:8px;padding:12px 28px;">
          <a href="${link}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Cargar mis horas</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      Si ya cargaste tus horas recientemente, podés ignorar este mensaje.
    </p>`;
  await send({ to: email, subject: 'Recordatorio: tenés horas pendientes de carga — Seekops', html: baseTemplate('Recordatorio de carga de horas', cuerpo), link });
}
