import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface OrderData {
  orderId: string;
  tableNumber: number;
  customerName?: string;
  items: {
    itemName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const orderData: OrderData = await req.json();

    const itemsList = orderData.items
      .map(
        (item) =>
          `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${item.itemName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background-color: white; padding: 20px; }
            .order-info { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .order-info p { margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background-color: #34495e; color: white; padding: 12px; text-align: left; }
            .total-row { background-color: #ecf0f1; font-weight: bold; }
            .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nouvelle Commande</h1>
            </div>
            <div class="content">
              <p>Une nouvelle commande a été reçue.</p>

              <div class="order-info">
                <p><strong>ID Commande:</strong> ${orderData.orderId}</p>
                <p><strong>Table:</strong> ${orderData.tableNumber}</p>
                ${orderData.customerName ? `<p><strong>Client:</strong> ${orderData.customerName}</p>` : ""}
                <p><strong>Date:</strong> ${new Date(orderData.createdAt).toLocaleString("fr-FR")}</p>
              </div>

              <h3 style="margin-top: 20px; margin-bottom: 10px;">Détails de la Commande:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th style="text-align: center;">Quantité</th>
                    <th style="text-align: right;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                  <tr class="total-row">
                    <td colspan="2" style="padding: 12px; text-align: right;">Total:</td>
                    <td style="padding: 12px; text-align: right;">$${orderData.totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              ${orderData.notes ? `<p><strong>Notes Spéciales:</strong> ${orderData.notes}</p>` : ""}
            </div>
            <div class="footer">
              <p>Parapli Bar & Grill - Système de Gestion des Commandes</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "orders@paraplibar.com",
        to: "paraplibar@gmail.com",
        subject: `Nouvelle Commande - Table ${orderData.tableNumber}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email notification sent",
        emailId: result.id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
