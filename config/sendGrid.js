import sgMail from "@sendgrid/mail";
import "dotenv/config";

const senderEmail = process.env.SENDGRID_EMAIL;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = (email, verificationToken) => {
  return {
    to: email,
    from: senderEmail,
    subject: "Email Verification",
    text: "Verify your email",
    html: `<a href="api/users/verify/${verificationToken}">Verify your email</a>`,
  };
};

const sendVerificationEmail = (email, verificationToken) =>
  sgMail
    .send(msg(email, verificationToken))
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });

export default sendVerificationEmail;
