# macOS Desk Cat Design

## Goal

Build a first playable macOS Desk Cat: a real transparent floating desktop app, not a wallpaper or browser widget. The pet should stay above normal windows, live near a desktop corner by default, and expose direct controls for walking, sitting, lying down, meowing, and returning home.

## Platform

The first version targets macOS only. Electron is used for the application shell because it can create a transparent, frameless, always-on-top window quickly while letting the pet renderer stay easy to iterate on with web technologies.

## Architecture

- Main process: creates the transparent floating pet window and exposes safe window controls through IPC.
- Preload bridge: provides a small, typed surface for renderer-to-main commands.
- Renderer: draws the pet, control bar, action state, dragging behavior, and local motion.
- Pet engine: keeps the current pose, transient effects, and simple movement rules separate from the visual components.

## First-Version Behavior

- Launches as a transparent frameless desktop window.
- Floats above ordinary application windows.
- Starts in the bottom-right visible work area.
- Supports dragging the cat around.
- Provides compact icon buttons for walk, sit, lie, meow, and home.
- Uses a lightweight placeholder cat until custom sprites are generated from the provided cat photos.

## Future Pet Art

The provided HEIC cat photos will be used in a later asset pass to generate a consistent sprite sheet. That pass should preserve the app contract: animation state names and sprite metadata can change internally, but the renderer should still consume a single pet manifest.

## Verification

- Run the Electron app locally.
- Confirm the window has no visible frame.
- Confirm the background is transparent.
- Confirm the window stays above normal windows.
- Confirm every control changes the pet state.
- Confirm home returns the pet to a screen corner.
