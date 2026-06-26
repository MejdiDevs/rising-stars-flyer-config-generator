# Flyer Config Generator

A companion visual tool for the main Flyer Generator application. 

Every year, the event flyer template changes, which means the coordinates for the text layers and the user's profile picture also need to be updated. Instead of guessing coordinates in a JSON file, this app provides a drag-and-drop visual interface to automatically generate the configuration file needed by the main app.

## How it works

1. **Upload your base template:** Drop in the raw, unedited flyer image for the new year (e.g. `temp_v2.png`).
2. **Drag and position:** Move the profile picture mask and text layers (Name, Position, etc.) directly on the canvas exactly where they belong in the new design.
3. **Tweak the styling:** Adjust font sizes, alignment, colors, mask radius, and border thickness using the sidebar controls.
4. **Export:** Click the download button to generate a `flyerConfig.json` file.

Once exported, simply drop the generated `flyerConfig.json` into the main Flyer Generator app, and it will immediately know how to map users' photos and data onto the new template.

## Running Locally

This is a standalone React application built with Vite.

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

## Styling Notes
The UI relies on the exact same design system (glassmorphism, CSS grid, dark mode colors) as the root application to ensure a cohesive experience across all internal tools.
