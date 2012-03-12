var urlParams = {};
(function () {
    var e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&=]+)=?([^&]*)/g,
    d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
    q = window.location.search.substring(1);

    // do it this way to get round jslint complaints
    for (;;) {
        e = r.exec(q);
        if (!e) { break; }
        urlParams[d(e[1])] = d(e[2]);
    }
})();

function show_around( lat, long ) {
    pc = $('#pc').val();
    window.location='around.html?pc=' + pc + '&latitude=' + lat + '&longitude=' + long;
    return false;
}

function valid_postcode(pc) {
    var out_pattern = '[A-PR-UWYZ]([0-9]{1,2}|([A-HIK-Y][0-9](|[0-9]|[ABEHMNPRVWXY]))|[0-9][A-HJKSTUW])';
    var in_pattern = '[0-9][ABD-HJLNP-UW-Z]{2}';
    var full_pattern = '^' + out_pattern + in_pattern + '$';
    var postcode_regex = new RegExp(full_pattern);

    pc = pc.toUpperCase().replace(/\s+/, '');
    if ( postcode_regex.test(pc) ) {
        return true;
    }

    return false;
}

function checkConnection() {
    var networkState = navigator.network.connection.type;
    if ( networkState == Connection.NONE || networkState == Connection.UNKNOWN ) {
        $('#main').hide();
        $('#noconnection').show();
    }
}

function use_lat_long( lat, long ) {
    show_around( lat, long );
}


function lookup_string(q) {
    q = q.toLowerCase();
    q = q.replace(/[^\-&\w ']/, ' ');
    q = q.replace(/\s+/, ' ');

    if (!q) {
        alert('no location');
        $('#postcodeForm').after("<p>Please enter location</p>");
        return false;
    }

    var url = "http://dev.virtualearth.net/REST/v1/Locations?q=" + escape(q);
    url += '&c=en-GB&key=Au4rfRu-kpWgzddOjaTRlLhvB8wkTAr5_ky96BOxlmtjM-3FRJhjSsfauaWQnS0Z';
    var x = jQuery.get( url, function(data, status) {
        if ( status == 'success' ) {
            var valid_locations = 0;
            var latitude = 0;
            var longitude = 0;
            var multiple = [];

            for ( i = 0; i < data.resourceSets[0].resources.length; i++ ) {
                var details = data.resourceSets[0].resources[i];
                if ( details.address.countryRegion != 'United Kingdom' ) { continue; }
                var address = details.name;

                latitude = details.point.coordinates[0];
                longitude = details.point.coordinates[1];
                latitude = latitude.toPrecision(6);
                longitude = longitude.toPrecision(6);

                multiple.push( { 'address': address, 'latitude': latitude, 'longitude': longitude } );
                valid_locations += 1;
            }

            if ( valid_locations == 1 ) {
                show_around( latitude, longitude );
            } else if ( valid_locations === 0 ) {
                $('#postcodeForm').after('<p>Location not found</p>');
                $('#pc').select();
            } else {
                var multiple_html = '<ul id="multiple"><li>Multiple locations found, please select one:';
                for ( i = 0; i < multiple.length; i++ ) {
                    multiple_html += '<li><a href="#" onclick="use_lat_long( ' + multiple[i].latitude + ',' + multiple[i].longitude +')">' + multiple[i].address + '</a></li>';
                }
                multiple_html += '</ul>';
                $('#postcodeForm').after( multiple_html );
            }
        } else {
            $('#postcode_error').html('<span>Lookup failed</span>');
        }
        if (navigator.notificationEx) { navigator.notificationEx.loadingStop(); }
    });
}

function locate() {
    $("#postcode_error").html("");
    $("#multiple").remove();
    var pc = $('#pc').val();

    if (!pc) {
        $('#postcode_error').html("Please enter location");
        return false;
    }

    var loadingStart = function() {};
    var loadingStop = function() {};
    if (typeof navigator.notificationEx !== "undefined") {
        loadingStart = navigator.notificationEx.loadingStart;
        loadingStop = navigator.notificationEx.loadingStop;
    }
    loadingStart( { 'backgroundOpacity' : 0.5, labelText: 'Getting Location...', minDuration: 1 } );
    if ( valid_postcode( pc ) ) {
        jQuery.get( 'http://mapit.mysociety.org/postcode/' + pc + '.json', function(data, status) {
            if ( status == 'success' ) {
               show_around( data.wgs84_lat, data.wgs84_lon );
               loadingStop();
           } else {
               loadingStop();
           }
        });
    } else {
        lookup_string(pc);
    }
    return false;
}

function foundLocation(myLocation) {
    if (navigator.notificationEx) { navigator.notificationEx.loadingStop(); }
    var lat = myLocation.coords.latitude;
    var long = myLocation.coords.longitude;

    show_around( lat, long );
}

function notFoundLocation() { alert( 'not found' ); }

function getPosition() {
    var loadingStart = function() {};
    var loadingStop = function() {};

    if (typeof navigator.notificationEx !== "undefined") {
        loadingStart = navigator.notificationEx.loadingStart;
        loadingStop = navigator.notificationEx.loadingStop;
    }
    loadingStart( { 'backgroundOpacity' : 0.5, labelText: 'Getting Location...', minDuration: 1 } );

    navigator.geolocation.getCurrentPosition(foundLocation, notFoundLocation);
}


function onSuccess(imageURI) {
    $('#form_photo').val(imageURI);
    $('#photo').attr('src', imageURI );
    $('#add_photo').hide();
    $('#display_photo').show();
}

function delPhoto() {
    $('#form_photo').val('');
    $('#photo').attr('src', '' );
    $('#display_photo').hide();
    $('#add_photo').show();
}

function onFail(message) {
    // $('#photo').val('failed to get photo: ' + message );
}

function takePhoto(type) {
    navigator.camera.getPicture(onSuccess, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI, sourceType: type }); 
}

function win(r) {
    console.log( r.response );
    console.log( typeof r.response );
    if ( r.response.indexOf( 'success' ) >= 0  ) {
        window.location = 'email_sent.html';
    } else {
        alert('!woot');
        $('input[type=submit]').prop("disabled", false);
    }
}

function fail() {
    alert('boo!');
}


function postReport(e) {
    e.preventDefault();

    var params = {
        service: 'iphone',
        title: $('#form_title').val(),
        detail: $('#form_detail').val(),
        name: $('#form_name').val(),
                    may_show_name: $('#form_may_show_name').attr('checked') ? 1 : 0,
        email: $('#form_email').val(),
        category: $('#form_category').val(),
        lat: $('#fixmystreet\\.latitude').val(),
        lon: $('#fixmystreet\\.longitude').val(),
        pc: $('#pc').val()
    };

    if ( $('#form_photo').val() !== '' ) {
        fileURI = $('#form_photo').val();

        var options = new FileUploadOptions();
        options.fileKey="photo";
        options.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";  
        options.params = params;

        var ft = new FileTransfer();
        ft.upload(fileURI, "http://photek.local:3000/report/new/mobile", win, fail, options);
    } else {
        jQuery.ajax( { 
            url: "http://photek.local:3000/report/new/mobile",
            type: 'POST',
            data: params, 
            timeout: 30000,
            success: function(data) {
                console.log( data );
                if ( data.success ) {
                    window.location = 'email_sent.html';
                } else {
                    alert( 'ruh roh!');
                    $('input[type=submit]').prop("disabled", false);
                }
                return false;
            },
            error: function (data, status, errorThrown ) {
                console.log( data );
                alert( 'There was a problem submitting your report, please try again: ' + data, function(){}, 'Submit report' );
            }
        } );
    }
    return false;
}

$(function(){
    $('#postcodeForm').submit(locate);
    $('#mapForm').submit(postReport);
    $('#ffo').click(getPosition);
});
