document.getElementById('toggleSidebar').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'toggleFactCheckSidebar'});
  });
});

let captureIntervalId = null;

document.getElementById('startCapture').addEventListener('click', () => {
if (captureIntervalId === null) {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {message: 'startCapturingCC'});
  });
  captureIntervalId = setInterval(() => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {message: 'captureCC'});
    });
  }, 5000);
} else {
  clearInterval(captureIntervalId);
  captureIntervalId = null;
}
});


document.getElementById('saveKey').addEventListener('click', () => {
const apiKey = document.getElementById('apiKey').value;
chrome.storage.sync.set({apiKey}, function() {
  console.log('API Key is stored in Chrome storage');
});
});