const INACTIVE_THRESHOLD = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const BASE_MEMORY_PER_TAB = 30 * 1024 * 1024; // 30 MB base memory per tab
const MEMORY_PER_CHAR = 100; // 100 bytes per character in URL
const ACTIVE_TAB_MULTIPLIER = 1.5; // Active tabs use 50% more memory
const MEMORY_GROWTH_RATE = 0.1; // 10% memory growth per hour

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "closeTabs") {
    closeInactiveTabs();
  } else if (request.action === "showMemory") {
    estimateMemoryUsage(sendResponse);
    return true; // Indicates that the response is asynchronous
  }
});

function closeInactiveTabs() {
  chrome.tabs.query({}, (tabs) => {
    const currentTime = Date.now();
    tabs.forEach((tab) => {
      chrome.tabs.get(tab.id, (tabInfo) => {
        if (tabInfo.lastAccessed && (currentTime - tabInfo.lastAccessed > INACTIVE_THRESHOLD)) {
          chrome.tabs.remove(tab.id);
        }
      });
    });
  });
}

function estimateMemoryUsage(sendResponse) {
  chrome.tabs.query({}, (tabs) => {
    const currentTime = Date.now();
    let totalMemory = 0;
    let memoryUsageHTML = '<ul>';

    tabs.forEach(tab => {
      let tabMemory = estimateTabMemory(tab, currentTime);
      totalMemory += tabMemory;
      memoryUsageHTML += `<li>${tab.title.substring(0, 50)}: ${formatBytes(tabMemory)}</li>`;
    });

    memoryUsageHTML += '</ul>';
    memoryUsageHTML = `<p>Estimated total memory usage: ${formatBytes(totalMemory)}</p>` + memoryUsageHTML;
    memoryUsageHTML += '<p><em>Note: This is a rough estimate based on various factors.</em></p>';

    sendResponse({ memoryUsage: memoryUsageHTML });
  });
}

function estimateTabMemory(tab, currentTime) {
  let memory = BASE_MEMORY_PER_TAB;

  // Factor 1: URL length
  memory += tab.url.length * MEMORY_PER_CHAR;

  // Factor 2: Active vs background
  if (tab.active) {
    memory *= ACTIVE_TAB_MULTIPLIER;
  }

  // Factor 3: Time open
  if (tab.lastAccessed) {
    const hoursOpen = (currentTime - tab.lastAccessed) / (60 * 60 * 1000);
    memory *= (1 + MEMORY_GROWTH_RATE * hoursOpen);
  }

  return Math.round(memory);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}