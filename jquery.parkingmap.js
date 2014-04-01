/**
*
*  @module pwMap
*  @author ParkWhiz.com
*  jquery.parkingmap.js : v1.0.0
*  https://github.com/ParkWhiz/jquery-parking-map
*  Copyright (c) 2014 ParkWhiz, Inc.
*  MIT licensed
*
*  Usage:
*
*    $("#parkwhiz-widget-container").parkingMap({
*      width: '400px',
*      height: '300px',
*      location {
*      }
*    });
*
*/
;(function ( $ ) {
	if (!$.pwMap) {
		$.pwMap = {};
	}

	$.pwMap.parkingMap = function ( el, options ) {
		var base = this;
		var DATEPICKER_FORMAT = 'M/D/YYYY';
		var TIMEPICKER_FORMAT = 'h:mma';

		base.$el = $(el);
		base.el = el;

		base.$el.data( "pwMap.parkingMap" , base );

		base.listings = [];
		base.searchOptions = {};

		base._iconCache = {};

		base.module_template = {
			'map'               : $('<div class="parking-map-widget-container mod"></div>'),
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
					// Still cleaning this up... -Zach
					'<p class="form-help">ParkWhiz passes are valid for the entire event, even if the event runs late. You also have plenty of time before and after to get to and from your car. However, if you have additional plans (like dinner) be sure to book extra time.</p>' +
					//'<p class="form-help">Change the start and end times below to when you\'ll need parking.</p>' +
					'<div class="datepair">' +
					'<div class="datepair-start">' +
					'<strong>From:</strong>' +
					'<input type="text" class="time start" /> on ' +
					'<input type="text" class="date start" />' +
					'</div>' +
					'<div class="datepair-end">' +
					'<strong>To:</strong>' +
					'<input type="text" class="time end" /> on ' +
					'<input type="text" class="date end" />' +
					'</div>' +
					'</div>' +
					'</div>'
			)
		};

		base.$el.append('<a href="http://www.parkwhiz.com/" target="_blank" title="Powered by ParkWhiz" class="powered-by-pw">Powered by <span>ParkWhiz</span></a>');

		base.settings = {
			HDPI : (window.retina || window.devicePixelRatio > 1)
		};

		if (base.settings.HDPI) {
			$.extend(base.settings, {
				MAIN_SPRITE             : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/parkwhiz-sprite@2x.png',
				EXTENDED_SPRITE_101_300 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-101-300@2x.png',
				EXTENDED_SPRITE_301_500 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-301-500@2x.png',
				EXTENDED_SPRITE_501_700 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-501-700@2x.png',
				EXTENDED_SPRITE_701_900 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-701-900@2x.png',
				EXTENDED_SPRITE_901_999 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-901-999@2x.png'
			});
		} else {
			$.extend(base.settings, {
				MAIN_SPRITE             : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/parkwhiz-sprite.png',
				EXTENDED_SPRITE_101_300 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-101-300.png',
				EXTENDED_SPRITE_301_500 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-301-500.png',
				EXTENDED_SPRITE_501_700 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-501-700.png',
				EXTENDED_SPRITE_701_900 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-701-900.png',
				EXTENDED_SPRITE_901_999 : 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/map-price-sprite-extended-901-999.png'
			});
		}

		base.init = function () {
			base.options = $.extend({},
				$.pwMap.parkingMap.defaultOptions, options);
			base.options.defaultTime = $.extend({},
				$.pwMap.parkingMap.defaultOptions.defaultTime, options.defaultTime);
			base.options.location = $.extend({},
				$.pwMap.parkingMap.defaultOptions.location, options.location);
			base.options.mapOptions = $.extend({},
				$.pwMap.parkingMap.defaultOptions.mapOptions, options.mapOptions);
			base.options.location.center = $.extend({},
				$.pwMap.parkingMap.defaultOptions.location.center, options.location.center);

			var fix = new Date(),
				fixTimeZone = (fix.getTimezoneOffset() - 300) * -60;

			if (base.options.defaultTime.start) {
				base.options.defaultTime.start += fixTimeZone;
			}

			if (base.options.defaultTime.end) {
				base.options.defaultTime.end += fixTimeZone;
			}

			base.$el.addClass('parkwhiz-widget-container').width(base.options.width).empty();
			$.each(base.options.modules, function (index, module) {
				base.$el.append(base.module_template[module]);
			});

			base.$map = base.$el.find('.parking-map-widget-container');

			var iconSize = new google.maps.Size(38, 33);

			if (base.options.showPrice === false) {
				iconSize = new google.maps.Size(53, 43);
			}

			base._iconMeta = {
				size   : iconSize, //new google.maps.Size(38,33), // 38, 33 (normal for P - 53, 43);
				shadow : {
					url        : base.settings.MAIN_SPRITE,
					size       : new google.maps.Size(53, 23),
					origin     : base._spriteCoordinates('number_shadow'),
					anchor     : new google.maps.Point(20, 23),
					scaledSize : null
				}
			};

			if (base.settings.HDPI) {
				base._iconMeta.shadow.scaledSize = new google.maps.Size(477, 1098);
			}

			base.searchOptions.key = base.options.parkwhizKey;

			if(base.options.modules.indexOf("time_picker") > -1) {

				var start = moment.unix(base.options.defaultTime.start).add('m', 15);
				var end = moment.unix(base.options.defaultTime.end).add('m', 15);

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
							base.searchOptions.start = start.unix() + fixTimeZone;
							base.searchOptions.end = end.unix() + fixTimeZone;
							base._clearMap();
							base._getListings(_putListingsOnMap);
						});
					}
				});

				$datepair.each(base.init_datepair);
			}

			base._createMap();
		};

		/**
		 * Removes all parking locations from the map.
		 *
		 * @private
		 */
		base._clearMap = function () {
			$('#parking-popup').remove();
			$('.psf').remove();
			$('.location-place').html('');
			base.$map.gmap3('clear');
		};

		/**
		 * Pulls listings from ParkWhiz API based on configuration.
		 *
		 * @param callback The function to be called after listings are loaded.
		 * @private
		 */
		base._getListings = function (callback) {
			var venues = base.options.location.venue,
				events = base.options.location.event,
				destinations = base.options.location.destination,
				listingOptions = base.searchOptions,
				locations = [];
			base.listings = [];

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
				if (_.contains(base.options.modules, 'event_list')) {
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
				$.each(base.options.location.center, function (index, value) {
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
					error    : function (jqXHR, textStatus, errorThrown) {

					},
					success  : function (searchResults) {
						if (_.isEmpty(base.options.location.center)) {
							var allOptions = {
								map : {
									options : $.extend({center : [searchResults.lat,searchResults.lng]}, base.options.mapOptions)
								},
								marker : {}
							};
							base.options.location.center = {
								lat : searchResults.lat,
								lng : searchResults.lng
							};
							if (base.options.showLocationMarker) {
								allOptions.marker.latLng = allOptions.map.latLng;
							}

							allOptions = $.extend(allOptions, base.options.overrideOptions);

							base.$map.gmap3(allOptions);
						}
						if (searchResults.parking_listings) {
							base.listings = base.listings.concat(searchResults.parking_listings);
							locations.push(searchResults);
						} else if (searchResults.events) {
							var api_url,
								$events = base.$el.find('ul.events'),
								$event,
								default_event = null,
								$active_event = $events.find('li.active');
							if ($active_event.length) {
								default_event = $active_event.data('event_id');
							} else if (base.options.location.defaultEvent) {
								default_event = base.options.location.defaultEvent;
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

									base.listings = base.listings.concat(eventResults.parking_listings);

									if (locations.length === search.length) {
										callback();
									}
								}
							});
							var $li = $events.find('li');
							$li.click(function () {
								base._clearMap();
								var $this = $(this);
								$li.removeClass('active').unbind('click');
								$this.addClass('active');
								base._getListings(base._putListingsOnMap);
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
		base._createMap = function () {
			base.$map.width(base.options.width);
			base.$map.height(base.options.height);

			var mapOptions = {
					options : base.options.mapOptions
				},
				markerOptions = {};

			if (base.options.location.center.destination) {
				mapOptions.address = base.options.location.center.destination;
				if (base.options.showLocationMarker) {
					markerOptions.address = mapOptions.address;
				}
			} else if (base.options.location.center.lat && base.options.location.center.lng) {
				mapOptions.latLng = [
					base.options.location.lat,
					base.options.location.lng
				];
				if (base.options.showLocationMarker) {
					markerOptions.latLng = mapOptions.latLng;
				}
			}

			var allOptions = $.extend({}, { map : mapOptions, marker : markerOptions }, base.options.overrideOptions);

			base.$map.gmap3(allOptions);
			base._getListings(base._putListingsOnMap);
		};


		/**
		 * Refresh map with listings generated by _getListings.
		 * @private
		 */
		base._putListingsOnMap = function () {
			var $events = $('.mod').find($('ul.location-place')),
				values = [];

			for (var i = 0; i < base.listings.length; i++) {
				if (base.listings[i].price) {
					var icon = base._getIcons(base.listings[i].price);

					if (base.options.additionalMarkers) {
						icon.normal = base.options.additionalMarkers;
					}
					values.push({
						latLng  : [ base.listings[i].lat, base.listings[i].lng ],
						data    : { listing : base.listings[i], icon : icon },
						options : {
							icon    : icon.normal,
							shadow  : base._iconMeta.shadow,
							visible : true,
							zIndex  : 997
						},
						tag     : 'listing'
					});
					$events.append($('<li><a href="' + base.listings[i].parkwhiz_url + '">' + base.listings[i].address + '</a></li>'));
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

			base.$map.gmap3(mapOptions);
		};


		/**
		 * Given an icon code and a color, return the offset for the icon sprite to be displayed.
		 * @param icon
		 * @param color
		 * @returns {google.maps.Point}
		 * @private
		 */
		base._spriteCoordinates = function (icon, color) {
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

		base._getIcons = function (dollars) {
			if (!base._iconCache[dollars]) {
				var sprite, scaledSize;

				if (dollars <= 100) {
					sprite = base.settings.MAIN_SPRITE;
					scaledSize = new google.maps.Size(477, 1098);
				} else if (dollars > 100 && dollars <= 300) {
					sprite = base.settings.EXTENDED_SPRITE_101_300;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 300 && dollars <= 500) {
					sprite = base.settings.EXTENDED_SPRITE_301_500;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 500 && dollars <= 700) {
					sprite = base.settings.EXTENDED_SPRITE_501_700;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 700 && dollars <= 900) {
					sprite = base.settings.EXTENDED_SPRITE_701_900;
					scaledSize = new google.maps.Size(760, 680);
				} else if (dollars > 900) {
					sprite = base.settings.EXTENDED_SPRITE_901_999;
					scaledSize = new google.maps.Size(380, 680);
				}

				if (!base.options.showPrice) {
					base._iconCache[dollars] = {
						'normal' : {
							url        : sprite,
							size       : base._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (new google.maps.Point(0, 693))
						},
						'active' : {
							url        : sprite,
							size       : base._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (new google.maps.Point(56, 693) )
						}
					}
				} else {
					base._iconCache[dollars] = {
						'normal' : {
							url        : sprite,
							size       : base._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (dollars === 0 ? new google.maps.Point(380, 645) : base._spriteCoordinates(dollars, 'normal') )
						},
						'active' : {
							url        : sprite,
							size       : base._iconMeta.size,
							scaledSize : scaledSize,
							origin     : (dollars === 0 ? new google.maps.Point(418, 645) : base._spriteCoordinates(dollars, 'active') )
						}
					}
				}

			}

			return base._iconCache[dollars];
		};

		/**
		 * pairs all start datetimes in a container with end datetimes so that a valid time range is always available.
		 */
		base.init_datepair = function () {
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

		base._update_date_pair = function (target, container) {
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

		base._update_time_pair = function (target, container) {
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

		base.init();
	};

	$.pwMap.parkingMap.defaultOptions = {
		parkwhizKey        : 'd4c5b1639a3e443de77c43bb4d4bc888',
		additionalMarkers  : false,
		showLocationMarker : true,
		showPrice          : true,
		width              : '100%',
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
		styles             : [],
		mapOptions         : {
			zoom : 14
		},
		overrideOptions    : {}
	};

	$.fn.pwMap_parkingMap = function
		( options ) {
		return this.each(function () {
			(new $.pwMap.parkingMap(this, options));
		});
	};

})( jQuery );
