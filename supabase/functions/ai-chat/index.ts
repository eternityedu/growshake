import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  type: "trending" | "health" | "farmer" | "admin";
  context?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, context } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on type
    let systemPrompt = "";
    
    switch (type) {
      case "trending":
        systemPrompt = `You are a vegetable trends AI assistant for GrowShare platform. 
        You analyze vegetable ordering patterns and provide insights about:
        - Which vegetables are most popular
        - Trending vegetables based on recent orders
        - Seasonal recommendations
        - Demand patterns
        
        Current database context: ${JSON.stringify(context || {})}
        
        Be concise, helpful, and focus on vegetable trends. Use emojis occasionally for friendliness.`;
        break;
        
      case "health":
        systemPrompt = `You are a health and nutrition AI advisor for GrowShare platform.
        You help users understand:
        - Health benefits of different vegetables
        - Which vegetables are good for specific health conditions (diabetes, blood pressure, digestion, etc.)
        - Nutritional information
        - Personalized vegetable recommendations
        
        Available vegetables on platform: ${JSON.stringify(context?.vegetables || [])}
        
        Be caring, informative, and provide evidence-based advice. Always recommend consulting a doctor for medical advice.`;
        break;
        
      case "farmer":
        systemPrompt = `You are a farming assistant AI for GrowShare platform.
        You help farmers by:
        - Showing trending vegetables users want
        - Suggesting which vegetables to grow based on demand
        - Providing platform usage tips
        - Answering farming-related questions
        
        Current trends data: ${JSON.stringify(context || {})}
        
        Be practical, helpful, and farmer-friendly. Focus on actionable insights.`;
        break;
        
      case "admin":
        systemPrompt = `You are an admin analytics AI for GrowShare platform.
        You provide insights about:
        - Overall platform trends
        - User and farmer activity overview
        - Vegetable demand across the platform
        - Business insights
        
        Platform data: ${JSON.stringify(context || {})}
        
        Be professional, data-driven, and provide actionable insights.`;
        break;
        
      default:
        systemPrompt = "You are a helpful AI assistant for GrowShare, a platform connecting users with farmers.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
