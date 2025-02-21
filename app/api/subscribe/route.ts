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

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // First check if we can access the table
    const { data: checkData, error: checkError } = await supabase
      .from('waitlist')
      .select('count(*)');

    if (checkError) {
      console.error('Table access check error:', checkError);
      return new Response(
        JSON.stringify({ 
          error: 'Database access error',
          details: checkError.message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if email already exists
    const { data: existingData, error: existingError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingError) {
      console.error('Email check error:', existingError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check email',
          details: existingError.message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (existingData) {
      return new Response(
        JSON.stringify({ error: 'This email is already on the waitlist!' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Add to Supabase with explicit schema
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert([{ 
        email: email.toLowerCase().trim(),
        signed_up_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to add email to waitlist',
          details: insertError.message 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
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
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Still return success since the user was added to waitlist
      // but log the email error for debugging
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 