const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"AgroAgent AI" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

const sendTaskReminder = async (userEmail, taskTitle, daysOverdue) => {
    const subject = `Task Reminder: ${taskTitle}`;
    const html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #d32f2f;">Task Overdue</h2>
            <p>Hello,</p>
            <p>This is a reminder that your task <strong>"${taskTitle}"</strong> is overdue by <strong>${daysOverdue} days</strong>.</p>
            <p>Please log in to AgroAgent to mark it as complete.</p>
            <br>
            <a href="http://localhost:8080/scheduler" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Tasks</a>
        </div>
    `;
    return sendEmail(userEmail, subject, html);
};

module.exports = { sendEmail, sendTaskReminder };
