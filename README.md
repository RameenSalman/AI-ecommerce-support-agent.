# AI E-commerce Support Agent

An AI-powered customer support chatbot built with **Next.js, Google Gemini, and Google Sheets**. It helps customers get product information, check order details, understand store policies, and submit refund requests through a conversational interface.

## Overview

The AI E-commerce Support Agent combines generative AI with structured spreadsheet data to provide useful, context-aware customer support for an online clothing store.

Instead of relying entirely on AI-generated answers, the application retrieves product and order information from Google Sheets and uses a store policy file to guide responses.

## Features

- **AI-Powered Chatbot** — Answers customer questions through a conversational interface using Google Gemini.
- **Product Information** — Retrieves product prices, discounts, stock availability, and promotions from Google Sheets.
- **Order Lookup** — Retrieves verified order details, including the order status, item, and amount.
- **Policy-Based Responses** — Uses store policies covering returns, refunds, exchanges, and shipping.
- **Refund Ticket Creation** — Creates refund tickets with unique ticket IDs and records them in Google Sheets.
- **Ticket Tracking** — Stores order IDs, customer names, refund reasons, ticket statuses, and creation timestamps.
- **Conversation Context** — Uses recent conversation history to support follow-up messages.
- **Error Handling** — Handles invalid order IDs, missing information, and API errors.
- **Markdown Responses** — Supports formatted AI responses in the chat interface.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and API routes |
| React | Chat interface |
| TypeScript | Application logic and type safety |
| Google Gemini API | AI-generated customer support responses |
| Google Sheets API | Product and order retrieval, refund ticket storage |
| Tailwind CSS | User interface styling |
| Node.js | Server-side execution |

## How It Works

1. A customer submits a question through the chatbot.
2. The application identifies whether the request concerns products, orders, store policies, or a refund.
3. Product and order information is retrieved from Google Sheets when needed.
4. Store policy information and verified data are provided to Gemini to help generate a relevant response.
5. For refund requests, the application collects the order ID and reason, then creates a ticket in Google Sheets.
6. The chatbot returns the response or the generated refund ticket ID.

## Project Structure

```text
ecommerce-support-agent/
├── src/
│   └── app/
│       ├── api/
│       │   └── chat/
│       │       └── route.ts
│       ├── page.tsx
│       ├── layout.tsx
│       └── globals.css
├── public/
├── prompt.txt
├── policy.txt
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── service-account.json
└── README.md
```

**Note:** `service-account.json` and `.env.local` are local configuration files and must not be committed to GitHub.

## Google Sheets Setup

The application uses one Google Spreadsheet with three tabs.

### 1. Products

| Column | Description |
|---|---|
| Product ID | Unique product identifier |
| Product Name | Product name |
| Price | Product price |
| Discount | Discount percentage or value |
| Stock | Available stock quantity |
| Promotion | Promotion details |

### 2. Orders

| Column | Description |
|---|---|
| Order ID | Unique order identifier |
| Customer | Customer name |
| Item | Ordered product |
| Status | Current order status |
| Amount | Order amount |

### 3. Tickets

| Column | Description |
|---|---|
| Ticket ID | Generated refund ticket identifier |
| Order ID | Associated order |
| Customer | Customer name |
| Reason | Customer's refund reason |
| Status | Ticket status |
| Created At | Ticket creation timestamp |

Share the spreadsheet with your Google Cloud service account email. The account needs permission to read product and order data and create refund tickets.

## Getting Started

### Prerequisites

- Node.js and npm
- A Google Gemini API key
- A Google Cloud service account with a JSON key
- A Google Spreadsheet configured with the required tabs

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ecommerce-support-agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

Replace the example values with your own credentials. Never commit this file.

### 4. Configure Google Sheets credentials

Place your Google service account JSON key in the project root and name it:

```text
service-account.json
```

Enable the Google Sheets API in Google Cloud Console and share your spreadsheet with the service account email.

### 5. Configure the store files

Ensure `prompt.txt` contains the chatbot instructions and `policy.txt` contains the store's return, refund, exchange, and shipping policies.

### 6. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Example Queries

Try asking the chatbot:

- "What is the price of the Black Hoodie?"
- "Are there any promotions available?"
- "Where is my order ORD-1001?"
- "What is your return policy?"
- "I want a refund for ORD-1002 because the item doesn't fit."

Refund requests are recorded as **Pending** tickets. Creating a ticket does not mean that a refund has been approved.

## Security Notes

- Keep API keys and service account credentials out of source control.
- Restrict access to the Google Spreadsheet and service account.
- Do not expose server-side credentials in client-side code.
- Use environment variables for sensitive configuration.

## Current Scope

This project demonstrates AI-assisted customer support, spreadsheet-based data retrieval, and refund ticket creation.

Automated refund confirmation emails and general interaction logging are not included in the current implementation. Refund tickets are recorded as pending requests rather than automatically approved refunds.

## Future Improvements

- Add customer interaction logging and support analytics.
- Improve refund eligibility evaluation using additional order and delivery data.
- Add authentication and customer-specific order access.
- Add automated email notifications for approved refunds.

---

**Built with Next.js, TypeScript, Google Gemini, and Google Sheets.**