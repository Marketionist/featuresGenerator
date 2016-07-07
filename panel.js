var locatorsString;
var menu;

var steps = [
	'Then "page"."locator" should be present',
	'When I click "page"."locator"',
	'When I clear "page"."locator"',
	'When I write "" to "page"."locator"',
	'When I wait and click "page"."locator"',
	'Then "page"."locator" CSS "" should contain ""',
	'Then "page"."locator" has text ""',
	'Then "page"."locator" has value ""',
	'Then "page"."locator" should not be present',
	'Then "page"."locator"',
	{'Element attributes' : [
		'Then "page"."locator" CSS "" should be nearly ""',
		'Then "page"."locator" CSS "" should contain ""',
		'Then "page"."locator" CSS "" should contain "".""',
		'Then "page"."locator" attribute "" should contain ""',
		'Then "page"."locator" attribute "" should not contain ""',
		'Then "page"."locator" has text ""',
		'Then "page"."locator" has text "".""',
		'Then "page"."locator" has value ""',
		'Then "page"."locator" has value "".""',
		'Then "page"."locator" value equals ""',
		'When I wait for "page"."locator" to match ""',
		'When I wait for "page"."locator" to match "".""'
	]},
	{'Element state' : [
		'Then "page"."locator" should be disabled',
		'Then "page"."locator" should be enabled',
		'Then "page"."locator" should be present',
		'Then "page"."locator" should be selected',
		'Then "page"."locator" should not be present',
		'Then "page"."locator" should not be selected',
		'Then "page"."locator" value should be present in ""."" dd'
	]},
	{'Actions' : [
		'When I clear "page"."locator"',
		'When I click "page"."locator" at dropdown button',
		'When I click "page"."locator" if present',
		'When I doubleclick "page"."locator"',
		'When I focus "page"."locator"',
		'When I moveTo "page"."locator"',
		'When I scroll "page"."locator" element into view',
		'When I set inner HTML value "" to "page"."locator"',
		'When I switch to "page"."locator" frame',
		'When I upload "" to "page"."locator"',
		'When I wait and click "page"."locator"',
		'When I write "" to "page"."locator"',
		'When I write ""."" to "page"."locator"'
	]}
];

function generateStepText(text) {
	if (document.getElementById("bdd-term-replace").checked) {
		var currStep = text.match(/^[A-Za-z]*/)[0];
		var stepsArr = document.getElementById("generatedFeatures").innerText.split(/\n/);
		var lastStep = "";
		for (var i = stepsArr.length - 1; i >=0; i--) {
			lastStep = stepsArr[i].match(/^[A-Za-z]*/)[0];
			if (lastStep !== 'And') {
				if (lastStep === currStep) {
					var re = new RegExp("^" + currStep);
					text = text.replace(re, "And");
				}
				return text;
			}
		}
	} else {
		return text;
	}
}

function autoComplete() {
	return document.getElementById("auto-steps-complete").checked;
}

function addText (text) {
	document.getElementById("generatedFeatures").innerHTML += "<div>" + text + "</div>";
}

function addStepText(text) {
	addText(generateStepText(text));
}

function markHighlightStatus(step) {
	if (autoComplete()) {
		inspectedWindowEval('currSuggestion = \'' + step + '\';', function(result, err) {
			if (err) {
				addText(JSON.stringify(err) + err.message);
			}
		});
	}
}

function getlocators(data) {
	//Remove everything before module.exports
	data = data.replace(/.*module.exports.*/,'');
	//Remove last close and everething after it
	data = data.replace(/};?(\r\n|\n|\r)*$/,'');
	var evalStr = 'var func = function(){' + data + '}';
	eval(evalStr);
	function require() {
		return new Proxy({},{
			get: function(target) {
				return new Proxy(target, {
					get: function() {return new Proxy(target,{
						apply: function() {return ''}
					})},
					apply: function() {return ''}
				});
			}
		});
	}
	return func();
}

function clearLocator(fileName, locatorsPageName) {
	var element = document.getElementById('uploaded-locator-id' + fileName);
	document.getElementById('uploaded-locators').removeChild(element);
	chrome.devtools.inspectedWindow.eval('delete locators["' + locatorsPageName + '"];',{useContentScriptContext: true}, function(result, err) {
		if (err) {
			addText(JSON.stringify(err) + err.message);
		}
	});
}

function addUploadedLocatorsFile(locatorsPageName, fileName) {
	try {
		var element = document.createElement('div');
		element.setAttribute('id','uploaded-locator-id' + fileName);
		element.innerText =  "'" + fileName + "' file was uploaded to '" + locatorsPageName + "' locators page ";
		var removeElement = document.createElement('button');
		removeElement.innerText = "Remove uploaded locator";
		removeElement.addEventListener('click', function() {
			clearLocator(fileName, locatorsPageName);
		});
		element.appendChild(removeElement);
		document.getElementById('uploaded-locators').appendChild(element);
	} catch(err) {
		addText(err + " " + err.message);
	}
}

function inspectedWindowEval(command, callback) {
	chrome.devtools.inspectedWindow.eval(command, {useContentScriptContext: true}, callback);
}

document.getElementsByClassName('file-input')[0].addEventListener('change', function(){
	var file = this.files[0];
	var reader = new FileReader();
	reader.onload = function(){
		try {
			var text = reader.result;
			locatorsString = getlocators(text);
		} catch(err) {
			addText(err + " " + err.message);
		}
	};
	reader.readAsText(file);
},false);

document.getElementById('upload-locators').addEventListener('click', function(){
	var strJSON = JSON.stringify(locatorsString);
	var replaces = document.getElementById('page-object-replace').value;
	var arr = JSON.parse(replaces);
	arr.forEach(function(strArr){
		var from = strArr[0].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
		var to = strArr[1];
		var regex = new RegExp(from, "g");
		strJSON = strJSON.replace(regex,to);
	});
	var locatorsPageName = document.getElementById('page-object-name').value;
	var strAddLocatorsCommand = 'locators["' + locatorsPageName + '"] =' + strJSON + ';';
	inspectedWindowEval(strAddLocatorsCommand, function(result, err){
		if (err) {
			addText(JSON.stringify(err) + err.message);
		}
		var fileName = document.getElementsByClassName('file-input')[0].files[0].name;
		try {
			addUploadedLocatorsFile(locatorsPageName, fileName);
			inspectedWindowEval('processLocators();');
			document.getElementById('page-object-name').value = "";
			document.getElementsByClassName('file-input')[0].value="";
		} catch(err) {
			addText(err + " " + err.message);
		}
	});
},false);

document.getElementById('auto-steps-complete').addEventListener('click', function(e){
	if(autoComplete()) {
		document.getElementById('steps_suggestions_block').style.display = 'table-cell';
	} else {
		document.getElementById('steps_suggestions_block').style.display = 'none';
	}
});

function getStepsArr(steps) {
	var arr = [];
	var step;
	steps.forEach(function(step) {
		if (typeof step === 'string') {
			arr.push(step);
		} else {
			for (var key in step) {
				step[key].forEach(function(lowerStep) {
					arr.push(lowerStep)
				});
			}
		}
	});
	return arr;
}

function filterSteps(steps, text) {
	var res = [];
	steps.forEach(function(step) {
		var re = new RegExp(text, 'i');
		if (step.match(re)) {
			res.push(step);
		}
	});
	return res;
}

function getDivFocusText() {
	var text = window.getSelection().focusNode.parentElement.innerText;
	var textArr = text.split('\n');
	return textArr[textArr.length - 1];
}

function setDivFocusText(text, newline) {
	window.getSelection().focusNode.textContent = text;
}

function getCurrText(e) {
	var text = getDivFocusText();
	var code = e.keyCode;
	var letter = String.fromCharCode(code);
	if (letter.match(/[A-Z]/)) {
		text += letter.toLocaleLowerCase();
	} else if(e.keyCode === 8) {
		text = text.substr(0, text.length - 1);
	}
	return text;
}

function createSuggestion(text) {
	var element = document.createElement('a');
	element.textContent = text;
	element.setAttribute('href','#');
	element.setAttribute('class','suggestion');
	element.style.display = 'flex';
	element.style.margin = "5";
	element.addEventListener('click', function() {
		window.getSelection().focusNode.textContent = text;
	});
	return element;
}

function populateAutoComplete(e) {
	if(autoComplete()) {
		document.getElementById('steps_suggestions').innerHTML = "";
		var resSteps;
		var currText = getCurrText(e);
		var stepsArr = getStepsArr(steps);
		resSteps = filterSteps(stepsArr, currText);
		resSteps.forEach(function(step){
			document.getElementById('steps_suggestions').appendChild(createSuggestion(step));
		});
		highlightSuggestion();
	}
}

document.getElementById('generatedFeatures').addEventListener('keydown', function (e) {
	var arrCode = [38, 40, 13];
	var keyCode = e.keyCode;
	if (arrCode.indexOf(keyCode) === -1) {
		populateAutoComplete(e);
	}
});

function highlightSuggestion(num) {
	var suggestions = document.getElementsByClassName('suggestion');
	var current = document.getElementsByClassName('current_suggestion')[0];
	var other;
	if (suggestions) {
		switch(num) {
			case 'first':
			default:
				if (suggestions[0]) {
					current = suggestions[0];
					addCurrentClassName(current);
				}
				break;
			case 'next':
				if (current && (other = current.nextElementSibling)) {
					addCurrentClassName(other);
					removeCurrentClass(current);
					event.preventDefault();
				}
				break;
			case 'previous':
				if (current && (other = current.previousElementSibling)) {
					addCurrentClassName(other);
					removeCurrentClass(current);
					event.preventDefault();
				}
		}
	}
}

function removeCurrentClass(e) {
	e.className = e.className.replace( new RegExp('(?:^|\\s)current_suggestion(?!\\S)') ,'');
}

function addCurrentClassName(e) {
	e.className += ' current_suggestion';
}

function insertStep(currStep) {
	var textContent = getDivFocusText();
	if (currStep && currStep !== textContent) {
		//Insert currStep text
		var sel, range;
		sel = window.getSelection();
		window.getSelection().focusNode.textContent = "";
		range = sel.getRangeAt(0);
		var newNode = document.createTextNode(currStep);
		range.insertNode(newNode);

		//move the cursor
		range.setStartAfter(newNode);
		range.setEndAfter(newNode);
		sel.removeAllRanges();
		sel.addRange(range);

		//prevent default actions
		event.preventDefault();
		window.getSelection().focusNode.textContent = currStep;
		markHighlightStatus(currStep);
	}
}

document.addEventListener('keydown', function(event) {
	if(autoComplete()) {
		switch(event.keyCode) {
			case 38:
				highlightSuggestion('previous');
				break;
			case 40:
				highlightSuggestion('next');
				break;
			case 13:
				var currEl = document.getElementsByClassName('current_suggestion')[0];
				if (currEl) {
					insertStep(currEl.text);
					break;
				}
		}
	}
});
