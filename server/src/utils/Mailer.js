import sgMail from "@sendgrid/mail";
import { env } from "../config/env.js";

// Initialize SendGrid with API key
if (env.sendgridApiKey) {
  sgMail.setApiKey(env.sendgridApiKey);
  console.log("SendGrid initialized successfully");
} else {
  console.warn("WARNING: SENDGRID_API_KEY not configured. Email sending will fail.");
}

const FROM_EMAIL = "abdalkareemnegm@gmail.com"; // Change to your verified SendGrid sender email

export async function sendEmail(to, subject, text, html = null) {
  try {
    console.log(`Attempting to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    
    if (!env.sendgridApiKey) {
      throw new Error("SendGrid API key not configured (SENDGRID_API_KEY missing)");
    }
    
    const msg = {
      to,
      from: FROM_EMAIL,
      subject,
      text,
    };
    
    // Add HTML if provided
    if (html) {
      msg.html = html;
    }
    
    const [response] = await sgMail.send(msg);
    
    console.log("Email sent successfully! Status:", response.statusCode);
    return response;
  } catch (error) {
    console.error("FAILED TO SEND EMAIL:", error.message);
    console.error("Full error:", error.response?.body || error);
    throw error; // Re-throw so caller knows it failed
  }
}