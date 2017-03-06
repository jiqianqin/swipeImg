/**
 * Created by qinwen on 17/2/10.
 */
; (function ($, window, document, undefined) {
    var pluginName = "imgShow";
    var defaults = {
        smallMaxNum: 3,
        data: [],
        clickHandle: null, //点击事件
        multiselectEnable: true
    }

    function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    Plugin.prototype.init = function () {
        var self = this;
        self.initModul(self.options.data).initEvent();
    }

    Plugin.prototype.initEvent = function (data) {
        var self = this;


        var galleryElements =$('.my-gallery');
        var hashData = self.photoswipeParseHash();

         if (hashData.pid && hashData.gid) {
                self.openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
            }


    }

    /**
     * 
     */
    Plugin.prototype.photoswipeParseHash = function () {
        var hash = window.location.hash.substring(1), params = {};

        if (hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if (!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if (pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }

        if (params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };


    /**
     * 动态添加一个模块
     */
    Plugin.prototype.initModul = function (data) {
        var self = this;
        var ul = document.createElement('ul'); //创建评论内容容器
        var i, len;  //优化变量声明
        for (i = 0, len = data.length; i < len; i++) {
            var h2 = document.createElement('h2'); //删除按钮
            h2.innerHTML = data[i].key;
            this.element.appendChild(h2);
            self.setItems(data[i].imgList, data[i].key);
        }
        return this;
    }

    Plugin.prototype.setItems = function (data, name) {
        var self = this;
        var div = document.createElement('div');
        $(div).addClass('my-gallery');
        $(div).attr('data-pswp-uid', name);

        var i, len;  //优化变量声明
        for (i = 0, len = data.length; i < len; i++) {
            var figure = document.createElement('figure');
            (i + 1) > this.options.smallMaxNum && $(figure).css('display', 'none');
            $(figure).attr('itemprop', 'associatedMedia');
            $(figure).attr('itemtype', 'http://schema.org/ImageObject');
            var a = document.createElement('a');
            $(a).attr('href', data[i]);
            $(a).attr('itemprop', 'contentUrl');
            $(a).attr('data-size', "1024x1024");
            var img = document.createElement('img');
            $(img).attr('src', data[i]);
            $(img).attr('itemprop', 'thumbnail');
            $(img).attr('alt', 'Image description');
            a.appendChild(img);
            figure.appendChild(a);
            var figcaption = document.createElement('figcaption');
            $(figcaption).attr('itemprop', 'caption description');
            $(figcaption).html('Image caption 1');
            figure.appendChild(figcaption);

            div.appendChild(figure);
            div.onclick = self.onThumbnailsClick; //绑定点击事件
        }
        this.element.appendChild(div);
    }


    Plugin.prototype.closest = function (el, fn) {
        return el && (fn(el) ? el : this.closest(el.parentNode, fn));
    };

    /**
     * 判断点击的是第几个，该模块总共有多少个图片
     */
    Plugin.prototype.onThumbnailsClick = function (e) {
        var self = this;
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        var eTarget = e.target || e.srcElement;

        //clickedListItem为点击的具体的figure
        var clickedListItem = Plugin.prototype.closest(eTarget, function (el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });

        if (!clickedListItem) {
            return;
        }

        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes, //该模块同级别
            numChildNodes = childNodes.length,//总共有多少个同级别的
            nodeIndex = 0,
            index; //点击的是第几个

        for (var i = 0; i < numChildNodes; i++) {
            if (childNodes[i].nodeType !== 1) {
                continue;
            }

            if (childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }

        if (index >= 0) {
            Plugin.prototype.openPhotoSwipe(index, clickedGallery);
        }
        return false;
    };

    /**
    * 打开大图显示
    * index 第几个
    * galleryElement 所属模块
    */
    Plugin.prototype.openPhotoSwipe = function (index, galleryElement, disableAnimation, fromURL) {
        var self = this;
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = self.parseThumbnailElements(galleryElement);

        options = {
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function (index) {
                var thumbnail = items[index].el.getElementsByTagName('img')[0],
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();

                return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
            }

        };

        if (fromURL) {
            if (options.galleryPIDs) {
                for (var j = 0; j < items.length; j++) {
                    if (items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        if (isNaN(options.index)) {
            return;
        }

        if (disableAnimation) {
            options.showAnimationDuration = 0;
        }

        gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };


    Plugin.prototype.parseThumbnailElements = function (el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            figureEl,
            linkEl,
            size,
            item;

        for (var i = 0; i < numNodes; i++) {
            figureEl = thumbElements[i];
            if (figureEl.nodeType !== 1) {
                continue;
            }

            linkEl = figureEl.children[0];
            size = linkEl.getAttribute('data-size').split('x');
            item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10)
            };

            if (figureEl.children.length > 1) {
                item.title = figureEl.children[1].innerHTML;
            }

            if (linkEl.children.length > 0) {
                item.msrc = linkEl.children[0].getAttribute('src');
            }

            item.el = figureEl;
            items.push(item);
        }

        return items;
    };


    $.fn[pluginName] = function (options) {
        if (typeof arguments[0] === 'string') {
            var methodName = arguments[0];
            var args = Array.prototype.slice.call(arguments, 1);
            var returnVal;
            this.each(function () {
                if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
                    returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
                } else {
                    throw new Error('Method ' + methodName + ' does not exist on jQuery.' + pluginName);
                }
            });
            if (returnVal !== undefined) {
                return returnVal;
            } else {
                return this;
            }
        } else if (typeof options === "object" || !options) {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        }
    };

})(jQuery, window, document);

