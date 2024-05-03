const sgMail = require("@sendgrid/mail");

require("dotenv").config();

sgMail.setApiKey(process.env.SEND_GRID_PASSWORD);

const sendVerificationEmail = async (email, verificationToken) => {
  const msg = {
    from: process.env.EMAIL,
    to: email,
    subject: "Please verify your email address",
    text: `Thank you for registering! Please click on the following link to verify your email address: ${process.env.BASE_URL}/api/users/verify/${verificationToken}`,
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = {
  sendVerificationEmail,
};
