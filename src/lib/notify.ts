import "server-only";

/**
 * Transactional email + SMS. Providers are called over plain REST (fetch)
 * to avoid SDK dependencies:
 *  - Email: Resend  — set RESEND_API_KEY (+ optional EMAIL_FROM).
 *  - SMS:   Twilio  — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.
 *
 * When a provider is unconfigured, sends are logged and skipped — the shop
 * keeps working, notifications simply stay off until keys are added. Sends
 * are fire-and-forget from callers' perspective: a notification failure
 * must never fail an order.
 */

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Shalwani <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[notify] email skipped (no RESEND_API_KEY): "${subject}" → ${to}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    });
    if (!res.ok) console.error(`[notify] email failed (${res.status}):`, await res.text());
  } catch (err) {
    console.error("[notify] email error:", err);
  }
}

export async function sendSms(toPhone: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) {
    console.log(`[notify] sms skipped (no Twilio env): → ${toPhone}`);
    return;
  }
  // Omani numbers are stored without a country code; default to +968.
  const to = toPhone.startsWith("+") ? toPhone : `+968${toPhone.replace(/^0+/, "")}`;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    if (!res.ok) console.error(`[notify] sms failed (${res.status}):`, await res.text());
  } catch (err) {
    console.error("[notify] sms error:", err);
  }
}

// ── Bilingual templates ────────────────────────────────────────────────────

interface OrderInfo {
  orderNumber: string;
  customerName: string;
  totalBaisa: number;
  locale: string;
  trackingNumber?: string | null;
}

function omr(baisa: number): string {
  return (baisa / 1000).toFixed(3);
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://shalwani.vercel.app").replace(/\/$/, "");
}

function shell(locale: string, title: string, bodyHtml: string): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:#faf7f2;font-family:Tahoma,Arial,sans-serif;color:#1a1714">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<div style="text-align:center;padding:24px 0;border-bottom:2px solid #9a7b4f">
<span style="font-size:26px;letter-spacing:2px;color:#9a7b4f">${locale === "ar" ? "شالواني" : "SHALWANI"}</span>
</div>
<h1 style="font-size:20px;margin:28px 0 16px">${title}</h1>
${bodyHtml}
<p style="margin-top:36px;padding-top:16px;border-top:1px solid #e5ded2;font-size:12px;color:#8a8175">
${locale === "ar" ? "شالواني — مَصَر باشمينا عُماني مطرّز يدوياً" : "Shalwani — hand-embroidered Omani pashmina massar"}<br>
<a href="${siteUrl()}" style="color:#9a7b4f">${siteUrl().replace("https://", "")}</a>
</p></div></body></html>`;
}

export function orderConfirmationEmail(o: OrderInfo): { subject: string; html: string } {
  if (o.locale === "ar") {
    return {
      subject: `تأكيد طلبك ${o.orderNumber} — شالواني`,
      html: shell(
        "ar",
        `شكراً لك يا ${o.customerName}`,
        `<p>استلمنا طلبك <strong dir="ltr">${o.orderNumber}</strong> وتم الدفع بنجاح.</p>
<p>الإجمالي: <strong dir="ltr">${omr(o.totalBaisa)} ر.ع</strong></p>
<p>سنبدأ بتجهيز قطعتك، وسنرسل لك رسالة أخرى فور شحنها.</p>`,
      ),
    };
  }
  return {
    subject: `Order confirmed ${o.orderNumber} — Shalwani`,
    html: shell(
      "en",
      `Thank you, ${o.customerName}`,
      `<p>We received your order <strong>${o.orderNumber}</strong> and payment was successful.</p>
<p>Total: <strong>${omr(o.totalBaisa)} OMR</strong></p>
<p>We are preparing your piece and will email you again the moment it ships.</p>`,
    ),
  };
}

export function orderShippedEmail(o: OrderInfo): { subject: string; html: string } {
  const tracking = o.trackingNumber
    ? o.locale === "ar"
      ? `<p>رقم التتبع: <strong dir="ltr">${o.trackingNumber}</strong></p>`
      : `<p>Tracking number: <strong>${o.trackingNumber}</strong></p>`
    : "";
  if (o.locale === "ar") {
    return {
      subject: `طلبك ${o.orderNumber} في الطريق إليك — شالواني`,
      html: shell(
        "ar",
        "قطعتك في الطريق",
        `<p>طلبك <strong dir="ltr">${o.orderNumber}</strong> غادر ورشتنا وهو الآن في الطريق إليك.</p>${tracking}`,
      ),
    };
  }
  return {
    subject: `Your order ${o.orderNumber} is on its way — Shalwani`,
    html: shell(
      "en",
      "Your piece is on its way",
      `<p>Your order <strong>${o.orderNumber}</strong> has left our workshop and is on its way to you.</p>${tracking}`,
    ),
  };
}

export function orderDeliveredEmail(o: OrderInfo): { subject: string; html: string } {
  if (o.locale === "ar") {
    return {
      subject: `تم تسليم طلبك ${o.orderNumber} — شالواني`,
      html: shell(
        "ar",
        "وصلت قطعتك",
        `<p>تم تسليم طلبك <strong dir="ltr">${o.orderNumber}</strong>. نتمنى أن تنال القطعة إعجابك.</p>
<p>يسعدنا رأيك — يمكنك كتابة تقييمك من صفحة المنتج في حسابك.</p>`,
      ),
    };
  }
  return {
    subject: `Order ${o.orderNumber} delivered — Shalwani`,
    html: shell(
      "en",
      "Your piece has arrived",
      `<p>Your order <strong>${o.orderNumber}</strong> has been delivered. We hope it exceeds your expectations.</p>
<p>We would love your feedback — you can leave a review from the product page.</p>`,
    ),
  };
}

export function abandonedCartEmail(o: OrderInfo): { subject: string; html: string } {
  const resume = `${siteUrl()}/${o.locale === "ar" ? "ar" : "en"}/shop`;
  if (o.locale === "ar") {
    return {
      subject: "قطعتك ما زالت بانتظارك — شالواني",
      html: shell(
        "ar",
        `يا ${o.customerName}، قطعتك بانتظارك`,
        `<p>لاحظنا أنك بدأت طلباً (<span dir="ltr">${o.orderNumber}</span>) ولم يكتمل الدفع.</p>
<p>القطع المطرّزة يدوياً تُنتج بأعداد محدودة — أكمل طلبك قبل نفاد المخزون.</p>
<p><a href="${resume}" style="display:inline-block;background:#9a7b4f;color:#fff;padding:12px 28px;text-decoration:none">أكمل طلبك</a></p>`,
      ),
    };
  }
  return {
    subject: "Your piece is still waiting — Shalwani",
    html: shell(
      "en",
      `${o.customerName}, your piece is waiting`,
      `<p>We noticed you started an order (${o.orderNumber}) but the payment was not completed.</p>
<p>Hand-embroidered pieces are made in limited numbers — complete your order before stock runs out.</p>
<p><a href="${resume}" style="display:inline-block;background:#9a7b4f;color:#fff;padding:12px 28px;text-decoration:none">Complete your order</a></p>`,
    ),
  };
}

// ── SMS templates (short, no links except tracking) ────────────────────────

export function orderConfirmationSms(o: OrderInfo): string {
  return o.locale === "ar"
    ? `شالواني: تم تأكيد طلبك ${o.orderNumber} بإجمالي ${omr(o.totalBaisa)} ر.ع. سنراسلك عند الشحن.`
    : `Shalwani: order ${o.orderNumber} confirmed, total ${omr(o.totalBaisa)} OMR. We'll text you when it ships.`;
}

export function orderShippedSms(o: OrderInfo): string {
  const t = o.trackingNumber ? ` (${o.locale === "ar" ? "تتبع" : "tracking"}: ${o.trackingNumber})` : "";
  return o.locale === "ar"
    ? `شالواني: طلبك ${o.orderNumber} تم شحنه${t}.`
    : `Shalwani: order ${o.orderNumber} has shipped${t}.`;
}
