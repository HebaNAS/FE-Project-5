function errorDiv () {
    var body = document.getElementsByTagName("body")[0];
    var div = document.createElement("div");
    document.body.appendChild(div);
    div.setAttribute("id", "errors");
    if(body.id === "body-error") {
        body.id = "";
    }
    body.id = "body-error";
    return div;
}
// Check if Google maps loaded then build application
if (typeof google === 'object' && typeof google.maps === 'object') {
    (function (window, google, ko) {
        "use strict";

        // array to hold marker objects, list items
        var markers = [],
            favorites = [];

        // create info window
        var infowindow = new google.maps.InfoWindow({
            content: "",
            maxWidth: 400
        });

        // ajax requests
        var info,
            json,
            clientSecrets = secrets,
            map,
            xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if ((xhr.readyState === 4) && (xhr.status === 200 || xhr.status === 304)) {
                json = JSON.parse(xhr.responseText);
                favorites = json.response.groups[0].items;
                // create markers
                favorites.forEach(function(place) {
                    new CreateMarker(MapViewModel.map, place.venue.location.lat, place.venue.location.lng, place.venue.name, place);
                });

                // generate map instance
                map = new MapViewModel(mapElement, mapOptions, mapStyles, markers, favorites);
                
                // apply knockout bindings
                ko.applyBindings(map);

                for (var i = 0, len = markers.length; i < len; i++) {
                    listItems[i].id = markers[i].title.replace(/\s/g, '').toLowerCase();
                }

                // iterate over list elements by transforming it from object to array
                [].forEach.call(document.getElementsByTagName("li"), function(item) {
                    // listen for click on list item
                    item.addEventListener("click", function () {
                        var self = this;
                        for (var i = 0, len = markers.length; i < len; i++) {
                            // if clicked list item has the same marker title
                            if (self.id === markers[i].title.replace(/\s/g, '').toLowerCase()) {
                                // open infowindow from outside the map through clicking on list item
                                return (function(marker, infowindow, favorites) {
                                    for (var j = 0, len = favorites.length; j < len; j++) {
                                        if (marker.title === favorites[j].venue.name) {
                                            infowindow.setContent(markerInfo(favorites[j]));
                                        }
                                    }
                                    infowindow.open(map.map, marker);
                                    map.map.setCenter(marker.getPosition());
                                    map.map.panTo(marker.getPosition());
                                }(markers[i], infowindow, favorites));
                            }
                        }
                    });
                });
            } else if ((xhr.readyState === 4) && (xhr.status !== 200 || xhr.status !== 304)) {
                // generate map instance
                map = new MapViewModel(mapElement, mapOptions, mapStyles, markers, favorites);
                
                // apply knockout bindings
                ko.applyBindings(map);

                for (var i = 0, len = markers.length; i < len; i++) {
                    listItems[i].id = markers[i].title.replace(/\s/g, '').toLowerCase();
                }

                // iterate over list elements by transforming it from object to array
                [].forEach.call(document.getElementsByTagName("li"), function(item) {
                    // listen for click on list item
                    item.addEventListener("click", function () {
                        var self = this;
                        for (var i = 0, len = markers.length; i < len; i++) {
                            // if clicked list item has the same marker title
                            if (self.id === markers[i].title.replace(/\s/g, '').toLowerCase()) {
                                // open infowindow from outside the map through clicking on list item
                                return (function(marker, infowindow, favorites) {
                                    for (var j = 0, len = favorites.length; j < len; j++) {
                                        if (marker.title === favorites[j].venue.name) {
                                            infowindow.setContent(markerInfo(favorites[j]));
                                        }
                                    }
                                    infowindow.open(map.map, marker);
                                    map.map.setCenter(marker.getPosition());
                                    map.map.panTo(marker.getPosition());
                                }(markers[i], infowindow, favorites));
                            }
                        }
                    });
                });

                errorDiv();
                $("#errors").html("Error loading Foursquare Api");
            }
        };
        xhr.open("GET", "https://api.foursquare.com/v2/venues/explore?client_id=" + clientSecrets[0].client_id +
            "&client_secret=" + clientSecrets[0].client_secret + "&v=20151214&m=foursquare&near=cairo&query=restaurant");

        xhr.send();

        // class to create markers
        function CreateMarker (map, lat, lng, name) {
            var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(lat, lng),
                    map: map,
                    animation: google.maps.Animation.DROP,
                    icon: "img/star-3.png",
                    title: name
                });
            marker.addListener("click", toggleBounce);
            markers.push(marker);

            // marker animation function
            function toggleBounce() {
                if (marker.getAnimation() !== null) {
                    marker.setAnimation(null);
                } else {
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function(){ marker.setAnimation(null); }, 1400);
                }
            }

            return marker;
        }

        // Creates the html for the marker infowindow
        function markerInfo(place) {
            var title, category, address, rating, price, photo, logo;
            title = "<div id='infowindow' style='overflow: hidden; min-width: 400px;'><h3 class='text-center'>" + place.venue.name + "</h3><br>";
            if (place.venue.photos.count > 0) {
                photo = "<div class='row'><div class='col-xs-4 text-center'><img src='" + place.venue.photos.groups[0].prefix + "100x100" +
                        place.venue.photos.groups[0].suffix + "'/></div>";
            } else {
                photo = "<div class='row'><div class='col-xs-4 text-center' style='margin:0; padding:30px 0 28px 12px; background-color:#aaa; color:#ffffff; text-shadow:1px 1px 1px #333; width:120px; height:100px;'>" +
                        "No Photos Available</div>";
            }
            if (place.venue.categories[0].name) {
                category = "<div class='col-xs-8'><div class='col-xs-9' style='font-size: 1.2em'><div>" + place.venue.categories[0].name;
            } else {
                category = "";
            }
            if (place.venue.location.formattedAddress) {
                address = "<br><div><address>" + place.venue.location.formattedAddress + "</address></div></div>";
            } else {
                address = "";
            }
            if (place.venue.rating) {
                rating = "<div class='col-xs-3 text-center' style='color: #ffffff; border-radius: 3px; line-height: 2em; text-shadow: 1px 1px 1px #333; padding:2px 0 0 0; width:30px; height:30px; background-color:#" +
                            place.venue.ratingColor + ";'>" +
                            place.venue.rating + "</div></div></div><br>";
            } else {
                rating = "";
            }
            if (place.venue.price.message) {
                price = "<div>Prices: ";
                for (var i = 0; i < place.venue.price.tier; i++) {
                    price += place.venue.price.currency;
                }
                price += "</div></div>";
            } else {
                price = "Prices Not Available</div></div>";
            }
            logo = "<div class='text-right'><img width='150px' src='https://ss0.4sqi.net/img/poweredByFoursquare/poweredby-one-color-cdf070cc7ae72b3f482cf2d075a74c8c.png'></div></div>";
            var contentString = title + photo + category + price + address + rating + logo;
            return contentString;
        }

        // Sets the map on all markers in the array.
        function setMapOnAll(map, markers) {
            for (var i = 0, len = markers.length; i < len; i++) {
                markers[i].setMap(map);
                // set content of infowindow and open on click
                google.maps.event.addListener(markers[i], "click", (function(marker, i, favorites) {
                    return function() {
                        for (var j = 0, len = favorites.length; j < len; j++) {
                            if (marker.title === favorites[j].venue.name) {
                                infowindow.setContent(markerInfo(favorites[j]));
                            }
                        }
                        infowindow.open(map, marker);
                    };
                })(markers[i], i, favorites));
            }
        }

        // Removes the markers from the map, but keeps them in the array.
        function clearMarkers(markers) {
            setMapOnAll(null, markers);
        }

        // create map view model
        function MapViewModel (mapElement, mapOptions, mapStyles, markers, favorites) {
            var self = this;
            self.map = new google.maps.Map(mapElement, mapOptions);
            self.map.setOptions({styles: mapStyles});
            // markers array binding by making a copy of the original array
            self.favoritePlaces = markers;
            // search box binding
            self.search = ko.observable("");
            // search and filter function
            self.filter = ko.computed(function () {
                var loweredSearch = self.search().toLowerCase();
                // if input is clean
                if (!loweredSearch) {
                    // show all markers on the map and return all list items
                    setMapOnAll(self.map, self.favoritePlaces);
                    return self.favoritePlaces;
                } else {
                    var found = [];
                    // loop through markers array
                    var filtered = ko.utils.arrayFilter(self.favoritePlaces, function (place) {
                        // look for a match between entry and markers objects array
                        var foundBool = place.title.toLowerCase().indexOf(loweredSearch) !== -1;
                        // clear current markers
                        clearMarkers(self.favoritePlaces);
                        // push matching results into an array
                        if (foundBool === true) {
                            found.push(place);
                        }
                        return foundBool;
                    });
                    // set markers for results found
                    setMapOnAll(self.map, found);
                    return filtered;
                }
            });
        }

        //map options
        var mapOptions = {
                center: {
                    lat: 30.0500,
                    lng: 31.2333
                },
                scrollwheel: false,
                zoom: 14
            },
        // map styles
            mapStyles = [
                {
                    featureType: "all",
                    elementType: "labels.text.fill",
                    stylers: [
                        {
                            saturation: 36
                        },
                        {
                            color: "#8c92ac"
                        },
                        {
                            lightness: 40
                        }
                    ]
                },
                {
                    featureType: "all",
                    elementType: "labels.text.stroke",
                    stylers: [
                        {
                            visibility: "on"
                        },
                        {
                            color: "#000000"
                        },
                        {
                            lightness: 16
                        }
                    ]
                },
                {
                    featureType: "all",
                    elementType: "labels.icon",
                    stylers: [
                        {
                            visibility: "off"
                        }
                    ]
                },
                {
                    featureType: "administrative",
                    elementType: "geometry.fill",
                    stylers: [
                        {
                            color: "#373034"
                        },
                        {
                            lightness: 20
                        }
                    ]
                },
                {
                    featureType: "administrative",
                    elementType: "geometry.stroke",
                    stylers: [
                        {
                            color: "#000000"
                        },
                        {
                            lightness: 17
                        },
                        {
                            weight: 1.2
                        }
                    ]
                },
                {
                    featureType: "landscape",
                    elementType: "geometry",
                    stylers: [
                        {
                            color: "#423f43"
                        },
                        {
                            lightness: 20
                        }
                    ]
                },
                {
                    featureType: "landscape",
                    elementType: "geometry.stroke",
                    stylers: [
                        {
                            color: "#000000"
                        }
                    ]
                },
                {
                    featureType: "poi",
                    elementType: "geometry",
                    stylers: [
                        {
                            color: "#373034"
                        },
                        {
                            lightness: 21
                        }
                    ]
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry.fill",
                    stylers: [
                        {
                            color: "#373034"
                        },
                        {
                            lightness: 17
                        }
                    ]
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry.stroke",
                    stylers: [
                        {
                            color: "#000000"
                        },
                        {
                            lightness: 29
                        },
                        {
                            weight: 0.2
                        }
                    ]
                },
                {
                    featureType: "road.arterial",
                    elementType: "geometry",
                    stylers: [
                        {
                            color: "#373034"
                        },
                        {
                            lightness: 18
                        }
                    ]
                },
                {
                    featureType: "road.local",
                    elementType: "geometry",
                    stylers: [
                        {
                            color: "#373034"
                        },
                        {
                            lightness: 16
                        }
                    ]
                },
                {
                    featureType: "transit",
                    elementType: "geometry",
                    stylers: [
                        {
                            color: "#373034"
                        },
                        {
                            lightness: 19
                        }
                    ]
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [
                        {
                            color: "#7fbfff"
                        },
                        {
                            lightness: 17
                        }
                    ]
                }
            ],
            mapElement = document.getElementById("map"),
            list = document.getElementById("list"),
            listUl = document.getElementById("list-ul"),
            input = document.getElementById("filter"),
            listItems = document.getElementsByTagName("li");

        // set height of map and list divs according to window height
        var body = document.body,
            footer = document.getElementById("copyrights");
        if (window.innerWidth < 767) {
            mapElement.style.height = (window.innerHeight - 70) + "px";
        } else {
            mapElement.style.height = (window.innerHeight - 127) + "px";
        }
        mapElement.style.width = window.innerWidth + "px";
        mapElement.style.width = window.innerWidth + "px";
        if (list !== null) {
            if (window.innerWidth < 767) {
                list.style.height = (window.innerHeight - 70) + "px";
            } else {
                list.style.height = (window.innerHeight - 127) + "px";
            }
        }

        // listen for and resize map and list divs according to new window height
        google.maps.event.addDomListener(window, "resize", function () {
            body.style.height = window.innerHeight +"px";
            mapElement.style.height = (window.innerHeight - 127) + "px";
            mapElement.style.width = window.innerWidth + "px";
            footer.style.top = (window.innerHeight - 48) + "px";
            if (list !== null) {
                list.style.height = (window.innerHeight - 127) + "px";
            }
        });

        // slide menu
        var menuTrigger = body.getElementsByClassName("menu-trigger")[0];
        if (typeof menuTrigger !== "undefined") {
            menuTrigger.addEventListener("click", function() {
                body.className = (body.className === "menu-active")? " " : "menu-active";
                // Adjust map width after opening the list side bar
                if (body.className === "menu-active") {
                    if (window.innerWidth < 767) {
                        mapElement.style.width = (window.innerWidth - 100) + "px";
                    } else {
                        mapElement.style.width = (window.innerWidth - 200) + "px";
                    }
                } else {
                    mapElement.style.width = window.innerWidth + "px";
                }
            });
        }

    }(window, google, ko));
} else {
    // Handle Google maps loading error and display it to the user
    errorDiv();
    $("#errors").html("Error loading Google Maps");
}