window.onload = function() {
  console.log('Starting GitlabTree plugin...');

  // 创建容器
  var treeContainer = document.createElement('div');
  treeContainer.id = 'fileTree';
  treeContainer.textContent = 'File Tree Container';
  treeContainer.style.cssText = 'width: 200px; overflow: auto; background-color: #f4f4f4; z-index: 1000; border: 2px solid red;';

  // 设置 body 为 flex 容器
  document.body.style.cssText = 'display: flex; flex-direction: row;';

  // 插入容器到 DOM
  document.body.insertBefore(treeContainer, document.body.firstChild);

  console.log('Container inserted into DOM:', document.getElementById('fileTree') !== null);

  // 构建树状结构
  var buildTree = function(files) {
      var tree = {};
      Object.keys(files).forEach(function(file) {
          var parts = file.split("/"),
              current = tree;
          parts.forEach(function(part) {
              current[part] = current[part] || {};
              current = current[part];
          });
      });
      return tree;
  };

  // 构建 HTML 树状结构
  var buildHtmlTree = function(tree, parent) {
      var ul = document.createElement('ul');
      Object.keys(tree).forEach(function(key) {
          var li = document.createElement('li'),
              item = tree[key];
          if (typeof item === "object" && !Array.isArray(item)) {
              li.innerHTML = '<a href="javascript:void(0)">' + key + '</a>';
              buildHtmlTree(item, li);
          } else {
              li.innerHTML = '<a href="javascript:void(0)">' + key + '</a>';
          }
          ul.appendChild(li);
      });
      parent.appendChild(ul);
  };

  // 弹出输入框让用户输入 URL
  var userInputUrl = prompt("Please enter the URL to fetch data:", "http://example.com");
  if (userInputUrl) {
      // 发送 AJAX 请求获取数据
      var xhr = new XMLHttpRequest();
      xhr.open('GET', userInputUrl, true);
      xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                  try {
                      var cleanedData = xhr.responseText.substring(5),
                          jsonData = JSON.parse(cleanedData);
                      console.log('Received data:', jsonData);
                      var fileTree = buildTree(jsonData);
                      buildHtmlTree(fileTree, treeContainer);
                      console.log('Tree built and inserted into DOM.');
                  } catch (e) {
                      console.error("Error parsing JSON:", e);
                      // 在请求失败时，给出用户反馈
                      treeContainer.innerHTML += '<p>Error parsing data. Please check the URL and try again.</p>';
                  }
              } else {
                  console.error("Error fetching data:", xhr.statusText);
                  // 在请求失败时，给出用户反馈
                  treeContainer.innerHTML += '<p>Error fetching data. Please check the URL and try again.</p>';
              }
          }
      };
      xhr.send();
  } else {
      console.log("No URL entered by the user.");
  }
};