/*
 * jquery.parkingmap.js
 *
 * Copyright (C) 2013 ParkWhiz, Inc.
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

// Usage:
//     var map = new $.parkingMap($(".parking-map-widget-container"), { 
//         width: 400,
//         height: 300,
//         location {
//         }
//     });

/*
* locations type:
* 1. address - default
* 2. latlng
* 3. venue
* 4. event
*/

;(function($) {
    $.parkingMap = function($el, options) {
        
        var firstEvent = {};
        var defaultConfig = {};
        
        defaultConfig.icon = false;
        defaultConfig.showEventList = true;
        defaultConfig.showMarker = true;
        defaultConfig.loadFirstEvent = false;
        defaultConfig.showPrice = false;
        defaultConfig.showTimePicker = true;
        defaultConfig.width = '600px';
        defaultConfig.height = '400px';
        defaultConfig.showChosenEvent = true;
        
        defaultConfig.defaultTime = {
            start: Math.round((new Date()).getTime() / 1000),
            end: Math.round((new Date()).getTime() / 1000) + 10800, // + 3 hrs
            hours: 3
        };
        
        defaultConfig.zoom = 14;
        defaultConfig.location = {
                type: 'address',
                destination: "208 S. Jefferson St, Chicago, IL 60661"
                /* Alternatively you could provide 'lat' and 'lng' float values */
                /* { lat: 41.878598, lng: -87.638836 } */
                };
        defaultConfig.parkwhizKey = 'd4c5b1639a3e443de77c43bb4d4bc888';
        
        defaultConfig.showEventList = options.showEventList;
        defaultConfig.showMarker = options.showMarker;
        defaultConfig.showChosenEvent = options.showChosenEvent;
        defaultConfig.showTimePicker = options.showTimePicker;
        defaultConfig.loadFirstEvent = options.loadFirstEvent;
        defaultConfig.showPrice = options.showPrice;
        defaultConfig.defaultTime = options.defaultTime;
        defaultConfig.width = options.width;
        defaultConfig.height = options.height;
        defaultConfig.icon = options.icon;
        defaultConfig.zoom = options.zoom;
        defaultConfig.location = options.location;
        defaultConfig.parkwhizKey = options.parkwhizKey;
        
        var config  = defaultConfig;

        var plugin = this;

        plugin.settings = {
            HDPI: (window.retina || window.devicePixelRatio > 1)
        };

        if (plugin.settings.HDPI) {
            $.extend(plugin.settings, {
                MAIN_SPRITE : 'https://dxqviapaoowtl.cloudfront.net/static/images/parkwhiz-sprite@2x.png',
                EXTENDED_SPRITE_101_300 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-101-300@2x.png',
                EXTENDED_SPRITE_301_500 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-301-500@2x.png',
                EXTENDED_SPRITE_501_700 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-501-700@2x.png',
                EXTENDED_SPRITE_701_900 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-701-900@2x.png',
                EXTENDED_SPRITE_901_999 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-901-999@2x.png'
            });
        } else {
            $.extend(plugin.settings, {
                MAIN_SPRITE : 'https://dxqviapaoowtl.cloudfront.net/static/images/parkwhiz-sprite.png',
                EXTENDED_SPRITE_101_300 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-101-300.png',
                EXTENDED_SPRITE_301_500 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-301-500.png',
                EXTENDED_SPRITE_501_700 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-501-700.png',
                EXTENDED_SPRITE_701_900 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-701-900.png',
                EXTENDED_SPRITE_901_999 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-901-999.png'
            });
        }

        function parkingPopup(controlDiv, map) {
            
            if ( ( config.location.type === 'address' || config.location.type === 'latlng') && ( config.showTimePicker === true ) ) {
            $.get('popup.html', function(resp){
                $(controlDiv).html(resp);

                $('.apply-button').click(function(){
                    // set filters 
                    // 1. send request to API
                    // 2. get response
                    // 3. re-build map
                    var startDate = $('#date_from').val();
                    var startTime = $('#time_from').val();
                    
                    var endDate = $('#date_to').val();
                    var endTime = $('#time_to').val();
                    
                    var time = startTime;
                    var hours = Number(time.match(/^(\d+)/)[1]);
                    var minutes = Number(time.match(/:(\d+)/)[1]);
                    var AM = time.match(/am/);
                    var PM = time.match(/pm/);
                    if(AM != null && hours<12) hours = hours+12;
                    if(PM != null && hours==12) hours = hours-12;
                    var sHours = hours.toString();
                    var sMinutes = minutes.toString();
                    if(hours<10) sHours = "0" + sHours;
                    if(minutes<10) sMinutes = "0" + sMinutes;
                    
                    var d = startDate.split('/');
                    var myDate = new Date(d[2], parseInt(d[0]) - 1, d[1], parseInt(sHours), sMinutes);
                    var myStart = myDate.getTime()/1000.0;
                    
                    // end time
                    
                    var time = endTime;
                    var hours = Number(time.match(/^(\d+)/)[1]);
                    var minutes = Number(time.match(/:(\d+)/)[1]);
                    var AM = time.match(/am/);
                    var PM = time.match(/pm/);
                    if(AM != null && hours<12) hours = hours+12;
                    if(PM != null && hours==12) hours = hours-12;
                    var sHours = hours.toString();
                    var sMinutes = minutes.toString();
                    if(hours<10) sHours = "0" + sHours;
                    if(minutes<10) sMinutes = "0" + sMinutes;
                    
                    var fix = new Date();
                    var fixTimeZone = -fix.getTimezoneOffset() * 60 ;
                    
                    var d = endDate.split('/');
                    var myDate = new Date(d[2], parseInt(d[0]) - 1, d[1], parseInt(sHours) , sMinutes);
                    var myEnd = myDate.getTime()/1000.0;
                    
                    _clearMap();
                    
                    searchOptions = {};
                    searchOptions.start = myStart + fixTimeZone; //  + 18000 - plus 5 hours
                    searchOptions.end = myEnd + fixTimeZone; // + 18000 - plus 5 hours
                    plugin.listingsForTimePlace(searchOptions);
                    
                });
            });
            }
            
        };

        var _clearMap = function() {
            $('#parking-popup').remove();
            $('.psf').remove();
            $('.location-place').html('');            
            $el.gmap3('clear');
        };

        function parkingShownFor(controlDiv, map) {

            // Set CSS styles for the DIV containing the control
            // Setting padding to 5 px will offset the control
            // from the edge of the map
            
            controlDiv.className = 'control';
            // Set CSS for the control border
            var controlUI = document.createElement('div');
            
            controlUI.className = 'psf';
            controlUI.title = 'Click to set the time';
           
            controlDiv.appendChild(controlUI);

            // Set CSS for the control interior
            var controlText = document.createElement('div');
            controlText.className = 'control-text';
            controlText.innerHTML = '<span>Parking shown for</span>';
            controlUI.appendChild(controlText);
            
            var button = document.createElement('div');
            $(button).addClass('map-button');
            $(button).html('3 hours');
            
            var eventName = document.createElement('div');
            $(eventName).addClass('for-event');
            $(eventName).html('');
            
            controlUI.appendChild(button);
            controlUI.appendChild(eventName);

            google.maps.event.addDomListener(controlUI, 'click', function() {
                _getPopup();
            });

        };

        var _getPopup = function()
        {
            var display =  $('#parking-popup').css('display');
            if ( display === 'none' ) {
                $('#parking-popup').show();
            } else {
                $('#parking-popup').hide();
            }
        };

        var init = function() {
            
            $.extend(plugin.settings, config, options);
            plugin.$el = $el;

            plugin._iconMeta = {
                size: new google.maps.Size(53,43), // 38, 33
                shadow: {
                    url: plugin.settings.MAIN_SPRITE,
                    size: new google.maps.Size(53,23),
                    origin: _spriteCoordinates('number_shadow'),
                    anchor: new google.maps.Point(20,23),
                    scaledSize: null
                }
            };
            
            if (plugin.settings.HDPI) {
                plugin._iconMeta.shadow.scaledSize = new google.maps.Size(477, 1098);
            }
           
        };

        plugin.createMap = function() {
            
            this.$el.width(config.width);
            this.$el.height(config.height);

            var mapOptions = {
                options:{
                    zoom: config.zoom
                }
            };

            if (config.location.type === 'venue') {
                var searchOptions = {};
                searchOptions.key = this.settings.parkwhizKey;
                $.ajax('http://api.parkwhiz.com/' + config.location.destination + '/', {
                    dataType: 'jsonp',
                    data: searchOptions,
                    success: function(searchResults) {
                        config.location.lat = searchResults.lat;
                        config.location.lng = searchResults.lng;
                        
                        var markerOptions = {};
                        if (config.location.lat) {
                            mapOptions.latLng = [
                                config.location.lat,
                                config.location.lng
                            ];
                            if (config.showMarker) {
                                markerOptions.latLng = mapOptions.latLng;
                            }
                        }

                        plugin.$el.gmap3({
                            map: mapOptions,
                            marker: markerOptions
                        });

                        plugin.getParking();
                        
                    },
                    error: function(xhr, err1, err2) {
                        alert(err1 + " " + err2);
                    },
                });
                return;
            }
            
            var markerOptions = {};
            if (config.location.destination && (config.location.type === 'address' || config.location.type === 'latlng') ) {
                mapOptions.address = config.location.destination;
                if (config.showMarker) {
                    markerOptions.address = mapOptions.address;
                }
            } else if (config.location.lat) {
                mapOptions.latLng = [
                    config.location.lat,
                    config.location.lng
                ];
                if (config.showMarker) {
                    markerOptions.latLng = mapOptions.latLng;
                }
            }
           
            this.$el.gmap3({
                map: mapOptions,
                marker: markerOptions
            });
           
            this.getParking();
        };
        
        plugin.getParking = function() {
            this.listingsForTimePlace();
        };
        
        var _putListingsOnMap = function(listings) {
            var $el = plugin.$el;
            var map = $el.gmap3('get');
            
            for (var i = 0; i < listings.length; i++) {
                var icon = _getIcons(listings[i].price);
                if ( config.icon ) {
                    icon.normal = config.icon;
                }
                $el.gmap3({
                    marker: {
                        latLng: [ listings[i].lat, listings[i].lng ],
                        data: { listing: listings[i], icon: icon },
                        options : {
                            icon: icon.normal,
                            shadow: plugin._iconMeta.shadow
                        },
                        events : {
                            mouseover: function(marker, event, context) {
                                marker.setZIndex(999);
                                marker.setIcon(context.data.icon.active);
                            },
                            mouseout : function(marker, event, context) {
                                marker.setZIndex(998);
                                marker.setIcon(context.data.icon.normal);
                            },
                            click : function(marker, event, context) {
                                window.location = context.data.listing.parkwhiz_url;
                            }
                        }
                    }
                });
            }
            
            var parkingShownForDiv = document.createElement('div');
            var Control = new parkingShownFor(parkingShownForDiv, map);
            parkingShownForDiv.index = 1;
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(parkingShownForDiv); 
            Control = '';
            
            var popupDiv = document.createElement('div');
            Control = new parkingPopup(popupDiv, map);
            popupDiv.index = 2;
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(popupDiv);
           
        };
        
        /* 
         *
         * Options are any of those avaialble to the 'search' endpoint of the ParkWhiz API:
         *    https://www.parkwhiz.com/developers/search/
         */
        plugin.listingsForTimePlace = function(searchOptions) {
            if (typeof searchOptions == "undefined") {
                searchOptions = {};
            }

            searchOptions.key = this.settings.parkwhizKey;

            if ( ( config.location.type === 'address' || config.location.type === 'latlng' ) && ( !searchOptions.start && config.defaultTime.start ) ) {
                searchOptions.start = config.defaultTime.start;
            }
            
            if ( ( config.location.type === 'address' || config.location.type === 'latlng' ) && ( !searchOptions.end && config.defaultTime.end ) ) {
                searchOptions.end = config.defaultTime.end;
            }

            if (!searchOptions.start) {
                searchOptions.start = Math.round((new Date()).getTime() / 1000);
            }
            if (!searchOptions.end) {
                searchOptions.end = searchOptions.start + config.defaultTime.hours * 60 * 60; // 3 hrs
            }

            if (config.location.type === 'venue') {
                $.ajax('http://api.parkwhiz.com/' + config.location.destination + '/', {
                    dataType: 'jsonp',
                    data: searchOptions,
                    success: function(searchResults) {

                        if ( searchResults.num_events ) {
                            searchOptions.lat = searchResults.lat;
                            searchOptions.lng = searchResults.lng;
                            searchOptions.start = searchResults.start;
                            _setEvents(searchResults.events, 'events');
                            
                            $.ajax('http://api.parkwhiz.com/search/', {
                                dataType: 'jsonp',
                                data: searchOptions,
                                success: function(searchResults) {
                                    _setLocations(searchResults.parking_listings, 'location-place');
                                    _putListingsOnMap(searchResults.parking_listings);
                                },
                                error: function(xhr, err1, err2) {
                                    alert(err1 + " " + err2);
                                },
                            });
                        }
                    },
                    error: function(xhr, err1, err2) {
                        alert(err1 + " " + err2);
                    },
                });
                return;
            }
            
            if (config.location.destination) {
                searchOptions.destination = config.location.destination;
            } else if (config.location.lat) {
                searchOptions.lat = config.location.lat;
                searchOptions.lng = config.location.lng;
            }
            
            $.ajax('http://api.parkwhiz.com/search/', {
                dataType: 'jsonp',
                data: searchOptions,
                success: function(searchResults) {
                    _setLocations(searchResults.parking_listings, 'location-place');
                    _putListingsOnMap(searchResults.parking_listings);
                },
                error: function(xhr, err1, err2) {
                    alert(err1 + " " + err2);
                },
            });
    
            /*if ( config.venue_url ) {
                $.ajax('http://api.parkwhiz.com/' + config.venue_url + '/', {
                    dataType: 'jsonp',
                    data: searchOptions,
                    success: function(searchResults) {
                        if ( searchResults.num_events ) {
                            _setEvents(searchResults.events, 'events');
                        }
                    },
                    error: function(xhr, err1, err2) {
                        alert(err1 + " " + err2);
                    },
                });
            }*/
           
        };

        var _setLocations = function(locations, place) {
            var html = '';
            $.each(locations, function(){ 
                html += '<li><a target="_blank" href="' + this.parkwhiz_url + '">' + this.address + '</a></li>';
            });
            $('.' + place).html( html );
        };
        
        var _setVenue = function(locations, place) {
            var html = '';
            $.each(locations, function(){ 
                html += '<li><a target="_blank" href="#">' + this.name + '</a></li>';
            });
            $('.' + place).html( html );
        };
        
        plugin.getByEvents = function(opts) {
            
            var searchOptions = {};
            
            searchOptions.key = this.settings.parkwhizKey;
            searchOptions.start = opts.start;
            searchOptions.end = opts.end;
            
            $.ajax(opts.url, {
                dataType: 'jsonp',
                data: searchOptions,
                success: function(searchResults) {
                    //console.log(searchResults);
                    config.showPrice = true;
                    _setLocations(searchResults.parking_listings, 'location-place');
                    _putListingsOnMap(searchResults.parking_listings);
                    if ( config.showChosenEvent === true && config.location.type == 'venue') {
                        $('.pfs').each(function(){$(this).remove();});
                        $('.map-button').hide();
                        $('.for-event').html(searchResults.event_name);
                    }
                },
                error: function(xhr, err1, err2) {
                    alert(err1 + " " + err2);
                },
            });

        };
        
        var _setEvents = function(locations, place) {
            
            var html = '';
            var i = 0;
            $.each(locations, function(){ 
                i++;
                if ( i === 1 ) {
                    firstEvent.start = this.start;
                    firstEvent.end = this.end;
                    firstEvent.url = this.api_url;
                    firstEvent.showPrice  = true;
                }
                html += '<li api_url="' + this.api_url + '" end="' + this.end + '" start="' + this.start + '" class="event-item">' + this.event_name + '</li>';
            });
            
            if ( config.showEventList === true ) {
                $('.' + place).html( html );
            }
           
            if ( config.loadFirstEvent === true ) {
                _clearMap();
                $('.pfs').each(function(){$(this).remove();});
                plugin.getByEvents(firstEvent);
            }
            
            $('.event-item').click(function(){
                var start = $(this).attr('start');
                var end = $(this).attr('end');
                var api_url = $(this).attr('api_url');
                
                _clearMap();
                
                opts = {};
                opts.start = start;
                opts.end = end;
                opts.showPrice  = true;
                opts.url = api_url;
                
                plugin.getByEvents(opts);
            });
            
        };

        var _spriteCoordinates = function(icon, color) {
            if (icon == 'p') {
                if (color == 'active') {
                    return new google.maps.Point(56, 693);
                } else {
                    return new google.maps.Point(0, 693);
                }
            } else if (icon == 'number_shadow') {
                return new google.maps.Point(396, 23);
            } else if (icon == 'p_shadow') {
                return new google.maps.Point(24, 693);
            } else {
                // money icon is 36x33, rows of 10, 100 blue (normal)

                var number = parseInt(icon) - 1;
                if (number >= 1000) {
                    number = 999;
                }

                var double_digits = number % 100;
                var hundreds = Math.floor(number/100);
                if (hundreds > 0) {
                    hundreds = (hundreds - 1) % 2;
                }

                var top = Math.floor(double_digits/10) * 34;
                if (color == 'active') {
                    top += 339;
                }

                var left = ((double_digits % 10) + (10*hundreds)) * 38;
                return new google.maps.Point(left, top);
            }

        };

        plugin._iconCache = {};
        var _getIcons = function(dollars) {
            plugin._iconCache = {};
            if (! plugin._iconCache[dollars]) {

                var sprite, scaledSize;

                if (dollars <= 100) {
                    sprite = plugin.settings.MAIN_SPRITE;
                    scaledSize = new google.maps.Size(477, 1098);
                } else if (dollars > 100 && dollars <= 300 ) {
                    sprite = plugin.settings.EXTENDED_SPRITE_101_300;
                    scaledSize = new google.maps.Size(760, 680);
                } else if (dollars > 300 && dollars <= 500 ) {
                    sprite = plugin.settings.EXTENDED_SPRITE_301_500;
                    scaledSize = new google.maps.Size(760, 680);
                } else if (dollars > 500 && dollars <= 700 ) {
                    sprite = plugin.settings.EXTENDED_SPRITE_501_700;
                    scaledSize = new google.maps.Size(760, 680);
                } else if (dollars > 700 && dollars <= 900 ) {
                    sprite = plugin.settings.EXTENDED_SPRITE_701_900;
                    scaledSize = new google.maps.Size(760, 680);
                } else if (dollars > 900) {
                    sprite = plugin.settings.EXTENDED_SPRITE_901_999;
                    scaledSize = new google.maps.Size(380, 680);
                }
                
                if ( config.showPrice === false ) {
                    plugin._iconCache[dollars] = {
                        'normal': {
                            url: sprite,
                            size: plugin._iconMeta.size,
                            scaledSize: scaledSize,
                            origin: (new google.maps.Point(0, 693))
                        },
                        'active': {
                            url: sprite,
                            size: plugin._iconMeta.size,
                            scaledSize: scaledSize,
                            origin: (new google.maps.Point(56, 693) )
                        }
                    }
                } else {
                    plugin._iconCache[dollars] = {
                        'normal': {
                            url: sprite,
                            size: plugin._iconMeta.size,
                            scaledSize: scaledSize,
                            origin: (dollars === 0 ? new google.maps.Point(380,645) : _spriteCoordinates(dollars, 'normal') )
                        },
                        'active': {
                            url: sprite,
                            size: plugin._iconMeta.size,
                            scaledSize: scaledSize,
                            origin: (dollars === 0 ? new google.maps.Point(418,645) : _spriteCoordinates(dollars, 'active') )
                        }
                    }
                }
                
                
            }

            return plugin._iconCache[dollars];
        };

        init();

    }
})(jQuery);
