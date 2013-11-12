# jquery-parking-map

## Options

<table>
 <thead>
 <tr>
  <th>parameter</th>
  <th>value</th>
  <th>description</th>
 </tr>
</thead>
<tbody>
 <tr>
  <td><code>parkwhizKey</code> (required)</td>
  <td>string</td>
  <td>API key provided on http://www.parkwhiz.com/developers/ after signing up for an account.</td>
 </tr>
 <tr>
  <td><code>location</code> (required)</td>
  <td>
    Object with these keys:<br />
    <code>destination</code> (string) street address
    <br />*OR*<br />
    <code>lat</code> (number) and <code>lng</code> (number)
    <br />*OR*<br />
    <code>venue</code> (string URL)
  </td>
  <td>
    The location for which the user will be looking for parking.
    <br />
    e.g. <code>{ destination: "208 S. Jefferson St, Chicago, IL 60661" }</code>
    <br />*OR*<br />
    <code>{ lat: 41.878598, lng: -87.638836 }</code>
    <br />*OR*<br />
    <code>{ venue: "united-center-parking" }</code> (corresponding to https://www.parkwhiz.com/united-center-parking/)
  </td>
 </tr>
 <tr>
  <td><code>showTimePicker</code></td>
  <td>boolean, default true</td>
  <td>This only applies if <code>location</code> is an address or lat/lng..  Should the date+time picker be shown?</td>
 </tr>
 <tr>
  <td><code>showChosenEvent</code></td>
  <td>boolean, default true</td>
  <td>This only applies if <code>location</code> is a venue.  Should the name of the current event be shown?</td>
 </tr>
 <tr>
  <td><code>showLocationMarker</code></td>
  <td>boolean, default true</td>
  <td>Should a marker be shown on the <code>location</code> position?</td>
 </tr>
 <tr>
  <td><code>defaultTime</code></td>
  <td>Object with these keys:
   <br />
   <code>start</code> and <code>end</code> unix timestamps
   <br />*OR*<br />
   <code>hours</code> number of hours
   <br /><br />
   Default is <code>{ hours: 3 }</code>.
  </td>
  <td>This only applies if <code>location</code> is an address or lat/lng. <br /><br />e.g. <code>{ start: 1383847222, end: 1383858022 }</code> - specific time range.
  <br />*OR*<br />
  <code>{ hours: 6 }</code> from roughly now for a 6 hour duration. (start time will be the nearest hour or half hour).
 </td>
 </tr>
 <tr>
  <td><code>event</code></td>
  <td>string event URL</td>
  <td>This only works if <code>location</code> is a venue.  If provided, the map will pre-load with price markers for the given event. Otherwise, if no event is chosen the map will load with "P" markers and require you to choose an event before seeing prices.
  <br />
  e.g. <code>"/2010-5-27-7pm-boston-red-sox-vs-kansas-city-royals/"</code>
  </td>
 </tr>
 <tr>
  <td><code>loadFirstEvent</code></td>
  <td>boolean, default false</td>
  <td>This only works if <code>location</code> is a venue.  If true, the first event for the given venue will be used to populate prices. Otherwise, if no event is chosen the map will load with "P" markers and require you to choose an event before seeing prices.</td>
 </tr>
 <tr>
  <td><code>showEventList</code></td>
  <td>boolean, default true</td>
  <td>This only works if <code>location</code> was set to a venue.</td>
 </tr>
 <tr>
  <td><code>width</code></td>
  <td>CSS string</td>
  <td>e.g. <code>90%</code></td>
 </tr>
 <tr>
  <td><code>height</code></td>
  <td>CSS string</td>
  <td>e.g. <code>500px</code></td>
 </tr>
 <tr>
  <td><code>zoom</code></td>
  <td>number</td>
  <td>Zoom level as described here: https://developers.google.com/maps/documentation/javascript/tutorial</td>
 </tr>
 <tr>
  <td><code>additionalMarkers</code></td>
  <td>Object</td>
  <td>
   Value will be passed through to http://gmap3.net/en/catalog/10-overlays/marker-41
   <br />
   e.g. 
   <pre><code>
   {
    values: [
      [49.28952958093682, 6.152559438984804],
      {
        latLng:[44.28952958093682, 6.152559438984804],
        options:{
          icon: "http://maps.google.com/mapfiles/marker_green.png"
        }
      },
      [49.28952958093682, -1.1501188139848408],
      {
        latLng:[44.28952958093682, -1.1501188139848408],
        events:{
          click:function(){
            alert("I'm the last one, and i have my own click event");
          }
        }
      }
    ],
    events:{ // events trigged by markers 
      click: function(){
        alert("Here is the default click event");
      }
    }
    </code></pre>
   </td>    
 </tr>
</tbody>
</table>

