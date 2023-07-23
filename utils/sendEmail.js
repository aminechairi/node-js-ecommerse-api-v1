const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Create a transporter object ( servise that will send email like "gmail", "mailgun", "mailtrap", "sendgrid" )
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT, // if secure false port = 587, true port = 465
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Set up the email message
  const mailOptions = {
    from: "E-shop App <aminechairi2000@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: "<h1>This is a test email</h1><p>This is the body of the email.</p>",
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;