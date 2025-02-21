import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'This email is already on the waitlist!' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Add to Supabase
    const { error: dbError } = await supabase
      .from('waitlist')
      .insert([{ email, signed_up_at: new Date() }]);

    if (dbError) throw dbError;

    // Send confirmation email
    await resend.emails.send({
      from: 'Vocal <hello@vocalwaitlist.com>',
      to: email,
      subject: 'Welcome to Vocal Waitlist! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Welcome to Vocal! 🎤</h1>
          
          <p>Thanks for joining our waitlist! You're now one step closer to unlocking your voice with AI-powered speech therapy.</p>
          
          <h2>What's Next?</h2>
          <ul>
            <li>Share with friends to move up the waitlist</li>
            <li>Top 100 referrers get free premium access</li>
            <li>Stay tuned for updates and early access</li>
          </ul>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="margin: 0; color: #1e293b;">
              <strong>Tip:</strong> Share this link with friends to move up the waitlist:
              <br>
              <a href="https://vocalwaitlist.com" style="color: #3b82f6;">https://vocalwaitlist.com</a>
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            You're receiving this because you signed up for the Vocal waitlist.
            <br>
            To unsubscribe, simply ignore this email.
          </p>
        </div>
      `
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process subscription' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 