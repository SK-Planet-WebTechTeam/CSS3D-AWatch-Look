/*
* main.js
*
* for applewatch view
*/

var slideOn = (/android (2.|4.0|4.1)/gi).test(navigator.appVersion);
var androidOld = (/android (2.|4.0|4.1)/gi).test(navigator.appVersion);
var inlineVideo = !(/android (2.|4.0|4.1|4.2|4.3)/gi).test(navigator.appVersion);//4.4 이상만 inline video enable
var ios = (/iphone OS/gi).test(navigator.appVersion);
var enableGameStatusCard = false;
var initialCubeViewMode = false;
var enableExtraGameCard = true;


var applewatch,
    slide,
    launchingAnimation = !slideOn,
    launchingDelay = 2000; //in msec



//**************** FaceCard ***********************//

var FaceCard = function () {};


FaceCard.prototype.cardImageLoader = function(element, cardURL, landingURL) {
    var img;

    img = document.createElement("img");
    img.src = cardURL;
    element.appendChild(img);
};


FaceCard.prototype.youtubeLoader = function(element, cardURL, badgeURL) {
    var img;
    img = document.createElement("img");
    img.src = cardURL;
    element.appendChild(img);
    addEvent(img, "click", function(e) {
        if (applewatch.started) {
            youtubePopupLoader(element, badgeURL);
        }
    });

};



//******************** InitView *********************//

var cubeFaceInfo = {};

//called by getOcbData()
function initView() {

    //attach click event on each box
    launchingDelay = 0;
    var i = 0;
    for (key in cubeFaceInfo) {

        obj = cubeFaceInfo[key];
        element = document.getElementsByClassName("box")[i];
        i += 1;

        (function() {

            var landingUrl = obj.landingUrl;
                elm = obj.element;
            addEvent(element, "click", function(e) {
                if (applewatch.started) {
                    if (this.classList.contains("youtube")) {
                        alert("동영상 시청시 데이터 네트워크 이용시 통화료가 과다하게 발생할 수 있으니 Wi-Fi로 접속하거나 전용 요금제를 이용하시기 바랍니다.");
                    } else if (landingUrl.length > 0) {
                        if (launchingAnimation) {
                            applewatch.launchingAnimationHandler(elm);
                        }
                        console.log("icon cicked");
                    }
                }
            });

        })();


    }

    //view data
    for (key in cubeFaceInfo){
        obj = cubeFaceInfo[key];
        if (typeof obj.faceCardLoader !== "undefined") {
            console.log(obj)
            obj.faceCardLoader(obj.element, obj.iconUrl, obj.badgeUrl, obj.iframeCoverName);
        } else {
            console.log(key + "용 정의된 card view loader가 없음");
        }
    }
}

//called by init()
function getOcbData(facecard) {

    $.getJSON("data/ocb.json").done(function(list) {
        var i = 0;
        //init applewatch by passing in list
        applewatch.init(list);
        $.each(list, function(index, data) {

            cubeFaceInfo[index] = {};
            cubeFaceInfo[index].element = document.getElementsByClassName("box")[i];
            cubeFaceInfo[index].landingUrl = data.landingURL;
            cubeFaceInfo[index].title = data.title;
            cubeFaceInfo[index].iconUrl = data.iconUrl;
            cubeFaceInfo[index].status = data.status;
            cubeFaceInfo[index].badgeUrl = data.badgeUrl;
            if (/youtube/.test(index)){
                cubeFaceInfo[index].element.classList.add(index);
                cubeFaceInfo[index].element.classList.add("youtube");
                cubeFaceInfo[index].faceCardLoader = facecard.youtubeLoader;
            } else {
                cubeFaceInfo[index].element.classList.add(index)
                cubeFaceInfo[index].faceCardLoader = facecard.cardImageLoader;
            }
            cubeFaceInfo[index].element.classList.add("show");

            i += 1;
        });

        initView();
    });
};


(function init(){

    var facecard = new FaceCard();

    $(document).on("touchmove", function(e){
        e.preventDefault();
        e.stopPropagation();
    });

    //기존 main.js 의 settings
    backFaceVisibilityOff = (/LG-F400|IM-A930/gi).test(navigator.appVersion);
    backFaceVisibilityOff = true;

    //iOS에서만 device orient event에 따른 scrolling on
    orientationEvent = ios;
    if (ios) {
        perspectiveOrigin = "130% 200px";
    } else {
        perspectiveOrigin = "80% 200px";
    }

    //slide 모드에서는 game status card 미지원
    enableGameStatusCard = (slideOn)? false : enableGameStatusCard;
    enableGameStatusCard = true;

    //cube mode에서 enable
    enableIdleAnimation = !slideOn;
    idleAnimationType = (backFaceVisibilityOff) ? "rotate" : "blink";

    var boxSize =  (Math.min(window.innerWidth, window.innerHeight))/2.0;

    applewatch = new AppleWatchView(".applewatchDiv", {
        viewportX: -30,
        viewportY: -35,
        transDuration: "500ms",
        // perspective: "800px",
        perspectiveOrigin: perspectiveOrigin,
        useTransition: true,
        transitionThreshold: 5,//이거 절대 끄지 마시오. 클릭 이벤트 꼬임
        tranTimingFunc: "cubic-bezier(0.21, 0.78, 0.4, 1.02)",
        flattenDegLimit: 60,
        enableOrientationEvent: orientationEvent,
        enableIdleAnimation: enableIdleAnimation,
        idleAnimationType: idleAnimationType,
        onAnimationEnd: function (){
            console.log("transition ends");
        },


        //default values. can be changed by options param
        boxSize: boxSize, //pixel
        scaleLimitmin: 0.8,
        scaleLimitmax: 3.0,  //range of 1.1~3.5 is suggested
        momentumScale: 0.4,  //bigger momentum with higher value   0.3~0.5 suggested
        bouncedPixel: 150, //default is set equal to boxsize pixel
        boxMargin: 1, //space between neighboring boxes. pixel

        isCircularLayout: true,
    });

    getOcbData(facecard);

})();



/**  **  **  **  **  **  **  **  **  **/

function addEvent (el, type, fn, capture) {
    el.addEventListener(type, fn, !!capture);
};

function removeEvent (el, type, fn, capture) {
    el.removeEventListener(type, fn, !!capture);
};

var youtubePopupLoader = function(element, badgeURL){

    var FullScreen = "yes";
    var AutoPlay = "yes";
    var HighDef = "yes";

    //Calculate Page width and height
    var pageWidth = window.innerWidth;
    var pageHeight = window.innerHeight;

    var divSize = Math.min(pageWidth, pageHeight);
    // Make Background visible...
    element.style.visibility = "visible";

    //Create dynamic Div container for YouTube Popup Div
    var divobj = document.createElement('div');
    divobj.setAttribute('id', badgeURL); // Set id to YouTube id
    divobj.className = "popup";
    divobj.position = "absolute";
    var divWidth = divSize;
    var divHeight = divSize;
    divobj.style.width = pageWidth + "px";
    divobj.style.height = pageHeight + "px";
    divobj.style.overflow = "hidden";
    divobj.addEventListener("click", function(e){
        closePopup(badgeURL);
        applewatch.started = false;
    })
    //Set Left and top coordinates
    var divLeft = (pageWidth - divWidth) /2
    var divTop = (pageHeight - divHeight) / 2;

    divobj.style.left = "0px";
    divobj.style.top = "0px";

    //Create YouTube Div
    var youtubeDiv = document.createElement('div');
    youtubeDiv.setAttribute('id', "yt" + badgeURL);
    youtubeDiv.className = "ytcontainer";
    youtubeDiv.style.top = divTop + "px";
    youtubeDiv.style.left = divLeft + "px";
    youtubeDiv.style.position= "relative";
    youtubeDiv.style.width = divSize + "px";
    youtubeDiv.style.height = divSize + "px";
    if (FullScreen == "yes")
        FullScreen="&fs=1";
    else
        FullScreen="&fs=0";
    if (AutoPlay == "yes")
        AutoPlay="&autoplay=1";
    else
        AutoPlay="&autoplay=0";
    if (HighDef == "yes")
        HighDef="&hd=1";
    else
        HighDef="&hd=0";

    var URL = "http://www.youtube.com/v/" + badgeURL + "&hl=en&rel=0&showsearch=0" + FullScreen + AutoPlay + HighDef;
    var YouTube = "<object width=\"" + divWidth + "\" height=\"" + divHeight + "\">";
    YouTube += "<param name=\"movie\" value=\"" + URL + "\"></param>";
    YouTube += "<param name=\"allowFullScreen\" value=\"true\"></param><param name=\"allowscriptaccess\" value=\"always\"></param>";
    YouTube += "<embed src=\"" + URL + "\" type=\"application/x-shockwave-flash\" ";
    YouTube += "allowscriptaccess=\"always\" allowfullscreen=\"true\" width=\"" + divWidth + "\" height=\"" + divHeight + "\"></embed></object>";
    youtubeDiv.innerHTML = YouTube;

    divobj.style.visibility = "visible";
    divobj.appendChild(youtubeDiv);
    document.body.appendChild(divobj);

    $(divobj).on("touchmove", function(e){
        e.preventDefault();
        e.stopPropagation();
    });


}

function closePopup(id){
      var divobj = document.getElementById(id);
      var youtubeDiv = document.getElementById("yt" + id);
      divobj.removeChild(youtubeDiv); //remove YouTube Div
      document.body.removeChild(divobj); // remove Popup Div
}
