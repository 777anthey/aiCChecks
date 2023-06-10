chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'www.youtube.com'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'captureCC') {
    chrome.scripting.executeScript({
      target: {tabId: sender.tab.id},
      function: 'captureCC',
      allFrames: true
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      const cc = results[0].result;
      if (cc) {
        fetchFactCheck(cc).then((factCheckResponse) => {
          const response = factCheckResponse.choices[0];
          chrome.tabs.sendMessage(sender.tab.id, {message: 'addFactCheckEntry', data: response});
        }).catch((error) => {
          console.error(error);
        });
      }
    });
  }
});
