const nodemailer = require('nodemailer');
const sendAppointmentEmail = async (userEmail, serviceName, date, time) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS  
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Appointment Confirmation',
        html: `
            <h3>Appointment Confirmation</h3>
            <p>Your appointment for <strong>${serviceName}</strong> has been confirmed.</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p>Thank you for choosing our service!</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendAppointmentEmail };