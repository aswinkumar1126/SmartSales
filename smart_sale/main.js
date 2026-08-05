const { app, BrowserWindow } = require('electron');
const path = require('path');

const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'out', 'index.html')}`;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Fix slashes for Windows
    win.loadURL("http://127.0.0.1:3000");
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});