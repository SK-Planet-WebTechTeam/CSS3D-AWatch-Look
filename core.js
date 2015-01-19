/*
* core.js
* 
* for applewatch view 
*/


var Core = (function (window, document){

    //***** constructor *******
    function Core(options) {
        var i;

        this.options = {
        };

        for (i in options) {
            this.options[i] = options[i];
        }
        this.boxMargin = this.options.boxMargin/2;
        this.applewatchOriginalPosX = $(".applewatchDiv").position().left;
        this.applewatchOriginalPosY = $(".applewatchDiv").position().top;
        console.log(this.options)
        this.applewatchcoordinate = {};

        this.numberofboxes = this.options.boxesCount;
        this.square = Math.floor(Math.sqrt(this.numberofboxes));
        this.coordinatesList = [];
        this.newcoordinatesList =[];

        //** use only one of _setInitialPosition or _setInitialPositionCircle    
        if (this.options.isCircularLayout) {
            this._setInitialPositionCircle();
        } else {
            this._setInitialPosition();
        }
        
        

    }

    //********** prototype ************//
    Core.prototype = {

        scaleRecord: [],

        //get coordinates to spread out the boxes 
        //SQUARE layout
        _setInitialPosition: function () {
            this.coordinatesList =[];

            var transx, transy, transz;
            var xValue = this.options.boxSize + this.boxMargin;
            var p;
            for (i=0; i<this.numberofboxes; i++) {
                p = {};
                if ((i%this.square)%2 == 0) {
                    transy = i%this.square * xValue;
                    transx = -xValue + xValue*Math.floor(i/this.square);
                } else {
                    transy = i%this.square * xValue;
                    transx = -xValue + xValue*Math.floor(i/this.square) + xValue/2;
                }
                transz = 0;
                
                p.x = transx;
                p.y = transy;
                p.z = transz;
                this.coordinatesList.push(p);
            };
            this.newcoordinatesList = this._setElemStyle(0,0);
        },

        //get coordinates to spread out the boxes 
        //CIRCULAR layout 
        //position calculated via polar coordinate calculations
        _setInitialPositionCircle: function() {
            this.coordinatesList = [];
            var radius = this.options.boxSize + this.boxMargin; //can be changed 
            //first element
            var pts = 1;
            var angleIncrement = 360;
            var r = radius * 0;
            var p = {};
            p.x = r * Math.cos((angleIncrement * 1) * (Math.PI / 180)) 
                        + this.options.screenCenter.centerX - radius/2; //add or subtract the distance from center
            p.y = r * Math.sin((angleIncrement * 1) * (Math.PI / 180)) 
                        + this.options.screenCenter.centerY - radius/2;
            p.z = 0;
            this.coordinatesList.push(p);         
            //rest of elements
            var pt = 1;
            var level = 1;
            while (pt < this.numberofboxes) {
                pts = 6 * level;
                for (var n = -2; n < pts-2; n++) {
                    if (pt < this.numberofboxes) {
                        p = {};
                        r = radius * level; 
                        angleIncrement = 360 / pts;
                        p.x = r * Math.cos((angleIncrement * n) * (Math.PI / 180)) 
                                    + this.options.screenCenter.centerX - radius/2;
                        p.y = r * Math.sin((angleIncrement * n) * (Math.PI / 180)) 
                                    + this.options.screenCenter.centerY - radius/2;
                        p.z = 0;
                        this.coordinatesList.push(p);
                        pt += 1;
                    } else {
                        break;
                    }
                }
                level += 1;
            };
            this.newcoordinatesList = this._setElemStyle(0,0);
        },

        //returns applewatch coordinate dictionary
        _setFlatPos: function(x,y){
            //get applewatch's coordinate
            var applewatchcoordinate = {}
            applewatchcoordinate.x = x;
            applewatchcoordinate.y = y;
            return applewatchcoordinate; 
        },

        //calculates each elements' position and scale 
        _setElemStyle: function (mousex,mousey) {

            //applewatch position relative to the top right of the window 
            var applewatchPosX = this.applewatchOriginalPosX +  mousex;
            var applewatchPosY = this.applewatchOriginalPosY + mousey;

            var i, x, y, ybottom, xright, ycenter, xcenter;
            
            //assuming all elements' width and height are equal
            elemheight = this.options.boxSize;
            elemwidth = this.options.boxSize;
            ycenter = elemheight/2.0;
            xcenter = elemheight/2.0;

            var style = "";
            var loc, scalef, mvX, mvY;

            //desired range = (0.8, 3.0)  **scale can be changed   
            var min = 0;
            var max = this.options.screenCenter.centerX + this.options.screenCenter.centerY;
            var p;

            this.newcoordinatesList = [];
            for (var i=0; i<this.coordinatesList.length; i++) {
                p = {};

                y = applewatchPosY + parseFloat(this.coordinatesList[i].y); 
                x = applewatchPosX + parseFloat(this.coordinatesList[i].x);

                if (x <= this.options.screenCenter.centerX -xcenter 
                    && y <= this.options.screenCenter.centerY - ycenter) {
                    //top left 
                    scalef = Math.max(x + elemwidth , 0) 
                            + Math.max(y , 0); 
                } else if (x <= this.options.screenCenter.centerX-xcenter 
                    && y > this.options.screenCenter.centerY - ycenter) {
                    //bottom left 
                    scalef = Math.max(x + elemwidth , 0) 
                            + Math.max(this.options.windowHeight - (y + elemheight) , 0);
                } else if (x > this.options.screenCenter.centerX - xcenter 
                    && y <= this.options.screenCenter.centerY - ycenter) {
                    //top right
                    scalef = Math.max(this.options.windowWidth - x , 0)
                            + Math.max(y , 0);
                } else {
                    //bottom right
                    scalef = Math.max(this.options.windowWidth - x , 0)
                            + Math.max(this.options.windowHeight-(y + elemheight) , 0); 
                }

                if (scalef == 0) {
                    scalef = this.options.scaleLimitmin;
                } else {
                    scalef = ((this.options.scaleLimitmax - this.options.scaleLimitmin)*(scalef - min)/(max - min)) + this.options.scaleLimitmin
                }
                scalef = Math.log(scalef);
                mvX = parseFloat(this.coordinatesList[i].x);
                mvY = parseFloat(this.coordinatesList[i].y);
                mvZ = 0;

                p.x = mvX;
                p.y = mvY;
                p.z = mvZ;
                p.scale = scalef;
                this.newcoordinatesList.push(p);
            }
            return this.newcoordinatesList;

        },

    }

    return Core;

})(window, document);



