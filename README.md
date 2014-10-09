![ParkWhiz](http://s3.parkwhiz.com/pw-blue-logo.png)
# jQuery ParkWhiz Parking Map (2.0.0)

A jQuery plugin that creates a ParkWhiz parking map widget.

*   jquery.parkingmap.js : v2.0.0
*   Released under the MIT License.
*   [Parkwhiz.com/developers](http://www.parkwhiz.com/developers/)
*   *Copyright (c) 2014 ParkWhiz, Inc.*

## Demo & Wizard

*   [Repo Demo](http://parkwhiz.github.io/jquery-parking-map/)
*   [Parking Widget Generator](http://www.parkwhiz.com/developers/parking-widget/)

## Getting Started

First, include all the plugin js/css in the `head` of your page.

```html
  <!-- jquery.parkingmap.css -->
  <link rel="stylesheet" type="text/css" href="../source/css/jquery.parkingmap.css">

  <!-- jQuery,Google Maps, & jquery.parkingmap.js  -->
  <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
  <script src="http://maps.googleapis.com/maps/api/js?sensor=false" type="text/javascript"></script>
  <script type="text/javascript" src="../source/jquery.parkingmap.js"></script>
```

Then, init the plugin by calling it inside a jQuery ready function. Something like this:

```js
  $(function() {
    $("#parkwhiz-widget-venue").parkingMap({
      parkwhizKey: '...',
      location: {
        venue: 'united-center-parking',
      },
      // etc...
    });
  });
```

## Configuration Settings

**Required Setting** = *

|        Option        |    Type   |                    Default                    |                                                                              Description                                                                              |
| -------------------- | --------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| * `parkwhizKey`      | `string`  |                                               | Your ParkWhiz API key, available at [Parkwhiz.com/developers](http://www.parkwhiz.com/developers/).                                                                   |
| * `location`         | `Object`  | [*See details below*](#location-object)       | An object describing the search area for the widget.                                                                                                                  |
| `showLocationMarker` | `boolean` | `true`                                        | If true, show a marker to denote the location searched by the widget as specified in the Location object.                                                             |
| `showPrice`          | `boolean` | `true`                                        | If true, show prices for each lot. If false, show a generic "P" icon.                                                                                                 |
| `monthly`            | `boolean` | `false`                                       | If true, only monthly listings. If false, show only transient listings.                                                                                               |
| `width`              | `string`  | `100%`                                        | A css width value for the map module. We recommend you don't make the width smaller than `300px`.                                                                     |
| `height`             | `string`  | `400px`                                       | A css height value for the map module.                                                                                                                                |
| `modules`            | `string`  | `['map', 'time_picker', 'parking_locations']` | An array of module codes to dictate the module order on the screen, accepted values are `map`, `parking_locations`, `event_list` and `time_picker`                    |
| `moduleMarkup`       | `Object`  |                                               | An array of output markup for each module above in `modules`                                                                                                          |
| `defaultTime`        | `Object`  | [*See details below*](#defaulttime-object)    | An object containing default timestamps for the timepicker, if present.                                                                                               |
| `mapOptions`         | `Object`  |                                               | An object with any option you can pass through to [Google Maps' MapOptions object](https://developers.google.com/maps/documentation/javascript/reference#MapOptions). |
| `overrideOptions`    | `Object`  |                                               | An object with any option you can pass through to the [gmap3 plugin](http://gmap3.net/en/), upon which this plugin is based.                                          |

>#### `defaultTime` Object

|        Option       |    Type   |            Default            |                                                    Description                                                    |
| ------------------- | --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `defaultTime`       | `Object`  |                               | An object containing default timestamps for the timepicker, if present.                                           |
| `defaultTime.start` | `integer` | `moment().unix()`             | A unix timestring representing the default search start time in the timepicker, rounded to the nearest half hour. |
| `defaultTime.end`   | `integer` | `moment().add('h', 3).unix()` | A unix timestring representing the default search end time in the timepicker, rounded to the nearest half hour.   |


>#### `location` Object

|             Option            |        Type       | Default |                                                                                              Description                                                                                               |
| ----------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `location`                    | `Object`          |         | An object describing the search area for the widget.                                                                                                                                                   |
| `location.event`              | `string/string[]` | `[]`    | An event slug (such as `att-park-parking/nlcs-89152`) that corresponds to a URL on parkwhiz.com. **The slug should NOT contain a forward slash.**                                                      |
| `location.destination`        | `string/string[]` | `[]`    | A plaintext address, zip, lat/lng, or array of plaintext addresses around which to search parking.                                                                                                     |
| `location.venue`              | `string/string[]` | `[]`    | A venue slug, such as `united-center-parking`, or an array of venue slugs corresponding to a URL on parkwhiz.com.                                                                                      |
| `location.defaultEvent`       | `string`          | `null`  | An event ID number, found as an integer at the end of an event URL slug, to select by default when the event picker module is present. The default event must be apart of the venue you are searching. |
| `location.center`             | `Object`          | `null`  | An optional object for centering the map away from the search location.                                                                                                                                |
| `location.center.destination` | `string`          | `null`  | A plaintext address to optionally manually center the map away from the search location.                                                                                                               |
| `location.center.lat`         | `string`          | `null`  | A plaintext latitude to optionally manually center the map away from the search location. Requires longitude.                                                                                          |
| `location.center.lng`         | `string`          | `null`  | A plaintext longitude to optionally manually center the map away from the search location. Requires latitude.                                                                                          |

## Methods

Coming soon.

## Changelog

Version 2.0.0 - October 8, 2014
* Refactored
* Updated markers
* Many bug fixes
* Major overhaul

Version 1.0.2 - September 2, 2014
* Added `moduleMarkup` option for custom templates
* Added minified version of plugin to repo (`jquery.parkingmap.min.js`)
* Various bug fixes

Version 1.0.1 - August 7, 2014
* Cleaned up how events work. Fixed CSS to be plugin specific.

Version 1.0.0 - March, 2014
* First public release of jquery.parkingmap.js.

## Road Map

Here are some of the features planned for the future:

* Methods

## Contact, FAQ, Etc.

*   **I found a bug or have a feature request.** Please submit any bugs you might find on the repo [issues tab](https://github.com/ParkWhiz/jquery-parking-map/issues).

Feel free to [contact us](mailto:dev@parkwhiz.com) if you have any further questions about jquery.parkingmap.js.

## Dependencies

* **[Moment.js](http://momentjs.com/)**
  * Repo: [github.com/moment/moment](https://github.com/moment/moment)
  * Version: 2.5.0
  * License: MIT license
* **[gmap3](http://gmap3.net/)**
  * Repo: [github.com/jbdemonte/gmap3](https://github.com/jbdemonte/gmap3)
  * Version: 6.0.0
  * License: GPL v3
* **[jquery.timepicker](http://jonthornton.github.io/jquery-timepicker/)**
  * Repo: [github.com/jonthornton/jquery-timepicker](https://github.com/jonthornton/jquery-timepicker)
  * Version: 1.2.12
  * License: MIT License
* **[Underscore.js](http://underscorejs.org/)**
  * Repo: [github.com/jashkenas/underscore](https://github.com/jashkenas/underscore)
  * Version: 1.5.2
  * License: MIT License
* **bootstrap-datepicker**
  * Repo: [github.com/eternicode/bootstrap-datepicker](https://github.com/eternicode/bootstrap-datepicker)
  * Version: 1.3.0
  * License: Apache License

## License

The MIT License (MIT)

Copyright (C) ParkWhiz, Inc., http://parkwhiz.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
