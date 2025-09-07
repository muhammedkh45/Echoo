import { EventEmitter } from "events";
import { sendEmail } from "../../services/email.service";
import { emailTemplate } from "../../services/email.template";

export const eventEmitter = new EventEmitter();
eventEmitter.on("sendEmail", (data) => {
  const { email, OTP, subject } = data;
  sendEmail({ to: email, html: emailTemplate(OTP), subject: subject });
});
