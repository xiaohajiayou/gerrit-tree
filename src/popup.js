document.getElementById('toggleButton').addEventListener('click', function() {
    // 发送消息到内容脚本以启用或禁用功能
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: toggleGitlabTree
      });
    });
  });
  
  function toggleGitlabTree() {
    // 这里调用你的插件功能代码
    console.log('Gitlab Tree toggled');
    // 你可以在这里调用你的插件功能代码
  }