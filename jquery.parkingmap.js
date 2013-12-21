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

;
(function ($) {
	$.parkingMap = function ($cnt, options) {

		var firstEvent = {};
		var defaultConfig = {
			additionalMarkers  : false,
			showEventList      : true,
			showLocationMarker : true,
			loadFirstEvent     : false,
			showPrice          : true,
			event              : null,
			width              : '600px',
			height             : '400px',
			showChosenEvent    : false,
			modules            : ['map', 'time_picker', 'parking_locations'],
			defaultTime        : {
				start : Math.round((new Date()).getTime() / 1000),
				end   : Math.round((new Date()).getTime() / 1000) + 10800, // + 3 hrs
				hours : 3
			},
			zoom               : 14,
			minZoom            : 12,
			maxZoom            : 16,
			location           : {
				lat : 41.878598,
				lng : -87.638836,
				markers            : []
			},
			parkwhizKey        : 'd4c5b1639a3e443de77c43bb4d4bc888',
			overlays           : [],
			cluster            : {
				radius    : 75,
				maxZoom   : 12,
				clickZoom : 16,
				icons     : {
					1 : {
						content : '<div class="cluster"><strong>CLUSTER_COUNT</strong><br /><span style="font-size:10px;">SPOTS</span></div>',
						width   : 50,
						height  : 50
					}
				}
			}
		};

		var $el = $cnt;

		var config = $.extend({}, defaultConfig, options);

		var venues = [];

		var venue_listings = [];

		var module_template = {
			'map'               : $('<div class="parking-map-widget-container"></div>'),
			'parking_locations' : $(
				'<div class="mod">' +
					'   <h2>Parking Locations</h2>' +
					'   <ul class="location-place parking"></ul>' +
					'</div>'
			),
			'event_list'        : $(
				'<div class="mod">' +
					'   <h2>Events</h2>' +
					'   <ul class="parking events"></ul>' +
					'</div>'
			),
			'time_picker'       : $(
				'<div class="mod">' +
					'<h2>Timeframe</h2>' +
					'<div class="datepair">' +
					'<div class="datepair-start">' +
					'<strong>From:</strong><br />' +
					'<input type="text" class="time start" /> on' +
					'<input type="text" class="date start" /><br />' +
					'</div>' +
					'<div class="datepair-end">' +
					'<strong>To:</strong><br />' +
					'<input type="text" class="time end" /> on' +
					'<input type="text" class="date end" />' +
					'</div>' +
					'</div>' +
					'</div>'
			)
		};
		$cnt.empty();
		$.each(config.modules, function (index, module) {
			$cnt.append(module_template[module]);
		});

		$el = $cnt.find('.parking-map-widget-container');

		var plugin = this;

		plugin.settings = {
			HDPI : (window.retina || window.devicePixelRatio > 1)
		};

		if (plugin.settings.HDPI) {
			$.extend(plugin.settings, {
				MAIN_SPRITE             : 'https://dxqviapaoowtl.cloudfront.net/static/images/parkwhiz-sprite@2x.png',
				EXTENDED_SPRITE_101_300 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-101-300@2x.png',
				EXTENDED_SPRITE_301_500 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-301-500@2x.png',
				EXTENDED_SPRITE_501_700 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-501-700@2x.png',
				EXTENDED_SPRITE_701_900 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-701-900@2x.png',
				EXTENDED_SPRITE_901_999 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-901-999@2x.png'
			});
		} else {
			$.extend(plugin.settings, {
				MAIN_SPRITE             : 'https://dxqviapaoowtl.cloudfront.net/static/images/parkwhiz-sprite.png',
				EXTENDED_SPRITE_101_300 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-101-300.png',
				EXTENDED_SPRITE_301_500 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-301-500.png',
				EXTENDED_SPRITE_501_700 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-501-700.png',
				EXTENDED_SPRITE_701_900 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-701-900.png',
				EXTENDED_SPRITE_901_999 : 'https://dxqviapaoowtl.cloudfront.net/static/images/map-price-sprite-extended-901-999.png'
			});
		}

		var _clearMap = function () {
			$('#parking-popup').remove();
			$('.psf').remove();
			$('.location-place').html('');
			$el.gmap3('clear');
		};

		var init = function () {

			$.extend(plugin.settings, config, options);
			plugin.$el = $el;

			var iconSize = new google.maps.Size(38, 33);
			if (config.showPrice === false) {
				iconSize = new google.maps.Size(53, 43);
			}

			plugin._iconMeta = {
				size   : iconSize, //new google.maps.Size(38,33), // 38, 33 (normal for P - 53, 43);
				shadow : {
					url        : plugin.settings.MAIN_SPRITE,
					size       : new google.maps.Size(53, 23),
					origin     : _spriteCoordinates('number_shadow'),
					anchor     : new google.maps.Point(20, 23),
					scaledSize : null
				}
			};

			if (plugin.settings.HDPI) {
				plugin._iconMeta.shadow.scaledSize = new google.maps.Size(477, 1098);
			}

			var now = new Date();

			var start = new Date(now.getTime() + (15 * 60 * 1000));
			var end = new Date(now.getTime() + (195 * 60 * 1000));

			if (start.getMinutes() >= 30) {
				start.setMinutes(30);
			} else {
				start.setMinutes(0);
			}
			if (end.getMinutes() >= 30) {
				end.setMinutes(30);
			} else {
				end.setMinutes(0);
			}

			$('.start.time').val(start.format('g:ia'));
			$('.end.time').val(end.format('g:ia'));
			$('.start.date').val(start.format('n/j/Y'));
			$('.end.date').val(end.format('n/j/Y'));

			$('.datepair input').each(function () {
				$(this).trigger('change');
			});

			$('.start, .end').change(function () {
				// set filters
				// 1. send request to API
				// 2. get response
				// 3. re-build map
				$('.event-item').removeClass('active');

				var startDate = $('.start.date').val();
				var startTime = $('.start.time').val();

				var endDate = $('.end.date').val();
				var endTime = $('.end.time').val();

				var hours = Number(startTime.match(/^(\d+)/)[1]);
				var minutes = Number(startTime.match(/:(\d+)/)[1]);
				var AM = startTime.match(/am/);
				var PM = startTime.match(/pm/);
				if (AM != null && hours < 12) hours = hours + 12;
				if (PM != null && hours == 12) hours = hours - 12;
				var sHours = hours.toString();
				var sMinutes = minutes.toString();
				if (hours < 10) sHours = "0" + sHours;
				if (minutes < 10) sMinutes = "0" + sMinutes;

				var d = startDate.split('/');
				var myDate = new Date(d[2], parseInt(d[0]) - 1, d[1], parseInt(sHours), sMinutes);
				var myStart = myDate.getTime() / 1000.0;

				// end time

				hours = Number(endTime.match(/^(\d+)/)[1]);
				minutes = Number(endTime.match(/:(\d+)/)[1]);
				AM = endTime.match(/am/);
				PM = endTime.match(/pm/);
				if (AM != null && hours < 12) hours = hours + 12;
				if (PM != null && hours == 12) hours = hours - 12;
				sHours = hours.toString();
				sMinutes = minutes.toString();
				if (hours < 10) sHours = "0" + sHours;
				if (minutes < 10) sMinutes = "0" + sMinutes;

				var fix = new Date();
				var fixTimeZone = -fix.getTimeoneOffset() * 60;

				d = endDate.split('/');
				myDate = new Date(d[2], parseInt(d[0]) - 1, d[1], parseInt(sHours), sMinutes);
				var myEnd = myDate.getTime() / 1000.0;

				_clearMap();

				var searchOptions = {};
				searchOptions.start = myStart + fixTimeZone; //  + 18000 - plus 5 hours
				searchOptions.end = myEnd + fixTimeZone; // + 18000 - plus 5 hours
//				plugin.listingsForTimePlace(searchOptions);

				return $(this);
			});
		};

		plugin.venueSearch = function (venue_url, mapOptions) {
			var searchOptions = {};
			searchOptions.key = this.settings.parkwhizKey;
			$.ajax('http://api.parkwhiz.com/' + venue_url + '/', {
				dataType : 'jsonp',
				data     : searchOptions,
				success  : function (searchResults) {
					venues.push(venue_url);
					if (!(config.location.lat && config.location.lng)) {
						config.location.lat = searchResults.lat;
						config.location.lng = searchResults.lng;
					}
					var markerOptions = {};
					if (config.location.lat) {
						mapOptions.latLng = [
							config.location.lat,
							config.location.lng
						];
						if (config.showLocationMarker) {
							markerOptions.latLng = mapOptions.latLng;
						}
					}

					plugin.$el.gmap3({
						map    : mapOptions,
						marker : markerOptions
					});
					$.each(config.overlays, function (index, overlay) {
						plugin.$el.gmap3({
							groundoverlay : overlay
						});
					});
					if (!config.event) {
//						plugin.listingsForTimePlace();
					}
					if (searchResults.parking_listings) {
						venue_listings = venue_listings.concat(searchResults.parking_listings);
					}

					if ($.isArray(config.location.venue) && venues.length === config.location.venue.length) {
						_putListingsOnMap(venue_listings);
					}
				},
				error    : function (xhr, err1, err2) {
					alert(err1 + " " + err2);
				}
			});
		};

		plugin.createMap = function () {
			this.$el.width(config.width);
			this.$el.height(config.height);

			var mapOptions = {
				options : {
					zoom                  : config.zoom,
					minZoom               : config.minZoom,
					maxZoom               : config.maxZoom,
					streetViewControl     : false,
					panControl            : false,
					mapTypeControl        : false,
					mapTypeId             : google.maps.MapTypeId.ROADMAP,
					mapTypeControlOptions : {
						mapTypeIds : [google.maps.MapTypeId.ROADMAP]
					}
				}
			};

			if ($.isArray(config.location.venue)) {
				$.each(config.location.venue, function (index, venue) {
					plugin.venueSearch(venue, mapOptions);
				});
				return;
			} else if (config.location.venue) {
				_putListingsOnMap(plugin.venueSearch(config.location.venue, mapOptions));
				if (config.event) {
					var opts = {};
					opts.url = config.location.venue + '/' + config.event;
					plugin.getByEvents(opts);
					return;
				}
				return;
			}

			var markerOptions = {};
			if (config.location.destination) {
				mapOptions.address = config.location.destination;
				if (config.showLocationMarker) {
					markerOptions.address = mapOptions.address;
				}
			} else if (config.location.lat) {
				mapOptions.latLng = [
					config.location.lat,
					config.location.lng
				];
				if (config.showLocationMarker) {
					markerOptions.latLng = mapOptions.latLng;
				}
			}


			this.$el.gmap3({
				map    : mapOptions,
				marker : markerOptions
			});

			plugin.listingsForTimePlace();
		};

		var _putListingsOnMap = function (listings) {
			var $el = plugin.$el;
			var map = $el.gmap3('get');

			var values = [];
			for (var i = 0; i < listings.length; i++) {
				var icon = _getIcons(listings[i].price);
				if (config.additionalMarkers) {
					icon.normal = config.additionalMarkers;
				}
				values[i] = {
					latLng  : [ listings[i].lat, listings[i].lng ],
					data    : { listing : listings[i], icon : icon },
					options : {
						icon   : icon.normal,
						shadow : plugin._iconMeta.shadow
					}
				};
			}

			if (config.cluster) {
				var cluster = {
					radius  : config.cluster.radius,
					maxZoom : config.cluster.maxZoom,
					events  : {
						mouseover : function (cluster) {
							$(cluster.main.getDOMElement()).addClass('active');
						},
						mouseout  : function (cluster) {
							$(cluster.main.getDOMElement()).removeClass('active');
						},
						click     : function (cluster, event) {
							map.setCenter(cluster.main.getPosition());
							map.setZoom(config.cluster.clickZoom);
						}
					}
				};
				$.each(config.cluster.icons, function (index, value) {
					cluster[index] = value;
				});
			}
			$el.gmap3({
				marker : {
					values  : values,
					events  : {
						mouseover : function (marker, event, context) {
							if (context.data.icon) {
								marker.setZIndex(999);
								marker.setIcon(context.data.icon.active);
							}
						},
						mouseout  : function (marker, event, context) {
							if (context.data.icon) {
								marker.setZIndex(998);
								marker.setIcon(context.data.icon.normal);
							}
						},
						click     : function (marker, event, context) {
							window.open(context.data.listing.parkwhiz_url);
						}
					},
					cluster : cluster
				}
			});

			var markers = [];
			$.each(config.location.markers, function (index, value) {
				markers.push(value);
			});

			$el.gmap3({
				marker : {
					values : markers,
					events : {
						mouseover : function (marker, event, context) {
							if (context.data.icon) {
								marker.setZIndex(999);
								marker.setIcon(context.data.icon.active);
							}
						},
						mouseout  : function (marker, event, context) {
							if (context.data.icon) {
								marker.setZIndex(998);
								marker.setIcon(context.data.icon.normal);
							}
						},
						click     : function (marker, event, context) {
							window.open(context.data.listing.parkwhiz_url);
						}
					}
				}
			});
		};

		/*
		 *
		 * Options are any of those available to the 'search' endpoint of the ParkWhiz API:
		 * https://www.parkwhiz.com/developers/search/
		 */
		plugin.listingsForTimePlace = function (searchOptions) {
			if (typeof searchOptions == "undefined") {
				searchOptions = {};
			}

			searchOptions.key = this.settings.parkwhizKey;

			if (( config.location.destination || config.location.lat ) && ( !searchOptions.start && config.defaultTime.start )) {
				searchOptions.start = config.defaultTime.start;
			}

			if (( config.location.destination || config.location.lat ) && ( !searchOptions.end && config.defaultTime.end )) {
				searchOptions.end = config.defaultTime.end;
			}

			if (!searchOptions.start && !config.location.venue) {
				searchOptions.start = Math.round((new Date()).getTime() / 1000);
			}

			if (!searchOptions.end && !config.location.venue) {
				searchOptions.end = searchOptions.start + config.defaultTime.hours * 60 * 60; // 3 hrs
			}

			if (config.location.destination) {
				searchOptions.destination = config.location.destination;
			} else if (config.location.lat) {
				searchOptions.lat = config.location.lat;
				searchOptions.lng = config.location.lng;
			}

			$.ajax('http://api.parkwhiz.com/search/', {
				dataType : 'jsonp',
				data     : searchOptions,
				success  : function (searchResults) {
					_setLocations(searchResults.parking_listings, 'location-place');
					_putListingsOnMap(searchResults.parking_listings);
				},
				error    : function (xhr, err1, err2) {
					alert(err1 + " " + err2);
				}
			});
		};

		var _venueListings = function (venue, searchOptions) {
			$.ajax('http://api.parkwhiz.com/' + venue + '/', {
				dataType : 'jsonp',
				data     : searchOptions,
				success  : function (searchResults) {

					searchOptions.lat = searchResults.lat;
					searchOptions.lng = searchResults.lng;
					searchOptions.start = searchResults.start;
					if (searchResults.num_events) {
						_setEvents(searchResults.events, 'events');
					}
					$.ajax('http://api.parkwhiz.com/search/', {
						dataType : 'jsonp',
						data     : searchOptions,
						success  : function (searchResults) {
							_setLocations(searchResults.parking_listings, 'location-place');
							_putListingsOnMap(searchResults.parking_listings);
						},
						error    : function (xhr, err1, err2) {
							alert(err1 + " " + err2);
						}
					});

				},
				error    : function (xhr, err1, err2) {
					alert(err1 + " " + err2);
				}
			});
		}

		var _setLocations = function (locations, place) {
			var html = '';
			$.each(locations, function () {
				html += '<li><a target="_blank" href="' + this.parkwhiz_url + '">' + this.address + '</a></li>';
			});
			$('.' + place).html(html);
		};

		var _setVenue = function (locations, place) {
			var html = '';
			$.each(locations, function () {
				html += '<li><a target="_blank" href="#">' + this.name + '</a></li>';
			});
			$('.' + place).html(html);
		};

		plugin.getByEvents = function (opts) {
			var searchOptions = {};

			searchOptions.key = this.settings.parkwhizKey;

			$.ajax('http://api.parkwhiz.com/' + opts.url + '/', {
				dataType : 'jsonp',
				data     : searchOptions,
				success  : function (searchResults) {

					config.showPrice = true;
					plugin._iconMeta.size = new google.maps.Size(38, 33);
					_setLocations(searchResults.parking_listings, 'location-place');
					_putListingsOnMap(searchResults.parking_listings);
					if (config.showChosenEvent === true && config.location.venue) {
						$('.pfs').each(function () {
							$(this).remove();
						});
						$('.map-button').hide();
						$('.for-event').html(searchResults.event_name);
					}
				},
				error    : function (xhr, err1, err2) {
					alert(err1 + " " + err2);
				}
			});

		};

		var _setEvents = function (locations, place) {
			var html = '';
			var i = 0;
			$.each(locations, function () {
				i++;
				if (i === 1) {
					firstEvent.start = this.start;
					firstEvent.end = this.end;
					firstEvent.url = this.api_url;
					firstEvent.showPrice = true;
				}
				html += '<li data-api-url="' + this.api_url + '" data-end="' + this.end + '" data-start="' + this.start + '" class="event-item">' + this.event_name + '</li>';
			});

			if (config.showEventList === true) {
				$('.' + place).html(html);
			}

			if (config.loadFirstEvent === true) {
				_clearMap();
				$('.pfs').each(function () {
					$(this).remove();
				});
				plugin.getByEvents(firstEvent);
			}

			$('.event-item').click(function () {
				var $this = $(this);
				$('.event-item').removeClass('active');
				$this.addClass('active');

				_clearMap();

				opts = {};
				opts.start = $this.data('start');
				opts.end = $this.data('end');
				opts.showPrice = true;
				opts.url = $this.data('api-url');

				plugin.getByEvents(opts);
			});
		};

		var _spriteCoordinates = function (icon, color) {
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
				var hundreds = Math.floor(number / 100);
				if (hundreds > 0) {
					hundreds = (hundreds - 1) % 2;
				}

				var top = Math.floor(double_digits / 10) * 34;
				if (color == 'active') {
					top += 339;
				}

				var left = ((double_digits % 10) + (10 * hundreds)) * 38;
				return new google.maps.Point(left, top);
			}

		};

		plugin._iconCache = {};
		var _getIcons = function (dollars) {
			plugin._iconCache = {};
			if (!plugin._iconCache[dollars]) {

				var sprite, scaledSize;

				if (dollars <= 100) {
					sprite = plugin.settings.MAIN_SPRITE;
					scaledSize = new google.maps.Size(477, 1098);
				} else if (dollars > 100 && dollars <= 300) {
					sprite = plugin.settings.EXTENDED_SPRITE_101_300;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 300 && dollars <= 500) {
					sprite = plugin.settings.EXTENDED_SPRITE_301_500;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 500 && dollars <= 700) {
					sprite = plugin.settings.EXTENDED_SPRITE_501_700;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 700 && dollars <= 900) {
					sprite = plugin.settings.EXTENDED_SPRITE_701_900;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 900) {
					sprite = plugin.settings.EXTENDED_SPRITE_901_999;
					scaledSize = new google.maps.Size(380, 680);
				}

				if (config.showPrice === false) {
					plugin._iconCache[dollars] = {
						'normal' : {
							url        : sprite,
							size       : plugin._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (new google.maps.Point(0, 693))
						},
						'active' : {
							url        : sprite,
							size       : plugin._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (new google.maps.Point(56, 693) )
						}
					}
				} else {
					plugin._iconCache[dollars] = {
						'normal' : {
							url        : sprite,
							size       : plugin._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (dollars === 0 ? new google.maps.Point(380, 645) : _spriteCoordinates(dollars, 'normal') )
						},
						'active' : {
							url        : sprite,
							size       : plugin._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (dollars === 0 ? new google.maps.Point(418, 645) : _spriteCoordinates(dollars, 'active') )
						}
					}
				}

			}

			return plugin._iconCache[dollars];
		};

		init();
	}
})(jQuery);
