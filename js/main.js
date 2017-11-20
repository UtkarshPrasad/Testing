function googleAPIError() {
	alert("Failed to load Google Maps API");
}

function ViewModel() {

	var self = this;

	self.map = null;
	self.apiSuccessful = null;
	self.currentInfoWindow = null;
	self.markers = ko.observableArray();

	self.query = ko.observable("");
	self.results = ko.observableArray();

	self.filterLocations = function() {
		var results = [];

		var query = self.query().toLowerCase();

		data.forEach(function(location) {
			if (location.tourist_place.toLowerCase().includes(query)) {
				results.push(location);
			}
		});

		return results;
	};

	// Update List based on query
	self.updateList = function(data) {
		self.results(self.filterLocations());
		self.clearMarkers();
		self.updateMarkers(self.filterLocations());
	};

	// Clear Markers which are not part of the query
	self.clearMarkers = function() {
		self.markers().forEach(function (marker, i) {
		    marker.setMap(null);
		});
	};

	// Update markers which may belong query
	self.updateMarkers = function(filterLocations) {
		filterLocations.forEach(function (location) {
			
			if(!location.marker){

				location.marker = new google.maps.Marker({
		        map: self.map,
		        position: location.coordinates,
		        animation: null
		    });

		    location.marker.addListener('click', function() {
	    		self.selectedLocation(location);
	    	});
			} else {
				location.marker.setMap(self.map);
			}

		  self.markers().push(location.marker);

		});
	};

	self.selectedLocation = function(location) {

		// Show the the Info Window of Tourist Place
		self.showTourist(location);

		// Position the current Info Window to the center of the map
		self.map.setCenter(location.marker.getPosition());

		// Animate the marker of the selected location
		self.animate(location.marker);

	};

	self.showTourist = function(location) {

		// Close the windows which are opened
		if (self.currentInfoWindow !== null) {
		    self.currentInfoWindow.close();
		}

		// Set the content of the Info Window of the Tourist Place
		location.infoWindow = new google.maps.InfoWindow({
			content: self.getHTML(location)
		});

		// Set the content of the Tourist Place's Info Window to the current Info Window
		self.currentInfoWindow = location.infoWindow;

		// Open the current Info Window of the Tourist Place
		self.currentInfoWindow.open(self.map, location.marker);

	};

	self.getHTML = function(location) {
		var loc=location.tourist_place;
		loc=loc.replace(/\s/g, '_');
		var wikiUrl = 'https://en.wikipedia.org/wiki/' + loc;
		var template = '<h3><a target="_blank" href='+wikiUrl+'>$tourist_place</a></h3>$wiki';
		var wikiTemplate = '<p>' + '$wiki' + '</p>';
		
		var wiki = '';

		if (location.wiki !== undefined) {
			wiki = wikiTemplate.replace('$wiki', "<h5>Wikipedia: </h5>" + location.wiki).replace('$img', '');
			if (location.img !== undefined) {
				wiki = wikiTemplate.replace('$wiki', "<h5>Wikipedia: </h5>" + location.wiki).replace('$img', location.img);
			}
		} else {
			self.getWikiInfo(location);
		}

		var html = template.replace('$tourist_place', location.tourist_place).replace('$wiki', wiki);

		return html;
	};

	self.getWikiInfo = function(location) {

		// Wikipedia Information of the Tourist Place
		var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + location.tourist_place + '&format=json';

		// Ajax Call
		$.ajax({
		    url: wikiUrl,
		    dataType: 'jsonp',
		    success: function(response) {
		    	if (response[2][0] !== undefined) {
			    	location.wiki = response[2][0];
			    	location.infoWindow.setContent(self.getHTML(location));
		    	}
					else {
						location.wiki = "No wikipedia info found for this Tourist Place";
			    	location.infoWindow.setContent(self.getHTML(location));
					}
		    },
		    timeout: 10000,
		    error: function() {
		    	if (self.apiSuccessful !== false) {
		    		alert("Wikipedia API Failed to load");
		    		self.apiSuccessful = false;
		    	}
		    }
		});

		// Wikipedia Thumbnail
		$.getJSON("http://en.wikipedia.org/w/api.php?action=query&format=json&callback=?", {
			titles: location.tourist_place,
			prop: "pageimages",
			pithumbsize: 500,
			pilimit: 10
		}
		);

		function GetImgUrl(data) {
			var img_urli = "";
			for (var key in data) {
				if (data[key].thumbnail !== undefined) {
					if (data[key].thumbnail.source !== undefined) {
						img_urli = data[key].thumbnail.source;
						break;
					}
				}
			}
			return img_urli;
		}

	};

	// Bounce the marker of the selected Tourist Place
	self.animate = function(marker) {
		if (marker.getAnimation() !== null) {
		  marker.setAnimation(null);
		} else {
		  marker.setAnimation(google.maps.Animation.DROP);
		}
	};

	// Initialize the Map based on the static latitude and longitude
	self.initMap = function() {
		self.map = new google.maps.Map(document.getElementById('map'), {
			center: {lat:26.8467, lng: 80.9462},
			zoom: 7,
			mapTypeControl: true,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
				position: google.maps.ControlPosition.TOP_CENTER
			},
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.LEFT_CENTER
			},
			scaleControl: true,
			streetViewControl: true,
			streetViewControlOptions: {
				position: google.maps.ControlPosition.LEFT_TOP
			},
			fullscreenControl: true

		});
	};
}


var viewModel;

function initialize() {

	viewModel = new ViewModel();

	viewModel.initMap();
	viewModel.updateList();

	// Activate Knockout
	ko.applyBindings(viewModel, document.getElementById("list"));
}
