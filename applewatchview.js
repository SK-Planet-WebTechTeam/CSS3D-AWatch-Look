/*
* applewatchview.js
*/


var AppleWatchView = (function (window, document) {
    //CSS prefix, event handler collection
    //utils below is written based on open source
    var utils = (function () {
        var me = {};

        var _elementStyle = document.createElement('div').style;
        var _vendor = (function () {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for ( ; i < l; i++ ) {
                transform = vendors[i] + 'ransform';
                if ( transform in _elementStyle ){
                    return vendors[i].substr(0, vendors[i].length-1);
                }
            }

            return false;
        })();

        function _prefixStyle (style) {
            if ( _vendor === false ){
                return false;
            }
            if ( _vendor === '' ){
                return style;
            }
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
        }

        me.extend = function (target, obj) {
            for ( var i in obj ) {
                target[i] = obj[i];
            }
        };

        var _transform = _prefixStyle('transform');

        me.extend(me, {
            hasTransform: _transform !== false,
            hasPerspective: _prefixStyle('perspective') in _elementStyle,
            hasTouch: 'ontouchstart' in window,
            hasPointer: navigator.msPointerEnabled,
            hasTransition: _prefixStyle('transition') in _elementStyle
        });

        me.extend(me.style = {}, {
            transform: _transform,
            transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
            transitionDuration: _prefixStyle('transitionDuration'),
            transitionProperty: _prefixStyle('transitionProperty'),
            transformOrigin: _prefixStyle('transformOrigin'),
            perspective: _prefixStyle('perspective'),
            perspectiveOrigin: _prefixStyle('perspectiveOrigin'),
            transformStyle: _prefixStyle('transformStyle')
        });

        me.extend(me.eventType = {}, {
            touchstart: 1,
            touchmove: 1,
            touchend: 1,

            mousedown: 2,
            mousemove: 2,
            mouseup: 2,

            MSPointerDown: 3,
            MSPointerMove: 3,
            MSPointerUp: 3
        });
        me.addEvent = function (el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        };

        me.removeEvent = function (el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        };
        return me;
    })();

    var START_EV = utils.hasTouch ? 'touchstart' : 'mousedown',
        MOVE_EV = utils.hasTouch ? 'touchmove' : 'mousemove',
        END_EV = utils.hasTouch ? 'touchend' : 'mouseup',
        CANCEL_EV = utils.hasTouch ? 'touchcancel' : 'mouseup';

    function support(props) {
        for(var i = 0, l = props.length; i < l; i++) {
            if(typeof el.style[props[i]] !== "undefined") {
                return props[i];
            }
        }
    }

    // ***************     constructor  *************/

    function AppleWatchView (el, options) {
        var i;
        this.applewatch;
        this.boxes;
        this.boxesCount;

        this.viewport = typeof el === 'string' ? document.querySelector(el) : el;

        this.applewatch = this.viewport.children[0];

        var e = document.documentElement,
            g = document.getElementsByTagName('body')[0];
        this.windowWidth = window.innerWidth || e.clientWidth || g.clientWidth,
        this.windowHeight = window.innerHeight|| e.clientHeight|| g.clientHeight;
        //center of the screen
        this.screenCenter = [];
        this.screenCenter['centerX'] = this.windowWidth/2.0;
        this.screenCenter['centerY'] = this.windowHeight/2.0;

        this.options = {
            transDuration: "700ms",
            eventQueueSize: 5,
            useTransition: false, //executes momuntum scrolling with transition on touchend
            tranTimingFunc: "cubic-bezier(0.21, 0.78, 0.4, 1.02)",
            transitionThreshold: 5,
            enableOrientationEvent: false,

            flatXLeftLimit: this.windowWidth,
            flatXRightLimit: this.windowWidth - this.windowHeight/2,
            flatYTopLimit: 150,
            flatYBottomLimit: this.windowHeight - this.windowHeight/2,

            //default values. can be changed by options param
            boxSize: 150,
            scaleLimitmin: 1.1,
            scaleLimitmax: 3.5,
            momentumScale: 0.4,
            bouncedPixel: 150,
            boxMargin: 10,
            isCircularLayout: true,
        };

        for ( i in options ) {
            this.options[i] = options[i];
        }

        if (typeof this.options.applewatchX !== "undefined") {
            this.applewatchX = this.options.applewatchX;
        }
        if (typeof this.options.applewatchY !== "undefined") {
            this.applewatchY = this.options.applewatchY;
        }

    }


    // ***************    prototype  *************/
    AppleWatchView.prototype = {


        init: function(list) {
            var item, box, i;
            for (item in list){
                box = document.createElement('div');
                box.className = 'box';
                this.applewatch.appendChild(box);
            }

            this.boxesCount = this.applewatch.childElementCount;

            this.boxes = this.applewatch.children;
            for (i = 0; i < this.boxes.length; i++) {
                this.boxes[i].style.width = this.options.boxSize + "px";
                this.boxes[i].style.height = this.options.boxSize + "px";
            }

            this.viewport.style.width = this.windowWidth + "px";
            this.viewport.style.height = this.windowHeight + "px";

            core = new Core({
                boxSize: this.options.boxSize,
                boxesCount: this.boxesCount,
                scaleLimitmin: this.options.scaleLimitmin,
                scaleLimitmax: this.options.scaleLimitmax,
                boxMargin: this.options.boxMargin,
                isCircularLayout: this.options.isCircularLayout,
                windowWidth: this.windowWidth,
                windowHeight: this.windowHeight,
                screenCenter: this.screenCenter,
            });


            //box display positions
            this.setInitialPosition();

            //box style
            this.setElemStyle();

            this._initEvents();

        },



        handleEvent: function (e) {
            switch ( e.type ) {
                case START_EV:
                    this._start(e);
                    break;
                case MOVE_EV:
                    this._translate(e);
                    break;
                case END_EV:
                case CANCEL_EV:
                    this._translateEnd(e);
                    break;
            }
        },

        flatX: 0,
        flatY: 0,
        applewatchX: -30,
        applewatchY: -35,
        enabled: true,
        started: false,

        posRecord: {
            start: {},
            all: [],//save up to five when move occurs; used for momentum animation
            last: {}
        },

        setInitialPosition: function () {
            //box display positions
            var p, style = "";
            var xValue = -1 * this.options.boxSize;

            //call applewatch object (core) to get style for each box
            for (i=0; i<core.newcoordinatesList.length; i++) {
                p = core.newcoordinatesList[i];
                style = "translate3d(" + p.x + "px," + p.y +"px, 0px)scale(" + p.scale + ", " + p.scale + ")";
                this.boxes[i].style[utils.style.transform] = style;
            };
            //set limit based on the number of boxes
            var xlimit = Math.ceil(core.newcoordinatesList.length/core.square)
            this.options.flatXRightLimit = Math.min(0, (xlimit -2) *(xValue));
            this.options.flatYTopLimit = xValue * (core.square - 2);

        },

        //set transform
        setFlatPos: function(x,y){
            //move applewatch
            var applewatchcoordinate = core._setFlatPos(x, y);
            var posStr = "rotateX(0deg) rotateY(0deg)";
            posStr += "translate3d("+ applewatchcoordinate.x +"px," + applewatchcoordinate.y + "px,0)";
            this.applewatch.style[utils.style.transform] = posStr;
            this.setElemStyle(x,y);

        },

        //set elements' position and scale
        setElemStyle: function(x,y) {

            var style;
            var newstyleList = core._setElemStyle(x,y);
            for (i=0; i<newstyleList.length; i++) {
                p = newstyleList[i];
                style = "translate3d(" + parseInt(p.x) + "px," + parseInt(p.y) +"px, 0px) scale(" + parseInt(p.scale*100)/100 + ", " + parseInt(p.scale*100)/100 + ")";
                this.boxes[i].style[utils.style.transform] = style;
            }

        },

        _initEvents: function(remove) {
            utils.addEvent(window, 'orientationchange', this);
            utils.addEvent(window, 'resize', this);
            //viewport events
            utils.addEvent(this.viewport, START_EV, this);
            utils.addEvent(this.viewport, MOVE_EV, this);
            utils.addEvent(this.viewport, CANCEL_EV, this);
            utils.addEvent(this.viewport, END_EV, this);
            //applewatchdiv events
            utils.addEvent(this.applewatch, START_EV, this);
            utils.addEvent(this.applewatch, MOVE_EV, this);
            utils.addEvent(this.applewatch, CANCEL_EV, this);
            utils.addEvent(this.applewatch, END_EV, this);

            if (this.options.enableOrientationEvent && window.DeviceOrientationEvent) {
                utils.addEvent(window,"deviceorientation",this);
            }

        },

        //touch event start
        _start: function (e) {
            var pos;
            pos = e.touches ? e.touches[0] : e;

            if(!this.enabled) {
                return;
            }

            this.started = true;
            if(this.options.useTransition){
                this.clearTransitionProperty( this.applewatch );
            }

            this.posRecord.start.x = pos.pageX;
            this.posRecord.start.y = pos.pageY;
            this.posRecord.last.x = pos.pageX;
            this.posRecord.last.y = pos.pageY;
            this.posRecord.all = [];
            this.posRecord.all.push({
                x: pos.pageX,
                y: pos.pageY
            });
        },

        //executes touchmovee event. move applewatch
        _translate: function (e) {
            var pos,
                x,
                y;
            pos = e.touches ? e.touches[0] : e;

            if (!this.started){
                return;
            }
            e.preventDefault();

            this.posRecord.all.push({
                x: pos.pageX,
                y: pos.pageY
            });
            if (this.posRecord.all.length > this.options.eventQueueSize) {
                this.posRecord.all.shift();
            }

            x = this.flatX - parseInt((this.posRecord.last.x - pos.pageX));
            y = this.flatY - parseInt((this.posRecord.last.y - pos.pageY));

            if (this.options.flatXLeftLimit<x) {
                x = this.options.flatXLeftLimit;
            }
            if (this.options.flatXRightLimit>x){
                x = this.options.flatXRightLimit;
            }

            if (this.options.flatYTopLimit> y) {
                y = this.options.flatYTopLimit;
            }
            if (this.options.flatYBottomLimit < y) {
                y = this.options.flatYBottomLimit;
            }

            this.flatX = x;
            this.flatY = y;

            this.setFlatPos(x,y);

            this.posRecord.last.x = pos.pageX;
            this.posRecord.last.y = pos.pageY;
        },

        _translateEnd: function (e) {
            var x, y,
                dx, dy,
                pageX, pageY,
                len,
                posRecordAll = this.posRecord.all,
                momentumScale = this.options.momentumScale;

            if (!this.options.useTransition) {
                this.started = false;
                return;
            }

            pageX = 0;
            pageY = 0;
            len = posRecordAll.length;
            if (len <= 1) {
                dx = 0;
                dy = 0;
            } else {
                dx = posRecordAll[len-1].x - posRecordAll[0].x;
                dy = posRecordAll[len-1].y - posRecordAll[0].y;
            }
            if( Math.abs(dx) < this.options.transitionThreshold && Math.abs(dy) < this.options.transitionThreshold) {
                posRecordAll = [];
                return;
            }

            pageX = posRecordAll[len-1].x + dx;
            pageY = posRecordAll[len-1].y + dy;

            x = this.flatX - parseInt((this.posRecord.last.x - pageX)/momentumScale); //number can be changed
            y = this.flatY - parseInt((this.posRecord.last.y - pageY)/momentumScale);

            utils.addEvent(this.applewatch, 'webkitTransitionEnd', this);

            this.setTransitionProperty(this.applewatch);
            if (this.options.flatXLeftLimit<x) {
                x = this.options.flatXLeftLimit - this.options.bouncedPixel;
            }
            if (this.options.flatXRightLimit>x){
                x = this.options.flatXRightLimit + this.options.bouncedPixel;
            }
            if (this.options.flatYTopLimit> y) {
                y = this.options.flatYTopLimit + this.options.bouncedPixel;
            }
            if (this.options.flatYBottomLimit < y) {
                y = this.options.flatYBottomLimit - this.options.bouncedPixel;
            }

            this.flatX = x;
            this.flatY = y;

            this.setFlatPos(x,y);

            posRecordAll = [];
            this.started = false;

        },


        launchingAnimationHandler: function (element) {
            var transformText = element.style[utils.style.transform];
            var aniBegin = transformText + " scale(0.7, 0.7)",
                aniEnd = transformText + (ios ? " scale(1.15,1.15)": " scale(1.35,1.35)");
            element.style[utils.style.transform] = aniBegin;
            setTimeout(function(){
                element.style[utils.style.transform] = aniEnd;
            }, 800);
        },
        setTransitionProperty: function (elm){
            elm.style[utils.style.transitionDuration] = this.options.transDuration;
            elm.style[utils.style.transitionProperty] = utils.style.transform;
            elm.style[utils.style.transitionTimingFunction] = this.options.tranTimingFunc;
        },

        clearTransitionProperty: function (elm){
            elm.style[utils.style.transitionDuration] = "";
            elm.style[utils.style.transitionProperty] = "";
            elm.style[utils.style.transitionTimingFunction] = "";
        },
    }

    return AppleWatchView;
})(window, document);