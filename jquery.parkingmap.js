/*
 * @module pwMap
 * @author ParkWhiz.com
 * jquery.parkingmap.js
 *
 * Copyright (C) 2014 ParkWhiz, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

// Usage:
//     $("#parkwhiz-widget-container").parkingMap({
//         width: '400px',
//         height: '300px',
//         location {
//         }
//     });

;
(function ($) {
	var config;
	var DATEPICKER_FORMAT = 'M/D/YYYY';
	var TIMEPICKER_FORMAT = 'h:mma';
	/**
	 * Creates a ParkWhiz Widget in a jQuery object.
	 *
	 * @constructor
	 * @param {Object} options Configuration data for the ParkWhiz Widget.
	 * @param {Object=} options.additionalMarkers An icon to replace the default ParkWhiz price marker that denotes location, as defined in the Google Maps API (https://developers.google.com/maps/documentation/javascript/reference?hl=fr#Icon)
	 * @param {boolean=} options.showLocationMarker If true, show a marker to denote the location searched by the widget as specified in the Location object.
	 * @param {boolean=} options.showPrice If true, show prices for each lot. If false, show a generic "P" icon.
	 * @param {string=} [options.width=600px] A css width value for the map module.
	 * @param {string=} [options.height=600px] A css height value for the map module.
	 * @param {string[]=} options.modules An array of module codes to dictate how the module is arranged on the screen. Possible codes include map, parking_locations, event_list and time_picker
	 * @param {Object=} options.defaultTime An object containing default timestamps for the timepicker, if present.
	 * @param {int=} options.defaultTime.start A unix timestring representing the default search start time in the timepicker, rounded to the nearest half hour.
	 * @param {int=} options.defaultTime.end A unix timestring representing the default search end time in the timepicker, rounded to the nearest half hour.
	 * @param {Object} options.location An object describing the search area for the widget.
	 * @param {(string|string[])=} options.location.event An event slug, such as 'united-center-parking/san-antonio-spurs-at-chicago-bulls-155217', or an array of event slugs corresponding to a URL on parkwhiz.com
	 * @param {(string|string[])=} options.location.destination A plaintext address or array of plaintext addresses around which to search parking.
	 * @param {(string|string[])=} options.location.venue A venue slug, such as 'united-center-parking', or an array of venue slugs corresponding to a URL on parkwhiz.com
	 * @param {string=} options.location.defaultEvent An event ID number, found as an integer at the end of an event URL slug, to select by default when the event picker module is present
	 * @param {Object=} options.location.center An optional object for centering the map away from the search location.
	 * @param {string=} options.location.center.destination A plaintext address to optionally manually center the map away from the search location.
	 * @param {string=} options.location.center.lat A plaintext latitude to optionally manually center the map away from the search location. Requires longitude.
	 * @param {string=} options.location.center.lng A plaintext longitude to optionally manually center the map away from the search location. Requires latitude.
	 * @param {string} options.parkwhizKey Your ParkWhiz API key, available here: http://www.parkwhiz.com/developers/
	 * @param {Object=} options.styles An object containing stylers, as defined in the Google Maps API (https://developers.google.com/maps/documentation/javascript/reference#MapTypeStyle)
	 * @param {Object=} options.mapOptions An object with any option you can pass through to Google Maps' MapOptions object (https://developers.google.com/maps/documentation/javascript/reference#MapOptions)
	 * @param {Object=} options.overrideOptions An object with any option you can pass through to the gmap3 plugin (http://gmap3.net/en/), upon which this plugin is based.
	 *
	 */
	$.fn.parkingMap = function (options) {

		var defaultConfig = {
			additionalMarkers  : false,
			showLocationMarker : true,
			showPrice          : true,
			width              : '600px',
			height             : '400px',
			modules            : ['map', 'time_picker'],
			defaultTime        : {
				start : moment().unix(),
				end   : moment().add('h', 3).unix() // + 3 hrs
			},
			location           : {
				center       : null,
				defaultEvent : null,
				event        : [],
				destination  : [],
				venue        : []
			},
			parkwhizKey        : 'd4c5b1639a3e443de77c43bb4d4bc888',
			styles             : [],
			mapOptions         : {
				zoom : 14
			},
			overrideOptions    : {}
		};

		var $cnt = $(this);
		var $el = $cnt;

		config = $.extend({}, defaultConfig, options);
		config.defaultTime = $.extend({}, defaultConfig.defaultTime, options.defaultTime);
		config.location = $.extend({}, defaultConfig.location, options.location);
		config.mapOptions = $.extend({}, defaultConfig.mapOptions, options.mapOptions);
		config.location.center = $.extend({}, defaultConfig.location.center, options.location.center);

		var fix = new Date();
		var fixTimeZone = (fix.getTimezoneOffset() - 300) * -60;

		if (config.defaultTime.start) {
			config.defaultTime.start += fixTimeZone;
		}

		if (config.defaultTime.end) {
			config.defaultTime.end += fixTimeZone;
		}

		var listings = [],
			searchOptions = {};

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

		/**
		 * Removes all parking locations from the map.
		 *
		 * @private
		 */

		var _clearMap = function () {
			$('#parking-popup').remove();
			$('.psf').remove();
			$('.location-place').html('');
			$el.gmap3('clear');
		};

		/**
		 * Initializes ParkWhiz Widget.
		 */

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

			searchOptions.key = plugin.settings.parkwhizKey;

			if(config.modules.indexOf("time_picker") > -1) {

				var start = moment.unix(config.defaultTime.start).add('m', 15);
				var end = moment.unix(config.defaultTime.end).add('m', 15);

				if (start.minutes() >= 30) {
					start.minutes(30);
				} else {
					start.minutes(0);
				}
				if (end.minutes() >= 30) {
					end.minutes(30);
				} else {
					end.minutes(0);
				}

				$('.start.time').val(start.format(TIMEPICKER_FORMAT));
				$('.end.time').val(end.format(TIMEPICKER_FORMAT));
				$('.start.date').val(start.format(DATEPICKER_FORMAT));
				$('.end.date').val(end.format(DATEPICKER_FORMAT));

				$('input.date').each(function () {
					var $this = $(this);
					if (!$this.attr('placeholder')) {
						$this.attr('placeholder', 'date');
					}

					var opts = { 'format' : 'm/d/yyyy', 'autoclose' : true };

					$this.datepicker(opts);

					if ($this.hasClass('start') || $this.hasClass('end')) {
						$this.on('change changeDate', $this.update_datepair);
					}
				});

				$('input.time').each(function () {
					var $this = $(this);
					if (!$this.attr('placeholder')) {
						$this.attr('placeholder', 'time');
					}

					var opts = { 'showDuration' : true, 'timeFormat' : 'g:ia', 'scrollDefaultNow' : true };

					if ($this.hasClass('start') || $this.hasClass('end')) {
						$this.on('change', function () {
							$this.update_datepair();
						});
					}

					$this.timepicker(opts);
				});

				var $datepair = $('.datepair');

				$datepair.find('input').each(function () {
					var $this = $(this);

					if ($this.hasClass('start') || $this.hasClass('end')) {
						$this.on('change', function () {
							var container = $this.closest('.datepair');
							var $start = container.find('.datepair-start');
							var $end = container.find('.datepair-end');
							var start = moment($start.find('.date').val() + ' ' + $start.find('.time').val(), "MM-DD-YYYY h:mma");
							var end = moment($end.find('.date').val() + ' ' + $end.find('.time').val(), "MM-DD-YYYY h:mma");
							searchOptions.start = start.unix() + fixTimeZone;
							searchOptions.end = end.unix() + fixTimeZone;
							_clearMap();
							plugin._getListings(_putListingsOnMap);
						});
					}
				});

				$datepair.each(init_datepair);
			}
		};

		/**
		 * Pulls listings from ParkWhiz API based on configuration.
		 *
		 * @param callback The function to be called after listings are loaded.
		 * @private
		 */

		plugin._getListings = function (callback) {
			var venues = config.location.venue,
				events = config.location.event,
				destinations = config.location.destination,
				listingOptions = searchOptions,
				locations = [];
			listings = [];

			if (!$.isArray(venues)) {
				venues = [venues];
			}

			if (!$.isArray(events)) {
				events = [events];
			}

			if (!$.isArray(destinations)) {
				destinations = [destinations];
			}

			var eventOptions,
				search = [];

			$.each(venues.concat(events), function (index, value) {
				eventOptions = listingOptions;
				if (_.contains(config.modules, 'event_list')) {
					delete eventOptions.start;
					delete eventOptions.end;
				}
				search.push({
					uri     : value,
					options : eventOptions
				});
			});
			var destinationOptions;
			$.each(destinations, function (index, value) {
				destinationOptions = listingOptions;
				if ($.isPlainObject(value)) {
					if (value.lat && value.lng) {
						destinationOptions.lat = value.lat;
						destinationOptions.lng = value.lng;
					} else if (value.destination) {
						destinationOptions.destination = value.destination;
					}
				} else {
					destinationOptions.destination = value;
				}
				search.push({
					uri     : 'search',
					options : destinationOptions
				});
			});

			if (search.length === 0) {
				$.each(config.location.center, function (index, value) {
					listingOptions[index] = value;
				});
				search.push({
					uri     : 'search',
					options : listingOptions
				});
			}

			$.each(search, function (index, value) {
				$.ajax('//api.parkwhiz.com/' + value.uri, {
					dataType : 'jsonp',
					data     : value.options,
					cache    : true,
					success  : function (searchResults) {
						if (_.isEmpty(config.location.center)) {
							var allOptions = {
								map : {
									options : $.extend({center : [searchResults.lat,searchResults.lng]}, config.mapOptions)
								},
								marker : {}
							};
							config.location.center = {
								lat : searchResults.lat,
								lng : searchResults.lng
							};
							if (config.showLocationMarker) {
								allOptions.marker.latLng = allOptions.map.latLng;
							}

							allOptions = $.extend(allOptions, config.overrideOptions);

							$el.gmap3(allOptions);
						}
						if (searchResults.parking_listings) {
							listings = listings.concat(searchResults.parking_listings);
							locations.push(searchResults);
						} else if (searchResults.events) {
							var api_url,
								$events = $('#parkwhiz-widget-container').find('ul.events'),
								$event,
								default_event = null,
								$active_event = $events.find('li.active');
							if ($active_event.length) {
								default_event = $active_event.data('event_id');
							} else if (config.location.defaultEvent) {
								default_event = config.location.defaultEvent;
							}
							$events.empty();
							$.each(searchResults.events, function (index, event) {
								$event = $('<li>' + moment(event.start * 1000).format(DATEPICKER_FORMAT) + ': ' + event.event_name + '</li>');
								$event.data('event_id', event.event_id);
								if (default_event && parseInt(event.event_id, 10) === parseInt(default_event, 10)) {
									api_url = event.api_url;
									$event.addClass('active');
								}
								$events.append($event);
							});
							if (!api_url) {
								api_url = searchResults.events[0].api_url;
								$events.find('li:first').addClass('active');
							}
							delete value.options.start;
							delete value.options.end;
							$.ajax(api_url, {
								dataType : 'jsonp',
								data     : value.options,
								cache    : true,
								success  : function (eventResults) {
									locations.push(eventResults);

									listings = listings.concat(eventResults.parking_listings);

									if (locations.length === search.length) {
										callback();
									}
								}
							});
							var $li = $events.find('li');
							$li.click(function () {
								_clearMap();
								var $this = $(this);
								$li.removeClass('active').unbind('click');
								$this.addClass('active');
								plugin._getListings(_putListingsOnMap);
							});
						}
						if (locations.length === search.length) {
							callback();
						}
					}
				});
			});
		};

		/**
		 * Create map inside container
		 * @private
		 */
		plugin._createMap = function () {
			this.$el.width(config.width);
			this.$el.height(config.height);

			var mapOptions = {
				options : config.mapOptions
			};

			var markerOptions = {};
			if (config.location.center.destination) {
				mapOptions.address = config.location.center.destination;
				if (config.showLocationMarker) {
					markerOptions.address = mapOptions.address;
				}
			} else if (config.location.center.lat && config.location.center.lng) {
				mapOptions.latLng = [
					config.location.lat,
					config.location.lng
				];
				if (config.showLocationMarker) {
					markerOptions.latLng = mapOptions.latLng;
				}
			}

			var allOptions = $.extend({}, { map : mapOptions, marker : markerOptions }, config.overrideOptions);
			this.$el.gmap3(allOptions);

			this._getListings(_putListingsOnMap);
		};

		/**
		 * Refresh map with listings generated by _getListings.
		 * @private
		 */
		var _putListingsOnMap = function () {
			var $el = plugin.$el;

			var $events = $('.mod').find($('ul.location-place'));

			var values = [];

			for (var i = 0; i < listings.length; i++) {
				if (listings[i].price) {
					var icon = _getIcons(listings[i].price);

					if (config.additionalMarkers) {
						icon.normal = config.additionalMarkers;
					}
					values.push({
						latLng  : [ listings[i].lat, listings[i].lng ],
						data    : { listing : listings[i], icon : icon },
						options : {
							icon    : icon.normal,
							shadow  : plugin._iconMeta.shadow,
							visible : true,
							zIndex  : 997
						},
						tag     : 'listing'
					});
					$events.append($('<li><a href="' + listings[i].parkwhiz_url + '">' + listings[i].address + '</a></li>'));
				}
			}

			var mapOptions = {
				marker : {
					values : values,
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
			};

			$el.gmap3(mapOptions);

		};

		/**
		 * Given an icon code and a color, return the offset for the icon sprite to be displayed.
		 * @param icon
		 * @param color
		 * @returns {google.maps.Point}
		 * @private
		 */
		var _spriteCoordinates = function (icon, color) {
			if (icon === 'p') {
				if (color === 'active') {
					return new google.maps.Point(56, 693);
				} else {
					return new google.maps.Point(0, 693);
				}
			} else if (icon === 'number_shadow') {
				return new google.maps.Point(396, 23);
			} else if (icon === 'p_shadow') {
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
				if (color === 'active') {
					top += 339;
				}

				var left = ((double_digits % 10) + (10 * hundreds)) * 38;
				return new google.maps.Point(left, top);
			}

		};

		plugin._iconCache = {};
		var _getIcons = function (dollars) {
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

				if (!config.showPrice) {
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
		plugin._createMap();
	};

	/**
	 * pairs all start datetimes in a container with end datetimes so that a valid time range is always available.
	 */
	var init_datepair = function () {
		var container = $(this);

		var startDateInput = container.find('input.start.date');
		var endDateInput = container.find('input.end.date');
		var dateDelta = moment.duration(0, "days");

		if (startDateInput.length && endDateInput.length) {
			var startDate = moment(startDateInput.val(), DATEPICKER_FORMAT);
			var endDate = moment(endDateInput.val(), DATEPICKER_FORMAT);
			dateDelta = endDate.diff(startDate, 'days');


			container.data('dateDelta', dateDelta);
		}

		var startTimeInput = container.find('input.start.time');
		var endTimeInput = container.find('input.end.time');

		if (startTimeInput.length && endTimeInput.length) {
			var startInt = startTimeInput.timepicker('getSecondsFromMidnight');
			var endInt = endTimeInput.timepicker('getSecondsFromMidnight');

			container.data('timeDelta', endInt - startInt);

			if (dateDelta < 1) {
				endTimeInput.timepicker('option', 'minTime', startInt);
			}
		}
	};

	/**
	 * Update date pair and time pair
	 */
	$.fn.update_datepair = function () {
		var target = $(this);
		var container = target.closest('.datepair');

		if (target.hasClass('date')) {
			_update_date_pair(target, container);

		} else if (target.hasClass('time')) {
			_update_time_pair(target, container);
		}
	};

	var _update_date_pair = function (target, container) {
		var start = container.find('input.start.date');
		var end = container.find('input.end.date');

		if (!start.length || !end.length) {
			return;
		}

		var startDate = moment(start.val());
		var endDate = moment(end.val());
		var oldDelta = moment.duration(container.data('dateDelta'), 'days');

		if (oldDelta && target.hasClass('start')) {
			// lock the dates - update end date and return
			var newEnd = startDate;
			newEnd.add(oldDelta);
			end.val(newEnd.format(DATEPICKER_FORMAT)).datepicker('update');
			return;

		} else {
			// change the date delta. possibly update the timepicker settings
			var newDelta = endDate.diff(startDate, 'days');

			if (newDelta < 0) {
				newDelta = 0;
				if (target.hasClass('start')) {
					end.val(startDate.format(DATEPICKER_FORMAT)).datepicker('update');
				}
			} else if (newDelta < 1) {
				var startTimeVal = container.find('input.start.time').val();

				if (startTimeVal) {
					container.find('input.end.time').timepicker('option', {'minTime' : startTimeVal});
				}
			} else {
				container.find('input.end.time').timepicker('option', {'minTime' : null});
			}

			container.data('dateDelta', newDelta);
		}
	};

	var _update_time_pair = function (target, container) {
		var start = { el : container.find('input.start.time') };
		var end = { el : container.find('input.end.time') };

		if (!start.el.length || !end.el.length) {
			return;
		}

		start.seconds = start.el.timepicker('getSecondsFromMidnight');
		end.seconds = end.el.timepicker('getSecondsFromMidnight');

		if (start.seconds === null || end.seconds === null) {
			return;
		}

		var oldDelta = container.data('timeDelta');
		var dateDelta = container.data('dateDelta');
		var newDelta = end.seconds - start.seconds;

		if (target.hasClass('start')) {
			if (!dateDelta || dateDelta < 1) {
				end.el.timepicker('option', 'minTime', start.seconds);
			} else {
				end.el.timepicker('option', 'minTime', null);
			}
		}

		// advance the end time only if the start time was advanced
		if (oldDelta && target.hasClass('start') && newDelta < oldDelta) {
			end.seconds = (start.seconds + oldDelta) % 86400;
			end.el.timepicker('setTime', end.seconds);
		}

		container.data('timeDelta', end.seconds - start.seconds);

		var endDateAdvance = moment.duration(0, "days");
		if (end.seconds - start.seconds <= 0 && (!oldDelta || oldDelta > 0)) {
			// overnight time span. advance the end date 1 day
			endDateAdvance = moment.duration(1, "days");

		} else if (end.seconds - start.seconds > 0 && oldDelta < 0 && target.hasClass('end')) {
			// switching from overnight to same-day time span. decrease the end date 1 day
			endDateAdvance = moment.duration(-1, "days");
		}

		var startInput = container.find('.start.date');
		var endInput = container.find('.end.date');

		if (startInput.val() && !endInput.val()) {
			endInput.datepicker('setValue', startInput.val());
			dateDelta = 0;
			container.data('dateDelta', 0);
		}

		if (endDateAdvance !== 0) {
			if (dateDelta || dateDelta === 0) {
				var newEnd = moment(endInput.val(), DATEPICKER_FORMAT).add(endDateAdvance);

				endInput.val(newEnd.format(DATEPICKER_FORMAT)).datepicker('update');
				container.data('dateDelta', dateDelta + endDateAdvance.asDays());
			}
		}
	};

})(jQuery);
