pwMap
----------------------------------------------------------------------------------------------------
Creates a ParkWhiz Widget in a jQuery object.




**Parameters**

**options**:  *Object*,  Configuration data for the ParkWhiz Widget.

**options.additionalMarkers**:  *Object=*,  An icon to replace the default ParkWhiz price marker that denotes location, as defined in the Google Maps API (https://developers.google.com/maps/documentation/javascript/reference?hl=fr#Icon)

**options.showLocationMarker**:  *boolean=*,  If true, show a marker to denote the location searched by the widget as specified in the Location object.

**options.showPrice**:  *boolean=*,  If true, show prices for each lot. If false, show a generic "P" icon.

**[options.width=600px]**:  *string=*,  A css width value for the map module.

**[options.height=600px]**:  *string=*,  A css height value for the map module.

**options.modules**:  *string[]=*,  An array of module codes to dictate how the module is arranged on the screen. Possible codes include map, parking_locations, event_list and time_picker

**options.defaultTime**:  *Object=*,  An object containing default timestamps for the timepicker, if present.

**options.defaultTime.start**:  *int=*,  A unix timestring representing the default search start time in the timepicker, rounded to the nearest half hour.

**options.defaultTime.end**:  *int=*,  A unix timestring representing the default search end time in the timepicker, rounded to the nearest half hour.

**options.location**:  *Object*,  An object describing the search area for the widget.

**options.location.event**:  *(string|string[])=*,  An event slug, such as 'united-center-parking/san-antonio-spurs-at-chicago-bulls-155217', or an array of event slugs corresponding to a URL on parkwhiz.com

**options.location.destination**:  *(string|string[])=*,  A plaintext address or array of plaintext addresses around which to search parking.

**options.location.venue**:  *(string|string[])=*,  A venue slug, such as 'united-center-parking', or an array of venue slugs corresponding to a URL on parkwhiz.com

**options.location.defaultEvent**:  *string=*,  An event ID number, found as an integer at the end of an event URL slug, to select by default when the event picker module is present

**options.location.center**:  *Object=*,  An optional object for centering the map away from the search location.

**options.location.center.destination**:  *string=*,  A plaintext address to optionally manually center the map away from the search location.

**options.location.center.lat**:  *string=*,  A plaintext latitude to optionally manually center the map away from the search location. Requires longitude.

**options.location.center.lng**:  *string=*,  A plaintext longitude to optionally manually center the map away from the search location. Requires latitude.

**options.parkwhizKey**:  *string*,  Your ParkWhiz API key, available here: http://www.parkwhiz.com/developers/

**options.styles**:  *Object=*,  An object containing stylers, as defined in the Google Maps API (https://developers.google.com/maps/documentation/javascript/reference#MapTypeStyle)

**options.mapOptions**:  *Object=*,  An object with any option you can pass through to Google Maps' MapOptions object (https://developers.google.com/maps/documentation/javascript/reference#MapOptions)

**options.overrideOptions**:  *Object=*,  An object with any option you can pass through to the gmap3 plugin (http://gmap3.net/en/), upon which this plugin is based.

