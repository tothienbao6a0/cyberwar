# NEURALFRONT Project Documentation

## 7. Database (Supabase)

*   **Integration:** The `@supabase/supabase-js` package is installed.
*   **Client:** `src/lib/supabaseClient.ts` initializes the Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.
*   **Usage:** Specific database interactions (fetching data, saving game state, user auth) are not detailed in the provided code snippets but are likely handled within `src/db/` or potentially within the `gameStateManager` or security modules. 