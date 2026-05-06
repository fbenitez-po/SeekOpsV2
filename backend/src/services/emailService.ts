import nodemailer from "nodemailer";

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT ?? "587"),
    secure: parseInt(SMTP_PORT ?? "587") === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function send(options: { to: string; subject: string; html: string; link?: string }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[EMAIL - DEV] Para: ${options.to}`);
    console.log(`[EMAIL - DEV] Asunto: ${options.subject}`);
    console.log(`[EMAIL - DEV] Link: ${options.link}`);
    return;
  }

  await transporter.sendMail({
    from: `"Seekops" <${process.env.EMAIL_FROM || "noreply@seekglobal.co"}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
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
              ${body}
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

export async function enviarBienvenida(email: string, firstName: string, token: string) {
  const link = `${process.env.FRONTEND_URL}/activar-cuenta?token=${token}`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">¡Bienvenido/a a Seekops, ${firstName}!</h2>
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

  await send({
    to: email,
    subject: "¡Bienvenido/a a Seekops! Activá tu cuenta",
    html: baseTemplate("Activá tu cuenta", body),
    link,
  });
}

export async function enviarResetPassword(email: string, firstName: string, token: string) {
  const link = `${process.env.FRONTEND_URL}/reset?token=${token}`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Recuperar contraseña</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hola ${firstName}, recibimos una solicitud para restablecer la contraseña de tu cuenta en Seekops.
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

  await send({
    to: email,
    subject: "Restablecer contraseña — Seekops",
    html: baseTemplate("Restablecer contraseña", body),
    link,
  });
}
