// TODO: 
//      * allow setting params via data tags on container
//      * allow setting maps API key
var ___parkingWidgetAlreadyLoaded;
(function() {
    if (___parkingWidgetAlreadyLoaded) { return; }
    ___parkingWidgetAlreadyLoaded = true;

    var jQuery;
    /* Load jQuery if not present */
    if (window.jQuery === undefined) {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type","text/javascript");
        script_tag.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js");
        if (script_tag.readyState) {
          script_tag.onreadystatechange = function () { // For old versions of IE
              if (this.readyState == 'complete' || this.readyState == 'loaded') {
                  scriptLoadHandler();
              }
          };
        } else { // Other browsers
          script_tag.onload = scriptLoadHandler;
        }
        // Try to find the head, otherwise default to the documentElement
        
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);

    /* Use the already-loaded jquery */
    } else {
        jQuery = window.jQuery;
        main();
    } 

    function scriptLoadHandler() {
        jQuery = window.jQuery.noConflict();
        main(); 
    }

    function main() { 
        jQuery(document).ready(function($) { 
            var loadOrdered = function(files, callback) {
                $.getScript(
                    files.shift(),
                    files.length ? function(){loadOrdered(files, callback);} : callback
                );
            }
            loadOrdered([
                    //"http://maps.googleapis.com/maps/api/js?sensor=false", // TODO: Doesn't work because it dynamically loads its own stuff. Has a callback, but it must be global...
                    //"http://stratman.pw/map/gmap3.js",
                    //"http://stratman.pw/map/jquery.parkingmap.js"
                ],
                function() {
                    //var map = new $.parkingMap($(".parking-map-widget-container"));
                    //map.createMap();
                }
            );
        });
    }
})();
