import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Creates nodemailer transporter if SMTP credentials exist, else returns null
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends transactional email (e.g. event creation, tickets)
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || '"TMD — The Match Date" <notifications@tmd.dizitio.com>';

    if (!transporter) {
      console.log(`[EMAIL NOTICE (SMTP Not Configured)] To: ${to} | Subject: ${subject}`);
      return true;
    }

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || subject,
    });

    console.log(`Email sent successfully to ${to}, messageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return false;
  }
}

/**
 * Helper to generate and send Event Creation Confirmation Email
 */
export async function sendEventCreatedEmail(
  toEmail: string,
  hostName: string,
  event: {
    title: string;
    category: string;
    venue: string;
    googleMapsUrl?: string | null;
    startDateTime: Date;
    isPaid: boolean;
    malePassPrice?: number | null;
    femalePassPrice?: number | null;
    couplePassPrice?: number | null;
    generalPassPrice?: number | null;
  }
) {
  const dateFormatted = new Date(event.startDateTime).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = `🎉 You have successfully created your event: "${event.title}"!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${event.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <div style="max-width: 560px; margin: 30px auto; background-color: #121218; border-radius: 20px; border: 1px solid rgba(255, 198, 41, 0.3); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    
    <!-- Header with Aura Gold Accent -->
    <div style="background: linear-gradient(135deg, #FFC629 0%, #F59E0B 100%); padding: 25px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #000000; letter-spacing: -0.5px;">TMD — The Match Date</h1>
      <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: rgba(0,0,0,0.8);">Real World Singles Events &amp; Mixers</p>
    </div>

    <!-- Body -->
    <div style="padding: 30px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 40px;">🎉</span>
        <h2 style="margin: 10px 0 5px 0; font-size: 20px; font-weight: 800; color: #ffffff;">Event Created Successfully!</h2>
        <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Hi <strong>${hostName}</strong>, your event is now live and published on the TMD Map.</p>
      </div>

      <!-- Event Details Card -->
      <div style="background-color: #181822; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.08); padding: 20px; margin-bottom: 25px;">
        <div style="margin-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); pb: 12px;">
          <span style="display: inline-block; padding: 3px 10px; border-radius: 20px; background-color: rgba(255, 198, 41, 0.15); border: 1px solid rgba(255, 198, 41, 0.3); color: #FFC629; font-size: 11px; font-weight: bold; text-transform: uppercase;">${event.category}</span>
          <h3 style="margin: 8px 0 0 0; font-size: 18px; font-weight: 800; color: #ffffff;">${event.title}</h3>
        </div>

        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa; width: 35%;">🗓️ Date &amp; Time:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${dateFormatted} (IST)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">📍 Venue:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${event.venue}</td>
          </tr>
          ${
            event.googleMapsUrl
              ? `<tr>
                  <td style="padding: 6px 0; color: #a1a1aa;">🗺️ Google Maps:</td>
                  <td style="padding: 6px 0;"><a href="${event.googleMapsUrl}" style="color: #FFC629; font-weight: bold; text-decoration: underline;" target="_blank">Open Location Link ↗</a></td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">🎟️ Pass Type:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${event.isPaid ? "Paid Passes (TMD Instant UPI)" : "Free Entry (RSVP)"}</td>
          </tr>
          ${
            event.isPaid
              ? `<tr>
                  <td style="padding: 6px 0; color: #a1a1aa; vertical-align: top;">💰 Pricing:</td>
                  <td style="padding: 6px 0; color: #FFC629; font-weight: bold;">
                    Male: ₹${event.malePassPrice || 499} • Female: ₹${event.femalePassPrice || 199} • Couple: ₹${event.couplePassPrice || 799}
                  </td>
                </tr>`
              : ""
          }
        </table>
      </div>

      <!-- Live Dashboard Button -->
      <div style="text-align: center; margin: 30px 0 20px 0;">
        <a href="https://tmd.dizitio.com/map" style="display: inline-block; padding: 14px 32px; border-radius: 50px; background: linear-gradient(135deg, #FFC629 0%, #F59E0B 100%); color: #000000; font-size: 14px; font-weight: 900; text-decoration: none; box-shadow: 0 4px 15px rgba(255, 198, 41, 0.3);">
          View My Event on Map &amp; Guest List 🚀
        </a>
      </div>

      <p style="text-align: center; font-size: 11px; color: #71717a; margin-top: 20px;">
        Whenever attendees book tickets or request to join, you will receive real-time notifications on TMD.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 15px 30px; background-color: #0d0d12; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #71717a;">
      © ${new Date().getFullYear()} TMD — The Match Date. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
  });
}
