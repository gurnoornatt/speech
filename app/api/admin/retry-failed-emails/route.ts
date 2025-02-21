import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

if (!process.env.NEXT_PUBLIC_ADMIN_KEY) {
  throw new Error('NEXT_PUBLIC_ADMIN_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple API key validation
const validateApiKey = (apiKey: string) => {
  return apiKey === process.env.NEXT_PUBLIC_ADMIN_KEY;
};

// Sleep function for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // If it's not a rate limit error, throw immediately
      if (error?.statusCode !== 429) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Rate limit hit, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

export async function POST(request: Request) {
  try {
    const { subject, html, apiKey, emails } = await request.json();

    // Validate admin API key
    if (!validateApiKey(apiKey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No emails provided for retry' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Retrying ${emails.length} failed emails...`);

    let successfulRetries = 0;
    const remainingFailures: { email: string; error: string }[] = [];

    // Process each email with a delay between sends
    for (const email of emails) {
      try {
        await retryWithBackoff(async () => {
          await resend.emails.send({
            from: 'Vocal <hello@vocalwaitlist.com>',
            to: email,
            subject,
            html,
          });
        });
        
        successfulRetries++;
        console.log(`Successfully retried send to ${email}`);
        
        // Wait 500ms between each email (2 emails per second as per rate limit)
        await sleep(500);
        
      } catch (emailError: any) {
        console.error(`Failed to retry email to ${email}:`, emailError);
        remainingFailures.push({ 
          email, 
          error: emailError?.message || 'Unknown error' 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        successfulRetries,
        remainingFailures,
        totalAttempted: emails.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Retry error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retry emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 