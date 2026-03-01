import nodemailer from 'nodemailer';

// Configuramos el "cartero" con tus credenciales
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendTicketEmail = async (userEmail, userName, flightDetails, passengers, totalAmount) => {
    try {
        // Plantilla HTML del Ticket
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <div style="background-color: #2A3F45; padding: 30px; text-align: center;">
                    <h1 style="color: #E5B869; margin: 0; font-size: 28px;">Intouch Airlines</h1>
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
                    
                    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
                        Gracias por volar con Intouch Airlines. ¡Buen viaje!
                    </p>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: '"Intouch Airlines" <' + process.env.EMAIL_USER + '>',
            to: userEmail,
            subject: '✈️ Confirmación de Reserva - Intouch Airlines',
            html: htmlContent
        });

        console.log(`✉️ Correo enviado exitosamente a: ${userEmail}`);
    } catch (error) {
        console.error(' Error enviando el correo:', error);
    }
};