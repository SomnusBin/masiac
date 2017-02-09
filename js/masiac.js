// Shawn Khameneh
// ExtraordinaryThoughts.com

(function($) {
    // canvas插入页面
    var settings, masiacCtx, imgCtx, img, imgSrc, canvasWidth, canvasHeight, imgData, imgStorage, penSize;
    // canvas初始化
    function initCanvasFunction($this) {
        masiacCtx = settings.masiacCanvas.getContext('2d');
        imgCtx = settings.imgCanvas.getContext('2d');

        img = new Image();
        img.onload = function() {
            settings.masiacCanvas.width = settings.imgCanvas.width = canvasWidth = img.width;
            settings.masiacCanvas.height = settings.imgCanvas.height = canvasHeight = img.height;
            initMasiacCanvasFunction();
            initImgCanvasFunction();
        }
        img.src = imgSrc;
    };
    // 全图打码canvas底图
    function initMasiacCanvasFunction() {
        masiacCtx.drawImage(img, 0, 0);
        try {
            imgData = masiacCtx.getImageData(0, 0, canvasWidth, canvasHeight).data;
        } catch (error) {
            if (console) {
                console.error(error);
            }
            return
        };

        renderClosePixels();
    };
    function renderClosePixels(resolution) {
        var res = resolution || settings.resolution || 16;
        console.log(res);
        var alpha = 1;
        var cols = canvasWidth / res + 1;
        var rows = canvasHeight / res + 1;
        var halfSize = res / 2;

        var row, col, x, y, pixelY, pixelX, pixelIndex, red, green, blue, pixelAlpha;

        masiacCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        for (row = 0; row < rows; row++) {
            y = (row - 0.5) * res
                // normalize y so shapes around edges get color
            pixelY = Math.max(Math.min(y, canvasHeight - 1), 0)

            for (col = 0; col < cols; col++) {
                x = (col - 0.5) * res
                    // normalize y so shapes around edges get color
                pixelX = Math.max(Math.min(x, canvasWidth - 1), 0)
                pixelIndex = (pixelX + pixelY * canvasWidth) * 4
                red = imgData[pixelIndex + 0]
                green = imgData[pixelIndex + 1]
                blue = imgData[pixelIndex + 2]
                pixelAlpha = alpha * (imgData[pixelIndex + 3] / 255)

                masiacCtx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha + ')'

                masiacCtx.fillRect(x - halfSize, y - halfSize, res, res)
                
            } // col
        } // row
    };
    function initImgCanvasFunction() {
        imgCtx.drawImage(img, 0, 0);
        imgCtxBindEvent();
    };
    function imgCtxBindEvent() {
        function eventDown(e){                 
            e.preventDefault(); 
            // 右键点击撤销一步
            if(e.button == 2){
                imgCtxRevoke();
                return false
            }else{
                // var temporaryCanvas = document.createElement('canvas');
                // temporaryCanvas.width = canvasWidth;
                // temporaryCanvas.height = canvasHeight;
                // temporaryCanvas.getContext("2d").drawImage(settings.masiacCanvas, 0, 0);
                // temporaryCanvas.getContext("2d").drawImage(settings.imgCanvas, 0, 0);
                // var postURL = temporaryCanvas.toDataURL('image/jpeg', 0.8);
                var temporaryCanvas = mergeCanvas();
                if(!imgStorage){
                    imgStorage = [];
                }
                // imgStorage.push(postURL); 
                imgStorage.push(temporaryCanvas); 
            }
            mousedown=true;             
        }; 
        function eventUp(e){            
            e.preventDefault();
            if(e.button == 2){return false}
            mousedown=false;             
        };   
        function eventMove(e){    
            e.preventDefault();              
            if(mousedown){       
                if(e.changedTouches){                         
                    e=e.changedTouches[e.changedTouches.length-1];                     
                }   
                var parent = $(this).parent('.can')[0];
                var offsetX = parent.offsetLeft;
                var offsetY = parent.offsetTop;
                var scrollX = parent.scrollLeft;
                var scrollY = parent.scrollTop;  
                var x = e.clientX - offsetX + scrollX || 0;                        
                var y = e.clientY - offsetY + scrollY || 0; 
                transparentCanvas(x, y);                            
            }             
        };
        function eventContextmenu (e){
           e.preventDefault();
        };
        var mousedown = false; 
        $(settings.imgCanvas).on('mousedown', eventDown);             
        $(settings.imgCanvas).on('mouseup', eventUp);             
        $(settings.imgCanvas).on('mousemove', eventMove);
        $(settings.imgCanvas).on('contextmenu', eventContextmenu); 
    };
    function transparentCanvas(x, y){
        var radgrad = imgCtx.createRadialGradient(x, y, 0, x, y, penSize || settings.penSize || 10);
        imgCtx.globalCompositeOperation = 'destination-out';
        radgrad.addColorStop(0, 'rgba(0,0,0,0.6)');
        radgrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        imgCtx.fillStyle = radgrad;
        imgCtx.arc(x, y, penSize || settings.penSize || 10, 0, Math.PI * 2, true);
        imgCtx.fill(); 
    };
    function imgCtxRevoke() {
        var canvas1 = imgStorage.pop();
        if(!canvas1){
            return false
        }
        imgCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        imgCtx.globalCompositeOperation = 'source-over';
        imgCtx.drawImage(canvas1, 0, 0, canvasWidth, canvasHeight);
    };
    function mergeCanvas() {
        var temporaryCanvas = document.createElement('canvas');
        temporaryCanvas.width = canvasWidth;
        temporaryCanvas.height = canvasHeight;
        temporaryCanvas.getContext("2d").drawImage(settings.masiacCanvas, 0, 0);
        temporaryCanvas.getContext("2d").drawImage(settings.imgCanvas, 0, 0);
        return temporaryCanvas;
    }
    var methods = {
        init: function(options) {
            var $this = $(this);
            // 尝试去获取settings，如果不存在，则返回“undefined”
            settings = $this.data('imgMasiac');
            // 如果获取settings失败，则根据options和default创建它
            if (typeof(settings) == 'undefined') {
                var defaults = {
                    masiacCanvas: document.createElement('canvas'),
                    imgCanvas: document.createElement('canvas'),
                    $canvasContainer: $('body')
                }
                settings = $.extend({}, defaults, options);
                // 保存我们新创建的settings
                $this.data('imgMasiac', settings);
            } else {
                // 如果我们获取了settings，则将它和options进行合并（这不是必须的，你可以选择不这样做）
                settings = $.extend({}, settings, options);
                // 如果你想每次都保存options，可以添加下面代码：
                // $this.data('pluginName', settings);
            }
            //图片转换逻辑，解决getImageData失败问题
            var temporaryCanvas = document.createElement('canvas');
            var temporaryCtx = temporaryCanvas.getContext("2d");
            var temporaryImg = new Image();
            temporaryImg.crossOrigin = '';
            temporaryImg.onload = function() {
                temporaryCanvas.width = temporaryImg.width;
                temporaryCanvas.height = temporaryImg.height;
                temporaryCtx.drawImage(temporaryImg, 0, 0);
                temporaryCtx.save();
                imgSrc = temporaryCanvas.toDataURL('image/jpeg', 0.8);
                //开始初始化canvas
                initCanvasFunction($this);
            };
            temporaryImg.src = $this.attr('src');
        },
        //插入元素的方法
        insert: function() {
            var $this = $(this);
            // 如果获取settings失败，则执行init初始化
            // if (typeof(settings) == 'undefined') {
            methods.init.apply(this, arguments)
            // }
            settings.$canvasContainer.html('');
            settings.$canvasContainer.append(settings.masiacCanvas);
            settings.$canvasContainer.append(settings.imgCanvas);
        },
        //马赛克底图重绘
        repaint: function(options) {
            if(!masiacCtx){
                $.error('jQuery.imgMasiac not initialized');
                return
            }
            if(isNaN(options)){
                $.error('Parameter error: 参数错误，传入参数必须是数字');
                return
            }
            renderClosePixels(options)
        },
        // 设置画笔大小
        penSetUp: function(options) {
            if(!masiacCtx){
                $.error('jQuery.imgMasiac not initialized');
                return
            }
            if(isNaN(options)){
                $.error('Parameter error: 参数错误，传入参数必须是数字');
                return
            }
            penSize = options;
        },
        revoke: function() {
            imgCtxRevoke();
        },
        merge: function() {
            var temporaryCanvas = mergeCanvas();
            var postURL = temporaryCanvas.toDataURL('image/jpeg', 0.8);
            return postURL;
        }
    };

    $.fn.imgMasiac = function() {
        var method = arguments[0];

        if (methods[method]) {
            method = methods[method];
            arguments = Array.prototype.slice.call(arguments, 1);
        } else if (typeof(method) == 'object' || !method) {
            method = methods.init;
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.imgMasiac ');
            return this;
        }
        return method.apply(this, arguments);

    }

})(jQuery);
