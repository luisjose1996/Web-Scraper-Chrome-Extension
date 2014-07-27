/**
 * @param options.parentCSSSelector	Elements can be only selected within this element
 * @param options.allowedElements	Elements that can only be selected
 * @constructor
 */
ContentSelector = function(options) {

	// deferred response
	this.deferredCSSSelectorResponse = $.Deferred();

	this.allowedElements = options.allowedElements;
	this.parentCSSSelector = options.parentCSSSelector.trim();

	if(this.parentCSSSelector) {
		this.parent = $(this.parentCSSSelector)[0];

		//  handle situation when parent selector not found
		if(this.parent === undefined) {
			this.deferredCSSSelectorResponse.reject("parent selector not found");
			return;
		}
	}
	else {
		this.parent = $("body")[0];
	}
};

ContentSelector.prototype = {

	/**
	 * get css selector selected by the user
	 */
	getCSSSelector: function(request) {

		if(this.deferredCSSSelectorResponse.state() !== "rejected") {

			// elements that are selected by the user
			this.selectedElements = [];
			// element selected from top
			this.top = 0;

			// initialize css selector
			this.initCssSelector(false);

			this.initGUI();
		}

		return this.deferredCSSSelectorResponse.promise();
	},

	/**
	 * initialize or reconfigure css selector class
	 * @param allowMultipleSelectors
	 */
	initCssSelector: function(allowMultipleSelectors) {
		this.cssSelector = new CssSelector({
			enableSmartTableSelector: true,
			parent: this.parent,
			allowMultipleSelectors:allowMultipleSelectors,
			ignoredClasses: [
				"-sitemap-select-item-selected",
				"-sitemap-select-item-hover",
				"-sitemap-parent"
			],
			query: jQuery
		});
	},

	previewSelector: function (elementCSSSelector) {

		if(this.deferredCSSSelectorResponse.state() !== "rejected") {

			this.highlightParent();
			$(this.parent).find(elementCSSSelector).addClass('-sitemap-select-item-selected');
			this.deferredCSSSelectorResponse.resolve();
		}

		return this.deferredCSSSelectorResponse.promise();
	},

	initGUI: function () {

		this.highlightParent();

		// all elements except toolbar
		this.$allElements = $(this.allowedElements+":not(#-selector-toolbar):not(#-selector-toolbar *)", this.parent);

		this.bindElementHighlight();
		this.bindElementSelection();
		this.bindKeyboardSelectionManipulations();
		this.attachToolbar();
		this.bindMultipleGroupCheckbox();
		this.bindMultipleGroupPopupHide();
	},

	bindElementSelection: function () {
		this.$allElements.bind("click.elementSelector", function (e) {
			this.selectedElements.push(e.currentTarget);
			this.highlightSelectedElements();

			// Cancel all other events
			return false;
		}.bind(this));
	},

	/**
	 * Add to select elements the element that is under the mouse
	 */
	selectMouseOverElement: function() {

		var element = this.mouseOverElement;
		if(element) {
			this.selectedElements.push(element);
			this.highlightSelectedElements();
		}
	},

	bindElementHighlight: function () {

		$(this.$allElements).bind("mouseover.elementSelector", function(e) {
			var element = e.currentTarget;
			this.mouseOverElement = element;
			$(element).addClass("-sitemap-select-item-hover");
			return false;
		}.bind(this)).bind("mouseout.elementSelector", function(e) {
			var element = e.currentTarget;
			this.mouseOverElement = null;
			$(element).removeClass("-sitemap-select-item-hover");
			return false;
		}.bind(this));
	},

	selectChild: function () {
		this.top--;
		if (this.top < 0) {
			this.top = 0;
		}
	},
	selectParent: function () {
		this.top++;
	},

	// User with keyboard arrows can select child or paret elements of selected elements.
	bindKeyboardSelectionManipulations: function () {

		// check for focus
		var lastFocusStatus;
		this.keyPressFocusInterval = setInterval(function() {
			var focus = document.hasFocus();
			if(focus === lastFocusStatus) return;
			lastFocusStatus = focus;

			$("#-selector-toolbar .key-button").toggleClass("hide", !focus);
			$("#-selector-toolbar .key-events").toggleClass("hide", focus);
		}.bind(this), 200);


		// Using up/down arrows user can select elements from top of the
		// selected element
		$(document).bind("keydown.selectionManipulation", function (event) {

			// select child C
			if (event.keyCode === 67) {
				this.animateClickedKey($("#-selector-toolbar .key-button-child"));
				this.selectChild();
			}
			// select parent P
			else if (event.keyCode === 80) {
				this.animateClickedKey($("#-selector-toolbar .key-button-parent"));
				this.selectParent();
			}
			// select element
			else if (event.keyCode === 83) {
				this.animateClickedKey($("#-selector-toolbar .key-button-select"));
				this.selectMouseOverElement();
			}

			this.highlightSelectedElements();
		}.bind(this));
	},

	animateClickedKey: function(element) {
		$(element).removeClass("clicked").removeClass("clicked-animation");
		setTimeout(function() {
			$(element).addClass("clicked");
			setTimeout(function(){
				$(element).addClass("clicked-animation");
			},100);
		},1);

	},

	highlightSelectedElements: function () {
		try {
			var resultCssSelector = this.cssSelector.getCssSelector(this.selectedElements, this.top);

			$("body #-selector-toolbar .selector").text(resultCssSelector);
			// highlight selected elements
			$(".-sitemap-select-item-selected").removeClass('-sitemap-select-item-selected');
			$(resultCssSelector, this.parent).addClass('-sitemap-select-item-selected');
		}
		catch(err) {
			if(err === "found multiple element groups, but allowMultipleSelectors disabled") {
				console.log("multiple different element selection disabled");

				this.showMultipleGroupPopup();
				// remove last added element
				this.selectedElements.pop();
				this.highlightSelectedElements();
			}
		}
	},

	showMultipleGroupPopup: function() {
		$("#-selector-toolbar .popover").attr("style", "display:block !important;");
	},

	hideMultipleGroupPopup: function() {
		$("#-selector-toolbar .popover").attr("style", "");
	},

	bindMultipleGroupPopupHide: function() {
		$("#-selector-toolbar .popover .close").click(this.hideMultipleGroupPopup.bind(this));
	},

	unbindMultipleGroupPopupHide: function() {
		$("#-selector-toolbar .popover .close").unbind("click");
	},

	bindMultipleGroupCheckbox: function() {
		$("#-selector-toolbar [name=diferentElementSelection]").change(function(e) {
			if($(e.currentTarget).is(":checked")) {
				this.initCssSelector(true);
			}
			else {
				this.initCssSelector(false);
			}
		}.bind(this));
	},
	unbindMultipleGroupCheckbox: function(){
		$("#-selector-toolbar .diferentElementSelection").unbind("change");
	},

	attachToolbar: function () {

		var $toolbar = '<div id="-selector-toolbar">' +
			'<div class="list-item"><div class="selector-container"><div class="selector"></div></div></div>' +
			'<div class="input-group-addon list-item">' +
				'<input type="checkbox" title="Enable different type element selection" name="diferentElementSelection">' +
				'<div class="popover top">' +
				'<div class="close">×</div>' +
				'<div class="arrow"></div>' +
				'<div class="popover-content">' +
				'<div class="txt">' +
				'Different type element selection is disabled. If the element ' +
				'you clicked should also be included then enable this and ' +
				'click on the element again. Usually this is not needed.' +
				'</div>' +
				'</div>' +
				'</div>' +
			'</div>' +
			'<div class="list-item key-events"><div title="Click here to enable key press events for selection">Enable key events</div></div>' +
			'<div class="list-item key-button key-button-select hide" title="Use S key to select element">S</div>' +
			'<div class="list-item key-button key-button-parent hide" title="Use P key to select parent">P</div>' +
			'<div class="list-item key-button key-button-child hide" title="Use C key to select child">C</div>' +
			'<div class="list-item done-selecting-button">Done selecting!</div>' +
			'</div>';
		$("body").append($toolbar);

		$("body #-selector-toolbar .done-selecting-button").click(function () {
			this.selectionFinished();
		}.bind(this));
	},
	highlightParent: function () {
		// do not highlight parent if its the body
		if(!$(this.parent).is("body") && !$(this.parent).is("#webpage")) {
			$(this.parent).addClass("-sitemap-parent");
		}
	},

	unbindElementSelection: function () {
		$(this.$allElements).unbind("click.elementSelector");
		// remove highlighted element classes
		this.unbindElementSelectionHighlight();
	},
	unbindElementSelectionHighlight: function () {
		$(".-sitemap-select-item-selected").removeClass('-sitemap-select-item-selected');
		$(".-sitemap-parent").removeClass('-sitemap-parent');
	},
	unbindElementHighlight: function () {
		$(this.$allElements).unbind("mouseover.elementSelector")
			.unbind("mouseout.elementSelector");
	},
	unbindKeyboardSelectionMaipulatios: function () {
		$(document).unbind("keydown.selectionManipulation");
		clearInterval(this.keyPressFocusInterval);
	},
	removeToolbar: function () {
		$("body #-selector-toolbar a").unbind("click");
		$("#-selector-toolbar").remove();
	},

	/**
	 * Remove toolbar and unbind events
	 */
	removeGUI: function() {

		this.unbindElementSelection();
		this.unbindElementHighlight();
		this.unbindKeyboardSelectionMaipulatios();
		this.unbindMultipleGroupPopupHide();
		this.unbindMultipleGroupCheckbox();
		this.removeToolbar();
	},

	selectionFinished: function () {

		var resultCssSelector;
		if(this.selectedElements.length > 0) {
			resultCssSelector = this.cssSelector.getCssSelector(this.selectedElements, this.top);
		}
		else {
			resultCssSelector = "";
		}

		this.deferredCSSSelectorResponse.resolve({
			CSSSelector: resultCssSelector
		});
	}
};
