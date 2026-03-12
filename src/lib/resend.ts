// src/lib/resend.ts
import { Resend as ResendClient } from "resend";

const client = new ResendClient(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL || "hello@lekkerstock.com";

export const resend = {
  async sendEmailVerification(email: string, name: string, verifyUrl: string) {
    return client.emails.send({
      from: `Lekkerstock <${FROM}>`,
      to: email,
      subject: "Verify your Lekkerstock email",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0e0c0a;color:#faf6ef;padding:48px 36px;border-radius:8px">
          <h1 style="font-size:28px;margin-bottom:8px">Welcome, ${name || "Creator"} 👋</h1>
          <p style="color:rgba(250,246,239,0.6);line-height:1.7;margin-bottom:32px">
            You're one step away from accessing the finest African stock content library.
            Click below to verify your email address.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;background:#c8692e;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;letter-spacing:.04em">
            Verify Email
          </a>
          <p style="margin-top:32px;font-size:12px;color:rgba(250,246,239,0.3)">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  },

  async sendPasswordReset(email: string, resetUrl: string) {
    return client.emails.send({
      from: `Lekkerstock <${FROM}>`,
      to: email,
      subject: "Reset your Lekkerstock password",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0e0c0a;color:#faf6ef;padding:48px 36px;border-radius:8px">
          <h1 style="font-size:28px;margin-bottom:8px">Password Reset</h1>
          <p style="color:rgba(250,246,239,0.6);line-height:1.7;margin-bottom:32px">
            We received a request to reset your password. Click below to create a new one.
            This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#c8692e;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;letter-spacing:.04em">
            Reset Password
          </a>
          <p style="margin-top:32px;font-size:12px;color:rgba(250,246,239,0.3)">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  },

  async sendSubscriptionConfirmation(email: string, name: string, plan: string, amount: string) {
    return client.emails.send({
      from: `Lekkerstock <${FROM}>`,
      to: email,
      subject: `Your ${plan} subscription is active 🎉`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0e0c0a;color:#faf6ef;padding:48px 36px;border-radius:8px">
          <h1 style="font-size:28px;margin-bottom:8px">You're subscribed!</h1>
          <p style="color:rgba(250,246,239,0.6);line-height:1.7;margin-bottom:24px">
            Hi ${name}, your <strong style="color:#c8692e">${plan}</strong> subscription is now active.
            You've been charged ${amount} and will be billed monthly.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace" style="display:inline-block;background:#c8692e;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;letter-spacing:.04em">
            Start Exploring
          </a>
        </div>
      `,
    });
  },

  async sendAssetApproved(email: string, name: string, assetTitle: string) {
    return client.emails.send({
      from: `Lekkerstock <${FROM}>`,
      to: email,
      subject: `Your asset "${assetTitle}" has been approved ✓`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0e0c0a;color:#faf6ef;padding:48px 36px;border-radius:8px">
          <h1 style="font-size:28px;margin-bottom:8px">Asset Approved!</h1>
          <p style="color:rgba(250,246,239,0.6);line-height:1.7;margin-bottom:24px">
            Hi ${name}, your asset <strong>"${assetTitle}"</strong> has been approved and is now live on the marketplace.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/contributor/studio" style="display:inline-block;background:#c8692e;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;letter-spacing:.04em">
            View in Studio
          </a>
        </div>
      `,
    });
  },

  async sendWithdrawalConfirmation(email: string, name: string, amount: string) {
    return client.emails.send({
      from: `Lekkerstock <${FROM}>`,
      to: email,
      subject: "Withdrawal processed",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0e0c0a;color:#faf6ef;padding:48px 36px;border-radius:8px">
          <h1 style="font-size:28px;margin-bottom:8px">Withdrawal on its way</h1>
          <p style="color:rgba(250,246,239,0.6);line-height:1.7">
            Hi ${name}, your withdrawal of <strong style="color:#c8692e">${amount}</strong> has been processed.
            Funds typically arrive within 1-3 business days.
          </p>
        </div>
      `,
    });
  },
};
