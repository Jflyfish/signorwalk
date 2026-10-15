# Embedding the member check

A credit union can place the check on its own site or open it inside a mobile app. The page is `/cu/{tenant}/embed`. It has the credit union's brand and none of the marketing site navigation.

Only origins on that tenant's allowlist may frame the page. The allowlist is set in the tenant config and sent as `Content-Security-Policy: frame-ancestors` on the embed route alone. Other `/cu` and `/credit-unions` pages stay `frame-ancestors 'none'` with `X-Frame-Options: DENY`. An unknown tenant, or a parent origin that is not on the list, does not render the form.

The page posts two messages to the parent. It never uses `*` as the target origin.

| Type | Payload |
| --- | --- |
| `signorwalk.cu.resize` | `{ type, height }` with height in pixels |
| `signorwalk.cu.completed` | `{ type, grade }` where grade is `A`, `B`, `C`, `D`, or `F` |

`signorwalk.cu.completed` is the letter only. It does not include the worksheet, a name, or any other member data. Read a message only after `event.origin` is `https://signorwalk.com`.

## Web iframe

Copy the iframe snippet from the dashboard Embed tab. It loads `https://signorwalk.com/cu/{tenant}/embed` and sets the frame height from `signorwalk.cu.resize`. The page that hosts the iframe must be served from an allowlisted origin. The same site can also frame it, because the embed policy includes `'self'`.

A local look at the framed page is at `/credit-unions/embed-demo`. That host embeds Harborlight Credit Union and prints the resize height and the completed grade.

## iOS WKWebView

Two setups:

- Full-screen check. Load the deep link from the Embed tab as the WKWebView's main document. Enable JavaScript. The check runs with the credit union brand. There is no parent frame, so there are no `postMessage` events.
- Events. Load a page you host on an allowlisted origin. That page uses the same iframe snippet as the web. The WKWebView is just the browser for that page. Read `signorwalk.cu.resize` and `signorwalk.cu.completed` in the page script, and check `event.origin`.

`file://` and other origins that are not on the allowlist cannot frame the check.

## Android WebView

Same two setups. Turn JavaScript on (`WebSettings.setJavaScriptEnabled(true)`).

- Full-screen check. `loadUrl` the deep link.
- Events. Load your allowlisted page, let that page iframe the embed URL, and listen for the two message types. Keep only the grade letter from `signorwalk.cu.completed`.
