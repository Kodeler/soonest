// Branded result page shown in the provider's browser at the end of an OAuth
// connect flow (Square, Calendly, Acuity).
export function connectPage(title: string, body: string, ok: boolean): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Soonest</title>
<style>
  body{font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:#faf9f7;color:#1c1917;display:flex;align-items:center;
    justify-content:center;min-height:100vh;margin:0;padding:24px}
  .card{background:#fff;border:1px solid #e7e5e4;border-radius:20px;
    padding:36px 40px;max-width:420px;text-align:center;
    box-shadow:0 4px 24px rgba(109,40,217,.07)}
  h1{font-size:20px;margin:0 0 10px;color:${ok ? "#047857" : "#b91c1c"}}
  p{font-size:14px;color:#57534e;line-height:1.5;margin:0}
  .mark{font-weight:800;color:#6d28d9;font-size:15px;margin-bottom:14px}
</style></head><body><div class="card">
<div class="mark">⚡ soonest</div><h1>${title}</h1><p>${body}</p>
</div></body></html>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html" } }
  );
}
