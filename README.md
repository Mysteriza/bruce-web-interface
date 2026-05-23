# Bruce Web UI Interface

A modern web-based user interface for the [Bruce firmware](https://github.com/pr3y/Bruce) — an ESP32-based multi-tool for offensive security, pentesting, and RF exploration.

This project provides a redesigned WebUI with a fresh, responsive, theme-aware interface. It works both as a **development proxy** (forwarding requests to a real Bruce device) and as a **standalone UI preview** (showing an empty interface when no device is connected).

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or later
- (Optional) A real Bruce device on the same WiFi network

### Run the development server
```powershell
node server.js
```

This serves the `interface/` folder. Open your browser to:
```
http://127.0.0.1:8080/
```

### Start coding
The main UI files are in `interface/`:
- `index.html` — Page structure
- `index.css` — All styles
- `index.js` — Application logic

---

## Offline / Development Mode (No Device Needed)

When you run `node server.js` locally, `localhost:8080` is detected as **development mode** (`IS_DEV = true`). In this mode:

- API requests are proxied via `/bruce/` to a real device if available.
- If no device is connected, **502 errors** are silently caught — the UI shows an **empty state** with no data, no demo files, and no indicator badges.
- The WebUI is fully interactive (buttons, dialogs, settings) but file listings, system info, and device-dependent features will show error toasts.
- Use this mode for UI development, layout testing, or offline preview.

### What works offline
- UI layout, responsive design, theme system
- Dialog system, toast notifications, navigator panel
- Search input, multi-select, batch delete UI (won't execute without device)

### What requires a real device
- File browsing, uploading, renaming, deleting
- System info display, device reboot
- Navigator (D-pad control), serial command execution

---

## Connecting to a Real Bruce Device

The server can proxy API calls to a physical Bruce device on your network. Requests beginning with `/bruce/` are forwarded to the device.

### Step-by-step

1. **Edit credentials** in `server.js` (near the top):
   ```js
   const bruceUsername = "admin";   // ← Set your Bruce WebUI username
   const brucePassword = "bruce";   // ← Set your Bruce WebUI password
   ```

2. **Connect** your computer and Bruce device to the same WiFi network (or connect to the device's own AP).

3. **Start the server**:
   ```powershell
   node server.js
   ```

4. Open `http://127.0.0.1:8080/` in your browser.

Now all file browsing, uploading, renaming, deleting, navigation, and command execution will hit the real device. The proxy path is handled automatically — you don't need to type `/bruce/` manually.

> **Important:** The device credentials in `server.js` MUST match your Bruce device's WebUI settings, otherwise proxied requests will fail with a 401 Unauthorized error.

### Changing the device hostname
By default the proxy forwards to `http://bruce.local`. If your device uses a different hostname or IP, edit this line in `server.js`:
```js
const bruceHost = "bruce.local";
```

---

## UI Features

| Feature | Description |
|---------|-------------|
| **File browser** | Browse LittleFS and SD card contents with sort by type/name |
| **File search** | Real-time client-side filter — type to narrow down files |
| **Multi-select** | Ctrl/Shift-click files, batch delete with confirmation |
| **Chunked upload** | Files >256 KB are split and uploaded in chunks |
| **Drag & drop** | Drop files anywhere on the page to upload |
| **Code editor** | Edit `.txt`, `.js`, `.json`, `.conf` files inline |
| **Device navigator** | D-pad controller for navigating the Bruce device screen |
| **Theme system** | All colors driven by the device's `theme.css` `--color` variable |
| **Toast notifications** | Non-intrusive success/error/warning messages |
| **Confirmation dialogs** | Modal confirmations for delete, reboot, logout |
| **Responsive layout** | Adapts to mobile and desktop screens |

---

## Project Structure

```
bruce-web-interface/
├── server.js                 # Node.js dev server + Bruce proxy
├── interface/
│   ├── index.html            # Main UI page
│   ├── index.css             # Styles (all selectors + enhancements)
│   ├── index.js              # Application logic
│   └── logout.html           # Logged-out confirmation page
├── backend/                  # Mock API responses (for reference only)
│   ├── systeminfo            # Sample system info JSON
│   ├── listfiles             # Sample file listings
│   ├── file                  # Sample file content
│   ├── getscreen             # Sample screen data
│   └── ...
└── sample/                   # Legacy sample UI (not used)
```

---

## How It Works

### Request flow
1. The UI calls `requestGet("/listfiles")` or `requestPost("/cm", ...)`.
2. If `IS_DEV` is true (localhost), the request URL is prefixed with `/bruce/`.
3. The **server** (`server.js`) receives `/bruce/systeminfo`, strips the `/bruce` prefix, and proxies to `http://bruce.local/systeminfo`.
4. The device responds with real data, which is forwarded back to the UI.
5. If the proxy fails (e.g., no device), a **502 error** is returned and the UI shows an error toast — the interface stays empty.

### Theme system
- The device's `/theme.css` defines a `--color` CSS variable (default: neon pink `#ff3ec8`).
- All UI components use `var(--color)`, `var(--background)`, `var(--surface)`, and `var(--border)`.
- The theme is cached in `localStorage` to prevent flash on repeat visits.
- A small colored dot in the header (`#theme-dot`) shows the current theme color.

### Development vs Production
| Aspect | Dev / Offline (localhost) | Production (on device) |
|--------|-------------------------------|----------------------|
| API requests | Proxied via `/bruce/` | Direct to firmware |
| Error handling | Shows error toast on 502 (empty state) | Shows error toasts |
| Theme CSS | Fetched from device if reachable | Loaded from device directly |

---

## API Endpoints (Reference)

These are the endpoints the Bruce firmware provides. The UI uses them through the proxy:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/systeminfo` | GET | Firmware version, storage usage |
| `/listfiles` | GET | List files in a directory |
| `/file` | GET | Download, delete, create files |
| `/edit` | POST | Save edited file content |
| `/rename` | POST | Rename file or folder |
| `/upload` | POST | Upload file |
| `/cm` | POST | Execute a serial command |
| `/getscreen` | GET | Get device screen rendering data |
| `/reboot` | GET | Reboot the device |
| `/logout` | GET | End the WebUI session |
| `/wifi` | GET | Save WiFi credentials |

Sample responses are in the `backend/` folder for reference.

---

## FAQ

**Q: The page shows "Fetching files..." forever. What's wrong?**  
A: This happens when a real device is unreachable AND you are not on localhost (so `IS_DEV` is false). Make sure you run the server on `127.0.0.1:8080` for development mode, or connect a real Bruce device.

**Q: Do I always need the real device to use the WebUI?**  
A: No! When running on `localhost:8080`, the UI auto-detects offline mode and shows an empty interface. You can test the layout, dialogs, and UI features without hardware.

**Q: How do I change the theme color?**  
A: The color is controlled by the Bruce device's `/theme.css` file. During development you can edit the `--color` variable in `interface/index.css` (line 2). On a real device, the firmware serves its own `theme.css`.

**Q: File uploads fail for large files. Why?**  
A: Files over 256 KB are split into chunks. Make sure your server.js is up-to-date to handle chunked upload reassembly. For production (on the real device), chunked upload requires firmware support.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 502 errors in console | Server can't reach Bruce device | Normal in offline/dev mode — ignore |
| "Failed to load files" toast | No device connected | Run on `127.0.0.1:8080` with IS_DEV or connect a real device |
| Login prompt appears | Device credentials mismatch | Check `bruceUsername` / `brucePassword` in `server.js` |
| Navigator shows blank canvas | Device not connected or `/getscreen` failed | Check device connection |
| Upload stuck at 0% | File too large without chunked support | Check `server.js` chunk handler |

---

## License

For educational purposes only. Don't use in environments where you are not allowed. All responsibilities for irresponsible usage rest on you.
