import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const transporter = {
  sendMail: async (mailOptions) => {
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject,
      html: mailOptions.html,
    };
    await sgMail.send(msg);
  }
};

export const sendTicketEmail = async (userEmail, userName, flightDetails, passengers, totalAmount) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="background-color: #2A3F45; padding: 30px; text-align: center;">
          <h1 style="color: #E5B869; margin: 0; font-size: 28px;">AeroManage</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">¡Tu reserva ha sido confirmada, ${userName}!</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #2A3F45; border-bottom: 2px solid #E5B869; padding-bottom: 10px;">Pase de Abordar Electrónico 🎫</h2>
          <div style="margin-top: 20px;">
            <p style="color: #555;"><strong>Fecha y Hora de Salida:</strong> ${new Date(flightDetails.departureTime).toLocaleString()}</p>
          </div>
          <h3 style="color: #2A3F45; margin-top: 30px;">Pasajeros Registrados:</h3>
          <ul style="color: #555; line-height: 1.6;">
            ${passengers.map(p => `<li><strong>${p.fullName}</strong> (Doc: ${p.document})</li>`).join('')}
          </ul>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-top: 30px; border: 1px dashed #ccc;">
            <p style="font-size: 16px; color: #555; margin: 0;">Total Facturado</p>
            <p style="font-size: 24px; color: #2A3F45; font-weight: bold; margin: 5px 0 0 0;">$${totalAmount}</p>
          </div>
          <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">Gracias por volar con AeroManage. ¡Buen viaje!</p>
        </div>
      </div>
    `;

    await sgMail.send({
      to: userEmail,
      from: process.env.EMAIL_USER,
      subject: '✈️ Confirmación de Reserva - AeroManage',
      html: htmlContent,
    });

    console.log(`✉️ Correo enviado exitosamente a: ${userEmail}`);
  } catch (error) {
    console.error('Error enviando el correo:', error.response?.body || error);
  }
};

export const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #2A3F45; padding: 30px; text-align: center;">
        <h1 style="color: #E5B869; margin: 0; font-size: 28px;">AeroManage</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Restablecer contraseña</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #2A3F45;">Hola, ${userName} 👋</h2>
        <p style="color: #555;">Recibimos una solicitud para restablecer tu contraseña.</p>
        <p style="color: #555;">Este enlace expira en <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetLink}" style="background-color: #E5B869; color: #2A3F45; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">Si no solicitaste esto, ignora este correo.</p>
      </div>
    </div>
  `;

  try {
    await sgMail.send({
      to: userEmail,
      from: process.env.EMAIL_USER,
      subject: '🔐 Restablecer contraseña - AeroManage',
      html: htmlContent,
    });
    console.log(`✉️ Correo de recuperación enviado a: ${userEmail}`);
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error.response?.body || error);
    throw error;
  }
};