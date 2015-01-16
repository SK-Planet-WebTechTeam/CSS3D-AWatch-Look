# CSS3D-AWatch-Look
CSS3D based Apple Watch -like UI

Major Features 
- dynamically creates div for each data and calculates appropriate position and size.
- move and rescale based on touchmove/mousemove event using CSS3D.  

Structure
- main.js loads the data and attaches click events to each boxes. 
- applewatchview.js manages mouse/touch events. When applewatchview.init() is called, or when mouse/touchmove event occurs, core.js, which is responsible for actual style calculations(scale factor and x, y, z postions), is called. 

User controls 
- in main.js, options values can be changed to tune by users.
        
        boxSize: boxSize, //pixel
        scaleLimitmin: 0.8,
        scaleLimitmax: 3.0,  //range of 0.8~3.2 is suggested 
        momentumScale: 0.4,  //bigger momentum with higher value   0.3~0.5 suggested 
        bouncedPixel: 150, //default is set equal to boxsize; in pixel
        boxMargin: 1, //space between neighboring boxes; in pixel

        isCircularLayout: true,

- boxSize is intially set as half of window width
- if isCircularLayout is set as true, data is postioned on the screens as circular shape. If it is set as false, data is rendered as square shape. 

Coordinate caluculation Algorithms (used in core.js) 
- for square layout: for n divs, it sets squareroot(n) number of rows. For odd index of rows, it adds half of div width for x coordinates. 
- for circular layout: uses polar coordinate to set x and y values for each divs. For the first div, it gets it own layer. For next layers, each layer is consisted of multiple of 6 divs. For example, second layer that wraps the first div will have six divs max, third layer will have 12 divs, forth will have 18 divs, and so on. 

                for (var n = 0; n < pts; n++) {
                        p = {};
                        r = radius * level; 
                        angleIncrement = 360 / pts;
                        p.x = r * Math.cos((angleIncrement * n) * (Math.PI / 180)) +screenCenter.centerX - radius/2;
                        p.y = r * Math.sin((angleIncrement * n) * (Math.PI / 180)) +screenCenter.centerY - radius/2;
                        p.z = 0;
                        pt += 1;
                }

- code above calculates pts number of x and y coordinates by translating polar coordinates into rectangular coordinates with cosine and sine. r is the radius of the circle, and angleIncrement is the angle spacing between two adjacent points. screenCenter - radius/2 is added in order to correctly place the divs relative to the center of the screen. 

Issues
- unsmooth scaling action, especially on Android devices 
- touchmove is only enabled on boxes. touchmove on document is blocked with the intention to prevent screen scrolling on ios devices, although the it unwillingly blocked move events when background is selected.

license
All images are SK Planet's property. Cannot be used for commercial purposes. 
