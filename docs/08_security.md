# NEURALFRONT Project Documentation

## 9. Security

*   **Rate Limiting:** Applied to the `interpret-command` API endpoint (`src/lib/security/rateLimit.ts`).
*   **Input Sanitization:** Applied to interpreted commands (`src/lib/security/sanitize.ts`).
*   **Command Injection Prevention:** Regex patterns check for suspicious code in user commands (`SUSPICIOUS_PATTERNS` in `interpret-command/route.ts`).
*   **WebSocket Security:** `wsManager` (`src/lib/security/websocket.ts`) handles connection validation (potentially token-based) and message validation.
*   **HTTP Headers:** Security headers (`Content-Security-Policy`, `X-Content-Type-Options`, etc.) are set on API responses. 