
import { GoogleGenAI } from "@google/genai";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { google } from "googleapis";

type HistoryItem = {
    role: "user" | "assistant";
    content: string;
};

function isHistoryItem(value: unknown): value is HistoryItem {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const item = value as Record<string, unknown>;

    return (
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    );
}

async function lookupOrder(orderId: string) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Google Sheets spreadsheet ID is missing.");
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: join(process.cwd(), "service-account.json"),
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
        ],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'Orders'!A:E",
    });

    const rows = result.data.values ?? [];

    const order = rows.slice(1).find(
        (row) =>
            String(row[0] ?? "").trim().toUpperCase() ===
            orderId.trim().toUpperCase()
    );

    if (!order) {
        return null;
    }

    return {
        orderId: String(order[0] ?? ""),
        customer: String(order[1] ?? ""),
        item: String(order[2] ?? ""),
        status: String(order[3] ?? ""),
        amount: String(order[4] ?? ""),
    };
}

async function lookupProducts() {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Google Sheets spreadsheet ID is missing.");
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: join(process.cwd(), "service-account.json"),
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
        ],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "'Products'!A:F",
    });

    const rows = result.data.values ?? [];

    return rows.slice(1)
        .filter((row) => String(row[1] ?? "").trim() !== "")
        .map((row) => ({
            id: String(row[0] ?? ""),
            name: String(row[1] ?? ""),
            price: String(row[2] ?? ""),
            discount: String(row[3] ?? ""),
            stock: String(row[4] ?? ""),
            promotion: String(row[5] ?? ""),
        }));
}

async function createRefundTicket(
    orderId: string,
    customer: string,
    reason: string
) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Google Sheets spreadsheet ID is missing.");
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: join(process.cwd(), "service-account.json"),
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets",
        ],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const ticketId = `TKT-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'Tickets'!A:F",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
            values: [[
                ticketId,
                orderId,
                customer,
                reason,
                "Pending",
                createdAt,
            ]],
        },
    });

    return ticketId;
}

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: "Gemini API key is missing. Check your .env.local file." },
            { status: 500 }
        );
    }

    let body: { message?: unknown; history?: unknown };

    try {
        body = await request.json();
    } catch {
        return Response.json(
            { error: "Invalid request format." },
            { status: 400 }
        );
    }

    const { message, history } = body;

    if (typeof message !== "string" || !message.trim()) {
        return Response.json(
            { error: "Please enter a message." },
            { status: 400 }
        );
    }

    const userMessage = message.trim().slice(0, 4000);

    const recentHistory: HistoryItem[] = Array.isArray(history)
        ? history.filter(isHistoryItem).slice(-10)
        : [];

    const contents = [
        ...recentHistory.map((item) => ({
            role:
                item.role === "assistant"
                    ? ("model" as const)
                    : ("user" as const),
            parts: [{ text: item.content.slice(0, 4000) }],
        })),
        {
            role: "user" as const,
            parts: [{ text: userMessage }],
        },
    ];

    try {
        const [prompt, policy, products] = await Promise.all([
            readFile(join(process.cwd(), "prompt.txt"), "utf8"),
            readFile(join(process.cwd(), "policy.txt"), "utf8"),
            lookupProducts(),
        ]);

        // Detect refund requests in the current or recent conversation.
        const refundPattern =
            /\b(refund|money back|return my money)\b/i;

        const isRefundRequest = refundPattern.test(userMessage);

        const previousRefundMessage = [...recentHistory]
            .reverse()
            .find(
                (item) =>
                    item.role === "user" &&
                    refundPattern.test(item.content)
            )?.content;

        const isRefundFlow =
            isRefundRequest || Boolean(previousRefundMessage);

        const effectiveMessage = previousRefundMessage
            ? `${previousRefundMessage}\n${userMessage}`
            : userMessage;

        const orderId =
            userMessage.match(/\bORD-\d+\b/i)?.[0]?.toUpperCase() ??
            previousRefundMessage
                ?.match(/\bORD-\d+\b/i)?.[0]?.toUpperCase();

        // Handle refund requests before calling Gemini.
        if (isRefundFlow) {
            if (!orderId) {
                return Response.json({
                    reply:
                        "I can help you submit a refund request. Please provide your Order ID.",
                });
            }

            const reasonMatch = effectiveMessage.match(
                /\b(?:because|reason is|reason:)\s+(.+?)(?:[.!?]|$)/i
            );

            const reason = reasonMatch?.[1]?.trim();

            if (!reason) {
                return Response.json({
                    reply:
                        `I've got your Order ID ${orderId}. Please tell me the reason for your refund request.`,
                });
            }

            const order = await lookupOrder(orderId);

            if (!order) {
                return Response.json({
                    reply:
                        `I couldn't find order ${orderId}. Please check the Order ID and try again.`,
                });
            }

            // Use the customer name from the verified order record.
            const ticketId = await createRefundTicket(
                order.orderId,
                order.customer,
                reason
            );

            return Response.json({
                reply:
                    `Your refund request has been recorded. Your ticket ID is ${ticketId}. ` +
                    "Its status is Pending, and the refund has not yet been approved.",
            });
        }

        // Handle ordinary order lookups.
        let orderContext = "";

        if (orderId) {
            const order = await lookupOrder(orderId);

            if (!order) {
                return Response.json({
                    reply:
                        `I couldn't find order ${orderId}. Please check the Order ID and try again.`,
                });
            }

            orderContext = `
Verified order information from Google Sheets:
Order ID: ${order.orderId}
Customer: ${order.customer}
Item: ${order.item}
Status: ${order.status}
Amount: ${order.amount}

Use these verified details only.
Do not invent delivery dates or shipping updates.
Do not disclose stored customer information unnecessarily.
`;
        }

        const productContext = products.length
            ? JSON.stringify(products, null, 2)
            : "No product records are currently available.";

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents,
            config: {
                systemInstruction: `${prompt}

Store policy reference:
${policy}

Product information from Google Sheets:
${productContext}

${orderContext}

Use the verified product information to answer questions about
product prices, discounts, availability, and promotions.
Do not invent product details or promotions.
If a product is not listed, say that you could not find it.
Use verified order information when available.
Answer policy questions using the provided store policies.
If an order ID is needed but missing, ask for it.
Never invent order details, prices, or statuses.
Do not claim that a refund ticket was created unless
the ticket-creation function confirms it.
Automated email functionality is not implemented.`,
                maxOutputTokens: 600,
            },
        });

        const reply = response.text?.trim();

        if (!reply) {
            return Response.json(
                {
                    error: "The AI did not return a response. Please try again.",
                },
                { status: 502 }
            );
        }

        return Response.json({ reply });
    } catch (error) {
        console.error("Chat request failed:", error);

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
            },
            { status: 502 }
        );
    }
}
