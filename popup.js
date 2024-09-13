document.getElementById('closeTabs').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "closeTabs" });
});

document.getElementById('showMemory').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "showMemory" }, (response) => {
        document.getElementById('memoryInfo').innerHTML = response.memoryUsage;
    });
});