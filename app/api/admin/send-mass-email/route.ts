import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

if (!process.env.NEXT_PUBLIC_ADMIN_KEY) {
  throw new Error('NEXT_PUBLIC_ADMIN_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    const { subject, html, apiKey } = await request.json();

    // Validate admin API key
    if (!validateApiKey(apiKey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching subscribers from Supabase...');
    
    // Get all waitlist emails
    const { data: subscribers, error: fetchError } = await supabase
      .from('waitlist')
      .select('email, signed_up_at')
      .order('signed_up_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      throw fetchError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No subscribers found in the database');
      return new Response(
        JSON.stringify({ 
          error: 'No subscribers found in the database',
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          queryResult: subscribers 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${subscribers.length} subscribers`);

    // Send emails in smaller batches with longer delays
    const batchSize = 10; // Reduced from 50 to 10
    const emails = subscribers.map(s => s.email);
    const batches = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    console.log(`Sending emails in ${batches.length} batches`);

    // Process each batch
    let successfulSends = 0;
    let failedEmails: { email: string; error: string }[] = [];

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);
      
      // Process each email in the batch with a delay between each
      for (const email of batch) {
        try {
          await retryWithBackoff(async () => {
            await resend.emails.send({
              from: 'Vocal <hello@vocalwaitlist.com>',
              to: email,
              subject,
              html,
            });
          });
          
          successfulSends++;
          console.log(`Successfully sent to ${email}`);
          
          // Wait 500ms between each email (2 emails per second as per rate limit)
          await sleep(500);
          
        } catch (emailError: any) {
          console.error(`Failed to send email to ${email}:`, emailError);
          failedEmails.push({ 
            email, 
            error: emailError?.message || 'Unknown error' 
          });
        }
      }
      
      // Wait 2 seconds between batches
      if (batchIndex < batches.length - 1) {
        console.log('Waiting between batches...');
        await sleep(2000);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: successfulSends,
        totalSubscribers: subscribers.length,
        failedEmails,
        batchesProcessed: batches.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Mass email error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send mass email',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}