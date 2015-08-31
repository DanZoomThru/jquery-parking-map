/**
*
*	@module pwMap
*	@author ParkWhiz.com
*	jquery.parkingmap.js : v2.0.1
*	https://github.com/ParkWhiz/jquery-parking-map
*	Copyright (c) 2014 ParkWhiz, Inc.
*	MIT licensed
*
*/
;(function ( $ ) {
	if (!$.pwMap) {
		$.pwMap = {};
	}
	$.pwMap.parkingMap = function (el, options) {
		var base = this,
			DATEPICKER_FORMAT = 'M/D/YYYY',
			TIMEPICKER_FORMAT = 'h:mma';
		base.$el = $(el);
		base.el = el;
		base.$el.data( "pwMap.parkingMap" , base );
		base.listings = [];
		base.LocationMarkers = [];
		base.searchOptions = {};
		base._iconCache = {};
		base.settings = {
			HDPI : (window.retina || window.devicePixelRatio > 1)
		};
		if (base.settings.HDPI) {
			$.extend(base.settings, {
				MAIN_SPRITE: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-1-100@2x.png',
				SPECIAL_SPRITE: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-special@2x.png',
				EXTENDED_SPRITE_101_300: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-101-300@2x.png',
				EXTENDED_SPRITE_301_500: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-301-500@2x.png',
				EXTENDED_SPRITE_501_700: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-501-700@2x.png',
				EXTENDED_SPRITE_701_900: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-701-900@2x.png',
				EXTENDED_SPRITE_901_999: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-901-999@2x.png'
			});
		} else {
			$.extend(base.settings, {
				MAIN_SPRITE: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-1-100.png',
				SPECIAL_SPRITE: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-special.png',
				EXTENDED_SPRITE_101_300: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-101-300.png',
				EXTENDED_SPRITE_301_500: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-301-500.png',
				EXTENDED_SPRITE_501_700: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-501-700.png',
				EXTENDED_SPRITE_701_900: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-701-900.png',
				EXTENDED_SPRITE_901_999: 'https://dbmgns9xjyk0b.cloudfront.net/parkingmapjs/images/new-markers/pw-map-sprite-901-999.png'
			});
		}

		base._init = function () {
			base.options = $.extend({}, $.pwMap.parkingMap.defaultOptions, options);
			base.options.defaultTime = $.extend({}, $.pwMap.parkingMap.defaultOptions.defaultTime, options.defaultTime);
			base.options.location = $.extend({}, $.pwMap.parkingMap.defaultOptions.location, options.location);
			base.options.mapOptions = $.extend({}, $.pwMap.parkingMap.defaultOptions.mapOptions, options.mapOptions);
			base.options.location.center = $.extend({}, $.pwMap.parkingMap.defaultOptions.location.center, options.location.center);
			var fix = new Date(),
				fixTimeZone = (fix.getTimezoneOffset() - 300) * -60;
			if (base.options.defaultTime.start) {
				base.options.defaultTime.start += fixTimeZone;
			}
			if (base.options.defaultTime.end) {
				base.options.defaultTime.end += fixTimeZone;
			}
			base.$el.addClass('parkwhiz-widget-container clearfix').css("width", base.options.width).empty();
			$.each(base.options.modules, function (index, module) {
				base.$el.append(base.options.moduleMarkup[module]);
			});
			base.$map = base.$el.find('.parking-map-widget-container');
			base._iconMeta = {
				size: new google.maps.Size(44, 76),
			};
			base.searchOptions.key = base.options.parkwhizKey;
			if (base.options.monthly) { base.searchOptions.monthly = 1; }
				var start = moment.unix(base.options.defaultTime.start).add('m', 15),
					end = moment.unix(base.options.defaultTime.end).add('m', 15);
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
				if(moment().isDST()) {
					start = start.subtract('h', 1);
					end = end.subtract('h', 1);
				}
				base.searchOptions.start = start.unix();
				base.searchOptions.end = end.unix();
			if (_.contains(base.options.modules, 'time_picker')) {
				base.$el.find('.start.time').val(start.format(TIMEPICKER_FORMAT));
				base.$el.find('.end.time').val(end.format(TIMEPICKER_FORMAT));
				base.$el.find('.start.date').val(start.format(DATEPICKER_FORMAT));
				base.$el.find('.end.date').val(end.format(DATEPICKER_FORMAT));
				base.$el.find('input.date').each(function () {
					var $this = $(this),
						opts = { format: 'm/d/yyyy', autoclose: true };
					if (!$this.attr('placeholder')) {
						$this.attr('placeholder', 'date');
					}
					if ($this.hasClass('start') || $this.hasClass('end')) {
						$this.on('change changeDate', $this._updateDatepair);
					}
					$this.datepicker(opts);
				});
				base.$el.find('input.time').each(function () {
					var $this = $(this);
					if (!$this.attr('placeholder')) {
						$this.attr('placeholder', 'time');
					}
					var opts = { 'showDuration' : true, 'className' : 'parkwhiz-widget-timepicker', 'timeFormat' : 'g:ia', 'scrollDefaultNow' : true };
					if ($this.hasClass('start') || $this.hasClass('end')) {
						$this.on('change', $this._updateDatepair);
					}
					$this.timepicker(opts);
				});
				var $datepair = base.$el.find('.datepair');
				$datepair.find('input').each(function () {
					var $this = $(this);
					if ($this.hasClass('start') || $this.hasClass('end')) {
						$this.on('change', function () {
							var container = $this.closest('.datepair'),
								$start = container.find('.datepair-start'),
								$end = container.find('.datepair-end'),
								start = moment($start.find('.date').val() + ' ' + $start.find('.time').val(), "MM-DD-YYYY h:mma"),
								end = moment($end.find('.date').val() + ' ' + $end.find('.time').val(), "MM-DD-YYYY h:mma");
							if(moment().isDST()) {
								start = start.subtract('h', 1);
								end = end.subtract('h', 1);
							}
							base.searchOptions.start = start.unix() + fixTimeZone;
							base.searchOptions.end = end.unix() + fixTimeZone;
							base._clearMap();
							base._getListings(base._putListingsOnMap);
						});
					}
				});
				$datepair.each(base._initDatepair);
			}
			base.$el.find('.mod:last-child').after('<a href="' + base._affiliateLink('http://www.parkwhiz.com/') + '" target="_blank" title="Powered by ParkWhiz" class="powered-by-pw">Powered by <span>ParkWhiz</span></a>');
			base._createMap();
		};

		/**
		* Transforms a link into an affiliate link if the affiliateCode was
		* set.  If no affiliateCode was set then it just returns the original link.
		*
		* @private
		*/
		base._affiliateLink = function(link) {
			if (base.options.affiliateCode !== null) {
				return link + ((/\?/.test(link) ? '&' : '?') + 'pwa=' + encodeURIComponent(base.options.affiliateCode));
			} else {
				return link;
			}
		};

		/**
		* Removes all parking locations from the map.
		*
		* @private
		*/
		base._clearMap = function () {
			base.LocationMarkers = [];
			base.$el.find('#parking-popup').remove();
			base.$el.find('.psf').remove();
			base.$el.find('.location-place').html('');
			base.$map.gmap3('clear');
		};

		/**
		* Pulls listings from ParkWhiz API based on configuration.
		*
		* @param callback The function to be called after listings are loaded.
		* @private
		*/
		base._getListings = function (callback, eventCall) {
			var venues = base.options.location.venue,
				events = base.options.location.event,
				destinations = base.options.location.destination,
				locations = [],
				search = [],
				eventList = [],
				default_event = null,
				i = 0;
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
			if(venues || events){
				$.each(venues.concat(events), function (index, value) {
					var eventOptions = [];
					eventOptions.push(base.searchOptions);
					eventOptions.push({
						no_event_301: 1,
					});
					if(!base.options.defaultTime) {
						delete eventOptions.start;
						delete eventOptions.end;
					}
					var searchOptions = $.extend({}, eventOptions[0], eventOptions[1]);
					search.push({
						uri: value,
						options: searchOptions
					});
				});
			}
			if(destinations){
				// Loop through each of the `destinations`
				$.each(destinations, function (index, value) {
					var listingOptions = [],
						pushToSearch = true;
					listingOptions.push(base.searchOptions);
					if ($.isPlainObject(value)) {
						if (value.lat && value.lng) {
							listingOptions.push({
								lat: value.lat,
								lng: value.lng
							});
						} else if (value.destination) {
							listingOptions.push({
								destination: value.destination
							});
						} else {
							// Something is really crumby about this plain object, lets not push this to search
							pushToSearch = false;
						}
					} else {
						// Push the `destination` to the `listingOptions`
						listingOptions.push({
							destination: value
						});
					}
					if(pushToSearch){
						// Are we allowed to push this to search?
						var searchOptions = $.extend({}, listingOptions[0], listingOptions[1]);
						search.push({
							uri: 'search',
							options: searchOptions
						});
					}
				});
			}

			$.each(search, function (index, searchQuery) {
				$.ajax('//api.parkwhiz.com/' + searchQuery.uri, {
					dataType: 'jsonp',
					data: searchQuery.options,
					cache: true,
					// beforeSend: function(jqXHR, settings) {
					// 	console.log(settings.url);
					// },
					success: function(searchResults) {
						i++;
						// Are there any results?
						if(searchResults){
							// Is there any result locations?
							if(searchResults.locations && searchResults.parking_listings || searchResults.events){
								base.LocationMarkers = base.LocationMarkers.concat({latLng: [searchResults.lat, searchResults.lng]});
								if(searchResults.parking_listings){
									$.each(searchResults.parking_listings, function(index, location) {
										location.parkwhiz_url = base._affiliateLink(location.parkwhiz_url);
										base.listings.push(location);
									});
									base.listings = _.uniq(base.listings, function(item, key) {
										return item.listing_id;
									});
								}
							} else {
								if(i == search.length == 1){
									base.LocationMarkers = base.LocationMarkers.concat({latLng: [searchResults.lat, searchResults.lng]});
								}
							}
							// Is there any events?
							if(searchResults.events && _.contains(base.options.modules, 'event_list')){
								if (_.contains(base.options.modules, 'event_list')) {
									if (_.contains(base.options.modules, 'time_picker')) {
										base.$el.find('.datepair, .datepair-end').hide();
										base.$el.find('.parking-timepicker-widget-container .form-help').html('ParkWhiz passes are valid for the entire event, even if the event runs late. You also have plenty of time before and after to get to and from your car. <strong>However, if you have additional plans be sure to <a href="' + base._affiliateLink('http://www.parkwhiz.com/') + '" target="_blank" title="ParkWhiz.com">book extra time via the ParkWhiz website &rarr;</a></strong>');
									}

									var api_url,
										$events = base.$el.find('.parking-events'),
										$event,
										pw_url = null,
										$active_event = $events.find('li.active');

									if ($active_event.length) {
										default_event = $active_event.data('event_id');
									} else if (base.options.location.defaultEvent) {
										default_event = base.options.location.defaultEvent;
									}

									base.$el.find('.event_list-mod h2').html(searchResults.num_events + ' Upcoming' + ((searchResults.num_events > 1) ? ' Events' : ' Event'));

									$.each(searchResults.events, function (index, event) {
										eventList.push(event);
									});
									eventList = _.uniq(eventList, function(item, key) {
										return item.event_id;
									});
									eventList = _.sortBy(eventList, function(item, key) {
										return item.start;
									});

									if (i === search.length) {
										$.when(
											$.each(eventList, function(index, event) {
												$event = $('<li>'+moment.unix(event.start).format(DATEPICKER_FORMAT)+': <span>'+event.event_name+'</span></li>');
												$event.data('event_id', event.event_id);
												$event.data('api_url', event.api_url);
												if (default_event && parseInt(event.event_id, 10) === parseInt(default_event, 10)) {
													api_url = event.api_url;
													$event.addClass('active');
												}
												if(!eventCall){
													$events.append($event);
												}
											})
										).then(function() {
											if(eventList.length > 1){
												$events.animate({height:175},300);
												$events.animate({scrollTop: 0}, 50, function(){
													var activeEvent = $events.find('li.active').position();
													if(!_.isUndefined(activeEvent)){
														$events.animate({scrollTop: activeEvent.top+'px'}, 600, function(){
															$events.clearQueue();
														});
													}
												});
											} else {
												$events.animate({height:43},300);
											}
										});

										if (!api_url) {
											api_url = eventList[0].api_url;
											$events.find('li:first').addClass('active');
										}

										delete searchQuery.options.start;
										delete searchQuery.options.end;

										// Change the timeframe help url to the api url
										if (_.contains(base.options.modules, 'time_picker')) {
											if(base.$el.find('.form-help a').length){
												pw_url = api_url.replace('api.parkwhiz.com', 'www.parkwhiz.com');
												$('.parking-timepicker-widget-container .form-help a').attr("href", pw_url);
											}
										}

										$.ajax(api_url, {
											dataType: 'jsonp',
											data: searchQuery.options,
											cache: true,
											// beforeSend: function(jqXHR, settings) {
											// 	console.log(settings.url);
											// },
											success: function (eventResults) {
												base._clearMap();
												base.listings = [];
												base.$el.find('.location-place').html('');
												// Is there any event locations?
												if(eventResults.locations && eventResults.parking_listings){
													if (eventResults.event_name && _.contains(base.options.modules, 'parking_locations')) {
														base.$el.find('.parking_locations-mod h2').text('Parking Locations for ' + eventResults.event_name);
													}
													for (var i = 0, eventResultsLoop = eventResults.parking_listings.length; i < eventResultsLoop; i++) {
														eventResults.parking_listings[i].parkwhiz_url = base._affiliateLink(eventResults.parking_listings[i].parkwhiz_url);
														base.listings.push(eventResults.parking_listings[i]);
													}
													base.listings = _.uniq(base.listings, function(item, key) {
														return item.listing_id;
													});
												}
												base.LocationMarkers = base.LocationMarkers.concat({latLng: [eventResults.lat, eventResults.lng]});
												callback();
											}
										});

										var $li = $events.find('li');
										$li.on('click', function() {
											var $this = $(this);
											base._clearMap();
											$li.removeClass('active');
											$li.off('click');
											$this.addClass('active');
											base._createMap(true);
										});
									}
								}
							} else {
								if (!searchResults.events && _.contains(base.options.modules, 'event_list')) {
									base.$el.find('.event_list-mod').slideUp().remove();
								}
								// Don't run the callback until all the ajax requests are done!
								if (i === search.length) {
									callback();
								}
							}
						}
					}
				});
			});
		};

		/**
		* Create map inside container
		* @private
		*/
		base._createMap = function (eventCall) {
			base.$map.width(base.options.width);
			base.$map.height(base.options.mapHeight);
			var mapOptions = {
					options: base.options.mapOptions
				},
				markerOptions = {},
				allOptions = $.extend({}, {
					map : mapOptions,
					marker : markerOptions
				}, base.options.overrideOptions);
			base.$map.gmap3(allOptions);
			base._getListings(base._putListingsOnMap, eventCall);
		};

		/**
		* Refresh map with listings generated by _getListings.
		* @private
		*/
		base._putListingsOnMap = function () {
			var $parkingLocationsDiv = base.$el.find('.location-place'),
				listings = base.listings,
				LocationMarkers = base.LocationMarkers,
				parkingMarkers = [],
				showLocationMarkers = [],
				locationMarkerBounds = new google.maps.LatLngBounds();

			if (!_.isEmpty(listings)) {
				// Monthly parking title
				if (base.options.monthly && _.contains(base.options.modules, 'parking_locations')) {
					base.$el.find('.parking_locations-mod h2').text('Monthly Parking Locations');
				}
				// Lets go through the parking location markers
				for (var i = 0, listingsLoop = listings.length; i < listingsLoop; i++) {
					var item = listings[i];
					if (item.price) {
						var icon = (item.available_spots <= 0 ? base._getIcons(0) : base._getIcons(item.price));
						parkingMarkers.push({
							latLng: [ item.lat, item.lng ],
							id: item.listing_id,
							data: { listing: item, icon: icon },
							options: {
								icon: icon.normal,
								visible: true,
								zIndex: base._zIndexFromLat(item.lat)
							},
							tag: 'listing'
						});
						// Only add locations to the list if there is a locations module
						if (_.contains(base.options.modules, 'parking_locations')) {
							// Check if the listing is sold out
							if(item.available_spots <= 0) {
								$parkingLocationsDiv.animate({height:175},600).append('<li><a href="'+item.parkwhiz_url+'" target="_blank" data-lat="'+item.lat+'" data-lng="'+item.lng+'" data-listing_id="'+item.listing_id+'" title="Parking for '+item.location_name+'">'+item.address+' <em>(Sold Out)</em></a></li>');
							} else {
								$parkingLocationsDiv.animate({height:175},600).append('<li><a href="'+item.parkwhiz_url+'" target="_blank" data-lat="'+item.lat+'" data-lng="'+item.lng+'" data-listing_id="'+item.listing_id+'" title="'+item.price_formatted+' Parking for '+item.location_name+'">'+item.address+' <em>('+item.price_formatted+')</em></a></li>');
							}
						}
					}
				}
			} else {
				if (_.contains(base.options.modules, 'parking_locations')) {
					$parkingLocationsDiv.append('<li class="no-parking-available"><em>Sorry, parking is currently not available at that time or location....</em></li>').animate({height:'43px'},600);
				}
			}

			// Make the list of locations interact with the map if they both exist & there is listings!
			if (!_.isEmpty(listings) && _.contains(base.options.modules, 'parking_locations') && _.contains(base.options.modules, 'map')) {
				if (_.isEmpty(base.options.location.center)) {
					$parkingLocationsDiv.find('li a').on({
						mouseover: function(){
							var lat = $(this).attr('data-lat'),
								lng = $(this).attr('data-lng');
							base.$map.gmap3({
								get: {
									name: "marker",
									id: $(this).attr('data-listing_id'),
									callback: function(marker){
										google.maps.event.trigger(marker, 'mouseover');
									}
								}
							});
							base.$map.gmap3('get').panTo(new google.maps.LatLng(lat,lng));
						},
						mouseout: function(){
							base.$map.gmap3({
								get: {
									name: "marker",
									id: $(this).attr('data-listing_id'),
									callback: function(marker){
										google.maps.event.trigger(marker, 'mouseout');
									}
								}
							});
						}
					});
				}
			}

			// Only do map stuff if there is a map on the widget
			if (_.contains(base.options.modules, 'map')) {
				// Lets go through the location markers
				for (var j = 0, LocationMarkersLoop = LocationMarkers.length; j < LocationMarkersLoop; j++) {
					var locMarker = LocationMarkers[j];
					showLocationMarkers.push({
						latLng: [locMarker.latLng[0], locMarker.latLng[1]]
					});
					var locationMarker = new google.maps.LatLng(locMarker.latLng[0], locMarker.latLng[1]);
					locationMarkerBounds.extend(locationMarker);
				}
				var mapOptions = {
					marker: {
						values: (base.options.showLocationMarkers ? parkingMarkers.concat(showLocationMarkers) : parkingMarkers), // Don't add the location markers to the markers array if we don't want them displayed
						events: {
							mouseover: function (marker, event, context) {
								if (context.data && context.data.icon) {
									marker.setZIndex(base._zIndexFromLat(0));
									marker.setIcon(context.data.icon.active);
								}
							},
							mouseout: function (marker, event, context) {
								if (context.data && context.data.icon) {
									marker.setZIndex(base._zIndexFromLat(marker.position.k));
									marker.setIcon(context.data.icon.normal);
								}
							},
							click: function (marker, event, context) {
								if (context.data && context.data.listing.parkwhiz_url) {
									window.open(context.data.listing.parkwhiz_url);
								}
							}
						}
					}
				};

				base.$map.gmap3(mapOptions);

				var getMap = base.$map.gmap3('get');

				getMap.fitBounds(locationMarkerBounds);

				// Let the user override the zoom level, if they want
				if(base.options.mapOptions.zoom){
					getMap.setZoom(base.options.mapOptions.zoom);
				}

				if (!_.isEmpty(listings)) {
					// Lets set the map zoom to make sure there is at least 1 marker showing. (good for when map is over-zoomed by default)
					base._setMapToShowMarkers(parkingMarkers);
				} else {
					getMap.setZoom(15);
				}

				// Let the user override the map centering
				base._overrideMapCentering();
			}
		};

		/**
		* Set the z-index from the lat provided
		* @param lat
		* @returns z-index number
		* @private
		*/
		base._zIndexFromLat = function (lat) {
			return Math.round((90 - lat) * 10000);
		};

		/**
		* Set the map center based on the user override
		* @private
		*/
		base._overrideMapCentering = function () {
			if (base.options.location.center.destination) {
				base.$map.gmap3({
					getlatlng: {
						address: base.options.location.center.destination,
						callback: function(results){
							if (!results) return;
							if(results[0].geometry.location) {
								base.$map.gmap3('get').setCenter(results[0].geometry.location);
							}
						}
					},
				});
			} else if (base.options.location.center.lat && base.options.location.center.lng) {
				var center = new google.maps.LatLng(base.options.location.center.lat,base.options.location.center.lng);
				base.$map.gmap3('get').setCenter(center);
			}
		};

		/**
		* Given an array of markers, set the map to make sure at least one is showing.
		* @param markers
		* @private
		*/
		base._setMapToShowMarkers = function (markers) {
			var getMap = base.$map.gmap3('get'),
				bounds = new google.maps.LatLngBounds(),
				markerIsInBounds = false,
				markerInBoundsCount = 0;

			bounds = getMap.getBounds();

			for (var i = 0, markersLoop = markers.length; i < markersLoop; i++) {
				var item = markers[i],
					marker = new google.maps.LatLng(item.latLng[0],item.latLng[1]);
				if(bounds.contains(marker)){
					markerIsInBounds = true;
					markerInBoundsCount++;
				}
			}

			// Keep zooming out until we have at least 3 locations shown
			if(!markerIsInBounds || (markerInBoundsCount < 3)){
				var newMapZoom = getMap.getZoom() - 1;
				getMap.setZoom(newMapZoom);
				base._setMapToShowMarkers(markers);
			}
		};

		/**
		* Given an icon code and a color, return the offset for the icon sprite to be displayed.
		* @param icon
		* @param color
		* @returns {google.maps.Point}
		* @private
		*/
		base._spriteCoordinates = function (icon, color) {
			if (icon == 'p') {
				if (color == 'active') {
					return new google.maps.Point(44, 0);
				} else {
					return new google.maps.Point(0, 0);
				}
			} else {
				// Number = dollar ammount (icon) minus 1 for the sprites
				var number = parseInt(icon) - 1;
				if (number >= 1000) {
					number = 999;
				}
				var double_digits = number % 100,
					hundreds = Math.floor(number / 100);
				if (hundreds > 0) {
					hundreds = (hundreds - 1) % 2;
				}
				var left = ((double_digits % 10) + (10 * hundreds)) * 44,
					top = Math.floor(double_digits / 10) * 76;
				if (color == 'active') {
					top += 760;
				}
				return new google.maps.Point(left, top);
			}
		};

		/**
		* Given a dollar amount, returns price icon
		* @param dollars
		* @private
		*/
		base._getIcons = function (dollars) {
			if (!base._iconCache[dollars]) {
				var sprite, scaledSize, normalOrigin, activeOrigin;
				if (dollars <= 100) {
					sprite = base.settings.MAIN_SPRITE;
					scaledSize = new google.maps.Size(440, 1520);
				} else if (dollars > 100 && dollars <= 300) {
					sprite = base.settings.EXTENDED_SPRITE_101_300;
					scaledSize = new google.maps.Size(880, 1520);
				} else if (dollars > 300 && dollars <= 500) {
					sprite = base.settings.EXTENDED_SPRITE_301_500;
					scaledSize = new google.maps.Size(880, 1520);
				} else if (dollars > 500 && dollars <= 700) {
					sprite = base.settings.EXTENDED_SPRITE_501_700;
					scaledSize = new google.maps.Size(880, 1520);
				} else if (dollars > 700 && dollars <= 900) {
					sprite = base.settings.EXTENDED_SPRITE_701_900;
					scaledSize = new google.maps.Size(880, 1520);
				} else if (dollars > 900) {
					sprite = base.settings.EXTENDED_SPRITE_901_999;
					scaledSize = new google.maps.Size(440, 1520);
				}
				// set sold out markers
				if (dollars === 0) {
					sprite = base.settings.SPECIAL_SPRITE;
					scaledSize = new google.maps.Size(176, 76);
					normalOrigin = new google.maps.Point(88, 0);
					activeOrigin = new google.maps.Point(132, 0);
				} else {
					normalOrigin = base._spriteCoordinates(dollars, 'normal');
					activeOrigin = base._spriteCoordinates(dollars, 'active');
				}
				if (!base.options.showPrice) {
					scaledSize = new google.maps.Size(176, 76);
					base._iconCache[dollars] = {
						'normal': {
							url: base.settings.SPECIAL_SPRITE,
							size: base._iconMeta.size,
							scaledSize: scaledSize,
							origin: base._spriteCoordinates('p', 'normal')
						},
						'active': {
							url: base.settings.SPECIAL_SPRITE,
							size: base._iconMeta.size,
							scaledSize: scaledSize,
							origin: base._spriteCoordinates('p', 'active')
						}
					};
				} else {
					base._iconCache[dollars] = {
						'normal': {
							url: sprite,
							size: base._iconMeta.size,
							scaledSize: scaledSize,
							origin: normalOrigin
						},
						'active': {
							url: sprite,
							size: base._iconMeta.size,
							scaledSize: scaledSize,
							origin: activeOrigin
						}
					};
				}

			}
			return base._iconCache[dollars];
		};

		/**
		* pairs all start datetimes in a container with end datetimes so that a valid time range is always available.
		*/
		base._initDatepair = function () {
			var $container = $(this),
				startDateInput = $container.find('input.start.date'),
				endDateInput = $container.find('input.end.date'),
				dateDelta = moment.duration(0, "days");
			if (startDateInput.length && endDateInput.length) {
				var startDate = moment(startDateInput.val(), DATEPICKER_FORMAT),
					endDate = moment(endDateInput.val(), DATEPICKER_FORMAT);
				dateDelta = endDate.diff(startDate, 'days');
				$container.data('dateDelta', dateDelta);
			}
			var startTimeInput = $container.find('input.start.time'),
				endTimeInput = $container.find('input.end.time');
			if (startTimeInput.length && endTimeInput.length) {
				var startInt = startTimeInput.timepicker('getSecondsFromMidnight'),
					endInt = endTimeInput.timepicker('getSecondsFromMidnight');
				$container.data('timeDelta', endInt - startInt);
				if (dateDelta < 1) {
					endTimeInput.timepicker('option', 'minTime', startInt);
				}
			}
		};

		/**
		* Update date pair
		*/
		$.fn._updateDatepair = function () {
			var target = $(this),
				container = target.closest('.datepair');
			if (target.hasClass('date')) {
				base._update_date_pair(target, container);
			} else if (target.hasClass('time')) {
				base._update_time_pair(target, container);
			}
		};

		/**
		* Update date pair
		*/
		base._update_date_pair = function (target, container) {
			var start = container.find('input.start.date'),
				end = container.find('input.end.date');
			if (!start.length || !end.length) {
				return;
			}
			var startDate = moment(start.val()),
				endDate = moment(end.val()),
				oldDelta = moment.duration(container.data('dateDelta'), 'days');
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
			var start = { el : container.find('input.start.time') },
				end = { el : container.find('input.end.time') };
			if (!start.el.length || !end.el.length) {
				return;
			}
			start.seconds = start.el.timepicker('getSecondsFromMidnight');
			end.seconds = end.el.timepicker('getSecondsFromMidnight');
			if (start.seconds === null || end.seconds === null) {
				return;
			}
			var oldDelta = container.data('timeDelta'),
				dateDelta = container.data('dateDelta'),
				newDelta = end.seconds - start.seconds;
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
			var startInput = container.find('.start.date'),
				endInput = container.find('.end.date');
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
		base._init();
	};

	$.pwMap.parkingMap.defaultOptions = {
		parkwhizKey: 'd4c5b1639a3e443de77c43bb4d4bc888',
		showLocationMarkers: true,
		showPrice: true,
		monthly: false,
		width: '100%',
		mapHeight: '400px',
		modules: ['map', 'time_picker', 'parking_locations'],
		moduleMarkup: {
			map: '<div class="parking-map-widget-container map-mod mod"></div>',
			parking_locations: '<div class="parking-locations-widget-container parking_locations-mod mod"> \
					<h2>Parking Locations</h2> \
					<ul class="location-place parking"></ul> \
				</div>',
			event_list: '<div class="parking-events-widget-container event_list-mod mod"> \
					<h2>Events</h2> \
					<ul class="parking-events parking"></ul> \
				</div>',
			time_picker: '<div class="parking-timepicker-widget-container time_picker-mod mod"> \
					<h2>Timeframe</h2> \
					<p class="form-help">Change the start and end times below to when you\'ll need parking.</p> \
					<div class="datepair"> \
						<div class="datepair-start"> \
							<strong>From:</strong> \
							<input type="text" class="time start" /> on \
							<input type="text" class="date start" /> \
						</div> \
						<div class="datepair-end"> \
							<strong>To:</strong> \
							<input type="text" class="time end" /> on  \
							<input type="text" class="date end" /> \
						</div> \
					</div> \
				</div>',
		},
		defaultTime: {
			start: moment().unix(), // Now
			end: moment().add('h', 3).unix() // + 3 hrs
		},
		location: {
			center: null,
			defaultEvent: null,
			event: [],
			destination: [],
			venue: []
		},
		mapOptions: {
			zoom: null,
			mapTypeControl: false,
			panControl: false,
			scrollwheel: false,
			streetViewControl: false,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.SMALL
			},
			styles:[{"stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"on"},{"color":"#60a8f0"},{"saturation":50},{"lightness":15}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"saturation":0},{"lightness":30}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"lightness":20}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#7fbf6f"},{"lightness":20}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"},{"saturation":5},{"lightness":5}]},{"featureType":"poi.park","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.medical","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"simplified"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"labels.icon","stylers":[{"visibility":"on"},{"saturation":30}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"on"}]},{"featureType":"road.local","elementType":"labels.icon","stylers":[{"visibility":"on"}]},{"featureType":"all","elementType":"all","stylers":[{"lightness":14}]},{"featureType":"transit.line","elementType":"all","stylers":[{"visibility":"simplified"},{"lightness":35}]},{"featureType":"transit.station.rail","elementType":"labels.icon","stylers":[{"saturation":-100}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"transit.station.bus","elementType":"labels.icon","stylers":[{"saturation":-100}]},{"featureType":"transit.station.airport","elementType":"labels.icon","stylers":[{"saturation":-100}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"on"}]}],
		},
		overrideOptions: {},
		affiliateCode: null
	};

	$.fn.pwMap_parkingMap = function(options) {
		return this.each(function () {
			(new $.pwMap.parkingMap(this, options));
		});
	};

})(jQuery);
