"use strict";
var image_viewer = "\n<div class=\"rslidy-image-viewer rslidy-ui\">\n  <div class=\"rslidy-image-viewer-container\">\n    <img draggable=\"false\" class=\"rslidy-image-viewer-content\">\n  </div>\n\n  <span class=\"rslidy-iv-button rslidy-iv-zoom-reset\" title=\"Reset Zoom (R)\">&#x25A2;</span>\n  <span class=\"rslidy-iv-button rslidy-iv-zoom-in\" title=\"Zoom In (+)\">&plus;</span>\n  <span class=\"rslidy-iv-button rslidy-iv-zoom-out\" title=\"Zoom Out (-)\">&minus;</span>\n  <span class=\"rslidy-iv-button rslidy-iv-close\" title=\"Close (Esc)\">&times;</span>\n</div>";
var ImageViewerComponent = /** @class */ (function () {
    function ImageViewerComponent() {
        this.zoomFactor = 1.0;
        this.mouseDragStartX = 0;
        this.mouseDragStartY = 0;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.active = false;
        this.setImageViewerTags();
        this.view = this.prependHtmlString(document.body, image_viewer);
        this.images = document.getElementsByClassName("rslidy-slide-image");
        this.container = this.view.getElementsByClassName("rslidy-image-viewer-container")[0];
        this.modalImg = this.view.getElementsByClassName("rslidy-image-viewer-content")[0];
        this.addImageOnClickHandlers();
        this.addButtonHandlers();
        this.addMouseEventListeners();
        this.observeDomChanges();
    }
    ImageViewerComponent.prototype.htmlParse = function (htmlstr) {
        var template = document.createElement("div");
        template.innerHTML = htmlstr;
        return template.firstElementChild;
    };
    ImageViewerComponent.prototype.prependHtmlString = function (parent, html) {
        var view = this.htmlParse(html);
        parent.insertBefore(view, parent.firstChild);
        return view;
    };
    ImageViewerComponent.prototype.addElementsClass = function (element_list, class_name) {
        for (var i = 0; i < element_list.length; i++) {
            if (element_list[i].classList.length == 0 ||
                element_list[i].classList.contains(class_name) == false) {
                element_list[i].classList.add(class_name);
            }
        }
    };
    ImageViewerComponent.prototype.close = function () {
        this.modalImg.classList.add("rslidy-transition-enabled");
        this.modalImg.style.width = "";
        this.modalImg.style.height = "";
        this.modalImg.style.top = "";
        this.modalImg.style.left = "";
        this.view.style.display = "none";
        this.zoomFactor = 1.0;
        this.active = false;
        history.pushState(null, null, ' ')
    };
    ImageViewerComponent.prototype.setImageViewerTags = function () {
        var imgs = document.getElementsByTagName('img');
        this.addElementsClass(imgs, "rslidy-slide-image");
    };
    ImageViewerComponent.prototype.addImageOnClickHandlers = function () {
        var _this = this;
        var _loop_1 = function () {
            var image = this_1.images.item(i);
            if (image.dataset.rslidyBound === "true") {
                return "continue";
            }
            image.dataset.rslidyBound = "true";
            image.ontouchend = function () {
                _this.touch = true;
            };
            image.onclick = function () {
                if (_this.touch) {
                    _this.touch = false;
                    return;
                }
                //setup browser back button to close image viewer
                history.pushState(null, null, window.location.href + '#iv');
                _this.view.style.display = "block";
                _this.modalImg.src = image.src;
                var theImage = new Image();
                theImage.src = image.src;
                _this.imageWidth = theImage.width;
                _this.imageHeight = theImage.height;
                // fix for firefox, which cannot
                if (_this.imageWidth == 0) {
                    _this.imageWidth = _this.modalImg.width;
                }
                if (_this.imageHeight == 0) {
                    _this.imageHeight = _this.modalImg.height;
                }
                _this.containerWidth = _this.container.clientWidth;
                _this.containerHeight = _this.container.clientHeight;
                _this.initialZoom();
                _this.isInsideContainer = true;
                _this.active = true;
            };
            // prevent links around images, they can still be used with
            // right click -> open link in ...
            if (image.parentNode.nodeName.toLowerCase() === 'a') {
                image.parentElement.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                };
            }
        };
        var this_1 = this;
        for (var i = 0; i < this.images.length; i++) {
            var state_1 = _loop_1();
            if (state_1 === "continue")
                continue;
        }
    };
    ImageViewerComponent.prototype.observeDomChanges = function () {
        var _this = this;
        this.observer = new MutationObserver(function () {
            _this.setImageViewerTags();
            _this.images = document.getElementsByClassName("rslidy-slide-image");
            _this.addImageOnClickHandlers();
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };
    ImageViewerComponent.prototype.addButtonHandlers = function () {
        var _this = this;
        var spanClose = this.view.getElementsByClassName("rslidy-iv-close")[0];
        spanClose.addEventListener("click", function () {
            _this.close();
        });
        var spanZoomIn = this.view.getElementsByClassName("rslidy-iv-zoom-in")[0];
        spanZoomIn.addEventListener("click", function () {
            _this.zoomIn();
        });
        var spanZoomOut = this.view.getElementsByClassName("rslidy-iv-zoom-out")[0];
        spanZoomOut.addEventListener("click", function () {
            _this.zoomOut();
        });
        var spanZoomReset = document.getElementsByClassName("rslidy-iv-zoom-reset")[0];
        spanZoomReset.addEventListener("click", function () {
            _this.initialZoom();
        });
        window.onkeydown = function (e) {
          var key = e.keyCode ? e.keyCode : e.which;
          if(key == 27) //esc
            _this.close();
        };
        window.onhashchange = function() {
          _this.close();
        }
    };
    ImageViewerComponent.prototype.addMouseEventListeners = function () {
        var _this = this;
        var mouseDown = false;
        this.container.addEventListener("mouseenter", function (mouseDownEvent) {
            _this.isInsideContainer = true;
        });
        this.container.addEventListener("mouseleave", function (mouseDownEvent) {
            _this.isInsideContainer = false;
        });
        window.addEventListener("resize", function () {
            if (_this.active) {
                _this.containerWidth = _this.container.clientWidth;
                _this.containerHeight = _this.container.clientHeight;
                _this.applyOffset(true);
            }
        });
        this.view.addEventListener("wheel", function (mouseWheelEvent) {
            mouseWheelEvent.preventDefault();
            var delta = Math.max(-1, Math.min(1, mouseWheelEvent.wheelDelta || -mouseWheelEvent.deltaY));
            if (delta > 0) {
                _this.zoomIn();
                var factor = 1 - _this.zoomFactor * 1.2 / _this.zoomFactor;
                _this.imageOffsetX +=
                    (mouseWheelEvent.clientX - window.innerWidth / 2) * factor;
                _this.imageOffsetY +=
                    (mouseWheelEvent.clientY - window.innerHeight / 2) * factor;
                _this.applyOffset(false);
            }
            else if (delta != 0) {
                _this.zoomOut();
                var factor = 1 - _this.zoomFactor / 1.2 / _this.zoomFactor;
                if (_this.zoomFactor / 1.2 > _this.initialZoomFactor / 10) {
                    _this.imageOffsetX +=
                        (mouseWheelEvent.clientX - window.innerWidth / 2) * factor;
                    _this.imageOffsetY +=
                        (mouseWheelEvent.clientY - window.innerHeight / 2) * factor;
                    _this.applyOffset(false);
                }
            }
        });
        this.view.addEventListener("mousedown", function (mouseDownEvent) {
            mouseDownEvent.preventDefault();
            if (!_this.isInsideContainer) {
                return;
            }
            _this.mouseDragStartX = mouseDownEvent.clientX;
            _this.mouseDragStartY = mouseDownEvent.clientY;
            _this.modalImg.classList.remove("rslidy-transition-enabled");
            mouseDown = true;
        });
        this.view.addEventListener("mousemove", function (mouseMoveEvent) {
            mouseMoveEvent.preventDefault();
            if (!mouseDown) {
                return;
            }
            _this.imageOffsetX =
                _this.imageOffsetX + mouseMoveEvent.clientX - _this.mouseDragStartX;
            _this.imageOffsetY =
                _this.imageOffsetY + mouseMoveEvent.clientY - _this.mouseDragStartY;
            _this.mouseDragStartX = mouseMoveEvent.clientX;
            _this.mouseDragStartY = mouseMoveEvent.clientY;
            _this.applyOffset(false);
        });
        this.view.addEventListener("mouseup", function (mouseUpEvent) {
            mouseDown = false;
        });
    };
    ImageViewerComponent.prototype.zoomIn = function () {
        this.modalImg.classList.add("rslidy-transition-enabled");
        this.zoomFactor *= 1.2;
        this.imageOffsetX =
            this.containerWidth / 2.0 -
                (-this.imageOffsetX + this.containerWidth / 2.0) * 1.2;
        this.imageOffsetY =
            this.containerHeight / 2.0 -
                (-this.imageOffsetY + this.containerHeight / 2.0) * 1.2;
        this.modalImg.style.width = this.imageWidth * this.zoomFactor + "px";
        this.modalImg.style.height = this.imageHeight * this.zoomFactor + "px";
        this.applyOffset(false);
    };
    ImageViewerComponent.prototype.zoomOut = function () {
        this.modalImg.classList.add("rslidy-transition-enabled");
        var zoomBefore = this.zoomFactor;
        this.zoomFactor /= 1.2;
        if (this.zoomFactor < this.initialZoomFactor / 10) {
            this.zoomFactor = this.initialZoomFactor / 10;
        }
        this.imageOffsetX =
            this.containerWidth / 2.0 -
                (-this.imageOffsetX + this.containerWidth / 2.0) /
                    (zoomBefore / this.zoomFactor);
        this.imageOffsetY =
            this.containerHeight / 2.0 -
                (-this.imageOffsetY + this.containerHeight / 2.0) /
                    (zoomBefore / this.zoomFactor);
        this.modalImg.style.width = this.imageWidth * this.zoomFactor + "px";
        this.modalImg.style.height = this.imageHeight * this.zoomFactor + "px";
        this.applyOffset(false);
    };
    ImageViewerComponent.prototype.applyOffset = function (center) {
        var currentImageWidth = this.imageWidth * this.zoomFactor;
        var currentImageHeight = this.imageHeight * this.zoomFactor;
        if (center) {
            if (currentImageWidth <= this.containerWidth) {
                this.imageOffsetX = (this.containerWidth - currentImageWidth) / 2.0;
            }
            else {
                if (this.containerWidth - this.imageOffsetX >= currentImageWidth) {
                    this.imageOffsetX = this.containerWidth - currentImageWidth;
                }
                else if (this.imageOffsetX > 0) {
                    this.imageOffsetX = 0;
                }
            }
            if (currentImageHeight <= this.containerHeight) {
                this.imageOffsetY = (this.containerHeight - currentImageHeight) / 2.0;
            }
            else {
                if (this.containerHeight - this.imageOffsetY >= currentImageHeight) {
                    this.imageOffsetY = this.containerHeight - currentImageHeight;
                }
                else if (this.imageOffsetY > 0) {
                    this.imageOffsetY = 0;
                }
            }
        }
        this.modalImg.style.left = this.imageOffsetX + "px";
        this.modalImg.style.top = this.imageOffsetY + "px";
    };
    ImageViewerComponent.prototype.initialZoom = function () {
        var aspectImg = this.imageWidth / this.imageHeight;
        var aspectContainer = this.containerWidth / this.containerHeight;
        if (aspectContainer > aspectImg) {
            this.initialZoomFactor = this.containerHeight / this.imageHeight;
            this.imageOffsetX =
                (this.containerWidth - this.imageWidth * this.zoomFactor) / 2.0;
        }
        else {
            this.initialZoomFactor = this.containerWidth / this.imageWidth;
            this.imageOffsetY =
                (this.containerHeight - this.imageHeight * this.zoomFactor) / 2.0;
        }
        this.zoomFactor = this.initialZoomFactor;
        this.modalImg.style.width = this.imageWidth * this.zoomFactor + "px";
        this.modalImg.style.height = this.imageHeight * this.zoomFactor + "px";
        this.applyOffset(true);
    };
    return ImageViewerComponent;
}());
function start() {
    window.imageViewer = new ImageViewerComponent();
}
document.addEventListener("DOMContentLoaded", start);
