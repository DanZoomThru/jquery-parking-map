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
	var config;
	var DATEPICKER_FORMAT = 'M/D/YYYY';
	var TIMEPICKER_FORMAT = 'h:mma';
	$.parkingMap = function ($cnt, options) {

		var defaultConfig = {
			additionalMarkers  : false,
			showEventList      : true,
			showLocationMarker : true,
			loadFirstEvent     : false,
			showPrice          : true,
			event              : [],
			width              : '600px',
			height             : '400px',
			showChosenEvent    : false,
			modules            : ['map', 'time_picker'],
			defaultTime        : {
				start : moment().unix(),
				end   : moment().add('h', 3).unix(), // + 3 hrs
				hours : 3
			},
			center             : {
				destination : '208 S. Jefferson St., Chicago, IL'
			},
			location           : {
				destination : [],
				venue       : []
			},
			parkwhizKey        : 'd4c5b1639a3e443de77c43bb4d4bc888',
			overlays           : [],
			styles             : [],
			mapOptions         : {
				zoom : 14
			},
			overrideOptions	: {}
		};

		var $el = $cnt;

		config = $.extend({}, defaultConfig, options);
		config.defaultTime = $.extend({}, defaultConfig.defaultTime, options.defaultTime);
		config.location = $.extend({}, defaultConfig.location, options.location);
		config.mapOptions = $.extend({}, defaultConfig.mapOptions, options.mapOptions);
		config.center = $.extend({}, defaultConfig.center, options.center);

		var fix = new Date();
		var fixTimeZone = (fix.getTimezoneOffset() - 300) * -60;

		if(config.defaultTime.start) {
			config.defaultTime.start += fixTimeZone;
		}

		if(config.defaultTime.end) {
			config.defaultTime.end += fixTimeZone;
		}

		var listings = [];

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

			var start = moment().add('m', 15);
			var end = moment().add('m', 195);

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

			plugin.searchOptions();

			$('.start.time').val(start.format(TIMEPICKER_FORMAT));
			$('.end.time').val(end.format(TIMEPICKER_FORMAT));
			$('.start.date').val(start.format(DATEPICKER_FORMAT));
			$('.end.date').val(end.format(DATEPICKER_FORMAT));

			$('input.date').each(function(){
				var $this = $(this);
				if (!$this.attr('placeholder')) $this.attr('placeholder', 'date');

				var opts = { 'format': 'm/d/yyyy', 'autoclose': true };

				$this.datepicker(opts);

				if ($this.hasClass('start') || $this.hasClass('end')) {
					$this.on('change changeDate', $this.update_datepair);
				}
			});

			$('input.time').each(function() {
				var $this = $(this);
				if (!$this.attr('placeholder')) $this.attr('placeholder', 'time');

				var opts = { 'showDuration': true, 'timeFormat': 'g:ia', 'scrollDefaultNow': true };

				if ($this.hasClass('start') || $this.hasClass('end')) {
					$this.on('change', function() {
						$this.update_datepair();
					});
				}

				$this.timepicker(opts);
			});

			var $datepair = $('.datepair');

			$datepair.find('input').each(function() {
				var $this = $(this);

				if($this.hasClass('start') || $this.hasClass('end')) {
					$this.on('change', function() {
						var container = $this.closest('.datepair');
						var $start = container.find('.datepair-start');
						var $end = container.find('.datepair-end');
						var start = moment($start.find('.date').val() + ' ' + $start.find('.time').val(), "MM-DD-YYYY h:mma");
						var end = moment($end.find('.date').val() + ' ' + $end.find('.time').val(),  "MM-DD-YYYY h:mma");
						searchOptions.start = start.unix() + fixTimeZone;
						searchOptions.end = end.unix() + fixTimeZone;
						_clearMap();
						plugin._getListings(_putListingsOnMap);
					});
				}
			});

			$datepair.each(init_datepair);
		};

		plugin._getListings = function (callback) {
			var venues = config.location.venue,
				events = config.event,
				destinations = config.location.destination,
				listingOptions = searchOptions,
				locations = [];
			listings = []

			if (!$.isArray(venues)) {
				venues = [venues];
			}

			if (!$.isArray(events)) {
				events = [events];
			}

			if (!$.isArray(destinations)) {
				destinations = [destinations];
			}

			var search = [];

			$.each(venues.concat(events), function(index, value) {
				search.push({
					uri : value,
					options : listingOptions
				})
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
					uri: 'search',
					options: destinationOptions
				})
			});

			if (search.length === 0) {
				$.each(config.center, function (index, value) {
					listingOptions[index] = value;
				});
				search.push({
					uri: 'search',
					options: listingOptions
				});
			}

			$.each(search, function (index, value) {
				$.ajax('//api.parkwhiz.com/' + value.uri, {
					dataType : 'jsonp',
					data     : value.options,
					success  : function (searchResults) {
						locations.push(searchResults);
						listings = listings.concat(searchResults.parking_listings);
						if (locations.length === search.length) {
							callback();
						}
					}
				});
			});
		};

		plugin.createMap = function () {
			this.$el.width(config.width);
			this.$el.height(config.height);

			var mapOptions = {
				options : config.mapOptions
			};

			var markerOptions = {};
			if (config.center.destination) {
				mapOptions.address = config.center.destination;
				if (config.showLocationMarker) {
					markerOptions.address = mapOptions.address;
				}
			} else if (config.center.lat && config.center.lng) {
				mapOptions.latLng = [
					config.location.lat,
					config.location.lng
				];
				if (config.showLocationMarker) {
					markerOptions.latLng = mapOptions.latLng;
				}
			}


			var allOptions = $.extend({}, { map : mapOptions, marker: markerOptions }, config.overrideOptions);
			this.$el.gmap3(allOptions);

			this._getListings(_putListingsOnMap);
		};

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

		plugin.searchOptions = function () {
			if (typeof searchOptions == "undefined") {
				searchOptions = {};
			}

			searchOptions.key = this.settings.parkwhizKey;

			if (( config.location.destination || config.location.lat ) && ( !searchOptions.start && config.defaultTime.start )) {
				searchOptions.start = 1800*Math.round(config.defaultTime.start/1800);
			}

			if (( config.location.destination || config.location.lat ) && ( !searchOptions.end && config.defaultTime.end )) {
				searchOptions.end = 1800*Math.round(config.defaultTime.end/1800);
			}

			if (!searchOptions.start && !config.location.venue) {
				searchOptions.start = moment().unix();
			}

			if (!searchOptions.end && !config.location.venue) {
				searchOptions.end = searchOptions.start + config.defaultTime.hours * 60 * 60; // 3 hrs
			}
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
	};



	var init_datepair = function()
	{
		var container = $(this);

		var startDateInput = container.find('input.start.date');
		var endDateInput = container.find('input.end.date');
		var dateDelta = moment.duration(0, "days");

		if (startDateInput.length && endDateInput.length) {
			var startDate = moment(startDateInput.val(), DATEPICKER_FORMAT);
			var endDate =  moment(endDateInput.val(), DATEPICKER_FORMAT);
			dateDelta = moment.duration(endDate.unix() - startDate.unix());

			container.data('dateDelta', dateDelta.asDays());
		}

		var startTimeInput = container.find('input.start.time');
		var endTimeInput = container.find('input.end.time');

		if (startTimeInput.length && endTimeInput.length) {
			var startInt = startTimeInput.timepicker('getSecondsFromMidnight');
			var endInt = endTimeInput.timepicker('getSecondsFromMidnight');

			container.data('timeDelta', endInt - startInt);

			if (dateDelta.asDays() < 1) {
				endTimeInput.timepicker('option', 'minTime', startInt);
			}
		}
	};

	$.fn.update_datepair = function()
	{
		var target = $(this);
		var container = target.closest('.datepair');

		if (target.hasClass('date')) {
			_update_date_pair(target, container);

		} else if (target.hasClass('time')) {
			_update_time_pair(target, container);
		}
	};

	var _update_date_pair = function(target, container)
	{
		var start = container.find('input.start.date');
		var end = container.find('input.end.date');

		if (!start.length || !end.length) {
			return;
		}

		var startDate = moment(start.val());
		var endDate =  moment(end.val());

		var oldDelta = moment.duration(container.data('dateDelta'));

		if (oldDelta && target.hasClass('start')) {
			// lock the dates - update end date and return
			var newEnd = moment(startDate.unix()).add(oldDelta);
			end.val(newEnd.format(DATEPICKER_FORMAT)).datepicker('update');
			return;

		} else {
			// change the date delta. possibly update the timepicker settings
			var newDelta = moment.duration(endDate.unix() - startDate.unix());

			if (newDelta < 0) {
				newDelta = 0;

				if (target.hasClass('start')) {
					end.val(startDate.format(DATEPICKER_FORMAT)).datepicker('update');
				} else if (target.hasClass('end')) {
					start.val(endDate.format(DATEPICKER_FORMAT)).datepicker('update');
				}
			} else if (newDelta.asDays() < 1) {
				var startTimeVal = container.find('input.start.time').val();

				if (startTimeVal) {
					container.find('input.end.time').timepicker('option', {'minTime': startTimeVal});
				}
			} else {
				container.find('input.end.time').timepicker('option', {'minTime': null});
			}

			container.data('dateDelta', newDelta.asSeconds());
		}
	};

	var _update_time_pair = function(target, container)
	{
		var start = { el: container.find('input.start.time') };
		var end = { el: container.find('input.end.time') };

		if (!start.el.length || !end.el.length) {
			return;
		}

		start.seconds = start.el.timepicker('getSecondsFromMidnight');
		end.seconds = end.el.timepicker('getSecondsFromMidnight');

		if (start.seconds === null || end.seconds === null) {
			return;
		}

		// if (end.seconds <= start.seconds) {
		// 	end.seconds += 86400;
		// }

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
			end.seconds = (start.seconds+oldDelta)%86400;
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

		if (endDateAdvance != 0) {
			if (dateDelta || dateDelta === 0) {
				var newEnd = moment(endInput.val(), DATEPICKER_FORMAT).add(endDateAdvance);

				endInput.val(newEnd.format(DATEPICKER_FORMAT)).datepicker('update');
				container.data('dateDelta', dateDelta + endDateAdvance.asDays());
			}
		}
	};

})(jQuery);
