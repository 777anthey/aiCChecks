function insertFactCheckSidebar() {
  const existingSidebar = document.getElementById('fact-check-sidebar');
  if (existingSidebar) return;

  const sidebar = document.createElement('div');
  sidebar.id = 'fact-check-sidebar';
  sidebar.style.cssText = 'width: 300px; position: fixed; top: 0; right: 0; bottom: 0; background-color: #f8f9fa; overflow-y: scroll; padding: 16px; box-sizing: border-box; z-index: 9999; display: none;';

  // Create factCheckEntries div and append to the sidebar
  const factCheckEntries = document.createElement('div');
  factCheckEntries.id = 'factCheckEntries';
  sidebar.appendChild(factCheckEntries);

  document.body.appendChild(sidebar);
}

function toggleFactCheckSidebar() {
  const sidebar = document.getElementById('fact-check-sidebar');
  sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  setInterval(processCC, 3000);
});

function addFactCheckEntry(factCheckResponse) {
  const factCheckDiv = document.getElementById('factCheckEntries');
  const newEntry = document.createElement('p');

  if (factCheckResponse.message.content.includes('fact-check')) {
    newEntry.textContent = 'Fact-check: ' + factCheckResponse.message.content;
  } else {
    newEntry.textContent = 'Assistant\'s response: ' + factCheckResponse.message.content;
  }

  factCheckDiv.appendChild(newEntry);
}

function captureCC() {
  const ccContainer = document.querySelector('.ytp-caption-window-rollup');
  if (ccContainer) {
    const ccText = ccContainer.textContent;
    console.log(`Captured CC: ${ccText}`); // Logging the captured CC
    return ccText;
  }
  return null;
}


function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['apiKey'], function(result) {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(result.apiKey);
    });
  });
}

async function fetchFactCheck(cc) {
  console.log('Fetching fact check for: ', cc);

  const apiKey = await getApiKey();

  // Check if the API key is not set or removed by the user
  if (!apiKey) {
    console.error('No API key found. Please set the OpenAI API key in the extension popup.');
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that enjoys fact checking."
        },
        {
          role: "user",
          content: `Look for any claims being made in this closed caption data from a Youtube video, then quote the claim and provide a corresponding fact check for it: "${cc}"`
        }
      ],
      max_tokens: 150
    })
  });

  if (!response.ok) {
    console.error(`API request failed with status ${response.status}: ${await response.text()}`);
    return null;
  }

  const data = await response.json();
  console.log('Fact check response: ', data);  // Log the response data
  return data;
}




chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('Received message: ', request.message);

  if (request.message === 'toggleFactCheckSidebar') {
    toggleFactCheckSidebar();
  }

  if (request.message === 'startCapturingCC') {
    console.log('Before capturing CC');
    const cc = captureCC();
    console.log('After capturing CC: ', cc);

    if (cc) {
      console.log('Before fetching fact check');
      const factCheckResponse = await fetchFactCheck(cc);
      console.log('After fetching fact check: ', factCheckResponse);

      if (factCheckResponse) {
        console.log('Before adding fact check entry');
        addFactCheckEntry(factCheckResponse.choices[0]);
        console.log('After adding fact check entry');
      }
    }
    processCC(); // Start processing the closed captions.
  }
});




async function processCC() {
  console.log('Before capturing CC');
  const cc = captureCC();
  console.log('After capturing CC: ', cc);

  if (cc) {
    console.log('Before fetching fact check');
    const factCheckResponse = await fetchFactCheck(cc);
    console.log('After fetching fact check: ', factCheckResponse);

    if (factCheckResponse) {
      console.log('Before adding fact check entry');
      addFactCheckEntry(factCheckResponse.choices[0]);
      console.log('After adding fact check entry');
    }
  }

  // Call processCC again to continue processing the closed captions.
  setTimeout(processCC, 5000);
}

insertFactCheckSidebar();