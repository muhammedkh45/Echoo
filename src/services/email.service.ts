import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

export const sendEmail = async (mailOptions: Mail.Options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: process.env.CLIENT_EMAIL,
      pass: process.env.CLIENT_SECRET,
    },
  });

  await transporter.sendMail({
    from: `"Echoo "<${process.env.CLIENT_EMAIL}>`,
    ...mailOptions,
  });
};
