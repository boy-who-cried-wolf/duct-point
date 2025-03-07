
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const LOOP_API_KEY = Deno.env.get("LOOP_API_KEY");
const LOOP_WORKSPACE_ID = Deno.env.get("LOOP_WORKSPACE_ID");

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log the environment variables (without revealing the full values for security)
    console.log("Environment check:", {
      hasLoopApiKey: !!LOOP_API_KEY,
      loopApiKeyPrefix: LOOP_API_KEY ? LOOP_API_KEY.substring(0, 4) + "..." : "not set",
      hasLoopWorkspaceId: !!LOOP_WORKSPACE_ID,
      loopWorkspaceIdPrefix: LOOP_WORKSPACE_ID ? LOOP_WORKSPACE_ID.substring(0, 4) + "..." : "not set",
    });

    // If we're missing required environment variables
    if (!LOOP_API_KEY || !LOOP_WORKSPACE_ID) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required environment variables", 
          details: {
            LOOP_API_KEY: LOOP_API_KEY ? "✅ Set" : "❌ Missing",
            LOOP_WORKSPACE_ID: LOOP_WORKSPACE_ID ? "✅ Set" : "❌ Missing"
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Attempt to call the Loop.so API to check connectivity
    const response = await fetch("https://api.loop.so/v1/templates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOOP_API_KEY}`,
        "Loop-Workspace-Id": LOOP_WORKSPACE_ID,
      },
    });

    // Get the response data
    const result = await response.json();

    // Return detailed information about the API response
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        hasApiAccess: response.ok,
        responseData: result,
        message: response.ok ? "Successfully connected to Loop.so API" : "Failed to connect to Loop.so API"
      }),
      {
        status: response.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in test-email-integration function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        message: "An exception occurred while testing Loop.so integration"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
