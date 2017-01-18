(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! PhotoSwipe Default UI - 4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
/**
*
* UI on top of main sliding area (caption, arrows, close button, etc.).
* Built just using public methods/properties of PhotoSwipe.
* 
*/
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		module.exports = factory();
	} else {
		root.PhotoSwipeUI_Default = factory();
	}
})(undefined, function () {

	'use strict';

	var PhotoSwipeUI_Default = function PhotoSwipeUI_Default(pswp, framework) {

		var ui = this;
		var _overlayUIUpdated = false,
		    _controlsVisible = true,
		    _fullscrenAPI,
		    _controls,
		    _captionContainer,
		    _fakeCaptionContainer,
		    _indexIndicator,
		    _shareButton,
		    _shareModal,
		    _shareModalHidden = true,
		    _initalCloseOnScrollValue,
		    _isIdle,
		    _listen,
		    _loadingIndicator,
		    _loadingIndicatorHidden,
		    _loadingIndicatorTimeout,
		    _galleryHasOneSlide,
		    _options,
		    _defaultUIOptions = {
			barsSize: { top: 44, bottom: 'auto' },
			closeElClasses: ['item', 'caption', 'zoom-wrap', 'ui', 'top-bar'],
			timeToIdle: 4000,
			timeToIdleOutside: 1000,
			loadingIndicatorDelay: 1000, // 2s

			addCaptionHTMLFn: function addCaptionHTMLFn(item, captionEl /*, isFake */) {
				if (!item.title) {
					captionEl.children[0].innerHTML = '';
					return false;
				}
				captionEl.children[0].innerHTML = item.title;
				return true;
			},

			closeEl: true,
			captionEl: true,
			fullscreenEl: true,
			zoomEl: true,
			shareEl: true,
			counterEl: true,
			arrowEl: true,
			preloaderEl: true,

			tapToClose: false,
			tapToToggleControls: true,

			clickToCloseNonZoomable: true,

			shareButtons: [{ id: 'facebook', label: 'Share on Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={{url}}' }, { id: 'twitter', label: 'Tweet', url: 'https://twitter.com/intent/tweet?text={{text}}&url={{url}}' }, { id: 'pinterest', label: 'Pin it', url: 'http://www.pinterest.com/pin/create/button/' + '?url={{url}}&media={{image_url}}&description={{text}}' }, { id: 'download', label: 'Download image', url: '{{raw_image_url}}', download: true }],
			getImageURLForShare: function getImageURLForShare() /* shareButtonData */{
				return pswp.currItem.src || '';
			},
			getPageURLForShare: function getPageURLForShare() /* shareButtonData */{
				return window.location.href;
			},
			getTextForShare: function getTextForShare() /* shareButtonData */{
				return pswp.currItem.title || '';
			},

			indexIndicatorSep: ' / ',
			fitControlsWidth: 1200

		},
		    _blockControlsTap,
		    _blockControlsTapTimeout;

		var _onControlsTap = function _onControlsTap(e) {
			if (_blockControlsTap) {
				return true;
			}

			e = e || window.event;

			if (_options.timeToIdle && _options.mouseUsed && !_isIdle) {
				// reset idle timer
				_onIdleMouseMove();
			}

			var target = e.target || e.srcElement,
			    uiElement,
			    clickedClass = target.getAttribute('class') || '',
			    found;

			for (var i = 0; i < _uiElements.length; i++) {
				uiElement = _uiElements[i];
				if (uiElement.onTap && clickedClass.indexOf('pswp__' + uiElement.name) > -1) {
					uiElement.onTap();
					found = true;
				}
			}

			if (found) {
				if (e.stopPropagation) {
					e.stopPropagation();
				}
				_blockControlsTap = true;

				// Some versions of Android don't prevent ghost click event 
				// when preventDefault() was called on touchstart and/or touchend.
				// 
				// This happens on v4.3, 4.2, 4.1, 
				// older versions strangely work correctly, 
				// but just in case we add delay on all of them)	
				var tapDelay = framework.features.isOldAndroid ? 600 : 30;
				_blockControlsTapTimeout = setTimeout(function () {
					_blockControlsTap = false;
				}, tapDelay);
			}
		},
		    _fitControlsInViewport = function _fitControlsInViewport() {
			return !pswp.likelyTouchDevice || _options.mouseUsed || screen.width > _options.fitControlsWidth;
		},
		    _togglePswpClass = function _togglePswpClass(el, cName, add) {
			framework[(add ? 'add' : 'remove') + 'Class'](el, 'pswp__' + cName);
		},


		// add class when there is just one item in the gallery
		// (by default it hides left/right arrows and 1ofX counter)
		_countNumItems = function _countNumItems() {
			var hasOneSlide = _options.getNumItemsFn() === 1;

			if (hasOneSlide !== _galleryHasOneSlide) {
				_togglePswpClass(_controls, 'ui--one-slide', hasOneSlide);
				_galleryHasOneSlide = hasOneSlide;
			}
		},
		    _toggleShareModalClass = function _toggleShareModalClass() {
			_togglePswpClass(_shareModal, 'share-modal--hidden', _shareModalHidden);
		},
		    _toggleShareModal = function _toggleShareModal() {

			_shareModalHidden = !_shareModalHidden;

			if (!_shareModalHidden) {
				_toggleShareModalClass();
				setTimeout(function () {
					if (!_shareModalHidden) {
						framework.addClass(_shareModal, 'pswp__share-modal--fade-in');
					}
				}, 30);
			} else {
				framework.removeClass(_shareModal, 'pswp__share-modal--fade-in');
				setTimeout(function () {
					if (_shareModalHidden) {
						_toggleShareModalClass();
					}
				}, 300);
			}

			if (!_shareModalHidden) {
				_updateShareURLs();
			}
			return false;
		},
		    _openWindowPopup = function _openWindowPopup(e) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			pswp.shout('shareLinkClick', e, target);

			if (!target.href) {
				return false;
			}

			if (target.hasAttribute('download')) {
				return true;
			}

			window.open(target.href, 'pswp_share', 'scrollbars=yes,resizable=yes,toolbar=no,' + 'location=yes,width=550,height=420,top=100,left=' + (window.screen ? Math.round(screen.width / 2 - 275) : 100));

			if (!_shareModalHidden) {
				_toggleShareModal();
			}

			return false;
		},
		    _updateShareURLs = function _updateShareURLs() {
			var shareButtonOut = '',
			    shareButtonData,
			    shareURL,
			    image_url,
			    page_url,
			    share_text;

			for (var i = 0; i < _options.shareButtons.length; i++) {
				shareButtonData = _options.shareButtons[i];

				image_url = _options.getImageURLForShare(shareButtonData);
				page_url = _options.getPageURLForShare(shareButtonData);
				share_text = _options.getTextForShare(shareButtonData);

				shareURL = shareButtonData.url.replace('{{url}}', encodeURIComponent(page_url)).replace('{{image_url}}', encodeURIComponent(image_url)).replace('{{raw_image_url}}', image_url).replace('{{text}}', encodeURIComponent(share_text));

				shareButtonOut += '<a href="' + shareURL + '" target="_blank" ' + 'class="pswp__share--' + shareButtonData.id + '"' + (shareButtonData.download ? 'download' : '') + '>' + shareButtonData.label + '</a>';

				if (_options.parseShareButtonOut) {
					shareButtonOut = _options.parseShareButtonOut(shareButtonData, shareButtonOut);
				}
			}
			_shareModal.children[0].innerHTML = shareButtonOut;
			_shareModal.children[0].onclick = _openWindowPopup;
		},
		    _hasCloseClass = function _hasCloseClass(target) {
			for (var i = 0; i < _options.closeElClasses.length; i++) {
				if (framework.hasClass(target, 'pswp__' + _options.closeElClasses[i])) {
					return true;
				}
			}
		},
		    _idleInterval,
		    _idleTimer,
		    _idleIncrement = 0,
		    _onIdleMouseMove = function _onIdleMouseMove() {
			clearTimeout(_idleTimer);
			_idleIncrement = 0;
			if (_isIdle) {
				ui.setIdle(false);
			}
		},
		    _onMouseLeaveWindow = function _onMouseLeaveWindow(e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;
			if (!from || from.nodeName === 'HTML') {
				clearTimeout(_idleTimer);
				_idleTimer = setTimeout(function () {
					ui.setIdle(true);
				}, _options.timeToIdleOutside);
			}
		},
		    _setupFullscreenAPI = function _setupFullscreenAPI() {
			if (_options.fullscreenEl && !framework.features.isOldAndroid) {
				if (!_fullscrenAPI) {
					_fullscrenAPI = ui.getFullscreenAPI();
				}
				if (_fullscrenAPI) {
					framework.bind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
					ui.updateFullscreen();
					framework.addClass(pswp.template, 'pswp--supports-fs');
				} else {
					framework.removeClass(pswp.template, 'pswp--supports-fs');
				}
			}
		},
		    _setupLoadingIndicator = function _setupLoadingIndicator() {
			// Setup loading indicator
			if (_options.preloaderEl) {

				_toggleLoadingIndicator(true);

				_listen('beforeChange', function () {

					clearTimeout(_loadingIndicatorTimeout);

					// display loading indicator with delay
					_loadingIndicatorTimeout = setTimeout(function () {

						if (pswp.currItem && pswp.currItem.loading) {

							if (!pswp.allowProgressiveImg() || pswp.currItem.img && !pswp.currItem.img.naturalWidth) {
								// show preloader if progressive loading is not enabled, 
								// or image width is not defined yet (because of slow connection)
								_toggleLoadingIndicator(false);
								// items-controller.js function allowProgressiveImg
							}
						} else {
							_toggleLoadingIndicator(true); // hide preloader
						}
					}, _options.loadingIndicatorDelay);
				});
				_listen('imageLoadComplete', function (index, item) {
					if (pswp.currItem === item) {
						_toggleLoadingIndicator(true);
					}
				});
			}
		},
		    _toggleLoadingIndicator = function _toggleLoadingIndicator(hide) {
			if (_loadingIndicatorHidden !== hide) {
				_togglePswpClass(_loadingIndicator, 'preloader--active', !hide);
				_loadingIndicatorHidden = hide;
			}
		},
		    _applyNavBarGaps = function _applyNavBarGaps(item) {
			var gap = item.vGap;

			if (_fitControlsInViewport()) {

				var bars = _options.barsSize;
				if (_options.captionEl && bars.bottom === 'auto') {
					if (!_fakeCaptionContainer) {
						_fakeCaptionContainer = framework.createEl('pswp__caption pswp__caption--fake');
						_fakeCaptionContainer.appendChild(framework.createEl('pswp__caption__center'));
						_controls.insertBefore(_fakeCaptionContainer, _captionContainer);
						framework.addClass(_controls, 'pswp__ui--fit');
					}
					if (_options.addCaptionHTMLFn(item, _fakeCaptionContainer, true)) {

						var captionSize = _fakeCaptionContainer.clientHeight;
						gap.bottom = parseInt(captionSize, 10) || 44;
					} else {
						gap.bottom = bars.top; // if no caption, set size of bottom gap to size of top
					}
				} else {
					gap.bottom = bars.bottom === 'auto' ? 0 : bars.bottom;
				}

				// height of top bar is static, no need to calculate it
				gap.top = bars.top;
			} else {
				gap.top = gap.bottom = 0;
			}
		},
		    _setupIdle = function _setupIdle() {
			// Hide controls when mouse is used
			if (_options.timeToIdle) {
				_listen('mouseUsed', function () {

					framework.bind(document, 'mousemove', _onIdleMouseMove);
					framework.bind(document, 'mouseout', _onMouseLeaveWindow);

					_idleInterval = setInterval(function () {
						_idleIncrement++;
						if (_idleIncrement === 2) {
							ui.setIdle(true);
						}
					}, _options.timeToIdle / 2);
				});
			}
		},
		    _setupHidingControlsDuringGestures = function _setupHidingControlsDuringGestures() {

			// Hide controls on vertical drag
			_listen('onVerticalDrag', function (now) {
				if (_controlsVisible && now < 0.95) {
					ui.hideControls();
				} else if (!_controlsVisible && now >= 0.95) {
					ui.showControls();
				}
			});

			// Hide controls when pinching to close
			var pinchControlsHidden;
			_listen('onPinchClose', function (now) {
				if (_controlsVisible && now < 0.9) {
					ui.hideControls();
					pinchControlsHidden = true;
				} else if (pinchControlsHidden && !_controlsVisible && now > 0.9) {
					ui.showControls();
				}
			});

			_listen('zoomGestureEnded', function () {
				pinchControlsHidden = false;
				if (pinchControlsHidden && !_controlsVisible) {
					ui.showControls();
				}
			});
		};

		var _uiElements = [{
			name: 'caption',
			option: 'captionEl',
			onInit: function onInit(el) {
				_captionContainer = el;
			}
		}, {
			name: 'share-modal',
			option: 'shareEl',
			onInit: function onInit(el) {
				_shareModal = el;
			},
			onTap: function onTap() {
				_toggleShareModal();
			}
		}, {
			name: 'button--share',
			option: 'shareEl',
			onInit: function onInit(el) {
				_shareButton = el;
			},
			onTap: function onTap() {
				_toggleShareModal();
			}
		}, {
			name: 'button--zoom',
			option: 'zoomEl',
			onTap: pswp.toggleDesktopZoom
		}, {
			name: 'counter',
			option: 'counterEl',
			onInit: function onInit(el) {
				_indexIndicator = el;
			}
		}, {
			name: 'button--close',
			option: 'closeEl',
			onTap: pswp.close
		}, {
			name: 'button--arrow--left',
			option: 'arrowEl',
			onTap: pswp.prev
		}, {
			name: 'button--arrow--right',
			option: 'arrowEl',
			onTap: pswp.next
		}, {
			name: 'button--fs',
			option: 'fullscreenEl',
			onTap: function onTap() {
				if (_fullscrenAPI.isFullscreen()) {
					_fullscrenAPI.exit();
				} else {
					_fullscrenAPI.enter();
				}
			}
		}, {
			name: 'preloader',
			option: 'preloaderEl',
			onInit: function onInit(el) {
				_loadingIndicator = el;
			}
		}];

		var _setupUIElements = function _setupUIElements() {
			var item, classAttr, uiElement;

			var loopThroughChildElements = function loopThroughChildElements(sChildren) {
				if (!sChildren) {
					return;
				}

				var l = sChildren.length;
				for (var i = 0; i < l; i++) {
					item = sChildren[i];
					classAttr = item.className;

					for (var a = 0; a < _uiElements.length; a++) {
						uiElement = _uiElements[a];

						if (classAttr.indexOf('pswp__' + uiElement.name) > -1) {

							if (_options[uiElement.option]) {
								// if element is not disabled from options

								framework.removeClass(item, 'pswp__element--disabled');
								if (uiElement.onInit) {
									uiElement.onInit(item);
								}

								//item.style.display = 'block';
							} else {
								framework.addClass(item, 'pswp__element--disabled');
								//item.style.display = 'none';
							}
						}
					}
				}
			};
			loopThroughChildElements(_controls.children);

			var topBar = framework.getChildByClass(_controls, 'pswp__top-bar');
			if (topBar) {
				loopThroughChildElements(topBar.children);
			}
		};

		ui.init = function () {

			// extend options
			framework.extend(pswp.options, _defaultUIOptions, true);

			// create local link for fast access
			_options = pswp.options;

			// find pswp__ui element
			_controls = framework.getChildByClass(pswp.scrollWrap, 'pswp__ui');

			// create local link
			_listen = pswp.listen;

			_setupHidingControlsDuringGestures();

			// update controls when slides change
			_listen('beforeChange', ui.update);

			// toggle zoom on double-tap
			_listen('doubleTap', function (point) {
				var initialZoomLevel = pswp.currItem.initialZoomLevel;
				if (pswp.getZoomLevel() !== initialZoomLevel) {
					pswp.zoomTo(initialZoomLevel, point, 333);
				} else {
					pswp.zoomTo(_options.getDoubleTapZoom(false, pswp.currItem), point, 333);
				}
			});

			// Allow text selection in caption
			_listen('preventDragEvent', function (e, isDown, preventObj) {
				var t = e.target || e.srcElement;
				if (t && t.getAttribute('class') && e.type.indexOf('mouse') > -1 && (t.getAttribute('class').indexOf('__caption') > 0 || /(SMALL|STRONG|EM)/i.test(t.tagName))) {
					preventObj.prevent = false;
				}
			});

			// bind events for UI
			_listen('bindEvents', function () {
				framework.bind(_controls, 'pswpTap click', _onControlsTap);
				framework.bind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);

				if (!pswp.likelyTouchDevice) {
					framework.bind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);
				}
			});

			// unbind events for UI
			_listen('unbindEvents', function () {
				if (!_shareModalHidden) {
					_toggleShareModal();
				}

				if (_idleInterval) {
					clearInterval(_idleInterval);
				}
				framework.unbind(document, 'mouseout', _onMouseLeaveWindow);
				framework.unbind(document, 'mousemove', _onIdleMouseMove);
				framework.unbind(_controls, 'pswpTap click', _onControlsTap);
				framework.unbind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);
				framework.unbind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);

				if (_fullscrenAPI) {
					framework.unbind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
					if (_fullscrenAPI.isFullscreen()) {
						_options.hideAnimationDuration = 0;
						_fullscrenAPI.exit();
					}
					_fullscrenAPI = null;
				}
			});

			// clean up things when gallery is destroyed
			_listen('destroy', function () {
				if (_options.captionEl) {
					if (_fakeCaptionContainer) {
						_controls.removeChild(_fakeCaptionContainer);
					}
					framework.removeClass(_captionContainer, 'pswp__caption--empty');
				}

				if (_shareModal) {
					_shareModal.children[0].onclick = null;
				}
				framework.removeClass(_controls, 'pswp__ui--over-close');
				framework.addClass(_controls, 'pswp__ui--hidden');
				ui.setIdle(false);
			});

			if (!_options.showAnimationDuration) {
				framework.removeClass(_controls, 'pswp__ui--hidden');
			}
			_listen('initialZoomIn', function () {
				if (_options.showAnimationDuration) {
					framework.removeClass(_controls, 'pswp__ui--hidden');
				}
			});
			_listen('initialZoomOut', function () {
				framework.addClass(_controls, 'pswp__ui--hidden');
			});

			_listen('parseVerticalMargin', _applyNavBarGaps);

			_setupUIElements();

			if (_options.shareEl && _shareButton && _shareModal) {
				_shareModalHidden = true;
			}

			_countNumItems();

			_setupIdle();

			_setupFullscreenAPI();

			_setupLoadingIndicator();
		};

		ui.setIdle = function (isIdle) {
			_isIdle = isIdle;
			_togglePswpClass(_controls, 'ui--idle', isIdle);
		};

		ui.update = function () {
			// Don't update UI if it's hidden
			if (_controlsVisible && pswp.currItem) {

				ui.updateIndexIndicator();

				if (_options.captionEl) {
					_options.addCaptionHTMLFn(pswp.currItem, _captionContainer);

					_togglePswpClass(_captionContainer, 'caption--empty', !pswp.currItem.title);
				}

				_overlayUIUpdated = true;
			} else {
				_overlayUIUpdated = false;
			}

			if (!_shareModalHidden) {
				_toggleShareModal();
			}

			_countNumItems();
		};

		ui.updateFullscreen = function (e) {

			if (e) {
				// some browsers change window scroll position during the fullscreen
				// so PhotoSwipe updates it just in case
				setTimeout(function () {
					pswp.setScrollOffset(0, framework.getScrollY());
				}, 50);
			}

			// toogle pswp--fs class on root element
			framework[(_fullscrenAPI.isFullscreen() ? 'add' : 'remove') + 'Class'](pswp.template, 'pswp--fs');
		};

		ui.updateIndexIndicator = function () {
			if (_options.counterEl) {
				_indexIndicator.innerHTML = pswp.getCurrentIndex() + 1 + _options.indexIndicatorSep + _options.getNumItemsFn();
			}
		};

		ui.onGlobalTap = function (e) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			if (_blockControlsTap) {
				return;
			}

			if (e.detail && e.detail.pointerType === 'mouse') {

				// close gallery if clicked outside of the image
				if (_hasCloseClass(target)) {
					pswp.close();
					return;
				}

				if (framework.hasClass(target, 'pswp__img')) {
					if (pswp.getZoomLevel() === 1 && pswp.getZoomLevel() <= pswp.currItem.fitRatio) {
						if (_options.clickToCloseNonZoomable) {
							pswp.close();
						}
					} else {
						pswp.toggleDesktopZoom(e.detail.releasePoint);
					}
				}
			} else {

				// tap anywhere (except buttons) to toggle visibility of controls
				if (_options.tapToToggleControls) {
					if (_controlsVisible) {
						ui.hideControls();
					} else {
						ui.showControls();
					}
				}

				// tap to close gallery
				if (_options.tapToClose && (framework.hasClass(target, 'pswp__img') || _hasCloseClass(target))) {
					pswp.close();
					return;
				}
			}
		};
		ui.onMouseOver = function (e) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			// add class when mouse is over an element that should close the gallery
			_togglePswpClass(_controls, 'ui--over-close', _hasCloseClass(target));
		};

		ui.hideControls = function () {
			framework.addClass(_controls, 'pswp__ui--hidden');
			_controlsVisible = false;
		};

		ui.showControls = function () {
			_controlsVisible = true;
			if (!_overlayUIUpdated) {
				ui.update();
			}
			framework.removeClass(_controls, 'pswp__ui--hidden');
		};

		ui.supportsFullscreen = function () {
			var d = document;
			return !!(d.exitFullscreen || d.mozCancelFullScreen || d.webkitExitFullscreen || d.msExitFullscreen);
		};

		ui.getFullscreenAPI = function () {
			var dE = document.documentElement,
			    api,
			    tF = 'fullscreenchange';

			if (dE.requestFullscreen) {
				api = {
					enterK: 'requestFullscreen',
					exitK: 'exitFullscreen',
					elementK: 'fullscreenElement',
					eventK: tF
				};
			} else if (dE.mozRequestFullScreen) {
				api = {
					enterK: 'mozRequestFullScreen',
					exitK: 'mozCancelFullScreen',
					elementK: 'mozFullScreenElement',
					eventK: 'moz' + tF
				};
			} else if (dE.webkitRequestFullscreen) {
				api = {
					enterK: 'webkitRequestFullscreen',
					exitK: 'webkitExitFullscreen',
					elementK: 'webkitFullscreenElement',
					eventK: 'webkit' + tF
				};
			} else if (dE.msRequestFullscreen) {
				api = {
					enterK: 'msRequestFullscreen',
					exitK: 'msExitFullscreen',
					elementK: 'msFullscreenElement',
					eventK: 'MSFullscreenChange'
				};
			}

			if (api) {
				api.enter = function () {
					// disable close-on-scroll in fullscreen
					_initalCloseOnScrollValue = _options.closeOnScroll;
					_options.closeOnScroll = false;

					if (this.enterK === 'webkitRequestFullscreen') {
						pswp.template[this.enterK](Element.ALLOW_KEYBOARD_INPUT);
					} else {
						return pswp.template[this.enterK]();
					}
				};
				api.exit = function () {
					_options.closeOnScroll = _initalCloseOnScrollValue;

					return document[this.exitK]();
				};
				api.isFullscreen = function () {
					return document[this.elementK];
				};
			}

			return api;
		};
	};
	return PhotoSwipeUI_Default;
});

},{}],2:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! PhotoSwipe - v4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		module.exports = factory();
	} else {
		root.PhotoSwipe = factory();
	}
})(undefined, function () {

	'use strict';

	var PhotoSwipe = function PhotoSwipe(template, UiClass, items, options) {

		/*>>framework-bridge*/
		/**
   *
   * Set of generic functions used by gallery.
   * 
   * You're free to modify anything here as long as functionality is kept.
   * 
   */
		var framework = {
			features: null,
			bind: function bind(target, type, listener, unbind) {
				var methodName = (unbind ? 'remove' : 'add') + 'EventListener';
				type = type.split(' ');
				for (var i = 0; i < type.length; i++) {
					if (type[i]) {
						target[methodName](type[i], listener, false);
					}
				}
			},
			isArray: function isArray(obj) {
				return obj instanceof Array;
			},
			createEl: function createEl(classes, tag) {
				var el = document.createElement(tag || 'div');
				if (classes) {
					el.className = classes;
				}
				return el;
			},
			getScrollY: function getScrollY() {
				var yOffset = window.pageYOffset;
				return yOffset !== undefined ? yOffset : document.documentElement.scrollTop;
			},
			unbind: function unbind(target, type, listener) {
				framework.bind(target, type, listener, true);
			},
			removeClass: function removeClass(el, className) {
				var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
				el.className = el.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			},
			addClass: function addClass(el, className) {
				if (!framework.hasClass(el, className)) {
					el.className += (el.className ? ' ' : '') + className;
				}
			},
			hasClass: function hasClass(el, className) {
				return el.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(el.className);
			},
			getChildByClass: function getChildByClass(parentEl, childClassName) {
				var node = parentEl.firstChild;
				while (node) {
					if (framework.hasClass(node, childClassName)) {
						return node;
					}
					node = node.nextSibling;
				}
			},
			arraySearch: function arraySearch(array, value, key) {
				var i = array.length;
				while (i--) {
					if (array[i][key] === value) {
						return i;
					}
				}
				return -1;
			},
			extend: function extend(o1, o2, preventOverwrite) {
				for (var prop in o2) {
					if (o2.hasOwnProperty(prop)) {
						if (preventOverwrite && o1.hasOwnProperty(prop)) {
							continue;
						}
						o1[prop] = o2[prop];
					}
				}
			},
			easing: {
				sine: {
					out: function out(k) {
						return Math.sin(k * (Math.PI / 2));
					},
					inOut: function inOut(k) {
						return -(Math.cos(Math.PI * k) - 1) / 2;
					}
				},
				cubic: {
					out: function out(k) {
						return --k * k * k + 1;
					}
				}
				/*
    	elastic: {
    		out: function ( k ) {
    				var s, a = 0.1, p = 0.4;
    			if ( k === 0 ) return 0;
    			if ( k === 1 ) return 1;
    			if ( !a || a < 1 ) { a = 1; s = p / 4; }
    			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
    			},
    	},
    	back: {
    		out: function ( k ) {
    			var s = 1.70158;
    			return --k * k * ( ( s + 1 ) * k + s ) + 1;
    		}
    	}
    */
			},

			/**
    * 
    * @return {object}
    * 
    * {
    *  raf : request animation frame function
    *  caf : cancel animation frame function
    *  transfrom : transform property key (with vendor), or null if not supported
    *  oldIE : IE8 or below
    * }
    * 
    */
			detectFeatures: function detectFeatures() {
				if (framework.features) {
					return framework.features;
				}
				var helperEl = framework.createEl(),
				    helperStyle = helperEl.style,
				    vendor = '',
				    features = {};

				// IE8 and below
				features.oldIE = document.all && !document.addEventListener;

				features.touch = 'ontouchstart' in window;

				if (window.requestAnimationFrame) {
					features.raf = window.requestAnimationFrame;
					features.caf = window.cancelAnimationFrame;
				}

				features.pointerEvent = navigator.pointerEnabled || navigator.msPointerEnabled;

				// fix false-positive detection of old Android in new IE
				// (IE11 ua string contains "Android 4.0")

				if (!features.pointerEvent) {

					var ua = navigator.userAgent;

					// Detect if device is iPhone or iPod and if it's older than iOS 8
					// http://stackoverflow.com/a/14223920
					// 
					// This detection is made because of buggy top/bottom toolbars
					// that don't trigger window.resize event.
					// For more info refer to _isFixedPosition variable in core.js

					if (/iP(hone|od)/.test(navigator.platform)) {
						var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
						if (v && v.length > 0) {
							v = parseInt(v[1], 10);
							if (v >= 1 && v < 8) {
								features.isOldIOSPhone = true;
							}
						}
					}

					// Detect old Android (before KitKat)
					// due to bugs related to position:fixed
					// http://stackoverflow.com/questions/7184573/pick-up-the-android-version-in-the-browser-by-javascript

					var match = ua.match(/Android\s([0-9\.]*)/);
					var androidversion = match ? match[1] : 0;
					androidversion = parseFloat(androidversion);
					if (androidversion >= 1) {
						if (androidversion < 4.4) {
							features.isOldAndroid = true; // for fixed position bug & performance
						}
						features.androidVersion = androidversion; // for touchend bug
					}
					features.isMobileOpera = /opera mini|opera mobi/i.test(ua);

					// p.s. yes, yes, UA sniffing is bad, propose your solution for above bugs.
				}

				var styleChecks = ['transform', 'perspective', 'animationName'],
				    vendors = ['', 'webkit', 'Moz', 'ms', 'O'],
				    styleCheckItem,
				    styleName;

				for (var i = 0; i < 4; i++) {
					vendor = vendors[i];

					for (var a = 0; a < 3; a++) {
						styleCheckItem = styleChecks[a];

						// uppercase first letter of property name, if vendor is present
						styleName = vendor + (vendor ? styleCheckItem.charAt(0).toUpperCase() + styleCheckItem.slice(1) : styleCheckItem);

						if (!features[styleCheckItem] && styleName in helperStyle) {
							features[styleCheckItem] = styleName;
						}
					}

					if (vendor && !features.raf) {
						vendor = vendor.toLowerCase();
						features.raf = window[vendor + 'RequestAnimationFrame'];
						if (features.raf) {
							features.caf = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
						}
					}
				}

				if (!features.raf) {
					var lastTime = 0;
					features.raf = function (fn) {
						var currTime = new Date().getTime();
						var timeToCall = Math.max(0, 16 - (currTime - lastTime));
						var id = window.setTimeout(function () {
							fn(currTime + timeToCall);
						}, timeToCall);
						lastTime = currTime + timeToCall;
						return id;
					};
					features.caf = function (id) {
						clearTimeout(id);
					};
				}

				// Detect SVG support
				features.svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

				framework.features = features;

				return features;
			}
		};

		framework.detectFeatures();

		// Override addEventListener for old versions of IE
		if (framework.features.oldIE) {

			framework.bind = function (target, type, listener, unbind) {

				type = type.split(' ');

				var methodName = (unbind ? 'detach' : 'attach') + 'Event',
				    evName,
				    _handleEv = function _handleEv() {
					listener.handleEvent.call(listener);
				};

				for (var i = 0; i < type.length; i++) {
					evName = type[i];
					if (evName) {

						if ((typeof listener === 'undefined' ? 'undefined' : _typeof(listener)) === 'object' && listener.handleEvent) {
							if (!unbind) {
								listener['oldIE' + evName] = _handleEv;
							} else {
								if (!listener['oldIE' + evName]) {
									return false;
								}
							}

							target[methodName]('on' + evName, listener['oldIE' + evName]);
						} else {
							target[methodName]('on' + evName, listener);
						}
					}
				}
			};
		}

		/*>>framework-bridge*/

		/*>>core*/
		//function(template, UiClass, items, options)

		var self = this;

		/**
   * Static vars, don't change unless you know what you're doing.
   */
		var DOUBLE_TAP_RADIUS = 25,
		    NUM_HOLDERS = 3;

		/**
   * Options
   */
		var _options = {
			allowPanToNext: true,
			spacing: 0.12,
			bgOpacity: 1,
			mouseUsed: false,
			loop: true,
			pinchToClose: true,
			closeOnScroll: true,
			closeOnVerticalDrag: true,
			verticalDragRange: 0.75,
			hideAnimationDuration: 333,
			showAnimationDuration: 333,
			showHideOpacity: false,
			focus: true,
			escKey: true,
			arrowKeys: true,
			mainScrollEndFriction: 0.35,
			panEndFriction: 0.35,
			isClickableElement: function isClickableElement(el) {
				return el.tagName === 'A';
			},
			getDoubleTapZoom: function getDoubleTapZoom(isMouseClick, item) {
				if (isMouseClick) {
					return 1;
				} else {
					return item.initialZoomLevel < 0.7 ? 1 : 1.33;
				}
			},
			maxSpreadZoom: 1.33,
			modal: true,

			// not fully implemented yet
			scaleMode: 'fit' // TODO
		};
		framework.extend(_options, options);

		/**
   * Private helper variables & functions
   */

		var _getEmptyPoint = function _getEmptyPoint() {
			return { x: 0, y: 0 };
		};

		var _isOpen,
		    _isDestroying,
		    _closedByScroll,
		    _currentItemIndex,
		    _containerStyle,
		    _containerShiftIndex,
		    _currPanDist = _getEmptyPoint(),
		    _startPanOffset = _getEmptyPoint(),
		    _panOffset = _getEmptyPoint(),
		    _upMoveEvents,
		    // drag move, drag end & drag cancel events array
		_downEvents,
		    // drag start events array
		_globalEventHandlers,
		    _viewportSize = {},
		    _currZoomLevel,
		    _startZoomLevel,
		    _translatePrefix,
		    _translateSufix,
		    _updateSizeInterval,
		    _itemsNeedUpdate,
		    _currPositionIndex = 0,
		    _offset = {},
		    _slideSize = _getEmptyPoint(),
		    // size of slide area, including spacing
		_itemHolders,
		    _prevItemIndex,
		    _indexDiff = 0,
		    // difference of indexes since last content update
		_dragStartEvent,
		    _dragMoveEvent,
		    _dragEndEvent,
		    _dragCancelEvent,
		    _transformKey,
		    _pointerEventEnabled,
		    _isFixedPosition = true,
		    _likelyTouchDevice,
		    _modules = [],
		    _requestAF,
		    _cancelAF,
		    _initalClassName,
		    _initalWindowScrollY,
		    _oldIE,
		    _currentWindowScrollY,
		    _features,
		    _windowVisibleSize = {},
		    _renderMaxResolution = false,


		// Registers PhotoSWipe module (History, Controller ...)
		_registerModule = function _registerModule(name, module) {
			framework.extend(self, module.publicMethods);
			_modules.push(name);
		},
		    _getLoopedId = function _getLoopedId(index) {
			var numSlides = _getNumItems();
			if (index > numSlides - 1) {
				return index - numSlides;
			} else if (index < 0) {
				return numSlides + index;
			}
			return index;
		},


		// Micro bind/trigger
		_listeners = {},
		    _listen = function _listen(name, fn) {
			if (!_listeners[name]) {
				_listeners[name] = [];
			}
			return _listeners[name].push(fn);
		},
		    _shout = function _shout(name) {
			var listeners = _listeners[name];

			if (listeners) {
				var args = Array.prototype.slice.call(arguments);
				args.shift();

				for (var i = 0; i < listeners.length; i++) {
					listeners[i].apply(self, args);
				}
			}
		},
		    _getCurrentTime = function _getCurrentTime() {
			return new Date().getTime();
		},
		    _applyBgOpacity = function _applyBgOpacity(opacity) {
			_bgOpacity = opacity;
			self.bg.style.opacity = opacity * _options.bgOpacity;
		},
		    _applyZoomTransform = function _applyZoomTransform(styleObj, x, y, zoom, item) {
			if (!_renderMaxResolution || item && item !== self.currItem) {
				zoom = zoom / (item ? item.fitRatio : self.currItem.fitRatio);
			}

			styleObj[_transformKey] = _translatePrefix + x + 'px, ' + y + 'px' + _translateSufix + ' scale(' + zoom + ')';
		},
		    _applyCurrentZoomPan = function _applyCurrentZoomPan(allowRenderResolution) {
			if (_currZoomElementStyle) {

				if (allowRenderResolution) {
					if (_currZoomLevel > self.currItem.fitRatio) {
						if (!_renderMaxResolution) {
							_setImageSize(self.currItem, false, true);
							_renderMaxResolution = true;
						}
					} else {
						if (_renderMaxResolution) {
							_setImageSize(self.currItem);
							_renderMaxResolution = false;
						}
					}
				}

				_applyZoomTransform(_currZoomElementStyle, _panOffset.x, _panOffset.y, _currZoomLevel);
			}
		},
		    _applyZoomPanToItem = function _applyZoomPanToItem(item) {
			if (item.container) {

				_applyZoomTransform(item.container.style, item.initialPosition.x, item.initialPosition.y, item.initialZoomLevel, item);
			}
		},
		    _setTranslateX = function _setTranslateX(x, elStyle) {
			elStyle[_transformKey] = _translatePrefix + x + 'px, 0px' + _translateSufix;
		},
		    _moveMainScroll = function _moveMainScroll(x, dragging) {

			if (!_options.loop && dragging) {
				var newSlideIndexOffset = _currentItemIndex + (_slideSize.x * _currPositionIndex - x) / _slideSize.x,
				    delta = Math.round(x - _mainScrollPos.x);

				if (newSlideIndexOffset < 0 && delta > 0 || newSlideIndexOffset >= _getNumItems() - 1 && delta < 0) {
					x = _mainScrollPos.x + delta * _options.mainScrollEndFriction;
				}
			}

			_mainScrollPos.x = x;
			_setTranslateX(x, _containerStyle);
		},
		    _calculatePanOffset = function _calculatePanOffset(axis, zoomLevel) {
			var m = _midZoomPoint[axis] - _offset[axis];
			return _startPanOffset[axis] + _currPanDist[axis] + m - m * (zoomLevel / _startZoomLevel);
		},
		    _equalizePoints = function _equalizePoints(p1, p2) {
			p1.x = p2.x;
			p1.y = p2.y;
			if (p2.id) {
				p1.id = p2.id;
			}
		},
		    _roundPoint = function _roundPoint(p) {
			p.x = Math.round(p.x);
			p.y = Math.round(p.y);
		},
		    _mouseMoveTimeout = null,
		    _onFirstMouseMove = function _onFirstMouseMove() {
			// Wait until mouse move event is fired at least twice during 100ms
			// We do this, because some mobile browsers trigger it on touchstart
			if (_mouseMoveTimeout) {
				framework.unbind(document, 'mousemove', _onFirstMouseMove);
				framework.addClass(template, 'pswp--has_mouse');
				_options.mouseUsed = true;
				_shout('mouseUsed');
			}
			_mouseMoveTimeout = setTimeout(function () {
				_mouseMoveTimeout = null;
			}, 100);
		},
		    _bindEvents = function _bindEvents() {
			framework.bind(document, 'keydown', self);

			if (_features.transform) {
				// don't bind click event in browsers that don't support transform (mostly IE8)
				framework.bind(self.scrollWrap, 'click', self);
			}

			if (!_options.mouseUsed) {
				framework.bind(document, 'mousemove', _onFirstMouseMove);
			}

			framework.bind(window, 'resize scroll', self);

			_shout('bindEvents');
		},
		    _unbindEvents = function _unbindEvents() {
			framework.unbind(window, 'resize', self);
			framework.unbind(window, 'scroll', _globalEventHandlers.scroll);
			framework.unbind(document, 'keydown', self);
			framework.unbind(document, 'mousemove', _onFirstMouseMove);

			if (_features.transform) {
				framework.unbind(self.scrollWrap, 'click', self);
			}

			if (_isDragging) {
				framework.unbind(window, _upMoveEvents, self);
			}

			_shout('unbindEvents');
		},
		    _calculatePanBounds = function _calculatePanBounds(zoomLevel, update) {
			var bounds = _calculateItemSize(self.currItem, _viewportSize, zoomLevel);
			if (update) {
				_currPanBounds = bounds;
			}
			return bounds;
		},
		    _getMinZoomLevel = function _getMinZoomLevel(item) {
			if (!item) {
				item = self.currItem;
			}
			return item.initialZoomLevel;
		},
		    _getMaxZoomLevel = function _getMaxZoomLevel(item) {
			if (!item) {
				item = self.currItem;
			}
			return item.w > 0 ? _options.maxSpreadZoom : 1;
		},


		// Return true if offset is out of the bounds
		_modifyDestPanOffset = function _modifyDestPanOffset(axis, destPanBounds, destPanOffset, destZoomLevel) {
			if (destZoomLevel === self.currItem.initialZoomLevel) {
				destPanOffset[axis] = self.currItem.initialPosition[axis];
				return true;
			} else {
				destPanOffset[axis] = _calculatePanOffset(axis, destZoomLevel);

				if (destPanOffset[axis] > destPanBounds.min[axis]) {
					destPanOffset[axis] = destPanBounds.min[axis];
					return true;
				} else if (destPanOffset[axis] < destPanBounds.max[axis]) {
					destPanOffset[axis] = destPanBounds.max[axis];
					return true;
				}
			}
			return false;
		},
		    _setupTransforms = function _setupTransforms() {

			if (_transformKey) {
				// setup 3d transforms
				var allow3dTransform = _features.perspective && !_likelyTouchDevice;
				_translatePrefix = 'translate' + (allow3dTransform ? '3d(' : '(');
				_translateSufix = _features.perspective ? ', 0px)' : ')';
				return;
			}

			// Override zoom/pan/move functions in case old browser is used (most likely IE)
			// (so they use left/top/width/height, instead of CSS transform)

			_transformKey = 'left';
			framework.addClass(template, 'pswp--ie');

			_setTranslateX = function _setTranslateX(x, elStyle) {
				elStyle.left = x + 'px';
			};
			_applyZoomPanToItem = function _applyZoomPanToItem(item) {

				var zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
				    s = item.container.style,
				    w = zoomRatio * item.w,
				    h = zoomRatio * item.h;

				s.width = w + 'px';
				s.height = h + 'px';
				s.left = item.initialPosition.x + 'px';
				s.top = item.initialPosition.y + 'px';
			};
			_applyCurrentZoomPan = function _applyCurrentZoomPan() {
				if (_currZoomElementStyle) {

					var s = _currZoomElementStyle,
					    item = self.currItem,
					    zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
					    w = zoomRatio * item.w,
					    h = zoomRatio * item.h;

					s.width = w + 'px';
					s.height = h + 'px';

					s.left = _panOffset.x + 'px';
					s.top = _panOffset.y + 'px';
				}
			};
		},
		    _onKeyDown = function _onKeyDown(e) {
			var keydownAction = '';
			if (_options.escKey && e.keyCode === 27) {
				keydownAction = 'close';
			} else if (_options.arrowKeys) {
				if (e.keyCode === 37) {
					keydownAction = 'prev';
				} else if (e.keyCode === 39) {
					keydownAction = 'next';
				}
			}

			if (keydownAction) {
				// don't do anything if special key pressed to prevent from overriding default browser actions
				// e.g. in Chrome on Mac cmd+arrow-left returns to previous page
				if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					self[keydownAction]();
				}
			}
		},
		    _onGlobalClick = function _onGlobalClick(e) {
			if (!e) {
				return;
			}

			// don't allow click event to pass through when triggering after drag or some other gesture
			if (_moved || _zoomStarted || _mainScrollAnimating || _verticalDragInitiated) {
				e.preventDefault();
				e.stopPropagation();
			}
		},
		    _updatePageScrollOffset = function _updatePageScrollOffset() {
			self.setScrollOffset(0, framework.getScrollY());
		};

		// Micro animation engine
		var _animations = {},
		    _numAnimations = 0,
		    _stopAnimation = function _stopAnimation(name) {
			if (_animations[name]) {
				if (_animations[name].raf) {
					_cancelAF(_animations[name].raf);
				}
				_numAnimations--;
				delete _animations[name];
			}
		},
		    _registerStartAnimation = function _registerStartAnimation(name) {
			if (_animations[name]) {
				_stopAnimation(name);
			}
			if (!_animations[name]) {
				_numAnimations++;
				_animations[name] = {};
			}
		},
		    _stopAllAnimations = function _stopAllAnimations() {
			for (var prop in _animations) {

				if (_animations.hasOwnProperty(prop)) {
					_stopAnimation(prop);
				}
			}
		},
		    _animateProp = function _animateProp(name, b, endProp, d, easingFn, onUpdate, onComplete) {
			var startAnimTime = _getCurrentTime(),
			    t;
			_registerStartAnimation(name);

			var animloop = function animloop() {
				if (_animations[name]) {

					t = _getCurrentTime() - startAnimTime; // time diff
					//b - beginning (start prop)
					//d - anim duration

					if (t >= d) {
						_stopAnimation(name);
						onUpdate(endProp);
						if (onComplete) {
							onComplete();
						}
						return;
					}
					onUpdate((endProp - b) * easingFn(t / d) + b);

					_animations[name].raf = _requestAF(animloop);
				}
			};
			animloop();
		};

		var publicMethods = {

			// make a few local variables and functions public
			shout: _shout,
			listen: _listen,
			viewportSize: _viewportSize,
			options: _options,

			isMainScrollAnimating: function isMainScrollAnimating() {
				return _mainScrollAnimating;
			},
			getZoomLevel: function getZoomLevel() {
				return _currZoomLevel;
			},
			getCurrentIndex: function getCurrentIndex() {
				return _currentItemIndex;
			},
			isDragging: function isDragging() {
				return _isDragging;
			},
			isZooming: function isZooming() {
				return _isZooming;
			},
			setScrollOffset: function setScrollOffset(x, y) {
				_offset.x = x;
				_currentWindowScrollY = _offset.y = y;
				_shout('updateScrollOffset', _offset);
			},
			applyZoomPan: function applyZoomPan(zoomLevel, panX, panY, allowRenderResolution) {
				_panOffset.x = panX;
				_panOffset.y = panY;
				_currZoomLevel = zoomLevel;
				_applyCurrentZoomPan(allowRenderResolution);
			},

			init: function init() {

				if (_isOpen || _isDestroying) {
					return;
				}

				var i;

				self.framework = framework; // basic functionality
				self.template = template; // root DOM element of PhotoSwipe
				self.bg = framework.getChildByClass(template, 'pswp__bg');

				_initalClassName = template.className;
				_isOpen = true;

				_features = framework.detectFeatures();
				_requestAF = _features.raf;
				_cancelAF = _features.caf;
				_transformKey = _features.transform;
				_oldIE = _features.oldIE;

				self.scrollWrap = framework.getChildByClass(template, 'pswp__scroll-wrap');
				self.container = framework.getChildByClass(self.scrollWrap, 'pswp__container');

				_containerStyle = self.container.style; // for fast access

				// Objects that hold slides (there are only 3 in DOM)
				self.itemHolders = _itemHolders = [{ el: self.container.children[0], wrap: 0, index: -1 }, { el: self.container.children[1], wrap: 0, index: -1 }, { el: self.container.children[2], wrap: 0, index: -1 }];

				// hide nearby item holders until initial zoom animation finishes (to avoid extra Paints)
				_itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'none';

				_setupTransforms();

				// Setup global events
				_globalEventHandlers = {
					resize: self.updateSize,
					scroll: _updatePageScrollOffset,
					keydown: _onKeyDown,
					click: _onGlobalClick
				};

				// disable show/hide effects on old browsers that don't support CSS animations or transforms, 
				// old IOS, Android and Opera mobile. Blackberry seems to work fine, even older models.
				var oldPhone = _features.isOldIOSPhone || _features.isOldAndroid || _features.isMobileOpera;
				if (!_features.animationName || !_features.transform || oldPhone) {
					_options.showAnimationDuration = _options.hideAnimationDuration = 0;
				}

				// init modules
				for (i = 0; i < _modules.length; i++) {
					self['init' + _modules[i]]();
				}

				// init
				if (UiClass) {
					var ui = self.ui = new UiClass(self, framework);
					ui.init();
				}

				_shout('firstUpdate');
				_currentItemIndex = _currentItemIndex || _options.index || 0;
				// validate index
				if (isNaN(_currentItemIndex) || _currentItemIndex < 0 || _currentItemIndex >= _getNumItems()) {
					_currentItemIndex = 0;
				}
				self.currItem = _getItemAt(_currentItemIndex);

				if (_features.isOldIOSPhone || _features.isOldAndroid) {
					_isFixedPosition = false;
				}

				template.setAttribute('aria-hidden', 'false');
				if (_options.modal) {
					if (!_isFixedPosition) {
						template.style.position = 'absolute';
						template.style.top = framework.getScrollY() + 'px';
					} else {
						template.style.position = 'fixed';
					}
				}

				if (_currentWindowScrollY === undefined) {
					_shout('initialLayout');
					_currentWindowScrollY = _initalWindowScrollY = framework.getScrollY();
				}

				// add classes to root element of PhotoSwipe
				var rootClasses = 'pswp--open ';
				if (_options.mainClass) {
					rootClasses += _options.mainClass + ' ';
				}
				if (_options.showHideOpacity) {
					rootClasses += 'pswp--animate_opacity ';
				}
				rootClasses += _likelyTouchDevice ? 'pswp--touch' : 'pswp--notouch';
				rootClasses += _features.animationName ? ' pswp--css_animation' : '';
				rootClasses += _features.svg ? ' pswp--svg' : '';
				framework.addClass(template, rootClasses);

				self.updateSize();

				// initial update
				_containerShiftIndex = -1;
				_indexDiff = null;
				for (i = 0; i < NUM_HOLDERS; i++) {
					_setTranslateX((i + _containerShiftIndex) * _slideSize.x, _itemHolders[i].el.style);
				}

				if (!_oldIE) {
					framework.bind(self.scrollWrap, _downEvents, self); // no dragging for old IE
				}

				_listen('initialZoomInEnd', function () {
					self.setContent(_itemHolders[0], _currentItemIndex - 1);
					self.setContent(_itemHolders[2], _currentItemIndex + 1);

					_itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'block';

					if (_options.focus) {
						// focus causes layout, 
						// which causes lag during the animation, 
						// that's why we delay it untill the initial zoom transition ends
						template.focus();
					}

					_bindEvents();
				});

				// set content for center slide (first time)
				self.setContent(_itemHolders[1], _currentItemIndex);

				self.updateCurrItem();

				_shout('afterInit');

				if (!_isFixedPosition) {

					// On all versions of iOS lower than 8.0, we check size of viewport every second.
					// 
					// This is done to detect when Safari top & bottom bars appear, 
					// as this action doesn't trigger any events (like resize). 
					// 
					// On iOS8 they fixed this.
					// 
					// 10 Nov 2014: iOS 7 usage ~40%. iOS 8 usage 56%.

					_updateSizeInterval = setInterval(function () {
						if (!_numAnimations && !_isDragging && !_isZooming && _currZoomLevel === self.currItem.initialZoomLevel) {
							self.updateSize();
						}
					}, 1000);
				}

				framework.addClass(template, 'pswp--visible');
			},

			// Close the gallery, then destroy it
			close: function close() {
				if (!_isOpen) {
					return;
				}

				_isOpen = false;
				_isDestroying = true;
				_shout('close');
				_unbindEvents();

				_showOrHide(self.currItem, null, true, self.destroy);
			},

			// destroys the gallery (unbinds events, cleans up intervals and timeouts to avoid memory leaks)
			destroy: function destroy() {
				_shout('destroy');

				if (_showOrHideTimeout) {
					clearTimeout(_showOrHideTimeout);
				}

				template.setAttribute('aria-hidden', 'true');
				template.className = _initalClassName;

				if (_updateSizeInterval) {
					clearInterval(_updateSizeInterval);
				}

				framework.unbind(self.scrollWrap, _downEvents, self);

				// we unbind scroll event at the end, as closing animation may depend on it
				framework.unbind(window, 'scroll', self);

				_stopDragUpdateLoop();

				_stopAllAnimations();

				_listeners = null;
			},

			/**
    * Pan image to position
    * @param {Number} x     
    * @param {Number} y     
    * @param {Boolean} force Will ignore bounds if set to true.
    */
			panTo: function panTo(x, y, force) {
				if (!force) {
					if (x > _currPanBounds.min.x) {
						x = _currPanBounds.min.x;
					} else if (x < _currPanBounds.max.x) {
						x = _currPanBounds.max.x;
					}

					if (y > _currPanBounds.min.y) {
						y = _currPanBounds.min.y;
					} else if (y < _currPanBounds.max.y) {
						y = _currPanBounds.max.y;
					}
				}

				_panOffset.x = x;
				_panOffset.y = y;
				_applyCurrentZoomPan();
			},

			handleEvent: function handleEvent(e) {
				e = e || window.event;
				if (_globalEventHandlers[e.type]) {
					_globalEventHandlers[e.type](e);
				}
			},

			goTo: function goTo(index) {

				index = _getLoopedId(index);

				var diff = index - _currentItemIndex;
				_indexDiff = diff;

				_currentItemIndex = index;
				self.currItem = _getItemAt(_currentItemIndex);
				_currPositionIndex -= diff;

				_moveMainScroll(_slideSize.x * _currPositionIndex);

				_stopAllAnimations();
				_mainScrollAnimating = false;

				self.updateCurrItem();
			},
			next: function next() {
				self.goTo(_currentItemIndex + 1);
			},
			prev: function prev() {
				self.goTo(_currentItemIndex - 1);
			},

			// update current zoom/pan objects
			updateCurrZoomItem: function updateCurrZoomItem(emulateSetContent) {
				if (emulateSetContent) {
					_shout('beforeChange', 0);
				}

				// itemHolder[1] is middle (current) item
				if (_itemHolders[1].el.children.length) {
					var zoomElement = _itemHolders[1].el.children[0];
					if (framework.hasClass(zoomElement, 'pswp__zoom-wrap')) {
						_currZoomElementStyle = zoomElement.style;
					} else {
						_currZoomElementStyle = null;
					}
				} else {
					_currZoomElementStyle = null;
				}

				_currPanBounds = self.currItem.bounds;
				_startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;

				_panOffset.x = _currPanBounds.center.x;
				_panOffset.y = _currPanBounds.center.y;

				if (emulateSetContent) {
					_shout('afterChange');
				}
			},

			invalidateCurrItems: function invalidateCurrItems() {
				_itemsNeedUpdate = true;
				for (var i = 0; i < NUM_HOLDERS; i++) {
					if (_itemHolders[i].item) {
						_itemHolders[i].item.needsUpdate = true;
					}
				}
			},

			updateCurrItem: function updateCurrItem(beforeAnimation) {

				if (_indexDiff === 0) {
					return;
				}

				var diffAbs = Math.abs(_indexDiff),
				    tempHolder;

				if (beforeAnimation && diffAbs < 2) {
					return;
				}

				self.currItem = _getItemAt(_currentItemIndex);
				_renderMaxResolution = false;

				_shout('beforeChange', _indexDiff);

				if (diffAbs >= NUM_HOLDERS) {
					_containerShiftIndex += _indexDiff + (_indexDiff > 0 ? -NUM_HOLDERS : NUM_HOLDERS);
					diffAbs = NUM_HOLDERS;
				}
				for (var i = 0; i < diffAbs; i++) {
					if (_indexDiff > 0) {
						tempHolder = _itemHolders.shift();
						_itemHolders[NUM_HOLDERS - 1] = tempHolder; // move first to last

						_containerShiftIndex++;
						_setTranslateX((_containerShiftIndex + 2) * _slideSize.x, tempHolder.el.style);
						self.setContent(tempHolder, _currentItemIndex - diffAbs + i + 1 + 1);
					} else {
						tempHolder = _itemHolders.pop();
						_itemHolders.unshift(tempHolder); // move last to first

						_containerShiftIndex--;
						_setTranslateX(_containerShiftIndex * _slideSize.x, tempHolder.el.style);
						self.setContent(tempHolder, _currentItemIndex + diffAbs - i - 1 - 1);
					}
				}

				// reset zoom/pan on previous item
				if (_currZoomElementStyle && Math.abs(_indexDiff) === 1) {

					var prevItem = _getItemAt(_prevItemIndex);
					if (prevItem.initialZoomLevel !== _currZoomLevel) {
						_calculateItemSize(prevItem, _viewportSize);
						_setImageSize(prevItem);
						_applyZoomPanToItem(prevItem);
					}
				}

				// reset diff after update
				_indexDiff = 0;

				self.updateCurrZoomItem();

				_prevItemIndex = _currentItemIndex;

				_shout('afterChange');
			},

			updateSize: function updateSize(force) {

				if (!_isFixedPosition && _options.modal) {
					var windowScrollY = framework.getScrollY();
					if (_currentWindowScrollY !== windowScrollY) {
						template.style.top = windowScrollY + 'px';
						_currentWindowScrollY = windowScrollY;
					}
					if (!force && _windowVisibleSize.x === window.innerWidth && _windowVisibleSize.y === window.innerHeight) {
						return;
					}
					_windowVisibleSize.x = window.innerWidth;
					_windowVisibleSize.y = window.innerHeight;

					//template.style.width = _windowVisibleSize.x + 'px';
					template.style.height = _windowVisibleSize.y + 'px';
				}

				_viewportSize.x = self.scrollWrap.clientWidth;
				_viewportSize.y = self.scrollWrap.clientHeight;

				_updatePageScrollOffset();

				_slideSize.x = _viewportSize.x + Math.round(_viewportSize.x * _options.spacing);
				_slideSize.y = _viewportSize.y;

				_moveMainScroll(_slideSize.x * _currPositionIndex);

				_shout('beforeResize'); // even may be used for example to switch image sources


				// don't re-calculate size on inital size update
				if (_containerShiftIndex !== undefined) {

					var holder, item, hIndex;

					for (var i = 0; i < NUM_HOLDERS; i++) {
						holder = _itemHolders[i];
						_setTranslateX((i + _containerShiftIndex) * _slideSize.x, holder.el.style);

						hIndex = _currentItemIndex + i - 1;

						if (_options.loop && _getNumItems() > 2) {
							hIndex = _getLoopedId(hIndex);
						}

						// update zoom level on items and refresh source (if needsUpdate)
						item = _getItemAt(hIndex);

						// re-render gallery item if `needsUpdate`,
						// or doesn't have `bounds` (entirely new slide object)
						if (item && (_itemsNeedUpdate || item.needsUpdate || !item.bounds)) {

							self.cleanSlide(item);

							self.setContent(holder, hIndex);

							// if "center" slide
							if (i === 1) {
								self.currItem = item;
								self.updateCurrZoomItem(true);
							}

							item.needsUpdate = false;
						} else if (holder.index === -1 && hIndex >= 0) {
							// add content first time
							self.setContent(holder, hIndex);
						}
						if (item && item.container) {
							_calculateItemSize(item, _viewportSize);
							_setImageSize(item);
							_applyZoomPanToItem(item);
						}
					}
					_itemsNeedUpdate = false;
				}

				_startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;
				_currPanBounds = self.currItem.bounds;

				if (_currPanBounds) {
					_panOffset.x = _currPanBounds.center.x;
					_panOffset.y = _currPanBounds.center.y;
					_applyCurrentZoomPan(true);
				}

				_shout('resize');
			},

			// Zoom current item to
			zoomTo: function zoomTo(destZoomLevel, centerPoint, speed, easingFn, updateFn) {
				/*
    	if(destZoomLevel === 'fit') {
    		destZoomLevel = self.currItem.fitRatio;
    	} else if(destZoomLevel === 'fill') {
    		destZoomLevel = self.currItem.fillRatio;
    	}
    */

				if (centerPoint) {
					_startZoomLevel = _currZoomLevel;
					_midZoomPoint.x = Math.abs(centerPoint.x) - _panOffset.x;
					_midZoomPoint.y = Math.abs(centerPoint.y) - _panOffset.y;
					_equalizePoints(_startPanOffset, _panOffset);
				}

				var destPanBounds = _calculatePanBounds(destZoomLevel, false),
				    destPanOffset = {};

				_modifyDestPanOffset('x', destPanBounds, destPanOffset, destZoomLevel);
				_modifyDestPanOffset('y', destPanBounds, destPanOffset, destZoomLevel);

				var initialZoomLevel = _currZoomLevel;
				var initialPanOffset = {
					x: _panOffset.x,
					y: _panOffset.y
				};

				_roundPoint(destPanOffset);

				var onUpdate = function onUpdate(now) {
					if (now === 1) {
						_currZoomLevel = destZoomLevel;
						_panOffset.x = destPanOffset.x;
						_panOffset.y = destPanOffset.y;
					} else {
						_currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
						_panOffset.x = (destPanOffset.x - initialPanOffset.x) * now + initialPanOffset.x;
						_panOffset.y = (destPanOffset.y - initialPanOffset.y) * now + initialPanOffset.y;
					}

					if (updateFn) {
						updateFn(now);
					}

					_applyCurrentZoomPan(now === 1);
				};

				if (speed) {
					_animateProp('customZoomTo', 0, 1, speed, easingFn || framework.easing.sine.inOut, onUpdate);
				} else {
					onUpdate(1);
				}
			}

		};

		/*>>core*/

		/*>>gestures*/
		/**
   * Mouse/touch/pointer event handlers.
   * 
   * separated from @core.js for readability
   */

		var MIN_SWIPE_DISTANCE = 30,
		    DIRECTION_CHECK_OFFSET = 10; // amount of pixels to drag to determine direction of swipe

		var _gestureStartTime,
		    _gestureCheckSpeedTime,


		// pool of objects that are used during dragging of zooming
		p = {},
		    // first point
		p2 = {},
		    // second point (for zoom gesture)
		delta = {},
		    _currPoint = {},
		    _startPoint = {},
		    _currPointers = [],
		    _startMainScrollPos = {},
		    _releaseAnimData,
		    _posPoints = [],
		    // array of points during dragging, used to determine type of gesture
		_tempPoint = {},
		    _isZoomingIn,
		    _verticalDragInitiated,
		    _oldAndroidTouchEndTimeout,
		    _currZoomedItemIndex = 0,
		    _centerPoint = _getEmptyPoint(),
		    _lastReleaseTime = 0,
		    _isDragging,
		    // at least one pointer is down
		_isMultitouch,
		    // at least two _pointers are down
		_zoomStarted,
		    // zoom level changed during zoom gesture
		_moved,
		    _dragAnimFrame,
		    _mainScrollShifted,
		    _currentPoints,
		    // array of current touch points
		_isZooming,
		    _currPointsDistance,
		    _startPointsDistance,
		    _currPanBounds,
		    _mainScrollPos = _getEmptyPoint(),
		    _currZoomElementStyle,
		    _mainScrollAnimating,
		    // true, if animation after swipe gesture is running
		_midZoomPoint = _getEmptyPoint(),
		    _currCenterPoint = _getEmptyPoint(),
		    _direction,
		    _isFirstMove,
		    _opacityChanged,
		    _bgOpacity,
		    _wasOverInitialZoom,
		    _isEqualPoints = function _isEqualPoints(p1, p2) {
			return p1.x === p2.x && p1.y === p2.y;
		},
		    _isNearbyPoints = function _isNearbyPoints(touch0, touch1) {
			return Math.abs(touch0.x - touch1.x) < DOUBLE_TAP_RADIUS && Math.abs(touch0.y - touch1.y) < DOUBLE_TAP_RADIUS;
		},
		    _calculatePointsDistance = function _calculatePointsDistance(p1, p2) {
			_tempPoint.x = Math.abs(p1.x - p2.x);
			_tempPoint.y = Math.abs(p1.y - p2.y);
			return Math.sqrt(_tempPoint.x * _tempPoint.x + _tempPoint.y * _tempPoint.y);
		},
		    _stopDragUpdateLoop = function _stopDragUpdateLoop() {
			if (_dragAnimFrame) {
				_cancelAF(_dragAnimFrame);
				_dragAnimFrame = null;
			}
		},
		    _dragUpdateLoop = function _dragUpdateLoop() {
			if (_isDragging) {
				_dragAnimFrame = _requestAF(_dragUpdateLoop);
				_renderMovement();
			}
		},
		    _canPan = function _canPan() {
			return !(_options.scaleMode === 'fit' && _currZoomLevel === self.currItem.initialZoomLevel);
		},


		// find the closest parent DOM element
		_closestElement = function _closestElement(el, fn) {
			if (!el || el === document) {
				return false;
			}

			// don't search elements above pswp__scroll-wrap
			if (el.getAttribute('class') && el.getAttribute('class').indexOf('pswp__scroll-wrap') > -1) {
				return false;
			}

			if (fn(el)) {
				return el;
			}

			return _closestElement(el.parentNode, fn);
		},
		    _preventObj = {},
		    _preventDefaultEventBehaviour = function _preventDefaultEventBehaviour(e, isDown) {
			_preventObj.prevent = !_closestElement(e.target, _options.isClickableElement);

			_shout('preventDragEvent', e, isDown, _preventObj);
			return _preventObj.prevent;
		},
		    _convertTouchToPoint = function _convertTouchToPoint(touch, p) {
			p.x = touch.pageX;
			p.y = touch.pageY;
			p.id = touch.identifier;
			return p;
		},
		    _findCenterOfPoints = function _findCenterOfPoints(p1, p2, pCenter) {
			pCenter.x = (p1.x + p2.x) * 0.5;
			pCenter.y = (p1.y + p2.y) * 0.5;
		},
		    _pushPosPoint = function _pushPosPoint(time, x, y) {
			if (time - _gestureCheckSpeedTime > 50) {
				var o = _posPoints.length > 2 ? _posPoints.shift() : {};
				o.x = x;
				o.y = y;
				_posPoints.push(o);
				_gestureCheckSpeedTime = time;
			}
		},
		    _calculateVerticalDragOpacityRatio = function _calculateVerticalDragOpacityRatio() {
			var yOffset = _panOffset.y - self.currItem.initialPosition.y; // difference between initial and current position
			return 1 - Math.abs(yOffset / (_viewportSize.y / 2));
		},


		// points pool, reused during touch events
		_ePoint1 = {},
		    _ePoint2 = {},
		    _tempPointsArr = [],
		    _tempCounter,
		    _getTouchPoints = function _getTouchPoints(e) {
			// clean up previous points, without recreating array
			while (_tempPointsArr.length > 0) {
				_tempPointsArr.pop();
			}

			if (!_pointerEventEnabled) {
				if (e.type.indexOf('touch') > -1) {

					if (e.touches && e.touches.length > 0) {
						_tempPointsArr[0] = _convertTouchToPoint(e.touches[0], _ePoint1);
						if (e.touches.length > 1) {
							_tempPointsArr[1] = _convertTouchToPoint(e.touches[1], _ePoint2);
						}
					}
				} else {
					_ePoint1.x = e.pageX;
					_ePoint1.y = e.pageY;
					_ePoint1.id = '';
					_tempPointsArr[0] = _ePoint1; //_ePoint1;
				}
			} else {
				_tempCounter = 0;
				// we can use forEach, as pointer events are supported only in modern browsers
				_currPointers.forEach(function (p) {
					if (_tempCounter === 0) {
						_tempPointsArr[0] = p;
					} else if (_tempCounter === 1) {
						_tempPointsArr[1] = p;
					}
					_tempCounter++;
				});
			}
			return _tempPointsArr;
		},
		    _panOrMoveMainScroll = function _panOrMoveMainScroll(axis, delta) {

			var panFriction,
			    overDiff = 0,
			    newOffset = _panOffset[axis] + delta[axis],
			    startOverDiff,
			    dir = delta[axis] > 0,
			    newMainScrollPosition = _mainScrollPos.x + delta.x,
			    mainScrollDiff = _mainScrollPos.x - _startMainScrollPos.x,
			    newPanPos,
			    newMainScrollPos;

			// calculate fdistance over the bounds and friction
			if (newOffset > _currPanBounds.min[axis] || newOffset < _currPanBounds.max[axis]) {
				panFriction = _options.panEndFriction;
				// Linear increasing of friction, so at 1/4 of viewport it's at max value. 
				// Looks not as nice as was expected. Left for history.
				// panFriction = (1 - (_panOffset[axis] + delta[axis] + panBounds.min[axis]) / (_viewportSize[axis] / 4) );
			} else {
				panFriction = 1;
			}

			newOffset = _panOffset[axis] + delta[axis] * panFriction;

			// move main scroll or start panning
			if (_options.allowPanToNext || _currZoomLevel === self.currItem.initialZoomLevel) {

				if (!_currZoomElementStyle) {

					newMainScrollPos = newMainScrollPosition;
				} else if (_direction === 'h' && axis === 'x' && !_zoomStarted) {

					if (dir) {
						if (newOffset > _currPanBounds.min[axis]) {
							panFriction = _options.panEndFriction;
							overDiff = _currPanBounds.min[axis] - newOffset;
							startOverDiff = _currPanBounds.min[axis] - _startPanOffset[axis];
						}

						// drag right
						if ((startOverDiff <= 0 || mainScrollDiff < 0) && _getNumItems() > 1) {
							newMainScrollPos = newMainScrollPosition;
							if (mainScrollDiff < 0 && newMainScrollPosition > _startMainScrollPos.x) {
								newMainScrollPos = _startMainScrollPos.x;
							}
						} else {
							if (_currPanBounds.min.x !== _currPanBounds.max.x) {
								newPanPos = newOffset;
							}
						}
					} else {

						if (newOffset < _currPanBounds.max[axis]) {
							panFriction = _options.panEndFriction;
							overDiff = newOffset - _currPanBounds.max[axis];
							startOverDiff = _startPanOffset[axis] - _currPanBounds.max[axis];
						}

						if ((startOverDiff <= 0 || mainScrollDiff > 0) && _getNumItems() > 1) {
							newMainScrollPos = newMainScrollPosition;

							if (mainScrollDiff > 0 && newMainScrollPosition < _startMainScrollPos.x) {
								newMainScrollPos = _startMainScrollPos.x;
							}
						} else {
							if (_currPanBounds.min.x !== _currPanBounds.max.x) {
								newPanPos = newOffset;
							}
						}
					}

					//
				}

				if (axis === 'x') {

					if (newMainScrollPos !== undefined) {
						_moveMainScroll(newMainScrollPos, true);
						if (newMainScrollPos === _startMainScrollPos.x) {
							_mainScrollShifted = false;
						} else {
							_mainScrollShifted = true;
						}
					}

					if (_currPanBounds.min.x !== _currPanBounds.max.x) {
						if (newPanPos !== undefined) {
							_panOffset.x = newPanPos;
						} else if (!_mainScrollShifted) {
							_panOffset.x += delta.x * panFriction;
						}
					}

					return newMainScrollPos !== undefined;
				}
			}

			if (!_mainScrollAnimating) {

				if (!_mainScrollShifted) {
					if (_currZoomLevel > self.currItem.fitRatio) {
						_panOffset[axis] += delta[axis] * panFriction;
					}
				}
			}
		},


		// Pointerdown/touchstart/mousedown handler
		_onDragStart = function _onDragStart(e) {

			// Allow dragging only via left mouse button.
			// As this handler is not added in IE8 - we ignore e.which
			// 
			// http://www.quirksmode.org/js/events_properties.html
			// https://developer.mozilla.org/en-US/docs/Web/API/event.button
			if (e.type === 'mousedown' && e.button > 0) {
				return;
			}

			if (_initialZoomRunning) {
				e.preventDefault();
				return;
			}

			if (_oldAndroidTouchEndTimeout && e.type === 'mousedown') {
				return;
			}

			if (_preventDefaultEventBehaviour(e, true)) {
				e.preventDefault();
			}

			_shout('pointerDown');

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
				if (pointerIndex < 0) {
					pointerIndex = _currPointers.length;
				}
				_currPointers[pointerIndex] = { x: e.pageX, y: e.pageY, id: e.pointerId };
			}

			var startPointsList = _getTouchPoints(e),
			    numPoints = startPointsList.length;

			_currentPoints = null;

			_stopAllAnimations();

			// init drag
			if (!_isDragging || numPoints === 1) {

				_isDragging = _isFirstMove = true;
				framework.bind(window, _upMoveEvents, self);

				_isZoomingIn = _wasOverInitialZoom = _opacityChanged = _verticalDragInitiated = _mainScrollShifted = _moved = _isMultitouch = _zoomStarted = false;

				_direction = null;

				_shout('firstTouchStart', startPointsList);

				_equalizePoints(_startPanOffset, _panOffset);

				_currPanDist.x = _currPanDist.y = 0;
				_equalizePoints(_currPoint, startPointsList[0]);
				_equalizePoints(_startPoint, _currPoint);

				//_equalizePoints(_startMainScrollPos, _mainScrollPos);
				_startMainScrollPos.x = _slideSize.x * _currPositionIndex;

				_posPoints = [{
					x: _currPoint.x,
					y: _currPoint.y
				}];

				_gestureCheckSpeedTime = _gestureStartTime = _getCurrentTime();

				//_mainScrollAnimationEnd(true);
				_calculatePanBounds(_currZoomLevel, true);

				// Start rendering
				_stopDragUpdateLoop();
				_dragUpdateLoop();
			}

			// init zoom
			if (!_isZooming && numPoints > 1 && !_mainScrollAnimating && !_mainScrollShifted) {
				_startZoomLevel = _currZoomLevel;
				_zoomStarted = false; // true if zoom changed at least once

				_isZooming = _isMultitouch = true;
				_currPanDist.y = _currPanDist.x = 0;

				_equalizePoints(_startPanOffset, _panOffset);

				_equalizePoints(p, startPointsList[0]);
				_equalizePoints(p2, startPointsList[1]);

				_findCenterOfPoints(p, p2, _currCenterPoint);

				_midZoomPoint.x = Math.abs(_currCenterPoint.x) - _panOffset.x;
				_midZoomPoint.y = Math.abs(_currCenterPoint.y) - _panOffset.y;
				_currPointsDistance = _startPointsDistance = _calculatePointsDistance(p, p2);
			}
		},


		// Pointermove/touchmove/mousemove handler
		_onDragMove = function _onDragMove(e) {

			e.preventDefault();

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
				if (pointerIndex > -1) {
					var p = _currPointers[pointerIndex];
					p.x = e.pageX;
					p.y = e.pageY;
				}
			}

			if (_isDragging) {
				var touchesList = _getTouchPoints(e);
				if (!_direction && !_moved && !_isZooming) {

					if (_mainScrollPos.x !== _slideSize.x * _currPositionIndex) {
						// if main scroll position is shifted – direction is always horizontal
						_direction = 'h';
					} else {
						var diff = Math.abs(touchesList[0].x - _currPoint.x) - Math.abs(touchesList[0].y - _currPoint.y);
						// check the direction of movement
						if (Math.abs(diff) >= DIRECTION_CHECK_OFFSET) {
							_direction = diff > 0 ? 'h' : 'v';
							_currentPoints = touchesList;
						}
					}
				} else {
					_currentPoints = touchesList;
				}
			}
		},

		// 
		_renderMovement = function _renderMovement() {

			if (!_currentPoints) {
				return;
			}

			var numPoints = _currentPoints.length;

			if (numPoints === 0) {
				return;
			}

			_equalizePoints(p, _currentPoints[0]);

			delta.x = p.x - _currPoint.x;
			delta.y = p.y - _currPoint.y;

			if (_isZooming && numPoints > 1) {
				// Handle behaviour for more than 1 point

				_currPoint.x = p.x;
				_currPoint.y = p.y;

				// check if one of two points changed
				if (!delta.x && !delta.y && _isEqualPoints(_currentPoints[1], p2)) {
					return;
				}

				_equalizePoints(p2, _currentPoints[1]);

				if (!_zoomStarted) {
					_zoomStarted = true;
					_shout('zoomGestureStarted');
				}

				// Distance between two points
				var pointsDistance = _calculatePointsDistance(p, p2);

				var zoomLevel = _calculateZoomLevel(pointsDistance);

				// slightly over the of initial zoom level
				if (zoomLevel > self.currItem.initialZoomLevel + self.currItem.initialZoomLevel / 15) {
					_wasOverInitialZoom = true;
				}

				// Apply the friction if zoom level is out of the bounds
				var zoomFriction = 1,
				    minZoomLevel = _getMinZoomLevel(),
				    maxZoomLevel = _getMaxZoomLevel();

				if (zoomLevel < minZoomLevel) {

					if (_options.pinchToClose && !_wasOverInitialZoom && _startZoomLevel <= self.currItem.initialZoomLevel) {
						// fade out background if zooming out
						var minusDiff = minZoomLevel - zoomLevel;
						var percent = 1 - minusDiff / (minZoomLevel / 1.2);

						_applyBgOpacity(percent);
						_shout('onPinchClose', percent);
						_opacityChanged = true;
					} else {
						zoomFriction = (minZoomLevel - zoomLevel) / minZoomLevel;
						if (zoomFriction > 1) {
							zoomFriction = 1;
						}
						zoomLevel = minZoomLevel - zoomFriction * (minZoomLevel / 3);
					}
				} else if (zoomLevel > maxZoomLevel) {
					// 1.5 - extra zoom level above the max. E.g. if max is x6, real max 6 + 1.5 = 7.5
					zoomFriction = (zoomLevel - maxZoomLevel) / (minZoomLevel * 6);
					if (zoomFriction > 1) {
						zoomFriction = 1;
					}
					zoomLevel = maxZoomLevel + zoomFriction * minZoomLevel;
				}

				if (zoomFriction < 0) {
					zoomFriction = 0;
				}

				// distance between touch points after friction is applied
				_currPointsDistance = pointsDistance;

				// _centerPoint - The point in the middle of two pointers
				_findCenterOfPoints(p, p2, _centerPoint);

				// paning with two pointers pressed
				_currPanDist.x += _centerPoint.x - _currCenterPoint.x;
				_currPanDist.y += _centerPoint.y - _currCenterPoint.y;
				_equalizePoints(_currCenterPoint, _centerPoint);

				_panOffset.x = _calculatePanOffset('x', zoomLevel);
				_panOffset.y = _calculatePanOffset('y', zoomLevel);

				_isZoomingIn = zoomLevel > _currZoomLevel;
				_currZoomLevel = zoomLevel;
				_applyCurrentZoomPan();
			} else {

				// handle behaviour for one point (dragging or panning)

				if (!_direction) {
					return;
				}

				if (_isFirstMove) {
					_isFirstMove = false;

					// subtract drag distance that was used during the detection direction  

					if (Math.abs(delta.x) >= DIRECTION_CHECK_OFFSET) {
						delta.x -= _currentPoints[0].x - _startPoint.x;
					}

					if (Math.abs(delta.y) >= DIRECTION_CHECK_OFFSET) {
						delta.y -= _currentPoints[0].y - _startPoint.y;
					}
				}

				_currPoint.x = p.x;
				_currPoint.y = p.y;

				// do nothing if pointers position hasn't changed
				if (delta.x === 0 && delta.y === 0) {
					return;
				}

				if (_direction === 'v' && _options.closeOnVerticalDrag) {
					if (!_canPan()) {
						_currPanDist.y += delta.y;
						_panOffset.y += delta.y;

						var opacityRatio = _calculateVerticalDragOpacityRatio();

						_verticalDragInitiated = true;
						_shout('onVerticalDrag', opacityRatio);

						_applyBgOpacity(opacityRatio);
						_applyCurrentZoomPan();
						return;
					}
				}

				_pushPosPoint(_getCurrentTime(), p.x, p.y);

				_moved = true;
				_currPanBounds = self.currItem.bounds;

				var mainScrollChanged = _panOrMoveMainScroll('x', delta);
				if (!mainScrollChanged) {
					_panOrMoveMainScroll('y', delta);

					_roundPoint(_panOffset);
					_applyCurrentZoomPan();
				}
			}
		},


		// Pointerup/pointercancel/touchend/touchcancel/mouseup event handler
		_onDragRelease = function _onDragRelease(e) {

			if (_features.isOldAndroid) {

				if (_oldAndroidTouchEndTimeout && e.type === 'mouseup') {
					return;
				}

				// on Android (v4.1, 4.2, 4.3 & possibly older) 
				// ghost mousedown/up event isn't preventable via e.preventDefault,
				// which causes fake mousedown event
				// so we block mousedown/up for 600ms
				if (e.type.indexOf('touch') > -1) {
					clearTimeout(_oldAndroidTouchEndTimeout);
					_oldAndroidTouchEndTimeout = setTimeout(function () {
						_oldAndroidTouchEndTimeout = 0;
					}, 600);
				}
			}

			_shout('pointerUp');

			if (_preventDefaultEventBehaviour(e, false)) {
				e.preventDefault();
			}

			var releasePoint;

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');

				if (pointerIndex > -1) {
					releasePoint = _currPointers.splice(pointerIndex, 1)[0];

					if (navigator.pointerEnabled) {
						releasePoint.type = e.pointerType || 'mouse';
					} else {
						var MSPOINTER_TYPES = {
							4: 'mouse', // event.MSPOINTER_TYPE_MOUSE
							2: 'touch', // event.MSPOINTER_TYPE_TOUCH 
							3: 'pen' // event.MSPOINTER_TYPE_PEN
						};
						releasePoint.type = MSPOINTER_TYPES[e.pointerType];

						if (!releasePoint.type) {
							releasePoint.type = e.pointerType || 'mouse';
						}
					}
				}
			}

			var touchList = _getTouchPoints(e),
			    gestureType,
			    numPoints = touchList.length;

			if (e.type === 'mouseup') {
				numPoints = 0;
			}

			// Do nothing if there were 3 touch points or more
			if (numPoints === 2) {
				_currentPoints = null;
				return true;
			}

			// if second pointer released
			if (numPoints === 1) {
				_equalizePoints(_startPoint, touchList[0]);
			}

			// pointer hasn't moved, send "tap release" point
			if (numPoints === 0 && !_direction && !_mainScrollAnimating) {
				if (!releasePoint) {
					if (e.type === 'mouseup') {
						releasePoint = { x: e.pageX, y: e.pageY, type: 'mouse' };
					} else if (e.changedTouches && e.changedTouches[0]) {
						releasePoint = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY, type: 'touch' };
					}
				}

				_shout('touchRelease', e, releasePoint);
			}

			// Difference in time between releasing of two last touch points (zoom gesture)
			var releaseTimeDiff = -1;

			// Gesture completed, no pointers left
			if (numPoints === 0) {
				_isDragging = false;
				framework.unbind(window, _upMoveEvents, self);

				_stopDragUpdateLoop();

				if (_isZooming) {
					// Two points released at the same time
					releaseTimeDiff = 0;
				} else if (_lastReleaseTime !== -1) {
					releaseTimeDiff = _getCurrentTime() - _lastReleaseTime;
				}
			}
			_lastReleaseTime = numPoints === 1 ? _getCurrentTime() : -1;

			if (releaseTimeDiff !== -1 && releaseTimeDiff < 150) {
				gestureType = 'zoom';
			} else {
				gestureType = 'swipe';
			}

			if (_isZooming && numPoints < 2) {
				_isZooming = false;

				// Only second point released
				if (numPoints === 1) {
					gestureType = 'zoomPointerUp';
				}
				_shout('zoomGestureEnded');
			}

			_currentPoints = null;
			if (!_moved && !_zoomStarted && !_mainScrollAnimating && !_verticalDragInitiated) {
				// nothing to animate
				return;
			}

			_stopAllAnimations();

			if (!_releaseAnimData) {
				_releaseAnimData = _initDragReleaseAnimationData();
			}

			_releaseAnimData.calculateSwipeSpeed('x');

			if (_verticalDragInitiated) {

				var opacityRatio = _calculateVerticalDragOpacityRatio();

				if (opacityRatio < _options.verticalDragRange) {
					self.close();
				} else {
					var initalPanY = _panOffset.y,
					    initialBgOpacity = _bgOpacity;

					_animateProp('verticalDrag', 0, 1, 300, framework.easing.cubic.out, function (now) {

						_panOffset.y = (self.currItem.initialPosition.y - initalPanY) * now + initalPanY;

						_applyBgOpacity((1 - initialBgOpacity) * now + initialBgOpacity);
						_applyCurrentZoomPan();
					});

					_shout('onVerticalDrag', 1);
				}

				return;
			}

			// main scroll 
			if ((_mainScrollShifted || _mainScrollAnimating) && numPoints === 0) {
				var itemChanged = _finishSwipeMainScrollGesture(gestureType, _releaseAnimData);
				if (itemChanged) {
					return;
				}
				gestureType = 'zoomPointerUp';
			}

			// prevent zoom/pan animation when main scroll animation runs
			if (_mainScrollAnimating) {
				return;
			}

			// Complete simple zoom gesture (reset zoom level if it's out of the bounds)  
			if (gestureType !== 'swipe') {
				_completeZoomGesture();
				return;
			}

			// Complete pan gesture if main scroll is not shifted, and it's possible to pan current image
			if (!_mainScrollShifted && _currZoomLevel > self.currItem.fitRatio) {
				_completePanGesture(_releaseAnimData);
			}
		},


		// Returns object with data about gesture
		// It's created only once and then reused
		_initDragReleaseAnimationData = function _initDragReleaseAnimationData() {
			// temp local vars
			var lastFlickDuration, tempReleasePos;

			// s = this
			var s = {
				lastFlickOffset: {},
				lastFlickDist: {},
				lastFlickSpeed: {},
				slowDownRatio: {},
				slowDownRatioReverse: {},
				speedDecelerationRatio: {},
				speedDecelerationRatioAbs: {},
				distanceOffset: {},
				backAnimDestination: {},
				backAnimStarted: {},
				calculateSwipeSpeed: function calculateSwipeSpeed(axis) {

					if (_posPoints.length > 1) {
						lastFlickDuration = _getCurrentTime() - _gestureCheckSpeedTime + 50;
						tempReleasePos = _posPoints[_posPoints.length - 2][axis];
					} else {
						lastFlickDuration = _getCurrentTime() - _gestureStartTime; // total gesture duration
						tempReleasePos = _startPoint[axis];
					}
					s.lastFlickOffset[axis] = _currPoint[axis] - tempReleasePos;
					s.lastFlickDist[axis] = Math.abs(s.lastFlickOffset[axis]);
					if (s.lastFlickDist[axis] > 20) {
						s.lastFlickSpeed[axis] = s.lastFlickOffset[axis] / lastFlickDuration;
					} else {
						s.lastFlickSpeed[axis] = 0;
					}
					if (Math.abs(s.lastFlickSpeed[axis]) < 0.1) {
						s.lastFlickSpeed[axis] = 0;
					}

					s.slowDownRatio[axis] = 0.95;
					s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
					s.speedDecelerationRatio[axis] = 1;
				},

				calculateOverBoundsAnimOffset: function calculateOverBoundsAnimOffset(axis, speed) {
					if (!s.backAnimStarted[axis]) {

						if (_panOffset[axis] > _currPanBounds.min[axis]) {
							s.backAnimDestination[axis] = _currPanBounds.min[axis];
						} else if (_panOffset[axis] < _currPanBounds.max[axis]) {
							s.backAnimDestination[axis] = _currPanBounds.max[axis];
						}

						if (s.backAnimDestination[axis] !== undefined) {
							s.slowDownRatio[axis] = 0.7;
							s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
							if (s.speedDecelerationRatioAbs[axis] < 0.05) {

								s.lastFlickSpeed[axis] = 0;
								s.backAnimStarted[axis] = true;

								_animateProp('bounceZoomPan' + axis, _panOffset[axis], s.backAnimDestination[axis], speed || 300, framework.easing.sine.out, function (pos) {
									_panOffset[axis] = pos;
									_applyCurrentZoomPan();
								});
							}
						}
					}
				},

				// Reduces the speed by slowDownRatio (per 10ms)
				calculateAnimOffset: function calculateAnimOffset(axis) {
					if (!s.backAnimStarted[axis]) {
						s.speedDecelerationRatio[axis] = s.speedDecelerationRatio[axis] * (s.slowDownRatio[axis] + s.slowDownRatioReverse[axis] - s.slowDownRatioReverse[axis] * s.timeDiff / 10);

						s.speedDecelerationRatioAbs[axis] = Math.abs(s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis]);
						s.distanceOffset[axis] = s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis] * s.timeDiff;
						_panOffset[axis] += s.distanceOffset[axis];
					}
				},

				panAnimLoop: function panAnimLoop() {
					if (_animations.zoomPan) {
						_animations.zoomPan.raf = _requestAF(s.panAnimLoop);

						s.now = _getCurrentTime();
						s.timeDiff = s.now - s.lastNow;
						s.lastNow = s.now;

						s.calculateAnimOffset('x');
						s.calculateAnimOffset('y');

						_applyCurrentZoomPan();

						s.calculateOverBoundsAnimOffset('x');
						s.calculateOverBoundsAnimOffset('y');

						if (s.speedDecelerationRatioAbs.x < 0.05 && s.speedDecelerationRatioAbs.y < 0.05) {

							// round pan position
							_panOffset.x = Math.round(_panOffset.x);
							_panOffset.y = Math.round(_panOffset.y);
							_applyCurrentZoomPan();

							_stopAnimation('zoomPan');
							return;
						}
					}
				}
			};
			return s;
		},
		    _completePanGesture = function _completePanGesture(animData) {
			// calculate swipe speed for Y axis (paanning)
			animData.calculateSwipeSpeed('y');

			_currPanBounds = self.currItem.bounds;

			animData.backAnimDestination = {};
			animData.backAnimStarted = {};

			// Avoid acceleration animation if speed is too low
			if (Math.abs(animData.lastFlickSpeed.x) <= 0.05 && Math.abs(animData.lastFlickSpeed.y) <= 0.05) {
				animData.speedDecelerationRatioAbs.x = animData.speedDecelerationRatioAbs.y = 0;

				// Run pan drag release animation. E.g. if you drag image and release finger without momentum.
				animData.calculateOverBoundsAnimOffset('x');
				animData.calculateOverBoundsAnimOffset('y');
				return true;
			}

			// Animation loop that controls the acceleration after pan gesture ends
			_registerStartAnimation('zoomPan');
			animData.lastNow = _getCurrentTime();
			animData.panAnimLoop();
		},
		    _finishSwipeMainScrollGesture = function _finishSwipeMainScrollGesture(gestureType, _releaseAnimData) {
			var itemChanged;
			if (!_mainScrollAnimating) {
				_currZoomedItemIndex = _currentItemIndex;
			}

			var itemsDiff;

			if (gestureType === 'swipe') {
				var totalShiftDist = _currPoint.x - _startPoint.x,
				    isFastLastFlick = _releaseAnimData.lastFlickDist.x < 10;

				// if container is shifted for more than MIN_SWIPE_DISTANCE, 
				// and last flick gesture was in right direction
				if (totalShiftDist > MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x > 20)) {
					// go to prev item
					itemsDiff = -1;
				} else if (totalShiftDist < -MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x < -20)) {
					// go to next item
					itemsDiff = 1;
				}
			}

			var nextCircle;

			if (itemsDiff) {

				_currentItemIndex += itemsDiff;

				if (_currentItemIndex < 0) {
					_currentItemIndex = _options.loop ? _getNumItems() - 1 : 0;
					nextCircle = true;
				} else if (_currentItemIndex >= _getNumItems()) {
					_currentItemIndex = _options.loop ? 0 : _getNumItems() - 1;
					nextCircle = true;
				}

				if (!nextCircle || _options.loop) {
					_indexDiff += itemsDiff;
					_currPositionIndex -= itemsDiff;
					itemChanged = true;
				}
			}

			var animateToX = _slideSize.x * _currPositionIndex;
			var animateToDist = Math.abs(animateToX - _mainScrollPos.x);
			var finishAnimDuration;

			if (!itemChanged && animateToX > _mainScrollPos.x !== _releaseAnimData.lastFlickSpeed.x > 0) {
				// "return to current" duration, e.g. when dragging from slide 0 to -1
				finishAnimDuration = 333;
			} else {
				finishAnimDuration = Math.abs(_releaseAnimData.lastFlickSpeed.x) > 0 ? animateToDist / Math.abs(_releaseAnimData.lastFlickSpeed.x) : 333;

				finishAnimDuration = Math.min(finishAnimDuration, 400);
				finishAnimDuration = Math.max(finishAnimDuration, 250);
			}

			if (_currZoomedItemIndex === _currentItemIndex) {
				itemChanged = false;
			}

			_mainScrollAnimating = true;

			_shout('mainScrollAnimStart');

			_animateProp('mainScroll', _mainScrollPos.x, animateToX, finishAnimDuration, framework.easing.cubic.out, _moveMainScroll, function () {
				_stopAllAnimations();
				_mainScrollAnimating = false;
				_currZoomedItemIndex = -1;

				if (itemChanged || _currZoomedItemIndex !== _currentItemIndex) {
					self.updateCurrItem();
				}

				_shout('mainScrollAnimComplete');
			});

			if (itemChanged) {
				self.updateCurrItem(true);
			}

			return itemChanged;
		},
		    _calculateZoomLevel = function _calculateZoomLevel(touchesDistance) {
			return 1 / _startPointsDistance * touchesDistance * _startZoomLevel;
		},


		// Resets zoom if it's out of bounds
		_completeZoomGesture = function _completeZoomGesture() {
			var destZoomLevel = _currZoomLevel,
			    minZoomLevel = _getMinZoomLevel(),
			    maxZoomLevel = _getMaxZoomLevel();

			if (_currZoomLevel < minZoomLevel) {
				destZoomLevel = minZoomLevel;
			} else if (_currZoomLevel > maxZoomLevel) {
				destZoomLevel = maxZoomLevel;
			}

			var destOpacity = 1,
			    onUpdate,
			    initialOpacity = _bgOpacity;

			if (_opacityChanged && !_isZoomingIn && !_wasOverInitialZoom && _currZoomLevel < minZoomLevel) {
				//_closedByScroll = true;
				self.close();
				return true;
			}

			if (_opacityChanged) {
				onUpdate = function onUpdate(now) {
					_applyBgOpacity((destOpacity - initialOpacity) * now + initialOpacity);
				};
			}

			self.zoomTo(destZoomLevel, 0, 200, framework.easing.cubic.out, onUpdate);
			return true;
		};

		_registerModule('Gestures', {
			publicMethods: {

				initGestures: function initGestures() {

					// helper function that builds touch/pointer/mouse events
					var addEventNames = function addEventNames(pref, down, move, up, cancel) {
						_dragStartEvent = pref + down;
						_dragMoveEvent = pref + move;
						_dragEndEvent = pref + up;
						if (cancel) {
							_dragCancelEvent = pref + cancel;
						} else {
							_dragCancelEvent = '';
						}
					};

					_pointerEventEnabled = _features.pointerEvent;
					if (_pointerEventEnabled && _features.touch) {
						// we don't need touch events, if browser supports pointer events
						_features.touch = false;
					}

					if (_pointerEventEnabled) {
						if (navigator.pointerEnabled) {
							addEventNames('pointer', 'down', 'move', 'up', 'cancel');
						} else {
							// IE10 pointer events are case-sensitive
							addEventNames('MSPointer', 'Down', 'Move', 'Up', 'Cancel');
						}
					} else if (_features.touch) {
						addEventNames('touch', 'start', 'move', 'end', 'cancel');
						_likelyTouchDevice = true;
					} else {
						addEventNames('mouse', 'down', 'move', 'up');
					}

					_upMoveEvents = _dragMoveEvent + ' ' + _dragEndEvent + ' ' + _dragCancelEvent;
					_downEvents = _dragStartEvent;

					if (_pointerEventEnabled && !_likelyTouchDevice) {
						_likelyTouchDevice = navigator.maxTouchPoints > 1 || navigator.msMaxTouchPoints > 1;
					}
					// make variable public
					self.likelyTouchDevice = _likelyTouchDevice;

					_globalEventHandlers[_dragStartEvent] = _onDragStart;
					_globalEventHandlers[_dragMoveEvent] = _onDragMove;
					_globalEventHandlers[_dragEndEvent] = _onDragRelease; // the Kraken

					if (_dragCancelEvent) {
						_globalEventHandlers[_dragCancelEvent] = _globalEventHandlers[_dragEndEvent];
					}

					// Bind mouse events on device with detected hardware touch support, in case it supports multiple types of input.
					if (_features.touch) {
						_downEvents += ' mousedown';
						_upMoveEvents += ' mousemove mouseup';
						_globalEventHandlers.mousedown = _globalEventHandlers[_dragStartEvent];
						_globalEventHandlers.mousemove = _globalEventHandlers[_dragMoveEvent];
						_globalEventHandlers.mouseup = _globalEventHandlers[_dragEndEvent];
					}

					if (!_likelyTouchDevice) {
						// don't allow pan to next slide from zoomed state on Desktop
						_options.allowPanToNext = false;
					}
				}

			}
		});

		/*>>gestures*/

		/*>>show-hide-transition*/
		/**
   * show-hide-transition.js:
   *
   * Manages initial opening or closing transition.
   *
   * If you're not planning to use transition for gallery at all,
   * you may set options hideAnimationDuration and showAnimationDuration to 0,
   * and just delete startAnimation function.
   * 
   */

		var _showOrHideTimeout,
		    _showOrHide = function _showOrHide(item, img, out, completeFn) {

			if (_showOrHideTimeout) {
				clearTimeout(_showOrHideTimeout);
			}

			_initialZoomRunning = true;
			_initialContentSet = true;

			// dimensions of small thumbnail {x:,y:,w:}.
			// Height is optional, as calculated based on large image.
			var thumbBounds;
			if (item.initialLayout) {
				thumbBounds = item.initialLayout;
				item.initialLayout = null;
			} else {
				thumbBounds = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
			}

			var duration = out ? _options.hideAnimationDuration : _options.showAnimationDuration;

			var onComplete = function onComplete() {
				_stopAnimation('initialZoom');
				if (!out) {
					_applyBgOpacity(1);
					if (img) {
						img.style.display = 'block';
					}
					framework.addClass(template, 'pswp--animated-in');
					_shout('initialZoom' + (out ? 'OutEnd' : 'InEnd'));
				} else {
					self.template.removeAttribute('style');
					self.bg.removeAttribute('style');
				}

				if (completeFn) {
					completeFn();
				}
				_initialZoomRunning = false;
			};

			// if bounds aren't provided, just open gallery without animation
			if (!duration || !thumbBounds || thumbBounds.x === undefined) {

				_shout('initialZoom' + (out ? 'Out' : 'In'));

				_currZoomLevel = item.initialZoomLevel;
				_equalizePoints(_panOffset, item.initialPosition);
				_applyCurrentZoomPan();

				template.style.opacity = out ? 0 : 1;
				_applyBgOpacity(1);

				if (duration) {
					setTimeout(function () {
						onComplete();
					}, duration);
				} else {
					onComplete();
				}

				return;
			}

			var startAnimation = function startAnimation() {
				var closeWithRaf = _closedByScroll,
				    fadeEverything = !self.currItem.src || self.currItem.loadError || _options.showHideOpacity;

				// apply hw-acceleration to image
				if (item.miniImg) {
					item.miniImg.style.webkitBackfaceVisibility = 'hidden';
				}

				if (!out) {
					_currZoomLevel = thumbBounds.w / item.w;
					_panOffset.x = thumbBounds.x;
					_panOffset.y = thumbBounds.y - _initalWindowScrollY;

					self[fadeEverything ? 'template' : 'bg'].style.opacity = 0.001;
					_applyCurrentZoomPan();
				}

				_registerStartAnimation('initialZoom');

				if (out && !closeWithRaf) {
					framework.removeClass(template, 'pswp--animated-in');
				}

				if (fadeEverything) {
					if (out) {
						framework[(closeWithRaf ? 'remove' : 'add') + 'Class'](template, 'pswp--animate_opacity');
					} else {
						setTimeout(function () {
							framework.addClass(template, 'pswp--animate_opacity');
						}, 30);
					}
				}

				_showOrHideTimeout = setTimeout(function () {

					_shout('initialZoom' + (out ? 'Out' : 'In'));

					if (!out) {

						// "in" animation always uses CSS transitions (instead of rAF).
						// CSS transition work faster here, 
						// as developer may also want to animate other things, 
						// like ui on top of sliding area, which can be animated just via CSS

						_currZoomLevel = item.initialZoomLevel;
						_equalizePoints(_panOffset, item.initialPosition);
						_applyCurrentZoomPan();
						_applyBgOpacity(1);

						if (fadeEverything) {
							template.style.opacity = 1;
						} else {
							_applyBgOpacity(1);
						}

						_showOrHideTimeout = setTimeout(onComplete, duration + 20);
					} else {

						// "out" animation uses rAF only when PhotoSwipe is closed by browser scroll, to recalculate position
						var destZoomLevel = thumbBounds.w / item.w,
						    initialPanOffset = {
							x: _panOffset.x,
							y: _panOffset.y
						},
						    initialZoomLevel = _currZoomLevel,
						    initalBgOpacity = _bgOpacity,
						    onUpdate = function onUpdate(now) {

							if (now === 1) {
								_currZoomLevel = destZoomLevel;
								_panOffset.x = thumbBounds.x;
								_panOffset.y = thumbBounds.y - _currentWindowScrollY;
							} else {
								_currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
								_panOffset.x = (thumbBounds.x - initialPanOffset.x) * now + initialPanOffset.x;
								_panOffset.y = (thumbBounds.y - _currentWindowScrollY - initialPanOffset.y) * now + initialPanOffset.y;
							}

							_applyCurrentZoomPan();
							if (fadeEverything) {
								template.style.opacity = 1 - now;
							} else {
								_applyBgOpacity(initalBgOpacity - now * initalBgOpacity);
							}
						};

						if (closeWithRaf) {
							_animateProp('initialZoom', 0, 1, duration, framework.easing.cubic.out, onUpdate, onComplete);
						} else {
							onUpdate(1);
							_showOrHideTimeout = setTimeout(onComplete, duration + 20);
						}
					}
				}, out ? 25 : 90); // Main purpose of this delay is to give browser time to paint and
				// create composite layers of PhotoSwipe UI parts (background, controls, caption, arrows).
				// Which avoids lag at the beginning of scale transition.
			};
			startAnimation();
		};

		/*>>show-hide-transition*/

		/*>>items-controller*/
		/**
  *
  * Controller manages gallery items, their dimensions, and their content.
  * 
  */

		var _items,
		    _tempPanAreaSize = {},
		    _imagesToAppendPool = [],
		    _initialContentSet,
		    _initialZoomRunning,
		    _controllerDefaultOptions = {
			index: 0,
			errorMsg: '<div class="pswp__error-msg"><a href="%url%" target="_blank">The image</a> could not be loaded.</div>',
			forceProgressiveLoading: false, // TODO
			preload: [1, 1],
			getNumItemsFn: function getNumItemsFn() {
				return _items.length;
			}
		};

		var _getItemAt,
		    _getNumItems,
		    _initialIsLoop,
		    _getZeroBounds = function _getZeroBounds() {
			return {
				center: { x: 0, y: 0 },
				max: { x: 0, y: 0 },
				min: { x: 0, y: 0 }
			};
		},
		    _calculateSingleItemPanBounds = function _calculateSingleItemPanBounds(item, realPanElementW, realPanElementH) {
			var bounds = item.bounds;

			// position of element when it's centered
			bounds.center.x = Math.round((_tempPanAreaSize.x - realPanElementW) / 2);
			bounds.center.y = Math.round((_tempPanAreaSize.y - realPanElementH) / 2) + item.vGap.top;

			// maximum pan position
			bounds.max.x = realPanElementW > _tempPanAreaSize.x ? Math.round(_tempPanAreaSize.x - realPanElementW) : bounds.center.x;

			bounds.max.y = realPanElementH > _tempPanAreaSize.y ? Math.round(_tempPanAreaSize.y - realPanElementH) + item.vGap.top : bounds.center.y;

			// minimum pan position
			bounds.min.x = realPanElementW > _tempPanAreaSize.x ? 0 : bounds.center.x;
			bounds.min.y = realPanElementH > _tempPanAreaSize.y ? item.vGap.top : bounds.center.y;
		},
		    _calculateItemSize = function _calculateItemSize(item, viewportSize, zoomLevel) {

			if (item.src && !item.loadError) {
				var isInitial = !zoomLevel;

				if (isInitial) {
					if (!item.vGap) {
						item.vGap = { top: 0, bottom: 0 };
					}
					// allows overriding vertical margin for individual items
					_shout('parseVerticalMargin', item);
				}

				_tempPanAreaSize.x = viewportSize.x;
				_tempPanAreaSize.y = viewportSize.y - item.vGap.top - item.vGap.bottom;

				if (isInitial) {
					var hRatio = _tempPanAreaSize.x / item.w;
					var vRatio = _tempPanAreaSize.y / item.h;

					item.fitRatio = hRatio < vRatio ? hRatio : vRatio;
					//item.fillRatio = hRatio > vRatio ? hRatio : vRatio;

					var scaleMode = _options.scaleMode;

					if (scaleMode === 'orig') {
						zoomLevel = 1;
					} else if (scaleMode === 'fit') {
						zoomLevel = item.fitRatio;
					}

					if (zoomLevel > 1) {
						zoomLevel = 1;
					}

					item.initialZoomLevel = zoomLevel;

					if (!item.bounds) {
						// reuse bounds object
						item.bounds = _getZeroBounds();
					}
				}

				if (!zoomLevel) {
					return;
				}

				_calculateSingleItemPanBounds(item, item.w * zoomLevel, item.h * zoomLevel);

				if (isInitial && zoomLevel === item.initialZoomLevel) {
					item.initialPosition = item.bounds.center;
				}

				return item.bounds;
			} else {
				item.w = item.h = 0;
				item.initialZoomLevel = item.fitRatio = 1;
				item.bounds = _getZeroBounds();
				item.initialPosition = item.bounds.center;

				// if it's not image, we return zero bounds (content is not zoomable)
				return item.bounds;
			}
		},
		    _appendImage = function _appendImage(index, item, baseDiv, img, preventAnimation, keepPlaceholder) {

			if (item.loadError) {
				return;
			}

			if (img) {

				item.imageAppended = true;
				_setImageSize(item, img, item === self.currItem && _renderMaxResolution);

				baseDiv.appendChild(img);

				if (keepPlaceholder) {
					setTimeout(function () {
						if (item && item.loaded && item.placeholder) {
							item.placeholder.style.display = 'none';
							item.placeholder = null;
						}
					}, 500);
				}
			}
		},
		    _preloadImage = function _preloadImage(item) {
			item.loading = true;
			item.loaded = false;
			var img = item.img = framework.createEl('pswp__img', 'img');
			var onComplete = function onComplete() {
				item.loading = false;
				item.loaded = true;

				if (item.loadComplete) {
					item.loadComplete(item);
				} else {
					item.img = null; // no need to store image object
				}
				img.onload = img.onerror = null;
				img = null;
			};
			img.onload = onComplete;
			img.onerror = function () {
				item.loadError = true;
				onComplete();
			};

			img.src = item.src; // + '?a=' + Math.random();

			return img;
		},
		    _checkForError = function _checkForError(item, cleanUp) {
			if (item.src && item.loadError && item.container) {

				if (cleanUp) {
					item.container.innerHTML = '';
				}

				item.container.innerHTML = _options.errorMsg.replace('%url%', item.src);
				return true;
			}
		},
		    _setImageSize = function _setImageSize(item, img, maxRes) {
			if (!item.src) {
				return;
			}

			if (!img) {
				img = item.container.lastChild;
			}

			var w = maxRes ? item.w : Math.round(item.w * item.fitRatio),
			    h = maxRes ? item.h : Math.round(item.h * item.fitRatio);

			if (item.placeholder && !item.loaded) {
				item.placeholder.style.width = w + 'px';
				item.placeholder.style.height = h + 'px';
			}

			img.style.width = w + 'px';
			img.style.height = h + 'px';
		},
		    _appendImagesPool = function _appendImagesPool() {

			if (_imagesToAppendPool.length) {
				var poolItem;

				for (var i = 0; i < _imagesToAppendPool.length; i++) {
					poolItem = _imagesToAppendPool[i];
					if (poolItem.holder.index === poolItem.index) {
						_appendImage(poolItem.index, poolItem.item, poolItem.baseDiv, poolItem.img, false, poolItem.clearPlaceholder);
					}
				}
				_imagesToAppendPool = [];
			}
		};

		_registerModule('Controller', {

			publicMethods: {

				lazyLoadItem: function lazyLoadItem(index) {
					index = _getLoopedId(index);
					var item = _getItemAt(index);

					if (!item || (item.loaded || item.loading) && !_itemsNeedUpdate) {
						return;
					}

					_shout('gettingData', index, item);

					if (!item.src) {
						return;
					}

					_preloadImage(item);
				},
				initController: function initController() {
					framework.extend(_options, _controllerDefaultOptions, true);
					self.items = _items = items;
					_getItemAt = self.getItemAt;
					_getNumItems = _options.getNumItemsFn; //self.getNumItems;


					_initialIsLoop = _options.loop;
					if (_getNumItems() < 3) {
						_options.loop = false; // disable loop if less then 3 items
					}

					_listen('beforeChange', function (diff) {

						var p = _options.preload,
						    isNext = diff === null ? true : diff >= 0,
						    preloadBefore = Math.min(p[0], _getNumItems()),
						    preloadAfter = Math.min(p[1], _getNumItems()),
						    i;

						for (i = 1; i <= (isNext ? preloadAfter : preloadBefore); i++) {
							self.lazyLoadItem(_currentItemIndex + i);
						}
						for (i = 1; i <= (isNext ? preloadBefore : preloadAfter); i++) {
							self.lazyLoadItem(_currentItemIndex - i);
						}
					});

					_listen('initialLayout', function () {
						self.currItem.initialLayout = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
					});

					_listen('mainScrollAnimComplete', _appendImagesPool);
					_listen('initialZoomInEnd', _appendImagesPool);

					_listen('destroy', function () {
						var item;
						for (var i = 0; i < _items.length; i++) {
							item = _items[i];
							// remove reference to DOM elements, for GC
							if (item.container) {
								item.container = null;
							}
							if (item.placeholder) {
								item.placeholder = null;
							}
							if (item.img) {
								item.img = null;
							}
							if (item.preloader) {
								item.preloader = null;
							}
							if (item.loadError) {
								item.loaded = item.loadError = false;
							}
						}
						_imagesToAppendPool = null;
					});
				},

				getItemAt: function getItemAt(index) {
					if (index >= 0) {
						return _items[index] !== undefined ? _items[index] : false;
					}
					return false;
				},

				allowProgressiveImg: function allowProgressiveImg() {
					// 1. Progressive image loading isn't working on webkit/blink 
					//    when hw-acceleration (e.g. translateZ) is applied to IMG element.
					//    That's why in PhotoSwipe parent element gets zoom transform, not image itself.
					//    
					// 2. Progressive image loading sometimes blinks in webkit/blink when applying animation to parent element.
					//    That's why it's disabled on touch devices (mainly because of swipe transition)
					//    
					// 3. Progressive image loading sometimes doesn't work in IE (up to 11).

					// Don't allow progressive loading on non-large touch devices
					return _options.forceProgressiveLoading || !_likelyTouchDevice || _options.mouseUsed || screen.width > 1200;
					// 1200 - to eliminate touch devices with large screen (like Chromebook Pixel)
				},

				setContent: function setContent(holder, index) {

					if (_options.loop) {
						index = _getLoopedId(index);
					}

					var prevItem = self.getItemAt(holder.index);
					if (prevItem) {
						prevItem.container = null;
					}

					var item = self.getItemAt(index),
					    img;

					if (!item) {
						holder.el.innerHTML = '';
						return;
					}

					// allow to override data
					_shout('gettingData', index, item);

					holder.index = index;
					holder.item = item;

					// base container DIV is created only once for each of 3 holders
					var baseDiv = item.container = framework.createEl('pswp__zoom-wrap');

					if (!item.src && item.html) {
						if (item.html.tagName) {
							baseDiv.appendChild(item.html);
						} else {
							baseDiv.innerHTML = item.html;
						}
					}

					_checkForError(item);

					_calculateItemSize(item, _viewportSize);

					if (item.src && !item.loadError && !item.loaded) {

						item.loadComplete = function (item) {

							// gallery closed before image finished loading
							if (!_isOpen) {
								return;
							}

							// check if holder hasn't changed while image was loading
							if (holder && holder.index === index) {
								if (_checkForError(item, true)) {
									item.loadComplete = item.img = null;
									_calculateItemSize(item, _viewportSize);
									_applyZoomPanToItem(item);

									if (holder.index === _currentItemIndex) {
										// recalculate dimensions
										self.updateCurrZoomItem();
									}
									return;
								}
								if (!item.imageAppended) {
									if (_features.transform && (_mainScrollAnimating || _initialZoomRunning)) {
										_imagesToAppendPool.push({
											item: item,
											baseDiv: baseDiv,
											img: item.img,
											index: index,
											holder: holder,
											clearPlaceholder: true
										});
									} else {
										_appendImage(index, item, baseDiv, item.img, _mainScrollAnimating || _initialZoomRunning, true);
									}
								} else {
									// remove preloader & mini-img
									if (!_initialZoomRunning && item.placeholder) {
										item.placeholder.style.display = 'none';
										item.placeholder = null;
									}
								}
							}

							item.loadComplete = null;
							item.img = null; // no need to store image element after it's added

							_shout('imageLoadComplete', index, item);
						};

						if (framework.features.transform) {

							var placeholderClassName = 'pswp__img pswp__img--placeholder';
							placeholderClassName += item.msrc ? '' : ' pswp__img--placeholder--blank';

							var placeholder = framework.createEl(placeholderClassName, item.msrc ? 'img' : '');
							if (item.msrc) {
								placeholder.src = item.msrc;
							}

							_setImageSize(item, placeholder);

							baseDiv.appendChild(placeholder);
							item.placeholder = placeholder;
						}

						if (!item.loading) {
							_preloadImage(item);
						}

						if (self.allowProgressiveImg()) {
							// just append image
							if (!_initialContentSet && _features.transform) {
								_imagesToAppendPool.push({
									item: item,
									baseDiv: baseDiv,
									img: item.img,
									index: index,
									holder: holder
								});
							} else {
								_appendImage(index, item, baseDiv, item.img, true, true);
							}
						}
					} else if (item.src && !item.loadError) {
						// image object is created every time, due to bugs of image loading & delay when switching images
						img = framework.createEl('pswp__img', 'img');
						img.style.opacity = 1;
						img.src = item.src;
						_setImageSize(item, img);
						_appendImage(index, item, baseDiv, img, true);
					}

					if (!_initialContentSet && index === _currentItemIndex) {
						_currZoomElementStyle = baseDiv.style;
						_showOrHide(item, img || item.img);
					} else {
						_applyZoomPanToItem(item);
					}

					holder.el.innerHTML = '';
					holder.el.appendChild(baseDiv);
				},

				cleanSlide: function cleanSlide(item) {
					if (item.img) {
						item.img.onload = item.img.onerror = null;
					}
					item.loaded = item.loading = item.img = item.imageAppended = false;
				}

			}
		});

		/*>>items-controller*/

		/*>>tap*/
		/**
   * tap.js:
   *
   * Displatches tap and double-tap events.
   * 
   */

		var tapTimer,
		    tapReleasePoint = {},
		    _dispatchTapEvent = function _dispatchTapEvent(origEvent, releasePoint, pointerType) {
			var e = document.createEvent('CustomEvent'),
			    eDetail = {
				origEvent: origEvent,
				target: origEvent.target,
				releasePoint: releasePoint,
				pointerType: pointerType || 'touch'
			};

			e.initCustomEvent('pswpTap', true, true, eDetail);
			origEvent.target.dispatchEvent(e);
		};

		_registerModule('Tap', {
			publicMethods: {
				initTap: function initTap() {
					_listen('firstTouchStart', self.onTapStart);
					_listen('touchRelease', self.onTapRelease);
					_listen('destroy', function () {
						tapReleasePoint = {};
						tapTimer = null;
					});
				},
				onTapStart: function onTapStart(touchList) {
					if (touchList.length > 1) {
						clearTimeout(tapTimer);
						tapTimer = null;
					}
				},
				onTapRelease: function onTapRelease(e, releasePoint) {
					if (!releasePoint) {
						return;
					}

					if (!_moved && !_isMultitouch && !_numAnimations) {
						var p0 = releasePoint;
						if (tapTimer) {
							clearTimeout(tapTimer);
							tapTimer = null;

							// Check if taped on the same place
							if (_isNearbyPoints(p0, tapReleasePoint)) {
								_shout('doubleTap', p0);
								return;
							}
						}

						if (releasePoint.type === 'mouse') {
							_dispatchTapEvent(e, releasePoint, 'mouse');
							return;
						}

						var clickedTagName = e.target.tagName.toUpperCase();
						// avoid double tap delay on buttons and elements that have class pswp__single-tap
						if (clickedTagName === 'BUTTON' || framework.hasClass(e.target, 'pswp__single-tap')) {
							_dispatchTapEvent(e, releasePoint);
							return;
						}

						_equalizePoints(tapReleasePoint, p0);

						tapTimer = setTimeout(function () {
							_dispatchTapEvent(e, releasePoint);
							tapTimer = null;
						}, 300);
					}
				}
			}
		});

		/*>>tap*/

		/*>>desktop-zoom*/
		/**
   *
   * desktop-zoom.js:
   *
   * - Binds mousewheel event for paning zoomed image.
   * - Manages "dragging", "zoomed-in", "zoom-out" classes.
   *   (which are used for cursors and zoom icon)
   * - Adds toggleDesktopZoom function.
   * 
   */

		var _wheelDelta;

		_registerModule('DesktopZoom', {

			publicMethods: {

				initDesktopZoom: function initDesktopZoom() {

					if (_oldIE) {
						// no zoom for old IE (<=8)
						return;
					}

					if (_likelyTouchDevice) {
						// if detected hardware touch support, we wait until mouse is used,
						// and only then apply desktop-zoom features
						_listen('mouseUsed', function () {
							self.setupDesktopZoom();
						});
					} else {
						self.setupDesktopZoom(true);
					}
				},

				setupDesktopZoom: function setupDesktopZoom(onInit) {

					_wheelDelta = {};

					var events = 'wheel mousewheel DOMMouseScroll';

					_listen('bindEvents', function () {
						framework.bind(template, events, self.handleMouseWheel);
					});

					_listen('unbindEvents', function () {
						if (_wheelDelta) {
							framework.unbind(template, events, self.handleMouseWheel);
						}
					});

					self.mouseZoomedIn = false;

					var hasDraggingClass,
					    updateZoomable = function updateZoomable() {
						if (self.mouseZoomedIn) {
							framework.removeClass(template, 'pswp--zoomed-in');
							self.mouseZoomedIn = false;
						}
						if (_currZoomLevel < 1) {
							framework.addClass(template, 'pswp--zoom-allowed');
						} else {
							framework.removeClass(template, 'pswp--zoom-allowed');
						}
						removeDraggingClass();
					},
					    removeDraggingClass = function removeDraggingClass() {
						if (hasDraggingClass) {
							framework.removeClass(template, 'pswp--dragging');
							hasDraggingClass = false;
						}
					};

					_listen('resize', updateZoomable);
					_listen('afterChange', updateZoomable);
					_listen('pointerDown', function () {
						if (self.mouseZoomedIn) {
							hasDraggingClass = true;
							framework.addClass(template, 'pswp--dragging');
						}
					});
					_listen('pointerUp', removeDraggingClass);

					if (!onInit) {
						updateZoomable();
					}
				},

				handleMouseWheel: function handleMouseWheel(e) {

					if (_currZoomLevel <= self.currItem.fitRatio) {
						if (_options.modal) {

							if (!_options.closeOnScroll || _numAnimations || _isDragging) {
								e.preventDefault();
							} else if (_transformKey && Math.abs(e.deltaY) > 2) {
								// close PhotoSwipe
								// if browser supports transforms & scroll changed enough
								_closedByScroll = true;
								self.close();
							}
						}
						return true;
					}

					// allow just one event to fire
					e.stopPropagation();

					// https://developer.mozilla.org/en-US/docs/Web/Events/wheel
					_wheelDelta.x = 0;

					if ('deltaX' in e) {
						if (e.deltaMode === 1 /* DOM_DELTA_LINE */) {
								// 18 - average line height
								_wheelDelta.x = e.deltaX * 18;
								_wheelDelta.y = e.deltaY * 18;
							} else {
							_wheelDelta.x = e.deltaX;
							_wheelDelta.y = e.deltaY;
						}
					} else if ('wheelDelta' in e) {
						if (e.wheelDeltaX) {
							_wheelDelta.x = -0.16 * e.wheelDeltaX;
						}
						if (e.wheelDeltaY) {
							_wheelDelta.y = -0.16 * e.wheelDeltaY;
						} else {
							_wheelDelta.y = -0.16 * e.wheelDelta;
						}
					} else if ('detail' in e) {
						_wheelDelta.y = e.detail;
					} else {
						return;
					}

					_calculatePanBounds(_currZoomLevel, true);

					var newPanX = _panOffset.x - _wheelDelta.x,
					    newPanY = _panOffset.y - _wheelDelta.y;

					// only prevent scrolling in nonmodal mode when not at edges
					if (_options.modal || newPanX <= _currPanBounds.min.x && newPanX >= _currPanBounds.max.x && newPanY <= _currPanBounds.min.y && newPanY >= _currPanBounds.max.y) {
						e.preventDefault();
					}

					// TODO: use rAF instead of mousewheel?
					self.panTo(newPanX, newPanY);
				},

				toggleDesktopZoom: function toggleDesktopZoom(centerPoint) {
					centerPoint = centerPoint || { x: _viewportSize.x / 2 + _offset.x, y: _viewportSize.y / 2 + _offset.y };

					var doubleTapZoomLevel = _options.getDoubleTapZoom(true, self.currItem);
					var zoomOut = _currZoomLevel === doubleTapZoomLevel;

					self.mouseZoomedIn = !zoomOut;

					self.zoomTo(zoomOut ? self.currItem.initialZoomLevel : doubleTapZoomLevel, centerPoint, 333);
					framework[(!zoomOut ? 'add' : 'remove') + 'Class'](template, 'pswp--zoomed-in');
				}

			}
		});

		/*>>desktop-zoom*/

		/*>>history*/
		/**
   *
   * history.js:
   *
   * - Back button to close gallery.
   * 
   * - Unique URL for each slide: example.com/&pid=1&gid=3
   *   (where PID is picture index, and GID and gallery index)
   *   
   * - Switch URL when slides change.
   * 
   */

		var _historyDefaultOptions = {
			history: true,
			galleryUID: 1
		};

		var _historyUpdateTimeout,
		    _hashChangeTimeout,
		    _hashAnimCheckTimeout,
		    _hashChangedByScript,
		    _hashChangedByHistory,
		    _hashReseted,
		    _initialHash,
		    _historyChanged,
		    _closedFromURL,
		    _urlChangedOnce,
		    _windowLoc,
		    _supportsPushState,
		    _getHash = function _getHash() {
			return _windowLoc.hash.substring(1);
		},
		    _cleanHistoryTimeouts = function _cleanHistoryTimeouts() {

			if (_historyUpdateTimeout) {
				clearTimeout(_historyUpdateTimeout);
			}

			if (_hashAnimCheckTimeout) {
				clearTimeout(_hashAnimCheckTimeout);
			}
		},


		// pid - Picture index
		// gid - Gallery index
		_parseItemIndexFromURL = function _parseItemIndexFromURL() {
			var hash = _getHash(),
			    params = {};

			if (hash.length < 5) {
				// pid=1
				return params;
			}

			var i,
			    vars = hash.split('&');
			for (i = 0; i < vars.length; i++) {
				if (!vars[i]) {
					continue;
				}
				var pair = vars[i].split('=');
				if (pair.length < 2) {
					continue;
				}
				params[pair[0]] = pair[1];
			}
			if (_options.galleryPIDs) {
				// detect custom pid in hash and search for it among the items collection
				var searchfor = params.pid;
				params.pid = 0; // if custom pid cannot be found, fallback to the first item
				for (i = 0; i < _items.length; i++) {
					if (_items[i].pid === searchfor) {
						params.pid = i;
						break;
					}
				}
			} else {
				params.pid = parseInt(params.pid, 10) - 1;
			}
			if (params.pid < 0) {
				params.pid = 0;
			}
			return params;
		},
		    _updateHash = function _updateHash() {

			if (_hashAnimCheckTimeout) {
				clearTimeout(_hashAnimCheckTimeout);
			}

			if (_numAnimations || _isDragging) {
				// changing browser URL forces layout/paint in some browsers, which causes noticable lag during animation
				// that's why we update hash only when no animations running
				_hashAnimCheckTimeout = setTimeout(_updateHash, 500);
				return;
			}

			if (_hashChangedByScript) {
				clearTimeout(_hashChangeTimeout);
			} else {
				_hashChangedByScript = true;
			}

			var pid = _currentItemIndex + 1;
			var item = _getItemAt(_currentItemIndex);
			if (item.hasOwnProperty('pid')) {
				// carry forward any custom pid assigned to the item
				pid = item.pid;
			}
			var newHash = _initialHash + '&' + 'gid=' + _options.galleryUID + '&' + 'pid=' + pid;

			if (!_historyChanged) {
				if (_windowLoc.hash.indexOf(newHash) === -1) {
					_urlChangedOnce = true;
				}
				// first time - add new hisory record, then just replace
			}

			var newURL = _windowLoc.href.split('#')[0] + '#' + newHash;

			if (_supportsPushState) {

				if ('#' + newHash !== window.location.hash) {
					history[_historyChanged ? 'replaceState' : 'pushState']('', document.title, newURL);
				}
			} else {
				if (_historyChanged) {
					_windowLoc.replace(newURL);
				} else {
					_windowLoc.hash = newHash;
				}
			}

			_historyChanged = true;
			_hashChangeTimeout = setTimeout(function () {
				_hashChangedByScript = false;
			}, 60);
		};

		_registerModule('History', {

			publicMethods: {
				initHistory: function initHistory() {

					framework.extend(_options, _historyDefaultOptions, true);

					if (!_options.history) {
						return;
					}

					_windowLoc = window.location;
					_urlChangedOnce = false;
					_closedFromURL = false;
					_historyChanged = false;
					_initialHash = _getHash();
					_supportsPushState = 'pushState' in history;

					if (_initialHash.indexOf('gid=') > -1) {
						_initialHash = _initialHash.split('&gid=')[0];
						_initialHash = _initialHash.split('?gid=')[0];
					}

					_listen('afterChange', self.updateURL);
					_listen('unbindEvents', function () {
						framework.unbind(window, 'hashchange', self.onHashChange);
					});

					var returnToOriginal = function returnToOriginal() {
						_hashReseted = true;
						if (!_closedFromURL) {

							if (_urlChangedOnce) {
								history.back();
							} else {

								if (_initialHash) {
									_windowLoc.hash = _initialHash;
								} else {
									if (_supportsPushState) {

										// remove hash from url without refreshing it or scrolling to top
										history.pushState('', document.title, _windowLoc.pathname + _windowLoc.search);
									} else {
										_windowLoc.hash = '';
									}
								}
							}
						}

						_cleanHistoryTimeouts();
					};

					_listen('unbindEvents', function () {
						if (_closedByScroll) {
							// if PhotoSwipe is closed by scroll, we go "back" before the closing animation starts
							// this is done to keep the scroll position
							returnToOriginal();
						}
					});
					_listen('destroy', function () {
						if (!_hashReseted) {
							returnToOriginal();
						}
					});
					_listen('firstUpdate', function () {
						_currentItemIndex = _parseItemIndexFromURL().pid;
					});

					var index = _initialHash.indexOf('pid=');
					if (index > -1) {
						_initialHash = _initialHash.substring(0, index);
						if (_initialHash.slice(-1) === '&') {
							_initialHash = _initialHash.slice(0, -1);
						}
					}

					setTimeout(function () {
						if (_isOpen) {
							// hasn't destroyed yet
							framework.bind(window, 'hashchange', self.onHashChange);
						}
					}, 40);
				},
				onHashChange: function onHashChange() {

					if (_getHash() === _initialHash) {

						_closedFromURL = true;
						self.close();
						return;
					}
					if (!_hashChangedByScript) {

						_hashChangedByHistory = true;
						self.goTo(_parseItemIndexFromURL().pid);
						_hashChangedByHistory = false;
					}
				},
				updateURL: function updateURL() {

					// Delay the update of URL, to avoid lag during transition, 
					// and to not to trigger actions like "refresh page sound" or "blinking favicon" to often

					_cleanHistoryTimeouts();

					if (_hashChangedByHistory) {
						return;
					}

					if (!_historyChanged) {
						_updateHash(); // first time
					} else {
						_historyUpdateTimeout = setTimeout(_updateHash, 800);
					}
				}

			}
		});

		/*>>history*/
		framework.extend(self, publicMethods);
	};
	return PhotoSwipe;
});

},{}],3:[function(require,module,exports){

// ------------------------------------------
// Rellax.js - v1.0.0
// Buttery smooth parallax library
// Copyright (c) 2016 Moe Amaya (@moeamaya)
// MIT license
//
// Thanks to Paraxify.js and Jaime Cabllero
// for parallax concepts
// ------------------------------------------

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Rellax = factory();
  }
}(this, function () {
  var Rellax = function(el, options){
    "use strict";

    var self = Object.create(Rellax.prototype);

    var posY = 0; // set it to -1 so the animate function gets called at least once
    var screenY = 0;
    var blocks = [];
    var pause = false;

    // check what requestAnimationFrame to use, and if
    // it's not supported, use the onscroll event
    var loop = window.requestAnimationFrame ||
    	window.webkitRequestAnimationFrame ||
    	window.mozRequestAnimationFrame ||
    	window.msRequestAnimationFrame ||
    	window.oRequestAnimationFrame ||
    	function(callback){ setTimeout(callback, 1000 / 60); };

    // Default Settings
    self.options = {
      speed: -2,
      center: false
    };

    // User defined options (might have more in the future)
    if (options){
      Object.keys(options).forEach(function(key){
        self.options[key] = options[key];
      });
    }

    // If some clown tries to crank speed, limit them to +-10
    if (self.options.speed < -10) {
      self.options.speed = -10;
    } else if (self.options.speed > 10) {
      self.options.speed = 10;
    }

    // By default, rellax class
    if (!el) {
      el = '.rellax';
    }

    // Classes
    if (document.getElementsByClassName(el.replace('.',''))){
      self.elems = document.getElementsByClassName(el.replace('.',''));
    }

    // Now query selector
    else if (document.querySelector(el) !== false) {
      self.elems = querySelector(el);
    }

    // The elements don't exist
    else {
      throw new Error("The elements you're trying to select don't exist.");
    }


    // Let's kick this script off
    // Build array for cached element values
    // Bind scroll and resize to animate method
    var init = function() {
      screenY = window.innerHeight;
      setPosition();

      // Get and cache initial position of all elements
      for (var i = 0; i < self.elems.length; i++){
        var block = createBlock(self.elems[i]);
        blocks.push(block);
      }

			window.addEventListener('resize', function(){
			  animate();
			});

			// Start the loop
      update();

      // The loop does nothing if the scrollPosition did not change
      // so call animate to make sure every element has their transforms
      animate();
    };


    // We want to cache the parallax blocks'
    // values: base, top, height, speed
    // el: is dom object, return: el cache values
    var createBlock = function(el) {

      // initializing at scrollY = 0 (top of browser)
      // ensures elements are positioned based on HTML layout.
      //
      // If the element has the percentage attribute, the posY needs to be
      // the current scroll position's value, so that the elements are still positioned based on HTML layout
      var posY = el.getAttribute('data-rellax-percentage') || self.options.center ? document.body.scrollTop : 0;

      var blockTop = posY + el.getBoundingClientRect().top;
      var blockHeight = el.clientHeight || el.offsetHeight || el.scrollHeight;

      // apparently parallax equation everyone uses
      var percentage = el.getAttribute('data-rellax-percentage') ? el.getAttribute('data-rellax-percentage') : (posY - blockTop + screenY) / (blockHeight + screenY);
      if(self.options.center){ percentage = 0.5; }

      // Optional individual block speed as data attr, otherwise global speed
      // Check if has percentage attr, and limit speed to 5, else limit it to 10
      var speed = el.getAttribute('data-rellax-speed') ? limitSpeed(el.getAttribute('data-rellax-speed'), 10) : self.options.speed;
      if (el.getAttribute('data-rellax-percentage') || self.options.center) {
        speed = el.getAttribute('data-rellax-speed') ? limitSpeed(el.getAttribute('data-rellax-speed'), 5) : limitSpeed(self.options.speed, 5);
      }

      var base = updatePosition(percentage, speed);

      // ~~Store non-translate3d transforms~~
      // Store inline styles and extract transforms
      var style = el.style.cssText;
      var transform = '';

      // Check if there's an inline styled transform
      if (style.indexOf('transform') >= 0) {
        // Get the index of the transform
        var index = style.indexOf('transform');

        // Trim the style to the transform point and get the following semi-colon index
        var trimmedStyle = style.slice(index);
        var delimiter = trimmedStyle.indexOf(';');

        // Remove "transform" string and save the attribute
        if (delimiter) {
          transform = " " + trimmedStyle.slice(11, delimiter).replace(/\s/g,'');
        } else {
          transform = " " + trimmedStyle.slice(11).replace(/\s/g,'');
        }
      }

      return {
        base: base,
        top: blockTop,
        height: blockHeight,
        speed: speed,
        style: style,
        transform: transform
      };
    };

    // Check if current speed is < or > than max/-max
    // If so, return max
    var limitSpeed = function(current, max) {
      if (current < -max) {
        return -max;
      } else if (current > max) {
        return max;
      } else {
        return current;
      }
    };

    // set scroll position (posY)
    // side effect method is not ideal, but okay for now
    // returns true if the scroll changed, false if nothing happened
    var setPosition = function() {
    	var oldY = posY;

      if (window.pageYOffset !== undefined) {
        posY = window.pageYOffset;
      } else {
        posY = (document.documentElement || document.body.parentNode || document.body).scrollTop;
      }

      if (oldY != posY) {
      	// scroll changed, return true
      	return true;
      }

      // scroll did not change
      return false;
    };


    // Ahh a pure function, gets new transform value
    // based on scrollPostion and speed
    var updatePosition = function(percentage, speed) {
      var value = (speed * (100 * (1 - percentage)));
      return Math.round(value);
    };


    //
		var update = function() {
			if (setPosition() && pause === false) {
				animate();
	    }

	    // loop again
	    loop(update);
		};

    // Transform3d on parallax element
    var animate = function() {
    	for (var i = 0; i < self.elems.length; i++){
        var percentage = ((posY - blocks[i].top + screenY) / (blocks[i].height + screenY));

        // Subtracting initialize value, so element stays in same spot as HTML
        var position = updatePosition(percentage, blocks[i].speed) - blocks[i].base;

        // Move that element
        // (Prepare the new transform and append initial inline transforms. Set the new, and preppend previous inline styles)
        var translate = ' translate3d(0,' + position + 'px' + ',0)' + blocks[i].transform;
        self.elems[i].style.cssText = blocks[i].style+'-webkit-transform:'+translate+';-moz-transform:'+translate+';transform:'+translate+';';
      }
    };


    self.destroy = function() {
      for (var i = 0; i < self.elems.length; i++){
        self.elems[i].style.cssText = blocks[i].style;
      }
      pause = true;
    };


    init();
    return self;
  };
  return Rellax;
}));

},{}],4:[function(require,module,exports){
'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _rellax = require('rellax');

var _rellax2 = _interopRequireDefault(_rellax);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Portfolio = require('./components/portfolio');
var Photoswipe = require('./photoswipe');
var portfolioData = require('./data/portfolio.json');
var sideProjectData = require('./data/side-projects.json');

// Init photoswipe gallery
// Photoswipe.init();

_reactDom2.default.render(_react2.default.createElement(Portfolio, { items: portfolioData }), document.getElementById('portfolio'));

_reactDom2.default.render(_react2.default.createElement(Portfolio, { items: sideProjectData }), document.getElementById('side-projects'));

// Make header ~* parallax *~
new _rellax2.default('.parallax');

},{"./components/portfolio":9,"./data/portfolio.json":10,"./data/side-projects.json":11,"./photoswipe":12,"react":"react","react-dom":"react-dom","rellax":3}],5:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Photoswipe = require('../photoswipe');

var PortfolioAssets = function (_React$Component) {
  _inherits(PortfolioAssets, _React$Component);

  function PortfolioAssets() {
    _classCallCheck(this, PortfolioAssets);

    return _possibleConstructorReturn(this, (PortfolioAssets.__proto__ || Object.getPrototypeOf(PortfolioAssets)).apply(this, arguments));
  }

  _createClass(PortfolioAssets, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: 'col portfolio-item__assets' },
        this.props.items.map(function (item, i) {
          return _react2.default.createElement(PortfolioAsset, { type: item.type,
            src: item.src,
            thumbnail_src: item.thumbnail_src,
            width: item.width,
            height: item.height,
            title: item.title,
            key: i });
        })
      );
    }
  }]);

  return PortfolioAssets;
}(_react2.default.Component);

var PortfolioAsset = function (_React$Component2) {
  _inherits(PortfolioAsset, _React$Component2);

  function PortfolioAsset(props) {
    _classCallCheck(this, PortfolioAsset);

    var _this2 = _possibleConstructorReturn(this, (PortfolioAsset.__proto__ || Object.getPrototypeOf(PortfolioAsset)).call(this, props));

    if (_this2.props.type == 'image') {
      var index = Photoswipe.push({
        src: props.src,
        w: props.width,
        h: props.height,
        msrc: props.thumbnail_src,
        title: props.title
      });

      _this2.state = { index: index };
    }

    _this2.openLightbox = _this2.openLightbox.bind(_this2);
    return _this2;
  }

  _createClass(PortfolioAsset, [{
    key: 'openLightbox',
    value: function openLightbox(e) {
      e.preventDefault();
      var index = this.state.index;


      console.log("opening", index);
      Photoswipe.open(index);
    }
  }, {
    key: 'render',
    value: function render() {
      if (this.props.type == 'youtube') {
        return _react2.default.createElement(
          'div',
          { className: 'portfolio-item__asset' },
          _react2.default.createElement('iframe', { width: '100%', height: '100%', src: this.props.src, frameBorder: '0', allowFullScreen: 'true' })
        );
      } else {
        return _react2.default.createElement('a', { href: '#',
          className: 'portfolio-item__asset',
          onClick: this.openLightbox,
          style: {
            backgroundImage: 'url(' + this.props.thumbnail_src + ')'
          } });
      }
    }
  }]);

  return PortfolioAsset;
}(_react2.default.Component);

PortfolioAssets.propTypes = {
  items: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.object)
};

PortfolioAsset.propTypes = {
  type: _react2.default.PropTypes.string,
  src: _react2.default.PropTypes.string,
  thumbnail_src: _react2.default.PropTypes.string,
  width: _react2.default.PropTypes.number,
  height: _react2.default.PropTypes.number,
  title: _react2.default.PropTypes.string
};

module.exports = PortfolioAssets;

},{"../photoswipe":12,"react":"react"}],6:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PortfolioUrl = require('./portfolio-url');
var PortfolioSkill = require('./portfolio-skill');
var PortfolioAssets = require('./portfolio-assets');

var PortfolioItem = function (_React$Component) {
  _inherits(PortfolioItem, _React$Component);

  function PortfolioItem() {
    _classCallCheck(this, PortfolioItem);

    return _possibleConstructorReturn(this, (PortfolioItem.__proto__ || Object.getPrototypeOf(PortfolioItem)).apply(this, arguments));
  }

  _createClass(PortfolioItem, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: 'portfolio-item' },
        _react2.default.createElement(
          'div',
          { className: 'portfolio-item__description' },
          _react2.default.createElement(
            'div',
            { className: 'portfolio-item__title' },
            this.props.name,
            ' ',
            _react2.default.createElement(
              'span',
              { className: 'portfolio-item__date' },
              this.props.date
            )
          ),
          _react2.default.createElement('p', { className: 'portfolio-item__text', dangerouslySetInnerHTML: PortfolioItem.createTextMarkup(this.props.description) }),
          _react2.default.createElement(
            'ul',
            { className: 'portfolio-item__text portfolio-item__links' },
            this.props.urls.map(function (item, i) {
              return _react2.default.createElement(PortfolioUrl, { url: item.url, text: item.text, key: i });
            })
          ),
          _react2.default.createElement(
            'ul',
            { className: 'portfolio-item__skills' },
            this.props.skills.map(function (item, i) {
              return _react2.default.createElement(PortfolioSkill, { name: item, key: i });
            })
          )
        ),
        _react2.default.createElement(PortfolioAssets, { items: this.props.assets })
      );
    }
  }], [{
    key: 'createTextMarkup',
    value: function createTextMarkup(text) {
      return { __html: text };
    }
  }]);

  return PortfolioItem;
}(_react2.default.Component);

PortfolioItem.propTypes = {
  name: _react2.default.PropTypes.string,
  date: _react2.default.PropTypes.string,
  description: _react2.default.PropTypes.string,
  urls: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.objectOf(_react2.default.PropTypes.string)),
  skills: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.string),
  assets: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.object)
};

module.exports = PortfolioItem;

},{"./portfolio-assets":5,"./portfolio-skill":7,"./portfolio-url":8,"react":"react"}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PortfolioSkill = function (_React$Component) {
  _inherits(PortfolioSkill, _React$Component);

  function PortfolioSkill() {
    _classCallCheck(this, PortfolioSkill);

    return _possibleConstructorReturn(this, (PortfolioSkill.__proto__ || Object.getPrototypeOf(PortfolioSkill)).apply(this, arguments));
  }

  _createClass(PortfolioSkill, [{
    key: "render",
    value: function render() {
      return _react2.default.createElement(
        "li",
        { className: "portfolio-item__skill" },
        this.props.name
      );
    }
  }]);

  return PortfolioSkill;
}(_react2.default.Component);

PortfolioSkill.propTypes = {
  name: _react2.default.PropTypes.string
};

module.exports = PortfolioSkill;

},{"react":"react"}],8:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PortfolioUrl = function (_React$Component) {
  _inherits(PortfolioUrl, _React$Component);

  function PortfolioUrl() {
    _classCallCheck(this, PortfolioUrl);

    return _possibleConstructorReturn(this, (PortfolioUrl.__proto__ || Object.getPrototypeOf(PortfolioUrl)).apply(this, arguments));
  }

  _createClass(PortfolioUrl, [{
    key: "render",
    value: function render() {
      return _react2.default.createElement(
        "li",
        null,
        _react2.default.createElement(
          "a",
          { href: this.props.url, rel: "nofollow", className: "portfolio-item__link" },
          this.props.text
        )
      );
    }
  }]);

  return PortfolioUrl;
}(_react2.default.Component);

PortfolioUrl.propTypes = {
  url: _react2.default.PropTypes.string,
  text: _react2.default.PropTypes.string
};

module.exports = PortfolioUrl;

},{"react":"react"}],9:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PortfolioItem = require('./portfolio-item');

var Portfolio = function (_React$Component) {
  _inherits(Portfolio, _React$Component);

  function Portfolio() {
    _classCallCheck(this, Portfolio);

    return _possibleConstructorReturn(this, (Portfolio.__proto__ || Object.getPrototypeOf(Portfolio)).apply(this, arguments));
  }

  _createClass(Portfolio, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        null,
        this.props.items.map(function (item, i) {
          return _react2.default.createElement(PortfolioItem, { name: item['name'],
            date: item['date'],
            description: item['description'],
            urls: item['urls'],
            skills: item['skills'],
            assets: item['assets'],
            key: i });
        })
      );
    }
  }]);

  return Portfolio;
}(_react2.default.Component);

Portfolio.propTypes = {
  items: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.object)
};

module.exports = Portfolio;

},{"./portfolio-item":6,"react":"react"}],10:[function(require,module,exports){
module.exports=[
  {
    "name": "Syndication Service",
    "date": "(2016)",
    "description": "Created a microservice that syndicates CNET articles to 3rd parties, such as Apple News.",
    "urls": [
    ],
    "skills": [
      "Docker",
      "PHP",
      "Jenkins",
      "Microservice"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/syndication-ipad.small.png",
        "src": "static/images/sites/syndication-ipad.large.png",
        "width": 1024,
        "height": 768,
        "title": "Syndication Service (2016) - Apple News"
      },
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/syndication-amp.small.png",
        "src": "static/images/sites/syndication-amp.large.png",
        "width": 412,
        "height": 732,
        "title": "Syndication Service (2016) - Google AMP"
      }
    ]
  },
  {
    "name": "Guzzlefish",
    "date": "(2015-2016)",
    "description": "Guzzlefish was a quirky news site that I developed and launched at CBS Interactive.",
    "urls": [
      {
        "url": "http://www.guzzlefish.com/",
        "text": "Visit Guzzlefish"
      },
      {
        "url": "http://facebook.com/guzzlefish",
        "text": "Visit Guzzlefish on Facebook"
      }
    ],
    "skills": [
      "PHP",
      "MySQL",
      "HTML5",
      "JavaScript",
      "Sass",
      "Solr",
      "jQuery",
      "Memcached",
      "Varnish",
      "Responsive"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/guzzlefish.desktop.small.png",
        "src": "static/images/sites/guzzlefish.desktop.large.jpg",
        "width": 1280,
        "height": 798,
        "title": "Guzzlefish (2015-2016) - Desktop"
      },
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/guzzlefish.mobile.small.png",
        "src": "static/images/sites/guzzlefish.mobile.large.png",
        "width": 600,
        "height": 798,
        "title": "Guzzlefish (2015-2016) - Mobile Web"
      }
    ]
  },
  {
    "name": "CNET Forums",
    "date": "(2014)",
    "description": "Migrated the CNET Forums onto a new CMS.",
    "urls": [
      {
        "url": "http://www.cnet.com/forums/",
        "text": "Visit CNET Forums"
      }
    ],
    "skills": [
      "PHP",
      "MySQL",
      "Solr",
      "JavaScript"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/cnet-forums.desktop.small.png",
        "src": "static/images/sites/cnet-forums.desktop.png",
        "width": 1024,
        "height": 818,
        "title": "CNET Forums (2014) - Desktop"
      },
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/cnet-forums.mobile.small.png",
        "src": "static/images/sites/cnet-forums.mobile.png",
        "width": 412,
        "height": 732,
        "title": "CNET Forums (2014) - Mobile Web"
      }
    ]
  },
  {
    "name": "CBS Connect",
    "date": "(2012)",
    "description": "Built the RESTful API for CBS Connect, a social webapp that connects prime time TV fans to CBS shows and stars.",
    "urls": [
      {
        "url": "http://www.cbs.com/connect/",
        "text": "Visit CBS Connect"
      }
    ],
    "skills": [
      "Java",
      "Spring",
      "Hibernate",
      "MySQL",
      "Solr",
      "Redis",
      "API"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/cbs.desktop.small.png",
        "src": "static/images/sites/cbs.desktop.large.jpg",
        "width": 1028,
        "height": 675,
        "title": "CBS Connect (2012)"
      }
    ]
  },
  {
    "name": "TV.com Mobile Web",
    "date": "(2012)",
    "description": "Built the frontend for TV.com's first mobile web experience.",
    "urls": [
      {
        "url": "http://www.tv.com/",
        "text": "Visit TV.com"
      }
    ],
    "skills": [
      "Python",
      "Django",
      "jQuery",
      "HTML5",
      "JavaScript",
      "CSS3",
      "Mobile Web"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/tv.desktop.small.jpg",
        "src": "static/images/sites/tv-mobile-large.jpg",
        "width": 640,
        "height": 919,
        "title": "TV.com (2012) - Mobile Web"
      }
    ]
  }
]
},{}],11:[function(require,module,exports){
module.exports=[
  {
    "name": "Omnibot: Analytics Slackbot",
    "date": "(2016)",
    "description": "Created a Slackbot that fetches real-time, on-demand metrics from our analytics backend.<br /><br />Created for a 24-hour hackathon.",
    "urls": [
    ],
    "skills": [
      "Node",
      "AWS Lambda",
      "Slack"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/slackbot.small.png",
        "src": "static/images/sites/slackbot.large.png",
        "width": 671,
        "height": 338,
        "title": "Omnibot (2016): A Slackbot that fetches real-time, on-demand metrics from our analytics backend."
      }
    ]
  },
  {
    "name": "Spread - Google Chrome Extension",
    "date": "(2015)",
    "description": "Built a Google Chrome extension for that replaces the user's Start Page with trending news and full screen images from CBS Interactive sites, such as CBS News and CNET.<br /><br />Created for a 24-hour hackathon.",
    "urls": [
      {
        "url": "https://github.com/justindelacruz/spread",
        "text": "Visit Github"
      }
    ],
    "skills": [
      "React",
      "Sass",
      "Google Chrome Extensions"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/spread.desktop.small.png",
        "src": "static/images/sites/spread.desktop.large.png",
        "width": 1024,
        "height": 640,
        "title": "Spread (2015): A Google Chrome extension for that replaces the user's Start Page with trending news and full screen images."
      },
      {
        "type": "youtube",
        "src": "https://www.youtube.com/embed/smaUnlxGRYA",
        "width": 185,
        "height": 266
      }
    ]
  },
  {
    "name": "Podcaps: Searchable Podcasts",
    "date": "(2015)",
    "description": "Created a searchable transcript database for the 'Welcome to Nightvale' podcast. Text is programatically timed to streaming audio, so you can read along and search across entire podcast episodes.",
    "urls": [
      {
        "url": "http://www.podcaps.io/",
        "text": "Visit Podcaps.io"
      },
      {
        "url": "https://github.com/justindelacruz/podcaps",
        "text": "Visit Github"
      }
    ],
    "skills": [
      "Python",
      "Flask",
      "Angular",
      "MySQL",
      "Elasticsearch",
      "Heroku"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/podcaps.desktop.small.png",
        "src": "static/images/sites/podcaps.desktop.large.png",
        "width": 1372,
        "height": 910,
        "title": "Podcaps (2015): A searchable transcript database for the 'Welcome to Nightvale' podcast. Text is programatically timed to streaming audio, so you can read along and search across entire podcast episodes."
      },
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/podcaps.mobile.small.png",
        "src": "static/images/sites/podcaps.mobile.large.png",
        "width": 255,
        "height": 453,
        "title": "Podcaps (2015): A searchable transcript database for the 'Welcome to Nightvale' podcast. Text is programatically timed to streaming audio, so you can read along and search across entire podcast episodes."
      }
    ]
  },
  {
    "name": "n-degrees",
    "date": "(2014)",
    "description": "Built a tool to calculate distance (degrees of separation) between two news articles based on their embedded links, using Dijkstra's algorithm.<br /><br />Created for a 24-hour hackathon.",
    "urls": [
    ],
    "skills": [
      "Python",
      "MySQL",
      "Solr"
    ],
    "assets": [
      {
        "type": "image",
        "thumbnail_src": "static/images/sites/degrees.web.small.png",
        "src": "static/images/sites/degrees.web.large.png",
        "width": 1024,
        "height": 946,
        "title": "n-degrees (2014): A tool to calculate distance (degrees of separation) between two news articles based on their embedded links, using Dijkstra's algorithm."
      }
    ]
  }
]
},{}],12:[function(require,module,exports){
'use strict';

var PhotoSwipe = require('../../bower_components/photoswipe/dist/photoswipe');
var PhotoSwipeUI_Default = require('../../bower_components/photoswipe/dist/photoswipe-ui-default');

var Gallery = function () {
  // define options (if needed)
  var options = {
    // optionName: 'option value'
    // for example:
    index: 0 // start at first slide
  };

  // build items array
  var items = [];

  var gallery = void 0;

  return {
    init: function init() {
      // Photoswipe lightbox
      var pswpElement = document.querySelectorAll('.pswp')[0];

      console.log(items);

      // Initializes and opens PhotoSwipe
      gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);

      gallery.listen('destroy', function () {
        console.log("destroy");
        gallery = null;
      });
    },

    open: function open(index) {
      if (index) {
        options.index = index;
      }

      if (gallery) {
        gallery.init();
      } else {
        this.init();
        gallery.init();
      }
    },

    /**
     * Add new slide to PhotoSwipe.
     *
     * @param {object} data
     */
    push: function push(data) {
      items.push(data);

      return items.length - 1;
    }
  };
}();

module.exports = Gallery;

},{"../../bower_components/photoswipe/dist/photoswipe":2,"../../bower_components/photoswipe/dist/photoswipe-ui-default":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib3dlcl9jb21wb25lbnRzL3Bob3Rvc3dpcGUvZGlzdC9waG90b3N3aXBlLXVpLWRlZmF1bHQuanMiLCJib3dlcl9jb21wb25lbnRzL3Bob3Rvc3dpcGUvZGlzdC9waG90b3N3aXBlLmpzIiwibm9kZV9tb2R1bGVzL3JlbGxheC9yZWxsYXguanMiLCJzcmMvanMvYXBwLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvcG9ydGZvbGlvLWFzc2V0cy5qcyIsInNyYy9qcy9jb21wb25lbnRzL3BvcnRmb2xpby1pdGVtLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvcG9ydGZvbGlvLXNraWxsLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvcG9ydGZvbGlvLXVybC5qcyIsInNyYy9qcy9jb21wb25lbnRzL3BvcnRmb2xpby5qcyIsInNyYy9qcy9kYXRhL3BvcnRmb2xpby5qc29uIiwic3JjL2pzL2RhdGEvc2lkZS1wcm9qZWN0cy5qc29uIiwic3JjL2pzL3Bob3Rvc3dpcGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUE7OztBQUdBOzs7Ozs7QUFNQSxDQUFDLFVBQVUsSUFBVixFQUFnQixPQUFoQixFQUF5QjtBQUN6QixLQUFJLE9BQU8sTUFBUCxLQUFrQixVQUFsQixJQUFnQyxPQUFPLEdBQTNDLEVBQWdEO0FBQy9DLFNBQU8sT0FBUDtBQUNBLEVBRkQsTUFFTyxJQUFJLFFBQU8sT0FBUCx5Q0FBTyxPQUFQLE9BQW1CLFFBQXZCLEVBQWlDO0FBQ3ZDLFNBQU8sT0FBUCxHQUFpQixTQUFqQjtBQUNBLEVBRk0sTUFFQTtBQUNOLE9BQUssb0JBQUwsR0FBNEIsU0FBNUI7QUFDQTtBQUNELENBUkQsYUFRUyxZQUFZOztBQUVwQjs7QUFJRCxLQUFJLHVCQUNILFNBREcsb0JBQ0gsQ0FBUyxJQUFULEVBQWUsU0FBZixFQUEwQjs7QUFFMUIsTUFBSSxLQUFLLElBQVQ7QUFDQSxNQUFJ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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0SEEsSUFBTSxhQUFhLFFBQVEsbURBQVIsQ0FBbkI7QUFDQSxJQUFNLHVCQUF1QixRQUFRLDhEQUFSLENBQTdCOztBQUVBLElBQUksVUFBVyxZQUFZO0FBQ3pCO0FBQ0EsTUFBSSxVQUFVO0FBQ1o7QUFDQTtBQUNBLFdBQU8sQ0FISyxDQUdIO0FBSEcsR0FBZDs7QUFNQTtBQUNBLE1BQUksUUFBUSxFQUFaOztBQUVBLE1BQUksZ0JBQUo7O0FBRUEsU0FBTztBQUNMLFVBQU0sU0FBUyxJQUFULEdBQWdCO0FBQ3BCO0FBQ0EsVUFBSSxjQUFjLFNBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBbUMsQ0FBbkMsQ0FBbEI7O0FBRUEsY0FBUSxHQUFSLENBQVksS0FBWjs7QUFFQTtBQUNBLGdCQUFVLElBQUksVUFBSixDQUFlLFdBQWYsRUFBNEIsb0JBQTVCLEVBQWtELEtBQWxELEVBQXlELE9BQXpELENBQVY7O0FBRUEsY0FBUSxNQUFSLENBQWUsU0FBZixFQUEwQixZQUFXO0FBQ25DLGdCQUFRLEdBQVIsQ0FBWSxTQUFaO0FBQ0Esa0JBQVUsSUFBVjtBQUNELE9BSEQ7QUFJRCxLQWRJOztBQWdCTCxVQUFNLGNBQVMsS0FBVCxFQUFnQjtBQUNwQixVQUFJLEtBQUosRUFBVztBQUNULGdCQUFRLEtBQVIsR0FBZ0IsS0FBaEI7QUFDRDs7QUFFRCxVQUFJLE9BQUosRUFBYTtBQUNYLGdCQUFRLElBQVI7QUFDRCxPQUZELE1BRU87QUFDTCxhQUFLLElBQUw7QUFDQSxnQkFBUSxJQUFSO0FBQ0Q7QUFDRixLQTNCSTs7QUE2Qkw7Ozs7O0FBS0EsVUFBTSxTQUFTLElBQVQsQ0FBYyxJQUFkLEVBQW9CO0FBQ3hCLFlBQU0sSUFBTixDQUFXLElBQVg7O0FBRUEsYUFBTyxNQUFNLE1BQU4sR0FBZSxDQUF0QjtBQUNEO0FBdENJLEdBQVA7QUF3Q0QsQ0FyRGMsRUFBZjs7QUF1REEsT0FBTyxPQUFQLEdBQWlCLE9BQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qISBQaG90b1N3aXBlIERlZmF1bHQgVUkgLSA0LjEuMSAtIDIwMTUtMTItMjRcbiogaHR0cDovL3Bob3Rvc3dpcGUuY29tXG4qIENvcHlyaWdodCAoYykgMjAxNSBEbWl0cnkgU2VtZW5vdjsgKi9cbi8qKlxuKlxuKiBVSSBvbiB0b3Agb2YgbWFpbiBzbGlkaW5nIGFyZWEgKGNhcHRpb24sIGFycm93cywgY2xvc2UgYnV0dG9uLCBldGMuKS5cbiogQnVpbHQganVzdCB1c2luZyBwdWJsaWMgbWV0aG9kcy9wcm9wZXJ0aWVzIG9mIFBob3RvU3dpcGUuXG4qIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkgeyBcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0fSBlbHNlIHtcblx0XHRyb290LlBob3RvU3dpcGVVSV9EZWZhdWx0ID0gZmFjdG9yeSgpO1xuXHR9XG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cblxudmFyIFBob3RvU3dpcGVVSV9EZWZhdWx0ID1cbiBmdW5jdGlvbihwc3dwLCBmcmFtZXdvcmspIHtcblxuXHR2YXIgdWkgPSB0aGlzO1xuXHR2YXIgX292ZXJsYXlVSVVwZGF0ZWQgPSBmYWxzZSxcblx0XHRfY29udHJvbHNWaXNpYmxlID0gdHJ1ZSxcblx0XHRfZnVsbHNjcmVuQVBJLFxuXHRcdF9jb250cm9scyxcblx0XHRfY2FwdGlvbkNvbnRhaW5lcixcblx0XHRfZmFrZUNhcHRpb25Db250YWluZXIsXG5cdFx0X2luZGV4SW5kaWNhdG9yLFxuXHRcdF9zaGFyZUJ1dHRvbixcblx0XHRfc2hhcmVNb2RhbCxcblx0XHRfc2hhcmVNb2RhbEhpZGRlbiA9IHRydWUsXG5cdFx0X2luaXRhbENsb3NlT25TY3JvbGxWYWx1ZSxcblx0XHRfaXNJZGxlLFxuXHRcdF9saXN0ZW4sXG5cblx0XHRfbG9hZGluZ0luZGljYXRvcixcblx0XHRfbG9hZGluZ0luZGljYXRvckhpZGRlbixcblx0XHRfbG9hZGluZ0luZGljYXRvclRpbWVvdXQsXG5cblx0XHRfZ2FsbGVyeUhhc09uZVNsaWRlLFxuXG5cdFx0X29wdGlvbnMsXG5cdFx0X2RlZmF1bHRVSU9wdGlvbnMgPSB7XG5cdFx0XHRiYXJzU2l6ZToge3RvcDo0NCwgYm90dG9tOidhdXRvJ30sXG5cdFx0XHRjbG9zZUVsQ2xhc3NlczogWydpdGVtJywgJ2NhcHRpb24nLCAnem9vbS13cmFwJywgJ3VpJywgJ3RvcC1iYXInXSwgXG5cdFx0XHR0aW1lVG9JZGxlOiA0MDAwLCBcblx0XHRcdHRpbWVUb0lkbGVPdXRzaWRlOiAxMDAwLFxuXHRcdFx0bG9hZGluZ0luZGljYXRvckRlbGF5OiAxMDAwLCAvLyAyc1xuXHRcdFx0XG5cdFx0XHRhZGRDYXB0aW9uSFRNTEZuOiBmdW5jdGlvbihpdGVtLCBjYXB0aW9uRWwgLyosIGlzRmFrZSAqLykge1xuXHRcdFx0XHRpZighaXRlbS50aXRsZSkge1xuXHRcdFx0XHRcdGNhcHRpb25FbC5jaGlsZHJlblswXS5pbm5lckhUTUwgPSAnJztcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FwdGlvbkVsLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9IGl0ZW0udGl0bGU7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fSxcblxuXHRcdFx0Y2xvc2VFbDp0cnVlLFxuXHRcdFx0Y2FwdGlvbkVsOiB0cnVlLFxuXHRcdFx0ZnVsbHNjcmVlbkVsOiB0cnVlLFxuXHRcdFx0em9vbUVsOiB0cnVlLFxuXHRcdFx0c2hhcmVFbDogdHJ1ZSxcblx0XHRcdGNvdW50ZXJFbDogdHJ1ZSxcblx0XHRcdGFycm93RWw6IHRydWUsXG5cdFx0XHRwcmVsb2FkZXJFbDogdHJ1ZSxcblxuXHRcdFx0dGFwVG9DbG9zZTogZmFsc2UsXG5cdFx0XHR0YXBUb1RvZ2dsZUNvbnRyb2xzOiB0cnVlLFxuXG5cdFx0XHRjbGlja1RvQ2xvc2VOb25ab29tYWJsZTogdHJ1ZSxcblxuXHRcdFx0c2hhcmVCdXR0b25zOiBbXG5cdFx0XHRcdHtpZDonZmFjZWJvb2snLCBsYWJlbDonU2hhcmUgb24gRmFjZWJvb2snLCB1cmw6J2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIvc2hhcmVyLnBocD91PXt7dXJsfX0nfSxcblx0XHRcdFx0e2lkOid0d2l0dGVyJywgbGFiZWw6J1R3ZWV0JywgdXJsOidodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD90ZXh0PXt7dGV4dH19JnVybD17e3VybH19J30sXG5cdFx0XHRcdHtpZDoncGludGVyZXN0JywgbGFiZWw6J1BpbiBpdCcsIHVybDonaHR0cDovL3d3dy5waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYnV0dG9uLycrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCc/dXJsPXt7dXJsfX0mbWVkaWE9e3tpbWFnZV91cmx9fSZkZXNjcmlwdGlvbj17e3RleHR9fSd9LFxuXHRcdFx0XHR7aWQ6J2Rvd25sb2FkJywgbGFiZWw6J0Rvd25sb2FkIGltYWdlJywgdXJsOid7e3Jhd19pbWFnZV91cmx9fScsIGRvd25sb2FkOnRydWV9XG5cdFx0XHRdLFxuXHRcdFx0Z2V0SW1hZ2VVUkxGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcblx0XHRcdFx0cmV0dXJuIHBzd3AuY3Vyckl0ZW0uc3JjIHx8ICcnO1xuXHRcdFx0fSxcblx0XHRcdGdldFBhZ2VVUkxGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcblx0XHRcdFx0cmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXHRcdFx0fSxcblx0XHRcdGdldFRleHRGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcblx0XHRcdFx0cmV0dXJuIHBzd3AuY3Vyckl0ZW0udGl0bGUgfHwgJyc7XG5cdFx0XHR9LFxuXHRcdFx0XHRcblx0XHRcdGluZGV4SW5kaWNhdG9yU2VwOiAnIC8gJyxcblx0XHRcdGZpdENvbnRyb2xzV2lkdGg6IDEyMDBcblxuXHRcdH0sXG5cdFx0X2Jsb2NrQ29udHJvbHNUYXAsXG5cdFx0X2Jsb2NrQ29udHJvbHNUYXBUaW1lb3V0O1xuXG5cblxuXHR2YXIgX29uQ29udHJvbHNUYXAgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRpZihfYmxvY2tDb250cm9sc1RhcCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXG5cdFx0XHRlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG5cblx0XHRcdGlmKF9vcHRpb25zLnRpbWVUb0lkbGUgJiYgX29wdGlvbnMubW91c2VVc2VkICYmICFfaXNJZGxlKSB7XG5cdFx0XHRcdC8vIHJlc2V0IGlkbGUgdGltZXJcblx0XHRcdFx0X29uSWRsZU1vdXNlTW92ZSgpO1xuXHRcdFx0fVxuXG5cblx0XHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQsXG5cdFx0XHRcdHVpRWxlbWVudCxcblx0XHRcdFx0Y2xpY2tlZENsYXNzID0gdGFyZ2V0LmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCAnJyxcblx0XHRcdFx0Zm91bmQ7XG5cblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBfdWlFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR1aUVsZW1lbnQgPSBfdWlFbGVtZW50c1tpXTtcblx0XHRcdFx0aWYodWlFbGVtZW50Lm9uVGFwICYmIGNsaWNrZWRDbGFzcy5pbmRleE9mKCdwc3dwX18nICsgdWlFbGVtZW50Lm5hbWUgKSA+IC0xICkge1xuXHRcdFx0XHRcdHVpRWxlbWVudC5vblRhcCgpO1xuXHRcdFx0XHRcdGZvdW5kID0gdHJ1ZTtcblxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKGZvdW5kKSB7XG5cdFx0XHRcdGlmKGUuc3RvcFByb3BhZ2F0aW9uKSB7XG5cdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRfYmxvY2tDb250cm9sc1RhcCA9IHRydWU7XG5cblx0XHRcdFx0Ly8gU29tZSB2ZXJzaW9ucyBvZiBBbmRyb2lkIGRvbid0IHByZXZlbnQgZ2hvc3QgY2xpY2sgZXZlbnQgXG5cdFx0XHRcdC8vIHdoZW4gcHJldmVudERlZmF1bHQoKSB3YXMgY2FsbGVkIG9uIHRvdWNoc3RhcnQgYW5kL29yIHRvdWNoZW5kLlxuXHRcdFx0XHQvLyBcblx0XHRcdFx0Ly8gVGhpcyBoYXBwZW5zIG9uIHY0LjMsIDQuMiwgNC4xLCBcblx0XHRcdFx0Ly8gb2xkZXIgdmVyc2lvbnMgc3RyYW5nZWx5IHdvcmsgY29ycmVjdGx5LCBcblx0XHRcdFx0Ly8gYnV0IGp1c3QgaW4gY2FzZSB3ZSBhZGQgZGVsYXkgb24gYWxsIG9mIHRoZW0pXHRcblx0XHRcdFx0dmFyIHRhcERlbGF5ID0gZnJhbWV3b3JrLmZlYXR1cmVzLmlzT2xkQW5kcm9pZCA/IDYwMCA6IDMwO1xuXHRcdFx0XHRfYmxvY2tDb250cm9sc1RhcFRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdF9ibG9ja0NvbnRyb2xzVGFwID0gZmFsc2U7XG5cdFx0XHRcdH0sIHRhcERlbGF5KTtcblx0XHRcdH1cblxuXHRcdH0sXG5cdFx0X2ZpdENvbnRyb2xzSW5WaWV3cG9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuICFwc3dwLmxpa2VseVRvdWNoRGV2aWNlIHx8IF9vcHRpb25zLm1vdXNlVXNlZCB8fCBzY3JlZW4ud2lkdGggPiBfb3B0aW9ucy5maXRDb250cm9sc1dpZHRoO1xuXHRcdH0sXG5cdFx0X3RvZ2dsZVBzd3BDbGFzcyA9IGZ1bmN0aW9uKGVsLCBjTmFtZSwgYWRkKSB7XG5cdFx0XHRmcmFtZXdvcmtbIChhZGQgPyAnYWRkJyA6ICdyZW1vdmUnKSArICdDbGFzcycgXShlbCwgJ3Bzd3BfXycgKyBjTmFtZSk7XG5cdFx0fSxcblxuXHRcdC8vIGFkZCBjbGFzcyB3aGVuIHRoZXJlIGlzIGp1c3Qgb25lIGl0ZW0gaW4gdGhlIGdhbGxlcnlcblx0XHQvLyAoYnkgZGVmYXVsdCBpdCBoaWRlcyBsZWZ0L3JpZ2h0IGFycm93cyBhbmQgMW9mWCBjb3VudGVyKVxuXHRcdF9jb3VudE51bUl0ZW1zID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaGFzT25lU2xpZGUgPSAoX29wdGlvbnMuZ2V0TnVtSXRlbXNGbigpID09PSAxKTtcblxuXHRcdFx0aWYoaGFzT25lU2xpZGUgIT09IF9nYWxsZXJ5SGFzT25lU2xpZGUpIHtcblx0XHRcdFx0X3RvZ2dsZVBzd3BDbGFzcyhfY29udHJvbHMsICd1aS0tb25lLXNsaWRlJywgaGFzT25lU2xpZGUpO1xuXHRcdFx0XHRfZ2FsbGVyeUhhc09uZVNsaWRlID0gaGFzT25lU2xpZGU7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRfdG9nZ2xlU2hhcmVNb2RhbENsYXNzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRfdG9nZ2xlUHN3cENsYXNzKF9zaGFyZU1vZGFsLCAnc2hhcmUtbW9kYWwtLWhpZGRlbicsIF9zaGFyZU1vZGFsSGlkZGVuKTtcblx0XHR9LFxuXHRcdF90b2dnbGVTaGFyZU1vZGFsID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdF9zaGFyZU1vZGFsSGlkZGVuID0gIV9zaGFyZU1vZGFsSGlkZGVuO1xuXHRcdFx0XG5cdFx0XHRcblx0XHRcdGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xuXHRcdFx0XHRfdG9nZ2xlU2hhcmVNb2RhbENsYXNzKCk7XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYoIV9zaGFyZU1vZGFsSGlkZGVuKSB7XG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3MoX3NoYXJlTW9kYWwsICdwc3dwX19zaGFyZS1tb2RhbC0tZmFkZS1pbicpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgMzApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKF9zaGFyZU1vZGFsLCAncHN3cF9fc2hhcmUtbW9kYWwtLWZhZGUtaW4nKTtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZihfc2hhcmVNb2RhbEhpZGRlbikge1xuXHRcdFx0XHRcdFx0X3RvZ2dsZVNoYXJlTW9kYWxDbGFzcygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgMzAwKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYoIV9zaGFyZU1vZGFsSGlkZGVuKSB7XG5cdFx0XHRcdF91cGRhdGVTaGFyZVVSTHMoKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9LFxuXG5cdFx0X29wZW5XaW5kb3dQb3B1cCA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcblx0XHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cblx0XHRcdHBzd3Auc2hvdXQoJ3NoYXJlTGlua0NsaWNrJywgZSwgdGFyZ2V0KTtcblxuXHRcdFx0aWYoIXRhcmdldC5ocmVmKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYoIHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2Rvd25sb2FkJykgKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHR3aW5kb3cub3Blbih0YXJnZXQuaHJlZiwgJ3Bzd3Bfc2hhcmUnLCAnc2Nyb2xsYmFycz15ZXMscmVzaXphYmxlPXllcyx0b29sYmFyPW5vLCcrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdsb2NhdGlvbj15ZXMsd2lkdGg9NTUwLGhlaWdodD00MjAsdG9wPTEwMCxsZWZ0PScgKyBcblx0XHRcdFx0XHRcdFx0XHRcdFx0KHdpbmRvdy5zY3JlZW4gPyBNYXRoLnJvdW5kKHNjcmVlbi53aWR0aCAvIDIgLSAyNzUpIDogMTAwKSAgKTtcblxuXHRcdFx0aWYoIV9zaGFyZU1vZGFsSGlkZGVuKSB7XG5cdFx0XHRcdF90b2dnbGVTaGFyZU1vZGFsKCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9LFxuXHRcdF91cGRhdGVTaGFyZVVSTHMgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBzaGFyZUJ1dHRvbk91dCA9ICcnLFxuXHRcdFx0XHRzaGFyZUJ1dHRvbkRhdGEsXG5cdFx0XHRcdHNoYXJlVVJMLFxuXHRcdFx0XHRpbWFnZV91cmwsXG5cdFx0XHRcdHBhZ2VfdXJsLFxuXHRcdFx0XHRzaGFyZV90ZXh0O1xuXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgX29wdGlvbnMuc2hhcmVCdXR0b25zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdHNoYXJlQnV0dG9uRGF0YSA9IF9vcHRpb25zLnNoYXJlQnV0dG9uc1tpXTtcblxuXHRcdFx0XHRpbWFnZV91cmwgPSBfb3B0aW9ucy5nZXRJbWFnZVVSTEZvclNoYXJlKHNoYXJlQnV0dG9uRGF0YSk7XG5cdFx0XHRcdHBhZ2VfdXJsID0gX29wdGlvbnMuZ2V0UGFnZVVSTEZvclNoYXJlKHNoYXJlQnV0dG9uRGF0YSk7XG5cdFx0XHRcdHNoYXJlX3RleHQgPSBfb3B0aW9ucy5nZXRUZXh0Rm9yU2hhcmUoc2hhcmVCdXR0b25EYXRhKTtcblxuXHRcdFx0XHRzaGFyZVVSTCA9IHNoYXJlQnV0dG9uRGF0YS51cmwucmVwbGFjZSgne3t1cmx9fScsIGVuY29kZVVSSUNvbXBvbmVudChwYWdlX3VybCkgKVxuXHRcdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoJ3t7aW1hZ2VfdXJsfX0nLCBlbmNvZGVVUklDb21wb25lbnQoaW1hZ2VfdXJsKSApXG5cdFx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgne3tyYXdfaW1hZ2VfdXJsfX0nLCBpbWFnZV91cmwgKVxuXHRcdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoJ3t7dGV4dH19JywgZW5jb2RlVVJJQ29tcG9uZW50KHNoYXJlX3RleHQpICk7XG5cblx0XHRcdFx0c2hhcmVCdXR0b25PdXQgKz0gJzxhIGhyZWY9XCInICsgc2hhcmVVUkwgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgJytcblx0XHRcdFx0XHRcdFx0XHRcdCdjbGFzcz1cInBzd3BfX3NoYXJlLS0nICsgc2hhcmVCdXR0b25EYXRhLmlkICsgJ1wiJyArXG5cdFx0XHRcdFx0XHRcdFx0XHQoc2hhcmVCdXR0b25EYXRhLmRvd25sb2FkID8gJ2Rvd25sb2FkJyA6ICcnKSArICc+JyArIFxuXHRcdFx0XHRcdFx0XHRcdFx0c2hhcmVCdXR0b25EYXRhLmxhYmVsICsgJzwvYT4nO1xuXG5cdFx0XHRcdGlmKF9vcHRpb25zLnBhcnNlU2hhcmVCdXR0b25PdXQpIHtcblx0XHRcdFx0XHRzaGFyZUJ1dHRvbk91dCA9IF9vcHRpb25zLnBhcnNlU2hhcmVCdXR0b25PdXQoc2hhcmVCdXR0b25EYXRhLCBzaGFyZUJ1dHRvbk91dCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdF9zaGFyZU1vZGFsLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9IHNoYXJlQnV0dG9uT3V0O1xuXHRcdFx0X3NoYXJlTW9kYWwuY2hpbGRyZW5bMF0ub25jbGljayA9IF9vcGVuV2luZG93UG9wdXA7XG5cblx0XHR9LFxuXHRcdF9oYXNDbG9zZUNsYXNzID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0XHRmb3IodmFyICBpID0gMDsgaSA8IF9vcHRpb25zLmNsb3NlRWxDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmKCBmcmFtZXdvcmsuaGFzQ2xhc3ModGFyZ2V0LCAncHN3cF9fJyArIF9vcHRpb25zLmNsb3NlRWxDbGFzc2VzW2ldKSApIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0X2lkbGVJbnRlcnZhbCxcblx0XHRfaWRsZVRpbWVyLFxuXHRcdF9pZGxlSW5jcmVtZW50ID0gMCxcblx0XHRfb25JZGxlTW91c2VNb3ZlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRjbGVhclRpbWVvdXQoX2lkbGVUaW1lcik7XG5cdFx0XHRfaWRsZUluY3JlbWVudCA9IDA7XG5cdFx0XHRpZihfaXNJZGxlKSB7XG5cdFx0XHRcdHVpLnNldElkbGUoZmFsc2UpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0X29uTW91c2VMZWF2ZVdpbmRvdyA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUgPSBlID8gZSA6IHdpbmRvdy5ldmVudDtcblx0XHRcdHZhciBmcm9tID0gZS5yZWxhdGVkVGFyZ2V0IHx8IGUudG9FbGVtZW50O1xuXHRcdFx0aWYgKCFmcm9tIHx8IGZyb20ubm9kZU5hbWUgPT09ICdIVE1MJykge1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoX2lkbGVUaW1lcik7XG5cdFx0XHRcdF9pZGxlVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHVpLnNldElkbGUodHJ1ZSk7XG5cdFx0XHRcdH0sIF9vcHRpb25zLnRpbWVUb0lkbGVPdXRzaWRlKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdF9zZXR1cEZ1bGxzY3JlZW5BUEkgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmKF9vcHRpb25zLmZ1bGxzY3JlZW5FbCAmJiAhZnJhbWV3b3JrLmZlYXR1cmVzLmlzT2xkQW5kcm9pZCkge1xuXHRcdFx0XHRpZighX2Z1bGxzY3JlbkFQSSkge1xuXHRcdFx0XHRcdF9mdWxsc2NyZW5BUEkgPSB1aS5nZXRGdWxsc2NyZWVuQVBJKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoX2Z1bGxzY3JlbkFQSSkge1xuXHRcdFx0XHRcdGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCBfZnVsbHNjcmVuQVBJLmV2ZW50SywgdWkudXBkYXRlRnVsbHNjcmVlbik7XG5cdFx0XHRcdFx0dWkudXBkYXRlRnVsbHNjcmVlbigpO1xuXHRcdFx0XHRcdGZyYW1ld29yay5hZGRDbGFzcyhwc3dwLnRlbXBsYXRlLCAncHN3cC0tc3VwcG9ydHMtZnMnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmcmFtZXdvcmsucmVtb3ZlQ2xhc3MocHN3cC50ZW1wbGF0ZSwgJ3Bzd3AtLXN1cHBvcnRzLWZzJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdF9zZXR1cExvYWRpbmdJbmRpY2F0b3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdC8vIFNldHVwIGxvYWRpbmcgaW5kaWNhdG9yXG5cdFx0XHRpZihfb3B0aW9ucy5wcmVsb2FkZXJFbCkge1xuXHRcdFx0XG5cdFx0XHRcdF90b2dnbGVMb2FkaW5nSW5kaWNhdG9yKHRydWUpO1xuXG5cdFx0XHRcdF9saXN0ZW4oJ2JlZm9yZUNoYW5nZScsIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KF9sb2FkaW5nSW5kaWNhdG9yVGltZW91dCk7XG5cblx0XHRcdFx0XHQvLyBkaXNwbGF5IGxvYWRpbmcgaW5kaWNhdG9yIHdpdGggZGVsYXlcblx0XHRcdFx0XHRfbG9hZGluZ0luZGljYXRvclRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdFx0XHRpZihwc3dwLmN1cnJJdGVtICYmIHBzd3AuY3Vyckl0ZW0ubG9hZGluZykge1xuXG5cdFx0XHRcdFx0XHRcdGlmKCAhcHN3cC5hbGxvd1Byb2dyZXNzaXZlSW1nKCkgfHwgKHBzd3AuY3Vyckl0ZW0uaW1nICYmICFwc3dwLmN1cnJJdGVtLmltZy5uYXR1cmFsV2lkdGgpICApIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBzaG93IHByZWxvYWRlciBpZiBwcm9ncmVzc2l2ZSBsb2FkaW5nIGlzIG5vdCBlbmFibGVkLCBcblx0XHRcdFx0XHRcdFx0XHQvLyBvciBpbWFnZSB3aWR0aCBpcyBub3QgZGVmaW5lZCB5ZXQgKGJlY2F1c2Ugb2Ygc2xvdyBjb25uZWN0aW9uKVxuXHRcdFx0XHRcdFx0XHRcdF90b2dnbGVMb2FkaW5nSW5kaWNhdG9yKGZhbHNlKTsgXG5cdFx0XHRcdFx0XHRcdFx0Ly8gaXRlbXMtY29udHJvbGxlci5qcyBmdW5jdGlvbiBhbGxvd1Byb2dyZXNzaXZlSW1nXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRfdG9nZ2xlTG9hZGluZ0luZGljYXRvcih0cnVlKTsgLy8gaGlkZSBwcmVsb2FkZXJcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH0sIF9vcHRpb25zLmxvYWRpbmdJbmRpY2F0b3JEZWxheSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRfbGlzdGVuKCdpbWFnZUxvYWRDb21wbGV0ZScsIGZ1bmN0aW9uKGluZGV4LCBpdGVtKSB7XG5cdFx0XHRcdFx0aWYocHN3cC5jdXJySXRlbSA9PT0gaXRlbSkge1xuXHRcdFx0XHRcdFx0X3RvZ2dsZUxvYWRpbmdJbmRpY2F0b3IodHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0X3RvZ2dsZUxvYWRpbmdJbmRpY2F0b3IgPSBmdW5jdGlvbihoaWRlKSB7XG5cdFx0XHRpZiggX2xvYWRpbmdJbmRpY2F0b3JIaWRkZW4gIT09IGhpZGUgKSB7XG5cdFx0XHRcdF90b2dnbGVQc3dwQ2xhc3MoX2xvYWRpbmdJbmRpY2F0b3IsICdwcmVsb2FkZXItLWFjdGl2ZScsICFoaWRlKTtcblx0XHRcdFx0X2xvYWRpbmdJbmRpY2F0b3JIaWRkZW4gPSBoaWRlO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0X2FwcGx5TmF2QmFyR2FwcyA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHZhciBnYXAgPSBpdGVtLnZHYXA7XG5cblx0XHRcdGlmKCBfZml0Q29udHJvbHNJblZpZXdwb3J0KCkgKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgYmFycyA9IF9vcHRpb25zLmJhcnNTaXplOyBcblx0XHRcdFx0aWYoX29wdGlvbnMuY2FwdGlvbkVsICYmIGJhcnMuYm90dG9tID09PSAnYXV0bycpIHtcblx0XHRcdFx0XHRpZighX2Zha2VDYXB0aW9uQ29udGFpbmVyKSB7XG5cdFx0XHRcdFx0XHRfZmFrZUNhcHRpb25Db250YWluZXIgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2NhcHRpb24gcHN3cF9fY2FwdGlvbi0tZmFrZScpO1xuXHRcdFx0XHRcdFx0X2Zha2VDYXB0aW9uQ29udGFpbmVyLmFwcGVuZENoaWxkKCBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2NhcHRpb25fX2NlbnRlcicpICk7XG5cdFx0XHRcdFx0XHRfY29udHJvbHMuaW5zZXJ0QmVmb3JlKF9mYWtlQ2FwdGlvbkNvbnRhaW5lciwgX2NhcHRpb25Db250YWluZXIpO1xuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrLmFkZENsYXNzKF9jb250cm9scywgJ3Bzd3BfX3VpLS1maXQnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoIF9vcHRpb25zLmFkZENhcHRpb25IVE1MRm4oaXRlbSwgX2Zha2VDYXB0aW9uQ29udGFpbmVyLCB0cnVlKSApIHtcblxuXHRcdFx0XHRcdFx0dmFyIGNhcHRpb25TaXplID0gX2Zha2VDYXB0aW9uQ29udGFpbmVyLmNsaWVudEhlaWdodDtcblx0XHRcdFx0XHRcdGdhcC5ib3R0b20gPSBwYXJzZUludChjYXB0aW9uU2l6ZSwxMCkgfHwgNDQ7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGdhcC5ib3R0b20gPSBiYXJzLnRvcDsgLy8gaWYgbm8gY2FwdGlvbiwgc2V0IHNpemUgb2YgYm90dG9tIGdhcCB0byBzaXplIG9mIHRvcFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRnYXAuYm90dG9tID0gYmFycy5ib3R0b20gPT09ICdhdXRvJyA/IDAgOiBiYXJzLmJvdHRvbTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Ly8gaGVpZ2h0IG9mIHRvcCBiYXIgaXMgc3RhdGljLCBubyBuZWVkIHRvIGNhbGN1bGF0ZSBpdFxuXHRcdFx0XHRnYXAudG9wID0gYmFycy50b3A7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRnYXAudG9wID0gZ2FwLmJvdHRvbSA9IDA7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRfc2V0dXBJZGxlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBIaWRlIGNvbnRyb2xzIHdoZW4gbW91c2UgaXMgdXNlZFxuXHRcdFx0aWYoX29wdGlvbnMudGltZVRvSWRsZSkge1xuXHRcdFx0XHRfbGlzdGVuKCdtb3VzZVVzZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRmcmFtZXdvcmsuYmluZChkb2N1bWVudCwgJ21vdXNlbW92ZScsIF9vbklkbGVNb3VzZU1vdmUpO1xuXHRcdFx0XHRcdGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCAnbW91c2VvdXQnLCBfb25Nb3VzZUxlYXZlV2luZG93KTtcblxuXHRcdFx0XHRcdF9pZGxlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdF9pZGxlSW5jcmVtZW50Kys7XG5cdFx0XHRcdFx0XHRpZihfaWRsZUluY3JlbWVudCA9PT0gMikge1xuXHRcdFx0XHRcdFx0XHR1aS5zZXRJZGxlKHRydWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sIF9vcHRpb25zLnRpbWVUb0lkbGUgLyAyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRfc2V0dXBIaWRpbmdDb250cm9sc0R1cmluZ0dlc3R1cmVzID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdC8vIEhpZGUgY29udHJvbHMgb24gdmVydGljYWwgZHJhZ1xuXHRcdFx0X2xpc3Rlbignb25WZXJ0aWNhbERyYWcnLCBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0aWYoX2NvbnRyb2xzVmlzaWJsZSAmJiBub3cgPCAwLjk1KSB7XG5cdFx0XHRcdFx0dWkuaGlkZUNvbnRyb2xzKCk7XG5cdFx0XHRcdH0gZWxzZSBpZighX2NvbnRyb2xzVmlzaWJsZSAmJiBub3cgPj0gMC45NSkge1xuXHRcdFx0XHRcdHVpLnNob3dDb250cm9scygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gSGlkZSBjb250cm9scyB3aGVuIHBpbmNoaW5nIHRvIGNsb3NlXG5cdFx0XHR2YXIgcGluY2hDb250cm9sc0hpZGRlbjtcblx0XHRcdF9saXN0ZW4oJ29uUGluY2hDbG9zZScgLCBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0aWYoX2NvbnRyb2xzVmlzaWJsZSAmJiBub3cgPCAwLjkpIHtcblx0XHRcdFx0XHR1aS5oaWRlQ29udHJvbHMoKTtcblx0XHRcdFx0XHRwaW5jaENvbnRyb2xzSGlkZGVuID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIGlmKHBpbmNoQ29udHJvbHNIaWRkZW4gJiYgIV9jb250cm9sc1Zpc2libGUgJiYgbm93ID4gMC45KSB7XG5cdFx0XHRcdFx0dWkuc2hvd0NvbnRyb2xzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRfbGlzdGVuKCd6b29tR2VzdHVyZUVuZGVkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHBpbmNoQ29udHJvbHNIaWRkZW4gPSBmYWxzZTtcblx0XHRcdFx0aWYocGluY2hDb250cm9sc0hpZGRlbiAmJiAhX2NvbnRyb2xzVmlzaWJsZSkge1xuXHRcdFx0XHRcdHVpLnNob3dDb250cm9scygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdH07XG5cblxuXG5cdHZhciBfdWlFbGVtZW50cyA9IFtcblx0XHR7IFxuXHRcdFx0bmFtZTogJ2NhcHRpb24nLCBcblx0XHRcdG9wdGlvbjogJ2NhcHRpb25FbCcsXG5cdFx0XHRvbkluaXQ6IGZ1bmN0aW9uKGVsKSB7ICBcblx0XHRcdFx0X2NhcHRpb25Db250YWluZXIgPSBlbDsgXG5cdFx0XHR9IFxuXHRcdH0sXG5cdFx0eyBcblx0XHRcdG5hbWU6ICdzaGFyZS1tb2RhbCcsIFxuXHRcdFx0b3B0aW9uOiAnc2hhcmVFbCcsXG5cdFx0XHRvbkluaXQ6IGZ1bmN0aW9uKGVsKSB7ICBcblx0XHRcdFx0X3NoYXJlTW9kYWwgPSBlbDtcblx0XHRcdH0sXG5cdFx0XHRvblRhcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdF90b2dnbGVTaGFyZU1vZGFsKCk7XG5cdFx0XHR9IFxuXHRcdH0sXG5cdFx0eyBcblx0XHRcdG5hbWU6ICdidXR0b24tLXNoYXJlJywgXG5cdFx0XHRvcHRpb246ICdzaGFyZUVsJyxcblx0XHRcdG9uSW5pdDogZnVuY3Rpb24oZWwpIHsgXG5cdFx0XHRcdF9zaGFyZUJ1dHRvbiA9IGVsO1xuXHRcdFx0fSxcblx0XHRcdG9uVGFwOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0X3RvZ2dsZVNoYXJlTW9kYWwoKTtcblx0XHRcdH0gXG5cdFx0fSxcblx0XHR7IFxuXHRcdFx0bmFtZTogJ2J1dHRvbi0tem9vbScsIFxuXHRcdFx0b3B0aW9uOiAnem9vbUVsJyxcblx0XHRcdG9uVGFwOiBwc3dwLnRvZ2dsZURlc2t0b3Bab29tXG5cdFx0fSxcblx0XHR7IFxuXHRcdFx0bmFtZTogJ2NvdW50ZXInLCBcblx0XHRcdG9wdGlvbjogJ2NvdW50ZXJFbCcsXG5cdFx0XHRvbkluaXQ6IGZ1bmN0aW9uKGVsKSB7ICBcblx0XHRcdFx0X2luZGV4SW5kaWNhdG9yID0gZWw7XG5cdFx0XHR9IFxuXHRcdH0sXG5cdFx0eyBcblx0XHRcdG5hbWU6ICdidXR0b24tLWNsb3NlJywgXG5cdFx0XHRvcHRpb246ICdjbG9zZUVsJyxcblx0XHRcdG9uVGFwOiBwc3dwLmNsb3NlXG5cdFx0fSxcblx0XHR7IFxuXHRcdFx0bmFtZTogJ2J1dHRvbi0tYXJyb3ctLWxlZnQnLCBcblx0XHRcdG9wdGlvbjogJ2Fycm93RWwnLFxuXHRcdFx0b25UYXA6IHBzd3AucHJldlxuXHRcdH0sXG5cdFx0eyBcblx0XHRcdG5hbWU6ICdidXR0b24tLWFycm93LS1yaWdodCcsIFxuXHRcdFx0b3B0aW9uOiAnYXJyb3dFbCcsXG5cdFx0XHRvblRhcDogcHN3cC5uZXh0XG5cdFx0fSxcblx0XHR7IFxuXHRcdFx0bmFtZTogJ2J1dHRvbi0tZnMnLCBcblx0XHRcdG9wdGlvbjogJ2Z1bGxzY3JlZW5FbCcsXG5cdFx0XHRvblRhcDogZnVuY3Rpb24oKSB7ICBcblx0XHRcdFx0aWYoX2Z1bGxzY3JlbkFQSS5pc0Z1bGxzY3JlZW4oKSkge1xuXHRcdFx0XHRcdF9mdWxsc2NyZW5BUEkuZXhpdCgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdF9mdWxsc2NyZW5BUEkuZW50ZXIoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBcblx0XHR9LFxuXHRcdHsgXG5cdFx0XHRuYW1lOiAncHJlbG9hZGVyJywgXG5cdFx0XHRvcHRpb246ICdwcmVsb2FkZXJFbCcsXG5cdFx0XHRvbkluaXQ6IGZ1bmN0aW9uKGVsKSB7ICBcblx0XHRcdFx0X2xvYWRpbmdJbmRpY2F0b3IgPSBlbDtcblx0XHRcdH0gXG5cdFx0fVxuXG5cdF07XG5cblx0dmFyIF9zZXR1cFVJRWxlbWVudHMgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgaXRlbSxcblx0XHRcdGNsYXNzQXR0cixcblx0XHRcdHVpRWxlbWVudDtcblxuXHRcdHZhciBsb29wVGhyb3VnaENoaWxkRWxlbWVudHMgPSBmdW5jdGlvbihzQ2hpbGRyZW4pIHtcblx0XHRcdGlmKCFzQ2hpbGRyZW4pIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgbCA9IHNDaGlsZHJlbi5sZW5ndGg7XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRcdGl0ZW0gPSBzQ2hpbGRyZW5baV07XG5cdFx0XHRcdGNsYXNzQXR0ciA9IGl0ZW0uY2xhc3NOYW1lO1xuXG5cdFx0XHRcdGZvcih2YXIgYSA9IDA7IGEgPCBfdWlFbGVtZW50cy5sZW5ndGg7IGErKykge1xuXHRcdFx0XHRcdHVpRWxlbWVudCA9IF91aUVsZW1lbnRzW2FdO1xuXG5cdFx0XHRcdFx0aWYoY2xhc3NBdHRyLmluZGV4T2YoJ3Bzd3BfXycgKyB1aUVsZW1lbnQubmFtZSkgPiAtMSAgKSB7XG5cblx0XHRcdFx0XHRcdGlmKCBfb3B0aW9uc1t1aUVsZW1lbnQub3B0aW9uXSApIHsgLy8gaWYgZWxlbWVudCBpcyBub3QgZGlzYWJsZWQgZnJvbSBvcHRpb25zXG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRmcmFtZXdvcmsucmVtb3ZlQ2xhc3MoaXRlbSwgJ3Bzd3BfX2VsZW1lbnQtLWRpc2FibGVkJyk7XG5cdFx0XHRcdFx0XHRcdGlmKHVpRWxlbWVudC5vbkluaXQpIHtcblx0XHRcdFx0XHRcdFx0XHR1aUVsZW1lbnQub25Jbml0KGl0ZW0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHQvL2l0ZW0uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3MoaXRlbSwgJ3Bzd3BfX2VsZW1lbnQtLWRpc2FibGVkJyk7XG5cdFx0XHRcdFx0XHRcdC8vaXRlbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0bG9vcFRocm91Z2hDaGlsZEVsZW1lbnRzKF9jb250cm9scy5jaGlsZHJlbik7XG5cblx0XHR2YXIgdG9wQmFyID0gIGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3MoX2NvbnRyb2xzLCAncHN3cF9fdG9wLWJhcicpO1xuXHRcdGlmKHRvcEJhcikge1xuXHRcdFx0bG9vcFRocm91Z2hDaGlsZEVsZW1lbnRzKCB0b3BCYXIuY2hpbGRyZW4gKTtcblx0XHR9XG5cdH07XG5cblxuXHRcblxuXHR1aS5pbml0ID0gZnVuY3Rpb24oKSB7XG5cblx0XHQvLyBleHRlbmQgb3B0aW9uc1xuXHRcdGZyYW1ld29yay5leHRlbmQocHN3cC5vcHRpb25zLCBfZGVmYXVsdFVJT3B0aW9ucywgdHJ1ZSk7XG5cblx0XHQvLyBjcmVhdGUgbG9jYWwgbGluayBmb3IgZmFzdCBhY2Nlc3Ncblx0XHRfb3B0aW9ucyA9IHBzd3Aub3B0aW9ucztcblxuXHRcdC8vIGZpbmQgcHN3cF9fdWkgZWxlbWVudFxuXHRcdF9jb250cm9scyA9IGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3MocHN3cC5zY3JvbGxXcmFwLCAncHN3cF9fdWknKTtcblxuXHRcdC8vIGNyZWF0ZSBsb2NhbCBsaW5rXG5cdFx0X2xpc3RlbiA9IHBzd3AubGlzdGVuO1xuXG5cblx0XHRfc2V0dXBIaWRpbmdDb250cm9sc0R1cmluZ0dlc3R1cmVzKCk7XG5cblx0XHQvLyB1cGRhdGUgY29udHJvbHMgd2hlbiBzbGlkZXMgY2hhbmdlXG5cdFx0X2xpc3RlbignYmVmb3JlQ2hhbmdlJywgdWkudXBkYXRlKTtcblxuXHRcdC8vIHRvZ2dsZSB6b29tIG9uIGRvdWJsZS10YXBcblx0XHRfbGlzdGVuKCdkb3VibGVUYXAnLCBmdW5jdGlvbihwb2ludCkge1xuXHRcdFx0dmFyIGluaXRpYWxab29tTGV2ZWwgPSBwc3dwLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWw7XG5cdFx0XHRpZihwc3dwLmdldFpvb21MZXZlbCgpICE9PSBpbml0aWFsWm9vbUxldmVsKSB7XG5cdFx0XHRcdHBzd3Auem9vbVRvKGluaXRpYWxab29tTGV2ZWwsIHBvaW50LCAzMzMpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHN3cC56b29tVG8oX29wdGlvbnMuZ2V0RG91YmxlVGFwWm9vbShmYWxzZSwgcHN3cC5jdXJySXRlbSksIHBvaW50LCAzMzMpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gQWxsb3cgdGV4dCBzZWxlY3Rpb24gaW4gY2FwdGlvblxuXHRcdF9saXN0ZW4oJ3ByZXZlbnREcmFnRXZlbnQnLCBmdW5jdGlvbihlLCBpc0Rvd24sIHByZXZlbnRPYmopIHtcblx0XHRcdHZhciB0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXHRcdFx0aWYoXG5cdFx0XHRcdHQgJiYgXG5cdFx0XHRcdHQuZ2V0QXR0cmlidXRlKCdjbGFzcycpICYmIGUudHlwZS5pbmRleE9mKCdtb3VzZScpID4gLTEgJiYgXG5cdFx0XHRcdCggdC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykuaW5kZXhPZignX19jYXB0aW9uJykgPiAwIHx8ICgvKFNNQUxMfFNUUk9OR3xFTSkvaSkudGVzdCh0LnRhZ05hbWUpICkgXG5cdFx0XHQpIHtcblx0XHRcdFx0cHJldmVudE9iai5wcmV2ZW50ID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBiaW5kIGV2ZW50cyBmb3IgVUlcblx0XHRfbGlzdGVuKCdiaW5kRXZlbnRzJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRmcmFtZXdvcmsuYmluZChfY29udHJvbHMsICdwc3dwVGFwIGNsaWNrJywgX29uQ29udHJvbHNUYXApO1xuXHRcdFx0ZnJhbWV3b3JrLmJpbmQocHN3cC5zY3JvbGxXcmFwLCAncHN3cFRhcCcsIHVpLm9uR2xvYmFsVGFwKTtcblxuXHRcdFx0aWYoIXBzd3AubGlrZWx5VG91Y2hEZXZpY2UpIHtcblx0XHRcdFx0ZnJhbWV3b3JrLmJpbmQocHN3cC5zY3JvbGxXcmFwLCAnbW91c2VvdmVyJywgdWkub25Nb3VzZU92ZXIpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gdW5iaW5kIGV2ZW50cyBmb3IgVUlcblx0XHRfbGlzdGVuKCd1bmJpbmRFdmVudHMnLCBmdW5jdGlvbigpIHtcblx0XHRcdGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xuXHRcdFx0XHRfdG9nZ2xlU2hhcmVNb2RhbCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihfaWRsZUludGVydmFsKSB7XG5cdFx0XHRcdGNsZWFySW50ZXJ2YWwoX2lkbGVJbnRlcnZhbCk7XG5cdFx0XHR9XG5cdFx0XHRmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCAnbW91c2VvdXQnLCBfb25Nb3VzZUxlYXZlV2luZG93KTtcblx0XHRcdGZyYW1ld29yay51bmJpbmQoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBfb25JZGxlTW91c2VNb3ZlKTtcblx0XHRcdGZyYW1ld29yay51bmJpbmQoX2NvbnRyb2xzLCAncHN3cFRhcCBjbGljaycsIF9vbkNvbnRyb2xzVGFwKTtcblx0XHRcdGZyYW1ld29yay51bmJpbmQocHN3cC5zY3JvbGxXcmFwLCAncHN3cFRhcCcsIHVpLm9uR2xvYmFsVGFwKTtcblx0XHRcdGZyYW1ld29yay51bmJpbmQocHN3cC5zY3JvbGxXcmFwLCAnbW91c2VvdmVyJywgdWkub25Nb3VzZU92ZXIpO1xuXG5cdFx0XHRpZihfZnVsbHNjcmVuQVBJKSB7XG5cdFx0XHRcdGZyYW1ld29yay51bmJpbmQoZG9jdW1lbnQsIF9mdWxsc2NyZW5BUEkuZXZlbnRLLCB1aS51cGRhdGVGdWxsc2NyZWVuKTtcblx0XHRcdFx0aWYoX2Z1bGxzY3JlbkFQSS5pc0Z1bGxzY3JlZW4oKSkge1xuXHRcdFx0XHRcdF9vcHRpb25zLmhpZGVBbmltYXRpb25EdXJhdGlvbiA9IDA7XG5cdFx0XHRcdFx0X2Z1bGxzY3JlbkFQSS5leGl0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0X2Z1bGxzY3JlbkFQSSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblxuXHRcdC8vIGNsZWFuIHVwIHRoaW5ncyB3aGVuIGdhbGxlcnkgaXMgZGVzdHJveWVkXG5cdFx0X2xpc3RlbignZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYoX29wdGlvbnMuY2FwdGlvbkVsKSB7XG5cdFx0XHRcdGlmKF9mYWtlQ2FwdGlvbkNvbnRhaW5lcikge1xuXHRcdFx0XHRcdF9jb250cm9scy5yZW1vdmVDaGlsZChfZmFrZUNhcHRpb25Db250YWluZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZyYW1ld29yay5yZW1vdmVDbGFzcyhfY2FwdGlvbkNvbnRhaW5lciwgJ3Bzd3BfX2NhcHRpb24tLWVtcHR5Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKF9zaGFyZU1vZGFsKSB7XG5cdFx0XHRcdF9zaGFyZU1vZGFsLmNoaWxkcmVuWzBdLm9uY2xpY2sgPSBudWxsO1xuXHRcdFx0fVxuXHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKF9jb250cm9scywgJ3Bzd3BfX3VpLS1vdmVyLWNsb3NlJyk7XG5cdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3MoIF9jb250cm9scywgJ3Bzd3BfX3VpLS1oaWRkZW4nKTtcblx0XHRcdHVpLnNldElkbGUoZmFsc2UpO1xuXHRcdH0pO1xuXHRcdFxuXG5cdFx0aWYoIV9vcHRpb25zLnNob3dBbmltYXRpb25EdXJhdGlvbikge1xuXHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKCBfY29udHJvbHMsICdwc3dwX191aS0taGlkZGVuJyk7XG5cdFx0fVxuXHRcdF9saXN0ZW4oJ2luaXRpYWxab29tSW4nLCBmdW5jdGlvbigpIHtcblx0XHRcdGlmKF9vcHRpb25zLnNob3dBbmltYXRpb25EdXJhdGlvbikge1xuXHRcdFx0XHRmcmFtZXdvcmsucmVtb3ZlQ2xhc3MoIF9jb250cm9scywgJ3Bzd3BfX3VpLS1oaWRkZW4nKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRfbGlzdGVuKCdpbml0aWFsWm9vbU91dCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0ZnJhbWV3b3JrLmFkZENsYXNzKCBfY29udHJvbHMsICdwc3dwX191aS0taGlkZGVuJyk7XG5cdFx0fSk7XG5cblx0XHRfbGlzdGVuKCdwYXJzZVZlcnRpY2FsTWFyZ2luJywgX2FwcGx5TmF2QmFyR2Fwcyk7XG5cdFx0XG5cdFx0X3NldHVwVUlFbGVtZW50cygpO1xuXG5cdFx0aWYoX29wdGlvbnMuc2hhcmVFbCAmJiBfc2hhcmVCdXR0b24gJiYgX3NoYXJlTW9kYWwpIHtcblx0XHRcdF9zaGFyZU1vZGFsSGlkZGVuID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRfY291bnROdW1JdGVtcygpO1xuXG5cdFx0X3NldHVwSWRsZSgpO1xuXG5cdFx0X3NldHVwRnVsbHNjcmVlbkFQSSgpO1xuXG5cdFx0X3NldHVwTG9hZGluZ0luZGljYXRvcigpO1xuXHR9O1xuXG5cdHVpLnNldElkbGUgPSBmdW5jdGlvbihpc0lkbGUpIHtcblx0XHRfaXNJZGxlID0gaXNJZGxlO1xuXHRcdF90b2dnbGVQc3dwQ2xhc3MoX2NvbnRyb2xzLCAndWktLWlkbGUnLCBpc0lkbGUpO1xuXHR9O1xuXG5cdHVpLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vIERvbid0IHVwZGF0ZSBVSSBpZiBpdCdzIGhpZGRlblxuXHRcdGlmKF9jb250cm9sc1Zpc2libGUgJiYgcHN3cC5jdXJySXRlbSkge1xuXHRcdFx0XG5cdFx0XHR1aS51cGRhdGVJbmRleEluZGljYXRvcigpO1xuXG5cdFx0XHRpZihfb3B0aW9ucy5jYXB0aW9uRWwpIHtcblx0XHRcdFx0X29wdGlvbnMuYWRkQ2FwdGlvbkhUTUxGbihwc3dwLmN1cnJJdGVtLCBfY2FwdGlvbkNvbnRhaW5lcik7XG5cblx0XHRcdFx0X3RvZ2dsZVBzd3BDbGFzcyhfY2FwdGlvbkNvbnRhaW5lciwgJ2NhcHRpb24tLWVtcHR5JywgIXBzd3AuY3Vyckl0ZW0udGl0bGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRfb3ZlcmxheVVJVXBkYXRlZCA9IHRydWU7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0X292ZXJsYXlVSVVwZGF0ZWQgPSBmYWxzZTtcblx0XHR9XG5cblx0XHRpZighX3NoYXJlTW9kYWxIaWRkZW4pIHtcblx0XHRcdF90b2dnbGVTaGFyZU1vZGFsKCk7XG5cdFx0fVxuXG5cdFx0X2NvdW50TnVtSXRlbXMoKTtcblx0fTtcblxuXHR1aS51cGRhdGVGdWxsc2NyZWVuID0gZnVuY3Rpb24oZSkge1xuXG5cdFx0aWYoZSkge1xuXHRcdFx0Ly8gc29tZSBicm93c2VycyBjaGFuZ2Ugd2luZG93IHNjcm9sbCBwb3NpdGlvbiBkdXJpbmcgdGhlIGZ1bGxzY3JlZW5cblx0XHRcdC8vIHNvIFBob3RvU3dpcGUgdXBkYXRlcyBpdCBqdXN0IGluIGNhc2Vcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHBzd3Auc2V0U2Nyb2xsT2Zmc2V0KCAwLCBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpICk7XG5cdFx0XHR9LCA1MCk7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIHRvb2dsZSBwc3dwLS1mcyBjbGFzcyBvbiByb290IGVsZW1lbnRcblx0XHRmcmFtZXdvcmtbIChfZnVsbHNjcmVuQVBJLmlzRnVsbHNjcmVlbigpID8gJ2FkZCcgOiAncmVtb3ZlJykgKyAnQ2xhc3MnIF0ocHN3cC50ZW1wbGF0ZSwgJ3Bzd3AtLWZzJyk7XG5cdH07XG5cblx0dWkudXBkYXRlSW5kZXhJbmRpY2F0b3IgPSBmdW5jdGlvbigpIHtcblx0XHRpZihfb3B0aW9ucy5jb3VudGVyRWwpIHtcblx0XHRcdF9pbmRleEluZGljYXRvci5pbm5lckhUTUwgPSAocHN3cC5nZXRDdXJyZW50SW5kZXgoKSsxKSArIFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRfb3B0aW9ucy5pbmRleEluZGljYXRvclNlcCArIFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRfb3B0aW9ucy5nZXROdW1JdGVtc0ZuKCk7XG5cdFx0fVxuXHR9O1xuXHRcblx0dWkub25HbG9iYWxUYXAgPSBmdW5jdGlvbihlKSB7XG5cdFx0ZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cblx0XHRpZihfYmxvY2tDb250cm9sc1RhcCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmKGUuZGV0YWlsICYmIGUuZGV0YWlsLnBvaW50ZXJUeXBlID09PSAnbW91c2UnKSB7XG5cblx0XHRcdC8vIGNsb3NlIGdhbGxlcnkgaWYgY2xpY2tlZCBvdXRzaWRlIG9mIHRoZSBpbWFnZVxuXHRcdFx0aWYoX2hhc0Nsb3NlQ2xhc3ModGFyZ2V0KSkge1xuXHRcdFx0XHRwc3dwLmNsb3NlKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoZnJhbWV3b3JrLmhhc0NsYXNzKHRhcmdldCwgJ3Bzd3BfX2ltZycpKSB7XG5cdFx0XHRcdGlmKHBzd3AuZ2V0Wm9vbUxldmVsKCkgPT09IDEgJiYgcHN3cC5nZXRab29tTGV2ZWwoKSA8PSBwc3dwLmN1cnJJdGVtLmZpdFJhdGlvKSB7XG5cdFx0XHRcdFx0aWYoX29wdGlvbnMuY2xpY2tUb0Nsb3NlTm9uWm9vbWFibGUpIHtcblx0XHRcdFx0XHRcdHBzd3AuY2xvc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cHN3cC50b2dnbGVEZXNrdG9wWm9vbShlLmRldGFpbC5yZWxlYXNlUG9pbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyB0YXAgYW55d2hlcmUgKGV4Y2VwdCBidXR0b25zKSB0byB0b2dnbGUgdmlzaWJpbGl0eSBvZiBjb250cm9sc1xuXHRcdFx0aWYoX29wdGlvbnMudGFwVG9Ub2dnbGVDb250cm9scykge1xuXHRcdFx0XHRpZihfY29udHJvbHNWaXNpYmxlKSB7XG5cdFx0XHRcdFx0dWkuaGlkZUNvbnRyb2xzKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dWkuc2hvd0NvbnRyb2xzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gdGFwIHRvIGNsb3NlIGdhbGxlcnlcblx0XHRcdGlmKF9vcHRpb25zLnRhcFRvQ2xvc2UgJiYgKGZyYW1ld29yay5oYXNDbGFzcyh0YXJnZXQsICdwc3dwX19pbWcnKSB8fCBfaGFzQ2xvc2VDbGFzcyh0YXJnZXQpKSApIHtcblx0XHRcdFx0cHN3cC5jbG9zZSgpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRcblx0XHR9XG5cdH07XG5cdHVpLm9uTW91c2VPdmVyID0gZnVuY3Rpb24oZSkge1xuXHRcdGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0Ly8gYWRkIGNsYXNzIHdoZW4gbW91c2UgaXMgb3ZlciBhbiBlbGVtZW50IHRoYXQgc2hvdWxkIGNsb3NlIHRoZSBnYWxsZXJ5XG5cdFx0X3RvZ2dsZVBzd3BDbGFzcyhfY29udHJvbHMsICd1aS0tb3Zlci1jbG9zZScsIF9oYXNDbG9zZUNsYXNzKHRhcmdldCkpO1xuXHR9O1xuXG5cdHVpLmhpZGVDb250cm9scyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZyYW1ld29yay5hZGRDbGFzcyhfY29udHJvbHMsJ3Bzd3BfX3VpLS1oaWRkZW4nKTtcblx0XHRfY29udHJvbHNWaXNpYmxlID0gZmFsc2U7XG5cdH07XG5cblx0dWkuc2hvd0NvbnRyb2xzID0gZnVuY3Rpb24oKSB7XG5cdFx0X2NvbnRyb2xzVmlzaWJsZSA9IHRydWU7XG5cdFx0aWYoIV9vdmVybGF5VUlVcGRhdGVkKSB7XG5cdFx0XHR1aS51cGRhdGUoKTtcblx0XHR9XG5cdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKF9jb250cm9scywncHN3cF9fdWktLWhpZGRlbicpO1xuXHR9O1xuXG5cdHVpLnN1cHBvcnRzRnVsbHNjcmVlbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkID0gZG9jdW1lbnQ7XG5cdFx0cmV0dXJuICEhKGQuZXhpdEZ1bGxzY3JlZW4gfHwgZC5tb3pDYW5jZWxGdWxsU2NyZWVuIHx8IGQud2Via2l0RXhpdEZ1bGxzY3JlZW4gfHwgZC5tc0V4aXRGdWxsc2NyZWVuKTtcblx0fTtcblxuXHR1aS5nZXRGdWxsc2NyZWVuQVBJID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRFID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXHRcdFx0YXBpLFxuXHRcdFx0dEYgPSAnZnVsbHNjcmVlbmNoYW5nZSc7XG5cblx0XHRpZiAoZEUucmVxdWVzdEZ1bGxzY3JlZW4pIHtcblx0XHRcdGFwaSA9IHtcblx0XHRcdFx0ZW50ZXJLOiAncmVxdWVzdEZ1bGxzY3JlZW4nLFxuXHRcdFx0XHRleGl0SzogJ2V4aXRGdWxsc2NyZWVuJyxcblx0XHRcdFx0ZWxlbWVudEs6ICdmdWxsc2NyZWVuRWxlbWVudCcsXG5cdFx0XHRcdGV2ZW50SzogdEZcblx0XHRcdH07XG5cblx0XHR9IGVsc2UgaWYoZEUubW96UmVxdWVzdEZ1bGxTY3JlZW4gKSB7XG5cdFx0XHRhcGkgPSB7XG5cdFx0XHRcdGVudGVySzogJ21velJlcXVlc3RGdWxsU2NyZWVuJyxcblx0XHRcdFx0ZXhpdEs6ICdtb3pDYW5jZWxGdWxsU2NyZWVuJyxcblx0XHRcdFx0ZWxlbWVudEs6ICdtb3pGdWxsU2NyZWVuRWxlbWVudCcsXG5cdFx0XHRcdGV2ZW50SzogJ21veicgKyB0RlxuXHRcdFx0fTtcblxuXHRcdFx0XG5cblx0XHR9IGVsc2UgaWYoZEUud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcblx0XHRcdGFwaSA9IHtcblx0XHRcdFx0ZW50ZXJLOiAnd2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4nLFxuXHRcdFx0XHRleGl0SzogJ3dlYmtpdEV4aXRGdWxsc2NyZWVuJyxcblx0XHRcdFx0ZWxlbWVudEs6ICd3ZWJraXRGdWxsc2NyZWVuRWxlbWVudCcsXG5cdFx0XHRcdGV2ZW50SzogJ3dlYmtpdCcgKyB0RlxuXHRcdFx0fTtcblxuXHRcdH0gZWxzZSBpZihkRS5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG5cdFx0XHRhcGkgPSB7XG5cdFx0XHRcdGVudGVySzogJ21zUmVxdWVzdEZ1bGxzY3JlZW4nLFxuXHRcdFx0XHRleGl0SzogJ21zRXhpdEZ1bGxzY3JlZW4nLFxuXHRcdFx0XHRlbGVtZW50SzogJ21zRnVsbHNjcmVlbkVsZW1lbnQnLFxuXHRcdFx0XHRldmVudEs6ICdNU0Z1bGxzY3JlZW5DaGFuZ2UnXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmKGFwaSkge1xuXHRcdFx0YXBpLmVudGVyID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQvLyBkaXNhYmxlIGNsb3NlLW9uLXNjcm9sbCBpbiBmdWxsc2NyZWVuXG5cdFx0XHRcdF9pbml0YWxDbG9zZU9uU2Nyb2xsVmFsdWUgPSBfb3B0aW9ucy5jbG9zZU9uU2Nyb2xsOyBcblx0XHRcdFx0X29wdGlvbnMuY2xvc2VPblNjcm9sbCA9IGZhbHNlOyBcblxuXHRcdFx0XHRpZih0aGlzLmVudGVySyA9PT0gJ3dlYmtpdFJlcXVlc3RGdWxsc2NyZWVuJykge1xuXHRcdFx0XHRcdHBzd3AudGVtcGxhdGVbdGhpcy5lbnRlcktdKCBFbGVtZW50LkFMTE9XX0tFWUJPQVJEX0lOUFVUICk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIHBzd3AudGVtcGxhdGVbdGhpcy5lbnRlcktdKCk7IFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0YXBpLmV4aXQgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdF9vcHRpb25zLmNsb3NlT25TY3JvbGwgPSBfaW5pdGFsQ2xvc2VPblNjcm9sbFZhbHVlO1xuXG5cdFx0XHRcdHJldHVybiBkb2N1bWVudFt0aGlzLmV4aXRLXSgpOyBcblxuXHRcdFx0fTtcblx0XHRcdGFwaS5pc0Z1bGxzY3JlZW4gPSBmdW5jdGlvbigpIHsgcmV0dXJuIGRvY3VtZW50W3RoaXMuZWxlbWVudEtdOyB9O1xuXHRcdH1cblxuXHRcdHJldHVybiBhcGk7XG5cdH07XG5cblxuXG59O1xucmV0dXJuIFBob3RvU3dpcGVVSV9EZWZhdWx0O1xuXG5cbn0pO1xuIiwiLyohIFBob3RvU3dpcGUgLSB2NC4xLjEgLSAyMDE1LTEyLTI0XG4qIGh0dHA6Ly9waG90b3N3aXBlLmNvbVxuKiBDb3B5cmlnaHQgKGMpIDIwMTUgRG1pdHJ5IFNlbWVub3Y7ICovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHsgXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZmFjdG9yeSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH0gZWxzZSB7XG5cdFx0cm9vdC5QaG90b1N3aXBlID0gZmFjdG9yeSgpO1xuXHR9XG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXHR2YXIgUGhvdG9Td2lwZSA9IGZ1bmN0aW9uKHRlbXBsYXRlLCBVaUNsYXNzLCBpdGVtcywgb3B0aW9ucyl7XG5cbi8qPj5mcmFtZXdvcmstYnJpZGdlKi9cbi8qKlxuICpcbiAqIFNldCBvZiBnZW5lcmljIGZ1bmN0aW9ucyB1c2VkIGJ5IGdhbGxlcnkuXG4gKiBcbiAqIFlvdSdyZSBmcmVlIHRvIG1vZGlmeSBhbnl0aGluZyBoZXJlIGFzIGxvbmcgYXMgZnVuY3Rpb25hbGl0eSBpcyBrZXB0LlxuICogXG4gKi9cbnZhciBmcmFtZXdvcmsgPSB7XG5cdGZlYXR1cmVzOiBudWxsLFxuXHRiaW5kOiBmdW5jdGlvbih0YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCB1bmJpbmQpIHtcblx0XHR2YXIgbWV0aG9kTmFtZSA9ICh1bmJpbmQgPyAncmVtb3ZlJyA6ICdhZGQnKSArICdFdmVudExpc3RlbmVyJztcblx0XHR0eXBlID0gdHlwZS5zcGxpdCgnICcpO1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZih0eXBlW2ldKSB7XG5cdFx0XHRcdHRhcmdldFttZXRob2ROYW1lXSggdHlwZVtpXSwgbGlzdGVuZXIsIGZhbHNlKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGlzQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xuXHRcdHJldHVybiAob2JqIGluc3RhbmNlb2YgQXJyYXkpO1xuXHR9LFxuXHRjcmVhdGVFbDogZnVuY3Rpb24oY2xhc3NlcywgdGFnKSB7XG5cdFx0dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcgfHwgJ2RpdicpO1xuXHRcdGlmKGNsYXNzZXMpIHtcblx0XHRcdGVsLmNsYXNzTmFtZSA9IGNsYXNzZXM7XG5cdFx0fVxuXHRcdHJldHVybiBlbDtcblx0fSxcblx0Z2V0U2Nyb2xsWTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHlPZmZzZXQgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG5cdFx0cmV0dXJuIHlPZmZzZXQgIT09IHVuZGVmaW5lZCA/IHlPZmZzZXQgOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuXHR9LFxuXHR1bmJpbmQ6IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIpIHtcblx0XHRmcmFtZXdvcmsuYmluZCh0YXJnZXQsdHlwZSxsaXN0ZW5lcix0cnVlKTtcblx0fSxcblx0cmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgcmVnID0gbmV3IFJlZ0V4cCgnKFxcXFxzfF4pJyArIGNsYXNzTmFtZSArICcoXFxcXHN8JCknKTtcblx0XHRlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZWcsICcgJykucmVwbGFjZSgvXlxcc1xccyovLCAnJykucmVwbGFjZSgvXFxzXFxzKiQvLCAnJyk7IFxuXHR9LFxuXHRhZGRDbGFzczogZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuXHRcdGlmKCAhZnJhbWV3b3JrLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkgKSB7XG5cdFx0XHRlbC5jbGFzc05hbWUgKz0gKGVsLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArIGNsYXNzTmFtZTtcblx0XHR9XG5cdH0sXG5cdGhhc0NsYXNzOiBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG5cdFx0cmV0dXJuIGVsLmNsYXNzTmFtZSAmJiBuZXcgUmVnRXhwKCcoXnxcXFxccyknICsgY2xhc3NOYW1lICsgJyhcXFxcc3wkKScpLnRlc3QoZWwuY2xhc3NOYW1lKTtcblx0fSxcblx0Z2V0Q2hpbGRCeUNsYXNzOiBmdW5jdGlvbihwYXJlbnRFbCwgY2hpbGRDbGFzc05hbWUpIHtcblx0XHR2YXIgbm9kZSA9IHBhcmVudEVsLmZpcnN0Q2hpbGQ7XG5cdFx0d2hpbGUobm9kZSkge1xuXHRcdFx0aWYoIGZyYW1ld29yay5oYXNDbGFzcyhub2RlLCBjaGlsZENsYXNzTmFtZSkgKSB7XG5cdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0fVxuXHRcdFx0bm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG5cdFx0fVxuXHR9LFxuXHRhcnJheVNlYXJjaDogZnVuY3Rpb24oYXJyYXksIHZhbHVlLCBrZXkpIHtcblx0XHR2YXIgaSA9IGFycmF5Lmxlbmd0aDtcblx0XHR3aGlsZShpLS0pIHtcblx0XHRcdGlmKGFycmF5W2ldW2tleV0gPT09IHZhbHVlKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fSBcblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9LFxuXHRleHRlbmQ6IGZ1bmN0aW9uKG8xLCBvMiwgcHJldmVudE92ZXJ3cml0ZSkge1xuXHRcdGZvciAodmFyIHByb3AgaW4gbzIpIHtcblx0XHRcdGlmIChvMi5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdFx0XHRpZihwcmV2ZW50T3ZlcndyaXRlICYmIG8xLmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bzFbcHJvcF0gPSBvMltwcm9wXTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGVhc2luZzoge1xuXHRcdHNpbmU6IHtcblx0XHRcdG91dDogZnVuY3Rpb24oaykge1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5zaW4oayAqIChNYXRoLlBJIC8gMikpO1xuXHRcdFx0fSxcblx0XHRcdGluT3V0OiBmdW5jdGlvbihrKSB7XG5cdFx0XHRcdHJldHVybiAtIChNYXRoLmNvcyhNYXRoLlBJICogaykgLSAxKSAvIDI7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRjdWJpYzoge1xuXHRcdFx0b3V0OiBmdW5jdGlvbihrKSB7XG5cdFx0XHRcdHJldHVybiAtLWsgKiBrICogayArIDE7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8qXG5cdFx0XHRlbGFzdGljOiB7XG5cdFx0XHRcdG91dDogZnVuY3Rpb24gKCBrICkge1xuXG5cdFx0XHRcdFx0dmFyIHMsIGEgPSAwLjEsIHAgPSAwLjQ7XG5cdFx0XHRcdFx0aWYgKCBrID09PSAwICkgcmV0dXJuIDA7XG5cdFx0XHRcdFx0aWYgKCBrID09PSAxICkgcmV0dXJuIDE7XG5cdFx0XHRcdFx0aWYgKCAhYSB8fCBhIDwgMSApIHsgYSA9IDE7IHMgPSBwIC8gNDsgfVxuXHRcdFx0XHRcdGVsc2UgcyA9IHAgKiBNYXRoLmFzaW4oIDEgLyBhICkgLyAoIDIgKiBNYXRoLlBJICk7XG5cdFx0XHRcdFx0cmV0dXJuICggYSAqIE1hdGgucG93KCAyLCAtIDEwICogaykgKiBNYXRoLnNpbiggKCBrIC0gcyApICogKCAyICogTWF0aC5QSSApIC8gcCApICsgMSApO1xuXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0YmFjazoge1xuXHRcdFx0XHRvdXQ6IGZ1bmN0aW9uICggayApIHtcblx0XHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cdFx0XHRcdFx0cmV0dXJuIC0tayAqIGsgKiAoICggcyArIDEgKSAqIGsgKyBzICkgKyAxO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0Ki9cblx0fSxcblxuXHQvKipcblx0ICogXG5cdCAqIEByZXR1cm4ge29iamVjdH1cblx0ICogXG5cdCAqIHtcblx0ICogIHJhZiA6IHJlcXVlc3QgYW5pbWF0aW9uIGZyYW1lIGZ1bmN0aW9uXG5cdCAqICBjYWYgOiBjYW5jZWwgYW5pbWF0aW9uIGZyYW1lIGZ1bmN0aW9uXG5cdCAqICB0cmFuc2Zyb20gOiB0cmFuc2Zvcm0gcHJvcGVydHkga2V5ICh3aXRoIHZlbmRvciksIG9yIG51bGwgaWYgbm90IHN1cHBvcnRlZFxuXHQgKiAgb2xkSUUgOiBJRTggb3IgYmVsb3dcblx0ICogfVxuXHQgKiBcblx0ICovXG5cdGRldGVjdEZlYXR1cmVzOiBmdW5jdGlvbigpIHtcblx0XHRpZihmcmFtZXdvcmsuZmVhdHVyZXMpIHtcblx0XHRcdHJldHVybiBmcmFtZXdvcmsuZmVhdHVyZXM7XG5cdFx0fVxuXHRcdHZhciBoZWxwZXJFbCA9IGZyYW1ld29yay5jcmVhdGVFbCgpLFxuXHRcdFx0aGVscGVyU3R5bGUgPSBoZWxwZXJFbC5zdHlsZSxcblx0XHRcdHZlbmRvciA9ICcnLFxuXHRcdFx0ZmVhdHVyZXMgPSB7fTtcblxuXHRcdC8vIElFOCBhbmQgYmVsb3dcblx0XHRmZWF0dXJlcy5vbGRJRSA9IGRvY3VtZW50LmFsbCAmJiAhZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcjtcblxuXHRcdGZlYXR1cmVzLnRvdWNoID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93O1xuXG5cdFx0aWYod2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuXHRcdFx0ZmVhdHVyZXMucmFmID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTtcblx0XHRcdGZlYXR1cmVzLmNhZiA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZTtcblx0XHR9XG5cblx0XHRmZWF0dXJlcy5wb2ludGVyRXZlbnQgPSBuYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQgfHwgbmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQ7XG5cblx0XHQvLyBmaXggZmFsc2UtcG9zaXRpdmUgZGV0ZWN0aW9uIG9mIG9sZCBBbmRyb2lkIGluIG5ldyBJRVxuXHRcdC8vIChJRTExIHVhIHN0cmluZyBjb250YWlucyBcIkFuZHJvaWQgNC4wXCIpXG5cdFx0XG5cdFx0aWYoIWZlYXR1cmVzLnBvaW50ZXJFdmVudCkgeyBcblxuXHRcdFx0dmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcblxuXHRcdFx0Ly8gRGV0ZWN0IGlmIGRldmljZSBpcyBpUGhvbmUgb3IgaVBvZCBhbmQgaWYgaXQncyBvbGRlciB0aGFuIGlPUyA4XG5cdFx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNDIyMzkyMFxuXHRcdFx0Ly8gXG5cdFx0XHQvLyBUaGlzIGRldGVjdGlvbiBpcyBtYWRlIGJlY2F1c2Ugb2YgYnVnZ3kgdG9wL2JvdHRvbSB0b29sYmFyc1xuXHRcdFx0Ly8gdGhhdCBkb24ndCB0cmlnZ2VyIHdpbmRvdy5yZXNpemUgZXZlbnQuXG5cdFx0XHQvLyBGb3IgbW9yZSBpbmZvIHJlZmVyIHRvIF9pc0ZpeGVkUG9zaXRpb24gdmFyaWFibGUgaW4gY29yZS5qc1xuXG5cdFx0XHRpZiAoL2lQKGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkpIHtcblx0XHRcdFx0dmFyIHYgPSAobmF2aWdhdG9yLmFwcFZlcnNpb24pLm1hdGNoKC9PUyAoXFxkKylfKFxcZCspXz8oXFxkKyk/Lyk7XG5cdFx0XHRcdGlmKHYgJiYgdi5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0diA9IHBhcnNlSW50KHZbMV0sIDEwKTtcblx0XHRcdFx0XHRpZih2ID49IDEgJiYgdiA8IDggKSB7XG5cdFx0XHRcdFx0XHRmZWF0dXJlcy5pc09sZElPU1Bob25lID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRGV0ZWN0IG9sZCBBbmRyb2lkIChiZWZvcmUgS2l0S2F0KVxuXHRcdFx0Ly8gZHVlIHRvIGJ1Z3MgcmVsYXRlZCB0byBwb3NpdGlvbjpmaXhlZFxuXHRcdFx0Ly8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MTg0NTczL3BpY2stdXAtdGhlLWFuZHJvaWQtdmVyc2lvbi1pbi10aGUtYnJvd3Nlci1ieS1qYXZhc2NyaXB0XG5cdFx0XHRcblx0XHRcdHZhciBtYXRjaCA9IHVhLm1hdGNoKC9BbmRyb2lkXFxzKFswLTlcXC5dKikvKTtcblx0XHRcdHZhciBhbmRyb2lkdmVyc2lvbiA9ICBtYXRjaCA/IG1hdGNoWzFdIDogMDtcblx0XHRcdGFuZHJvaWR2ZXJzaW9uID0gcGFyc2VGbG9hdChhbmRyb2lkdmVyc2lvbik7XG5cdFx0XHRpZihhbmRyb2lkdmVyc2lvbiA+PSAxICkge1xuXHRcdFx0XHRpZihhbmRyb2lkdmVyc2lvbiA8IDQuNCkge1xuXHRcdFx0XHRcdGZlYXR1cmVzLmlzT2xkQW5kcm9pZCA9IHRydWU7IC8vIGZvciBmaXhlZCBwb3NpdGlvbiBidWcgJiBwZXJmb3JtYW5jZVxuXHRcdFx0XHR9XG5cdFx0XHRcdGZlYXR1cmVzLmFuZHJvaWRWZXJzaW9uID0gYW5kcm9pZHZlcnNpb247IC8vIGZvciB0b3VjaGVuZCBidWdcblx0XHRcdH1cdFxuXHRcdFx0ZmVhdHVyZXMuaXNNb2JpbGVPcGVyYSA9IC9vcGVyYSBtaW5pfG9wZXJhIG1vYmkvaS50ZXN0KHVhKTtcblxuXHRcdFx0Ly8gcC5zLiB5ZXMsIHllcywgVUEgc25pZmZpbmcgaXMgYmFkLCBwcm9wb3NlIHlvdXIgc29sdXRpb24gZm9yIGFib3ZlIGJ1Z3MuXG5cdFx0fVxuXHRcdFxuXHRcdHZhciBzdHlsZUNoZWNrcyA9IFsndHJhbnNmb3JtJywgJ3BlcnNwZWN0aXZlJywgJ2FuaW1hdGlvbk5hbWUnXSxcblx0XHRcdHZlbmRvcnMgPSBbJycsICd3ZWJraXQnLCdNb3onLCdtcycsJ08nXSxcblx0XHRcdHN0eWxlQ2hlY2tJdGVtLFxuXHRcdFx0c3R5bGVOYW1lO1xuXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuXHRcdFx0dmVuZG9yID0gdmVuZG9yc1tpXTtcblxuXHRcdFx0Zm9yKHZhciBhID0gMDsgYSA8IDM7IGErKykge1xuXHRcdFx0XHRzdHlsZUNoZWNrSXRlbSA9IHN0eWxlQ2hlY2tzW2FdO1xuXG5cdFx0XHRcdC8vIHVwcGVyY2FzZSBmaXJzdCBsZXR0ZXIgb2YgcHJvcGVydHkgbmFtZSwgaWYgdmVuZG9yIGlzIHByZXNlbnRcblx0XHRcdFx0c3R5bGVOYW1lID0gdmVuZG9yICsgKHZlbmRvciA/IFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZUNoZWNrSXRlbS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0eWxlQ2hlY2tJdGVtLnNsaWNlKDEpIDogXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlQ2hlY2tJdGVtKTtcblx0XHRcdFxuXHRcdFx0XHRpZighZmVhdHVyZXNbc3R5bGVDaGVja0l0ZW1dICYmIHN0eWxlTmFtZSBpbiBoZWxwZXJTdHlsZSApIHtcblx0XHRcdFx0XHRmZWF0dXJlc1tzdHlsZUNoZWNrSXRlbV0gPSBzdHlsZU5hbWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYodmVuZG9yICYmICFmZWF0dXJlcy5yYWYpIHtcblx0XHRcdFx0dmVuZG9yID0gdmVuZG9yLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGZlYXR1cmVzLnJhZiA9IHdpbmRvd1t2ZW5kb3IrJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuXHRcdFx0XHRpZihmZWF0dXJlcy5yYWYpIHtcblx0XHRcdFx0XHRmZWF0dXJlcy5jYWYgPSB3aW5kb3dbdmVuZG9yKydDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8IFxuXHRcdFx0XHRcdFx0XHRcdFx0d2luZG93W3ZlbmRvcisnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0XHRcblx0XHRpZighZmVhdHVyZXMucmFmKSB7XG5cdFx0XHR2YXIgbGFzdFRpbWUgPSAwO1xuXHRcdFx0ZmVhdHVyZXMucmFmID0gZnVuY3Rpb24oZm4pIHtcblx0XHRcdFx0dmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0XHRcdHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuXHRcdFx0XHR2YXIgaWQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgZm4oY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSwgdGltZVRvQ2FsbCk7XG5cdFx0XHRcdGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuXHRcdFx0XHRyZXR1cm4gaWQ7XG5cdFx0XHR9O1xuXHRcdFx0ZmVhdHVyZXMuY2FmID0gZnVuY3Rpb24oaWQpIHsgY2xlYXJUaW1lb3V0KGlkKTsgfTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgU1ZHIHN1cHBvcnRcblx0XHRmZWF0dXJlcy5zdmcgPSAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiBcblx0XHRcdFx0XHRcdCEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICdzdmcnKS5jcmVhdGVTVkdSZWN0O1xuXG5cdFx0ZnJhbWV3b3JrLmZlYXR1cmVzID0gZmVhdHVyZXM7XG5cblx0XHRyZXR1cm4gZmVhdHVyZXM7XG5cdH1cbn07XG5cbmZyYW1ld29yay5kZXRlY3RGZWF0dXJlcygpO1xuXG4vLyBPdmVycmlkZSBhZGRFdmVudExpc3RlbmVyIGZvciBvbGQgdmVyc2lvbnMgb2YgSUVcbmlmKGZyYW1ld29yay5mZWF0dXJlcy5vbGRJRSkge1xuXG5cdGZyYW1ld29yay5iaW5kID0gZnVuY3Rpb24odGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgdW5iaW5kKSB7XG5cdFx0XG5cdFx0dHlwZSA9IHR5cGUuc3BsaXQoJyAnKTtcblxuXHRcdHZhciBtZXRob2ROYW1lID0gKHVuYmluZCA/ICdkZXRhY2gnIDogJ2F0dGFjaCcpICsgJ0V2ZW50Jyxcblx0XHRcdGV2TmFtZSxcblx0XHRcdF9oYW5kbGVFdiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRsaXN0ZW5lci5oYW5kbGVFdmVudC5jYWxsKGxpc3RlbmVyKTtcblx0XHRcdH07XG5cblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0ZXZOYW1lID0gdHlwZVtpXTtcblx0XHRcdGlmKGV2TmFtZSkge1xuXG5cdFx0XHRcdGlmKHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCcgJiYgbGlzdGVuZXIuaGFuZGxlRXZlbnQpIHtcblx0XHRcdFx0XHRpZighdW5iaW5kKSB7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lclsnb2xkSUUnICsgZXZOYW1lXSA9IF9oYW5kbGVFdjtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYoIWxpc3RlbmVyWydvbGRJRScgKyBldk5hbWVdKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0YXJnZXRbbWV0aG9kTmFtZV0oICdvbicgKyBldk5hbWUsIGxpc3RlbmVyWydvbGRJRScgKyBldk5hbWVdKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0YXJnZXRbbWV0aG9kTmFtZV0oICdvbicgKyBldk5hbWUsIGxpc3RlbmVyKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHRcbn1cblxuLyo+PmZyYW1ld29yay1icmlkZ2UqL1xuXG4vKj4+Y29yZSovXG4vL2Z1bmN0aW9uKHRlbXBsYXRlLCBVaUNsYXNzLCBpdGVtcywgb3B0aW9ucylcblxudmFyIHNlbGYgPSB0aGlzO1xuXG4vKipcbiAqIFN0YXRpYyB2YXJzLCBkb24ndCBjaGFuZ2UgdW5sZXNzIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxuICovXG52YXIgRE9VQkxFX1RBUF9SQURJVVMgPSAyNSwgXG5cdE5VTV9IT0xERVJTID0gMztcblxuLyoqXG4gKiBPcHRpb25zXG4gKi9cbnZhciBfb3B0aW9ucyA9IHtcblx0YWxsb3dQYW5Ub05leHQ6dHJ1ZSxcblx0c3BhY2luZzogMC4xMixcblx0YmdPcGFjaXR5OiAxLFxuXHRtb3VzZVVzZWQ6IGZhbHNlLFxuXHRsb29wOiB0cnVlLFxuXHRwaW5jaFRvQ2xvc2U6IHRydWUsXG5cdGNsb3NlT25TY3JvbGw6IHRydWUsXG5cdGNsb3NlT25WZXJ0aWNhbERyYWc6IHRydWUsXG5cdHZlcnRpY2FsRHJhZ1JhbmdlOiAwLjc1LFxuXHRoaWRlQW5pbWF0aW9uRHVyYXRpb246IDMzMyxcblx0c2hvd0FuaW1hdGlvbkR1cmF0aW9uOiAzMzMsXG5cdHNob3dIaWRlT3BhY2l0eTogZmFsc2UsXG5cdGZvY3VzOiB0cnVlLFxuXHRlc2NLZXk6IHRydWUsXG5cdGFycm93S2V5czogdHJ1ZSxcblx0bWFpblNjcm9sbEVuZEZyaWN0aW9uOiAwLjM1LFxuXHRwYW5FbmRGcmljdGlvbjogMC4zNSxcblx0aXNDbGlja2FibGVFbGVtZW50OiBmdW5jdGlvbihlbCkge1xuICAgICAgICByZXR1cm4gZWwudGFnTmFtZSA9PT0gJ0EnO1xuICAgIH0sXG4gICAgZ2V0RG91YmxlVGFwWm9vbTogZnVuY3Rpb24oaXNNb3VzZUNsaWNrLCBpdGVtKSB7XG4gICAgXHRpZihpc01vdXNlQ2xpY2spIHtcbiAgICBcdFx0cmV0dXJuIDE7XG4gICAgXHR9IGVsc2Uge1xuICAgIFx0XHRyZXR1cm4gaXRlbS5pbml0aWFsWm9vbUxldmVsIDwgMC43ID8gMSA6IDEuMzM7XG4gICAgXHR9XG4gICAgfSxcbiAgICBtYXhTcHJlYWRab29tOiAxLjMzLFxuXHRtb2RhbDogdHJ1ZSxcblxuXHQvLyBub3QgZnVsbHkgaW1wbGVtZW50ZWQgeWV0XG5cdHNjYWxlTW9kZTogJ2ZpdCcgLy8gVE9ET1xufTtcbmZyYW1ld29yay5leHRlbmQoX29wdGlvbnMsIG9wdGlvbnMpO1xuXG5cbi8qKlxuICogUHJpdmF0ZSBoZWxwZXIgdmFyaWFibGVzICYgZnVuY3Rpb25zXG4gKi9cblxudmFyIF9nZXRFbXB0eVBvaW50ID0gZnVuY3Rpb24oKSB7IFxuXHRcdHJldHVybiB7eDowLHk6MH07IFxuXHR9O1xuXG52YXIgX2lzT3Blbixcblx0X2lzRGVzdHJveWluZyxcblx0X2Nsb3NlZEJ5U2Nyb2xsLFxuXHRfY3VycmVudEl0ZW1JbmRleCxcblx0X2NvbnRhaW5lclN0eWxlLFxuXHRfY29udGFpbmVyU2hpZnRJbmRleCxcblx0X2N1cnJQYW5EaXN0ID0gX2dldEVtcHR5UG9pbnQoKSxcblx0X3N0YXJ0UGFuT2Zmc2V0ID0gX2dldEVtcHR5UG9pbnQoKSxcblx0X3Bhbk9mZnNldCA9IF9nZXRFbXB0eVBvaW50KCksXG5cdF91cE1vdmVFdmVudHMsIC8vIGRyYWcgbW92ZSwgZHJhZyBlbmQgJiBkcmFnIGNhbmNlbCBldmVudHMgYXJyYXlcblx0X2Rvd25FdmVudHMsIC8vIGRyYWcgc3RhcnQgZXZlbnRzIGFycmF5XG5cdF9nbG9iYWxFdmVudEhhbmRsZXJzLFxuXHRfdmlld3BvcnRTaXplID0ge30sXG5cdF9jdXJyWm9vbUxldmVsLFxuXHRfc3RhcnRab29tTGV2ZWwsXG5cdF90cmFuc2xhdGVQcmVmaXgsXG5cdF90cmFuc2xhdGVTdWZpeCxcblx0X3VwZGF0ZVNpemVJbnRlcnZhbCxcblx0X2l0ZW1zTmVlZFVwZGF0ZSxcblx0X2N1cnJQb3NpdGlvbkluZGV4ID0gMCxcblx0X29mZnNldCA9IHt9LFxuXHRfc2xpZGVTaXplID0gX2dldEVtcHR5UG9pbnQoKSwgLy8gc2l6ZSBvZiBzbGlkZSBhcmVhLCBpbmNsdWRpbmcgc3BhY2luZ1xuXHRfaXRlbUhvbGRlcnMsXG5cdF9wcmV2SXRlbUluZGV4LFxuXHRfaW5kZXhEaWZmID0gMCwgLy8gZGlmZmVyZW5jZSBvZiBpbmRleGVzIHNpbmNlIGxhc3QgY29udGVudCB1cGRhdGVcblx0X2RyYWdTdGFydEV2ZW50LFxuXHRfZHJhZ01vdmVFdmVudCxcblx0X2RyYWdFbmRFdmVudCxcblx0X2RyYWdDYW5jZWxFdmVudCxcblx0X3RyYW5zZm9ybUtleSxcblx0X3BvaW50ZXJFdmVudEVuYWJsZWQsXG5cdF9pc0ZpeGVkUG9zaXRpb24gPSB0cnVlLFxuXHRfbGlrZWx5VG91Y2hEZXZpY2UsXG5cdF9tb2R1bGVzID0gW10sXG5cdF9yZXF1ZXN0QUYsXG5cdF9jYW5jZWxBRixcblx0X2luaXRhbENsYXNzTmFtZSxcblx0X2luaXRhbFdpbmRvd1Njcm9sbFksXG5cdF9vbGRJRSxcblx0X2N1cnJlbnRXaW5kb3dTY3JvbGxZLFxuXHRfZmVhdHVyZXMsXG5cdF93aW5kb3dWaXNpYmxlU2l6ZSA9IHt9LFxuXHRfcmVuZGVyTWF4UmVzb2x1dGlvbiA9IGZhbHNlLFxuXG5cdC8vIFJlZ2lzdGVycyBQaG90b1NXaXBlIG1vZHVsZSAoSGlzdG9yeSwgQ29udHJvbGxlciAuLi4pXG5cdF9yZWdpc3Rlck1vZHVsZSA9IGZ1bmN0aW9uKG5hbWUsIG1vZHVsZSkge1xuXHRcdGZyYW1ld29yay5leHRlbmQoc2VsZiwgbW9kdWxlLnB1YmxpY01ldGhvZHMpO1xuXHRcdF9tb2R1bGVzLnB1c2gobmFtZSk7XG5cdH0sXG5cblx0X2dldExvb3BlZElkID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0XHR2YXIgbnVtU2xpZGVzID0gX2dldE51bUl0ZW1zKCk7XG5cdFx0aWYoaW5kZXggPiBudW1TbGlkZXMgLSAxKSB7XG5cdFx0XHRyZXR1cm4gaW5kZXggLSBudW1TbGlkZXM7XG5cdFx0fSBlbHNlICBpZihpbmRleCA8IDApIHtcblx0XHRcdHJldHVybiBudW1TbGlkZXMgKyBpbmRleDtcblx0XHR9XG5cdFx0cmV0dXJuIGluZGV4O1xuXHR9LFxuXHRcblx0Ly8gTWljcm8gYmluZC90cmlnZ2VyXG5cdF9saXN0ZW5lcnMgPSB7fSxcblx0X2xpc3RlbiA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XG5cdFx0aWYoIV9saXN0ZW5lcnNbbmFtZV0pIHtcblx0XHRcdF9saXN0ZW5lcnNbbmFtZV0gPSBbXTtcblx0XHR9XG5cdFx0cmV0dXJuIF9saXN0ZW5lcnNbbmFtZV0ucHVzaChmbik7XG5cdH0sXG5cdF9zaG91dCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gX2xpc3RlbmVyc1tuYW1lXTtcblxuXHRcdGlmKGxpc3RlbmVycykge1xuXHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHRcdFx0YXJncy5zaGlmdCgpO1xuXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1tpXS5hcHBseShzZWxmLCBhcmdzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0X2dldEN1cnJlbnRUaW1lID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHR9LFxuXHRfYXBwbHlCZ09wYWNpdHkgPSBmdW5jdGlvbihvcGFjaXR5KSB7XG5cdFx0X2JnT3BhY2l0eSA9IG9wYWNpdHk7XG5cdFx0c2VsZi5iZy5zdHlsZS5vcGFjaXR5ID0gb3BhY2l0eSAqIF9vcHRpb25zLmJnT3BhY2l0eTtcblx0fSxcblxuXHRfYXBwbHlab29tVHJhbnNmb3JtID0gZnVuY3Rpb24oc3R5bGVPYmoseCx5LHpvb20saXRlbSkge1xuXHRcdGlmKCFfcmVuZGVyTWF4UmVzb2x1dGlvbiB8fCAoaXRlbSAmJiBpdGVtICE9PSBzZWxmLmN1cnJJdGVtKSApIHtcblx0XHRcdHpvb20gPSB6b29tIC8gKGl0ZW0gPyBpdGVtLmZpdFJhdGlvIDogc2VsZi5jdXJySXRlbS5maXRSYXRpbyk7XHRcblx0XHR9XG5cdFx0XHRcblx0XHRzdHlsZU9ialtfdHJhbnNmb3JtS2V5XSA9IF90cmFuc2xhdGVQcmVmaXggKyB4ICsgJ3B4LCAnICsgeSArICdweCcgKyBfdHJhbnNsYXRlU3VmaXggKyAnIHNjYWxlKCcgKyB6b29tICsgJyknO1xuXHR9LFxuXHRfYXBwbHlDdXJyZW50Wm9vbVBhbiA9IGZ1bmN0aW9uKCBhbGxvd1JlbmRlclJlc29sdXRpb24gKSB7XG5cdFx0aWYoX2N1cnJab29tRWxlbWVudFN0eWxlKSB7XG5cblx0XHRcdGlmKGFsbG93UmVuZGVyUmVzb2x1dGlvbikge1xuXHRcdFx0XHRpZihfY3Vyclpvb21MZXZlbCA+IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pIHtcblx0XHRcdFx0XHRpZighX3JlbmRlck1heFJlc29sdXRpb24pIHtcblx0XHRcdFx0XHRcdF9zZXRJbWFnZVNpemUoc2VsZi5jdXJySXRlbSwgZmFsc2UsIHRydWUpO1xuXHRcdFx0XHRcdFx0X3JlbmRlck1heFJlc29sdXRpb24gPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZihfcmVuZGVyTWF4UmVzb2x1dGlvbikge1xuXHRcdFx0XHRcdFx0X3NldEltYWdlU2l6ZShzZWxmLmN1cnJJdGVtKTtcblx0XHRcdFx0XHRcdF9yZW5kZXJNYXhSZXNvbHV0aW9uID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblxuXHRcdFx0X2FwcGx5Wm9vbVRyYW5zZm9ybShfY3Vyclpvb21FbGVtZW50U3R5bGUsIF9wYW5PZmZzZXQueCwgX3Bhbk9mZnNldC55LCBfY3Vyclpvb21MZXZlbCk7XG5cdFx0fVxuXHR9LFxuXHRfYXBwbHlab29tUGFuVG9JdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdGlmKGl0ZW0uY29udGFpbmVyKSB7XG5cblx0XHRcdF9hcHBseVpvb21UcmFuc2Zvcm0oaXRlbS5jb250YWluZXIuc3R5bGUsIFxuXHRcdFx0XHRcdFx0XHRcdGl0ZW0uaW5pdGlhbFBvc2l0aW9uLngsIFxuXHRcdFx0XHRcdFx0XHRcdGl0ZW0uaW5pdGlhbFBvc2l0aW9uLnksIFxuXHRcdFx0XHRcdFx0XHRcdGl0ZW0uaW5pdGlhbFpvb21MZXZlbCxcblx0XHRcdFx0XHRcdFx0XHRpdGVtKTtcblx0XHR9XG5cdH0sXG5cdF9zZXRUcmFuc2xhdGVYID0gZnVuY3Rpb24oeCwgZWxTdHlsZSkge1xuXHRcdGVsU3R5bGVbX3RyYW5zZm9ybUtleV0gPSBfdHJhbnNsYXRlUHJlZml4ICsgeCArICdweCwgMHB4JyArIF90cmFuc2xhdGVTdWZpeDtcblx0fSxcblx0X21vdmVNYWluU2Nyb2xsID0gZnVuY3Rpb24oeCwgZHJhZ2dpbmcpIHtcblxuXHRcdGlmKCFfb3B0aW9ucy5sb29wICYmIGRyYWdnaW5nKSB7XG5cdFx0XHR2YXIgbmV3U2xpZGVJbmRleE9mZnNldCA9IF9jdXJyZW50SXRlbUluZGV4ICsgKF9zbGlkZVNpemUueCAqIF9jdXJyUG9zaXRpb25JbmRleCAtIHgpIC8gX3NsaWRlU2l6ZS54LFxuXHRcdFx0XHRkZWx0YSA9IE1hdGgucm91bmQoeCAtIF9tYWluU2Nyb2xsUG9zLngpO1xuXG5cdFx0XHRpZiggKG5ld1NsaWRlSW5kZXhPZmZzZXQgPCAwICYmIGRlbHRhID4gMCkgfHwgXG5cdFx0XHRcdChuZXdTbGlkZUluZGV4T2Zmc2V0ID49IF9nZXROdW1JdGVtcygpIC0gMSAmJiBkZWx0YSA8IDApICkge1xuXHRcdFx0XHR4ID0gX21haW5TY3JvbGxQb3MueCArIGRlbHRhICogX29wdGlvbnMubWFpblNjcm9sbEVuZEZyaWN0aW9uO1xuXHRcdFx0fSBcblx0XHR9XG5cdFx0XG5cdFx0X21haW5TY3JvbGxQb3MueCA9IHg7XG5cdFx0X3NldFRyYW5zbGF0ZVgoeCwgX2NvbnRhaW5lclN0eWxlKTtcblx0fSxcblx0X2NhbGN1bGF0ZVBhbk9mZnNldCA9IGZ1bmN0aW9uKGF4aXMsIHpvb21MZXZlbCkge1xuXHRcdHZhciBtID0gX21pZFpvb21Qb2ludFtheGlzXSAtIF9vZmZzZXRbYXhpc107XG5cdFx0cmV0dXJuIF9zdGFydFBhbk9mZnNldFtheGlzXSArIF9jdXJyUGFuRGlzdFtheGlzXSArIG0gLSBtICogKCB6b29tTGV2ZWwgLyBfc3RhcnRab29tTGV2ZWwgKTtcblx0fSxcblx0XG5cdF9lcXVhbGl6ZVBvaW50cyA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRcdHAxLnggPSBwMi54O1xuXHRcdHAxLnkgPSBwMi55O1xuXHRcdGlmKHAyLmlkKSB7XG5cdFx0XHRwMS5pZCA9IHAyLmlkO1xuXHRcdH1cblx0fSxcblx0X3JvdW5kUG9pbnQgPSBmdW5jdGlvbihwKSB7XG5cdFx0cC54ID0gTWF0aC5yb3VuZChwLngpO1xuXHRcdHAueSA9IE1hdGgucm91bmQocC55KTtcblx0fSxcblxuXHRfbW91c2VNb3ZlVGltZW91dCA9IG51bGwsXG5cdF9vbkZpcnN0TW91c2VNb3ZlID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gV2FpdCB1bnRpbCBtb3VzZSBtb3ZlIGV2ZW50IGlzIGZpcmVkIGF0IGxlYXN0IHR3aWNlIGR1cmluZyAxMDBtc1xuXHRcdC8vIFdlIGRvIHRoaXMsIGJlY2F1c2Ugc29tZSBtb2JpbGUgYnJvd3NlcnMgdHJpZ2dlciBpdCBvbiB0b3VjaHN0YXJ0XG5cdFx0aWYoX21vdXNlTW92ZVRpbWVvdXQgKSB7IFxuXHRcdFx0ZnJhbWV3b3JrLnVuYmluZChkb2N1bWVudCwgJ21vdXNlbW92ZScsIF9vbkZpcnN0TW91c2VNb3ZlKTtcblx0XHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWhhc19tb3VzZScpO1xuXHRcdFx0X29wdGlvbnMubW91c2VVc2VkID0gdHJ1ZTtcblx0XHRcdF9zaG91dCgnbW91c2VVc2VkJyk7XG5cdFx0fVxuXHRcdF9tb3VzZU1vdmVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdF9tb3VzZU1vdmVUaW1lb3V0ID0gbnVsbDtcblx0XHR9LCAxMDApO1xuXHR9LFxuXG5cdF9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0ZnJhbWV3b3JrLmJpbmQoZG9jdW1lbnQsICdrZXlkb3duJywgc2VsZik7XG5cblx0XHRpZihfZmVhdHVyZXMudHJhbnNmb3JtKSB7XG5cdFx0XHQvLyBkb24ndCBiaW5kIGNsaWNrIGV2ZW50IGluIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0cmFuc2Zvcm0gKG1vc3RseSBJRTgpXG5cdFx0XHRmcmFtZXdvcmsuYmluZChzZWxmLnNjcm9sbFdyYXAsICdjbGljaycsIHNlbGYpO1xuXHRcdH1cblx0XHRcblxuXHRcdGlmKCFfb3B0aW9ucy5tb3VzZVVzZWQpIHtcblx0XHRcdGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX29uRmlyc3RNb3VzZU1vdmUpO1xuXHRcdH1cblxuXHRcdGZyYW1ld29yay5iaW5kKHdpbmRvdywgJ3Jlc2l6ZSBzY3JvbGwnLCBzZWxmKTtcblxuXHRcdF9zaG91dCgnYmluZEV2ZW50cycpO1xuXHR9LFxuXG5cdF91bmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcblx0XHRmcmFtZXdvcmsudW5iaW5kKHdpbmRvdywgJ3Jlc2l6ZScsIHNlbGYpO1xuXHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCAnc2Nyb2xsJywgX2dsb2JhbEV2ZW50SGFuZGxlcnMuc2Nyb2xsKTtcblx0XHRmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCAna2V5ZG93bicsIHNlbGYpO1xuXHRcdGZyYW1ld29yay51bmJpbmQoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBfb25GaXJzdE1vdXNlTW92ZSk7XG5cblx0XHRpZihfZmVhdHVyZXMudHJhbnNmb3JtKSB7XG5cdFx0XHRmcmFtZXdvcmsudW5iaW5kKHNlbGYuc2Nyb2xsV3JhcCwgJ2NsaWNrJywgc2VsZik7XG5cdFx0fVxuXG5cdFx0aWYoX2lzRHJhZ2dpbmcpIHtcblx0XHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCBfdXBNb3ZlRXZlbnRzLCBzZWxmKTtcblx0XHR9XG5cblx0XHRfc2hvdXQoJ3VuYmluZEV2ZW50cycpO1xuXHR9LFxuXHRcblx0X2NhbGN1bGF0ZVBhbkJvdW5kcyA9IGZ1bmN0aW9uKHpvb21MZXZlbCwgdXBkYXRlKSB7XG5cdFx0dmFyIGJvdW5kcyA9IF9jYWxjdWxhdGVJdGVtU2l6ZSggc2VsZi5jdXJySXRlbSwgX3ZpZXdwb3J0U2l6ZSwgem9vbUxldmVsICk7XG5cdFx0aWYodXBkYXRlKSB7XG5cdFx0XHRfY3VyclBhbkJvdW5kcyA9IGJvdW5kcztcblx0XHR9XG5cdFx0cmV0dXJuIGJvdW5kcztcblx0fSxcblx0XG5cdF9nZXRNaW5ab29tTGV2ZWwgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0aWYoIWl0ZW0pIHtcblx0XHRcdGl0ZW0gPSBzZWxmLmN1cnJJdGVtO1xuXHRcdH1cblx0XHRyZXR1cm4gaXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXHR9LFxuXHRfZ2V0TWF4Wm9vbUxldmVsID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdGlmKCFpdGVtKSB7XG5cdFx0XHRpdGVtID0gc2VsZi5jdXJySXRlbTtcblx0XHR9XG5cdFx0cmV0dXJuIGl0ZW0udyA+IDAgPyBfb3B0aW9ucy5tYXhTcHJlYWRab29tIDogMTtcblx0fSxcblxuXHQvLyBSZXR1cm4gdHJ1ZSBpZiBvZmZzZXQgaXMgb3V0IG9mIHRoZSBib3VuZHNcblx0X21vZGlmeURlc3RQYW5PZmZzZXQgPSBmdW5jdGlvbihheGlzLCBkZXN0UGFuQm91bmRzLCBkZXN0UGFuT2Zmc2V0LCBkZXN0Wm9vbUxldmVsKSB7XG5cdFx0aWYoZGVzdFpvb21MZXZlbCA9PT0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsKSB7XG5cdFx0XHRkZXN0UGFuT2Zmc2V0W2F4aXNdID0gc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb25bYXhpc107XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVzdFBhbk9mZnNldFtheGlzXSA9IF9jYWxjdWxhdGVQYW5PZmZzZXQoYXhpcywgZGVzdFpvb21MZXZlbCk7IFxuXG5cdFx0XHRpZihkZXN0UGFuT2Zmc2V0W2F4aXNdID4gZGVzdFBhbkJvdW5kcy5taW5bYXhpc10pIHtcblx0XHRcdFx0ZGVzdFBhbk9mZnNldFtheGlzXSA9IGRlc3RQYW5Cb3VuZHMubWluW2F4aXNdO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0gZWxzZSBpZihkZXN0UGFuT2Zmc2V0W2F4aXNdIDwgZGVzdFBhbkJvdW5kcy5tYXhbYXhpc10gKSB7XG5cdFx0XHRcdGRlc3RQYW5PZmZzZXRbYXhpc10gPSBkZXN0UGFuQm91bmRzLm1heFtheGlzXTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRfc2V0dXBUcmFuc2Zvcm1zID0gZnVuY3Rpb24oKSB7XG5cblx0XHRpZihfdHJhbnNmb3JtS2V5KSB7XG5cdFx0XHQvLyBzZXR1cCAzZCB0cmFuc2Zvcm1zXG5cdFx0XHR2YXIgYWxsb3czZFRyYW5zZm9ybSA9IF9mZWF0dXJlcy5wZXJzcGVjdGl2ZSAmJiAhX2xpa2VseVRvdWNoRGV2aWNlO1xuXHRcdFx0X3RyYW5zbGF0ZVByZWZpeCA9ICd0cmFuc2xhdGUnICsgKGFsbG93M2RUcmFuc2Zvcm0gPyAnM2QoJyA6ICcoJyk7XG5cdFx0XHRfdHJhbnNsYXRlU3VmaXggPSBfZmVhdHVyZXMucGVyc3BlY3RpdmUgPyAnLCAwcHgpJyA6ICcpJztcdFxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIE92ZXJyaWRlIHpvb20vcGFuL21vdmUgZnVuY3Rpb25zIGluIGNhc2Ugb2xkIGJyb3dzZXIgaXMgdXNlZCAobW9zdCBsaWtlbHkgSUUpXG5cdFx0Ly8gKHNvIHRoZXkgdXNlIGxlZnQvdG9wL3dpZHRoL2hlaWdodCwgaW5zdGVhZCBvZiBDU1MgdHJhbnNmb3JtKVxuXHRcblx0XHRfdHJhbnNmb3JtS2V5ID0gJ2xlZnQnO1xuXHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWllJyk7XG5cblx0XHRfc2V0VHJhbnNsYXRlWCA9IGZ1bmN0aW9uKHgsIGVsU3R5bGUpIHtcblx0XHRcdGVsU3R5bGUubGVmdCA9IHggKyAncHgnO1xuXHRcdH07XG5cdFx0X2FwcGx5Wm9vbVBhblRvSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuXHRcdFx0dmFyIHpvb21SYXRpbyA9IGl0ZW0uZml0UmF0aW8gPiAxID8gMSA6IGl0ZW0uZml0UmF0aW8sXG5cdFx0XHRcdHMgPSBpdGVtLmNvbnRhaW5lci5zdHlsZSxcblx0XHRcdFx0dyA9IHpvb21SYXRpbyAqIGl0ZW0udyxcblx0XHRcdFx0aCA9IHpvb21SYXRpbyAqIGl0ZW0uaDtcblxuXHRcdFx0cy53aWR0aCA9IHcgKyAncHgnO1xuXHRcdFx0cy5oZWlnaHQgPSBoICsgJ3B4Jztcblx0XHRcdHMubGVmdCA9IGl0ZW0uaW5pdGlhbFBvc2l0aW9uLnggKyAncHgnO1xuXHRcdFx0cy50b3AgPSBpdGVtLmluaXRpYWxQb3NpdGlvbi55ICsgJ3B4JztcblxuXHRcdH07XG5cdFx0X2FwcGx5Q3VycmVudFpvb21QYW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmKF9jdXJyWm9vbUVsZW1lbnRTdHlsZSkge1xuXG5cdFx0XHRcdHZhciBzID0gX2N1cnJab29tRWxlbWVudFN0eWxlLFxuXHRcdFx0XHRcdGl0ZW0gPSBzZWxmLmN1cnJJdGVtLFxuXHRcdFx0XHRcdHpvb21SYXRpbyA9IGl0ZW0uZml0UmF0aW8gPiAxID8gMSA6IGl0ZW0uZml0UmF0aW8sXG5cdFx0XHRcdFx0dyA9IHpvb21SYXRpbyAqIGl0ZW0udyxcblx0XHRcdFx0XHRoID0gem9vbVJhdGlvICogaXRlbS5oO1xuXG5cdFx0XHRcdHMud2lkdGggPSB3ICsgJ3B4Jztcblx0XHRcdFx0cy5oZWlnaHQgPSBoICsgJ3B4JztcblxuXG5cdFx0XHRcdHMubGVmdCA9IF9wYW5PZmZzZXQueCArICdweCc7XG5cdFx0XHRcdHMudG9wID0gX3Bhbk9mZnNldC55ICsgJ3B4Jztcblx0XHRcdH1cblx0XHRcdFxuXHRcdH07XG5cdH0sXG5cblx0X29uS2V5RG93biA9IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIga2V5ZG93bkFjdGlvbiA9ICcnO1xuXHRcdGlmKF9vcHRpb25zLmVzY0tleSAmJiBlLmtleUNvZGUgPT09IDI3KSB7IFxuXHRcdFx0a2V5ZG93bkFjdGlvbiA9ICdjbG9zZSc7XG5cdFx0fSBlbHNlIGlmKF9vcHRpb25zLmFycm93S2V5cykge1xuXHRcdFx0aWYoZS5rZXlDb2RlID09PSAzNykge1xuXHRcdFx0XHRrZXlkb3duQWN0aW9uID0gJ3ByZXYnO1xuXHRcdFx0fSBlbHNlIGlmKGUua2V5Q29kZSA9PT0gMzkpIHsgXG5cdFx0XHRcdGtleWRvd25BY3Rpb24gPSAnbmV4dCc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoa2V5ZG93bkFjdGlvbikge1xuXHRcdFx0Ly8gZG9uJ3QgZG8gYW55dGhpbmcgaWYgc3BlY2lhbCBrZXkgcHJlc3NlZCB0byBwcmV2ZW50IGZyb20gb3ZlcnJpZGluZyBkZWZhdWx0IGJyb3dzZXIgYWN0aW9uc1xuXHRcdFx0Ly8gZS5nLiBpbiBDaHJvbWUgb24gTWFjIGNtZCthcnJvdy1sZWZ0IHJldHVybnMgdG8gcHJldmlvdXMgcGFnZVxuXHRcdFx0aWYoICFlLmN0cmxLZXkgJiYgIWUuYWx0S2V5ICYmICFlLnNoaWZ0S2V5ICYmICFlLm1ldGFLZXkgKSB7XG5cdFx0XHRcdGlmKGUucHJldmVudERlZmF1bHQpIHtcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXHRcdFx0XHR9IFxuXHRcdFx0XHRzZWxmW2tleWRvd25BY3Rpb25dKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdF9vbkdsb2JhbENsaWNrID0gZnVuY3Rpb24oZSkge1xuXHRcdGlmKCFlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gZG9uJ3QgYWxsb3cgY2xpY2sgZXZlbnQgdG8gcGFzcyB0aHJvdWdoIHdoZW4gdHJpZ2dlcmluZyBhZnRlciBkcmFnIG9yIHNvbWUgb3RoZXIgZ2VzdHVyZVxuXHRcdGlmKF9tb3ZlZCB8fCBfem9vbVN0YXJ0ZWQgfHwgX21haW5TY3JvbGxBbmltYXRpbmcgfHwgX3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cdH0sXG5cblx0X3VwZGF0ZVBhZ2VTY3JvbGxPZmZzZXQgPSBmdW5jdGlvbigpIHtcblx0XHRzZWxmLnNldFNjcm9sbE9mZnNldCgwLCBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpKTtcdFx0XG5cdH07XG5cdFxuXG5cblx0XG5cblxuXG4vLyBNaWNybyBhbmltYXRpb24gZW5naW5lXG52YXIgX2FuaW1hdGlvbnMgPSB7fSxcblx0X251bUFuaW1hdGlvbnMgPSAwLFxuXHRfc3RvcEFuaW1hdGlvbiA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRpZihfYW5pbWF0aW9uc1tuYW1lXSkge1xuXHRcdFx0aWYoX2FuaW1hdGlvbnNbbmFtZV0ucmFmKSB7XG5cdFx0XHRcdF9jYW5jZWxBRiggX2FuaW1hdGlvbnNbbmFtZV0ucmFmICk7XG5cdFx0XHR9XG5cdFx0XHRfbnVtQW5pbWF0aW9ucy0tO1xuXHRcdFx0ZGVsZXRlIF9hbmltYXRpb25zW25hbWVdO1xuXHRcdH1cblx0fSxcblx0X3JlZ2lzdGVyU3RhcnRBbmltYXRpb24gPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0aWYoX2FuaW1hdGlvbnNbbmFtZV0pIHtcblx0XHRcdF9zdG9wQW5pbWF0aW9uKG5hbWUpO1xuXHRcdH1cblx0XHRpZighX2FuaW1hdGlvbnNbbmFtZV0pIHtcblx0XHRcdF9udW1BbmltYXRpb25zKys7XG5cdFx0XHRfYW5pbWF0aW9uc1tuYW1lXSA9IHt9O1xuXHRcdH1cblx0fSxcblx0X3N0b3BBbGxBbmltYXRpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBfYW5pbWF0aW9ucykge1xuXG5cdFx0XHRpZiggX2FuaW1hdGlvbnMuaGFzT3duUHJvcGVydHkoIHByb3AgKSApIHtcblx0XHRcdFx0X3N0b3BBbmltYXRpb24ocHJvcCk7XG5cdFx0XHR9IFxuXHRcdFx0XG5cdFx0fVxuXHR9LFxuXHRfYW5pbWF0ZVByb3AgPSBmdW5jdGlvbihuYW1lLCBiLCBlbmRQcm9wLCBkLCBlYXNpbmdGbiwgb25VcGRhdGUsIG9uQ29tcGxldGUpIHtcblx0XHR2YXIgc3RhcnRBbmltVGltZSA9IF9nZXRDdXJyZW50VGltZSgpLCB0O1xuXHRcdF9yZWdpc3RlclN0YXJ0QW5pbWF0aW9uKG5hbWUpO1xuXG5cdFx0dmFyIGFuaW1sb29wID0gZnVuY3Rpb24oKXtcblx0XHRcdGlmICggX2FuaW1hdGlvbnNbbmFtZV0gKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHR0ID0gX2dldEN1cnJlbnRUaW1lKCkgLSBzdGFydEFuaW1UaW1lOyAvLyB0aW1lIGRpZmZcblx0XHRcdFx0Ly9iIC0gYmVnaW5uaW5nIChzdGFydCBwcm9wKVxuXHRcdFx0XHQvL2QgLSBhbmltIGR1cmF0aW9uXG5cblx0XHRcdFx0aWYgKCB0ID49IGQgKSB7XG5cdFx0XHRcdFx0X3N0b3BBbmltYXRpb24obmFtZSk7XG5cdFx0XHRcdFx0b25VcGRhdGUoZW5kUHJvcCk7XG5cdFx0XHRcdFx0aWYob25Db21wbGV0ZSkge1xuXHRcdFx0XHRcdFx0b25Db21wbGV0ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0b25VcGRhdGUoIChlbmRQcm9wIC0gYikgKiBlYXNpbmdGbih0L2QpICsgYiApO1xuXG5cdFx0XHRcdF9hbmltYXRpb25zW25hbWVdLnJhZiA9IF9yZXF1ZXN0QUYoYW5pbWxvb3ApO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0YW5pbWxvb3AoKTtcblx0fTtcblx0XG5cblxudmFyIHB1YmxpY01ldGhvZHMgPSB7XG5cblx0Ly8gbWFrZSBhIGZldyBsb2NhbCB2YXJpYWJsZXMgYW5kIGZ1bmN0aW9ucyBwdWJsaWNcblx0c2hvdXQ6IF9zaG91dCxcblx0bGlzdGVuOiBfbGlzdGVuLFxuXHR2aWV3cG9ydFNpemU6IF92aWV3cG9ydFNpemUsXG5cdG9wdGlvbnM6IF9vcHRpb25zLFxuXG5cdGlzTWFpblNjcm9sbEFuaW1hdGluZzogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9tYWluU2Nyb2xsQW5pbWF0aW5nO1xuXHR9LFxuXHRnZXRab29tTGV2ZWw6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfY3Vyclpvb21MZXZlbDtcblx0fSxcblx0Z2V0Q3VycmVudEluZGV4OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2N1cnJlbnRJdGVtSW5kZXg7XG5cdH0sXG5cdGlzRHJhZ2dpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfaXNEcmFnZ2luZztcblx0fSxcdFxuXHRpc1pvb21pbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfaXNab29taW5nO1xuXHR9LFxuXHRzZXRTY3JvbGxPZmZzZXQ6IGZ1bmN0aW9uKHgseSkge1xuXHRcdF9vZmZzZXQueCA9IHg7XG5cdFx0X2N1cnJlbnRXaW5kb3dTY3JvbGxZID0gX29mZnNldC55ID0geTtcblx0XHRfc2hvdXQoJ3VwZGF0ZVNjcm9sbE9mZnNldCcsIF9vZmZzZXQpO1xuXHR9LFxuXHRhcHBseVpvb21QYW46IGZ1bmN0aW9uKHpvb21MZXZlbCxwYW5YLHBhblksYWxsb3dSZW5kZXJSZXNvbHV0aW9uKSB7XG5cdFx0X3Bhbk9mZnNldC54ID0gcGFuWDtcblx0XHRfcGFuT2Zmc2V0LnkgPSBwYW5ZO1xuXHRcdF9jdXJyWm9vbUxldmVsID0gem9vbUxldmVsO1xuXHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCBhbGxvd1JlbmRlclJlc29sdXRpb24gKTtcblx0fSxcblxuXHRpbml0OiBmdW5jdGlvbigpIHtcblxuXHRcdGlmKF9pc09wZW4gfHwgX2lzRGVzdHJveWluZykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBpO1xuXG5cdFx0c2VsZi5mcmFtZXdvcmsgPSBmcmFtZXdvcms7IC8vIGJhc2ljIGZ1bmN0aW9uYWxpdHlcblx0XHRzZWxmLnRlbXBsYXRlID0gdGVtcGxhdGU7IC8vIHJvb3QgRE9NIGVsZW1lbnQgb2YgUGhvdG9Td2lwZVxuXHRcdHNlbGYuYmcgPSBmcmFtZXdvcmsuZ2V0Q2hpbGRCeUNsYXNzKHRlbXBsYXRlLCAncHN3cF9fYmcnKTtcblxuXHRcdF9pbml0YWxDbGFzc05hbWUgPSB0ZW1wbGF0ZS5jbGFzc05hbWU7XG5cdFx0X2lzT3BlbiA9IHRydWU7XG5cdFx0XHRcdFxuXHRcdF9mZWF0dXJlcyA9IGZyYW1ld29yay5kZXRlY3RGZWF0dXJlcygpO1xuXHRcdF9yZXF1ZXN0QUYgPSBfZmVhdHVyZXMucmFmO1xuXHRcdF9jYW5jZWxBRiA9IF9mZWF0dXJlcy5jYWY7XG5cdFx0X3RyYW5zZm9ybUtleSA9IF9mZWF0dXJlcy50cmFuc2Zvcm07XG5cdFx0X29sZElFID0gX2ZlYXR1cmVzLm9sZElFO1xuXHRcdFxuXHRcdHNlbGYuc2Nyb2xsV3JhcCA9IGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3ModGVtcGxhdGUsICdwc3dwX19zY3JvbGwtd3JhcCcpO1xuXHRcdHNlbGYuY29udGFpbmVyID0gZnJhbWV3b3JrLmdldENoaWxkQnlDbGFzcyhzZWxmLnNjcm9sbFdyYXAsICdwc3dwX19jb250YWluZXInKTtcblxuXHRcdF9jb250YWluZXJTdHlsZSA9IHNlbGYuY29udGFpbmVyLnN0eWxlOyAvLyBmb3IgZmFzdCBhY2Nlc3NcblxuXHRcdC8vIE9iamVjdHMgdGhhdCBob2xkIHNsaWRlcyAodGhlcmUgYXJlIG9ubHkgMyBpbiBET00pXG5cdFx0c2VsZi5pdGVtSG9sZGVycyA9IF9pdGVtSG9sZGVycyA9IFtcblx0XHRcdHtlbDpzZWxmLmNvbnRhaW5lci5jaGlsZHJlblswXSAsIHdyYXA6MCwgaW5kZXg6IC0xfSxcblx0XHRcdHtlbDpzZWxmLmNvbnRhaW5lci5jaGlsZHJlblsxXSAsIHdyYXA6MCwgaW5kZXg6IC0xfSxcblx0XHRcdHtlbDpzZWxmLmNvbnRhaW5lci5jaGlsZHJlblsyXSAsIHdyYXA6MCwgaW5kZXg6IC0xfVxuXHRcdF07XG5cblx0XHQvLyBoaWRlIG5lYXJieSBpdGVtIGhvbGRlcnMgdW50aWwgaW5pdGlhbCB6b29tIGFuaW1hdGlvbiBmaW5pc2hlcyAodG8gYXZvaWQgZXh0cmEgUGFpbnRzKVxuXHRcdF9pdGVtSG9sZGVyc1swXS5lbC5zdHlsZS5kaXNwbGF5ID0gX2l0ZW1Ib2xkZXJzWzJdLmVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cblx0XHRfc2V0dXBUcmFuc2Zvcm1zKCk7XG5cblx0XHQvLyBTZXR1cCBnbG9iYWwgZXZlbnRzXG5cdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMgPSB7XG5cdFx0XHRyZXNpemU6IHNlbGYudXBkYXRlU2l6ZSxcblx0XHRcdHNjcm9sbDogX3VwZGF0ZVBhZ2VTY3JvbGxPZmZzZXQsXG5cdFx0XHRrZXlkb3duOiBfb25LZXlEb3duLFxuXHRcdFx0Y2xpY2s6IF9vbkdsb2JhbENsaWNrXG5cdFx0fTtcblxuXHRcdC8vIGRpc2FibGUgc2hvdy9oaWRlIGVmZmVjdHMgb24gb2xkIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBDU1MgYW5pbWF0aW9ucyBvciB0cmFuc2Zvcm1zLCBcblx0XHQvLyBvbGQgSU9TLCBBbmRyb2lkIGFuZCBPcGVyYSBtb2JpbGUuIEJsYWNrYmVycnkgc2VlbXMgdG8gd29yayBmaW5lLCBldmVuIG9sZGVyIG1vZGVscy5cblx0XHR2YXIgb2xkUGhvbmUgPSBfZmVhdHVyZXMuaXNPbGRJT1NQaG9uZSB8fCBfZmVhdHVyZXMuaXNPbGRBbmRyb2lkIHx8IF9mZWF0dXJlcy5pc01vYmlsZU9wZXJhO1xuXHRcdGlmKCFfZmVhdHVyZXMuYW5pbWF0aW9uTmFtZSB8fCAhX2ZlYXR1cmVzLnRyYW5zZm9ybSB8fCBvbGRQaG9uZSkge1xuXHRcdFx0X29wdGlvbnMuc2hvd0FuaW1hdGlvbkR1cmF0aW9uID0gX29wdGlvbnMuaGlkZUFuaW1hdGlvbkR1cmF0aW9uID0gMDtcblx0XHR9XG5cblx0XHQvLyBpbml0IG1vZHVsZXNcblx0XHRmb3IoaSA9IDA7IGkgPCBfbW9kdWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0c2VsZlsnaW5pdCcgKyBfbW9kdWxlc1tpXV0oKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gaW5pdFxuXHRcdGlmKFVpQ2xhc3MpIHtcblx0XHRcdHZhciB1aSA9IHNlbGYudWkgPSBuZXcgVWlDbGFzcyhzZWxmLCBmcmFtZXdvcmspO1xuXHRcdFx0dWkuaW5pdCgpO1xuXHRcdH1cblxuXHRcdF9zaG91dCgnZmlyc3RVcGRhdGUnKTtcblx0XHRfY3VycmVudEl0ZW1JbmRleCA9IF9jdXJyZW50SXRlbUluZGV4IHx8IF9vcHRpb25zLmluZGV4IHx8IDA7XG5cdFx0Ly8gdmFsaWRhdGUgaW5kZXhcblx0XHRpZiggaXNOYU4oX2N1cnJlbnRJdGVtSW5kZXgpIHx8IF9jdXJyZW50SXRlbUluZGV4IDwgMCB8fCBfY3VycmVudEl0ZW1JbmRleCA+PSBfZ2V0TnVtSXRlbXMoKSApIHtcblx0XHRcdF9jdXJyZW50SXRlbUluZGV4ID0gMDtcblx0XHR9XG5cdFx0c2VsZi5jdXJySXRlbSA9IF9nZXRJdGVtQXQoIF9jdXJyZW50SXRlbUluZGV4ICk7XG5cblx0XHRcblx0XHRpZihfZmVhdHVyZXMuaXNPbGRJT1NQaG9uZSB8fCBfZmVhdHVyZXMuaXNPbGRBbmRyb2lkKSB7XG5cdFx0XHRfaXNGaXhlZFBvc2l0aW9uID0gZmFsc2U7XG5cdFx0fVxuXHRcdFxuXHRcdHRlbXBsYXRlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcblx0XHRpZihfb3B0aW9ucy5tb2RhbCkge1xuXHRcdFx0aWYoIV9pc0ZpeGVkUG9zaXRpb24pIHtcblx0XHRcdFx0dGVtcGxhdGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS50b3AgPSBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpICsgJ3B4Jztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRlbXBsYXRlLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZihfY3VycmVudFdpbmRvd1Njcm9sbFkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0X3Nob3V0KCdpbml0aWFsTGF5b3V0Jyk7XG5cdFx0XHRfY3VycmVudFdpbmRvd1Njcm9sbFkgPSBfaW5pdGFsV2luZG93U2Nyb2xsWSA9IGZyYW1ld29yay5nZXRTY3JvbGxZKCk7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGFkZCBjbGFzc2VzIHRvIHJvb3QgZWxlbWVudCBvZiBQaG90b1N3aXBlXG5cdFx0dmFyIHJvb3RDbGFzc2VzID0gJ3Bzd3AtLW9wZW4gJztcblx0XHRpZihfb3B0aW9ucy5tYWluQ2xhc3MpIHtcblx0XHRcdHJvb3RDbGFzc2VzICs9IF9vcHRpb25zLm1haW5DbGFzcyArICcgJztcblx0XHR9XG5cdFx0aWYoX29wdGlvbnMuc2hvd0hpZGVPcGFjaXR5KSB7XG5cdFx0XHRyb290Q2xhc3NlcyArPSAncHN3cC0tYW5pbWF0ZV9vcGFjaXR5ICc7XG5cdFx0fVxuXHRcdHJvb3RDbGFzc2VzICs9IF9saWtlbHlUb3VjaERldmljZSA/ICdwc3dwLS10b3VjaCcgOiAncHN3cC0tbm90b3VjaCc7XG5cdFx0cm9vdENsYXNzZXMgKz0gX2ZlYXR1cmVzLmFuaW1hdGlvbk5hbWUgPyAnIHBzd3AtLWNzc19hbmltYXRpb24nIDogJyc7XG5cdFx0cm9vdENsYXNzZXMgKz0gX2ZlYXR1cmVzLnN2ZyA/ICcgcHN3cC0tc3ZnJyA6ICcnO1xuXHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgcm9vdENsYXNzZXMpO1xuXG5cdFx0c2VsZi51cGRhdGVTaXplKCk7XG5cblx0XHQvLyBpbml0aWFsIHVwZGF0ZVxuXHRcdF9jb250YWluZXJTaGlmdEluZGV4ID0gLTE7XG5cdFx0X2luZGV4RGlmZiA9IG51bGw7XG5cdFx0Zm9yKGkgPSAwOyBpIDwgTlVNX0hPTERFUlM7IGkrKykge1xuXHRcdFx0X3NldFRyYW5zbGF0ZVgoIChpK19jb250YWluZXJTaGlmdEluZGV4KSAqIF9zbGlkZVNpemUueCwgX2l0ZW1Ib2xkZXJzW2ldLmVsLnN0eWxlKTtcblx0XHR9XG5cblx0XHRpZighX29sZElFKSB7XG5cdFx0XHRmcmFtZXdvcmsuYmluZChzZWxmLnNjcm9sbFdyYXAsIF9kb3duRXZlbnRzLCBzZWxmKTsgLy8gbm8gZHJhZ2dpbmcgZm9yIG9sZCBJRVxuXHRcdH1cdFxuXG5cdFx0X2xpc3RlbignaW5pdGlhbFpvb21JbkVuZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zZXRDb250ZW50KF9pdGVtSG9sZGVyc1swXSwgX2N1cnJlbnRJdGVtSW5kZXgtMSk7XG5cdFx0XHRzZWxmLnNldENvbnRlbnQoX2l0ZW1Ib2xkZXJzWzJdLCBfY3VycmVudEl0ZW1JbmRleCsxKTtcblxuXHRcdFx0X2l0ZW1Ib2xkZXJzWzBdLmVsLnN0eWxlLmRpc3BsYXkgPSBfaXRlbUhvbGRlcnNbMl0uZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cblx0XHRcdGlmKF9vcHRpb25zLmZvY3VzKSB7XG5cdFx0XHRcdC8vIGZvY3VzIGNhdXNlcyBsYXlvdXQsIFxuXHRcdFx0XHQvLyB3aGljaCBjYXVzZXMgbGFnIGR1cmluZyB0aGUgYW5pbWF0aW9uLCBcblx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBkZWxheSBpdCB1bnRpbGwgdGhlIGluaXRpYWwgem9vbSB0cmFuc2l0aW9uIGVuZHNcblx0XHRcdFx0dGVtcGxhdGUuZm9jdXMoKTtcblx0XHRcdH1cblx0XHRcdCBcblxuXHRcdFx0X2JpbmRFdmVudHMoKTtcblx0XHR9KTtcblxuXHRcdC8vIHNldCBjb250ZW50IGZvciBjZW50ZXIgc2xpZGUgKGZpcnN0IHRpbWUpXG5cdFx0c2VsZi5zZXRDb250ZW50KF9pdGVtSG9sZGVyc1sxXSwgX2N1cnJlbnRJdGVtSW5kZXgpO1xuXHRcdFxuXHRcdHNlbGYudXBkYXRlQ3Vyckl0ZW0oKTtcblxuXHRcdF9zaG91dCgnYWZ0ZXJJbml0Jyk7XG5cblx0XHRpZighX2lzRml4ZWRQb3NpdGlvbikge1xuXG5cdFx0XHQvLyBPbiBhbGwgdmVyc2lvbnMgb2YgaU9TIGxvd2VyIHRoYW4gOC4wLCB3ZSBjaGVjayBzaXplIG9mIHZpZXdwb3J0IGV2ZXJ5IHNlY29uZC5cblx0XHRcdC8vIFxuXHRcdFx0Ly8gVGhpcyBpcyBkb25lIHRvIGRldGVjdCB3aGVuIFNhZmFyaSB0b3AgJiBib3R0b20gYmFycyBhcHBlYXIsIFxuXHRcdFx0Ly8gYXMgdGhpcyBhY3Rpb24gZG9lc24ndCB0cmlnZ2VyIGFueSBldmVudHMgKGxpa2UgcmVzaXplKS4gXG5cdFx0XHQvLyBcblx0XHRcdC8vIE9uIGlPUzggdGhleSBmaXhlZCB0aGlzLlxuXHRcdFx0Ly8gXG5cdFx0XHQvLyAxMCBOb3YgMjAxNDogaU9TIDcgdXNhZ2UgfjQwJS4gaU9TIDggdXNhZ2UgNTYlLlxuXHRcdFx0XG5cdFx0XHRfdXBkYXRlU2l6ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmKCFfbnVtQW5pbWF0aW9ucyAmJiAhX2lzRHJhZ2dpbmcgJiYgIV9pc1pvb21pbmcgJiYgKF9jdXJyWm9vbUxldmVsID09PSBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwpICApIHtcblx0XHRcdFx0XHRzZWxmLnVwZGF0ZVNpemUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgMTAwMCk7XG5cdFx0fVxuXG5cdFx0ZnJhbWV3b3JrLmFkZENsYXNzKHRlbXBsYXRlLCAncHN3cC0tdmlzaWJsZScpO1xuXHR9LFxuXG5cdC8vIENsb3NlIHRoZSBnYWxsZXJ5LCB0aGVuIGRlc3Ryb3kgaXRcblx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdGlmKCFfaXNPcGVuKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0X2lzT3BlbiA9IGZhbHNlO1xuXHRcdF9pc0Rlc3Ryb3lpbmcgPSB0cnVlO1xuXHRcdF9zaG91dCgnY2xvc2UnKTtcblx0XHRfdW5iaW5kRXZlbnRzKCk7XG5cblx0XHRfc2hvd09ySGlkZShzZWxmLmN1cnJJdGVtLCBudWxsLCB0cnVlLCBzZWxmLmRlc3Ryb3kpO1xuXHR9LFxuXG5cdC8vIGRlc3Ryb3lzIHRoZSBnYWxsZXJ5ICh1bmJpbmRzIGV2ZW50cywgY2xlYW5zIHVwIGludGVydmFscyBhbmQgdGltZW91dHMgdG8gYXZvaWQgbWVtb3J5IGxlYWtzKVxuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHRfc2hvdXQoJ2Rlc3Ryb3knKTtcblxuXHRcdGlmKF9zaG93T3JIaWRlVGltZW91dCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9zaG93T3JIaWRlVGltZW91dCk7XG5cdFx0fVxuXHRcdFxuXHRcdHRlbXBsYXRlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXHRcdHRlbXBsYXRlLmNsYXNzTmFtZSA9IF9pbml0YWxDbGFzc05hbWU7XG5cblx0XHRpZihfdXBkYXRlU2l6ZUludGVydmFsKSB7XG5cdFx0XHRjbGVhckludGVydmFsKF91cGRhdGVTaXplSW50ZXJ2YWwpO1xuXHRcdH1cblxuXHRcdGZyYW1ld29yay51bmJpbmQoc2VsZi5zY3JvbGxXcmFwLCBfZG93bkV2ZW50cywgc2VsZik7XG5cblx0XHQvLyB3ZSB1bmJpbmQgc2Nyb2xsIGV2ZW50IGF0IHRoZSBlbmQsIGFzIGNsb3NpbmcgYW5pbWF0aW9uIG1heSBkZXBlbmQgb24gaXRcblx0XHRmcmFtZXdvcmsudW5iaW5kKHdpbmRvdywgJ3Njcm9sbCcsIHNlbGYpO1xuXG5cdFx0X3N0b3BEcmFnVXBkYXRlTG9vcCgpO1xuXG5cdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cblx0XHRfbGlzdGVuZXJzID0gbnVsbDtcblx0fSxcblxuXHQvKipcblx0ICogUGFuIGltYWdlIHRvIHBvc2l0aW9uXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSB4ICAgICBcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgIFxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IGZvcmNlIFdpbGwgaWdub3JlIGJvdW5kcyBpZiBzZXQgdG8gdHJ1ZS5cblx0ICovXG5cdHBhblRvOiBmdW5jdGlvbih4LHksZm9yY2UpIHtcblx0XHRpZighZm9yY2UpIHtcblx0XHRcdGlmKHggPiBfY3VyclBhbkJvdW5kcy5taW4ueCkge1xuXHRcdFx0XHR4ID0gX2N1cnJQYW5Cb3VuZHMubWluLng7XG5cdFx0XHR9IGVsc2UgaWYoeCA8IF9jdXJyUGFuQm91bmRzLm1heC54KSB7XG5cdFx0XHRcdHggPSBfY3VyclBhbkJvdW5kcy5tYXgueDtcblx0XHRcdH1cblxuXHRcdFx0aWYoeSA+IF9jdXJyUGFuQm91bmRzLm1pbi55KSB7XG5cdFx0XHRcdHkgPSBfY3VyclBhbkJvdW5kcy5taW4ueTtcblx0XHRcdH0gZWxzZSBpZih5IDwgX2N1cnJQYW5Cb3VuZHMubWF4LnkpIHtcblx0XHRcdFx0eSA9IF9jdXJyUGFuQm91bmRzLm1heC55O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRfcGFuT2Zmc2V0LnggPSB4O1xuXHRcdF9wYW5PZmZzZXQueSA9IHk7XG5cdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcblx0fSxcblx0XG5cdGhhbmRsZUV2ZW50OiBmdW5jdGlvbiAoZSkge1xuXHRcdGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcblx0XHRpZihfZ2xvYmFsRXZlbnRIYW5kbGVyc1tlLnR5cGVdKSB7XG5cdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tlLnR5cGVdKGUpO1xuXHRcdH1cblx0fSxcblxuXG5cdGdvVG86IGZ1bmN0aW9uKGluZGV4KSB7XG5cblx0XHRpbmRleCA9IF9nZXRMb29wZWRJZChpbmRleCk7XG5cblx0XHR2YXIgZGlmZiA9IGluZGV4IC0gX2N1cnJlbnRJdGVtSW5kZXg7XG5cdFx0X2luZGV4RGlmZiA9IGRpZmY7XG5cblx0XHRfY3VycmVudEl0ZW1JbmRleCA9IGluZGV4O1xuXHRcdHNlbGYuY3Vyckl0ZW0gPSBfZ2V0SXRlbUF0KCBfY3VycmVudEl0ZW1JbmRleCApO1xuXHRcdF9jdXJyUG9zaXRpb25JbmRleCAtPSBkaWZmO1xuXHRcdFxuXHRcdF9tb3ZlTWFpblNjcm9sbChfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXgpO1xuXHRcdFxuXG5cdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cdFx0X21haW5TY3JvbGxBbmltYXRpbmcgPSBmYWxzZTtcblxuXHRcdHNlbGYudXBkYXRlQ3Vyckl0ZW0oKTtcblx0fSxcblx0bmV4dDogZnVuY3Rpb24oKSB7XG5cdFx0c2VsZi5nb1RvKCBfY3VycmVudEl0ZW1JbmRleCArIDEpO1xuXHR9LFxuXHRwcmV2OiBmdW5jdGlvbigpIHtcblx0XHRzZWxmLmdvVG8oIF9jdXJyZW50SXRlbUluZGV4IC0gMSk7XG5cdH0sXG5cblx0Ly8gdXBkYXRlIGN1cnJlbnQgem9vbS9wYW4gb2JqZWN0c1xuXHR1cGRhdGVDdXJyWm9vbUl0ZW06IGZ1bmN0aW9uKGVtdWxhdGVTZXRDb250ZW50KSB7XG5cdFx0aWYoZW11bGF0ZVNldENvbnRlbnQpIHtcblx0XHRcdF9zaG91dCgnYmVmb3JlQ2hhbmdlJywgMCk7XG5cdFx0fVxuXG5cdFx0Ly8gaXRlbUhvbGRlclsxXSBpcyBtaWRkbGUgKGN1cnJlbnQpIGl0ZW1cblx0XHRpZihfaXRlbUhvbGRlcnNbMV0uZWwuY2hpbGRyZW4ubGVuZ3RoKSB7XG5cdFx0XHR2YXIgem9vbUVsZW1lbnQgPSBfaXRlbUhvbGRlcnNbMV0uZWwuY2hpbGRyZW5bMF07XG5cdFx0XHRpZiggZnJhbWV3b3JrLmhhc0NsYXNzKHpvb21FbGVtZW50LCAncHN3cF9fem9vbS13cmFwJykgKSB7XG5cdFx0XHRcdF9jdXJyWm9vbUVsZW1lbnRTdHlsZSA9IHpvb21FbGVtZW50LnN0eWxlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gbnVsbDtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gbnVsbDtcblx0XHR9XG5cdFx0XG5cdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcdFxuXHRcdF9zdGFydFpvb21MZXZlbCA9IF9jdXJyWm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXG5cdFx0X3Bhbk9mZnNldC54ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLng7XG5cdFx0X3Bhbk9mZnNldC55ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLnk7XG5cblx0XHRpZihlbXVsYXRlU2V0Q29udGVudCkge1xuXHRcdFx0X3Nob3V0KCdhZnRlckNoYW5nZScpO1xuXHRcdH1cblx0fSxcblxuXG5cdGludmFsaWRhdGVDdXJySXRlbXM6IGZ1bmN0aW9uKCkge1xuXHRcdF9pdGVtc05lZWRVcGRhdGUgPSB0cnVlO1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBOVU1fSE9MREVSUzsgaSsrKSB7XG5cdFx0XHRpZiggX2l0ZW1Ib2xkZXJzW2ldLml0ZW0gKSB7XG5cdFx0XHRcdF9pdGVtSG9sZGVyc1tpXS5pdGVtLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0dXBkYXRlQ3Vyckl0ZW06IGZ1bmN0aW9uKGJlZm9yZUFuaW1hdGlvbikge1xuXG5cdFx0aWYoX2luZGV4RGlmZiA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBkaWZmQWJzID0gTWF0aC5hYnMoX2luZGV4RGlmZiksXG5cdFx0XHR0ZW1wSG9sZGVyO1xuXG5cdFx0aWYoYmVmb3JlQW5pbWF0aW9uICYmIGRpZmZBYnMgPCAyKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cblx0XHRzZWxmLmN1cnJJdGVtID0gX2dldEl0ZW1BdCggX2N1cnJlbnRJdGVtSW5kZXggKTtcblx0XHRfcmVuZGVyTWF4UmVzb2x1dGlvbiA9IGZhbHNlO1xuXHRcdFxuXHRcdF9zaG91dCgnYmVmb3JlQ2hhbmdlJywgX2luZGV4RGlmZik7XG5cblx0XHRpZihkaWZmQWJzID49IE5VTV9IT0xERVJTKSB7XG5cdFx0XHRfY29udGFpbmVyU2hpZnRJbmRleCArPSBfaW5kZXhEaWZmICsgKF9pbmRleERpZmYgPiAwID8gLU5VTV9IT0xERVJTIDogTlVNX0hPTERFUlMpO1xuXHRcdFx0ZGlmZkFicyA9IE5VTV9IT0xERVJTO1xuXHRcdH1cblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGlmZkFiczsgaSsrKSB7XG5cdFx0XHRpZihfaW5kZXhEaWZmID4gMCkge1xuXHRcdFx0XHR0ZW1wSG9sZGVyID0gX2l0ZW1Ib2xkZXJzLnNoaWZ0KCk7XG5cdFx0XHRcdF9pdGVtSG9sZGVyc1tOVU1fSE9MREVSUy0xXSA9IHRlbXBIb2xkZXI7IC8vIG1vdmUgZmlyc3QgdG8gbGFzdFxuXG5cdFx0XHRcdF9jb250YWluZXJTaGlmdEluZGV4Kys7XG5cdFx0XHRcdF9zZXRUcmFuc2xhdGVYKCAoX2NvbnRhaW5lclNoaWZ0SW5kZXgrMikgKiBfc2xpZGVTaXplLngsIHRlbXBIb2xkZXIuZWwuc3R5bGUpO1xuXHRcdFx0XHRzZWxmLnNldENvbnRlbnQodGVtcEhvbGRlciwgX2N1cnJlbnRJdGVtSW5kZXggLSBkaWZmQWJzICsgaSArIDEgKyAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRlbXBIb2xkZXIgPSBfaXRlbUhvbGRlcnMucG9wKCk7XG5cdFx0XHRcdF9pdGVtSG9sZGVycy51bnNoaWZ0KCB0ZW1wSG9sZGVyICk7IC8vIG1vdmUgbGFzdCB0byBmaXJzdFxuXG5cdFx0XHRcdF9jb250YWluZXJTaGlmdEluZGV4LS07XG5cdFx0XHRcdF9zZXRUcmFuc2xhdGVYKCBfY29udGFpbmVyU2hpZnRJbmRleCAqIF9zbGlkZVNpemUueCwgdGVtcEhvbGRlci5lbC5zdHlsZSk7XG5cdFx0XHRcdHNlbGYuc2V0Q29udGVudCh0ZW1wSG9sZGVyLCBfY3VycmVudEl0ZW1JbmRleCArIGRpZmZBYnMgLSBpIC0gMSAtIDEpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fVxuXG5cdFx0Ly8gcmVzZXQgem9vbS9wYW4gb24gcHJldmlvdXMgaXRlbVxuXHRcdGlmKF9jdXJyWm9vbUVsZW1lbnRTdHlsZSAmJiBNYXRoLmFicyhfaW5kZXhEaWZmKSA9PT0gMSkge1xuXG5cdFx0XHR2YXIgcHJldkl0ZW0gPSBfZ2V0SXRlbUF0KF9wcmV2SXRlbUluZGV4KTtcblx0XHRcdGlmKHByZXZJdGVtLmluaXRpYWxab29tTGV2ZWwgIT09IF9jdXJyWm9vbUxldmVsKSB7XG5cdFx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShwcmV2SXRlbSAsIF92aWV3cG9ydFNpemUgKTtcblx0XHRcdFx0X3NldEltYWdlU2l6ZShwcmV2SXRlbSk7XG5cdFx0XHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0oIHByZXZJdGVtICk7IFx0XHRcdFx0XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHQvLyByZXNldCBkaWZmIGFmdGVyIHVwZGF0ZVxuXHRcdF9pbmRleERpZmYgPSAwO1xuXG5cdFx0c2VsZi51cGRhdGVDdXJyWm9vbUl0ZW0oKTtcblxuXHRcdF9wcmV2SXRlbUluZGV4ID0gX2N1cnJlbnRJdGVtSW5kZXg7XG5cblx0XHRfc2hvdXQoJ2FmdGVyQ2hhbmdlJyk7XG5cdFx0XG5cdH0sXG5cblxuXG5cdHVwZGF0ZVNpemU6IGZ1bmN0aW9uKGZvcmNlKSB7XG5cdFx0XG5cdFx0aWYoIV9pc0ZpeGVkUG9zaXRpb24gJiYgX29wdGlvbnMubW9kYWwpIHtcblx0XHRcdHZhciB3aW5kb3dTY3JvbGxZID0gZnJhbWV3b3JrLmdldFNjcm9sbFkoKTtcblx0XHRcdGlmKF9jdXJyZW50V2luZG93U2Nyb2xsWSAhPT0gd2luZG93U2Nyb2xsWSkge1xuXHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS50b3AgPSB3aW5kb3dTY3JvbGxZICsgJ3B4Jztcblx0XHRcdFx0X2N1cnJlbnRXaW5kb3dTY3JvbGxZID0gd2luZG93U2Nyb2xsWTtcblx0XHRcdH1cblx0XHRcdGlmKCFmb3JjZSAmJiBfd2luZG93VmlzaWJsZVNpemUueCA9PT0gd2luZG93LmlubmVyV2lkdGggJiYgX3dpbmRvd1Zpc2libGVTaXplLnkgPT09IHdpbmRvdy5pbm5lckhlaWdodCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRfd2luZG93VmlzaWJsZVNpemUueCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRcdFx0X3dpbmRvd1Zpc2libGVTaXplLnkgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cblx0XHRcdC8vdGVtcGxhdGUuc3R5bGUud2lkdGggPSBfd2luZG93VmlzaWJsZVNpemUueCArICdweCc7XG5cdFx0XHR0ZW1wbGF0ZS5zdHlsZS5oZWlnaHQgPSBfd2luZG93VmlzaWJsZVNpemUueSArICdweCc7XG5cdFx0fVxuXG5cblxuXHRcdF92aWV3cG9ydFNpemUueCA9IHNlbGYuc2Nyb2xsV3JhcC5jbGllbnRXaWR0aDtcblx0XHRfdmlld3BvcnRTaXplLnkgPSBzZWxmLnNjcm9sbFdyYXAuY2xpZW50SGVpZ2h0O1xuXG5cdFx0X3VwZGF0ZVBhZ2VTY3JvbGxPZmZzZXQoKTtcblxuXHRcdF9zbGlkZVNpemUueCA9IF92aWV3cG9ydFNpemUueCArIE1hdGgucm91bmQoX3ZpZXdwb3J0U2l6ZS54ICogX29wdGlvbnMuc3BhY2luZyk7XG5cdFx0X3NsaWRlU2l6ZS55ID0gX3ZpZXdwb3J0U2l6ZS55O1xuXG5cdFx0X21vdmVNYWluU2Nyb2xsKF9zbGlkZVNpemUueCAqIF9jdXJyUG9zaXRpb25JbmRleCk7XG5cblx0XHRfc2hvdXQoJ2JlZm9yZVJlc2l6ZScpOyAvLyBldmVuIG1heSBiZSB1c2VkIGZvciBleGFtcGxlIHRvIHN3aXRjaCBpbWFnZSBzb3VyY2VzXG5cblxuXHRcdC8vIGRvbid0IHJlLWNhbGN1bGF0ZSBzaXplIG9uIGluaXRhbCBzaXplIHVwZGF0ZVxuXHRcdGlmKF9jb250YWluZXJTaGlmdEluZGV4ICE9PSB1bmRlZmluZWQpIHtcblxuXHRcdFx0dmFyIGhvbGRlcixcblx0XHRcdFx0aXRlbSxcblx0XHRcdFx0aEluZGV4O1xuXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgTlVNX0hPTERFUlM7IGkrKykge1xuXHRcdFx0XHRob2xkZXIgPSBfaXRlbUhvbGRlcnNbaV07XG5cdFx0XHRcdF9zZXRUcmFuc2xhdGVYKCAoaStfY29udGFpbmVyU2hpZnRJbmRleCkgKiBfc2xpZGVTaXplLngsIGhvbGRlci5lbC5zdHlsZSk7XG5cblx0XHRcdFx0aEluZGV4ID0gX2N1cnJlbnRJdGVtSW5kZXgraS0xO1xuXG5cdFx0XHRcdGlmKF9vcHRpb25zLmxvb3AgJiYgX2dldE51bUl0ZW1zKCkgPiAyKSB7XG5cdFx0XHRcdFx0aEluZGV4ID0gX2dldExvb3BlZElkKGhJbmRleCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyB1cGRhdGUgem9vbSBsZXZlbCBvbiBpdGVtcyBhbmQgcmVmcmVzaCBzb3VyY2UgKGlmIG5lZWRzVXBkYXRlKVxuXHRcdFx0XHRpdGVtID0gX2dldEl0ZW1BdCggaEluZGV4ICk7XG5cblx0XHRcdFx0Ly8gcmUtcmVuZGVyIGdhbGxlcnkgaXRlbSBpZiBgbmVlZHNVcGRhdGVgLFxuXHRcdFx0XHQvLyBvciBkb2Vzbid0IGhhdmUgYGJvdW5kc2AgKGVudGlyZWx5IG5ldyBzbGlkZSBvYmplY3QpXG5cdFx0XHRcdGlmKCBpdGVtICYmIChfaXRlbXNOZWVkVXBkYXRlIHx8IGl0ZW0ubmVlZHNVcGRhdGUgfHwgIWl0ZW0uYm91bmRzKSApIHtcblxuXHRcdFx0XHRcdHNlbGYuY2xlYW5TbGlkZSggaXRlbSApO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHNlbGYuc2V0Q29udGVudCggaG9sZGVyLCBoSW5kZXggKTtcblxuXHRcdFx0XHRcdC8vIGlmIFwiY2VudGVyXCIgc2xpZGVcblx0XHRcdFx0XHRpZihpID09PSAxKSB7XG5cdFx0XHRcdFx0XHRzZWxmLmN1cnJJdGVtID0gaXRlbTtcblx0XHRcdFx0XHRcdHNlbGYudXBkYXRlQ3Vyclpvb21JdGVtKHRydWUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGl0ZW0ubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuXHRcdFx0XHR9IGVsc2UgaWYoaG9sZGVyLmluZGV4ID09PSAtMSAmJiBoSW5kZXggPj0gMCkge1xuXHRcdFx0XHRcdC8vIGFkZCBjb250ZW50IGZpcnN0IHRpbWVcblx0XHRcdFx0XHRzZWxmLnNldENvbnRlbnQoIGhvbGRlciwgaEluZGV4ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoaXRlbSAmJiBpdGVtLmNvbnRhaW5lcikge1xuXHRcdFx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShpdGVtLCBfdmlld3BvcnRTaXplKTtcblx0XHRcdFx0XHRfc2V0SW1hZ2VTaXplKGl0ZW0pO1xuXHRcdFx0XHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0oIGl0ZW0gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdF9pdGVtc05lZWRVcGRhdGUgPSBmYWxzZTtcblx0XHR9XHRcblxuXHRcdF9zdGFydFpvb21MZXZlbCA9IF9jdXJyWm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXHRcdF9jdXJyUGFuQm91bmRzID0gc2VsZi5jdXJySXRlbS5ib3VuZHM7XG5cblx0XHRpZihfY3VyclBhbkJvdW5kcykge1xuXHRcdFx0X3Bhbk9mZnNldC54ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLng7XG5cdFx0XHRfcGFuT2Zmc2V0LnkgPSBfY3VyclBhbkJvdW5kcy5jZW50ZXIueTtcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCB0cnVlICk7XG5cdFx0fVxuXHRcdFxuXHRcdF9zaG91dCgncmVzaXplJyk7XG5cdH0sXG5cdFxuXHQvLyBab29tIGN1cnJlbnQgaXRlbSB0b1xuXHR6b29tVG86IGZ1bmN0aW9uKGRlc3Rab29tTGV2ZWwsIGNlbnRlclBvaW50LCBzcGVlZCwgZWFzaW5nRm4sIHVwZGF0ZUZuKSB7XG5cdFx0Lypcblx0XHRcdGlmKGRlc3Rab29tTGV2ZWwgPT09ICdmaXQnKSB7XG5cdFx0XHRcdGRlc3Rab29tTGV2ZWwgPSBzZWxmLmN1cnJJdGVtLmZpdFJhdGlvO1xuXHRcdFx0fSBlbHNlIGlmKGRlc3Rab29tTGV2ZWwgPT09ICdmaWxsJykge1xuXHRcdFx0XHRkZXN0Wm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5maWxsUmF0aW87XG5cdFx0XHR9XG5cdFx0Ki9cblxuXHRcdGlmKGNlbnRlclBvaW50KSB7XG5cdFx0XHRfc3RhcnRab29tTGV2ZWwgPSBfY3Vyclpvb21MZXZlbDtcblx0XHRcdF9taWRab29tUG9pbnQueCA9IE1hdGguYWJzKGNlbnRlclBvaW50LngpIC0gX3Bhbk9mZnNldC54IDtcblx0XHRcdF9taWRab29tUG9pbnQueSA9IE1hdGguYWJzKGNlbnRlclBvaW50LnkpIC0gX3Bhbk9mZnNldC55IDtcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfc3RhcnRQYW5PZmZzZXQsIF9wYW5PZmZzZXQpO1xuXHRcdH1cblxuXHRcdHZhciBkZXN0UGFuQm91bmRzID0gX2NhbGN1bGF0ZVBhbkJvdW5kcyhkZXN0Wm9vbUxldmVsLCBmYWxzZSksXG5cdFx0XHRkZXN0UGFuT2Zmc2V0ID0ge307XG5cblx0XHRfbW9kaWZ5RGVzdFBhbk9mZnNldCgneCcsIGRlc3RQYW5Cb3VuZHMsIGRlc3RQYW5PZmZzZXQsIGRlc3Rab29tTGV2ZWwpO1xuXHRcdF9tb2RpZnlEZXN0UGFuT2Zmc2V0KCd5JywgZGVzdFBhbkJvdW5kcywgZGVzdFBhbk9mZnNldCwgZGVzdFpvb21MZXZlbCk7XG5cblx0XHR2YXIgaW5pdGlhbFpvb21MZXZlbCA9IF9jdXJyWm9vbUxldmVsO1xuXHRcdHZhciBpbml0aWFsUGFuT2Zmc2V0ID0ge1xuXHRcdFx0eDogX3Bhbk9mZnNldC54LFxuXHRcdFx0eTogX3Bhbk9mZnNldC55XG5cdFx0fTtcblxuXHRcdF9yb3VuZFBvaW50KGRlc3RQYW5PZmZzZXQpO1xuXG5cdFx0dmFyIG9uVXBkYXRlID0gZnVuY3Rpb24obm93KSB7XG5cdFx0XHRpZihub3cgPT09IDEpIHtcblx0XHRcdFx0X2N1cnJab29tTGV2ZWwgPSBkZXN0Wm9vbUxldmVsO1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnggPSBkZXN0UGFuT2Zmc2V0Lng7XG5cdFx0XHRcdF9wYW5PZmZzZXQueSA9IGRlc3RQYW5PZmZzZXQueTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gKGRlc3Rab29tTGV2ZWwgLSBpbml0aWFsWm9vbUxldmVsKSAqIG5vdyArIGluaXRpYWxab29tTGV2ZWw7XG5cdFx0XHRcdF9wYW5PZmZzZXQueCA9IChkZXN0UGFuT2Zmc2V0LnggLSBpbml0aWFsUGFuT2Zmc2V0LngpICogbm93ICsgaW5pdGlhbFBhbk9mZnNldC54O1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSAoZGVzdFBhbk9mZnNldC55IC0gaW5pdGlhbFBhbk9mZnNldC55KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueTtcblx0XHRcdH1cblxuXHRcdFx0aWYodXBkYXRlRm4pIHtcblx0XHRcdFx0dXBkYXRlRm4obm93KTtcblx0XHRcdH1cblxuXHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oIG5vdyA9PT0gMSApO1xuXHRcdH07XG5cblx0XHRpZihzcGVlZCkge1xuXHRcdFx0X2FuaW1hdGVQcm9wKCdjdXN0b21ab29tVG8nLCAwLCAxLCBzcGVlZCwgZWFzaW5nRm4gfHwgZnJhbWV3b3JrLmVhc2luZy5zaW5lLmluT3V0LCBvblVwZGF0ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9uVXBkYXRlKDEpO1xuXHRcdH1cblx0fVxuXG5cbn07XG5cblxuLyo+PmNvcmUqL1xuXG4vKj4+Z2VzdHVyZXMqL1xuLyoqXG4gKiBNb3VzZS90b3VjaC9wb2ludGVyIGV2ZW50IGhhbmRsZXJzLlxuICogXG4gKiBzZXBhcmF0ZWQgZnJvbSBAY29yZS5qcyBmb3IgcmVhZGFiaWxpdHlcbiAqL1xuXG52YXIgTUlOX1NXSVBFX0RJU1RBTkNFID0gMzAsXG5cdERJUkVDVElPTl9DSEVDS19PRkZTRVQgPSAxMDsgLy8gYW1vdW50IG9mIHBpeGVscyB0byBkcmFnIHRvIGRldGVybWluZSBkaXJlY3Rpb24gb2Ygc3dpcGVcblxudmFyIF9nZXN0dXJlU3RhcnRUaW1lLFxuXHRfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lLFxuXG5cdC8vIHBvb2wgb2Ygb2JqZWN0cyB0aGF0IGFyZSB1c2VkIGR1cmluZyBkcmFnZ2luZyBvZiB6b29taW5nXG5cdHAgPSB7fSwgLy8gZmlyc3QgcG9pbnRcblx0cDIgPSB7fSwgLy8gc2Vjb25kIHBvaW50IChmb3Igem9vbSBnZXN0dXJlKVxuXHRkZWx0YSA9IHt9LFxuXHRfY3VyclBvaW50ID0ge30sXG5cdF9zdGFydFBvaW50ID0ge30sXG5cdF9jdXJyUG9pbnRlcnMgPSBbXSxcblx0X3N0YXJ0TWFpblNjcm9sbFBvcyA9IHt9LFxuXHRfcmVsZWFzZUFuaW1EYXRhLFxuXHRfcG9zUG9pbnRzID0gW10sIC8vIGFycmF5IG9mIHBvaW50cyBkdXJpbmcgZHJhZ2dpbmcsIHVzZWQgdG8gZGV0ZXJtaW5lIHR5cGUgb2YgZ2VzdHVyZVxuXHRfdGVtcFBvaW50ID0ge30sXG5cblx0X2lzWm9vbWluZ0luLFxuXHRfdmVydGljYWxEcmFnSW5pdGlhdGVkLFxuXHRfb2xkQW5kcm9pZFRvdWNoRW5kVGltZW91dCxcblx0X2N1cnJab29tZWRJdGVtSW5kZXggPSAwLFxuXHRfY2VudGVyUG9pbnQgPSBfZ2V0RW1wdHlQb2ludCgpLFxuXHRfbGFzdFJlbGVhc2VUaW1lID0gMCxcblx0X2lzRHJhZ2dpbmcsIC8vIGF0IGxlYXN0IG9uZSBwb2ludGVyIGlzIGRvd25cblx0X2lzTXVsdGl0b3VjaCwgLy8gYXQgbGVhc3QgdHdvIF9wb2ludGVycyBhcmUgZG93blxuXHRfem9vbVN0YXJ0ZWQsIC8vIHpvb20gbGV2ZWwgY2hhbmdlZCBkdXJpbmcgem9vbSBnZXN0dXJlXG5cdF9tb3ZlZCxcblx0X2RyYWdBbmltRnJhbWUsXG5cdF9tYWluU2Nyb2xsU2hpZnRlZCxcblx0X2N1cnJlbnRQb2ludHMsIC8vIGFycmF5IG9mIGN1cnJlbnQgdG91Y2ggcG9pbnRzXG5cdF9pc1pvb21pbmcsXG5cdF9jdXJyUG9pbnRzRGlzdGFuY2UsXG5cdF9zdGFydFBvaW50c0Rpc3RhbmNlLFxuXHRfY3VyclBhbkJvdW5kcyxcblx0X21haW5TY3JvbGxQb3MgPSBfZ2V0RW1wdHlQb2ludCgpLFxuXHRfY3Vyclpvb21FbGVtZW50U3R5bGUsXG5cdF9tYWluU2Nyb2xsQW5pbWF0aW5nLCAvLyB0cnVlLCBpZiBhbmltYXRpb24gYWZ0ZXIgc3dpcGUgZ2VzdHVyZSBpcyBydW5uaW5nXG5cdF9taWRab29tUG9pbnQgPSBfZ2V0RW1wdHlQb2ludCgpLFxuXHRfY3VyckNlbnRlclBvaW50ID0gX2dldEVtcHR5UG9pbnQoKSxcblx0X2RpcmVjdGlvbixcblx0X2lzRmlyc3RNb3ZlLFxuXHRfb3BhY2l0eUNoYW5nZWQsXG5cdF9iZ09wYWNpdHksXG5cdF93YXNPdmVySW5pdGlhbFpvb20sXG5cblx0X2lzRXF1YWxQb2ludHMgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0XHRyZXR1cm4gcDEueCA9PT0gcDIueCAmJiBwMS55ID09PSBwMi55O1xuXHR9LFxuXHRfaXNOZWFyYnlQb2ludHMgPSBmdW5jdGlvbih0b3VjaDAsIHRvdWNoMSkge1xuXHRcdHJldHVybiBNYXRoLmFicyh0b3VjaDAueCAtIHRvdWNoMS54KSA8IERPVUJMRV9UQVBfUkFESVVTICYmIE1hdGguYWJzKHRvdWNoMC55IC0gdG91Y2gxLnkpIDwgRE9VQkxFX1RBUF9SQURJVVM7XG5cdH0sXG5cdF9jYWxjdWxhdGVQb2ludHNEaXN0YW5jZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRcdF90ZW1wUG9pbnQueCA9IE1hdGguYWJzKCBwMS54IC0gcDIueCApO1xuXHRcdF90ZW1wUG9pbnQueSA9IE1hdGguYWJzKCBwMS55IC0gcDIueSApO1xuXHRcdHJldHVybiBNYXRoLnNxcnQoX3RlbXBQb2ludC54ICogX3RlbXBQb2ludC54ICsgX3RlbXBQb2ludC55ICogX3RlbXBQb2ludC55KTtcblx0fSxcblx0X3N0b3BEcmFnVXBkYXRlTG9vcCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKF9kcmFnQW5pbUZyYW1lKSB7XG5cdFx0XHRfY2FuY2VsQUYoX2RyYWdBbmltRnJhbWUpO1xuXHRcdFx0X2RyYWdBbmltRnJhbWUgPSBudWxsO1xuXHRcdH1cblx0fSxcblx0X2RyYWdVcGRhdGVMb29wID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYoX2lzRHJhZ2dpbmcpIHtcblx0XHRcdF9kcmFnQW5pbUZyYW1lID0gX3JlcXVlc3RBRihfZHJhZ1VwZGF0ZUxvb3ApO1xuXHRcdFx0X3JlbmRlck1vdmVtZW50KCk7XG5cdFx0fVxuXHR9LFxuXHRfY2FuUGFuID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICEoX29wdGlvbnMuc2NhbGVNb2RlID09PSAnZml0JyAmJiBfY3Vyclpvb21MZXZlbCA9PT0gIHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCk7XG5cdH0sXG5cdFxuXHQvLyBmaW5kIHRoZSBjbG9zZXN0IHBhcmVudCBET00gZWxlbWVudFxuXHRfY2xvc2VzdEVsZW1lbnQgPSBmdW5jdGlvbihlbCwgZm4pIHtcblx0ICBcdGlmKCFlbCB8fCBlbCA9PT0gZG9jdW1lbnQpIHtcblx0ICBcdFx0cmV0dXJuIGZhbHNlO1xuXHQgIFx0fVxuXG5cdCAgXHQvLyBkb24ndCBzZWFyY2ggZWxlbWVudHMgYWJvdmUgcHN3cF9fc2Nyb2xsLXdyYXBcblx0ICBcdGlmKGVsLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSAmJiBlbC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykuaW5kZXhPZigncHN3cF9fc2Nyb2xsLXdyYXAnKSA+IC0xICkge1xuXHQgIFx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgXHR9XG5cblx0ICBcdGlmKCBmbihlbCkgKSB7XG5cdCAgXHRcdHJldHVybiBlbDtcblx0ICBcdH1cblxuXHQgIFx0cmV0dXJuIF9jbG9zZXN0RWxlbWVudChlbC5wYXJlbnROb2RlLCBmbik7XG5cdH0sXG5cblx0X3ByZXZlbnRPYmogPSB7fSxcblx0X3ByZXZlbnREZWZhdWx0RXZlbnRCZWhhdmlvdXIgPSBmdW5jdGlvbihlLCBpc0Rvd24pIHtcblx0ICAgIF9wcmV2ZW50T2JqLnByZXZlbnQgPSAhX2Nsb3Nlc3RFbGVtZW50KGUudGFyZ2V0LCBfb3B0aW9ucy5pc0NsaWNrYWJsZUVsZW1lbnQpO1xuXG5cdFx0X3Nob3V0KCdwcmV2ZW50RHJhZ0V2ZW50JywgZSwgaXNEb3duLCBfcHJldmVudE9iaik7XG5cdFx0cmV0dXJuIF9wcmV2ZW50T2JqLnByZXZlbnQ7XG5cblx0fSxcblx0X2NvbnZlcnRUb3VjaFRvUG9pbnQgPSBmdW5jdGlvbih0b3VjaCwgcCkge1xuXHRcdHAueCA9IHRvdWNoLnBhZ2VYO1xuXHRcdHAueSA9IHRvdWNoLnBhZ2VZO1xuXHRcdHAuaWQgPSB0b3VjaC5pZGVudGlmaWVyO1xuXHRcdHJldHVybiBwO1xuXHR9LFxuXHRfZmluZENlbnRlck9mUG9pbnRzID0gZnVuY3Rpb24ocDEsIHAyLCBwQ2VudGVyKSB7XG5cdFx0cENlbnRlci54ID0gKHAxLnggKyBwMi54KSAqIDAuNTtcblx0XHRwQ2VudGVyLnkgPSAocDEueSArIHAyLnkpICogMC41O1xuXHR9LFxuXHRfcHVzaFBvc1BvaW50ID0gZnVuY3Rpb24odGltZSwgeCwgeSkge1xuXHRcdGlmKHRpbWUgLSBfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lID4gNTApIHtcblx0XHRcdHZhciBvID0gX3Bvc1BvaW50cy5sZW5ndGggPiAyID8gX3Bvc1BvaW50cy5zaGlmdCgpIDoge307XG5cdFx0XHRvLnggPSB4O1xuXHRcdFx0by55ID0geTsgXG5cdFx0XHRfcG9zUG9pbnRzLnB1c2gobyk7XG5cdFx0XHRfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lID0gdGltZTtcblx0XHR9XG5cdH0sXG5cblx0X2NhbGN1bGF0ZVZlcnRpY2FsRHJhZ09wYWNpdHlSYXRpbyA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB5T2Zmc2V0ID0gX3Bhbk9mZnNldC55IC0gc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb24ueTsgLy8gZGlmZmVyZW5jZSBiZXR3ZWVuIGluaXRpYWwgYW5kIGN1cnJlbnQgcG9zaXRpb25cblx0XHRyZXR1cm4gMSAtICBNYXRoLmFicyggeU9mZnNldCAvIChfdmlld3BvcnRTaXplLnkgLyAyKSAgKTtcblx0fSxcblxuXHRcblx0Ly8gcG9pbnRzIHBvb2wsIHJldXNlZCBkdXJpbmcgdG91Y2ggZXZlbnRzXG5cdF9lUG9pbnQxID0ge30sXG5cdF9lUG9pbnQyID0ge30sXG5cdF90ZW1wUG9pbnRzQXJyID0gW10sXG5cdF90ZW1wQ291bnRlcixcblx0X2dldFRvdWNoUG9pbnRzID0gZnVuY3Rpb24oZSkge1xuXHRcdC8vIGNsZWFuIHVwIHByZXZpb3VzIHBvaW50cywgd2l0aG91dCByZWNyZWF0aW5nIGFycmF5XG5cdFx0d2hpbGUoX3RlbXBQb2ludHNBcnIubGVuZ3RoID4gMCkge1xuXHRcdFx0X3RlbXBQb2ludHNBcnIucG9wKCk7XG5cdFx0fVxuXG5cdFx0aWYoIV9wb2ludGVyRXZlbnRFbmFibGVkKSB7XG5cdFx0XHRpZihlLnR5cGUuaW5kZXhPZigndG91Y2gnKSA+IC0xKSB7XG5cblx0XHRcdFx0aWYoZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMF0gPSBfY29udmVydFRvdWNoVG9Qb2ludChlLnRvdWNoZXNbMF0sIF9lUG9pbnQxKTtcblx0XHRcdFx0XHRpZihlLnRvdWNoZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMV0gPSBfY29udmVydFRvdWNoVG9Qb2ludChlLnRvdWNoZXNbMV0sIF9lUG9pbnQyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRfZVBvaW50MS54ID0gZS5wYWdlWDtcblx0XHRcdFx0X2VQb2ludDEueSA9IGUucGFnZVk7XG5cdFx0XHRcdF9lUG9pbnQxLmlkID0gJyc7XG5cdFx0XHRcdF90ZW1wUG9pbnRzQXJyWzBdID0gX2VQb2ludDE7Ly9fZVBvaW50MTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0X3RlbXBDb3VudGVyID0gMDtcblx0XHRcdC8vIHdlIGNhbiB1c2UgZm9yRWFjaCwgYXMgcG9pbnRlciBldmVudHMgYXJlIHN1cHBvcnRlZCBvbmx5IGluIG1vZGVybiBicm93c2Vyc1xuXHRcdFx0X2N1cnJQb2ludGVycy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcblx0XHRcdFx0aWYoX3RlbXBDb3VudGVyID09PSAwKSB7XG5cdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMF0gPSBwO1xuXHRcdFx0XHR9IGVsc2UgaWYoX3RlbXBDb3VudGVyID09PSAxKSB7XG5cdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMV0gPSBwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdF90ZW1wQ291bnRlcisrO1xuXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0cmV0dXJuIF90ZW1wUG9pbnRzQXJyO1xuXHR9LFxuXG5cdF9wYW5Pck1vdmVNYWluU2Nyb2xsID0gZnVuY3Rpb24oYXhpcywgZGVsdGEpIHtcblxuXHRcdHZhciBwYW5GcmljdGlvbixcblx0XHRcdG92ZXJEaWZmID0gMCxcblx0XHRcdG5ld09mZnNldCA9IF9wYW5PZmZzZXRbYXhpc10gKyBkZWx0YVtheGlzXSxcblx0XHRcdHN0YXJ0T3ZlckRpZmYsXG5cdFx0XHRkaXIgPSBkZWx0YVtheGlzXSA+IDAsXG5cdFx0XHRuZXdNYWluU2Nyb2xsUG9zaXRpb24gPSBfbWFpblNjcm9sbFBvcy54ICsgZGVsdGEueCxcblx0XHRcdG1haW5TY3JvbGxEaWZmID0gX21haW5TY3JvbGxQb3MueCAtIF9zdGFydE1haW5TY3JvbGxQb3MueCxcblx0XHRcdG5ld1BhblBvcyxcblx0XHRcdG5ld01haW5TY3JvbGxQb3M7XG5cblx0XHQvLyBjYWxjdWxhdGUgZmRpc3RhbmNlIG92ZXIgdGhlIGJvdW5kcyBhbmQgZnJpY3Rpb25cblx0XHRpZihuZXdPZmZzZXQgPiBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10gfHwgbmV3T2Zmc2V0IDwgX2N1cnJQYW5Cb3VuZHMubWF4W2F4aXNdKSB7XG5cdFx0XHRwYW5GcmljdGlvbiA9IF9vcHRpb25zLnBhbkVuZEZyaWN0aW9uO1xuXHRcdFx0Ly8gTGluZWFyIGluY3JlYXNpbmcgb2YgZnJpY3Rpb24sIHNvIGF0IDEvNCBvZiB2aWV3cG9ydCBpdCdzIGF0IG1heCB2YWx1ZS4gXG5cdFx0XHQvLyBMb29rcyBub3QgYXMgbmljZSBhcyB3YXMgZXhwZWN0ZWQuIExlZnQgZm9yIGhpc3RvcnkuXG5cdFx0XHQvLyBwYW5GcmljdGlvbiA9ICgxIC0gKF9wYW5PZmZzZXRbYXhpc10gKyBkZWx0YVtheGlzXSArIHBhbkJvdW5kcy5taW5bYXhpc10pIC8gKF92aWV3cG9ydFNpemVbYXhpc10gLyA0KSApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYW5GcmljdGlvbiA9IDE7XG5cdFx0fVxuXHRcdFxuXHRcdG5ld09mZnNldCA9IF9wYW5PZmZzZXRbYXhpc10gKyBkZWx0YVtheGlzXSAqIHBhbkZyaWN0aW9uO1xuXG5cdFx0Ly8gbW92ZSBtYWluIHNjcm9sbCBvciBzdGFydCBwYW5uaW5nXG5cdFx0aWYoX29wdGlvbnMuYWxsb3dQYW5Ub05leHQgfHwgX2N1cnJab29tTGV2ZWwgPT09IHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCkge1xuXG5cblx0XHRcdGlmKCFfY3Vyclpvb21FbGVtZW50U3R5bGUpIHtcblx0XHRcdFx0XG5cdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XG5cblx0XHRcdH0gZWxzZSBpZihfZGlyZWN0aW9uID09PSAnaCcgJiYgYXhpcyA9PT0gJ3gnICYmICFfem9vbVN0YXJ0ZWQgKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihkaXIpIHtcblx0XHRcdFx0XHRpZihuZXdPZmZzZXQgPiBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10pIHtcblx0XHRcdFx0XHRcdHBhbkZyaWN0aW9uID0gX29wdGlvbnMucGFuRW5kRnJpY3Rpb247XG5cdFx0XHRcdFx0XHRvdmVyRGlmZiA9IF9jdXJyUGFuQm91bmRzLm1pbltheGlzXSAtIG5ld09mZnNldDtcblx0XHRcdFx0XHRcdHN0YXJ0T3ZlckRpZmYgPSBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10gLSBfc3RhcnRQYW5PZmZzZXRbYXhpc107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIGRyYWcgcmlnaHRcblx0XHRcdFx0XHRpZiggKHN0YXJ0T3ZlckRpZmYgPD0gMCB8fCBtYWluU2Nyb2xsRGlmZiA8IDApICYmIF9nZXROdW1JdGVtcygpID4gMSApIHtcblx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XG5cdFx0XHRcdFx0XHRpZihtYWluU2Nyb2xsRGlmZiA8IDAgJiYgbmV3TWFpblNjcm9sbFBvc2l0aW9uID4gX3N0YXJ0TWFpblNjcm9sbFBvcy54KSB7XG5cdFx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBfc3RhcnRNYWluU2Nyb2xsUG9zLng7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmKF9jdXJyUGFuQm91bmRzLm1pbi54ICE9PSBfY3VyclBhbkJvdW5kcy5tYXgueCkge1xuXHRcdFx0XHRcdFx0XHRuZXdQYW5Qb3MgPSBuZXdPZmZzZXQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdGlmKG5ld09mZnNldCA8IF9jdXJyUGFuQm91bmRzLm1heFtheGlzXSApIHtcblx0XHRcdFx0XHRcdHBhbkZyaWN0aW9uID1fb3B0aW9ucy5wYW5FbmRGcmljdGlvbjtcblx0XHRcdFx0XHRcdG92ZXJEaWZmID0gbmV3T2Zmc2V0IC0gX2N1cnJQYW5Cb3VuZHMubWF4W2F4aXNdO1xuXHRcdFx0XHRcdFx0c3RhcnRPdmVyRGlmZiA9IF9zdGFydFBhbk9mZnNldFtheGlzXSAtIF9jdXJyUGFuQm91bmRzLm1heFtheGlzXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiggKHN0YXJ0T3ZlckRpZmYgPD0gMCB8fCBtYWluU2Nyb2xsRGlmZiA+IDApICYmIF9nZXROdW1JdGVtcygpID4gMSApIHtcblx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XG5cblx0XHRcdFx0XHRcdGlmKG1haW5TY3JvbGxEaWZmID4gMCAmJiBuZXdNYWluU2Nyb2xsUG9zaXRpb24gPCBfc3RhcnRNYWluU2Nyb2xsUG9zLngpIHtcblx0XHRcdFx0XHRcdFx0bmV3TWFpblNjcm9sbFBvcyA9IF9zdGFydE1haW5TY3JvbGxQb3MueDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZihfY3VyclBhbkJvdW5kcy5taW4ueCAhPT0gX2N1cnJQYW5Cb3VuZHMubWF4LngpIHtcblx0XHRcdFx0XHRcdFx0bmV3UGFuUG9zID0gbmV3T2Zmc2V0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHQvL1xuXHRcdFx0fVxuXG5cdFx0XHRpZihheGlzID09PSAneCcpIHtcblxuXHRcdFx0XHRpZihuZXdNYWluU2Nyb2xsUG9zICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRfbW92ZU1haW5TY3JvbGwobmV3TWFpblNjcm9sbFBvcywgdHJ1ZSk7XG5cdFx0XHRcdFx0aWYobmV3TWFpblNjcm9sbFBvcyA9PT0gX3N0YXJ0TWFpblNjcm9sbFBvcy54KSB7XG5cdFx0XHRcdFx0XHRfbWFpblNjcm9sbFNoaWZ0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X21haW5TY3JvbGxTaGlmdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihfY3VyclBhbkJvdW5kcy5taW4ueCAhPT0gX2N1cnJQYW5Cb3VuZHMubWF4LngpIHtcblx0XHRcdFx0XHRpZihuZXdQYW5Qb3MgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0X3Bhbk9mZnNldC54ID0gbmV3UGFuUG9zO1xuXHRcdFx0XHRcdH0gZWxzZSBpZighX21haW5TY3JvbGxTaGlmdGVkKSB7XG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggKz0gZGVsdGEueCAqIHBhbkZyaWN0aW9uO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBuZXdNYWluU2Nyb2xsUG9zICE9PSB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRpZighX21haW5TY3JvbGxBbmltYXRpbmcpIHtcblx0XHRcdFxuXHRcdFx0aWYoIV9tYWluU2Nyb2xsU2hpZnRlZCkge1xuXHRcdFx0XHRpZihfY3Vyclpvb21MZXZlbCA+IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pIHtcblx0XHRcdFx0XHRfcGFuT2Zmc2V0W2F4aXNdICs9IGRlbHRhW2F4aXNdICogcGFuRnJpY3Rpb247XG5cdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdFxuXHRcdH1cblx0XHRcblx0fSxcblxuXHQvLyBQb2ludGVyZG93bi90b3VjaHN0YXJ0L21vdXNlZG93biBoYW5kbGVyXG5cdF9vbkRyYWdTdGFydCA9IGZ1bmN0aW9uKGUpIHtcblxuXHRcdC8vIEFsbG93IGRyYWdnaW5nIG9ubHkgdmlhIGxlZnQgbW91c2UgYnV0dG9uLlxuXHRcdC8vIEFzIHRoaXMgaGFuZGxlciBpcyBub3QgYWRkZWQgaW4gSUU4IC0gd2UgaWdub3JlIGUud2hpY2hcblx0XHQvLyBcblx0XHQvLyBodHRwOi8vd3d3LnF1aXJrc21vZGUub3JnL2pzL2V2ZW50c19wcm9wZXJ0aWVzLmh0bWxcblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvZXZlbnQuYnV0dG9uXG5cdFx0aWYoZS50eXBlID09PSAnbW91c2Vkb3duJyAmJiBlLmJ1dHRvbiA+IDAgICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmKF9pbml0aWFsWm9vbVJ1bm5pbmcpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZihfb2xkQW5kcm9pZFRvdWNoRW5kVGltZW91dCAmJiBlLnR5cGUgPT09ICdtb3VzZWRvd24nKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYoX3ByZXZlbnREZWZhdWx0RXZlbnRCZWhhdmlvdXIoZSwgdHJ1ZSkpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cblxuXG5cdFx0X3Nob3V0KCdwb2ludGVyRG93bicpO1xuXG5cdFx0aWYoX3BvaW50ZXJFdmVudEVuYWJsZWQpIHtcblx0XHRcdHZhciBwb2ludGVySW5kZXggPSBmcmFtZXdvcmsuYXJyYXlTZWFyY2goX2N1cnJQb2ludGVycywgZS5wb2ludGVySWQsICdpZCcpO1xuXHRcdFx0aWYocG9pbnRlckluZGV4IDwgMCkge1xuXHRcdFx0XHRwb2ludGVySW5kZXggPSBfY3VyclBvaW50ZXJzLmxlbmd0aDtcblx0XHRcdH1cblx0XHRcdF9jdXJyUG9pbnRlcnNbcG9pbnRlckluZGV4XSA9IHt4OmUucGFnZVgsIHk6ZS5wYWdlWSwgaWQ6IGUucG9pbnRlcklkfTtcblx0XHR9XG5cdFx0XG5cblxuXHRcdHZhciBzdGFydFBvaW50c0xpc3QgPSBfZ2V0VG91Y2hQb2ludHMoZSksXG5cdFx0XHRudW1Qb2ludHMgPSBzdGFydFBvaW50c0xpc3QubGVuZ3RoO1xuXG5cdFx0X2N1cnJlbnRQb2ludHMgPSBudWxsO1xuXG5cdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cblx0XHQvLyBpbml0IGRyYWdcblx0XHRpZighX2lzRHJhZ2dpbmcgfHwgbnVtUG9pbnRzID09PSAxKSB7XG5cblx0XHRcdFxuXG5cdFx0XHRfaXNEcmFnZ2luZyA9IF9pc0ZpcnN0TW92ZSA9IHRydWU7XG5cdFx0XHRmcmFtZXdvcmsuYmluZCh3aW5kb3csIF91cE1vdmVFdmVudHMsIHNlbGYpO1xuXG5cdFx0XHRfaXNab29taW5nSW4gPSBcblx0XHRcdFx0X3dhc092ZXJJbml0aWFsWm9vbSA9IFxuXHRcdFx0XHRfb3BhY2l0eUNoYW5nZWQgPSBcblx0XHRcdFx0X3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCA9IFxuXHRcdFx0XHRfbWFpblNjcm9sbFNoaWZ0ZWQgPSBcblx0XHRcdFx0X21vdmVkID0gXG5cdFx0XHRcdF9pc011bHRpdG91Y2ggPSBcblx0XHRcdFx0X3pvb21TdGFydGVkID0gZmFsc2U7XG5cblx0XHRcdF9kaXJlY3Rpb24gPSBudWxsO1xuXG5cdFx0XHRfc2hvdXQoJ2ZpcnN0VG91Y2hTdGFydCcsIHN0YXJ0UG9pbnRzTGlzdCk7XG5cblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfc3RhcnRQYW5PZmZzZXQsIF9wYW5PZmZzZXQpO1xuXG5cdFx0XHRfY3VyclBhbkRpc3QueCA9IF9jdXJyUGFuRGlzdC55ID0gMDtcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfY3VyclBvaW50LCBzdGFydFBvaW50c0xpc3RbMF0pO1xuXHRcdFx0X2VxdWFsaXplUG9pbnRzKF9zdGFydFBvaW50LCBfY3VyclBvaW50KTtcblxuXHRcdFx0Ly9fZXF1YWxpemVQb2ludHMoX3N0YXJ0TWFpblNjcm9sbFBvcywgX21haW5TY3JvbGxQb3MpO1xuXHRcdFx0X3N0YXJ0TWFpblNjcm9sbFBvcy54ID0gX3NsaWRlU2l6ZS54ICogX2N1cnJQb3NpdGlvbkluZGV4O1xuXG5cdFx0XHRfcG9zUG9pbnRzID0gW3tcblx0XHRcdFx0eDogX2N1cnJQb2ludC54LFxuXHRcdFx0XHR5OiBfY3VyclBvaW50Lnlcblx0XHRcdH1dO1xuXG5cdFx0XHRfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lID0gX2dlc3R1cmVTdGFydFRpbWUgPSBfZ2V0Q3VycmVudFRpbWUoKTtcblxuXHRcdFx0Ly9fbWFpblNjcm9sbEFuaW1hdGlvbkVuZCh0cnVlKTtcblx0XHRcdF9jYWxjdWxhdGVQYW5Cb3VuZHMoIF9jdXJyWm9vbUxldmVsLCB0cnVlICk7XG5cdFx0XHRcblx0XHRcdC8vIFN0YXJ0IHJlbmRlcmluZ1xuXHRcdFx0X3N0b3BEcmFnVXBkYXRlTG9vcCgpO1xuXHRcdFx0X2RyYWdVcGRhdGVMb29wKCk7XG5cdFx0XHRcblx0XHR9XG5cblx0XHQvLyBpbml0IHpvb21cblx0XHRpZighX2lzWm9vbWluZyAmJiBudW1Qb2ludHMgPiAxICYmICFfbWFpblNjcm9sbEFuaW1hdGluZyAmJiAhX21haW5TY3JvbGxTaGlmdGVkKSB7XG5cdFx0XHRfc3RhcnRab29tTGV2ZWwgPSBfY3Vyclpvb21MZXZlbDtcblx0XHRcdF96b29tU3RhcnRlZCA9IGZhbHNlOyAvLyB0cnVlIGlmIHpvb20gY2hhbmdlZCBhdCBsZWFzdCBvbmNlXG5cblx0XHRcdF9pc1pvb21pbmcgPSBfaXNNdWx0aXRvdWNoID0gdHJ1ZTtcblx0XHRcdF9jdXJyUGFuRGlzdC55ID0gX2N1cnJQYW5EaXN0LnggPSAwO1xuXG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX3N0YXJ0UGFuT2Zmc2V0LCBfcGFuT2Zmc2V0KTtcblxuXHRcdFx0X2VxdWFsaXplUG9pbnRzKHAsIHN0YXJ0UG9pbnRzTGlzdFswXSk7XG5cdFx0XHRfZXF1YWxpemVQb2ludHMocDIsIHN0YXJ0UG9pbnRzTGlzdFsxXSk7XG5cblx0XHRcdF9maW5kQ2VudGVyT2ZQb2ludHMocCwgcDIsIF9jdXJyQ2VudGVyUG9pbnQpO1xuXG5cdFx0XHRfbWlkWm9vbVBvaW50LnggPSBNYXRoLmFicyhfY3VyckNlbnRlclBvaW50LngpIC0gX3Bhbk9mZnNldC54O1xuXHRcdFx0X21pZFpvb21Qb2ludC55ID0gTWF0aC5hYnMoX2N1cnJDZW50ZXJQb2ludC55KSAtIF9wYW5PZmZzZXQueTtcblx0XHRcdF9jdXJyUG9pbnRzRGlzdGFuY2UgPSBfc3RhcnRQb2ludHNEaXN0YW5jZSA9IF9jYWxjdWxhdGVQb2ludHNEaXN0YW5jZShwLCBwMik7XG5cdFx0fVxuXG5cblx0fSxcblxuXHQvLyBQb2ludGVybW92ZS90b3VjaG1vdmUvbW91c2Vtb3ZlIGhhbmRsZXJcblx0X29uRHJhZ01vdmUgPSBmdW5jdGlvbihlKSB7XG5cblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRpZihfcG9pbnRlckV2ZW50RW5hYmxlZCkge1xuXHRcdFx0dmFyIHBvaW50ZXJJbmRleCA9IGZyYW1ld29yay5hcnJheVNlYXJjaChfY3VyclBvaW50ZXJzLCBlLnBvaW50ZXJJZCwgJ2lkJyk7XG5cdFx0XHRpZihwb2ludGVySW5kZXggPiAtMSkge1xuXHRcdFx0XHR2YXIgcCA9IF9jdXJyUG9pbnRlcnNbcG9pbnRlckluZGV4XTtcblx0XHRcdFx0cC54ID0gZS5wYWdlWDtcblx0XHRcdFx0cC55ID0gZS5wYWdlWTsgXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoX2lzRHJhZ2dpbmcpIHtcblx0XHRcdHZhciB0b3VjaGVzTGlzdCA9IF9nZXRUb3VjaFBvaW50cyhlKTtcblx0XHRcdGlmKCFfZGlyZWN0aW9uICYmICFfbW92ZWQgJiYgIV9pc1pvb21pbmcpIHtcblxuXHRcdFx0XHRpZihfbWFpblNjcm9sbFBvcy54ICE9PSBfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXgpIHtcblx0XHRcdFx0XHQvLyBpZiBtYWluIHNjcm9sbCBwb3NpdGlvbiBpcyBzaGlmdGVkIOKAkyBkaXJlY3Rpb24gaXMgYWx3YXlzIGhvcml6b250YWxcblx0XHRcdFx0XHRfZGlyZWN0aW9uID0gJ2gnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZhciBkaWZmID0gTWF0aC5hYnModG91Y2hlc0xpc3RbMF0ueCAtIF9jdXJyUG9pbnQueCkgLSBNYXRoLmFicyh0b3VjaGVzTGlzdFswXS55IC0gX2N1cnJQb2ludC55KTtcblx0XHRcdFx0XHQvLyBjaGVjayB0aGUgZGlyZWN0aW9uIG9mIG1vdmVtZW50XG5cdFx0XHRcdFx0aWYoTWF0aC5hYnMoZGlmZikgPj0gRElSRUNUSU9OX0NIRUNLX09GRlNFVCkge1xuXHRcdFx0XHRcdFx0X2RpcmVjdGlvbiA9IGRpZmYgPiAwID8gJ2gnIDogJ3YnO1xuXHRcdFx0XHRcdFx0X2N1cnJlbnRQb2ludHMgPSB0b3VjaGVzTGlzdDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRfY3VycmVudFBvaW50cyA9IHRvdWNoZXNMaXN0O1xuXHRcdFx0fVxuXHRcdH1cdFxuXHR9LFxuXHQvLyBcblx0X3JlbmRlck1vdmVtZW50ID0gIGZ1bmN0aW9uKCkge1xuXG5cdFx0aWYoIV9jdXJyZW50UG9pbnRzKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG51bVBvaW50cyA9IF9jdXJyZW50UG9pbnRzLmxlbmd0aDtcblxuXHRcdGlmKG51bVBvaW50cyA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdF9lcXVhbGl6ZVBvaW50cyhwLCBfY3VycmVudFBvaW50c1swXSk7XG5cblx0XHRkZWx0YS54ID0gcC54IC0gX2N1cnJQb2ludC54O1xuXHRcdGRlbHRhLnkgPSBwLnkgLSBfY3VyclBvaW50Lnk7XG5cblx0XHRpZihfaXNab29taW5nICYmIG51bVBvaW50cyA+IDEpIHtcblx0XHRcdC8vIEhhbmRsZSBiZWhhdmlvdXIgZm9yIG1vcmUgdGhhbiAxIHBvaW50XG5cblx0XHRcdF9jdXJyUG9pbnQueCA9IHAueDtcblx0XHRcdF9jdXJyUG9pbnQueSA9IHAueTtcblx0XHRcblx0XHRcdC8vIGNoZWNrIGlmIG9uZSBvZiB0d28gcG9pbnRzIGNoYW5nZWRcblx0XHRcdGlmKCAhZGVsdGEueCAmJiAhZGVsdGEueSAmJiBfaXNFcXVhbFBvaW50cyhfY3VycmVudFBvaW50c1sxXSwgcDIpICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhwMiwgX2N1cnJlbnRQb2ludHNbMV0pO1xuXG5cblx0XHRcdGlmKCFfem9vbVN0YXJ0ZWQpIHtcblx0XHRcdFx0X3pvb21TdGFydGVkID0gdHJ1ZTtcblx0XHRcdFx0X3Nob3V0KCd6b29tR2VzdHVyZVN0YXJ0ZWQnKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gRGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG5cdFx0XHR2YXIgcG9pbnRzRGlzdGFuY2UgPSBfY2FsY3VsYXRlUG9pbnRzRGlzdGFuY2UocCxwMik7XG5cblx0XHRcdHZhciB6b29tTGV2ZWwgPSBfY2FsY3VsYXRlWm9vbUxldmVsKHBvaW50c0Rpc3RhbmNlKTtcblxuXHRcdFx0Ly8gc2xpZ2h0bHkgb3ZlciB0aGUgb2YgaW5pdGlhbCB6b29tIGxldmVsXG5cdFx0XHRpZih6b29tTGV2ZWwgPiBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgKyBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgLyAxNSkge1xuXHRcdFx0XHRfd2FzT3ZlckluaXRpYWxab29tID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQXBwbHkgdGhlIGZyaWN0aW9uIGlmIHpvb20gbGV2ZWwgaXMgb3V0IG9mIHRoZSBib3VuZHNcblx0XHRcdHZhciB6b29tRnJpY3Rpb24gPSAxLFxuXHRcdFx0XHRtaW5ab29tTGV2ZWwgPSBfZ2V0TWluWm9vbUxldmVsKCksXG5cdFx0XHRcdG1heFpvb21MZXZlbCA9IF9nZXRNYXhab29tTGV2ZWwoKTtcblxuXHRcdFx0aWYgKCB6b29tTGV2ZWwgPCBtaW5ab29tTGV2ZWwgKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihfb3B0aW9ucy5waW5jaFRvQ2xvc2UgJiYgIV93YXNPdmVySW5pdGlhbFpvb20gJiYgX3N0YXJ0Wm9vbUxldmVsIDw9IHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCkge1xuXHRcdFx0XHRcdC8vIGZhZGUgb3V0IGJhY2tncm91bmQgaWYgem9vbWluZyBvdXRcblx0XHRcdFx0XHR2YXIgbWludXNEaWZmID0gbWluWm9vbUxldmVsIC0gem9vbUxldmVsO1xuXHRcdFx0XHRcdHZhciBwZXJjZW50ID0gMSAtIG1pbnVzRGlmZiAvIChtaW5ab29tTGV2ZWwgLyAxLjIpO1xuXG5cdFx0XHRcdFx0X2FwcGx5QmdPcGFjaXR5KHBlcmNlbnQpO1xuXHRcdFx0XHRcdF9zaG91dCgnb25QaW5jaENsb3NlJywgcGVyY2VudCk7XG5cdFx0XHRcdFx0X29wYWNpdHlDaGFuZ2VkID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR6b29tRnJpY3Rpb24gPSAobWluWm9vbUxldmVsIC0gem9vbUxldmVsKSAvIG1pblpvb21MZXZlbDtcblx0XHRcdFx0XHRpZih6b29tRnJpY3Rpb24gPiAxKSB7XG5cdFx0XHRcdFx0XHR6b29tRnJpY3Rpb24gPSAxO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR6b29tTGV2ZWwgPSBtaW5ab29tTGV2ZWwgLSB6b29tRnJpY3Rpb24gKiAobWluWm9vbUxldmVsIC8gMyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9IGVsc2UgaWYgKCB6b29tTGV2ZWwgPiBtYXhab29tTGV2ZWwgKSB7XG5cdFx0XHRcdC8vIDEuNSAtIGV4dHJhIHpvb20gbGV2ZWwgYWJvdmUgdGhlIG1heC4gRS5nLiBpZiBtYXggaXMgeDYsIHJlYWwgbWF4IDYgKyAxLjUgPSA3LjVcblx0XHRcdFx0em9vbUZyaWN0aW9uID0gKHpvb21MZXZlbCAtIG1heFpvb21MZXZlbCkgLyAoIG1pblpvb21MZXZlbCAqIDYgKTtcblx0XHRcdFx0aWYoem9vbUZyaWN0aW9uID4gMSkge1xuXHRcdFx0XHRcdHpvb21GcmljdGlvbiA9IDE7XG5cdFx0XHRcdH1cblx0XHRcdFx0em9vbUxldmVsID0gbWF4Wm9vbUxldmVsICsgem9vbUZyaWN0aW9uICogbWluWm9vbUxldmVsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZih6b29tRnJpY3Rpb24gPCAwKSB7XG5cdFx0XHRcdHpvb21GcmljdGlvbiA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGRpc3RhbmNlIGJldHdlZW4gdG91Y2ggcG9pbnRzIGFmdGVyIGZyaWN0aW9uIGlzIGFwcGxpZWRcblx0XHRcdF9jdXJyUG9pbnRzRGlzdGFuY2UgPSBwb2ludHNEaXN0YW5jZTtcblxuXHRcdFx0Ly8gX2NlbnRlclBvaW50IC0gVGhlIHBvaW50IGluIHRoZSBtaWRkbGUgb2YgdHdvIHBvaW50ZXJzXG5cdFx0XHRfZmluZENlbnRlck9mUG9pbnRzKHAsIHAyLCBfY2VudGVyUG9pbnQpO1xuXHRcdFxuXHRcdFx0Ly8gcGFuaW5nIHdpdGggdHdvIHBvaW50ZXJzIHByZXNzZWRcblx0XHRcdF9jdXJyUGFuRGlzdC54ICs9IF9jZW50ZXJQb2ludC54IC0gX2N1cnJDZW50ZXJQb2ludC54O1xuXHRcdFx0X2N1cnJQYW5EaXN0LnkgKz0gX2NlbnRlclBvaW50LnkgLSBfY3VyckNlbnRlclBvaW50Lnk7XG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX2N1cnJDZW50ZXJQb2ludCwgX2NlbnRlclBvaW50KTtcblxuXHRcdFx0X3Bhbk9mZnNldC54ID0gX2NhbGN1bGF0ZVBhbk9mZnNldCgneCcsIHpvb21MZXZlbCk7XG5cdFx0XHRfcGFuT2Zmc2V0LnkgPSBfY2FsY3VsYXRlUGFuT2Zmc2V0KCd5Jywgem9vbUxldmVsKTtcblxuXHRcdFx0X2lzWm9vbWluZ0luID0gem9vbUxldmVsID4gX2N1cnJab29tTGV2ZWw7XG5cdFx0XHRfY3Vyclpvb21MZXZlbCA9IHpvb21MZXZlbDtcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyBoYW5kbGUgYmVoYXZpb3VyIGZvciBvbmUgcG9pbnQgKGRyYWdnaW5nIG9yIHBhbm5pbmcpXG5cblx0XHRcdGlmKCFfZGlyZWN0aW9uKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoX2lzRmlyc3RNb3ZlKSB7XG5cdFx0XHRcdF9pc0ZpcnN0TW92ZSA9IGZhbHNlO1xuXG5cdFx0XHRcdC8vIHN1YnRyYWN0IGRyYWcgZGlzdGFuY2UgdGhhdCB3YXMgdXNlZCBkdXJpbmcgdGhlIGRldGVjdGlvbiBkaXJlY3Rpb24gIFxuXG5cdFx0XHRcdGlmKCBNYXRoLmFicyhkZWx0YS54KSA+PSBESVJFQ1RJT05fQ0hFQ0tfT0ZGU0VUKSB7XG5cdFx0XHRcdFx0ZGVsdGEueCAtPSBfY3VycmVudFBvaW50c1swXS54IC0gX3N0YXJ0UG9pbnQueDtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYoIE1hdGguYWJzKGRlbHRhLnkpID49IERJUkVDVElPTl9DSEVDS19PRkZTRVQpIHtcblx0XHRcdFx0XHRkZWx0YS55IC09IF9jdXJyZW50UG9pbnRzWzBdLnkgLSBfc3RhcnRQb2ludC55O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdF9jdXJyUG9pbnQueCA9IHAueDtcblx0XHRcdF9jdXJyUG9pbnQueSA9IHAueTtcblxuXHRcdFx0Ly8gZG8gbm90aGluZyBpZiBwb2ludGVycyBwb3NpdGlvbiBoYXNuJ3QgY2hhbmdlZFxuXHRcdFx0aWYoZGVsdGEueCA9PT0gMCAmJiBkZWx0YS55ID09PSAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoX2RpcmVjdGlvbiA9PT0gJ3YnICYmIF9vcHRpb25zLmNsb3NlT25WZXJ0aWNhbERyYWcpIHtcblx0XHRcdFx0aWYoIV9jYW5QYW4oKSkge1xuXHRcdFx0XHRcdF9jdXJyUGFuRGlzdC55ICs9IGRlbHRhLnk7XG5cdFx0XHRcdFx0X3Bhbk9mZnNldC55ICs9IGRlbHRhLnk7XG5cblx0XHRcdFx0XHR2YXIgb3BhY2l0eVJhdGlvID0gX2NhbGN1bGF0ZVZlcnRpY2FsRHJhZ09wYWNpdHlSYXRpbygpO1xuXG5cdFx0XHRcdFx0X3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCA9IHRydWU7XG5cdFx0XHRcdFx0X3Nob3V0KCdvblZlcnRpY2FsRHJhZycsIG9wYWNpdHlSYXRpbyk7XG5cblx0XHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkob3BhY2l0eVJhdGlvKTtcblx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdHJldHVybiA7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X3B1c2hQb3NQb2ludChfZ2V0Q3VycmVudFRpbWUoKSwgcC54LCBwLnkpO1xuXG5cdFx0XHRfbW92ZWQgPSB0cnVlO1xuXHRcdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcblx0XHRcdFxuXHRcdFx0dmFyIG1haW5TY3JvbGxDaGFuZ2VkID0gX3Bhbk9yTW92ZU1haW5TY3JvbGwoJ3gnLCBkZWx0YSk7XG5cdFx0XHRpZighbWFpblNjcm9sbENoYW5nZWQpIHtcblx0XHRcdFx0X3Bhbk9yTW92ZU1haW5TY3JvbGwoJ3knLCBkZWx0YSk7XG5cblx0XHRcdFx0X3JvdW5kUG9pbnQoX3Bhbk9mZnNldCk7XG5cdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSxcblx0XG5cdC8vIFBvaW50ZXJ1cC9wb2ludGVyY2FuY2VsL3RvdWNoZW5kL3RvdWNoY2FuY2VsL21vdXNldXAgZXZlbnQgaGFuZGxlclxuXHRfb25EcmFnUmVsZWFzZSA9IGZ1bmN0aW9uKGUpIHtcblxuXHRcdGlmKF9mZWF0dXJlcy5pc09sZEFuZHJvaWQgKSB7XG5cblx0XHRcdGlmKF9vbGRBbmRyb2lkVG91Y2hFbmRUaW1lb3V0ICYmIGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gb24gQW5kcm9pZCAodjQuMSwgNC4yLCA0LjMgJiBwb3NzaWJseSBvbGRlcikgXG5cdFx0XHQvLyBnaG9zdCBtb3VzZWRvd24vdXAgZXZlbnQgaXNuJ3QgcHJldmVudGFibGUgdmlhIGUucHJldmVudERlZmF1bHQsXG5cdFx0XHQvLyB3aGljaCBjYXVzZXMgZmFrZSBtb3VzZWRvd24gZXZlbnRcblx0XHRcdC8vIHNvIHdlIGJsb2NrIG1vdXNlZG93bi91cCBmb3IgNjAwbXNcblx0XHRcdGlmKCBlLnR5cGUuaW5kZXhPZigndG91Y2gnKSA+IC0xICkge1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoX29sZEFuZHJvaWRUb3VjaEVuZFRpbWVvdXQpO1xuXHRcdFx0XHRfb2xkQW5kcm9pZFRvdWNoRW5kVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0X29sZEFuZHJvaWRUb3VjaEVuZFRpbWVvdXQgPSAwO1xuXHRcdFx0XHR9LCA2MDApO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fVxuXG5cdFx0X3Nob3V0KCdwb2ludGVyVXAnKTtcblxuXHRcdGlmKF9wcmV2ZW50RGVmYXVsdEV2ZW50QmVoYXZpb3VyKGUsIGZhbHNlKSkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdHZhciByZWxlYXNlUG9pbnQ7XG5cblx0XHRpZihfcG9pbnRlckV2ZW50RW5hYmxlZCkge1xuXHRcdFx0dmFyIHBvaW50ZXJJbmRleCA9IGZyYW1ld29yay5hcnJheVNlYXJjaChfY3VyclBvaW50ZXJzLCBlLnBvaW50ZXJJZCwgJ2lkJyk7XG5cdFx0XHRcblx0XHRcdGlmKHBvaW50ZXJJbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJlbGVhc2VQb2ludCA9IF9jdXJyUG9pbnRlcnMuc3BsaWNlKHBvaW50ZXJJbmRleCwgMSlbMF07XG5cblx0XHRcdFx0aWYobmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdFx0cmVsZWFzZVBvaW50LnR5cGUgPSBlLnBvaW50ZXJUeXBlIHx8ICdtb3VzZSc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmFyIE1TUE9JTlRFUl9UWVBFUyA9IHtcblx0XHRcdFx0XHRcdDQ6ICdtb3VzZScsIC8vIGV2ZW50Lk1TUE9JTlRFUl9UWVBFX01PVVNFXG5cdFx0XHRcdFx0XHQyOiAndG91Y2gnLCAvLyBldmVudC5NU1BPSU5URVJfVFlQRV9UT1VDSCBcblx0XHRcdFx0XHRcdDM6ICdwZW4nIC8vIGV2ZW50Lk1TUE9JTlRFUl9UWVBFX1BFTlxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0cmVsZWFzZVBvaW50LnR5cGUgPSBNU1BPSU5URVJfVFlQRVNbZS5wb2ludGVyVHlwZV07XG5cblx0XHRcdFx0XHRpZighcmVsZWFzZVBvaW50LnR5cGUpIHtcblx0XHRcdFx0XHRcdHJlbGVhc2VQb2ludC50eXBlID0gZS5wb2ludGVyVHlwZSB8fCAnbW91c2UnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIHRvdWNoTGlzdCA9IF9nZXRUb3VjaFBvaW50cyhlKSxcblx0XHRcdGdlc3R1cmVUeXBlLFxuXHRcdFx0bnVtUG9pbnRzID0gdG91Y2hMaXN0Lmxlbmd0aDtcblxuXHRcdGlmKGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XG5cdFx0XHRudW1Qb2ludHMgPSAwO1xuXHRcdH1cblxuXHRcdC8vIERvIG5vdGhpbmcgaWYgdGhlcmUgd2VyZSAzIHRvdWNoIHBvaW50cyBvciBtb3JlXG5cdFx0aWYobnVtUG9pbnRzID09PSAyKSB7XG5cdFx0XHRfY3VycmVudFBvaW50cyA9IG51bGw7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBpZiBzZWNvbmQgcG9pbnRlciByZWxlYXNlZFxuXHRcdGlmKG51bVBvaW50cyA9PT0gMSkge1xuXHRcdFx0X2VxdWFsaXplUG9pbnRzKF9zdGFydFBvaW50LCB0b3VjaExpc3RbMF0pO1xuXHRcdH1cdFx0XHRcdFxuXG5cblx0XHQvLyBwb2ludGVyIGhhc24ndCBtb3ZlZCwgc2VuZCBcInRhcCByZWxlYXNlXCIgcG9pbnRcblx0XHRpZihudW1Qb2ludHMgPT09IDAgJiYgIV9kaXJlY3Rpb24gJiYgIV9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XG5cdFx0XHRpZighcmVsZWFzZVBvaW50KSB7XG5cdFx0XHRcdGlmKGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XG5cdFx0XHRcdFx0cmVsZWFzZVBvaW50ID0ge3g6IGUucGFnZVgsIHk6IGUucGFnZVksIHR5cGU6J21vdXNlJ307XG5cdFx0XHRcdH0gZWxzZSBpZihlLmNoYW5nZWRUb3VjaGVzICYmIGUuY2hhbmdlZFRvdWNoZXNbMF0pIHtcblx0XHRcdFx0XHRyZWxlYXNlUG9pbnQgPSB7eDogZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCwgeTogZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSwgdHlwZTondG91Y2gnfTtcblx0XHRcdFx0fVx0XHRcblx0XHRcdH1cblxuXHRcdFx0X3Nob3V0KCd0b3VjaFJlbGVhc2UnLCBlLCByZWxlYXNlUG9pbnQpO1xuXHRcdH1cblxuXHRcdC8vIERpZmZlcmVuY2UgaW4gdGltZSBiZXR3ZWVuIHJlbGVhc2luZyBvZiB0d28gbGFzdCB0b3VjaCBwb2ludHMgKHpvb20gZ2VzdHVyZSlcblx0XHR2YXIgcmVsZWFzZVRpbWVEaWZmID0gLTE7XG5cblx0XHQvLyBHZXN0dXJlIGNvbXBsZXRlZCwgbm8gcG9pbnRlcnMgbGVmdFxuXHRcdGlmKG51bVBvaW50cyA9PT0gMCkge1xuXHRcdFx0X2lzRHJhZ2dpbmcgPSBmYWxzZTtcblx0XHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCBfdXBNb3ZlRXZlbnRzLCBzZWxmKTtcblxuXHRcdFx0X3N0b3BEcmFnVXBkYXRlTG9vcCgpO1xuXG5cdFx0XHRpZihfaXNab29taW5nKSB7XG5cdFx0XHRcdC8vIFR3byBwb2ludHMgcmVsZWFzZWQgYXQgdGhlIHNhbWUgdGltZVxuXHRcdFx0XHRyZWxlYXNlVGltZURpZmYgPSAwO1xuXHRcdFx0fSBlbHNlIGlmKF9sYXN0UmVsZWFzZVRpbWUgIT09IC0xKSB7XG5cdFx0XHRcdHJlbGVhc2VUaW1lRGlmZiA9IF9nZXRDdXJyZW50VGltZSgpIC0gX2xhc3RSZWxlYXNlVGltZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0X2xhc3RSZWxlYXNlVGltZSA9IG51bVBvaW50cyA9PT0gMSA/IF9nZXRDdXJyZW50VGltZSgpIDogLTE7XG5cdFx0XG5cdFx0aWYocmVsZWFzZVRpbWVEaWZmICE9PSAtMSAmJiByZWxlYXNlVGltZURpZmYgPCAxNTApIHtcblx0XHRcdGdlc3R1cmVUeXBlID0gJ3pvb20nO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRnZXN0dXJlVHlwZSA9ICdzd2lwZSc7XG5cdFx0fVxuXG5cdFx0aWYoX2lzWm9vbWluZyAmJiBudW1Qb2ludHMgPCAyKSB7XG5cdFx0XHRfaXNab29taW5nID0gZmFsc2U7XG5cblx0XHRcdC8vIE9ubHkgc2Vjb25kIHBvaW50IHJlbGVhc2VkXG5cdFx0XHRpZihudW1Qb2ludHMgPT09IDEpIHtcblx0XHRcdFx0Z2VzdHVyZVR5cGUgPSAnem9vbVBvaW50ZXJVcCc7XG5cdFx0XHR9XG5cdFx0XHRfc2hvdXQoJ3pvb21HZXN0dXJlRW5kZWQnKTtcblx0XHR9XG5cblx0XHRfY3VycmVudFBvaW50cyA9IG51bGw7XG5cdFx0aWYoIV9tb3ZlZCAmJiAhX3pvb21TdGFydGVkICYmICFfbWFpblNjcm9sbEFuaW1hdGluZyAmJiAhX3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCkge1xuXHRcdFx0Ly8gbm90aGluZyB0byBhbmltYXRlXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcblx0XHRfc3RvcEFsbEFuaW1hdGlvbnMoKTtcblxuXHRcdFxuXHRcdGlmKCFfcmVsZWFzZUFuaW1EYXRhKSB7XG5cdFx0XHRfcmVsZWFzZUFuaW1EYXRhID0gX2luaXREcmFnUmVsZWFzZUFuaW1hdGlvbkRhdGEoKTtcblx0XHR9XG5cdFx0XG5cdFx0X3JlbGVhc2VBbmltRGF0YS5jYWxjdWxhdGVTd2lwZVNwZWVkKCd4Jyk7XG5cblxuXHRcdGlmKF92ZXJ0aWNhbERyYWdJbml0aWF0ZWQpIHtcblxuXHRcdFx0dmFyIG9wYWNpdHlSYXRpbyA9IF9jYWxjdWxhdGVWZXJ0aWNhbERyYWdPcGFjaXR5UmF0aW8oKTtcblxuXHRcdFx0aWYob3BhY2l0eVJhdGlvIDwgX29wdGlvbnMudmVydGljYWxEcmFnUmFuZ2UpIHtcblx0XHRcdFx0c2VsZi5jbG9zZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIGluaXRhbFBhblkgPSBfcGFuT2Zmc2V0LnksXG5cdFx0XHRcdFx0aW5pdGlhbEJnT3BhY2l0eSA9IF9iZ09wYWNpdHk7XG5cblx0XHRcdFx0X2FuaW1hdGVQcm9wKCd2ZXJ0aWNhbERyYWcnLCAwLCAxLCAzMDAsIGZyYW1ld29yay5lYXNpbmcuY3ViaWMub3V0LCBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSAoc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb24ueSAtIGluaXRhbFBhblkpICogbm93ICsgaW5pdGFsUGFuWTtcblxuXHRcdFx0XHRcdF9hcHBseUJnT3BhY2l0eSggICgxIC0gaW5pdGlhbEJnT3BhY2l0eSkgKiBub3cgKyBpbml0aWFsQmdPcGFjaXR5ICk7XG5cdFx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X3Nob3V0KCdvblZlcnRpY2FsRHJhZycsIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cblx0XHQvLyBtYWluIHNjcm9sbCBcblx0XHRpZiggIChfbWFpblNjcm9sbFNoaWZ0ZWQgfHwgX21haW5TY3JvbGxBbmltYXRpbmcpICYmIG51bVBvaW50cyA9PT0gMCkge1xuXHRcdFx0dmFyIGl0ZW1DaGFuZ2VkID0gX2ZpbmlzaFN3aXBlTWFpblNjcm9sbEdlc3R1cmUoZ2VzdHVyZVR5cGUsIF9yZWxlYXNlQW5pbURhdGEpO1xuXHRcdFx0aWYoaXRlbUNoYW5nZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Z2VzdHVyZVR5cGUgPSAnem9vbVBvaW50ZXJVcCc7XG5cdFx0fVxuXG5cdFx0Ly8gcHJldmVudCB6b29tL3BhbiBhbmltYXRpb24gd2hlbiBtYWluIHNjcm9sbCBhbmltYXRpb24gcnVuc1xuXHRcdGlmKF9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdFxuXHRcdC8vIENvbXBsZXRlIHNpbXBsZSB6b29tIGdlc3R1cmUgKHJlc2V0IHpvb20gbGV2ZWwgaWYgaXQncyBvdXQgb2YgdGhlIGJvdW5kcykgIFxuXHRcdGlmKGdlc3R1cmVUeXBlICE9PSAnc3dpcGUnKSB7XG5cdFx0XHRfY29tcGxldGVab29tR2VzdHVyZSgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XG5cdFx0Ly8gQ29tcGxldGUgcGFuIGdlc3R1cmUgaWYgbWFpbiBzY3JvbGwgaXMgbm90IHNoaWZ0ZWQsIGFuZCBpdCdzIHBvc3NpYmxlIHRvIHBhbiBjdXJyZW50IGltYWdlXG5cdFx0aWYoIV9tYWluU2Nyb2xsU2hpZnRlZCAmJiBfY3Vyclpvb21MZXZlbCA+IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pIHtcblx0XHRcdF9jb21wbGV0ZVBhbkdlc3R1cmUoX3JlbGVhc2VBbmltRGF0YSk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUmV0dXJucyBvYmplY3Qgd2l0aCBkYXRhIGFib3V0IGdlc3R1cmVcblx0Ly8gSXQncyBjcmVhdGVkIG9ubHkgb25jZSBhbmQgdGhlbiByZXVzZWRcblx0X2luaXREcmFnUmVsZWFzZUFuaW1hdGlvbkRhdGEgID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gdGVtcCBsb2NhbCB2YXJzXG5cdFx0dmFyIGxhc3RGbGlja0R1cmF0aW9uLFxuXHRcdFx0dGVtcFJlbGVhc2VQb3M7XG5cblx0XHQvLyBzID0gdGhpc1xuXHRcdHZhciBzID0ge1xuXHRcdFx0bGFzdEZsaWNrT2Zmc2V0OiB7fSxcblx0XHRcdGxhc3RGbGlja0Rpc3Q6IHt9LFxuXHRcdFx0bGFzdEZsaWNrU3BlZWQ6IHt9LFxuXHRcdFx0c2xvd0Rvd25SYXRpbzogIHt9LFxuXHRcdFx0c2xvd0Rvd25SYXRpb1JldmVyc2U6ICB7fSxcblx0XHRcdHNwZWVkRGVjZWxlcmF0aW9uUmF0aW86ICB7fSxcblx0XHRcdHNwZWVkRGVjZWxlcmF0aW9uUmF0aW9BYnM6ICB7fSxcblx0XHRcdGRpc3RhbmNlT2Zmc2V0OiAge30sXG5cdFx0XHRiYWNrQW5pbURlc3RpbmF0aW9uOiB7fSxcblx0XHRcdGJhY2tBbmltU3RhcnRlZDoge30sXG5cdFx0XHRjYWxjdWxhdGVTd2lwZVNwZWVkOiBmdW5jdGlvbihheGlzKSB7XG5cdFx0XHRcdFxuXG5cdFx0XHRcdGlmKCBfcG9zUG9pbnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0XHRsYXN0RmxpY2tEdXJhdGlvbiA9IF9nZXRDdXJyZW50VGltZSgpIC0gX2dlc3R1cmVDaGVja1NwZWVkVGltZSArIDUwO1xuXHRcdFx0XHRcdHRlbXBSZWxlYXNlUG9zID0gX3Bvc1BvaW50c1tfcG9zUG9pbnRzLmxlbmd0aC0yXVtheGlzXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRsYXN0RmxpY2tEdXJhdGlvbiA9IF9nZXRDdXJyZW50VGltZSgpIC0gX2dlc3R1cmVTdGFydFRpbWU7IC8vIHRvdGFsIGdlc3R1cmUgZHVyYXRpb25cblx0XHRcdFx0XHR0ZW1wUmVsZWFzZVBvcyA9IF9zdGFydFBvaW50W2F4aXNdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHMubGFzdEZsaWNrT2Zmc2V0W2F4aXNdID0gX2N1cnJQb2ludFtheGlzXSAtIHRlbXBSZWxlYXNlUG9zO1xuXHRcdFx0XHRzLmxhc3RGbGlja0Rpc3RbYXhpc10gPSBNYXRoLmFicyhzLmxhc3RGbGlja09mZnNldFtheGlzXSk7XG5cdFx0XHRcdGlmKHMubGFzdEZsaWNrRGlzdFtheGlzXSA+IDIwKSB7XG5cdFx0XHRcdFx0cy5sYXN0RmxpY2tTcGVlZFtheGlzXSA9IHMubGFzdEZsaWNrT2Zmc2V0W2F4aXNdIC8gbGFzdEZsaWNrRHVyYXRpb247XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cy5sYXN0RmxpY2tTcGVlZFtheGlzXSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoIE1hdGguYWJzKHMubGFzdEZsaWNrU3BlZWRbYXhpc10pIDwgMC4xICkge1xuXHRcdFx0XHRcdHMubGFzdEZsaWNrU3BlZWRbYXhpc10gPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRzLnNsb3dEb3duUmF0aW9bYXhpc10gPSAwLjk1O1xuXHRcdFx0XHRzLnNsb3dEb3duUmF0aW9SZXZlcnNlW2F4aXNdID0gMSAtIHMuc2xvd0Rvd25SYXRpb1theGlzXTtcblx0XHRcdFx0cy5zcGVlZERlY2VsZXJhdGlvblJhdGlvW2F4aXNdID0gMTtcblx0XHRcdH0sXG5cblx0XHRcdGNhbGN1bGF0ZU92ZXJCb3VuZHNBbmltT2Zmc2V0OiBmdW5jdGlvbihheGlzLCBzcGVlZCkge1xuXHRcdFx0XHRpZighcy5iYWNrQW5pbVN0YXJ0ZWRbYXhpc10pIHtcblxuXHRcdFx0XHRcdGlmKF9wYW5PZmZzZXRbYXhpc10gPiBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10pIHtcblx0XHRcdFx0XHRcdHMuYmFja0FuaW1EZXN0aW5hdGlvbltheGlzXSA9IF9jdXJyUGFuQm91bmRzLm1pbltheGlzXTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH0gZWxzZSBpZihfcGFuT2Zmc2V0W2F4aXNdIDwgX2N1cnJQYW5Cb3VuZHMubWF4W2F4aXNdKSB7XG5cdFx0XHRcdFx0XHRzLmJhY2tBbmltRGVzdGluYXRpb25bYXhpc10gPSBfY3VyclBhbkJvdW5kcy5tYXhbYXhpc107XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYocy5iYWNrQW5pbURlc3RpbmF0aW9uW2F4aXNdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1theGlzXSA9IDAuNztcblx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gPSAxIC0gcy5zbG93RG93blJhdGlvW2F4aXNdO1xuXHRcdFx0XHRcdFx0aWYocy5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzW2F4aXNdIDwgMC4wNSkge1xuXG5cdFx0XHRcdFx0XHRcdHMubGFzdEZsaWNrU3BlZWRbYXhpc10gPSAwO1xuXHRcdFx0XHRcdFx0XHRzLmJhY2tBbmltU3RhcnRlZFtheGlzXSA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0X2FuaW1hdGVQcm9wKCdib3VuY2Vab29tUGFuJytheGlzLF9wYW5PZmZzZXRbYXhpc10sIFxuXHRcdFx0XHRcdFx0XHRcdHMuYmFja0FuaW1EZXN0aW5hdGlvbltheGlzXSwgXG5cdFx0XHRcdFx0XHRcdFx0c3BlZWQgfHwgMzAwLCBcblx0XHRcdFx0XHRcdFx0XHRmcmFtZXdvcmsuZWFzaW5nLnNpbmUub3V0LCBcblx0XHRcdFx0XHRcdFx0XHRmdW5jdGlvbihwb3MpIHtcblx0XHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXRbYXhpc10gPSBwb3M7XG5cdFx0XHRcdFx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0Ly8gUmVkdWNlcyB0aGUgc3BlZWQgYnkgc2xvd0Rvd25SYXRpbyAocGVyIDEwbXMpXG5cdFx0XHRjYWxjdWxhdGVBbmltT2Zmc2V0OiBmdW5jdGlvbihheGlzKSB7XG5cdFx0XHRcdGlmKCFzLmJhY2tBbmltU3RhcnRlZFtheGlzXSkge1xuXHRcdFx0XHRcdHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSA9IHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSAqIChzLnNsb3dEb3duUmF0aW9bYXhpc10gKyBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gLSBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gKiBzLnRpbWVEaWZmIC8gMTApO1xuXG5cdFx0XHRcdFx0cy5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzW2F4aXNdID0gTWF0aC5hYnMocy5sYXN0RmxpY2tTcGVlZFtheGlzXSAqIHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSk7XG5cdFx0XHRcdFx0cy5kaXN0YW5jZU9mZnNldFtheGlzXSA9IHMubGFzdEZsaWNrU3BlZWRbYXhpc10gKiBzLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9bYXhpc10gKiBzLnRpbWVEaWZmO1xuXHRcdFx0XHRcdF9wYW5PZmZzZXRbYXhpc10gKz0gcy5kaXN0YW5jZU9mZnNldFtheGlzXTtcblxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRwYW5BbmltTG9vcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggX2FuaW1hdGlvbnMuem9vbVBhbiApIHtcblx0XHRcdFx0XHRfYW5pbWF0aW9ucy56b29tUGFuLnJhZiA9IF9yZXF1ZXN0QUYocy5wYW5BbmltTG9vcCk7XG5cblx0XHRcdFx0XHRzLm5vdyA9IF9nZXRDdXJyZW50VGltZSgpO1xuXHRcdFx0XHRcdHMudGltZURpZmYgPSBzLm5vdyAtIHMubGFzdE5vdztcblx0XHRcdFx0XHRzLmxhc3ROb3cgPSBzLm5vdztcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRzLmNhbGN1bGF0ZUFuaW1PZmZzZXQoJ3gnKTtcblx0XHRcdFx0XHRzLmNhbGN1bGF0ZUFuaW1PZmZzZXQoJ3knKTtcblxuXHRcdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0cy5jYWxjdWxhdGVPdmVyQm91bmRzQW5pbU9mZnNldCgneCcpO1xuXHRcdFx0XHRcdHMuY2FsY3VsYXRlT3ZlckJvdW5kc0FuaW1PZmZzZXQoJ3knKTtcblxuXG5cdFx0XHRcdFx0aWYgKHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb0Ficy54IDwgMC4wNSAmJiBzLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9BYnMueSA8IDAuMDUpIHtcblxuXHRcdFx0XHRcdFx0Ly8gcm91bmQgcGFuIHBvc2l0aW9uXG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggPSBNYXRoLnJvdW5kKF9wYW5PZmZzZXQueCk7XG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSBNYXRoLnJvdW5kKF9wYW5PZmZzZXQueSk7XG5cdFx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRfc3RvcEFuaW1hdGlvbignem9vbVBhbicpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fTtcblx0XHRyZXR1cm4gcztcblx0fSxcblxuXHRfY29tcGxldGVQYW5HZXN0dXJlID0gZnVuY3Rpb24oYW5pbURhdGEpIHtcblx0XHQvLyBjYWxjdWxhdGUgc3dpcGUgc3BlZWQgZm9yIFkgYXhpcyAocGFhbm5pbmcpXG5cdFx0YW5pbURhdGEuY2FsY3VsYXRlU3dpcGVTcGVlZCgneScpO1xuXG5cdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcblx0XHRcblx0XHRhbmltRGF0YS5iYWNrQW5pbURlc3RpbmF0aW9uID0ge307XG5cdFx0YW5pbURhdGEuYmFja0FuaW1TdGFydGVkID0ge307XG5cblx0XHQvLyBBdm9pZCBhY2NlbGVyYXRpb24gYW5pbWF0aW9uIGlmIHNwZWVkIGlzIHRvbyBsb3dcblx0XHRpZihNYXRoLmFicyhhbmltRGF0YS5sYXN0RmxpY2tTcGVlZC54KSA8PSAwLjA1ICYmIE1hdGguYWJzKGFuaW1EYXRhLmxhc3RGbGlja1NwZWVkLnkpIDw9IDAuMDUgKSB7XG5cdFx0XHRhbmltRGF0YS5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzLnggPSBhbmltRGF0YS5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzLnkgPSAwO1xuXG5cdFx0XHQvLyBSdW4gcGFuIGRyYWcgcmVsZWFzZSBhbmltYXRpb24uIEUuZy4gaWYgeW91IGRyYWcgaW1hZ2UgYW5kIHJlbGVhc2UgZmluZ2VyIHdpdGhvdXQgbW9tZW50dW0uXG5cdFx0XHRhbmltRGF0YS5jYWxjdWxhdGVPdmVyQm91bmRzQW5pbU9mZnNldCgneCcpO1xuXHRcdFx0YW5pbURhdGEuY2FsY3VsYXRlT3ZlckJvdW5kc0FuaW1PZmZzZXQoJ3knKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIEFuaW1hdGlvbiBsb29wIHRoYXQgY29udHJvbHMgdGhlIGFjY2VsZXJhdGlvbiBhZnRlciBwYW4gZ2VzdHVyZSBlbmRzXG5cdFx0X3JlZ2lzdGVyU3RhcnRBbmltYXRpb24oJ3pvb21QYW4nKTtcblx0XHRhbmltRGF0YS5sYXN0Tm93ID0gX2dldEN1cnJlbnRUaW1lKCk7XG5cdFx0YW5pbURhdGEucGFuQW5pbUxvb3AoKTtcblx0fSxcblxuXG5cdF9maW5pc2hTd2lwZU1haW5TY3JvbGxHZXN0dXJlID0gZnVuY3Rpb24oZ2VzdHVyZVR5cGUsIF9yZWxlYXNlQW5pbURhdGEpIHtcblx0XHR2YXIgaXRlbUNoYW5nZWQ7XG5cdFx0aWYoIV9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XG5cdFx0XHRfY3Vyclpvb21lZEl0ZW1JbmRleCA9IF9jdXJyZW50SXRlbUluZGV4O1xuXHRcdH1cblxuXG5cdFx0XG5cdFx0dmFyIGl0ZW1zRGlmZjtcblxuXHRcdGlmKGdlc3R1cmVUeXBlID09PSAnc3dpcGUnKSB7XG5cdFx0XHR2YXIgdG90YWxTaGlmdERpc3QgPSBfY3VyclBvaW50LnggLSBfc3RhcnRQb2ludC54LFxuXHRcdFx0XHRpc0Zhc3RMYXN0RmxpY2sgPSBfcmVsZWFzZUFuaW1EYXRhLmxhc3RGbGlja0Rpc3QueCA8IDEwO1xuXG5cdFx0XHQvLyBpZiBjb250YWluZXIgaXMgc2hpZnRlZCBmb3IgbW9yZSB0aGFuIE1JTl9TV0lQRV9ESVNUQU5DRSwgXG5cdFx0XHQvLyBhbmQgbGFzdCBmbGljayBnZXN0dXJlIHdhcyBpbiByaWdodCBkaXJlY3Rpb25cblx0XHRcdGlmKHRvdGFsU2hpZnREaXN0ID4gTUlOX1NXSVBFX0RJU1RBTkNFICYmIFxuXHRcdFx0XHQoaXNGYXN0TGFzdEZsaWNrIHx8IF9yZWxlYXNlQW5pbURhdGEubGFzdEZsaWNrT2Zmc2V0LnggPiAyMCkgKSB7XG5cdFx0XHRcdC8vIGdvIHRvIHByZXYgaXRlbVxuXHRcdFx0XHRpdGVtc0RpZmYgPSAtMTtcblx0XHRcdH0gZWxzZSBpZih0b3RhbFNoaWZ0RGlzdCA8IC1NSU5fU1dJUEVfRElTVEFOQ0UgJiYgXG5cdFx0XHRcdChpc0Zhc3RMYXN0RmxpY2sgfHwgX3JlbGVhc2VBbmltRGF0YS5sYXN0RmxpY2tPZmZzZXQueCA8IC0yMCkgKSB7XG5cdFx0XHRcdC8vIGdvIHRvIG5leHQgaXRlbVxuXHRcdFx0XHRpdGVtc0RpZmYgPSAxO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHZhciBuZXh0Q2lyY2xlO1xuXG5cdFx0aWYoaXRlbXNEaWZmKSB7XG5cdFx0XHRcblx0XHRcdF9jdXJyZW50SXRlbUluZGV4ICs9IGl0ZW1zRGlmZjtcblxuXHRcdFx0aWYoX2N1cnJlbnRJdGVtSW5kZXggPCAwKSB7XG5cdFx0XHRcdF9jdXJyZW50SXRlbUluZGV4ID0gX29wdGlvbnMubG9vcCA/IF9nZXROdW1JdGVtcygpLTEgOiAwO1xuXHRcdFx0XHRuZXh0Q2lyY2xlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSBpZihfY3VycmVudEl0ZW1JbmRleCA+PSBfZ2V0TnVtSXRlbXMoKSkge1xuXHRcdFx0XHRfY3VycmVudEl0ZW1JbmRleCA9IF9vcHRpb25zLmxvb3AgPyAwIDogX2dldE51bUl0ZW1zKCktMTtcblx0XHRcdFx0bmV4dENpcmNsZSA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFuZXh0Q2lyY2xlIHx8IF9vcHRpb25zLmxvb3ApIHtcblx0XHRcdFx0X2luZGV4RGlmZiArPSBpdGVtc0RpZmY7XG5cdFx0XHRcdF9jdXJyUG9zaXRpb25JbmRleCAtPSBpdGVtc0RpZmY7XG5cdFx0XHRcdGl0ZW1DaGFuZ2VkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdFxuXG5cdFx0XHRcblx0XHR9XG5cblx0XHR2YXIgYW5pbWF0ZVRvWCA9IF9zbGlkZVNpemUueCAqIF9jdXJyUG9zaXRpb25JbmRleDtcblx0XHR2YXIgYW5pbWF0ZVRvRGlzdCA9IE1hdGguYWJzKCBhbmltYXRlVG9YIC0gX21haW5TY3JvbGxQb3MueCApO1xuXHRcdHZhciBmaW5pc2hBbmltRHVyYXRpb247XG5cblxuXHRcdGlmKCFpdGVtQ2hhbmdlZCAmJiBhbmltYXRlVG9YID4gX21haW5TY3JvbGxQb3MueCAhPT0gX3JlbGVhc2VBbmltRGF0YS5sYXN0RmxpY2tTcGVlZC54ID4gMCkge1xuXHRcdFx0Ly8gXCJyZXR1cm4gdG8gY3VycmVudFwiIGR1cmF0aW9uLCBlLmcuIHdoZW4gZHJhZ2dpbmcgZnJvbSBzbGlkZSAwIHRvIC0xXG5cdFx0XHRmaW5pc2hBbmltRHVyYXRpb24gPSAzMzM7IFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmaW5pc2hBbmltRHVyYXRpb24gPSBNYXRoLmFicyhfcmVsZWFzZUFuaW1EYXRhLmxhc3RGbGlja1NwZWVkLngpID4gMCA/IFxuXHRcdFx0XHRcdFx0XHRcdFx0YW5pbWF0ZVRvRGlzdCAvIE1hdGguYWJzKF9yZWxlYXNlQW5pbURhdGEubGFzdEZsaWNrU3BlZWQueCkgOiBcblx0XHRcdFx0XHRcdFx0XHRcdDMzMztcblxuXHRcdFx0ZmluaXNoQW5pbUR1cmF0aW9uID0gTWF0aC5taW4oZmluaXNoQW5pbUR1cmF0aW9uLCA0MDApO1xuXHRcdFx0ZmluaXNoQW5pbUR1cmF0aW9uID0gTWF0aC5tYXgoZmluaXNoQW5pbUR1cmF0aW9uLCAyNTApO1xuXHRcdH1cblxuXHRcdGlmKF9jdXJyWm9vbWVkSXRlbUluZGV4ID09PSBfY3VycmVudEl0ZW1JbmRleCkge1xuXHRcdFx0aXRlbUNoYW5nZWQgPSBmYWxzZTtcblx0XHR9XG5cdFx0XG5cdFx0X21haW5TY3JvbGxBbmltYXRpbmcgPSB0cnVlO1xuXHRcdFxuXHRcdF9zaG91dCgnbWFpblNjcm9sbEFuaW1TdGFydCcpO1xuXG5cdFx0X2FuaW1hdGVQcm9wKCdtYWluU2Nyb2xsJywgX21haW5TY3JvbGxQb3MueCwgYW5pbWF0ZVRvWCwgZmluaXNoQW5pbUR1cmF0aW9uLCBmcmFtZXdvcmsuZWFzaW5nLmN1YmljLm91dCwgXG5cdFx0XHRfbW92ZU1haW5TY3JvbGwsXG5cdFx0XHRmdW5jdGlvbigpIHtcblx0XHRcdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cdFx0XHRcdF9tYWluU2Nyb2xsQW5pbWF0aW5nID0gZmFsc2U7XG5cdFx0XHRcdF9jdXJyWm9vbWVkSXRlbUluZGV4ID0gLTE7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihpdGVtQ2hhbmdlZCB8fCBfY3Vyclpvb21lZEl0ZW1JbmRleCAhPT0gX2N1cnJlbnRJdGVtSW5kZXgpIHtcblx0XHRcdFx0XHRzZWxmLnVwZGF0ZUN1cnJJdGVtKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdF9zaG91dCgnbWFpblNjcm9sbEFuaW1Db21wbGV0ZScpO1xuXHRcdFx0fVxuXHRcdCk7XG5cblx0XHRpZihpdGVtQ2hhbmdlZCkge1xuXHRcdFx0c2VsZi51cGRhdGVDdXJySXRlbSh0cnVlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaXRlbUNoYW5nZWQ7XG5cdH0sXG5cblx0X2NhbGN1bGF0ZVpvb21MZXZlbCA9IGZ1bmN0aW9uKHRvdWNoZXNEaXN0YW5jZSkge1xuXHRcdHJldHVybiAgMSAvIF9zdGFydFBvaW50c0Rpc3RhbmNlICogdG91Y2hlc0Rpc3RhbmNlICogX3N0YXJ0Wm9vbUxldmVsO1xuXHR9LFxuXG5cdC8vIFJlc2V0cyB6b29tIGlmIGl0J3Mgb3V0IG9mIGJvdW5kc1xuXHRfY29tcGxldGVab29tR2VzdHVyZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZXN0Wm9vbUxldmVsID0gX2N1cnJab29tTGV2ZWwsXG5cdFx0XHRtaW5ab29tTGV2ZWwgPSBfZ2V0TWluWm9vbUxldmVsKCksXG5cdFx0XHRtYXhab29tTGV2ZWwgPSBfZ2V0TWF4Wm9vbUxldmVsKCk7XG5cblx0XHRpZiAoIF9jdXJyWm9vbUxldmVsIDwgbWluWm9vbUxldmVsICkge1xuXHRcdFx0ZGVzdFpvb21MZXZlbCA9IG1pblpvb21MZXZlbDtcblx0XHR9IGVsc2UgaWYgKCBfY3Vyclpvb21MZXZlbCA+IG1heFpvb21MZXZlbCApIHtcblx0XHRcdGRlc3Rab29tTGV2ZWwgPSBtYXhab29tTGV2ZWw7XG5cdFx0fVxuXG5cdFx0dmFyIGRlc3RPcGFjaXR5ID0gMSxcblx0XHRcdG9uVXBkYXRlLFxuXHRcdFx0aW5pdGlhbE9wYWNpdHkgPSBfYmdPcGFjaXR5O1xuXG5cdFx0aWYoX29wYWNpdHlDaGFuZ2VkICYmICFfaXNab29taW5nSW4gJiYgIV93YXNPdmVySW5pdGlhbFpvb20gJiYgX2N1cnJab29tTGV2ZWwgPCBtaW5ab29tTGV2ZWwpIHtcblx0XHRcdC8vX2Nsb3NlZEJ5U2Nyb2xsID0gdHJ1ZTtcblx0XHRcdHNlbGYuY2xvc2UoKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmKF9vcGFjaXR5Q2hhbmdlZCkge1xuXHRcdFx0b25VcGRhdGUgPSBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0X2FwcGx5QmdPcGFjaXR5KCAgKGRlc3RPcGFjaXR5IC0gaW5pdGlhbE9wYWNpdHkpICogbm93ICsgaW5pdGlhbE9wYWNpdHkgKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0c2VsZi56b29tVG8oZGVzdFpvb21MZXZlbCwgMCwgMjAwLCAgZnJhbWV3b3JrLmVhc2luZy5jdWJpYy5vdXQsIG9uVXBkYXRlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5fcmVnaXN0ZXJNb2R1bGUoJ0dlc3R1cmVzJywge1xuXHRwdWJsaWNNZXRob2RzOiB7XG5cblx0XHRpbml0R2VzdHVyZXM6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQvLyBoZWxwZXIgZnVuY3Rpb24gdGhhdCBidWlsZHMgdG91Y2gvcG9pbnRlci9tb3VzZSBldmVudHNcblx0XHRcdHZhciBhZGRFdmVudE5hbWVzID0gZnVuY3Rpb24ocHJlZiwgZG93biwgbW92ZSwgdXAsIGNhbmNlbCkge1xuXHRcdFx0XHRfZHJhZ1N0YXJ0RXZlbnQgPSBwcmVmICsgZG93bjtcblx0XHRcdFx0X2RyYWdNb3ZlRXZlbnQgPSBwcmVmICsgbW92ZTtcblx0XHRcdFx0X2RyYWdFbmRFdmVudCA9IHByZWYgKyB1cDtcblx0XHRcdFx0aWYoY2FuY2VsKSB7XG5cdFx0XHRcdFx0X2RyYWdDYW5jZWxFdmVudCA9IHByZWYgKyBjYW5jZWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X2RyYWdDYW5jZWxFdmVudCA9ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRfcG9pbnRlckV2ZW50RW5hYmxlZCA9IF9mZWF0dXJlcy5wb2ludGVyRXZlbnQ7XG5cdFx0XHRpZihfcG9pbnRlckV2ZW50RW5hYmxlZCAmJiBfZmVhdHVyZXMudG91Y2gpIHtcblx0XHRcdFx0Ly8gd2UgZG9uJ3QgbmVlZCB0b3VjaCBldmVudHMsIGlmIGJyb3dzZXIgc3VwcG9ydHMgcG9pbnRlciBldmVudHNcblx0XHRcdFx0X2ZlYXR1cmVzLnRvdWNoID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmKF9wb2ludGVyRXZlbnRFbmFibGVkKSB7XG5cdFx0XHRcdGlmKG5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0XHRcdGFkZEV2ZW50TmFtZXMoJ3BvaW50ZXInLCAnZG93bicsICdtb3ZlJywgJ3VwJywgJ2NhbmNlbCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIElFMTAgcG9pbnRlciBldmVudHMgYXJlIGNhc2Utc2Vuc2l0aXZlXG5cdFx0XHRcdFx0YWRkRXZlbnROYW1lcygnTVNQb2ludGVyJywgJ0Rvd24nLCAnTW92ZScsICdVcCcsICdDYW5jZWwnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKF9mZWF0dXJlcy50b3VjaCkge1xuXHRcdFx0XHRhZGRFdmVudE5hbWVzKCd0b3VjaCcsICdzdGFydCcsICdtb3ZlJywgJ2VuZCcsICdjYW5jZWwnKTtcblx0XHRcdFx0X2xpa2VseVRvdWNoRGV2aWNlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFkZEV2ZW50TmFtZXMoJ21vdXNlJywgJ2Rvd24nLCAnbW92ZScsICd1cCcpO1x0XG5cdFx0XHR9XG5cblx0XHRcdF91cE1vdmVFdmVudHMgPSBfZHJhZ01vdmVFdmVudCArICcgJyArIF9kcmFnRW5kRXZlbnQgICsgJyAnICsgIF9kcmFnQ2FuY2VsRXZlbnQ7XG5cdFx0XHRfZG93bkV2ZW50cyA9IF9kcmFnU3RhcnRFdmVudDtcblxuXHRcdFx0aWYoX3BvaW50ZXJFdmVudEVuYWJsZWQgJiYgIV9saWtlbHlUb3VjaERldmljZSkge1xuXHRcdFx0XHRfbGlrZWx5VG91Y2hEZXZpY2UgPSAobmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMSkgfHwgKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzID4gMSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBtYWtlIHZhcmlhYmxlIHB1YmxpY1xuXHRcdFx0c2VsZi5saWtlbHlUb3VjaERldmljZSA9IF9saWtlbHlUb3VjaERldmljZTsgXG5cdFx0XHRcblx0XHRcdF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnU3RhcnRFdmVudF0gPSBfb25EcmFnU3RhcnQ7XG5cdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tfZHJhZ01vdmVFdmVudF0gPSBfb25EcmFnTW92ZTtcblx0XHRcdF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnRW5kRXZlbnRdID0gX29uRHJhZ1JlbGVhc2U7IC8vIHRoZSBLcmFrZW5cblxuXHRcdFx0aWYoX2RyYWdDYW5jZWxFdmVudCkge1xuXHRcdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tfZHJhZ0NhbmNlbEV2ZW50XSA9IF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnRW5kRXZlbnRdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBCaW5kIG1vdXNlIGV2ZW50cyBvbiBkZXZpY2Ugd2l0aCBkZXRlY3RlZCBoYXJkd2FyZSB0b3VjaCBzdXBwb3J0LCBpbiBjYXNlIGl0IHN1cHBvcnRzIG11bHRpcGxlIHR5cGVzIG9mIGlucHV0LlxuXHRcdFx0aWYoX2ZlYXR1cmVzLnRvdWNoKSB7XG5cdFx0XHRcdF9kb3duRXZlbnRzICs9ICcgbW91c2Vkb3duJztcblx0XHRcdFx0X3VwTW92ZUV2ZW50cyArPSAnIG1vdXNlbW92ZSBtb3VzZXVwJztcblx0XHRcdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMubW91c2Vkb3duID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdTdGFydEV2ZW50XTtcblx0XHRcdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMubW91c2Vtb3ZlID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdNb3ZlRXZlbnRdO1xuXHRcdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVycy5tb3VzZXVwID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdFbmRFdmVudF07XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFfbGlrZWx5VG91Y2hEZXZpY2UpIHtcblx0XHRcdFx0Ly8gZG9uJ3QgYWxsb3cgcGFuIHRvIG5leHQgc2xpZGUgZnJvbSB6b29tZWQgc3RhdGUgb24gRGVza3RvcFxuXHRcdFx0XHRfb3B0aW9ucy5hbGxvd1BhblRvTmV4dCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG59KTtcblxuXG4vKj4+Z2VzdHVyZXMqL1xuXG4vKj4+c2hvdy1oaWRlLXRyYW5zaXRpb24qL1xuLyoqXG4gKiBzaG93LWhpZGUtdHJhbnNpdGlvbi5qczpcbiAqXG4gKiBNYW5hZ2VzIGluaXRpYWwgb3BlbmluZyBvciBjbG9zaW5nIHRyYW5zaXRpb24uXG4gKlxuICogSWYgeW91J3JlIG5vdCBwbGFubmluZyB0byB1c2UgdHJhbnNpdGlvbiBmb3IgZ2FsbGVyeSBhdCBhbGwsXG4gKiB5b3UgbWF5IHNldCBvcHRpb25zIGhpZGVBbmltYXRpb25EdXJhdGlvbiBhbmQgc2hvd0FuaW1hdGlvbkR1cmF0aW9uIHRvIDAsXG4gKiBhbmQganVzdCBkZWxldGUgc3RhcnRBbmltYXRpb24gZnVuY3Rpb24uXG4gKiBcbiAqL1xuXG5cbnZhciBfc2hvd09ySGlkZVRpbWVvdXQsXG5cdF9zaG93T3JIaWRlID0gZnVuY3Rpb24oaXRlbSwgaW1nLCBvdXQsIGNvbXBsZXRlRm4pIHtcblxuXHRcdGlmKF9zaG93T3JIaWRlVGltZW91dCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9zaG93T3JIaWRlVGltZW91dCk7XG5cdFx0fVxuXG5cdFx0X2luaXRpYWxab29tUnVubmluZyA9IHRydWU7XG5cdFx0X2luaXRpYWxDb250ZW50U2V0ID0gdHJ1ZTtcblx0XHRcblx0XHQvLyBkaW1lbnNpb25zIG9mIHNtYWxsIHRodW1ibmFpbCB7eDoseTosdzp9LlxuXHRcdC8vIEhlaWdodCBpcyBvcHRpb25hbCwgYXMgY2FsY3VsYXRlZCBiYXNlZCBvbiBsYXJnZSBpbWFnZS5cblx0XHR2YXIgdGh1bWJCb3VuZHM7IFxuXHRcdGlmKGl0ZW0uaW5pdGlhbExheW91dCkge1xuXHRcdFx0dGh1bWJCb3VuZHMgPSBpdGVtLmluaXRpYWxMYXlvdXQ7XG5cdFx0XHRpdGVtLmluaXRpYWxMYXlvdXQgPSBudWxsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHVtYkJvdW5kcyA9IF9vcHRpb25zLmdldFRodW1iQm91bmRzRm4gJiYgX29wdGlvbnMuZ2V0VGh1bWJCb3VuZHNGbihfY3VycmVudEl0ZW1JbmRleCk7XG5cdFx0fVxuXG5cdFx0dmFyIGR1cmF0aW9uID0gb3V0ID8gX29wdGlvbnMuaGlkZUFuaW1hdGlvbkR1cmF0aW9uIDogX29wdGlvbnMuc2hvd0FuaW1hdGlvbkR1cmF0aW9uO1xuXG5cdFx0dmFyIG9uQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdF9zdG9wQW5pbWF0aW9uKCdpbml0aWFsWm9vbScpO1xuXHRcdFx0aWYoIW91dCkge1xuXHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoMSk7XG5cdFx0XHRcdGlmKGltZykge1xuXHRcdFx0XHRcdGltZy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdFx0fVxuXHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS1hbmltYXRlZC1pbicpO1xuXHRcdFx0XHRfc2hvdXQoJ2luaXRpYWxab29tJyArIChvdXQgPyAnT3V0RW5kJyA6ICdJbkVuZCcpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbGYudGVtcGxhdGUucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuXHRcdFx0XHRzZWxmLmJnLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcblx0XHRcdH1cblxuXHRcdFx0aWYoY29tcGxldGVGbikge1xuXHRcdFx0XHRjb21wbGV0ZUZuKCk7XG5cdFx0XHR9XG5cdFx0XHRfaW5pdGlhbFpvb21SdW5uaW5nID0gZmFsc2U7XG5cdFx0fTtcblxuXHRcdC8vIGlmIGJvdW5kcyBhcmVuJ3QgcHJvdmlkZWQsIGp1c3Qgb3BlbiBnYWxsZXJ5IHdpdGhvdXQgYW5pbWF0aW9uXG5cdFx0aWYoIWR1cmF0aW9uIHx8ICF0aHVtYkJvdW5kcyB8fCB0aHVtYkJvdW5kcy54ID09PSB1bmRlZmluZWQpIHtcblxuXHRcdFx0X3Nob3V0KCdpbml0aWFsWm9vbScgKyAob3V0ID8gJ091dCcgOiAnSW4nKSApO1xuXG5cdFx0XHRfY3Vyclpvb21MZXZlbCA9IGl0ZW0uaW5pdGlhbFpvb21MZXZlbDtcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfcGFuT2Zmc2V0LCAgaXRlbS5pbml0aWFsUG9zaXRpb24gKTtcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cblx0XHRcdHRlbXBsYXRlLnN0eWxlLm9wYWNpdHkgPSBvdXQgPyAwIDogMTtcblx0XHRcdF9hcHBseUJnT3BhY2l0eSgxKTtcblxuXHRcdFx0aWYoZHVyYXRpb24pIHtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRvbkNvbXBsZXRlKCk7XG5cdFx0XHRcdH0sIGR1cmF0aW9uKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG9uQ29tcGxldGUoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBzdGFydEFuaW1hdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGNsb3NlV2l0aFJhZiA9IF9jbG9zZWRCeVNjcm9sbCxcblx0XHRcdFx0ZmFkZUV2ZXJ5dGhpbmcgPSAhc2VsZi5jdXJySXRlbS5zcmMgfHwgc2VsZi5jdXJySXRlbS5sb2FkRXJyb3IgfHwgX29wdGlvbnMuc2hvd0hpZGVPcGFjaXR5O1xuXHRcdFx0XG5cdFx0XHQvLyBhcHBseSBody1hY2NlbGVyYXRpb24gdG8gaW1hZ2Vcblx0XHRcdGlmKGl0ZW0ubWluaUltZykge1xuXHRcdFx0XHRpdGVtLm1pbmlJbWcuc3R5bGUud2Via2l0QmFja2ZhY2VWaXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFvdXQpIHtcblx0XHRcdFx0X2N1cnJab29tTGV2ZWwgPSB0aHVtYkJvdW5kcy53IC8gaXRlbS53O1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnggPSB0aHVtYkJvdW5kcy54O1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSB0aHVtYkJvdW5kcy55IC0gX2luaXRhbFdpbmRvd1Njcm9sbFk7XG5cblx0XHRcdFx0c2VsZltmYWRlRXZlcnl0aGluZyA/ICd0ZW1wbGF0ZScgOiAnYmcnXS5zdHlsZS5vcGFjaXR5ID0gMC4wMDE7XG5cdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cdFx0XHR9XG5cblx0XHRcdF9yZWdpc3RlclN0YXJ0QW5pbWF0aW9uKCdpbml0aWFsWm9vbScpO1xuXHRcdFx0XG5cdFx0XHRpZihvdXQgJiYgIWNsb3NlV2l0aFJhZikge1xuXHRcdFx0XHRmcmFtZXdvcmsucmVtb3ZlQ2xhc3ModGVtcGxhdGUsICdwc3dwLS1hbmltYXRlZC1pbicpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihmYWRlRXZlcnl0aGluZykge1xuXHRcdFx0XHRpZihvdXQpIHtcblx0XHRcdFx0XHRmcmFtZXdvcmtbIChjbG9zZVdpdGhSYWYgPyAncmVtb3ZlJyA6ICdhZGQnKSArICdDbGFzcycgXSh0ZW1wbGF0ZSwgJ3Bzd3AtLWFuaW1hdGVfb3BhY2l0eScpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS1hbmltYXRlX29wYWNpdHknKTtcblx0XHRcdFx0XHR9LCAzMCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X3Nob3dPckhpZGVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblxuXHRcdFx0XHRfc2hvdXQoJ2luaXRpYWxab29tJyArIChvdXQgPyAnT3V0JyA6ICdJbicpICk7XG5cdFx0XHRcdFxuXG5cdFx0XHRcdGlmKCFvdXQpIHtcblxuXHRcdFx0XHRcdC8vIFwiaW5cIiBhbmltYXRpb24gYWx3YXlzIHVzZXMgQ1NTIHRyYW5zaXRpb25zIChpbnN0ZWFkIG9mIHJBRikuXG5cdFx0XHRcdFx0Ly8gQ1NTIHRyYW5zaXRpb24gd29yayBmYXN0ZXIgaGVyZSwgXG5cdFx0XHRcdFx0Ly8gYXMgZGV2ZWxvcGVyIG1heSBhbHNvIHdhbnQgdG8gYW5pbWF0ZSBvdGhlciB0aGluZ3MsIFxuXHRcdFx0XHRcdC8vIGxpa2UgdWkgb24gdG9wIG9mIHNsaWRpbmcgYXJlYSwgd2hpY2ggY2FuIGJlIGFuaW1hdGVkIGp1c3QgdmlhIENTU1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gaXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXHRcdFx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfcGFuT2Zmc2V0LCAgaXRlbS5pbml0aWFsUG9zaXRpb24gKTtcblx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdF9hcHBseUJnT3BhY2l0eSgxKTtcblxuXHRcdFx0XHRcdGlmKGZhZGVFdmVyeXRoaW5nKSB7XG5cdFx0XHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS5vcGFjaXR5ID0gMTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X2FwcGx5QmdPcGFjaXR5KDEpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdF9zaG93T3JIaWRlVGltZW91dCA9IHNldFRpbWVvdXQob25Db21wbGV0ZSwgZHVyYXRpb24gKyAyMCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHQvLyBcIm91dFwiIGFuaW1hdGlvbiB1c2VzIHJBRiBvbmx5IHdoZW4gUGhvdG9Td2lwZSBpcyBjbG9zZWQgYnkgYnJvd3NlciBzY3JvbGwsIHRvIHJlY2FsY3VsYXRlIHBvc2l0aW9uXG5cdFx0XHRcdFx0dmFyIGRlc3Rab29tTGV2ZWwgPSB0aHVtYkJvdW5kcy53IC8gaXRlbS53LFxuXHRcdFx0XHRcdFx0aW5pdGlhbFBhbk9mZnNldCA9IHtcblx0XHRcdFx0XHRcdFx0eDogX3Bhbk9mZnNldC54LFxuXHRcdFx0XHRcdFx0XHR5OiBfcGFuT2Zmc2V0Lnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRpbml0aWFsWm9vbUxldmVsID0gX2N1cnJab29tTGV2ZWwsXG5cdFx0XHRcdFx0XHRpbml0YWxCZ09wYWNpdHkgPSBfYmdPcGFjaXR5LFxuXHRcdFx0XHRcdFx0b25VcGRhdGUgPSBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGlmKG5vdyA9PT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gZGVzdFpvb21MZXZlbDtcblx0XHRcdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggPSB0aHVtYkJvdW5kcy54O1xuXHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueSA9IHRodW1iQm91bmRzLnkgIC0gX2N1cnJlbnRXaW5kb3dTY3JvbGxZO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gKGRlc3Rab29tTGV2ZWwgLSBpbml0aWFsWm9vbUxldmVsKSAqIG5vdyArIGluaXRpYWxab29tTGV2ZWw7XG5cdFx0XHRcdFx0XHRcdFx0X3Bhbk9mZnNldC54ID0gKHRodW1iQm91bmRzLnggLSBpbml0aWFsUGFuT2Zmc2V0LngpICogbm93ICsgaW5pdGlhbFBhbk9mZnNldC54O1xuXHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueSA9ICh0aHVtYkJvdW5kcy55IC0gX2N1cnJlbnRXaW5kb3dTY3JvbGxZIC0gaW5pdGlhbFBhbk9mZnNldC55KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcblx0XHRcdFx0XHRcdFx0aWYoZmFkZUV2ZXJ5dGhpbmcpIHtcblx0XHRcdFx0XHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS5vcGFjaXR5ID0gMSAtIG5vdztcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoIGluaXRhbEJnT3BhY2l0eSAtIG5vdyAqIGluaXRhbEJnT3BhY2l0eSApO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0aWYoY2xvc2VXaXRoUmFmKSB7XG5cdFx0XHRcdFx0XHRfYW5pbWF0ZVByb3AoJ2luaXRpYWxab29tJywgMCwgMSwgZHVyYXRpb24sIGZyYW1ld29yay5lYXNpbmcuY3ViaWMub3V0LCBvblVwZGF0ZSwgb25Db21wbGV0ZSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdG9uVXBkYXRlKDEpO1xuXHRcdFx0XHRcdFx0X3Nob3dPckhpZGVUaW1lb3V0ID0gc2V0VGltZW91dChvbkNvbXBsZXRlLCBkdXJhdGlvbiArIDIwKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0fSwgb3V0ID8gMjUgOiA5MCk7IC8vIE1haW4gcHVycG9zZSBvZiB0aGlzIGRlbGF5IGlzIHRvIGdpdmUgYnJvd3NlciB0aW1lIHRvIHBhaW50IGFuZFxuXHRcdFx0XHRcdC8vIGNyZWF0ZSBjb21wb3NpdGUgbGF5ZXJzIG9mIFBob3RvU3dpcGUgVUkgcGFydHMgKGJhY2tncm91bmQsIGNvbnRyb2xzLCBjYXB0aW9uLCBhcnJvd3MpLlxuXHRcdFx0XHRcdC8vIFdoaWNoIGF2b2lkcyBsYWcgYXQgdGhlIGJlZ2lubmluZyBvZiBzY2FsZSB0cmFuc2l0aW9uLlxuXHRcdH07XG5cdFx0c3RhcnRBbmltYXRpb24oKTtcblxuXHRcdFxuXHR9O1xuXG4vKj4+c2hvdy1oaWRlLXRyYW5zaXRpb24qL1xuXG4vKj4+aXRlbXMtY29udHJvbGxlciovXG4vKipcbipcbiogQ29udHJvbGxlciBtYW5hZ2VzIGdhbGxlcnkgaXRlbXMsIHRoZWlyIGRpbWVuc2lvbnMsIGFuZCB0aGVpciBjb250ZW50LlxuKiBcbiovXG5cbnZhciBfaXRlbXMsXG5cdF90ZW1wUGFuQXJlYVNpemUgPSB7fSxcblx0X2ltYWdlc1RvQXBwZW5kUG9vbCA9IFtdLFxuXHRfaW5pdGlhbENvbnRlbnRTZXQsXG5cdF9pbml0aWFsWm9vbVJ1bm5pbmcsXG5cdF9jb250cm9sbGVyRGVmYXVsdE9wdGlvbnMgPSB7XG5cdFx0aW5kZXg6IDAsXG5cdFx0ZXJyb3JNc2c6ICc8ZGl2IGNsYXNzPVwicHN3cF9fZXJyb3ItbXNnXCI+PGEgaHJlZj1cIiV1cmwlXCIgdGFyZ2V0PVwiX2JsYW5rXCI+VGhlIGltYWdlPC9hPiBjb3VsZCBub3QgYmUgbG9hZGVkLjwvZGl2PicsXG5cdFx0Zm9yY2VQcm9ncmVzc2l2ZUxvYWRpbmc6IGZhbHNlLCAvLyBUT0RPXG5cdFx0cHJlbG9hZDogWzEsMV0sXG5cdFx0Z2V0TnVtSXRlbXNGbjogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gX2l0ZW1zLmxlbmd0aDtcblx0XHR9XG5cdH07XG5cblxudmFyIF9nZXRJdGVtQXQsXG5cdF9nZXROdW1JdGVtcyxcblx0X2luaXRpYWxJc0xvb3AsXG5cdF9nZXRaZXJvQm91bmRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNlbnRlcjp7eDowLHk6MH0sIFxuXHRcdFx0bWF4Ont4OjAseTowfSwgXG5cdFx0XHRtaW46e3g6MCx5OjB9XG5cdFx0fTtcblx0fSxcblx0X2NhbGN1bGF0ZVNpbmdsZUl0ZW1QYW5Cb3VuZHMgPSBmdW5jdGlvbihpdGVtLCByZWFsUGFuRWxlbWVudFcsIHJlYWxQYW5FbGVtZW50SCApIHtcblx0XHR2YXIgYm91bmRzID0gaXRlbS5ib3VuZHM7XG5cblx0XHQvLyBwb3NpdGlvbiBvZiBlbGVtZW50IHdoZW4gaXQncyBjZW50ZXJlZFxuXHRcdGJvdW5kcy5jZW50ZXIueCA9IE1hdGgucm91bmQoKF90ZW1wUGFuQXJlYVNpemUueCAtIHJlYWxQYW5FbGVtZW50VykgLyAyKTtcblx0XHRib3VuZHMuY2VudGVyLnkgPSBNYXRoLnJvdW5kKChfdGVtcFBhbkFyZWFTaXplLnkgLSByZWFsUGFuRWxlbWVudEgpIC8gMikgKyBpdGVtLnZHYXAudG9wO1xuXG5cdFx0Ly8gbWF4aW11bSBwYW4gcG9zaXRpb25cblx0XHRib3VuZHMubWF4LnggPSAocmVhbFBhbkVsZW1lbnRXID4gX3RlbXBQYW5BcmVhU2l6ZS54KSA/IFxuXHRcdFx0XHRcdFx0XHRNYXRoLnJvdW5kKF90ZW1wUGFuQXJlYVNpemUueCAtIHJlYWxQYW5FbGVtZW50VykgOiBcblx0XHRcdFx0XHRcdFx0Ym91bmRzLmNlbnRlci54O1xuXHRcdFxuXHRcdGJvdW5kcy5tYXgueSA9IChyZWFsUGFuRWxlbWVudEggPiBfdGVtcFBhbkFyZWFTaXplLnkpID8gXG5cdFx0XHRcdFx0XHRcdE1hdGgucm91bmQoX3RlbXBQYW5BcmVhU2l6ZS55IC0gcmVhbFBhbkVsZW1lbnRIKSArIGl0ZW0udkdhcC50b3AgOiBcblx0XHRcdFx0XHRcdFx0Ym91bmRzLmNlbnRlci55O1xuXHRcdFxuXHRcdC8vIG1pbmltdW0gcGFuIHBvc2l0aW9uXG5cdFx0Ym91bmRzLm1pbi54ID0gKHJlYWxQYW5FbGVtZW50VyA+IF90ZW1wUGFuQXJlYVNpemUueCkgPyAwIDogYm91bmRzLmNlbnRlci54O1xuXHRcdGJvdW5kcy5taW4ueSA9IChyZWFsUGFuRWxlbWVudEggPiBfdGVtcFBhbkFyZWFTaXplLnkpID8gaXRlbS52R2FwLnRvcCA6IGJvdW5kcy5jZW50ZXIueTtcblx0fSxcblx0X2NhbGN1bGF0ZUl0ZW1TaXplID0gZnVuY3Rpb24oaXRlbSwgdmlld3BvcnRTaXplLCB6b29tTGV2ZWwpIHtcblxuXHRcdGlmIChpdGVtLnNyYyAmJiAhaXRlbS5sb2FkRXJyb3IpIHtcblx0XHRcdHZhciBpc0luaXRpYWwgPSAhem9vbUxldmVsO1xuXHRcdFx0XG5cdFx0XHRpZihpc0luaXRpYWwpIHtcblx0XHRcdFx0aWYoIWl0ZW0udkdhcCkge1xuXHRcdFx0XHRcdGl0ZW0udkdhcCA9IHt0b3A6MCxib3R0b206MH07XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gYWxsb3dzIG92ZXJyaWRpbmcgdmVydGljYWwgbWFyZ2luIGZvciBpbmRpdmlkdWFsIGl0ZW1zXG5cdFx0XHRcdF9zaG91dCgncGFyc2VWZXJ0aWNhbE1hcmdpbicsIGl0ZW0pO1xuXHRcdFx0fVxuXG5cblx0XHRcdF90ZW1wUGFuQXJlYVNpemUueCA9IHZpZXdwb3J0U2l6ZS54O1xuXHRcdFx0X3RlbXBQYW5BcmVhU2l6ZS55ID0gdmlld3BvcnRTaXplLnkgLSBpdGVtLnZHYXAudG9wIC0gaXRlbS52R2FwLmJvdHRvbTtcblxuXHRcdFx0aWYgKGlzSW5pdGlhbCkge1xuXHRcdFx0XHR2YXIgaFJhdGlvID0gX3RlbXBQYW5BcmVhU2l6ZS54IC8gaXRlbS53O1xuXHRcdFx0XHR2YXIgdlJhdGlvID0gX3RlbXBQYW5BcmVhU2l6ZS55IC8gaXRlbS5oO1xuXG5cdFx0XHRcdGl0ZW0uZml0UmF0aW8gPSBoUmF0aW8gPCB2UmF0aW8gPyBoUmF0aW8gOiB2UmF0aW87XG5cdFx0XHRcdC8vaXRlbS5maWxsUmF0aW8gPSBoUmF0aW8gPiB2UmF0aW8gPyBoUmF0aW8gOiB2UmF0aW87XG5cblx0XHRcdFx0dmFyIHNjYWxlTW9kZSA9IF9vcHRpb25zLnNjYWxlTW9kZTtcblxuXHRcdFx0XHRpZiAoc2NhbGVNb2RlID09PSAnb3JpZycpIHtcblx0XHRcdFx0XHR6b29tTGV2ZWwgPSAxO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNjYWxlTW9kZSA9PT0gJ2ZpdCcpIHtcblx0XHRcdFx0XHR6b29tTGV2ZWwgPSBpdGVtLmZpdFJhdGlvO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHpvb21MZXZlbCA+IDEpIHtcblx0XHRcdFx0XHR6b29tTGV2ZWwgPSAxO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aXRlbS5pbml0aWFsWm9vbUxldmVsID0gem9vbUxldmVsO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYoIWl0ZW0uYm91bmRzKSB7XG5cdFx0XHRcdFx0Ly8gcmV1c2UgYm91bmRzIG9iamVjdFxuXHRcdFx0XHRcdGl0ZW0uYm91bmRzID0gX2dldFplcm9Cb3VuZHMoKTsgXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYoIXpvb21MZXZlbCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9jYWxjdWxhdGVTaW5nbGVJdGVtUGFuQm91bmRzKGl0ZW0sIGl0ZW0udyAqIHpvb21MZXZlbCwgaXRlbS5oICogem9vbUxldmVsKTtcblxuXHRcdFx0aWYgKGlzSW5pdGlhbCAmJiB6b29tTGV2ZWwgPT09IGl0ZW0uaW5pdGlhbFpvb21MZXZlbCkge1xuXHRcdFx0XHRpdGVtLmluaXRpYWxQb3NpdGlvbiA9IGl0ZW0uYm91bmRzLmNlbnRlcjtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGl0ZW0uYm91bmRzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpdGVtLncgPSBpdGVtLmggPSAwO1xuXHRcdFx0aXRlbS5pbml0aWFsWm9vbUxldmVsID0gaXRlbS5maXRSYXRpbyA9IDE7XG5cdFx0XHRpdGVtLmJvdW5kcyA9IF9nZXRaZXJvQm91bmRzKCk7XG5cdFx0XHRpdGVtLmluaXRpYWxQb3NpdGlvbiA9IGl0ZW0uYm91bmRzLmNlbnRlcjtcblxuXHRcdFx0Ly8gaWYgaXQncyBub3QgaW1hZ2UsIHdlIHJldHVybiB6ZXJvIGJvdW5kcyAoY29udGVudCBpcyBub3Qgem9vbWFibGUpXG5cdFx0XHRyZXR1cm4gaXRlbS5ib3VuZHM7XG5cdFx0fVxuXHRcdFxuXHR9LFxuXG5cdFxuXG5cblx0X2FwcGVuZEltYWdlID0gZnVuY3Rpb24oaW5kZXgsIGl0ZW0sIGJhc2VEaXYsIGltZywgcHJldmVudEFuaW1hdGlvbiwga2VlcFBsYWNlaG9sZGVyKSB7XG5cdFx0XG5cblx0XHRpZihpdGVtLmxvYWRFcnJvcikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmKGltZykge1xuXG5cdFx0XHRpdGVtLmltYWdlQXBwZW5kZWQgPSB0cnVlO1xuXHRcdFx0X3NldEltYWdlU2l6ZShpdGVtLCBpbWcsIChpdGVtID09PSBzZWxmLmN1cnJJdGVtICYmIF9yZW5kZXJNYXhSZXNvbHV0aW9uKSApO1xuXHRcdFx0XG5cdFx0XHRiYXNlRGl2LmFwcGVuZENoaWxkKGltZyk7XG5cblx0XHRcdGlmKGtlZXBQbGFjZWhvbGRlcikge1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKGl0ZW0gJiYgaXRlbS5sb2FkZWQgJiYgaXRlbS5wbGFjZWhvbGRlcikge1xuXHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlciA9IG51bGw7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCA1MDApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0XG5cblxuXHRfcHJlbG9hZEltYWdlID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdGl0ZW0ubG9hZGluZyA9IHRydWU7XG5cdFx0aXRlbS5sb2FkZWQgPSBmYWxzZTtcblx0XHR2YXIgaW1nID0gaXRlbS5pbWcgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2ltZycsICdpbWcnKTtcblx0XHR2YXIgb25Db21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aXRlbS5sb2FkaW5nID0gZmFsc2U7XG5cdFx0XHRpdGVtLmxvYWRlZCA9IHRydWU7XG5cblx0XHRcdGlmKGl0ZW0ubG9hZENvbXBsZXRlKSB7XG5cdFx0XHRcdGl0ZW0ubG9hZENvbXBsZXRlKGl0ZW0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aXRlbS5pbWcgPSBudWxsOyAvLyBubyBuZWVkIHRvIHN0b3JlIGltYWdlIG9iamVjdFxuXHRcdFx0fVxuXHRcdFx0aW1nLm9ubG9hZCA9IGltZy5vbmVycm9yID0gbnVsbDtcblx0XHRcdGltZyA9IG51bGw7XG5cdFx0fTtcblx0XHRpbWcub25sb2FkID0gb25Db21wbGV0ZTtcblx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aXRlbS5sb2FkRXJyb3IgPSB0cnVlO1xuXHRcdFx0b25Db21wbGV0ZSgpO1xuXHRcdH07XHRcdFxuXG5cdFx0aW1nLnNyYyA9IGl0ZW0uc3JjOy8vICsgJz9hPScgKyBNYXRoLnJhbmRvbSgpO1xuXG5cdFx0cmV0dXJuIGltZztcblx0fSxcblx0X2NoZWNrRm9yRXJyb3IgPSBmdW5jdGlvbihpdGVtLCBjbGVhblVwKSB7XG5cdFx0aWYoaXRlbS5zcmMgJiYgaXRlbS5sb2FkRXJyb3IgJiYgaXRlbS5jb250YWluZXIpIHtcblxuXHRcdFx0aWYoY2xlYW5VcCkge1xuXHRcdFx0XHRpdGVtLmNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcblx0XHRcdH1cblxuXHRcdFx0aXRlbS5jb250YWluZXIuaW5uZXJIVE1MID0gX29wdGlvbnMuZXJyb3JNc2cucmVwbGFjZSgnJXVybCUnLCAgaXRlbS5zcmMgKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XG5cdFx0fVxuXHR9LFxuXHRfc2V0SW1hZ2VTaXplID0gZnVuY3Rpb24oaXRlbSwgaW1nLCBtYXhSZXMpIHtcblx0XHRpZighaXRlbS5zcmMpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZighaW1nKSB7XG5cdFx0XHRpbWcgPSBpdGVtLmNvbnRhaW5lci5sYXN0Q2hpbGQ7XG5cdFx0fVxuXG5cdFx0dmFyIHcgPSBtYXhSZXMgPyBpdGVtLncgOiBNYXRoLnJvdW5kKGl0ZW0udyAqIGl0ZW0uZml0UmF0aW8pLFxuXHRcdFx0aCA9IG1heFJlcyA/IGl0ZW0uaCA6IE1hdGgucm91bmQoaXRlbS5oICogaXRlbS5maXRSYXRpbyk7XG5cdFx0XG5cdFx0aWYoaXRlbS5wbGFjZWhvbGRlciAmJiAhaXRlbS5sb2FkZWQpIHtcblx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUud2lkdGggPSB3ICsgJ3B4Jztcblx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUuaGVpZ2h0ID0gaCArICdweCc7XG5cdFx0fVxuXG5cdFx0aW1nLnN0eWxlLndpZHRoID0gdyArICdweCc7XG5cdFx0aW1nLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuXHR9LFxuXHRfYXBwZW5kSW1hZ2VzUG9vbCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0aWYoX2ltYWdlc1RvQXBwZW5kUG9vbC5sZW5ndGgpIHtcblx0XHRcdHZhciBwb29sSXRlbTtcblxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IF9pbWFnZXNUb0FwcGVuZFBvb2wubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0cG9vbEl0ZW0gPSBfaW1hZ2VzVG9BcHBlbmRQb29sW2ldO1xuXHRcdFx0XHRpZiggcG9vbEl0ZW0uaG9sZGVyLmluZGV4ID09PSBwb29sSXRlbS5pbmRleCApIHtcblx0XHRcdFx0XHRfYXBwZW5kSW1hZ2UocG9vbEl0ZW0uaW5kZXgsIHBvb2xJdGVtLml0ZW0sIHBvb2xJdGVtLmJhc2VEaXYsIHBvb2xJdGVtLmltZywgZmFsc2UsIHBvb2xJdGVtLmNsZWFyUGxhY2Vob2xkZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRfaW1hZ2VzVG9BcHBlbmRQb29sID0gW107XG5cdFx0fVxuXHR9O1xuXHRcblxuXG5fcmVnaXN0ZXJNb2R1bGUoJ0NvbnRyb2xsZXInLCB7XG5cblx0cHVibGljTWV0aG9kczoge1xuXG5cdFx0bGF6eUxvYWRJdGVtOiBmdW5jdGlvbihpbmRleCkge1xuXHRcdFx0aW5kZXggPSBfZ2V0TG9vcGVkSWQoaW5kZXgpO1xuXHRcdFx0dmFyIGl0ZW0gPSBfZ2V0SXRlbUF0KGluZGV4KTtcblxuXHRcdFx0aWYoIWl0ZW0gfHwgKChpdGVtLmxvYWRlZCB8fCBpdGVtLmxvYWRpbmcpICYmICFfaXRlbXNOZWVkVXBkYXRlKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9zaG91dCgnZ2V0dGluZ0RhdGEnLCBpbmRleCwgaXRlbSk7XG5cblx0XHRcdGlmICghaXRlbS5zcmMpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRfcHJlbG9hZEltYWdlKGl0ZW0pO1xuXHRcdH0sXG5cdFx0aW5pdENvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZnJhbWV3b3JrLmV4dGVuZChfb3B0aW9ucywgX2NvbnRyb2xsZXJEZWZhdWx0T3B0aW9ucywgdHJ1ZSk7XG5cdFx0XHRzZWxmLml0ZW1zID0gX2l0ZW1zID0gaXRlbXM7XG5cdFx0XHRfZ2V0SXRlbUF0ID0gc2VsZi5nZXRJdGVtQXQ7XG5cdFx0XHRfZ2V0TnVtSXRlbXMgPSBfb3B0aW9ucy5nZXROdW1JdGVtc0ZuOyAvL3NlbGYuZ2V0TnVtSXRlbXM7XG5cblxuXG5cdFx0XHRfaW5pdGlhbElzTG9vcCA9IF9vcHRpb25zLmxvb3A7XG5cdFx0XHRpZihfZ2V0TnVtSXRlbXMoKSA8IDMpIHtcblx0XHRcdFx0X29wdGlvbnMubG9vcCA9IGZhbHNlOyAvLyBkaXNhYmxlIGxvb3AgaWYgbGVzcyB0aGVuIDMgaXRlbXNcblx0XHRcdH1cblxuXHRcdFx0X2xpc3RlbignYmVmb3JlQ2hhbmdlJywgZnVuY3Rpb24oZGlmZikge1xuXG5cdFx0XHRcdHZhciBwID0gX29wdGlvbnMucHJlbG9hZCxcblx0XHRcdFx0XHRpc05leHQgPSBkaWZmID09PSBudWxsID8gdHJ1ZSA6IChkaWZmID49IDApLFxuXHRcdFx0XHRcdHByZWxvYWRCZWZvcmUgPSBNYXRoLm1pbihwWzBdLCBfZ2V0TnVtSXRlbXMoKSApLFxuXHRcdFx0XHRcdHByZWxvYWRBZnRlciA9IE1hdGgubWluKHBbMV0sIF9nZXROdW1JdGVtcygpICksXG5cdFx0XHRcdFx0aTtcblxuXG5cdFx0XHRcdGZvcihpID0gMTsgaSA8PSAoaXNOZXh0ID8gcHJlbG9hZEFmdGVyIDogcHJlbG9hZEJlZm9yZSk7IGkrKykge1xuXHRcdFx0XHRcdHNlbGYubGF6eUxvYWRJdGVtKF9jdXJyZW50SXRlbUluZGV4K2kpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZvcihpID0gMTsgaSA8PSAoaXNOZXh0ID8gcHJlbG9hZEJlZm9yZSA6IHByZWxvYWRBZnRlcik7IGkrKykge1xuXHRcdFx0XHRcdHNlbGYubGF6eUxvYWRJdGVtKF9jdXJyZW50SXRlbUluZGV4LWkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0X2xpc3RlbignaW5pdGlhbExheW91dCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZWxmLmN1cnJJdGVtLmluaXRpYWxMYXlvdXQgPSBfb3B0aW9ucy5nZXRUaHVtYkJvdW5kc0ZuICYmIF9vcHRpb25zLmdldFRodW1iQm91bmRzRm4oX2N1cnJlbnRJdGVtSW5kZXgpO1xuXHRcdFx0fSk7XG5cblx0XHRcdF9saXN0ZW4oJ21haW5TY3JvbGxBbmltQ29tcGxldGUnLCBfYXBwZW5kSW1hZ2VzUG9vbCk7XG5cdFx0XHRfbGlzdGVuKCdpbml0aWFsWm9vbUluRW5kJywgX2FwcGVuZEltYWdlc1Bvb2wpO1xuXG5cblxuXHRcdFx0X2xpc3RlbignZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgaXRlbTtcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IF9pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGl0ZW0gPSBfaXRlbXNbaV07XG5cdFx0XHRcdFx0Ly8gcmVtb3ZlIHJlZmVyZW5jZSB0byBET00gZWxlbWVudHMsIGZvciBHQ1xuXHRcdFx0XHRcdGlmKGl0ZW0uY29udGFpbmVyKSB7XG5cdFx0XHRcdFx0XHRpdGVtLmNvbnRhaW5lciA9IG51bGw7IFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZihpdGVtLnBsYWNlaG9sZGVyKSB7XG5cdFx0XHRcdFx0XHRpdGVtLnBsYWNlaG9sZGVyID0gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoaXRlbS5pbWcpIHtcblx0XHRcdFx0XHRcdGl0ZW0uaW1nID0gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoaXRlbS5wcmVsb2FkZXIpIHtcblx0XHRcdFx0XHRcdGl0ZW0ucHJlbG9hZGVyID0gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoaXRlbS5sb2FkRXJyb3IpIHtcblx0XHRcdFx0XHRcdGl0ZW0ubG9hZGVkID0gaXRlbS5sb2FkRXJyb3IgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0X2ltYWdlc1RvQXBwZW5kUG9vbCA9IG51bGw7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cblx0XHRnZXRJdGVtQXQ6IGZ1bmN0aW9uKGluZGV4KSB7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRyZXR1cm4gX2l0ZW1zW2luZGV4XSAhPT0gdW5kZWZpbmVkID8gX2l0ZW1zW2luZGV4XSA6IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cblx0XHRhbGxvd1Byb2dyZXNzaXZlSW1nOiBmdW5jdGlvbigpIHtcblx0XHRcdC8vIDEuIFByb2dyZXNzaXZlIGltYWdlIGxvYWRpbmcgaXNuJ3Qgd29ya2luZyBvbiB3ZWJraXQvYmxpbmsgXG5cdFx0XHQvLyAgICB3aGVuIGh3LWFjY2VsZXJhdGlvbiAoZS5nLiB0cmFuc2xhdGVaKSBpcyBhcHBsaWVkIHRvIElNRyBlbGVtZW50LlxuXHRcdFx0Ly8gICAgVGhhdCdzIHdoeSBpbiBQaG90b1N3aXBlIHBhcmVudCBlbGVtZW50IGdldHMgem9vbSB0cmFuc2Zvcm0sIG5vdCBpbWFnZSBpdHNlbGYuXG5cdFx0XHQvLyAgICBcblx0XHRcdC8vIDIuIFByb2dyZXNzaXZlIGltYWdlIGxvYWRpbmcgc29tZXRpbWVzIGJsaW5rcyBpbiB3ZWJraXQvYmxpbmsgd2hlbiBhcHBseWluZyBhbmltYXRpb24gdG8gcGFyZW50IGVsZW1lbnQuXG5cdFx0XHQvLyAgICBUaGF0J3Mgd2h5IGl0J3MgZGlzYWJsZWQgb24gdG91Y2ggZGV2aWNlcyAobWFpbmx5IGJlY2F1c2Ugb2Ygc3dpcGUgdHJhbnNpdGlvbilcblx0XHRcdC8vICAgIFxuXHRcdFx0Ly8gMy4gUHJvZ3Jlc3NpdmUgaW1hZ2UgbG9hZGluZyBzb21ldGltZXMgZG9lc24ndCB3b3JrIGluIElFICh1cCB0byAxMSkuXG5cblx0XHRcdC8vIERvbid0IGFsbG93IHByb2dyZXNzaXZlIGxvYWRpbmcgb24gbm9uLWxhcmdlIHRvdWNoIGRldmljZXNcblx0XHRcdHJldHVybiBfb3B0aW9ucy5mb3JjZVByb2dyZXNzaXZlTG9hZGluZyB8fCAhX2xpa2VseVRvdWNoRGV2aWNlIHx8IF9vcHRpb25zLm1vdXNlVXNlZCB8fCBzY3JlZW4ud2lkdGggPiAxMjAwOyBcblx0XHRcdC8vIDEyMDAgLSB0byBlbGltaW5hdGUgdG91Y2ggZGV2aWNlcyB3aXRoIGxhcmdlIHNjcmVlbiAobGlrZSBDaHJvbWVib29rIFBpeGVsKVxuXHRcdH0sXG5cblx0XHRzZXRDb250ZW50OiBmdW5jdGlvbihob2xkZXIsIGluZGV4KSB7XG5cblx0XHRcdGlmKF9vcHRpb25zLmxvb3ApIHtcblx0XHRcdFx0aW5kZXggPSBfZ2V0TG9vcGVkSWQoaW5kZXgpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcHJldkl0ZW0gPSBzZWxmLmdldEl0ZW1BdChob2xkZXIuaW5kZXgpO1xuXHRcdFx0aWYocHJldkl0ZW0pIHtcblx0XHRcdFx0cHJldkl0ZW0uY29udGFpbmVyID0gbnVsbDtcblx0XHRcdH1cblx0XG5cdFx0XHR2YXIgaXRlbSA9IHNlbGYuZ2V0SXRlbUF0KGluZGV4KSxcblx0XHRcdFx0aW1nO1xuXHRcdFx0XG5cdFx0XHRpZighaXRlbSkge1xuXHRcdFx0XHRob2xkZXIuZWwuaW5uZXJIVE1MID0gJyc7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gYWxsb3cgdG8gb3ZlcnJpZGUgZGF0YVxuXHRcdFx0X3Nob3V0KCdnZXR0aW5nRGF0YScsIGluZGV4LCBpdGVtKTtcblxuXHRcdFx0aG9sZGVyLmluZGV4ID0gaW5kZXg7XG5cdFx0XHRob2xkZXIuaXRlbSA9IGl0ZW07XG5cblx0XHRcdC8vIGJhc2UgY29udGFpbmVyIERJViBpcyBjcmVhdGVkIG9ubHkgb25jZSBmb3IgZWFjaCBvZiAzIGhvbGRlcnNcblx0XHRcdHZhciBiYXNlRGl2ID0gaXRlbS5jb250YWluZXIgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX3pvb20td3JhcCcpOyBcblxuXHRcdFx0XG5cblx0XHRcdGlmKCFpdGVtLnNyYyAmJiBpdGVtLmh0bWwpIHtcblx0XHRcdFx0aWYoaXRlbS5odG1sLnRhZ05hbWUpIHtcblx0XHRcdFx0XHRiYXNlRGl2LmFwcGVuZENoaWxkKGl0ZW0uaHRtbCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YmFzZURpdi5pbm5lckhUTUwgPSBpdGVtLmh0bWw7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X2NoZWNrRm9yRXJyb3IoaXRlbSk7XG5cblx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShpdGVtLCBfdmlld3BvcnRTaXplKTtcblx0XHRcdFxuXHRcdFx0aWYoaXRlbS5zcmMgJiYgIWl0ZW0ubG9hZEVycm9yICYmICFpdGVtLmxvYWRlZCkge1xuXG5cdFx0XHRcdGl0ZW0ubG9hZENvbXBsZXRlID0gZnVuY3Rpb24oaXRlbSkge1xuXG5cdFx0XHRcdFx0Ly8gZ2FsbGVyeSBjbG9zZWQgYmVmb3JlIGltYWdlIGZpbmlzaGVkIGxvYWRpbmdcblx0XHRcdFx0XHRpZighX2lzT3Blbikge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIGNoZWNrIGlmIGhvbGRlciBoYXNuJ3QgY2hhbmdlZCB3aGlsZSBpbWFnZSB3YXMgbG9hZGluZ1xuXHRcdFx0XHRcdGlmKGhvbGRlciAmJiBob2xkZXIuaW5kZXggPT09IGluZGV4ICkge1xuXHRcdFx0XHRcdFx0aWYoIF9jaGVja0ZvckVycm9yKGl0ZW0sIHRydWUpICkge1xuXHRcdFx0XHRcdFx0XHRpdGVtLmxvYWRDb21wbGV0ZSA9IGl0ZW0uaW1nID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0X2NhbGN1bGF0ZUl0ZW1TaXplKGl0ZW0sIF92aWV3cG9ydFNpemUpO1xuXHRcdFx0XHRcdFx0XHRfYXBwbHlab29tUGFuVG9JdGVtKGl0ZW0pO1xuXG5cdFx0XHRcdFx0XHRcdGlmKGhvbGRlci5pbmRleCA9PT0gX2N1cnJlbnRJdGVtSW5kZXgpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyByZWNhbGN1bGF0ZSBkaW1lbnNpb25zXG5cdFx0XHRcdFx0XHRcdFx0c2VsZi51cGRhdGVDdXJyWm9vbUl0ZW0oKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiggIWl0ZW0uaW1hZ2VBcHBlbmRlZCApIHtcblx0XHRcdFx0XHRcdFx0aWYoX2ZlYXR1cmVzLnRyYW5zZm9ybSAmJiAoX21haW5TY3JvbGxBbmltYXRpbmcgfHwgX2luaXRpYWxab29tUnVubmluZykgKSB7XG5cdFx0XHRcdFx0XHRcdFx0X2ltYWdlc1RvQXBwZW5kUG9vbC5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdGl0ZW06aXRlbSxcblx0XHRcdFx0XHRcdFx0XHRcdGJhc2VEaXY6YmFzZURpdixcblx0XHRcdFx0XHRcdFx0XHRcdGltZzppdGVtLmltZyxcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OmluZGV4LFxuXHRcdFx0XHRcdFx0XHRcdFx0aG9sZGVyOmhvbGRlcixcblx0XHRcdFx0XHRcdFx0XHRcdGNsZWFyUGxhY2Vob2xkZXI6dHJ1ZVxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdF9hcHBlbmRJbWFnZShpbmRleCwgaXRlbSwgYmFzZURpdiwgaXRlbS5pbWcsIF9tYWluU2Nyb2xsQW5pbWF0aW5nIHx8IF9pbml0aWFsWm9vbVJ1bm5pbmcsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyByZW1vdmUgcHJlbG9hZGVyICYgbWluaS1pbWdcblx0XHRcdFx0XHRcdFx0aWYoIV9pbml0aWFsWm9vbVJ1bm5pbmcgJiYgaXRlbS5wbGFjZWhvbGRlcikge1xuXHRcdFx0XHRcdFx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0XHRcdFx0XHRpdGVtLnBsYWNlaG9sZGVyID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGl0ZW0ubG9hZENvbXBsZXRlID0gbnVsbDtcblx0XHRcdFx0XHRpdGVtLmltZyA9IG51bGw7IC8vIG5vIG5lZWQgdG8gc3RvcmUgaW1hZ2UgZWxlbWVudCBhZnRlciBpdCdzIGFkZGVkXG5cblx0XHRcdFx0XHRfc2hvdXQoJ2ltYWdlTG9hZENvbXBsZXRlJywgaW5kZXgsIGl0ZW0pO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGlmKGZyYW1ld29yay5mZWF0dXJlcy50cmFuc2Zvcm0pIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgcGxhY2Vob2xkZXJDbGFzc05hbWUgPSAncHN3cF9faW1nIHBzd3BfX2ltZy0tcGxhY2Vob2xkZXInOyBcblx0XHRcdFx0XHRwbGFjZWhvbGRlckNsYXNzTmFtZSArPSAoaXRlbS5tc3JjID8gJycgOiAnIHBzd3BfX2ltZy0tcGxhY2Vob2xkZXItLWJsYW5rJyk7XG5cblx0XHRcdFx0XHR2YXIgcGxhY2Vob2xkZXIgPSBmcmFtZXdvcmsuY3JlYXRlRWwocGxhY2Vob2xkZXJDbGFzc05hbWUsIGl0ZW0ubXNyYyA/ICdpbWcnIDogJycpO1xuXHRcdFx0XHRcdGlmKGl0ZW0ubXNyYykge1xuXHRcdFx0XHRcdFx0cGxhY2Vob2xkZXIuc3JjID0gaXRlbS5tc3JjO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRfc2V0SW1hZ2VTaXplKGl0ZW0sIHBsYWNlaG9sZGVyKTtcblxuXHRcdFx0XHRcdGJhc2VEaXYuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuXHRcdFx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcjtcblxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXG5cdFx0XHRcdFxuXG5cdFx0XHRcdGlmKCFpdGVtLmxvYWRpbmcpIHtcblx0XHRcdFx0XHRfcHJlbG9hZEltYWdlKGl0ZW0pO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHRpZiggc2VsZi5hbGxvd1Byb2dyZXNzaXZlSW1nKCkgKSB7XG5cdFx0XHRcdFx0Ly8ganVzdCBhcHBlbmQgaW1hZ2Vcblx0XHRcdFx0XHRpZighX2luaXRpYWxDb250ZW50U2V0ICYmIF9mZWF0dXJlcy50cmFuc2Zvcm0pIHtcblx0XHRcdFx0XHRcdF9pbWFnZXNUb0FwcGVuZFBvb2wucHVzaCh7XG5cdFx0XHRcdFx0XHRcdGl0ZW06aXRlbSwgXG5cdFx0XHRcdFx0XHRcdGJhc2VEaXY6YmFzZURpdiwgXG5cdFx0XHRcdFx0XHRcdGltZzppdGVtLmltZywgXG5cdFx0XHRcdFx0XHRcdGluZGV4OmluZGV4LCBcblx0XHRcdFx0XHRcdFx0aG9sZGVyOmhvbGRlclxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdF9hcHBlbmRJbWFnZShpbmRleCwgaXRlbSwgYmFzZURpdiwgaXRlbS5pbWcsIHRydWUsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdH0gZWxzZSBpZihpdGVtLnNyYyAmJiAhaXRlbS5sb2FkRXJyb3IpIHtcblx0XHRcdFx0Ly8gaW1hZ2Ugb2JqZWN0IGlzIGNyZWF0ZWQgZXZlcnkgdGltZSwgZHVlIHRvIGJ1Z3Mgb2YgaW1hZ2UgbG9hZGluZyAmIGRlbGF5IHdoZW4gc3dpdGNoaW5nIGltYWdlc1xuXHRcdFx0XHRpbWcgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2ltZycsICdpbWcnKTtcblx0XHRcdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAxO1xuXHRcdFx0XHRpbWcuc3JjID0gaXRlbS5zcmM7XG5cdFx0XHRcdF9zZXRJbWFnZVNpemUoaXRlbSwgaW1nKTtcblx0XHRcdFx0X2FwcGVuZEltYWdlKGluZGV4LCBpdGVtLCBiYXNlRGl2LCBpbWcsIHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0XG5cblx0XHRcdGlmKCFfaW5pdGlhbENvbnRlbnRTZXQgJiYgaW5kZXggPT09IF9jdXJyZW50SXRlbUluZGV4KSB7XG5cdFx0XHRcdF9jdXJyWm9vbUVsZW1lbnRTdHlsZSA9IGJhc2VEaXYuc3R5bGU7XG5cdFx0XHRcdF9zaG93T3JIaWRlKGl0ZW0sIChpbWcgfHxpdGVtLmltZykgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0oaXRlbSk7XG5cdFx0XHR9XG5cblx0XHRcdGhvbGRlci5lbC5pbm5lckhUTUwgPSAnJztcblx0XHRcdGhvbGRlci5lbC5hcHBlbmRDaGlsZChiYXNlRGl2KTtcblx0XHR9LFxuXG5cdFx0Y2xlYW5TbGlkZTogZnVuY3Rpb24oIGl0ZW0gKSB7XG5cdFx0XHRpZihpdGVtLmltZyApIHtcblx0XHRcdFx0aXRlbS5pbWcub25sb2FkID0gaXRlbS5pbWcub25lcnJvciA9IG51bGw7XG5cdFx0XHR9XG5cdFx0XHRpdGVtLmxvYWRlZCA9IGl0ZW0ubG9hZGluZyA9IGl0ZW0uaW1nID0gaXRlbS5pbWFnZUFwcGVuZGVkID0gZmFsc2U7XG5cdFx0fVxuXG5cdH1cbn0pO1xuXG4vKj4+aXRlbXMtY29udHJvbGxlciovXG5cbi8qPj50YXAqL1xuLyoqXG4gKiB0YXAuanM6XG4gKlxuICogRGlzcGxhdGNoZXMgdGFwIGFuZCBkb3VibGUtdGFwIGV2ZW50cy5cbiAqIFxuICovXG5cbnZhciB0YXBUaW1lcixcblx0dGFwUmVsZWFzZVBvaW50ID0ge30sXG5cdF9kaXNwYXRjaFRhcEV2ZW50ID0gZnVuY3Rpb24ob3JpZ0V2ZW50LCByZWxlYXNlUG9pbnQsIHBvaW50ZXJUeXBlKSB7XHRcdFxuXHRcdHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoICdDdXN0b21FdmVudCcgKSxcblx0XHRcdGVEZXRhaWwgPSB7XG5cdFx0XHRcdG9yaWdFdmVudDpvcmlnRXZlbnQsIFxuXHRcdFx0XHR0YXJnZXQ6b3JpZ0V2ZW50LnRhcmdldCwgXG5cdFx0XHRcdHJlbGVhc2VQb2ludDogcmVsZWFzZVBvaW50LCBcblx0XHRcdFx0cG9pbnRlclR5cGU6cG9pbnRlclR5cGUgfHwgJ3RvdWNoJ1xuXHRcdFx0fTtcblxuXHRcdGUuaW5pdEN1c3RvbUV2ZW50KCAncHN3cFRhcCcsIHRydWUsIHRydWUsIGVEZXRhaWwgKTtcblx0XHRvcmlnRXZlbnQudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZSk7XG5cdH07XG5cbl9yZWdpc3Rlck1vZHVsZSgnVGFwJywge1xuXHRwdWJsaWNNZXRob2RzOiB7XG5cdFx0aW5pdFRhcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRfbGlzdGVuKCdmaXJzdFRvdWNoU3RhcnQnLCBzZWxmLm9uVGFwU3RhcnQpO1xuXHRcdFx0X2xpc3RlbigndG91Y2hSZWxlYXNlJywgc2VsZi5vblRhcFJlbGVhc2UpO1xuXHRcdFx0X2xpc3RlbignZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0YXBSZWxlYXNlUG9pbnQgPSB7fTtcblx0XHRcdFx0dGFwVGltZXIgPSBudWxsO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRvblRhcFN0YXJ0OiBmdW5jdGlvbih0b3VjaExpc3QpIHtcblx0XHRcdGlmKHRvdWNoTGlzdC5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdGNsZWFyVGltZW91dCh0YXBUaW1lcik7XG5cdFx0XHRcdHRhcFRpbWVyID0gbnVsbDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9uVGFwUmVsZWFzZTogZnVuY3Rpb24oZSwgcmVsZWFzZVBvaW50KSB7XG5cdFx0XHRpZighcmVsZWFzZVBvaW50KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoIV9tb3ZlZCAmJiAhX2lzTXVsdGl0b3VjaCAmJiAhX251bUFuaW1hdGlvbnMpIHtcblx0XHRcdFx0dmFyIHAwID0gcmVsZWFzZVBvaW50O1xuXHRcdFx0XHRpZih0YXBUaW1lcikge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0YXBUaW1lcik7XG5cdFx0XHRcdFx0dGFwVGltZXIgPSBudWxsO1xuXG5cdFx0XHRcdFx0Ly8gQ2hlY2sgaWYgdGFwZWQgb24gdGhlIHNhbWUgcGxhY2Vcblx0XHRcdFx0XHRpZiAoIF9pc05lYXJieVBvaW50cyhwMCwgdGFwUmVsZWFzZVBvaW50KSApIHtcblx0XHRcdFx0XHRcdF9zaG91dCgnZG91YmxlVGFwJywgcDApO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKHJlbGVhc2VQb2ludC50eXBlID09PSAnbW91c2UnKSB7XG5cdFx0XHRcdFx0X2Rpc3BhdGNoVGFwRXZlbnQoZSwgcmVsZWFzZVBvaW50LCAnbW91c2UnKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgY2xpY2tlZFRhZ05hbWUgPSBlLnRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG5cdFx0XHRcdC8vIGF2b2lkIGRvdWJsZSB0YXAgZGVsYXkgb24gYnV0dG9ucyBhbmQgZWxlbWVudHMgdGhhdCBoYXZlIGNsYXNzIHBzd3BfX3NpbmdsZS10YXBcblx0XHRcdFx0aWYoY2xpY2tlZFRhZ05hbWUgPT09ICdCVVRUT04nIHx8IGZyYW1ld29yay5oYXNDbGFzcyhlLnRhcmdldCwgJ3Bzd3BfX3NpbmdsZS10YXAnKSApIHtcblx0XHRcdFx0XHRfZGlzcGF0Y2hUYXBFdmVudChlLCByZWxlYXNlUG9pbnQpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF9lcXVhbGl6ZVBvaW50cyh0YXBSZWxlYXNlUG9pbnQsIHAwKTtcblxuXHRcdFx0XHR0YXBUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0X2Rpc3BhdGNoVGFwRXZlbnQoZSwgcmVsZWFzZVBvaW50KTtcblx0XHRcdFx0XHR0YXBUaW1lciA9IG51bGw7XG5cdFx0XHRcdH0sIDMwMCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTtcblxuLyo+PnRhcCovXG5cbi8qPj5kZXNrdG9wLXpvb20qL1xuLyoqXG4gKlxuICogZGVza3RvcC16b29tLmpzOlxuICpcbiAqIC0gQmluZHMgbW91c2V3aGVlbCBldmVudCBmb3IgcGFuaW5nIHpvb21lZCBpbWFnZS5cbiAqIC0gTWFuYWdlcyBcImRyYWdnaW5nXCIsIFwiem9vbWVkLWluXCIsIFwiem9vbS1vdXRcIiBjbGFzc2VzLlxuICogICAod2hpY2ggYXJlIHVzZWQgZm9yIGN1cnNvcnMgYW5kIHpvb20gaWNvbilcbiAqIC0gQWRkcyB0b2dnbGVEZXNrdG9wWm9vbSBmdW5jdGlvbi5cbiAqIFxuICovXG5cbnZhciBfd2hlZWxEZWx0YTtcblx0XG5fcmVnaXN0ZXJNb2R1bGUoJ0Rlc2t0b3Bab29tJywge1xuXG5cdHB1YmxpY01ldGhvZHM6IHtcblxuXHRcdGluaXREZXNrdG9wWm9vbTogZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmKF9vbGRJRSkge1xuXHRcdFx0XHQvLyBubyB6b29tIGZvciBvbGQgSUUgKDw9OClcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihfbGlrZWx5VG91Y2hEZXZpY2UpIHtcblx0XHRcdFx0Ly8gaWYgZGV0ZWN0ZWQgaGFyZHdhcmUgdG91Y2ggc3VwcG9ydCwgd2Ugd2FpdCB1bnRpbCBtb3VzZSBpcyB1c2VkLFxuXHRcdFx0XHQvLyBhbmQgb25seSB0aGVuIGFwcGx5IGRlc2t0b3Atem9vbSBmZWF0dXJlc1xuXHRcdFx0XHRfbGlzdGVuKCdtb3VzZVVzZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRzZWxmLnNldHVwRGVza3RvcFpvb20oKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZWxmLnNldHVwRGVza3RvcFpvb20odHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHR9LFxuXG5cdFx0c2V0dXBEZXNrdG9wWm9vbTogZnVuY3Rpb24ob25Jbml0KSB7XG5cblx0XHRcdF93aGVlbERlbHRhID0ge307XG5cblx0XHRcdHZhciBldmVudHMgPSAnd2hlZWwgbW91c2V3aGVlbCBET01Nb3VzZVNjcm9sbCc7XG5cdFx0XHRcblx0XHRcdF9saXN0ZW4oJ2JpbmRFdmVudHMnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZnJhbWV3b3JrLmJpbmQodGVtcGxhdGUsIGV2ZW50cywgIHNlbGYuaGFuZGxlTW91c2VXaGVlbCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0X2xpc3RlbigndW5iaW5kRXZlbnRzJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmKF93aGVlbERlbHRhKSB7XG5cdFx0XHRcdFx0ZnJhbWV3b3JrLnVuYmluZCh0ZW1wbGF0ZSwgZXZlbnRzLCBzZWxmLmhhbmRsZU1vdXNlV2hlZWwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0c2VsZi5tb3VzZVpvb21lZEluID0gZmFsc2U7XG5cblx0XHRcdHZhciBoYXNEcmFnZ2luZ0NsYXNzLFxuXHRcdFx0XHR1cGRhdGVab29tYWJsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKHNlbGYubW91c2Vab29tZWRJbikge1xuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKHRlbXBsYXRlLCAncHN3cC0tem9vbWVkLWluJyk7XG5cdFx0XHRcdFx0XHRzZWxmLm1vdXNlWm9vbWVkSW4gPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoX2N1cnJab29tTGV2ZWwgPCAxKSB7XG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS16b29tLWFsbG93ZWQnKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKHRlbXBsYXRlLCAncHN3cC0tem9vbS1hbGxvd2VkJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJlbW92ZURyYWdnaW5nQ2xhc3MoKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0cmVtb3ZlRHJhZ2dpbmdDbGFzcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKGhhc0RyYWdnaW5nQ2xhc3MpIHtcblx0XHRcdFx0XHRcdGZyYW1ld29yay5yZW1vdmVDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWRyYWdnaW5nJyk7XG5cdFx0XHRcdFx0XHRoYXNEcmFnZ2luZ0NsYXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRfbGlzdGVuKCdyZXNpemUnICwgdXBkYXRlWm9vbWFibGUpO1xuXHRcdFx0X2xpc3RlbignYWZ0ZXJDaGFuZ2UnICwgdXBkYXRlWm9vbWFibGUpO1xuXHRcdFx0X2xpc3RlbigncG9pbnRlckRvd24nLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYoc2VsZi5tb3VzZVpvb21lZEluKSB7XG5cdFx0XHRcdFx0aGFzRHJhZ2dpbmdDbGFzcyA9IHRydWU7XG5cdFx0XHRcdFx0ZnJhbWV3b3JrLmFkZENsYXNzKHRlbXBsYXRlLCAncHN3cC0tZHJhZ2dpbmcnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRfbGlzdGVuKCdwb2ludGVyVXAnLCByZW1vdmVEcmFnZ2luZ0NsYXNzKTtcblxuXHRcdFx0aWYoIW9uSW5pdCkge1xuXHRcdFx0XHR1cGRhdGVab29tYWJsZSgpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fSxcblxuXHRcdGhhbmRsZU1vdXNlV2hlZWw6IGZ1bmN0aW9uKGUpIHtcblxuXHRcdFx0aWYoX2N1cnJab29tTGV2ZWwgPD0gc2VsZi5jdXJySXRlbS5maXRSYXRpbykge1xuXHRcdFx0XHRpZiggX29wdGlvbnMubW9kYWwgKSB7XG5cblx0XHRcdFx0XHRpZiAoIV9vcHRpb25zLmNsb3NlT25TY3JvbGwgfHwgX251bUFuaW1hdGlvbnMgfHwgX2lzRHJhZ2dpbmcpIHtcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYoX3RyYW5zZm9ybUtleSAmJiBNYXRoLmFicyhlLmRlbHRhWSkgPiAyKSB7XG5cdFx0XHRcdFx0XHQvLyBjbG9zZSBQaG90b1N3aXBlXG5cdFx0XHRcdFx0XHQvLyBpZiBicm93c2VyIHN1cHBvcnRzIHRyYW5zZm9ybXMgJiBzY3JvbGwgY2hhbmdlZCBlbm91Z2hcblx0XHRcdFx0XHRcdF9jbG9zZWRCeVNjcm9sbCA9IHRydWU7XG5cdFx0XHRcdFx0XHRzZWxmLmNsb3NlKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFsbG93IGp1c3Qgb25lIGV2ZW50IHRvIGZpcmVcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy93aGVlbFxuXHRcdFx0X3doZWVsRGVsdGEueCA9IDA7XG5cblx0XHRcdGlmKCdkZWx0YVgnIGluIGUpIHtcblx0XHRcdFx0aWYoZS5kZWx0YU1vZGUgPT09IDEgLyogRE9NX0RFTFRBX0xJTkUgKi8pIHtcblx0XHRcdFx0XHQvLyAxOCAtIGF2ZXJhZ2UgbGluZSBoZWlnaHRcblx0XHRcdFx0XHRfd2hlZWxEZWx0YS54ID0gZS5kZWx0YVggKiAxODtcblx0XHRcdFx0XHRfd2hlZWxEZWx0YS55ID0gZS5kZWx0YVkgKiAxODtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRfd2hlZWxEZWx0YS54ID0gZS5kZWx0YVg7XG5cdFx0XHRcdFx0X3doZWVsRGVsdGEueSA9IGUuZGVsdGFZO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoJ3doZWVsRGVsdGEnIGluIGUpIHtcblx0XHRcdFx0aWYoZS53aGVlbERlbHRhWCkge1xuXHRcdFx0XHRcdF93aGVlbERlbHRhLnggPSAtMC4xNiAqIGUud2hlZWxEZWx0YVg7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoZS53aGVlbERlbHRhWSkge1xuXHRcdFx0XHRcdF93aGVlbERlbHRhLnkgPSAtMC4xNiAqIGUud2hlZWxEZWx0YVk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X3doZWVsRGVsdGEueSA9IC0wLjE2ICogZS53aGVlbERlbHRhO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoJ2RldGFpbCcgaW4gZSkge1xuXHRcdFx0XHRfd2hlZWxEZWx0YS55ID0gZS5kZXRhaWw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9jYWxjdWxhdGVQYW5Cb3VuZHMoX2N1cnJab29tTGV2ZWwsIHRydWUpO1xuXG5cdFx0XHR2YXIgbmV3UGFuWCA9IF9wYW5PZmZzZXQueCAtIF93aGVlbERlbHRhLngsXG5cdFx0XHRcdG5ld1BhblkgPSBfcGFuT2Zmc2V0LnkgLSBfd2hlZWxEZWx0YS55O1xuXG5cdFx0XHQvLyBvbmx5IHByZXZlbnQgc2Nyb2xsaW5nIGluIG5vbm1vZGFsIG1vZGUgd2hlbiBub3QgYXQgZWRnZXNcblx0XHRcdGlmIChfb3B0aW9ucy5tb2RhbCB8fFxuXHRcdFx0XHQoXG5cdFx0XHRcdG5ld1BhblggPD0gX2N1cnJQYW5Cb3VuZHMubWluLnggJiYgbmV3UGFuWCA+PSBfY3VyclBhbkJvdW5kcy5tYXgueCAmJlxuXHRcdFx0XHRuZXdQYW5ZIDw9IF9jdXJyUGFuQm91bmRzLm1pbi55ICYmIG5ld1BhblkgPj0gX2N1cnJQYW5Cb3VuZHMubWF4Lnlcblx0XHRcdFx0KSApIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUT0RPOiB1c2UgckFGIGluc3RlYWQgb2YgbW91c2V3aGVlbD9cblx0XHRcdHNlbGYucGFuVG8obmV3UGFuWCwgbmV3UGFuWSk7XG5cdFx0fSxcblxuXHRcdHRvZ2dsZURlc2t0b3Bab29tOiBmdW5jdGlvbihjZW50ZXJQb2ludCkge1xuXHRcdFx0Y2VudGVyUG9pbnQgPSBjZW50ZXJQb2ludCB8fCB7eDpfdmlld3BvcnRTaXplLngvMiArIF9vZmZzZXQueCwgeTpfdmlld3BvcnRTaXplLnkvMiArIF9vZmZzZXQueSB9O1xuXG5cdFx0XHR2YXIgZG91YmxlVGFwWm9vbUxldmVsID0gX29wdGlvbnMuZ2V0RG91YmxlVGFwWm9vbSh0cnVlLCBzZWxmLmN1cnJJdGVtKTtcblx0XHRcdHZhciB6b29tT3V0ID0gX2N1cnJab29tTGV2ZWwgPT09IGRvdWJsZVRhcFpvb21MZXZlbDtcblx0XHRcdFxuXHRcdFx0c2VsZi5tb3VzZVpvb21lZEluID0gIXpvb21PdXQ7XG5cblx0XHRcdHNlbGYuem9vbVRvKHpvb21PdXQgPyBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgOiBkb3VibGVUYXBab29tTGV2ZWwsIGNlbnRlclBvaW50LCAzMzMpO1xuXHRcdFx0ZnJhbWV3b3JrWyAoIXpvb21PdXQgPyAnYWRkJyA6ICdyZW1vdmUnKSArICdDbGFzcyddKHRlbXBsYXRlLCAncHN3cC0tem9vbWVkLWluJyk7XG5cdFx0fVxuXG5cdH1cbn0pO1xuXG5cbi8qPj5kZXNrdG9wLXpvb20qL1xuXG4vKj4+aGlzdG9yeSovXG4vKipcbiAqXG4gKiBoaXN0b3J5LmpzOlxuICpcbiAqIC0gQmFjayBidXR0b24gdG8gY2xvc2UgZ2FsbGVyeS5cbiAqIFxuICogLSBVbmlxdWUgVVJMIGZvciBlYWNoIHNsaWRlOiBleGFtcGxlLmNvbS8mcGlkPTEmZ2lkPTNcbiAqICAgKHdoZXJlIFBJRCBpcyBwaWN0dXJlIGluZGV4LCBhbmQgR0lEIGFuZCBnYWxsZXJ5IGluZGV4KVxuICogICBcbiAqIC0gU3dpdGNoIFVSTCB3aGVuIHNsaWRlcyBjaGFuZ2UuXG4gKiBcbiAqL1xuXG5cbnZhciBfaGlzdG9yeURlZmF1bHRPcHRpb25zID0ge1xuXHRoaXN0b3J5OiB0cnVlLFxuXHRnYWxsZXJ5VUlEOiAxXG59O1xuXG52YXIgX2hpc3RvcnlVcGRhdGVUaW1lb3V0LFxuXHRfaGFzaENoYW5nZVRpbWVvdXQsXG5cdF9oYXNoQW5pbUNoZWNrVGltZW91dCxcblx0X2hhc2hDaGFuZ2VkQnlTY3JpcHQsXG5cdF9oYXNoQ2hhbmdlZEJ5SGlzdG9yeSxcblx0X2hhc2hSZXNldGVkLFxuXHRfaW5pdGlhbEhhc2gsXG5cdF9oaXN0b3J5Q2hhbmdlZCxcblx0X2Nsb3NlZEZyb21VUkwsXG5cdF91cmxDaGFuZ2VkT25jZSxcblx0X3dpbmRvd0xvYyxcblxuXHRfc3VwcG9ydHNQdXNoU3RhdGUsXG5cblx0X2dldEhhc2ggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX3dpbmRvd0xvYy5oYXNoLnN1YnN0cmluZygxKTtcblx0fSxcblx0X2NsZWFuSGlzdG9yeVRpbWVvdXRzID0gZnVuY3Rpb24oKSB7XG5cblx0XHRpZihfaGlzdG9yeVVwZGF0ZVRpbWVvdXQpIHtcblx0XHRcdGNsZWFyVGltZW91dChfaGlzdG9yeVVwZGF0ZVRpbWVvdXQpO1xuXHRcdH1cblxuXHRcdGlmKF9oYXNoQW5pbUNoZWNrVGltZW91dCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9oYXNoQW5pbUNoZWNrVGltZW91dCk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHBpZCAtIFBpY3R1cmUgaW5kZXhcblx0Ly8gZ2lkIC0gR2FsbGVyeSBpbmRleFxuXHRfcGFyc2VJdGVtSW5kZXhGcm9tVVJMID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGhhc2ggPSBfZ2V0SGFzaCgpLFxuXHRcdFx0cGFyYW1zID0ge307XG5cblx0XHRpZihoYXNoLmxlbmd0aCA8IDUpIHsgLy8gcGlkPTFcblx0XHRcdHJldHVybiBwYXJhbXM7XG5cdFx0fVxuXG5cdFx0dmFyIGksIHZhcnMgPSBoYXNoLnNwbGl0KCcmJyk7XG5cdFx0Zm9yIChpID0gMDsgaSA8IHZhcnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKCF2YXJzW2ldKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHBhaXIgPSB2YXJzW2ldLnNwbGl0KCc9Jyk7XHRcblx0XHRcdGlmKHBhaXIubGVuZ3RoIDwgMikge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdHBhcmFtc1twYWlyWzBdXSA9IHBhaXJbMV07XG5cdFx0fVxuXHRcdGlmKF9vcHRpb25zLmdhbGxlcnlQSURzKSB7XG5cdFx0XHQvLyBkZXRlY3QgY3VzdG9tIHBpZCBpbiBoYXNoIGFuZCBzZWFyY2ggZm9yIGl0IGFtb25nIHRoZSBpdGVtcyBjb2xsZWN0aW9uXG5cdFx0XHR2YXIgc2VhcmNoZm9yID0gcGFyYW1zLnBpZDtcblx0XHRcdHBhcmFtcy5waWQgPSAwOyAvLyBpZiBjdXN0b20gcGlkIGNhbm5vdCBiZSBmb3VuZCwgZmFsbGJhY2sgdG8gdGhlIGZpcnN0IGl0ZW1cblx0XHRcdGZvcihpID0gMDsgaSA8IF9pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZihfaXRlbXNbaV0ucGlkID09PSBzZWFyY2hmb3IpIHtcblx0XHRcdFx0XHRwYXJhbXMucGlkID0gaTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJhbXMucGlkID0gcGFyc2VJbnQocGFyYW1zLnBpZCwxMCktMTtcblx0XHR9XG5cdFx0aWYoIHBhcmFtcy5waWQgPCAwICkge1xuXHRcdFx0cGFyYW1zLnBpZCA9IDA7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJhbXM7XG5cdH0sXG5cdF91cGRhdGVIYXNoID0gZnVuY3Rpb24oKSB7XG5cblx0XHRpZihfaGFzaEFuaW1DaGVja1RpbWVvdXQpIHtcblx0XHRcdGNsZWFyVGltZW91dChfaGFzaEFuaW1DaGVja1RpbWVvdXQpO1xuXHRcdH1cblxuXG5cdFx0aWYoX251bUFuaW1hdGlvbnMgfHwgX2lzRHJhZ2dpbmcpIHtcblx0XHRcdC8vIGNoYW5naW5nIGJyb3dzZXIgVVJMIGZvcmNlcyBsYXlvdXQvcGFpbnQgaW4gc29tZSBicm93c2Vycywgd2hpY2ggY2F1c2VzIG5vdGljYWJsZSBsYWcgZHVyaW5nIGFuaW1hdGlvblxuXHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSB1cGRhdGUgaGFzaCBvbmx5IHdoZW4gbm8gYW5pbWF0aW9ucyBydW5uaW5nXG5cdFx0XHRfaGFzaEFuaW1DaGVja1RpbWVvdXQgPSBzZXRUaW1lb3V0KF91cGRhdGVIYXNoLCA1MDApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRcblx0XHRpZihfaGFzaENoYW5nZWRCeVNjcmlwdCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9oYXNoQ2hhbmdlVGltZW91dCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdF9oYXNoQ2hhbmdlZEJ5U2NyaXB0ID0gdHJ1ZTtcblx0XHR9XG5cblxuXHRcdHZhciBwaWQgPSAoX2N1cnJlbnRJdGVtSW5kZXggKyAxKTtcblx0XHR2YXIgaXRlbSA9IF9nZXRJdGVtQXQoIF9jdXJyZW50SXRlbUluZGV4ICk7XG5cdFx0aWYoaXRlbS5oYXNPd25Qcm9wZXJ0eSgncGlkJykpIHtcblx0XHRcdC8vIGNhcnJ5IGZvcndhcmQgYW55IGN1c3RvbSBwaWQgYXNzaWduZWQgdG8gdGhlIGl0ZW1cblx0XHRcdHBpZCA9IGl0ZW0ucGlkO1xuXHRcdH1cblx0XHR2YXIgbmV3SGFzaCA9IF9pbml0aWFsSGFzaCArICcmJyAgKyAgJ2dpZD0nICsgX29wdGlvbnMuZ2FsbGVyeVVJRCArICcmJyArICdwaWQ9JyArIHBpZDtcblxuXHRcdGlmKCFfaGlzdG9yeUNoYW5nZWQpIHtcblx0XHRcdGlmKF93aW5kb3dMb2MuaGFzaC5pbmRleE9mKG5ld0hhc2gpID09PSAtMSkge1xuXHRcdFx0XHRfdXJsQ2hhbmdlZE9uY2UgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0Ly8gZmlyc3QgdGltZSAtIGFkZCBuZXcgaGlzb3J5IHJlY29yZCwgdGhlbiBqdXN0IHJlcGxhY2Vcblx0XHR9XG5cblx0XHR2YXIgbmV3VVJMID0gX3dpbmRvd0xvYy5ocmVmLnNwbGl0KCcjJylbMF0gKyAnIycgKyAgbmV3SGFzaDtcblxuXHRcdGlmKCBfc3VwcG9ydHNQdXNoU3RhdGUgKSB7XG5cblx0XHRcdGlmKCcjJyArIG5ld0hhc2ggIT09IHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG5cdFx0XHRcdGhpc3RvcnlbX2hpc3RvcnlDaGFuZ2VkID8gJ3JlcGxhY2VTdGF0ZScgOiAncHVzaFN0YXRlJ10oJycsIGRvY3VtZW50LnRpdGxlLCBuZXdVUkwpO1xuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKF9oaXN0b3J5Q2hhbmdlZCkge1xuXHRcdFx0XHRfd2luZG93TG9jLnJlcGxhY2UoIG5ld1VSTCApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0X3dpbmRvd0xvYy5oYXNoID0gbmV3SGFzaDtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0XG5cblx0XHRfaGlzdG9yeUNoYW5nZWQgPSB0cnVlO1xuXHRcdF9oYXNoQ2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRfaGFzaENoYW5nZWRCeVNjcmlwdCA9IGZhbHNlO1xuXHRcdH0sIDYwKTtcblx0fTtcblxuXG5cblx0XG5cbl9yZWdpc3Rlck1vZHVsZSgnSGlzdG9yeScsIHtcblxuXHRcblxuXHRwdWJsaWNNZXRob2RzOiB7XG5cdFx0aW5pdEhpc3Rvcnk6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRmcmFtZXdvcmsuZXh0ZW5kKF9vcHRpb25zLCBfaGlzdG9yeURlZmF1bHRPcHRpb25zLCB0cnVlKTtcblxuXHRcdFx0aWYoICFfb3B0aW9ucy5oaXN0b3J5ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblxuXHRcdFx0X3dpbmRvd0xvYyA9IHdpbmRvdy5sb2NhdGlvbjtcblx0XHRcdF91cmxDaGFuZ2VkT25jZSA9IGZhbHNlO1xuXHRcdFx0X2Nsb3NlZEZyb21VUkwgPSBmYWxzZTtcblx0XHRcdF9oaXN0b3J5Q2hhbmdlZCA9IGZhbHNlO1xuXHRcdFx0X2luaXRpYWxIYXNoID0gX2dldEhhc2goKTtcblx0XHRcdF9zdXBwb3J0c1B1c2hTdGF0ZSA9ICgncHVzaFN0YXRlJyBpbiBoaXN0b3J5KTtcblxuXG5cdFx0XHRpZihfaW5pdGlhbEhhc2guaW5kZXhPZignZ2lkPScpID4gLTEpIHtcblx0XHRcdFx0X2luaXRpYWxIYXNoID0gX2luaXRpYWxIYXNoLnNwbGl0KCcmZ2lkPScpWzBdO1xuXHRcdFx0XHRfaW5pdGlhbEhhc2ggPSBfaW5pdGlhbEhhc2guc3BsaXQoJz9naWQ9JylbMF07XG5cdFx0XHR9XG5cdFx0XHRcblxuXHRcdFx0X2xpc3RlbignYWZ0ZXJDaGFuZ2UnLCBzZWxmLnVwZGF0ZVVSTCk7XG5cdFx0XHRfbGlzdGVuKCd1bmJpbmRFdmVudHMnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZnJhbWV3b3JrLnVuYmluZCh3aW5kb3csICdoYXNoY2hhbmdlJywgc2VsZi5vbkhhc2hDaGFuZ2UpO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dmFyIHJldHVyblRvT3JpZ2luYWwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0X2hhc2hSZXNldGVkID0gdHJ1ZTtcblx0XHRcdFx0aWYoIV9jbG9zZWRGcm9tVVJMKSB7XG5cblx0XHRcdFx0XHRpZihfdXJsQ2hhbmdlZE9uY2UpIHtcblx0XHRcdFx0XHRcdGhpc3RvcnkuYmFjaygpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRcdGlmKF9pbml0aWFsSGFzaCkge1xuXHRcdFx0XHRcdFx0XHRfd2luZG93TG9jLmhhc2ggPSBfaW5pdGlhbEhhc2g7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRpZiAoX3N1cHBvcnRzUHVzaFN0YXRlKSB7XG5cblx0XHRcdFx0XHRcdFx0XHQvLyByZW1vdmUgaGFzaCBmcm9tIHVybCB3aXRob3V0IHJlZnJlc2hpbmcgaXQgb3Igc2Nyb2xsaW5nIHRvIHRvcFxuXHRcdFx0XHRcdFx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKCcnLCBkb2N1bWVudC50aXRsZSwgIF93aW5kb3dMb2MucGF0aG5hbWUgKyBfd2luZG93TG9jLnNlYXJjaCApO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdF93aW5kb3dMb2MuaGFzaCA9ICcnO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0X2NsZWFuSGlzdG9yeVRpbWVvdXRzKCk7XG5cdFx0XHR9O1xuXG5cblx0XHRcdF9saXN0ZW4oJ3VuYmluZEV2ZW50cycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZihfY2xvc2VkQnlTY3JvbGwpIHtcblx0XHRcdFx0XHQvLyBpZiBQaG90b1N3aXBlIGlzIGNsb3NlZCBieSBzY3JvbGwsIHdlIGdvIFwiYmFja1wiIGJlZm9yZSB0aGUgY2xvc2luZyBhbmltYXRpb24gc3RhcnRzXG5cdFx0XHRcdFx0Ly8gdGhpcyBpcyBkb25lIHRvIGtlZXAgdGhlIHNjcm9sbCBwb3NpdGlvblxuXHRcdFx0XHRcdHJldHVyblRvT3JpZ2luYWwoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRfbGlzdGVuKCdkZXN0cm95JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmKCFfaGFzaFJlc2V0ZWQpIHtcblx0XHRcdFx0XHRyZXR1cm5Ub09yaWdpbmFsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0X2xpc3RlbignZmlyc3RVcGRhdGUnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0X2N1cnJlbnRJdGVtSW5kZXggPSBfcGFyc2VJdGVtSW5kZXhGcm9tVVJMKCkucGlkO1xuXHRcdFx0fSk7XG5cblx0XHRcdFxuXG5cdFx0XHRcblx0XHRcdHZhciBpbmRleCA9IF9pbml0aWFsSGFzaC5pbmRleE9mKCdwaWQ9Jyk7XG5cdFx0XHRpZihpbmRleCA+IC0xKSB7XG5cdFx0XHRcdF9pbml0aWFsSGFzaCA9IF9pbml0aWFsSGFzaC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuXHRcdFx0XHRpZihfaW5pdGlhbEhhc2guc2xpY2UoLTEpID09PSAnJicpIHtcblx0XHRcdFx0XHRfaW5pdGlhbEhhc2ggPSBfaW5pdGlhbEhhc2guc2xpY2UoMCwgLTEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYoX2lzT3BlbikgeyAvLyBoYXNuJ3QgZGVzdHJveWVkIHlldFxuXHRcdFx0XHRcdGZyYW1ld29yay5iaW5kKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCBzZWxmLm9uSGFzaENoYW5nZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0sIDQwKTtcblx0XHRcdFxuXHRcdH0sXG5cdFx0b25IYXNoQ2hhbmdlOiBmdW5jdGlvbigpIHtcblxuXHRcdFx0aWYoX2dldEhhc2goKSA9PT0gX2luaXRpYWxIYXNoKSB7XG5cblx0XHRcdFx0X2Nsb3NlZEZyb21VUkwgPSB0cnVlO1xuXHRcdFx0XHRzZWxmLmNsb3NlKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGlmKCFfaGFzaENoYW5nZWRCeVNjcmlwdCkge1xuXG5cdFx0XHRcdF9oYXNoQ2hhbmdlZEJ5SGlzdG9yeSA9IHRydWU7XG5cdFx0XHRcdHNlbGYuZ29UbyggX3BhcnNlSXRlbUluZGV4RnJvbVVSTCgpLnBpZCApO1xuXHRcdFx0XHRfaGFzaENoYW5nZWRCeUhpc3RvcnkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdH0sXG5cdFx0dXBkYXRlVVJMOiBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gRGVsYXkgdGhlIHVwZGF0ZSBvZiBVUkwsIHRvIGF2b2lkIGxhZyBkdXJpbmcgdHJhbnNpdGlvbiwgXG5cdFx0XHQvLyBhbmQgdG8gbm90IHRvIHRyaWdnZXIgYWN0aW9ucyBsaWtlIFwicmVmcmVzaCBwYWdlIHNvdW5kXCIgb3IgXCJibGlua2luZyBmYXZpY29uXCIgdG8gb2Z0ZW5cblx0XHRcdFxuXHRcdFx0X2NsZWFuSGlzdG9yeVRpbWVvdXRzKCk7XG5cdFx0XHRcblxuXHRcdFx0aWYoX2hhc2hDaGFuZ2VkQnlIaXN0b3J5KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoIV9oaXN0b3J5Q2hhbmdlZCkge1xuXHRcdFx0XHRfdXBkYXRlSGFzaCgpOyAvLyBmaXJzdCB0aW1lXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRfaGlzdG9yeVVwZGF0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KF91cGRhdGVIYXNoLCA4MDApO1xuXHRcdFx0fVxuXHRcdH1cblx0XG5cdH1cbn0pO1xuXG5cbi8qPj5oaXN0b3J5Ki9cblx0ZnJhbWV3b3JrLmV4dGVuZChzZWxmLCBwdWJsaWNNZXRob2RzKTsgfTtcblx0cmV0dXJuIFBob3RvU3dpcGU7XG59KTsiLCJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUmVsbGF4LmpzIC0gdjEuMC4wXG4vLyBCdXR0ZXJ5IHNtb290aCBwYXJhbGxheCBsaWJyYXJ5XG4vLyBDb3B5cmlnaHQgKGMpIDIwMTYgTW9lIEFtYXlhIChAbW9lYW1heWEpXG4vLyBNSVQgbGljZW5zZVxuLy9cbi8vIFRoYW5rcyB0byBQYXJheGlmeS5qcyBhbmQgSmFpbWUgQ2FibGxlcm9cbi8vIGZvciBwYXJhbGxheCBjb25jZXB0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgLy8gTm9kZS4gRG9lcyBub3Qgd29yayB3aXRoIHN0cmljdCBDb21tb25KUywgYnV0XG4gICAgICAgIC8vIG9ubHkgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLFxuICAgICAgICAvLyBsaWtlIE5vZGUuXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAocm9vdCBpcyB3aW5kb3cpXG4gICAgICAgIHJvb3QuUmVsbGF4ID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgdmFyIFJlbGxheCA9IGZ1bmN0aW9uKGVsLCBvcHRpb25zKXtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBzZWxmID0gT2JqZWN0LmNyZWF0ZShSZWxsYXgucHJvdG90eXBlKTtcblxuICAgIHZhciBwb3NZID0gMDsgLy8gc2V0IGl0IHRvIC0xIHNvIHRoZSBhbmltYXRlIGZ1bmN0aW9uIGdldHMgY2FsbGVkIGF0IGxlYXN0IG9uY2VcbiAgICB2YXIgc2NyZWVuWSA9IDA7XG4gICAgdmFyIGJsb2NrcyA9IFtdO1xuICAgIHZhciBwYXVzZSA9IGZhbHNlO1xuXG4gICAgLy8gY2hlY2sgd2hhdCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgdG8gdXNlLCBhbmQgaWZcbiAgICAvLyBpdCdzIG5vdCBzdXBwb3J0ZWQsIHVzZSB0aGUgb25zY3JvbGwgZXZlbnRcbiAgICB2YXIgbG9vcCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBcdHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBcdHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBcdHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIFx0d2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBcdGZ1bmN0aW9uKGNhbGxiYWNrKXsgc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTsgfTtcblxuICAgIC8vIERlZmF1bHQgU2V0dGluZ3NcbiAgICBzZWxmLm9wdGlvbnMgPSB7XG4gICAgICBzcGVlZDogLTIsXG4gICAgICBjZW50ZXI6IGZhbHNlXG4gICAgfTtcblxuICAgIC8vIFVzZXIgZGVmaW5lZCBvcHRpb25zIChtaWdodCBoYXZlIG1vcmUgaW4gdGhlIGZ1dHVyZSlcbiAgICBpZiAob3B0aW9ucyl7XG4gICAgICBPYmplY3Qua2V5cyhvcHRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XG4gICAgICAgIHNlbGYub3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSWYgc29tZSBjbG93biB0cmllcyB0byBjcmFuayBzcGVlZCwgbGltaXQgdGhlbSB0byArLTEwXG4gICAgaWYgKHNlbGYub3B0aW9ucy5zcGVlZCA8IC0xMCkge1xuICAgICAgc2VsZi5vcHRpb25zLnNwZWVkID0gLTEwO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5vcHRpb25zLnNwZWVkID4gMTApIHtcbiAgICAgIHNlbGYub3B0aW9ucy5zcGVlZCA9IDEwO1xuICAgIH1cblxuICAgIC8vIEJ5IGRlZmF1bHQsIHJlbGxheCBjbGFzc1xuICAgIGlmICghZWwpIHtcbiAgICAgIGVsID0gJy5yZWxsYXgnO1xuICAgIH1cblxuICAgIC8vIENsYXNzZXNcbiAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShlbC5yZXBsYWNlKCcuJywnJykpKXtcbiAgICAgIHNlbGYuZWxlbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGVsLnJlcGxhY2UoJy4nLCcnKSk7XG4gICAgfVxuXG4gICAgLy8gTm93IHF1ZXJ5IHNlbGVjdG9yXG4gICAgZWxzZSBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbCkgIT09IGZhbHNlKSB7XG4gICAgICBzZWxmLmVsZW1zID0gcXVlcnlTZWxlY3RvcihlbCk7XG4gICAgfVxuXG4gICAgLy8gVGhlIGVsZW1lbnRzIGRvbid0IGV4aXN0XG4gICAgZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZWxlbWVudHMgeW91J3JlIHRyeWluZyB0byBzZWxlY3QgZG9uJ3QgZXhpc3QuXCIpO1xuICAgIH1cblxuXG4gICAgLy8gTGV0J3Mga2ljayB0aGlzIHNjcmlwdCBvZmZcbiAgICAvLyBCdWlsZCBhcnJheSBmb3IgY2FjaGVkIGVsZW1lbnQgdmFsdWVzXG4gICAgLy8gQmluZCBzY3JvbGwgYW5kIHJlc2l6ZSB0byBhbmltYXRlIG1ldGhvZFxuICAgIHZhciBpbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBzY3JlZW5ZID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgc2V0UG9zaXRpb24oKTtcblxuICAgICAgLy8gR2V0IGFuZCBjYWNoZSBpbml0aWFsIHBvc2l0aW9uIG9mIGFsbCBlbGVtZW50c1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmVsZW1zLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgdmFyIGJsb2NrID0gY3JlYXRlQmxvY2soc2VsZi5lbGVtc1tpXSk7XG4gICAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIH1cblxuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uKCl7XG5cdFx0XHQgIGFuaW1hdGUoKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBTdGFydCB0aGUgbG9vcFxuICAgICAgdXBkYXRlKCk7XG5cbiAgICAgIC8vIFRoZSBsb29wIGRvZXMgbm90aGluZyBpZiB0aGUgc2Nyb2xsUG9zaXRpb24gZGlkIG5vdCBjaGFuZ2VcbiAgICAgIC8vIHNvIGNhbGwgYW5pbWF0ZSB0byBtYWtlIHN1cmUgZXZlcnkgZWxlbWVudCBoYXMgdGhlaXIgdHJhbnNmb3Jtc1xuICAgICAgYW5pbWF0ZSgpO1xuICAgIH07XG5cblxuICAgIC8vIFdlIHdhbnQgdG8gY2FjaGUgdGhlIHBhcmFsbGF4IGJsb2NrcydcbiAgICAvLyB2YWx1ZXM6IGJhc2UsIHRvcCwgaGVpZ2h0LCBzcGVlZFxuICAgIC8vIGVsOiBpcyBkb20gb2JqZWN0LCByZXR1cm46IGVsIGNhY2hlIHZhbHVlc1xuICAgIHZhciBjcmVhdGVCbG9jayA9IGZ1bmN0aW9uKGVsKSB7XG5cbiAgICAgIC8vIGluaXRpYWxpemluZyBhdCBzY3JvbGxZID0gMCAodG9wIG9mIGJyb3dzZXIpXG4gICAgICAvLyBlbnN1cmVzIGVsZW1lbnRzIGFyZSBwb3NpdGlvbmVkIGJhc2VkIG9uIEhUTUwgbGF5b3V0LlxuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyB0aGUgcGVyY2VudGFnZSBhdHRyaWJ1dGUsIHRoZSBwb3NZIG5lZWRzIHRvIGJlXG4gICAgICAvLyB0aGUgY3VycmVudCBzY3JvbGwgcG9zaXRpb24ncyB2YWx1ZSwgc28gdGhhdCB0aGUgZWxlbWVudHMgYXJlIHN0aWxsIHBvc2l0aW9uZWQgYmFzZWQgb24gSFRNTCBsYXlvdXRcbiAgICAgIHZhciBwb3NZID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXJlbGxheC1wZXJjZW50YWdlJykgfHwgc2VsZi5vcHRpb25zLmNlbnRlciA/IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIDogMDtcblxuICAgICAgdmFyIGJsb2NrVG9wID0gcG9zWSArIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICAgIHZhciBibG9ja0hlaWdodCA9IGVsLmNsaWVudEhlaWdodCB8fCBlbC5vZmZzZXRIZWlnaHQgfHwgZWwuc2Nyb2xsSGVpZ2h0O1xuXG4gICAgICAvLyBhcHBhcmVudGx5IHBhcmFsbGF4IGVxdWF0aW9uIGV2ZXJ5b25lIHVzZXNcbiAgICAgIHZhciBwZXJjZW50YWdlID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXJlbGxheC1wZXJjZW50YWdlJykgPyBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVsbGF4LXBlcmNlbnRhZ2UnKSA6IChwb3NZIC0gYmxvY2tUb3AgKyBzY3JlZW5ZKSAvIChibG9ja0hlaWdodCArIHNjcmVlblkpO1xuICAgICAgaWYoc2VsZi5vcHRpb25zLmNlbnRlcil7IHBlcmNlbnRhZ2UgPSAwLjU7IH1cblxuICAgICAgLy8gT3B0aW9uYWwgaW5kaXZpZHVhbCBibG9jayBzcGVlZCBhcyBkYXRhIGF0dHIsIG90aGVyd2lzZSBnbG9iYWwgc3BlZWRcbiAgICAgIC8vIENoZWNrIGlmIGhhcyBwZXJjZW50YWdlIGF0dHIsIGFuZCBsaW1pdCBzcGVlZCB0byA1LCBlbHNlIGxpbWl0IGl0IHRvIDEwXG4gICAgICB2YXIgc3BlZWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVsbGF4LXNwZWVkJykgPyBsaW1pdFNwZWVkKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWxsYXgtc3BlZWQnKSwgMTApIDogc2VsZi5vcHRpb25zLnNwZWVkO1xuICAgICAgaWYgKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWxsYXgtcGVyY2VudGFnZScpIHx8IHNlbGYub3B0aW9ucy5jZW50ZXIpIHtcbiAgICAgICAgc3BlZWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcmVsbGF4LXNwZWVkJykgPyBsaW1pdFNwZWVkKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1yZWxsYXgtc3BlZWQnKSwgNSkgOiBsaW1pdFNwZWVkKHNlbGYub3B0aW9ucy5zcGVlZCwgNSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBiYXNlID0gdXBkYXRlUG9zaXRpb24ocGVyY2VudGFnZSwgc3BlZWQpO1xuXG4gICAgICAvLyB+flN0b3JlIG5vbi10cmFuc2xhdGUzZCB0cmFuc2Zvcm1zfn5cbiAgICAgIC8vIFN0b3JlIGlubGluZSBzdHlsZXMgYW5kIGV4dHJhY3QgdHJhbnNmb3Jtc1xuICAgICAgdmFyIHN0eWxlID0gZWwuc3R5bGUuY3NzVGV4dDtcbiAgICAgIHZhciB0cmFuc2Zvcm0gPSAnJztcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUncyBhbiBpbmxpbmUgc3R5bGVkIHRyYW5zZm9ybVxuICAgICAgaWYgKHN0eWxlLmluZGV4T2YoJ3RyYW5zZm9ybScpID49IDApIHtcbiAgICAgICAgLy8gR2V0IHRoZSBpbmRleCBvZiB0aGUgdHJhbnNmb3JtXG4gICAgICAgIHZhciBpbmRleCA9IHN0eWxlLmluZGV4T2YoJ3RyYW5zZm9ybScpO1xuXG4gICAgICAgIC8vIFRyaW0gdGhlIHN0eWxlIHRvIHRoZSB0cmFuc2Zvcm0gcG9pbnQgYW5kIGdldCB0aGUgZm9sbG93aW5nIHNlbWktY29sb24gaW5kZXhcbiAgICAgICAgdmFyIHRyaW1tZWRTdHlsZSA9IHN0eWxlLnNsaWNlKGluZGV4KTtcbiAgICAgICAgdmFyIGRlbGltaXRlciA9IHRyaW1tZWRTdHlsZS5pbmRleE9mKCc7Jyk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIFwidHJhbnNmb3JtXCIgc3RyaW5nIGFuZCBzYXZlIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgaWYgKGRlbGltaXRlcikge1xuICAgICAgICAgIHRyYW5zZm9ybSA9IFwiIFwiICsgdHJpbW1lZFN0eWxlLnNsaWNlKDExLCBkZWxpbWl0ZXIpLnJlcGxhY2UoL1xccy9nLCcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cmFuc2Zvcm0gPSBcIiBcIiArIHRyaW1tZWRTdHlsZS5zbGljZSgxMSkucmVwbGFjZSgvXFxzL2csJycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGJhc2U6IGJhc2UsXG4gICAgICAgIHRvcDogYmxvY2tUb3AsXG4gICAgICAgIGhlaWdodDogYmxvY2tIZWlnaHQsXG4gICAgICAgIHNwZWVkOiBzcGVlZCxcbiAgICAgICAgc3R5bGU6IHN0eWxlLFxuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgLy8gQ2hlY2sgaWYgY3VycmVudCBzcGVlZCBpcyA8IG9yID4gdGhhbiBtYXgvLW1heFxuICAgIC8vIElmIHNvLCByZXR1cm4gbWF4XG4gICAgdmFyIGxpbWl0U3BlZWQgPSBmdW5jdGlvbihjdXJyZW50LCBtYXgpIHtcbiAgICAgIGlmIChjdXJyZW50IDwgLW1heCkge1xuICAgICAgICByZXR1cm4gLW1heDtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudCA+IG1heCkge1xuICAgICAgICByZXR1cm4gbWF4O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIHNldCBzY3JvbGwgcG9zaXRpb24gKHBvc1kpXG4gICAgLy8gc2lkZSBlZmZlY3QgbWV0aG9kIGlzIG5vdCBpZGVhbCwgYnV0IG9rYXkgZm9yIG5vd1xuICAgIC8vIHJldHVybnMgdHJ1ZSBpZiB0aGUgc2Nyb2xsIGNoYW5nZWQsIGZhbHNlIGlmIG5vdGhpbmcgaGFwcGVuZWRcbiAgICB2YXIgc2V0UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICBcdHZhciBvbGRZID0gcG9zWTtcblxuICAgICAgaWYgKHdpbmRvdy5wYWdlWU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBvc1kgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3NZID0gKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgZG9jdW1lbnQuYm9keSkuc2Nyb2xsVG9wO1xuICAgICAgfVxuXG4gICAgICBpZiAob2xkWSAhPSBwb3NZKSB7XG4gICAgICBcdC8vIHNjcm9sbCBjaGFuZ2VkLCByZXR1cm4gdHJ1ZVxuICAgICAgXHRyZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gc2Nyb2xsIGRpZCBub3QgY2hhbmdlXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuXG4gICAgLy8gQWhoIGEgcHVyZSBmdW5jdGlvbiwgZ2V0cyBuZXcgdHJhbnNmb3JtIHZhbHVlXG4gICAgLy8gYmFzZWQgb24gc2Nyb2xsUG9zdGlvbiBhbmQgc3BlZWRcbiAgICB2YXIgdXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbihwZXJjZW50YWdlLCBzcGVlZCkge1xuICAgICAgdmFyIHZhbHVlID0gKHNwZWVkICogKDEwMCAqICgxIC0gcGVyY2VudGFnZSkpKTtcbiAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlKTtcbiAgICB9O1xuXG5cbiAgICAvL1xuXHRcdHZhciB1cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChzZXRQb3NpdGlvbigpICYmIHBhdXNlID09PSBmYWxzZSkge1xuXHRcdFx0XHRhbmltYXRlKCk7XG5cdCAgICB9XG5cblx0ICAgIC8vIGxvb3AgYWdhaW5cblx0ICAgIGxvb3AodXBkYXRlKTtcblx0XHR9O1xuXG4gICAgLy8gVHJhbnNmb3JtM2Qgb24gcGFyYWxsYXggZWxlbWVudFxuICAgIHZhciBhbmltYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgXHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZWxlbXMubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgcGVyY2VudGFnZSA9ICgocG9zWSAtIGJsb2Nrc1tpXS50b3AgKyBzY3JlZW5ZKSAvIChibG9ja3NbaV0uaGVpZ2h0ICsgc2NyZWVuWSkpO1xuXG4gICAgICAgIC8vIFN1YnRyYWN0aW5nIGluaXRpYWxpemUgdmFsdWUsIHNvIGVsZW1lbnQgc3RheXMgaW4gc2FtZSBzcG90IGFzIEhUTUxcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gdXBkYXRlUG9zaXRpb24ocGVyY2VudGFnZSwgYmxvY2tzW2ldLnNwZWVkKSAtIGJsb2Nrc1tpXS5iYXNlO1xuXG4gICAgICAgIC8vIE1vdmUgdGhhdCBlbGVtZW50XG4gICAgICAgIC8vIChQcmVwYXJlIHRoZSBuZXcgdHJhbnNmb3JtIGFuZCBhcHBlbmQgaW5pdGlhbCBpbmxpbmUgdHJhbnNmb3Jtcy4gU2V0IHRoZSBuZXcsIGFuZCBwcmVwcGVuZCBwcmV2aW91cyBpbmxpbmUgc3R5bGVzKVxuICAgICAgICB2YXIgdHJhbnNsYXRlID0gJyB0cmFuc2xhdGUzZCgwLCcgKyBwb3NpdGlvbiArICdweCcgKyAnLDApJyArIGJsb2Nrc1tpXS50cmFuc2Zvcm07XG4gICAgICAgIHNlbGYuZWxlbXNbaV0uc3R5bGUuY3NzVGV4dCA9IGJsb2Nrc1tpXS5zdHlsZSsnLXdlYmtpdC10cmFuc2Zvcm06Jyt0cmFuc2xhdGUrJzstbW96LXRyYW5zZm9ybTonK3RyYW5zbGF0ZSsnO3RyYW5zZm9ybTonK3RyYW5zbGF0ZSsnOyc7XG4gICAgICB9XG4gICAgfTtcblxuXG4gICAgc2VsZi5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZWxlbXMubGVuZ3RoOyBpKyspe1xuICAgICAgICBzZWxmLmVsZW1zW2ldLnN0eWxlLmNzc1RleHQgPSBibG9ja3NbaV0uc3R5bGU7XG4gICAgICB9XG4gICAgICBwYXVzZSA9IHRydWU7XG4gICAgfTtcblxuXG4gICAgaW5pdCgpO1xuICAgIHJldHVybiBzZWxmO1xuICB9O1xuICByZXR1cm4gUmVsbGF4O1xufSkpO1xuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IFJlbGxheCBmcm9tICdyZWxsYXgnO1xuY29uc3QgUG9ydGZvbGlvID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL3BvcnRmb2xpbycpO1xuY29uc3QgUGhvdG9zd2lwZSA9IHJlcXVpcmUoJy4vcGhvdG9zd2lwZScpO1xuY29uc3QgcG9ydGZvbGlvRGF0YSA9IHJlcXVpcmUoJy4vZGF0YS9wb3J0Zm9saW8uanNvbicpO1xuY29uc3Qgc2lkZVByb2plY3REYXRhID0gcmVxdWlyZSgnLi9kYXRhL3NpZGUtcHJvamVjdHMuanNvbicpO1xuXG4vLyBJbml0IHBob3Rvc3dpcGUgZ2FsbGVyeVxuLy8gUGhvdG9zd2lwZS5pbml0KCk7XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFBvcnRmb2xpbyBpdGVtcz17cG9ydGZvbGlvRGF0YX0gLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwb3J0Zm9saW8nKVxuKTtcblxuUmVhY3RET00ucmVuZGVyKFxuICA8UG9ydGZvbGlvIGl0ZW1zPXtzaWRlUHJvamVjdERhdGF9IC8+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2lkZS1wcm9qZWN0cycpXG4pO1xuXG4vLyBNYWtlIGhlYWRlciB+KiBwYXJhbGxheCAqflxubmV3IFJlbGxheCgnLnBhcmFsbGF4Jyk7XG5cbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5jb25zdCBQaG90b3N3aXBlID0gcmVxdWlyZSgnLi4vcGhvdG9zd2lwZScpO1xuXG5jbGFzcyBQb3J0Zm9saW9Bc3NldHMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sIHBvcnRmb2xpby1pdGVtX19hc3NldHNcIj5cbiAgICAgICAge3RoaXMucHJvcHMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0sIGkpIHtcbiAgICAgICAgICByZXR1cm4gPFBvcnRmb2xpb0Fzc2V0IHR5cGU9e2l0ZW0udHlwZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYz17aXRlbS5zcmN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxfc3JjPXtpdGVtLnRodW1ibmFpbF9zcmN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aD17aXRlbS53aWR0aH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD17aXRlbS5oZWlnaHR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17aXRlbS50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aX0gLz5cbiAgICAgICAgfSl9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG5cbmNsYXNzIFBvcnRmb2xpb0Fzc2V0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG5cbiAgICBpZiAodGhpcy5wcm9wcy50eXBlID09ICdpbWFnZScpIHtcbiAgICAgIGxldCBpbmRleCA9IFBob3Rvc3dpcGUucHVzaCh7XG4gICAgICAgIHNyYzogcHJvcHMuc3JjLFxuICAgICAgICB3OiBwcm9wcy53aWR0aCxcbiAgICAgICAgaDogcHJvcHMuaGVpZ2h0LFxuICAgICAgICBtc3JjOiBwcm9wcy50aHVtYm5haWxfc3JjLFxuICAgICAgICB0aXRsZTogcHJvcHMudGl0bGVcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLnN0YXRlID0ge2luZGV4OiBpbmRleH07XG4gICAgfVxuXG4gICAgdGhpcy5vcGVuTGlnaHRib3ggPSB0aGlzLm9wZW5MaWdodGJveC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgb3BlbkxpZ2h0Ym94KGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IHtpbmRleH0gPSB0aGlzLnN0YXRlO1xuXG4gICAgY29uc29sZS5sb2coXCJvcGVuaW5nXCIsIGluZGV4KTtcbiAgICBQaG90b3N3aXBlLm9wZW4oaW5kZXgpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGlmICh0aGlzLnByb3BzLnR5cGUgPT0gJ3lvdXR1YmUnKSB7XG4gICAgICByZXR1cm4oXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9ydGZvbGlvLWl0ZW1fX2Fzc2V0XCI+XG4gICAgICAgICAgPGlmcmFtZSB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9XCIxMDAlXCIgc3JjPXt0aGlzLnByb3BzLnNyY30gZnJhbWVCb3JkZXI9XCIwXCIgYWxsb3dGdWxsU2NyZWVuPVwidHJ1ZVwiPjwvaWZyYW1lPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybihcbiAgICAgICAgPGEgaHJlZj1cIiNcIlxuICAgICAgICAgICBjbGFzc05hbWU9XCJwb3J0Zm9saW8taXRlbV9fYXNzZXRcIlxuICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9wZW5MaWdodGJveH1cbiAgICAgICAgICAgc3R5bGU9e1xuICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGJhY2tncm91bmRJbWFnZTogJ3VybCgnICsgdGhpcy5wcm9wcy50aHVtYm5haWxfc3JjICsgJyknXG4gICAgICAgICAgICAgfVxuICAgICAgICAgICB9PlxuICAgICAgICA8L2E+XG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuXG5Qb3J0Zm9saW9Bc3NldHMucHJvcFR5cGVzID0ge1xuICBpdGVtczogUmVhY3QuUHJvcFR5cGVzLmFycmF5T2YoUmVhY3QuUHJvcFR5cGVzLm9iamVjdClcbn07XG5cblxuUG9ydGZvbGlvQXNzZXQucHJvcFR5cGVzID0ge1xuICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICBzcmM6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHRodW1ibmFpbF9zcmM6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHdpZHRoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICBoZWlnaHQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvcnRmb2xpb0Fzc2V0cztcbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5jb25zdCBQb3J0Zm9saW9VcmwgPSByZXF1aXJlKCcuL3BvcnRmb2xpby11cmwnKTtcbmNvbnN0IFBvcnRmb2xpb1NraWxsID0gcmVxdWlyZSgnLi9wb3J0Zm9saW8tc2tpbGwnKTtcbmNvbnN0IFBvcnRmb2xpb0Fzc2V0cyA9IHJlcXVpcmUoJy4vcG9ydGZvbGlvLWFzc2V0cycpO1xuXG5jbGFzcyBQb3J0Zm9saW9JdGVtIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGljIGNyZWF0ZVRleHRNYXJrdXAodGV4dCkge1xuICAgIHJldHVybiB7X19odG1sOiB0ZXh0fTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4oXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInBvcnRmb2xpby1pdGVtXCI+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9ydGZvbGlvLWl0ZW1fX2Rlc2NyaXB0aW9uXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb3J0Zm9saW8taXRlbV9fdGl0bGVcIj57dGhpcy5wcm9wcy5uYW1lfSA8c3BhbiBjbGFzc05hbWU9XCJwb3J0Zm9saW8taXRlbV9fZGF0ZVwiPnt0aGlzLnByb3BzLmRhdGV9PC9zcGFuPjwvZGl2PlxuXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwicG9ydGZvbGlvLWl0ZW1fX3RleHRcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17UG9ydGZvbGlvSXRlbS5jcmVhdGVUZXh0TWFya3VwKHRoaXMucHJvcHMuZGVzY3JpcHRpb24pfSAvPlxuXG4gICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInBvcnRmb2xpby1pdGVtX190ZXh0IHBvcnRmb2xpby1pdGVtX19saW5rc1wiPlxuICAgICAgICAgICAge3RoaXMucHJvcHMudXJscy5tYXAoZnVuY3Rpb24oaXRlbSwgaSkge1xuICAgICAgICAgICAgICByZXR1cm4gPFBvcnRmb2xpb1VybCB1cmw9e2l0ZW0udXJsfSB0ZXh0PXtpdGVtLnRleHR9IGtleT17aX0gLz5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvdWw+XG5cbiAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwicG9ydGZvbGlvLWl0ZW1fX3NraWxsc1wiPlxuICAgICAgICAgICAge3RoaXMucHJvcHMuc2tpbGxzLm1hcChmdW5jdGlvbihpdGVtLCBpKSB7XG4gICAgICAgICAgICAgIHJldHVybiA8UG9ydGZvbGlvU2tpbGwgbmFtZT17aXRlbX0ga2V5PXtpfSAvPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPFBvcnRmb2xpb0Fzc2V0cyBpdGVtcz17dGhpcy5wcm9wcy5hc3NldHN9IC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG5cblBvcnRmb2xpb0l0ZW0ucHJvcFR5cGVzID0ge1xuICBuYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICBkYXRlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICBkZXNjcmlwdGlvbjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgdXJsczogUmVhY3QuUHJvcFR5cGVzLmFycmF5T2YoUmVhY3QuUHJvcFR5cGVzLm9iamVjdE9mKFJlYWN0LlByb3BUeXBlcy5zdHJpbmcpKSxcbiAgc2tpbGxzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXlPZihSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nKSxcbiAgYXNzZXRzOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXlPZihSZWFjdC5Qcm9wVHlwZXMub2JqZWN0KVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb3J0Zm9saW9JdGVtOyIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmNsYXNzIFBvcnRmb2xpb1NraWxsIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyKCkge1xuICAgIHJldHVybihcbiAgICAgIDxsaSBjbGFzc05hbWU9XCJwb3J0Zm9saW8taXRlbV9fc2tpbGxcIj5cbiAgICAgICAge3RoaXMucHJvcHMubmFtZX1cbiAgICAgIDwvbGk+XG4gICAgKTtcbiAgfVxufVxuXG5Qb3J0Zm9saW9Ta2lsbC5wcm9wVHlwZXMgPSB7XG4gIG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUG9ydGZvbGlvU2tpbGw7XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuXG5jbGFzcyBQb3J0Zm9saW9VcmwgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuKFxuICAgICAgPGxpPlxuICAgICAgICA8YSBocmVmPXt0aGlzLnByb3BzLnVybH0gcmVsPVwibm9mb2xsb3dcIiBjbGFzc05hbWU9XCJwb3J0Zm9saW8taXRlbV9fbGlua1wiPnt0aGlzLnByb3BzLnRleHR9PC9hPlxuICAgICAgPC9saT5cbiAgICApO1xuICB9XG59XG5cblBvcnRmb2xpb1VybC5wcm9wVHlwZXMgPSB7XG4gIHVybDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgdGV4dDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUG9ydGZvbGlvVXJsOyIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5jb25zdCBQb3J0Zm9saW9JdGVtID0gcmVxdWlyZSgnLi9wb3J0Zm9saW8taXRlbScpO1xuXG5jbGFzcyBQb3J0Zm9saW8gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuKFxuICAgICAgPGRpdj5cbiAgICAgICAge3RoaXMucHJvcHMuaXRlbXMubWFwKGZ1bmN0aW9uKGl0ZW0sIGkpIHtcbiAgICAgICAgICByZXR1cm4gPFBvcnRmb2xpb0l0ZW0gbmFtZT17aXRlbVsnbmFtZSddfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlPXtpdGVtWydkYXRlJ119XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uPXtpdGVtWydkZXNjcmlwdGlvbiddfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmxzPXtpdGVtWyd1cmxzJ119XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNraWxscz17aXRlbVsnc2tpbGxzJ119XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0cz17aXRlbVsnYXNzZXRzJ119XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aX0gLz5cbiAgICAgICAgfSl9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG5cblBvcnRmb2xpby5wcm9wVHlwZXMgPSB7XG4gIGl0ZW1zOiBSZWFjdC5Qcm9wVHlwZXMuYXJyYXlPZihSZWFjdC5Qcm9wVHlwZXMub2JqZWN0KSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUG9ydGZvbGlvO1xuIiwibW9kdWxlLmV4cG9ydHM9W1xuICB7XG4gICAgXCJuYW1lXCI6IFwiU3luZGljYXRpb24gU2VydmljZVwiLFxuICAgIFwiZGF0ZVwiOiBcIigyMDE2KVwiLFxuICAgIFwiZGVzY3JpcHRpb25cIjogXCJDcmVhdGVkIGEgbWljcm9zZXJ2aWNlIHRoYXQgc3luZGljYXRlcyBDTkVUIGFydGljbGVzIHRvIDNyZCBwYXJ0aWVzLCBzdWNoIGFzIEFwcGxlIE5ld3MuXCIsXG4gICAgXCJ1cmxzXCI6IFtcbiAgICBdLFxuICAgIFwic2tpbGxzXCI6IFtcbiAgICAgIFwiRG9ja2VyXCIsXG4gICAgICBcIlBIUFwiLFxuICAgICAgXCJKZW5raW5zXCIsXG4gICAgICBcIk1pY3Jvc2VydmljZVwiXG4gICAgXSxcbiAgICBcImFzc2V0c1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvc3luZGljYXRpb24taXBhZC5zbWFsbC5wbmdcIixcbiAgICAgICAgXCJzcmNcIjogXCJzdGF0aWMvaW1hZ2VzL3NpdGVzL3N5bmRpY2F0aW9uLWlwYWQubGFyZ2UucG5nXCIsXG4gICAgICAgIFwid2lkdGhcIjogMTAyNCxcbiAgICAgICAgXCJoZWlnaHRcIjogNzY4LFxuICAgICAgICBcInRpdGxlXCI6IFwiU3luZGljYXRpb24gU2VydmljZSAoMjAxNikgLSBBcHBsZSBOZXdzXCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvc3luZGljYXRpb24tYW1wLnNtYWxsLnBuZ1wiLFxuICAgICAgICBcInNyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvc3luZGljYXRpb24tYW1wLmxhcmdlLnBuZ1wiLFxuICAgICAgICBcIndpZHRoXCI6IDQxMixcbiAgICAgICAgXCJoZWlnaHRcIjogNzMyLFxuICAgICAgICBcInRpdGxlXCI6IFwiU3luZGljYXRpb24gU2VydmljZSAoMjAxNikgLSBHb29nbGUgQU1QXCJcbiAgICAgIH1cbiAgICBdXG4gIH0sXG4gIHtcbiAgICBcIm5hbWVcIjogXCJHdXp6bGVmaXNoXCIsXG4gICAgXCJkYXRlXCI6IFwiKDIwMTUtMjAxNilcIixcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwiR3V6emxlZmlzaCB3YXMgYSBxdWlya3kgbmV3cyBzaXRlIHRoYXQgSSBkZXZlbG9wZWQgYW5kIGxhdW5jaGVkIGF0IENCUyBJbnRlcmFjdGl2ZS5cIixcbiAgICBcInVybHNcIjogW1xuICAgICAge1xuICAgICAgICBcInVybFwiOiBcImh0dHA6Ly93d3cuZ3V6emxlZmlzaC5jb20vXCIsXG4gICAgICAgIFwidGV4dFwiOiBcIlZpc2l0IEd1enpsZWZpc2hcIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJ1cmxcIjogXCJodHRwOi8vZmFjZWJvb2suY29tL2d1enpsZWZpc2hcIixcbiAgICAgICAgXCJ0ZXh0XCI6IFwiVmlzaXQgR3V6emxlZmlzaCBvbiBGYWNlYm9va1wiXG4gICAgICB9XG4gICAgXSxcbiAgICBcInNraWxsc1wiOiBbXG4gICAgICBcIlBIUFwiLFxuICAgICAgXCJNeVNRTFwiLFxuICAgICAgXCJIVE1MNVwiLFxuICAgICAgXCJKYXZhU2NyaXB0XCIsXG4gICAgICBcIlNhc3NcIixcbiAgICAgIFwiU29sclwiLFxuICAgICAgXCJqUXVlcnlcIixcbiAgICAgIFwiTWVtY2FjaGVkXCIsXG4gICAgICBcIlZhcm5pc2hcIixcbiAgICAgIFwiUmVzcG9uc2l2ZVwiXG4gICAgXSxcbiAgICBcImFzc2V0c1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvZ3V6emxlZmlzaC5kZXNrdG9wLnNtYWxsLnBuZ1wiLFxuICAgICAgICBcInNyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvZ3V6emxlZmlzaC5kZXNrdG9wLmxhcmdlLmpwZ1wiLFxuICAgICAgICBcIndpZHRoXCI6IDEyODAsXG4gICAgICAgIFwiaGVpZ2h0XCI6IDc5OCxcbiAgICAgICAgXCJ0aXRsZVwiOiBcIkd1enpsZWZpc2ggKDIwMTUtMjAxNikgLSBEZXNrdG9wXCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvZ3V6emxlZmlzaC5tb2JpbGUuc21hbGwucG5nXCIsXG4gICAgICAgIFwic3JjXCI6IFwic3RhdGljL2ltYWdlcy9zaXRlcy9ndXp6bGVmaXNoLm1vYmlsZS5sYXJnZS5wbmdcIixcbiAgICAgICAgXCJ3aWR0aFwiOiA2MDAsXG4gICAgICAgIFwiaGVpZ2h0XCI6IDc5OCxcbiAgICAgICAgXCJ0aXRsZVwiOiBcIkd1enpsZWZpc2ggKDIwMTUtMjAxNikgLSBNb2JpbGUgV2ViXCJcbiAgICAgIH1cbiAgICBdXG4gIH0sXG4gIHtcbiAgICBcIm5hbWVcIjogXCJDTkVUIEZvcnVtc1wiLFxuICAgIFwiZGF0ZVwiOiBcIigyMDE0KVwiLFxuICAgIFwiZGVzY3JpcHRpb25cIjogXCJNaWdyYXRlZCB0aGUgQ05FVCBGb3J1bXMgb250byBhIG5ldyBDTVMuXCIsXG4gICAgXCJ1cmxzXCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJ1cmxcIjogXCJodHRwOi8vd3d3LmNuZXQuY29tL2ZvcnVtcy9cIixcbiAgICAgICAgXCJ0ZXh0XCI6IFwiVmlzaXQgQ05FVCBGb3J1bXNcIlxuICAgICAgfVxuICAgIF0sXG4gICAgXCJza2lsbHNcIjogW1xuICAgICAgXCJQSFBcIixcbiAgICAgIFwiTXlTUUxcIixcbiAgICAgIFwiU29sclwiLFxuICAgICAgXCJKYXZhU2NyaXB0XCJcbiAgICBdLFxuICAgIFwiYXNzZXRzXCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwiaW1hZ2VcIixcbiAgICAgICAgXCJ0aHVtYm5haWxfc3JjXCI6IFwic3RhdGljL2ltYWdlcy9zaXRlcy9jbmV0LWZvcnVtcy5kZXNrdG9wLnNtYWxsLnBuZ1wiLFxuICAgICAgICBcInNyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvY25ldC1mb3J1bXMuZGVza3RvcC5wbmdcIixcbiAgICAgICAgXCJ3aWR0aFwiOiAxMDI0LFxuICAgICAgICBcImhlaWdodFwiOiA4MTgsXG4gICAgICAgIFwidGl0bGVcIjogXCJDTkVUIEZvcnVtcyAoMjAxNCkgLSBEZXNrdG9wXCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvY25ldC1mb3J1bXMubW9iaWxlLnNtYWxsLnBuZ1wiLFxuICAgICAgICBcInNyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvY25ldC1mb3J1bXMubW9iaWxlLnBuZ1wiLFxuICAgICAgICBcIndpZHRoXCI6IDQxMixcbiAgICAgICAgXCJoZWlnaHRcIjogNzMyLFxuICAgICAgICBcInRpdGxlXCI6IFwiQ05FVCBGb3J1bXMgKDIwMTQpIC0gTW9iaWxlIFdlYlwiXG4gICAgICB9XG4gICAgXVxuICB9LFxuICB7XG4gICAgXCJuYW1lXCI6IFwiQ0JTIENvbm5lY3RcIixcbiAgICBcImRhdGVcIjogXCIoMjAxMilcIixcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwiQnVpbHQgdGhlIFJFU1RmdWwgQVBJIGZvciBDQlMgQ29ubmVjdCwgYSBzb2NpYWwgd2ViYXBwIHRoYXQgY29ubmVjdHMgcHJpbWUgdGltZSBUViBmYW5zIHRvIENCUyBzaG93cyBhbmQgc3RhcnMuXCIsXG4gICAgXCJ1cmxzXCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJ1cmxcIjogXCJodHRwOi8vd3d3LmNicy5jb20vY29ubmVjdC9cIixcbiAgICAgICAgXCJ0ZXh0XCI6IFwiVmlzaXQgQ0JTIENvbm5lY3RcIlxuICAgICAgfVxuICAgIF0sXG4gICAgXCJza2lsbHNcIjogW1xuICAgICAgXCJKYXZhXCIsXG4gICAgICBcIlNwcmluZ1wiLFxuICAgICAgXCJIaWJlcm5hdGVcIixcbiAgICAgIFwiTXlTUUxcIixcbiAgICAgIFwiU29sclwiLFxuICAgICAgXCJSZWRpc1wiLFxuICAgICAgXCJBUElcIlxuICAgIF0sXG4gICAgXCJhc3NldHNcIjogW1xuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJpbWFnZVwiLFxuICAgICAgICBcInRodW1ibmFpbF9zcmNcIjogXCJzdGF0aWMvaW1hZ2VzL3NpdGVzL2Nicy5kZXNrdG9wLnNtYWxsLnBuZ1wiLFxuICAgICAgICBcInNyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvY2JzLmRlc2t0b3AubGFyZ2UuanBnXCIsXG4gICAgICAgIFwid2lkdGhcIjogMTAyOCxcbiAgICAgICAgXCJoZWlnaHRcIjogNjc1LFxuICAgICAgICBcInRpdGxlXCI6IFwiQ0JTIENvbm5lY3QgKDIwMTIpXCJcbiAgICAgIH1cbiAgICBdXG4gIH0sXG4gIHtcbiAgICBcIm5hbWVcIjogXCJUVi5jb20gTW9iaWxlIFdlYlwiLFxuICAgIFwiZGF0ZVwiOiBcIigyMDEyKVwiLFxuICAgIFwiZGVzY3JpcHRpb25cIjogXCJCdWlsdCB0aGUgZnJvbnRlbmQgZm9yIFRWLmNvbSdzIGZpcnN0IG1vYmlsZSB3ZWIgZXhwZXJpZW5jZS5cIixcbiAgICBcInVybHNcIjogW1xuICAgICAge1xuICAgICAgICBcInVybFwiOiBcImh0dHA6Ly93d3cudHYuY29tL1wiLFxuICAgICAgICBcInRleHRcIjogXCJWaXNpdCBUVi5jb21cIlxuICAgICAgfVxuICAgIF0sXG4gICAgXCJza2lsbHNcIjogW1xuICAgICAgXCJQeXRob25cIixcbiAgICAgIFwiRGphbmdvXCIsXG4gICAgICBcImpRdWVyeVwiLFxuICAgICAgXCJIVE1MNVwiLFxuICAgICAgXCJKYXZhU2NyaXB0XCIsXG4gICAgICBcIkNTUzNcIixcbiAgICAgIFwiTW9iaWxlIFdlYlwiXG4gICAgXSxcbiAgICBcImFzc2V0c1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvdHYuZGVza3RvcC5zbWFsbC5qcGdcIixcbiAgICAgICAgXCJzcmNcIjogXCJzdGF0aWMvaW1hZ2VzL3NpdGVzL3R2LW1vYmlsZS1sYXJnZS5qcGdcIixcbiAgICAgICAgXCJ3aWR0aFwiOiA2NDAsXG4gICAgICAgIFwiaGVpZ2h0XCI6IDkxOSxcbiAgICAgICAgXCJ0aXRsZVwiOiBcIlRWLmNvbSAoMjAxMikgLSBNb2JpbGUgV2ViXCJcbiAgICAgIH1cbiAgICBdXG4gIH1cbl0iLCJtb2R1bGUuZXhwb3J0cz1bXG4gIHtcbiAgICBcIm5hbWVcIjogXCJPbW5pYm90OiBBbmFseXRpY3MgU2xhY2tib3RcIixcbiAgICBcImRhdGVcIjogXCIoMjAxNilcIixcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwiQ3JlYXRlZCBhIFNsYWNrYm90IHRoYXQgZmV0Y2hlcyByZWFsLXRpbWUsIG9uLWRlbWFuZCBtZXRyaWNzIGZyb20gb3VyIGFuYWx5dGljcyBiYWNrZW5kLjxiciAvPjxiciAvPkNyZWF0ZWQgZm9yIGEgMjQtaG91ciBoYWNrYXRob24uXCIsXG4gICAgXCJ1cmxzXCI6IFtcbiAgICBdLFxuICAgIFwic2tpbGxzXCI6IFtcbiAgICAgIFwiTm9kZVwiLFxuICAgICAgXCJBV1MgTGFtYmRhXCIsXG4gICAgICBcIlNsYWNrXCJcbiAgICBdLFxuICAgIFwiYXNzZXRzXCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwiaW1hZ2VcIixcbiAgICAgICAgXCJ0aHVtYm5haWxfc3JjXCI6IFwic3RhdGljL2ltYWdlcy9zaXRlcy9zbGFja2JvdC5zbWFsbC5wbmdcIixcbiAgICAgICAgXCJzcmNcIjogXCJzdGF0aWMvaW1hZ2VzL3NpdGVzL3NsYWNrYm90LmxhcmdlLnBuZ1wiLFxuICAgICAgICBcIndpZHRoXCI6IDY3MSxcbiAgICAgICAgXCJoZWlnaHRcIjogMzM4LFxuICAgICAgICBcInRpdGxlXCI6IFwiT21uaWJvdCAoMjAxNik6IEEgU2xhY2tib3QgdGhhdCBmZXRjaGVzIHJlYWwtdGltZSwgb24tZGVtYW5kIG1ldHJpY3MgZnJvbSBvdXIgYW5hbHl0aWNzIGJhY2tlbmQuXCJcbiAgICAgIH1cbiAgICBdXG4gIH0sXG4gIHtcbiAgICBcIm5hbWVcIjogXCJTcHJlYWQgLSBHb29nbGUgQ2hyb21lIEV4dGVuc2lvblwiLFxuICAgIFwiZGF0ZVwiOiBcIigyMDE1KVwiLFxuICAgIFwiZGVzY3JpcHRpb25cIjogXCJCdWlsdCBhIEdvb2dsZSBDaHJvbWUgZXh0ZW5zaW9uIGZvciB0aGF0IHJlcGxhY2VzIHRoZSB1c2VyJ3MgU3RhcnQgUGFnZSB3aXRoIHRyZW5kaW5nIG5ld3MgYW5kIGZ1bGwgc2NyZWVuIGltYWdlcyBmcm9tIENCUyBJbnRlcmFjdGl2ZSBzaXRlcywgc3VjaCBhcyBDQlMgTmV3cyBhbmQgQ05FVC48YnIgLz48YnIgLz5DcmVhdGVkIGZvciBhIDI0LWhvdXIgaGFja2F0aG9uLlwiLFxuICAgIFwidXJsc1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2p1c3RpbmRlbGFjcnV6L3NwcmVhZFwiLFxuICAgICAgICBcInRleHRcIjogXCJWaXNpdCBHaXRodWJcIlxuICAgICAgfVxuICAgIF0sXG4gICAgXCJza2lsbHNcIjogW1xuICAgICAgXCJSZWFjdFwiLFxuICAgICAgXCJTYXNzXCIsXG4gICAgICBcIkdvb2dsZSBDaHJvbWUgRXh0ZW5zaW9uc1wiXG4gICAgXSxcbiAgICBcImFzc2V0c1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvc3ByZWFkLmRlc2t0b3Auc21hbGwucG5nXCIsXG4gICAgICAgIFwic3JjXCI6IFwic3RhdGljL2ltYWdlcy9zaXRlcy9zcHJlYWQuZGVza3RvcC5sYXJnZS5wbmdcIixcbiAgICAgICAgXCJ3aWR0aFwiOiAxMDI0LFxuICAgICAgICBcImhlaWdodFwiOiA2NDAsXG4gICAgICAgIFwidGl0bGVcIjogXCJTcHJlYWQgKDIwMTUpOiBBIEdvb2dsZSBDaHJvbWUgZXh0ZW5zaW9uIGZvciB0aGF0IHJlcGxhY2VzIHRoZSB1c2VyJ3MgU3RhcnQgUGFnZSB3aXRoIHRyZW5kaW5nIG5ld3MgYW5kIGZ1bGwgc2NyZWVuIGltYWdlcy5cIlxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwieW91dHViZVwiLFxuICAgICAgICBcInNyY1wiOiBcImh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL3NtYVVubHhHUllBXCIsXG4gICAgICAgIFwid2lkdGhcIjogMTg1LFxuICAgICAgICBcImhlaWdodFwiOiAyNjZcbiAgICAgIH1cbiAgICBdXG4gIH0sXG4gIHtcbiAgICBcIm5hbWVcIjogXCJQb2RjYXBzOiBTZWFyY2hhYmxlIFBvZGNhc3RzXCIsXG4gICAgXCJkYXRlXCI6IFwiKDIwMTUpXCIsXG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIkNyZWF0ZWQgYSBzZWFyY2hhYmxlIHRyYW5zY3JpcHQgZGF0YWJhc2UgZm9yIHRoZSAnV2VsY29tZSB0byBOaWdodHZhbGUnIHBvZGNhc3QuIFRleHQgaXMgcHJvZ3JhbWF0aWNhbGx5IHRpbWVkIHRvIHN0cmVhbWluZyBhdWRpbywgc28geW91IGNhbiByZWFkIGFsb25nIGFuZCBzZWFyY2ggYWNyb3NzIGVudGlyZSBwb2RjYXN0IGVwaXNvZGVzLlwiLFxuICAgIFwidXJsc1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwidXJsXCI6IFwiaHR0cDovL3d3dy5wb2RjYXBzLmlvL1wiLFxuICAgICAgICBcInRleHRcIjogXCJWaXNpdCBQb2RjYXBzLmlvXCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2p1c3RpbmRlbGFjcnV6L3BvZGNhcHNcIixcbiAgICAgICAgXCJ0ZXh0XCI6IFwiVmlzaXQgR2l0aHViXCJcbiAgICAgIH1cbiAgICBdLFxuICAgIFwic2tpbGxzXCI6IFtcbiAgICAgIFwiUHl0aG9uXCIsXG4gICAgICBcIkZsYXNrXCIsXG4gICAgICBcIkFuZ3VsYXJcIixcbiAgICAgIFwiTXlTUUxcIixcbiAgICAgIFwiRWxhc3RpY3NlYXJjaFwiLFxuICAgICAgXCJIZXJva3VcIlxuICAgIF0sXG4gICAgXCJhc3NldHNcIjogW1xuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJpbWFnZVwiLFxuICAgICAgICBcInRodW1ibmFpbF9zcmNcIjogXCJzdGF0aWMvaW1hZ2VzL3NpdGVzL3BvZGNhcHMuZGVza3RvcC5zbWFsbC5wbmdcIixcbiAgICAgICAgXCJzcmNcIjogXCJzdGF0aWMvaW1hZ2VzL3NpdGVzL3BvZGNhcHMuZGVza3RvcC5sYXJnZS5wbmdcIixcbiAgICAgICAgXCJ3aWR0aFwiOiAxMzcyLFxuICAgICAgICBcImhlaWdodFwiOiA5MTAsXG4gICAgICAgIFwidGl0bGVcIjogXCJQb2RjYXBzICgyMDE1KTogQSBzZWFyY2hhYmxlIHRyYW5zY3JpcHQgZGF0YWJhc2UgZm9yIHRoZSAnV2VsY29tZSB0byBOaWdodHZhbGUnIHBvZGNhc3QuIFRleHQgaXMgcHJvZ3JhbWF0aWNhbGx5IHRpbWVkIHRvIHN0cmVhbWluZyBhdWRpbywgc28geW91IGNhbiByZWFkIGFsb25nIGFuZCBzZWFyY2ggYWNyb3NzIGVudGlyZSBwb2RjYXN0IGVwaXNvZGVzLlwiXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJpbWFnZVwiLFxuICAgICAgICBcInRodW1ibmFpbF9zcmNcIjogXCJzdGF0aWMvaW1hZ2VzL3NpdGVzL3BvZGNhcHMubW9iaWxlLnNtYWxsLnBuZ1wiLFxuICAgICAgICBcInNyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvcG9kY2Fwcy5tb2JpbGUubGFyZ2UucG5nXCIsXG4gICAgICAgIFwid2lkdGhcIjogMjU1LFxuICAgICAgICBcImhlaWdodFwiOiA0NTMsXG4gICAgICAgIFwidGl0bGVcIjogXCJQb2RjYXBzICgyMDE1KTogQSBzZWFyY2hhYmxlIHRyYW5zY3JpcHQgZGF0YWJhc2UgZm9yIHRoZSAnV2VsY29tZSB0byBOaWdodHZhbGUnIHBvZGNhc3QuIFRleHQgaXMgcHJvZ3JhbWF0aWNhbGx5IHRpbWVkIHRvIHN0cmVhbWluZyBhdWRpbywgc28geW91IGNhbiByZWFkIGFsb25nIGFuZCBzZWFyY2ggYWNyb3NzIGVudGlyZSBwb2RjYXN0IGVwaXNvZGVzLlwiXG4gICAgICB9XG4gICAgXVxuICB9LFxuICB7XG4gICAgXCJuYW1lXCI6IFwibi1kZWdyZWVzXCIsXG4gICAgXCJkYXRlXCI6IFwiKDIwMTQpXCIsXG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIkJ1aWx0IGEgdG9vbCB0byBjYWxjdWxhdGUgZGlzdGFuY2UgKGRlZ3JlZXMgb2Ygc2VwYXJhdGlvbikgYmV0d2VlbiB0d28gbmV3cyBhcnRpY2xlcyBiYXNlZCBvbiB0aGVpciBlbWJlZGRlZCBsaW5rcywgdXNpbmcgRGlqa3N0cmEncyBhbGdvcml0aG0uPGJyIC8+PGJyIC8+Q3JlYXRlZCBmb3IgYSAyNC1ob3VyIGhhY2thdGhvbi5cIixcbiAgICBcInVybHNcIjogW1xuICAgIF0sXG4gICAgXCJza2lsbHNcIjogW1xuICAgICAgXCJQeXRob25cIixcbiAgICAgIFwiTXlTUUxcIixcbiAgICAgIFwiU29sclwiXG4gICAgXSxcbiAgICBcImFzc2V0c1wiOiBbXG4gICAgICB7XG4gICAgICAgIFwidHlwZVwiOiBcImltYWdlXCIsXG4gICAgICAgIFwidGh1bWJuYWlsX3NyY1wiOiBcInN0YXRpYy9pbWFnZXMvc2l0ZXMvZGVncmVlcy53ZWIuc21hbGwucG5nXCIsXG4gICAgICAgIFwic3JjXCI6IFwic3RhdGljL2ltYWdlcy9zaXRlcy9kZWdyZWVzLndlYi5sYXJnZS5wbmdcIixcbiAgICAgICAgXCJ3aWR0aFwiOiAxMDI0LFxuICAgICAgICBcImhlaWdodFwiOiA5NDYsXG4gICAgICAgIFwidGl0bGVcIjogXCJuLWRlZ3JlZXMgKDIwMTQpOiBBIHRvb2wgdG8gY2FsY3VsYXRlIGRpc3RhbmNlIChkZWdyZWVzIG9mIHNlcGFyYXRpb24pIGJldHdlZW4gdHdvIG5ld3MgYXJ0aWNsZXMgYmFzZWQgb24gdGhlaXIgZW1iZWRkZWQgbGlua3MsIHVzaW5nIERpamtzdHJhJ3MgYWxnb3JpdGhtLlwiXG4gICAgICB9XG4gICAgXVxuICB9XG5dIiwiY29uc3QgUGhvdG9Td2lwZSA9IHJlcXVpcmUoJy4uLy4uL2Jvd2VyX2NvbXBvbmVudHMvcGhvdG9zd2lwZS9kaXN0L3Bob3Rvc3dpcGUnKTtcbmNvbnN0IFBob3RvU3dpcGVVSV9EZWZhdWx0ID0gcmVxdWlyZSgnLi4vLi4vYm93ZXJfY29tcG9uZW50cy9waG90b3N3aXBlL2Rpc3QvcGhvdG9zd2lwZS11aS1kZWZhdWx0Jyk7XG5cbmxldCBHYWxsZXJ5ID0gKGZ1bmN0aW9uICgpIHtcbiAgLy8gZGVmaW5lIG9wdGlvbnMgKGlmIG5lZWRlZClcbiAgbGV0IG9wdGlvbnMgPSB7XG4gICAgLy8gb3B0aW9uTmFtZTogJ29wdGlvbiB2YWx1ZSdcbiAgICAvLyBmb3IgZXhhbXBsZTpcbiAgICBpbmRleDogMCAvLyBzdGFydCBhdCBmaXJzdCBzbGlkZVxuICB9O1xuXG4gIC8vIGJ1aWxkIGl0ZW1zIGFycmF5XG4gIGxldCBpdGVtcyA9IFtdO1xuXG4gIGxldCBnYWxsZXJ5O1xuXG4gIHJldHVybiB7XG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIC8vIFBob3Rvc3dpcGUgbGlnaHRib3hcbiAgICAgIGxldCBwc3dwRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wc3dwJylbMF07XG5cbiAgICAgIGNvbnNvbGUubG9nKGl0ZW1zKTtcblxuICAgICAgLy8gSW5pdGlhbGl6ZXMgYW5kIG9wZW5zIFBob3RvU3dpcGVcbiAgICAgIGdhbGxlcnkgPSBuZXcgUGhvdG9Td2lwZShwc3dwRWxlbWVudCwgUGhvdG9Td2lwZVVJX0RlZmF1bHQsIGl0ZW1zLCBvcHRpb25zKTtcblxuICAgICAgZ2FsbGVyeS5saXN0ZW4oJ2Rlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJkZXN0cm95XCIpO1xuICAgICAgICBnYWxsZXJ5ID0gbnVsbDtcbiAgICAgIH0pXG4gICAgfSxcblxuICAgIG9wZW46IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgb3B0aW9ucy5pbmRleCA9IGluZGV4O1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2FsbGVyeSkge1xuICAgICAgICBnYWxsZXJ5LmluaXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICBnYWxsZXJ5LmluaXQoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIG5ldyBzbGlkZSB0byBQaG90b1N3aXBlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGFcbiAgICAgKi9cbiAgICBwdXNoOiBmdW5jdGlvbiBwdXNoKGRhdGEpIHtcbiAgICAgIGl0ZW1zLnB1c2goZGF0YSk7XG5cbiAgICAgIHJldHVybiBpdGVtcy5sZW5ndGggLSAxO1xuICAgIH1cbiAgfTtcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gR2FsbGVyeTsiXX0=
