
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const LOOP_API_KEY = Deno.env.get("LOOP_API_KEY");
const LOOP_WORKSPACE_ID = Deno.env.get("LOOP_WORKSPACE_ID");

if (!LOOP_API_KEY) {
  console.error("Missing LOOP_API_KEY environment variable");
}

if (!LOOP_WORKSPACE_ID) {
  console.error("Missing LOOP_WORKSPACE_ID environment variable");
}

const LOOP_API_URL = "https://api.loop.so/v1/events/transactional";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  templateId: string;
  email: string;
  userId: string;
  data?: Record<string, any>;
  templateType: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request data
    const { templateId, email, userId, data = {}, templateType } = await req.json() as EmailRequest;

    if (!templateId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: templateId, email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending ${templateType} email to ${email} using template ${templateId}`);

    // Make the request to Loop.so API
    const response = await fetch(LOOP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOOP_API_KEY}`,
        "Loop-Workspace-Id": LOOP_WORKSPACE_ID,
      },
      body: JSON.stringify({
        eventName: "transactional_email",
        email,
        templateId,
        data,
      }),
    });

    // Get the response from Loop.so
    const result = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      console.error("Error sending email:", result);
      
      // Call the log_email_sent function in the database to log the failure
      const { error: logError } = await req.supabaseClient.rpc('log_email_sent', {
        p_user_id: userId,
        p_template_type: templateType,
        p_status: 'failed',
        p_error_message: JSON.stringify(result),
        p_metadata: { templateId, data }
      });
      
      if (logError) {
        console.error("Error logging email failure:", logError);
      }

      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log the successful email send
    const { error: logError } = await req.supabaseClient.rpc('log_email_sent', {
      p_user_id: userId,
      p_template_type: templateType,
      p_status: 'sent',
      p_metadata: { templateId, data }
    });
    
    if (logError) {
      console.error("Error logging email success:", logError);
    }

    // Return the success response
    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
