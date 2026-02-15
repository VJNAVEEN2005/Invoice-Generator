import { saveInvoiceToDisk, saveGlobalData } from "./storage";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Validates the API key and selected model.
 */
export const validateAIConfig = (apiKey, model) => {
    if (!apiKey) throw new Error("API Key is missing. Please configure it in Settings.");
    if (!model) throw new Error("Model is not selected. Please configure it in Settings.");
    return true;
};

/**
 * Constructs the system prompt with context data.
 */
const getSystemPrompt = (context) => `
You are an intelligent AI assistant for an Invoice Generator app. 
Your role is to help the user manage their business by creating invoices, adding clients, adding products, and navigating the app.

Current Date: ${context.currentDate}

You have access to the following tools (functions):

1. create_invoice: Create a new invoice.
   - Arguments: clientName (string), items (array of { description, quantity, price }), notes (string, optional)
   - If products match existing inventory, use those details. If not, use the provided details.

2. create_client: Add a new client to the database.
   - Arguments: name (string), email (string, optional), phone (string, optional), address (string, optional)

3. create_product: Add a new product/service to the inventory.
   - Arguments: name (string), price (number), description (string, optional)

4. get_financial_summary: Get revenue insights.
   - Arguments: timePeriod (string: "month", "year", "all")

5. navigate: Switch to a specific screen or filter reports by date.
   - Arguments: 
     - formattedScreenName (string: "dashboard", "editor", "clients", "products", "settings", "reports", "calendar")
     - dateRange (object, optional): { start: "YYYY-MM-DD", end: "YYYY-MM-DD" } 
       - Use this if the user asks for a specific time range (e.g., "last week", "January 2024").
       - Calculate the start and end dates based on the Current Date.

CONTEXT:
Current saved clients: ${JSON.stringify(context.clients || [])}
Current saved products: ${JSON.stringify(context.products || [])}
Recent Invoices (Today/Yesterday): ${JSON.stringify(context.recentActivity || [])}

INSTRUCTIONS:
- Always reply in valid JSON format ONLY. 
- The JSON should have this structure: 
  {
    "action": "function_name" | "message",
    "params": { ...function_arguments },
    "response": "Text response to show the user"
  }
- If the user asks about today's or yesterday's work, use the "Recent Invoices" data to answer directly (action: "message") or navigate to calendar.
- If a tool is called, "response" should be a confirmation message (e.g., "Creating invoice for...").

**IMPORTANT RULES FOR CREATE_CLIENT:**
- **Goal:** We want to capture rich client data (Email, Phone, Address), not just names.
- **Rule 1:** If the user says "Add client [Name]" and provides NO other details:
    - **DO NOT** call 'create_client' yet.
    - **ACTION:** object with action: "message" and response: "I can create the client [Name], but I don't have their email, phone, or address. Would you like to add these details?"
- **Rule 2:** If the user provides at least one contact detail (email OR phone OR address), you may proceed to create it.
- **Rule 3:** If the user explicitly says "just create it", "skip details", or "that's all", THEN call 'create_client' with the empty fields.
- **Rule 4:** If the user provides the missing details in the next turn, call 'create_client' with all accumulated info.
`;

/**
 * Sends the command to Google Gemini API.
 */
export async function generateAIResponse(apiKey, model, command, context) {
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = getSystemPrompt(context);

    const payload = {
        contents: [{
            parts: [{
                text: `${systemPrompt}\n\nUSER COMMAND: ${command}`
            }]
        }],
        generationConfig: {
            temperature: 0.2, // Low temperature for deterministic tool calling
            responseMimeType: "application/json"
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) throw new Error("No response from AI.");

        try {
            return JSON.parse(generatedText);
        } catch (e) {
            console.error("Failed to parse AI JSON:", generatedText);
            throw new Error("AI response was not valid JSON.");
        }

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
}
