// 构建树状结构
var buildTree = function(files) {
    var tree = {};
    Object.keys(files).forEach(function(file) {
        var isDirectory = file.endsWith('/')
        var parts = file.split("/"),
            current = tree;
        var lastIndex = parts.length - 1;
        parts.forEach(function(part, index) {
            // 确保当前部分存在，如果不存在则初始化为对象
            current[part] = current[part] || { text: part, icon: 'fa fa-folder-open' };

            // 如果不是最后一个部分，确保它有 'children' 属性
            if (index < parts.length - 1) {
                current[part].children = current[part].children || {};
                current = current[part].children;
            } else {
                // 最后一个部分，如果是文件则设置 'fa fa-file' 图标
                if (!isDirectory) {
                    current[part].icon = 'fa fa-file-o';
                }
                current = current[part];
            }
        });
    });
    return tree;
};

function convertToJsTreeFormat(data) {
    var result = [];

    function buildNode(node, parent) {
        var jsTreeNode = {
            text: node.text,
            icon: node.icon,
            state: { opened: node.children && Object.keys(node.children).length > 0 ? true : false }
        };
        if (node.children) {
            jsTreeNode.children = [];
            for (var key in node.children) {
                buildNode(node.children[key], jsTreeNode);
            }
        }
        if (parent) {
            parent.children.push(jsTreeNode);
        } else {
            result.push(jsTreeNode);
        }
    }

    for (var key in data) {
        buildNode({ text: key, icon: data[key].icon, children: data[key].children || {} }, null);
    }

    return result;
}

    
var createGerritTree = function(result) {
    var tree = buildTree(result); // 构建树状结构
    var treeData = convertToJsTreeFormat(tree); // 生成节点数组

    $('.gerrit-tree nav').css({
        'overflow-y': 'auto', // 允许垂直滚动
        'height': 'auto', // 或者设置一个固定高度
        'max-height': '800px' // 设置最大高度，超过则出现滚动条
    });
    $jstree = $('.gerrit-tree nav')
        .jstree({
        'core': {
            'themes': {
                'name': 'default', // 指定自定义主题的名称
                'responsive': false,
                'dots': true // 关闭节点之间的连接线
            },
            'data': treeData,
            'check_callback': true,
            'dblclick_toggle': false,
        },
        plugins: []
        })
        .on('ready.jstree', function(event, data) {
            handleRefresh();
        })
        .on("open_node.jstree close_node.jstree", function (e, data) {
            var node = data.node;
            if (node.icon === 'fa fa-folder') {
                $.jstree.reference(data.node.id).set_icon(node, 'fa fa-folder-open');
            } else if (node.icon === 'fa fa-folder-open') {
                $.jstree.reference(data.node.id).set_icon(node, 'fa fa-folder');
            }
        })
        // 监听点击事件，实现单击切换节点状态
        .on("click.jstree", ".jstree-anchor", function (e) {
            // 阻止事件冒泡，避免触发其他事件
            e.preventDefault();
            // 获取点击的节点
            var node = $jstree.jstree(true).get_node(this);
            // 如果节点有子节点，即是一个目录节点
            if (node.children && node.children.length) {
                // 判断节点当前状态并切换
                if ($jstree.jstree(true).is_closed(node)) {
                    $jstree.jstree(true).open_node(node);
                } else {
                    $jstree.jstree(true).close_node(node);
                }
            }
        });
}


    
var getLocalStorageData = function() {
    var strClickedDir = localStorage.getItem('loadedDirs');
    var lastElement;
    var arrClickedDir = strClickedDir && strClickedDir.split(',') || [];
    if (arrClickedDir.length > 0) {
        lastElement = arrClickedDir[arrClickedDir.length - 1] || '';
    }
    return {
        lastElement: lastElement,
        arrAllLoadedDirs: arrClickedDir,
    }
}

var setLocalStorageData = function(str) {
    if (str.length === 0) {
        return;
    } else {
        localStorage.setItem('loadedDirs', str);
    }
}

var createGerritTreeContainer = function(repo,branch) {
    var htmlTemplate = 
    '<div class="scrollable-container" >'+
        '<div class="gerrit-tree">' +
            '<header>' +
                '<div  class="head-container">' +
                    '<div id = "repo" class="info-container center-item">' +  // 新增容器用于居中
                        '<i class="fa fa-home " style = "margin-right: 5px"></i>' +
                        '<span class="info-link">Home</span>' +  // 添加链接文本
                    '</div>' +
                    '<div id = "branch"  class="branch-container center-item">' +  // 新增容器用于居中
                        '<i class="fa fa-code-fork " style = "margin-right: 10px"></i>' +
                        '<span class="branch">master</span>' +  // 假设默认分支为master
                    '</div>' +
                '</div>' +
                '<a class="gerrit-tree-toggle  " >' +
                    '<i class="fa fa-angle-left"></i>' +
                '</a>'+
            '</header>'+
            '<nav></nav>'+
        '</div>'+
    '</div>';

    // 设置 body 的样式为 flex 容器
    $('body').css({
        'display': 'flex',
        'flex-direction': 'row',
        'height': '100%',
        'width': '100%' /* 确保 body 与 html 一样宽 **/

    });

    $('body').prepend(htmlTemplate);
    $('#repo').find('.info-link').text(repo); // 替换 'New Home 
    $('#branch').find('.branch').text(branch); // 替换 'New 
    // 设置'#repo'元素中的'.info-link'的字体大小
    $('#repo').find('.info-link').css('font-size', '14px'); // 您可以根据需要调整字体大小

    // 设置'#branch'元素中的'.branch'的字体大小
    $('#branch').find('.branch').css('font-size', '14px'); // 您可以根据需要调整字体大小

    // 创建一个 link 元素用于加载 CSS
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    // 使用 chrome.runtime.getURL 获取扩展程序资源的 URL
    // link.href = chrome.runtime.getURL('libs/Font-Awesome/5.15.1/css/all.min.css');
    link.href = chrome.runtime.getURL('libs/Font-Awesome/4.7.0/css/font-awesome.min.css');
    document.head.appendChild(link);

    $('.gerrit-tree-toggle').on('click', function() {
        hideGerritTree();
    });

}

var handleToggleBtn = function() {
    $('.gerrit-tree header a.toggle-btn').on('click', function() {
        hideGerritTree();
        createBtn();
    });
}


function adjustScrollableContainerHeight() {
    var appElement = document.querySelector("#app").shadowRoot.querySelector("#app-element");
    var appHeight = appElement.offsetHeight; // 获取.app-element的高度
    var treeHeight = $('.gerrit-tree').height(); // 获取.app的高度
    var margin = 10; // 设置余量为10px，你可以根据需要调整这个值
    // 确保 .gerrit-tree 保持粘性定位
    $('.gerrit-tree').css('position', 'sticky');

    $('.scrollable-container').height(appHeight ); // 设置.scrollable-container的高度
    $('.scrollable-open-tree').height(appHeight ); // 设置.scrollable-container的高度

    
}
    
var clickNode = function() {
    $jstree.on("select_node.jstree", function(e, data) {

        if (data.node.children && data.node.children.length) {
            console.log('Selected item is a directory:', data.node.text);
        } else {
            // 当节点被点击时，更改图标
            var instance = $.jstree.reference(data.node);
            instance.set_icon(data.node, 'fa fa-file-text-o');
            
            var filePathToMatch = getClickedPath(data).filePath;
            console.log('No matching file row found for:', filePathToMatch);

            // // 1. 定位文件列表容器
            // var fileListContainer = document.querySelector('#container');

            // // 2. 查找所有文件行
            // var fileRows = fileListContainer.querySelectorAll('.file-row');
            // 使用jQuery选择器找到特定的元素
            // 首先，获取最外层的 Shadow DOM 的根元素
            var root = document.querySelector("#app").shadowRoot;


            // 从最外层的 Shadow DOM 开始，逐层深入到包含文件列表的 Shadow DOM
            var fileListShadowRoot = root.querySelector("#app-element").shadowRoot.querySelector("main > gr-change-view").shadowRoot.querySelector("#fileList").shadowRoot;

            // 在文件列表的 Shadow DOM 中查找所有匹配的 div 元素
            var fileRows = fileListShadowRoot.querySelectorAll("div[data-file]");
            console.log('No matching file row found for:', fileRows);
            // 遍历所有文件行，找到匹配特定文件路径的 div
            fileRows.forEach(function(fileRow) {
                // 存储原始的 display 属性值
                var originalDisplay = fileRow.style.display;
                // 获取 data-file 属性的值
                var dataFile = fileRow.dataset.file;
                
                // 解析 JSON 字符串，以便比较文件路径
                var fileData = JSON.parse(dataFile);
                
                // 检查文件路径是否匹配
                if (fileData.path === filePathToMatch) {
                    // 将 fileRow 设为可见
                    fileRow.style.display = 'flex'; // 或者 'inline', 'inline-block' 等，取决于元素的原始 display 属性
                    // 如果匹配，找到该 div 下的 .show-hide 元素
                    var showHideElement = fileRow.querySelector(".show-hide");
                    
                    // 如果找到了 .show-hide 元素，执行点击操作
                    if (showHideElement) {
                        showHideElement.click();
                    }
                }else {
                    // 将 fileRow 设为不可见
                    fileRow.style.display = 'none';
                    if (fileRow.classList.contains('expanded')) {
                        // 如果匹配，找到该 div 下的 .show-hide 元素
                        var showHideElement = fileRow.querySelector(".show-hide");
                        
                        // 如果找到了 .show-hide 元素，执行点击操作
                        if (showHideElement) {
                            showHideElement.click();
                        }
                    }
                }
            });

            }

            // 在这里调用 adjustScrollableContainerHeight 函数
            setTimeout(function() {
                var appHeight = $('#app').height(); // 获取.app的高度
                console.log(appHeight);
                adjustScrollableContainerHeight();
            }, 300);
        }
    );

}

var getClickedPath = function(data) {
    var path = data.node.text + '/';
    var arrParents = data.node.parents;

    // data.node.parents ["j1_13", "j1_3", "#"]
    arrParents.forEach(function(item) {
        if (item !== '#') {
        var tmpText = $jstree.jstree(true).get_text(item);
        path += tmpText + '/';
        }
    });

    path = revertPath(path);


    return {
        filePath: path,
    };
}

var revertPath = function(revertedPathString) {
    var retString = '';
    var arrString = revertedPathString.split('/');

    // 1 删除空元素
    arrString.forEach(function(item, index) {
        if (item === '') {
            removeElement(index, arrString);
        }
    });

    // 2.倒序排列
    for (var i = arrString.length - 1; i >= 0; i--) {
        var item = arrString[i];
        retString += item + '/';
    };

    // 3.去掉最后一个/
    if (retString.substr(retString.length - 1) === '/') {
        retString = retString.substr(0, retString.length - 1);
    }

    return retString;
}

var removeElement = function(index, array) {
    if (index >= 0 && index < array.length) {
        for (var i = index; i < array.length; i++) {
        array[i] = array[i + 1];
        }
        array.length = array.length - 1;
    }
    return array;
}


var createBtn = function() {
    if ($('.open-tree').length === 0) {
        var htmlTemplate = 
        '<div class="scrollable-open-tree" style="display: none;">'+
            '<div class="open-tree ">'+
                '<header>' +
                    '<a class="gerrit-tree-toggle  " >' +
                        '<i class="fa fa-angle-right "></i>' +
                    '</a>'+
                '</header>' +
            '</div>'+
        '</div>';

        
        // var htmlTemplate = '<div class="open-tree fa fa-angle-right" style="display: block; position: fixed; top: 10px; right: 10px; z-index: 1000; background-color: #f00;"></div>';
        // if (isFilesTab()) {
        $('body').prepend(htmlTemplate);
        // }

        $('.open-tree').on('click', function() {
        showGerritTree();
        });
    } else {
        // if (isFilesTab()) {
        $('.open-tree').show();
        // }
    }
}

var hideGerritTree = function() {
    $('.scrollable-container').css('display', 'none');
    $('.scrollable-open-tree').css('display', 'block');
}

var showGerritTree = function() {
    // 显示 .scrollable-container 元素
    $('.scrollable-container').css('display', 'block');
    $('.scrollable-open-tree').css('display', 'none');
}

var cleanGerritTree = function() {
    // 删除 .scrollable-container 元素
    $('.scrollable-container').remove();

    // 删除 .scrollable-open-tree 元素
    $('.scrollable-open-tree').remove();
        // 重置 body 样式
    $('body').css({
        'display': '', // 移除 display 样式
        'flexDirection': '' // 移除 flexDirection 样式
    });
}



var showLoading = function() {
    $('.loader').show();
    $('.toggle-btn').removeClass('toggle-btn-color');
}

var hideLoading = function() {
    $('.loader').hide();
    $('.toggle-btn').addClass('toggle-btn-color');
}

var showSpinner = function() {
    $('.open-tree')
        .removeClass('fa fa-angle-right')
        .addClass('busy')
        .append('<i class="fa fa-spinner fa-spin"></i>');
}

var hideSpinner = function() {
    $('.open-tree')
        .addClass('fa fa-angle-right')
        .removeClass('busy');
    $('.open-tree i').removeClass('fa fa-spinner fa-spin');
}

var hotkey = function() {
    $(document).keyup(function(e) {
        // 219 [
        if (e.keyCode === 219) {
        toggleSideBar();
        }
    });
}

var toggleSideBar = function() {

}




var createNodeById = function(nodesDisplay, nodeid) {
    var cnode = $jstree.jstree(true).get_node(nodeid);
    if (cnode.data === 'tree') {
    nodesDisplay.forEach(function(item) {
        var newNodeObj = $jstree.jstree(true).create_node(cnode, item, 'last', function(data) {
        // console.log('new node created.');
        // console.log(data);
        });
        $jstree.jstree(true).open_node(cnode);
    });
    } else {
    console.log('cnode type is ' + cnode.data);
    }
}

// src/main/webapp
// --------->
// ['src', 'src/main', 'src/main/webapp']
var makeRequestArr = function(str) {
    var arr = [];
    var arrSplited = str.split('/');
    arr.push(arrSplited[0]);
    arrSplited.reduce(function(prev, current, currentIndex){
    var tmpValue =  prev + '/' + current;
    arr.push(tmpValue);
    return tmpValue;
    });
    return arr;
}
    


    
var expandSubTreeByJSON = function(cssSelector, requestPath, lastElement, nodesDisplay) {
    $(cssSelector).each(function (index, element) {
    var nodeid;
    var text = $(element).text().trim();
    if (text === requestPath[0]) {
        nodeid = $(this).parent().attr('id');
        // $(this).parent().find('div.jstree-wholerow').addClass('jstree-wholerow-clicked');
        createNodeById(nodesDisplay, nodeid);
    } else if(lastElement.split('/').indexOf(text) > -1) {
        nodeid = element.id;
        $(this).find('div.jstree-wholerow').addClass('jstree-wholerow-clicked');
        createNodeById(nodesDisplay, nodeid);
    }
    });
}

// 处理右侧gerrit的宽度
var hackStyle = function() {

    $('.sidebar-wrapper').hide();
    $('.gerrit-tree').css('width', '230px');
    $('header.navbar').css('margin-left', '230px');


    $('.breadcrumb').addClass('vh');
}

var handlePJAX = function() {
    if ($.support.pjax) {
    // $(document).on('pjax:complete', function() {
    //   $('pre code').each(function(i, block) {
    //     hljs.highlightBlock(block);
    //   });
    // });

    $(document).on('pjax:start', function() {
        NProgress.start();
        showLoading();
    });
    $(document).on('pjax:end', function() {
        NProgress.done();
        hideLoading();

        $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
        });
    });
    }
}


function fetchAndProcessData(userInputUrl,repo,branch) {
    $.ajax({
        url: userInputUrl,
        type: 'GET',
        dataType: 'text', // 期望服务器返回文本格式
        crossDomain: true, // 明确告诉 jQuery 发送跨域请求
        success: function(data) {
            try {
            // 假设服务器返回的数据格式是 ")]}', followed by the actual JSON data"
            // 我们需要移除前缀 ")]}'," 来获取正确的 JSON 字符串
            var startIndex = data.indexOf('{');
            var cleanedData = data.substring(startIndex);
            var jsonData = JSON.parse(cleanedData);
            console.log('Received data:', jsonData);
            createBtn();
            createGerritTreeContainer(repo,branch);
            createGerritTree(jsonData);
            clickNode();

            // handleToggleBtn();
            // hotkey();
            // hackStyle();
            console.log('Tree built and inserted into DOM.');
            } catch (e) {
            console.error("Error parsing JSON:", e);
            // 在请求失败时，给出用户反馈
            treeContainer.append('<p>Error parsing data. Please check the URL and try again.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error("Error fetching data:", error);
            // 在请求失败时，给出用户反馈
            treeContainer.append('<p>Error fetching data. Please check the URL and try again.</p>');
        }
        });
}


function refreshTree() {
    console.log('Starting GerritTree plugin...');

    var currentUrl = window.location.href;
    var match = currentUrl.match(/^(https?:\/\/[^\/\?#]+)(\/[^?#]*)?(\+\/(\d+))$/);
    
    if (match) {
        var base = match[1]; // 基础 URL，例如 "http://192.168.107.128:8080"
        var number = match[4]; // 数字，例如 "1"
        console.log("Base URL:", base);
        console.log("Number:", number);
        // 确保基础 URL 以斜杠结尾
        if (!base.endsWith('/')) {
            base += '/';
        }

        // 拼接新的 URL
        var newUrl = base + "changes/" + number;

        console.log("New URL:", newUrl);
        
        $.ajax({
            url: newUrl,
            type: 'GET',
            dataType: 'text', // 期望服务器返回文本格式
            crossDomain: true, // 明确告诉 jQuery 发送跨域请求
            success: function(data) {
            try {
                // 假设服务器返回的数据格式是 ")]}', followed by the actual JSON data"
                // 我们需要移除前缀 ")]}'," 来获取正确的 JSON 字符串
                var startIndex = data.indexOf('{');
                var cleanedData = data.substring(startIndex);
                var jsonData = JSON.parse(cleanedData);
                console.log('Received data:', jsonData);
                // 提取 change_id 的值
                var changeId = jsonData.change_id;

                // 拼接 URL
                var pathUrl = base + "changes/" + changeId + "/revisions/current/files";
                fetchAndProcessData(pathUrl,jsonData.project,jsonData.branch);
                console.log("New URL:", pathUrl);

            } catch (e) {
                console.error("Error parsing JSON:", e);
                // 在请求失败时，给出用户反馈
                treeContainer.append('<p>Error parsing data. Please check the URL and try again.</p>');
            }
            },
            error: function(xhr, status, error) {
            console.error("Error fetching data:", error);
            // 在请求失败时，给出用户反馈
            treeContainer.append('<p>Error fetching data. Please check the URL and try again.</p>');
            }
        });
    } else {
        console.log("URL does not match expected pattern.");
    }
}


$(document).ready(function() {

    // 在页面加载时刷新树状结构
    refreshTree();
    var appElement = document.querySelector("#app").shadowRoot.querySelector("#app-element");
    var appHeight = appElement.offsetHeight; // 获取.app-element的高度
    // 设置定时器，定期检查 .app 的尺寸变化
    setInterval(function() {
        var currentAppHeight = document.querySelector("#app").shadowRoot.querySelector("#app-element").offsetHeight; // 获取当前 .app 的高度

        // 检查高度是否有变化
        if (currentAppHeight !== appHeight ) {
            appHeight = currentAppHeight; // 更新 .app 的高度
            adjustScrollableContainerHeight(); // 调整滚动容器的高度
        }
    }, 1000); // 每 500 毫秒检查一次

});

// 存储上一个URL
var previousUrl = window.location.href;

// 定期检查URL是否变化
setInterval(function() {
    var currentUrl = window.location.href;
    if (currentUrl !== previousUrl) {
        previousUrl = currentUrl;
        cleanGerritTree();
        refreshTree();
    }
}, 300); // 每1000毫秒检查一次






