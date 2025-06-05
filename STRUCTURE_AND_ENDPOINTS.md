# Project Structure and API Endpoints

## File Structure

```
BruceWebInterface/
├── README.md
├── server.js
├── backend/
│   ├── cm
│   ├── edit
│   ├── file
│   ├── listfiles
│   ├── logout
│   ├── reboot
│   ├── rename
│   ├── systeminfo
│   └── wifi
│   └── upload
├── interface/
│   ├── index.css
│   ├── index.html
│   ├── index.js
│   └── logout.html
└── sample/
    ├── index.css
    ├── index.html
    ├── index.js
    └── logout.html
```

### Adding a New UI Folder
- To add a new UI, create a new folder (e.g., `myui/`) at the project root.
- Inside your folder, add at least these files:
  - `index.html` (main HTML file)
  - `index.css` (styles)
  - `index.js` (JavaScript)
- You can start the server with your folder using:
  ```powershell
  node server.js myui
  ```
- The server will serve your folder as the main web interface.

## Backend Endpoint Documentation (from server.js)

The server simulates or proxies the following endpoints (see `backend/` for static samples, or use `/bruce/` prefix to proxy to a real device):

### `/systeminfo`
- Method: GET
- Returns firmware version and storage info (SD, LittleFS).

### `/listfiles`
- Method: GET
- Lists files and folders as reported by the firmware.
- Query params: `fs` (filesystem), `folder` (path)

### `/file`
- Methods: GET, POST
- Handles file operations. Query params: `fs`, `name`, `action`
- **Actions supported:**
  - `download`: Download a file (GET)
  - `edit`: Get file content for editing (GET)
  - `createfile`: Create a new file (GET)
  - `create`: Create a new folder (GET)
  - `delete`: Delete a file or folder (GET)
- Example: `GET /file?fs=LittleFS&name=hash.js&action=edit`

### `/edit`
- Method: POST
- Edits a file. Accepts POST data with file content.

### `/cm`
- Method: POST
- Runs a command. Accepts POST data with command string (`cmnd`).

### `/wifi`
- Method: POST
- Endpoint to change WiFi username and password. Query params: `usr`, `pwd`.

### `/logout`, `/reboot`
- Methods: GET or POST
- Control endpoints for logout and reboot.

### `/rename`
- Methods: POST
- Renames a file or folder.
- Expects POST data: `fs`, `filePath`, `fileName`.

### `/upload`
- Method: POST
- Uploads a file to the device.
- Accepts multipart/form-data with the following fields:
  - `file`: The file to upload (required)
  - `folder`: Target folder path (required)
  - `fs`: Filesystem (e.g., `LittleFS` or `SD`) (required)
- Used by the UI for file uploads (see `interface/index.js`).
- Returns a status message or error.

## Special Stylesheet: `themes.css`
- `themes.css` is a stylesheet that defines color themes for the UI.
- It is generated dynamically by the device and served via the `/themes.css` endpoint.
- When running the server, requests for `/themes.css` are always proxied to the real Bruce device (see `server.js` logic).
- This ensures the UI always uses the current color theme from the device.

---

**Note:**
- All endpoints are simulated with static files in `backend/` for development.
- When using `/bruce/` prefix, requests are proxied to the real Bruce device (see README for details).
- The server will look for files in the main UI folder, then `backend/`, then the project root.
