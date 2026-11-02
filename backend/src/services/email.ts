import axios from "axios";

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendPasswordResetEmail(email: string, code: string) {
    const from = process.env.RESEND_FROM_EMAIL || "Linked <onboarding@resend.dev>";

    await axios.post(
        RESEND_API_URL,
        {
            from,
            to: email,
            subject: "Your Linked password reset code",
            html: `
                <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
                    <h2>Reset your password</h2>
                    <p>Use this code to reset your Linked password. It expires in 15 minutes.</p>
                    <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">${code}</p>
                    <p style="color: #666; font-size: 13px;">If you didn't request this, you can ignore this email.</p>
                </div>
            `,
        },
        { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } },
    );
}
