var MapsApplication = function() {
    'use strict';
    /* All Variables */

    // initialization function
    var init,

    // binding handlers
        configureBindingHandlers,

    // flag for errors
        errorsFound = ko.observable(false),

    // location class that holds the details of a specific location
        Location,

    // array to hold locations
        locations = ko.observableArray(),

    // auth for foursquare api
        clientSecrets = secrets,

    // search box
        search = ko.observable(''),

    // filter function results
        listItems = ko.observableArray(),

    // DOM elements
        windowWidth = ko.observable($(window).width()),
        headerHeight = ko.observable($('nav').height()),
        footerHeight = ko.observable($('footer').height()),
        listWidth = ko.observable($('.list').width()),

    // flag for menu
        menuActive = ko.observable(false),

    // array to hold markers
        markers = ko.observableArray([]),

    // infowindow
        infowindow,

    // flag for opened infowindow
        infowindowOpen = ko.observable(false),

    // infowindow content string
        contentString,

    // map object
        map,

    // map options
        mapOptions = {
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
    ];

//---------------------------------------------------------------//

    /* Methods */

    /* Map View Model */
    Location = function() {
        this.lat = ko.observable();
        this.lng = ko.observable();
        this.name = ko.observable();
        this.id = ko.observable();
        this.marker = ko.observable();
        this.category = ko.observable();
        this.address = ko.observable();
        this.rating = ko.observable();
        this.ratingColor = ko.observable();
        this.price = ko.observable();
        this.url = ko.observable();
        this.photo = ko.observable();
        this.description = ko.observable();
        this.bestTip = ko.observable();
    };

    /* Method for adding markers */
    var addMarker = function(lat, lng) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: map,
            animation: google.maps.Animation.DROP,
            icon: 'img/star-3.png'
        });
        markers.push(marker);
        marker.addListener('click', toggleBounce);

        // marker animation function
        function toggleBounce() {
            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){ marker.setAnimation(null); }, 1400);
            }
        }

        // add map listeners
        marker.addListener('click', function() {
            var data;
            locations().forEach(function(item) {
                if (item.marker == marker) {
                    data = item;
                    return data;
                }
            });
            showInfoWindow(data);
        });

        return marker;
    };

    /* Method for getting location data through foursquare api asynchronously */
    var fetchData = function(callback) {
        $.ajax({
            url: 'https://api.foursquare.com/v2/venues/explore?client_id=' + clientSecrets[0].client_id +
        '&client_secret=' + clientSecrets[0].client_secret + '&v=20151214&m=foursquare&near=cairo',
            type: 'GET',
            success: function(result) {
                callback(result);
            }
        })
        // handle api loading error by showing it to the user
        .fail(function(){
            displayErrors("<span>Error Loading Foursquare API</span>. <br>Please make sure you're connected" +
                     " to the internet and refresh to try again.");
        });
    };

    /* Method for getting detailed data about a specific location asynchronously*/
    var detailedData = function(location) {
        $.ajax({
            url: 'https://api.foursquare.com/v2/venues/' + location.id + '?client_id=' + clientSecrets[0].client_id +
        '&client_secret=' + clientSecrets[0].client_secret + '&v=20151214',
            type: 'GET',
            success: function(result) {
                updateLocationWithDetails(result);
            }
        })
        // handle api loading error by showing it to the user
        .fail(function(){
            displayErrors("<span>Error Loading Foursquare API</span>. <br>Please make sure you're connected" +
                     " to the internet and refresh to try again.");
        });

        /* Method to get details of a location and update the model */
        var updateLocationWithDetails = function(data) {
            var js = ko.toJS(data),
                venue = js.response.venue;

            if (venue.id == location.id) {
                location.address = venue.location.formattedAddress;
                location.category = venue.categories[0].name;
                location.rating = venue.rating;
                location.ratingColor = venue.ratingColor;
                location.url = venue.url;
                location.photo = venue.bestPhoto.prefix + "100x100" + venue.bestPhoto.suffix;
                location.description = venue.description;
                location.bestTip = venue.listed.groups[0].items[0].description;
            }
        };
    };

    /* Method to utilize data fetched from the server and construct a new location object */
    var constructNewLocation = function(data) {
        var js = ko.toJS(data),
            venues = js.response.groups[0].items;
        venues.forEach(function(item) {
            var location = new Location();
            // create a new location class for each item and populate its fields
            location.lat = item.venue.location.lat;
            location.lng = item.venue.location.lng;
            location.name = item.venue.name;
            location.id = item.venue.id;
            location.marker = addMarker(item.venue.location.lat, item.venue.location.lng);
            if (item.venue.price !== undefined && item.venue.price !== '') {
                location.price = item.venue.price.tier;
            } else {
                location.price = undefined;
            }
            detailedData(location);
            // add to locations array
            locations.push(location);
        });
    };

    /* Create infowindow content string */
    var createContentString = function(location) {
        var title, category, address, rating, price, photo, description, logo;
        title = "<div class='infowindow'><h3 class='text-center'>" + location.name + "</h3><br>";
        if (location.photo) {
            photo = "<div class='row'><div class='col-xs-5 text-center'><img src='" + location.photo + "'/></div>";
        } else {
            photo = "<div class='row'><div class='col-xs-5 text-center' style='margin:0 10px 0 0; padding:30px 0 28px 12px; background-color:#aaa; color:#ffffff; text-shadow:1px 1px 1px #333; width:120px; height:100px;'>" +
                    "No Photos Available</div>";
        }
        if (location.category) {
            category = "<div class='col-offset-xs-1 col-xs-6'><div class='col-xs-9' style='font-size: 1.2em'><div>" + location.category;
        } else {
            category = "";
        }
        if (location.address) {
            address = "<br><div><address>" + location.address + "</address></div></div>";
        } else {
            address = "";
        }
        if (location.rating) {
            rating = "<div class='col-xs-3 text-center' style='color: #ffffff; border-radius: 3px; line-height: 2em; text-shadow: 1px 1px 1px #333; padding:2px 0 0 0; width:30px; height:30px; background-color:#" +
                        location.ratingColor + ";'>" +
                        location.rating + "</div></div></div><br>";
        } else {
            rating = "";
        }
        if (location.price) {
            price = "<div>Prices: ";
            for (var i = 0, len = location.price; i < len; i++) {
                price += '$';
            }
            price += "</div></div>";
        } else {
            price = "";
        }
        if (location.description) {
            description = "<div class='col-xs-12'>" + location.description + "</div>";
        } else if (location.bestTip) {
            description = "<div class='col-xs-12'>" + location.bestTip + "</div>";
        } else {
            description = "";
        }
        logo = "<div class='text-right'><img width='150px' src='https://ss0.4sqi.net/img/poweredByFoursquare/poweredby-one-color-cdf070cc7ae72b3f482cf2d075a74c8c.png'></div></div>";
        contentString = title + photo + category + price + address + rating + description + logo;
        return contentString;
    };

    /* Method to listen for clicks on marker or list item */
    var showInfoWindow = function(data) {
        // create content string
        contentString = createContentString(data);

        // show infowindow
        infowindow.setContent(contentString);
        infowindow.open(map, data.marker);
        map.setCenter(data.marker.getPosition());

        infowindowOpen(true);

        if (windowWidth() < 767 && menuActive() === true) {
            menuActive(false);
        }
    };

    /* Method to close side bar when info window opens on small screens to save space */

    /* Method to set the map on all markers in the array */
    function setMapOnAll(map, markers) {
        markers.forEach(function(item) {
            item.setMap(map);
        });
    }

    /* Method to remove all markers from the map, but keeps them in the array */
    var clearMarkers = function(markers) {
        setMapOnAll(null, markers);
    };

    /* Method to search and filter view list items according to user input */
    var searchItems = ko.computed(function() {
        var loweredSearch = search().toLowerCase();
        // if input is clean
        if (!loweredSearch) {
            // show all markers on the map and return all list items
            setMapOnAll(map, markers());
            listItems(locations());
            return listItems();
        } else {
            var found = ko.observableArray();
            var foundMarkers = ko.observableArray();
            // loop through markers array
            ko.utils.arrayFilter(locations(), function(item) {
                // look for a match between entry and markers objects array
                var foundBool = item.name.toLowerCase().indexOf(loweredSearch) !== -1;
                // push matching results into an array
                if (foundBool === true) {
                    found().push(item);
                    foundMarkers().push(item.marker);
                }
                return foundBool;
            });
            // remove all markers from map
            clearMarkers(markers());
            // set markers for results found
            setMapOnAll(map, foundMarkers());
            listItems(found());
            return listItems();
        }
    });

    /* Method for displaying errors on the page */
    var displayErrors = function(errorMessage) {
        if (errorMessage) {
            $('.errors').html(errorMessage);
        } else {
            $('.errors').html('Error on the page');
        }
        errorsFound(true);
    };

    /* Method for sliding side menu */
    var toggleSideBar = function() {
        if (menuActive() === false) {
            menuActive(true);
        } else if (menuActive() === true) {
            menuActive(false);
        }
    };

    /* Method to initialize map */
    var initMap = function() {
        // create map and add styling
        var mapElement = document.getElementsByClassName('map-canvas')[0];
        map = new google.maps.Map(mapElement, mapOptions);
        map.setOptions({styles: mapStyles});
        // initialize info window
        infowindow = new google.maps.InfoWindow({
            maxWidth: 450,
        });
    };

    /* Method to load Google Maps API */
    var loadAPI = function() {
        var script  = document.createElement('script');
        var lastScript = $('script')[2];
        script.src  = 'https://maps.googleapis.com/maps/api/js?callback=MapsApplication.initMap';
        script.setAttribute('async', '');
        lastScript.parentNode.insertBefore(script, lastScript);
    };

    /* Method to check successful loading of google maps */
    var mapReady = function() {
        setTimeout(function() {
            try {
                google.maps.event.addListenerOnce(map, 'idle', function(){
                    // fetch markers and data
                    fetchData(constructNewLocation);
                });
            } catch(error) {
                // Display as an error on the page
                displayErrors("<span>Error Loading Google Maps API</span>. <br>Please make sure you're connected" +
                 " to the internet and refresh to try again.");
                console.log(error);
            }
        }, 1000);
    };

    /* Custom bindings */
    configureBindingHandlers = function() {
        // Binding handler to resize map and list to fit the screen and not overflow
        ko.bindingHandlers.resize = {
            init: function(element, valueAccessor) {
                $(element).css('height', $(window).height() - (headerHeight() + footerHeight()));
            },
            update: function(element, valueAccessor) {
                $(window).resize(function() {
                    $(element).css('height', $(window).height() - (headerHeight() + footerHeight()));
                });
                // resize map when side bar opens
                if (element.className === 'map-canvas') {
                    if (menuActive() === true) {
                        $(element).css('width', $(window).width() - $('.list').width());
                        google.maps.event.trigger(map, 'resize');
                    } else {
                        $(element).css('width', $(window).width());
                    }
                }
            }
        };
    };

    init = function () {
        // load map and markers
        loadAPI();
        mapReady();

        // start search box functionality
        searchItems();

        // add custom bindings
        configureBindingHandlers();

        //apply the bindings
        ko.applyBindings(MapsApplication);
    };

    /* execute the init function when the DOM is ready */
    $(init);

    return {
        /* add members that will be exposed publicly */
        errorsFound: errorsFound,
        displayErrors: displayErrors,
        menuActive: menuActive,
        search: search,
        listItems: listItems,
        showInfoWindow: showInfoWindow,
        initMap: initMap,
        toggleSideBar: toggleSideBar
    };
}();