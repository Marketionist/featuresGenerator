// Create a new panel
chrome.devtools.panels.create("Features Generator",
    null,
    "panel.html",
    function(extensionPanel) {
        var _window;

        //If panel is opened - show message, add it to data[] otherwise
        var data = [];
        var port = chrome.runtime.connect({name: 'devtools'});
        port.onMessage.addListener(function (msg) {
	        if (msg.step) {
		        //Got some step from content page
	            if(_window) {
		            _window.addStepText(msg.step);
	            } else {
		            data.push(msg.step);
	            }
            } else if (msg.suggestion) {
	            //Got some suggestion from content page
		        _window.setDivFocusText(msg.suggestion);
	            _window.clearSuggestions();
            }

        });

        //Add all the messages got before panel was opened
        extensionPanel.onShown.addListener(function tmp(panelWindow) {
            extensionPanel.onShown.removeListener(tmp);
            _window = panelWindow;
            var msg;
            while (msg = data.shift())
                _window.addStepText(msg.step);

	        //add menu.js to the panel context
	        chrome.devtools.inspectedWindow.getResources(function (resources) {
		        var menu = resources.find(function(el){ return el.url.match(/menu.js/)});
		        menu.getContent(function(content) {
			        _window.eval(content);
		        });
	        });
        });

    });
