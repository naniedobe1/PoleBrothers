import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      const { filename, contentType } = await request.json();

      if (!filename) {
        return new Response(JSON.stringify({ error: 'Filename is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFilename = `poles/${timestamp}-${filename}`;

      // Create AWS client for R2
      const client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      });

      // R2 endpoint
      const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      const url = `${endpoint}/${env.R2_BUCKET_NAME}/${uniqueFilename}`;

      // Generate presigned URL (valid for 1 hour)
      const signedUrl = await client.sign(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType || 'image/jpeg',
        },
        aws: {
          signQuery: true,
          // Expiration time in seconds
          expiresIn: 3600,
        },
      });

      // Public URL (if bucket has public access or custom domain)
      const publicUrl = `${env.R2_PUBLIC_URL}/${uniqueFilename}`;

      return new Response(
        JSON.stringify({
          uploadUrl: signedUrl.url,
          publicUrl: publicUrl,
          filename: uniqueFilename,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
