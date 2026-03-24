import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Resend } from "resend";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  // Only allow POST
  if (req.method !== "POST") {
    context.res = { status: 405, body: { error: "Method not allowed." } };
    return;
  }

  const { name, email, company, message } = req.body ?? {};

  // Validate required fields
  if (!name || !email || !message) {
    context.res = {
      status: 400,
      body: { error: "Missing required fields: name, email, message." },
    };
    return;
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    context.res = { status: 400, body: { error: "Invalid email address." } };
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    context.log.error("RESEND_API_KEY is not set.");
    context.res = { status: 500, body: { error: "Email service not configured." } };
    return;
  }

  const recipientEmail = process.env.CONTACT_EMAIL ?? "sreedev.melethil@i79.ai";

  const resend = new Resend(resendKey);

  // Sanitise inputs to prevent HTML injection
  const safe = (s: string) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    await resend.emails.send({
      from: "i79.ai Contact Form <noreply@i79.ai>",
      to: [recipientEmail],
      reply_to: email,
      subject: `New enquiry from ${safe(name)}${company ? ` — ${safe(company)}` : ""}`,
      html: `
        <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;color:#0f2420;">
          <div style="background:#0f766e;padding:24px 32px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
              New Contact Form Submission
            </h1>
            <p style="margin:4px 0 0;color:#99e6e0;font-size:13px;">via i79.ai</p>
          </div>

          <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:10px 0;font-weight:600;color:#6b7280;width:90px;vertical-align:top;">Name</td>
                <td style="padding:10px 0;color:#0f2420;">${safe(name)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-weight:600;color:#6b7280;vertical-align:top;">Email</td>
                <td style="padding:10px 0;">
                  <a href="mailto:${safe(email)}" style="color:#0f766e;">${safe(email)}</a>
                </td>
              </tr>
              ${
                company
                  ? `<tr>
                  <td style="padding:10px 0;font-weight:600;color:#6b7280;vertical-align:top;">Company</td>
                  <td style="padding:10px 0;color:#0f2420;">${safe(company)}</td>
                </tr>`
                  : ""
              }
            </table>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />

            <p style="font-weight:600;color:#6b7280;font-size:13px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.05em;">Message</p>
            <p style="font-size:14px;line-height:1.75;color:#0f2420;white-space:pre-wrap;margin:0;">${safe(message)}</p>
          </div>

          <div style="background:#f8fafa;padding:16px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#9ca3af;text-align:center;">
            Submitted via the contact form at <a href="https://i79.ai/contact" style="color:#0f766e;">i79.ai/contact</a>
          </div>
        </div>
      `,
    });

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { success: true },
    };
  } catch (err) {
    context.log.error("Resend email failed:", err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Failed to send email. Please try again later." },
    };
  }
};

export default httpTrigger;
