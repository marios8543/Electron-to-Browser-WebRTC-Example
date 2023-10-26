const { app, BrowserWindow, desktopCapturer, ipcRenderer } = require('electron')
app.commandLine.appendSwitch("--ignore-gpu-blacklist");
app.commandLine.appendSwitch("--enable-webrtc-pipewire-capturer");
app.commandLine.appendSwitch("--ozone-platform-hint=auto");
app.commandLine.appendSwitch("--enable-features=WebRTCPipeWireCapturer")
app.commandLine.appendArgument("--enable-features=WebRTCPipeWireCapturer")
const path = require('path')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.webContents.once('did-finish-load', () => {
    desktopCapturer.getSources({ types: ["screen"] }).then(sources => {
      mainWindow.webContents.send("SET_SOURCE", sources[0].id);
      console.log("SENDING SOURCE");
    });
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();
}

app.on('ready', createWindow)