# Zoltbot backend

The chat on the zoltonbaize.com password pages and in the About page's "Get in touch" section follows a scripted tree in the browser (who Zolton is, what's behind the password, the six access-request questions). This small Netlify function does the two things the browser can't do safely:

- **`type: 'request'`**: delivers a finished access request to Zolton by email (Resend) and phone push (ntfy), and saves it to a private list (Netlify Blobs store `zoltbot-requests`). One request per visitor per day.
- **`type: 'chat'`**: only when a visitor goes off the tree, asks a Claude model for a short in-character reply. Zoltbot's facts and rules are in `FACTS` and `SYSTEM` at the top of `netlify/functions/zoltbot.mjs`. The password is never in there.

Endpoint once deployed: `https://<your-netlify-site>.netlify.app/api/zoltbot`

## Set up (about 15 minutes)

1. **Netlify site.** New site → import this GitHub repo → set *Base directory* to `zoltbot`. Deploy.
2. **Environment variables** (Site configuration → Environment variables):

| Variable | Required | What it is |
|---|---|---|
| `ZB_PROVIDER` | no | `openrouter`, `anthropic` or `openai`. Without it, whichever key below is set is used. |
| `ZB_FREE_ONLY` | no | OpenRouter only. Default `true`: the backend only ever asks for models ending in `:free`. Set `false` to allow paid ones. |
| `OPENROUTER_API_KEY` | for AI replies (OpenRouter) | Key from openrouter.ai (give the key a credit limit). Set `ZB_MODEL` to the model you pick there, e.g. a cheap or `:free` one. |
| `OPENAI_API_KEY` | for AI replies (OpenAI) | Key from platform.openai.com, if you'd rather use OpenAI. Set `ZB_MODEL` to their cheapest current chat model. |
| `ANTHROPIC_API_KEY` | for AI replies | Key from console.anthropic.com. Without it, off-tree questions get "I can pass it to Zolton." |
| `ZB_MODEL` | no | Model ID. Default `claude-haiku-5-5` (fast and cheap). `claude-sonnet-5-5` gives richer answers at higher cost. |
| `RESEND_API_KEY` | for email | From resend.com (free tier). |
| `ZB_ALERT_EMAIL` | for email | Your private inbox for alerts. Never shown to visitors. |
| `ZB_ALERT_FROM` | no | Sender, e.g. `Zoltbot <zoltbot@zoltonbaize.com>` once your domain is verified in Resend. Default is Resend's test sender. |
| `ZB_NTFY_TOPIC` | for push | A long, unguessable topic name. Subscribe to it in the ntfy phone app. |
| `ZB_CHATS_PER_VISITOR_PER_DAY` | no | Default 15 AI replies per visitor per day. |
| `ZB_CHATS_PER_DAY` | no | Default 300 AI replies per day for the whole site (spending cap). |
| `ZB_ALLOWED_ORIGINS` | no | Comma list. Default: zoltonbaize.com, www, and the webflow.io staging domain. |

3. **Turn the chat on in Webflow.** Password page → Custom code → Footer, put this line *above* the zb-password.js script:

```html
<script>window.ZB_CHAT_ENDPOINT = 'https://<your-netlify-site>.netlify.app/api/zoltbot';</script>
```

Add the same line to the **About** page's footer code, above zb-password.js (on About, Zoltbot docks on the element marked `data-zb-bot`, the Get in touch panel, and the tree sends Zolton a message instead of an access request).

Without that line the password page still works (Zoltbot, glass card, unlock flight), just without the chat; on About the chat runs as a preview that sends nothing.

## Cost

Each off-tree reply is one short model call (about 1–2k tokens with the system prompt). With Haiku and the default caps it stays at pennies per day; set a monthly spend limit in the Anthropic console as a backstop.
