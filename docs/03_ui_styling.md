# NEURALFRONT Project Documentation

## 4. UI & Styling

*   **Theme:** Dark, cyberpunk aesthetic defined in `tailwind.config.ts` and `globals.css`.
*   **Customization:**
    *   Uses CSS variables for colors (`--neuralfront-bg`, `--neuralfront-accent-cyan`, etc.).
    *   Defines custom fonts (`Orbitron`, `Rajdhani`, `Chakra_Petch`, `Oxanium`) via `next/font` in `src/app/layout.tsx`.
    *   Tailwind `extend` used for custom colors and fonts.
*   **Layout (`src/app/game/page.tsx`):**
    *   Two-column layout:
        *   Main area (flexible width) containing the header, game canvas (`Battlefield`), command input.
        *   Sidebar (fixed width `300px`) for the "Agent Log".
    *   Responsive: Calculates canvas dimensions based on window size.
*   **Battlefield (`src/components/Battlefield.tsx`):**
    *   Uses Konva.js to render a 2D grid.
    *   Renders different unit types with distinct colors.
    *   Supports panning (when zoomed) and zooming with limits.
    *   Grid fits dynamically within its container.
    *   Displays coordinate labels. 