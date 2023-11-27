var defaultSettings = {
    "api_key": ""
};

// Cache ajax requests in the current pageload.
var ajaxCache = {};

// We’ll store areas here.
var areas = {};

var getSettings = function(){
    return JSON.parse( window.localStorage.getItem('settings') ) || defaultSettings;
};

var setSettings = function(settings){
    return window.localStorage.setItem('settings', JSON.stringify(settings));
};

var setUpSettingsInputs = function(){
    var settings = getSettings();

    // Apply UI state from stored (or default) settings.
    $.each(settings, function(id, value){
        var $el = $('#' + id);
        if ( $el.is('[type="checkbox"], [type="radio"]') ) {
            $el.attr('checked', value)
        } else {
            $el.val(value);
        }
    });

    $('.js-setting[id]').on('change blur', function(){
        var $el = $(this);
        var settings = getSettings();
        $el.removeClass('is-invalid');
        if ( $el.is('[type="checkbox"], [type="radio"]') ) {
            settings[ $el.attr('id') ] = $el.prop('checked') ? true : false;
        } else {
            settings[ $el.attr('id') ] = $el.val();
        }
        setSettings(settings);
    });
};

var getMapItResponseAsync = function(url){
    var dfd = $.Deferred();

    if ( ajaxCache.hasOwnProperty(url) ) {
        dfd.resolve( ajaxCache[url] );
    } else {
        $.ajax({
            url: "https://mapit.mysociety.org" + url,
            dataType: "json",
            data: {
                api_key: getSettings()["api_key"]
            }
        }).done(function(response){
            ajaxCache[url] = response;
            dfd.resolve(response);
        }).fail(function(jqXHR){
            dfd.reject(jqXHR.responseJSON.error);
        });
    }

    return dfd.promise();
};

var loadAreas = function(){
    var dfd = $.Deferred();

    var areas = {};
    var areaTypes = [
        "CTY",
        "COI",
        "DIS",
        "LBO",
        "MTD",
        "LGD",
        "UTA"
    ];

    var i = 0;
    var next = function(){
        displayProgress(
            "Loading areas",
            i,
            areaTypes.length
        );

        if ( i < areaTypes.length ) {
            getMapItResponseAsync(
                '/areas/' + areaTypes[i] + '.json'
            ).done(function(responseAreas){
                $.each(responseAreas, function(_, a){
                    areas[ a["id"] ] = {
                        mapit_id: a["id"],
                        name: a["name"],
                        type: a["type"],
                        gss: a["codes"]["gss"]
                    }
                });
            }).fail(function(error){
                console.warn(error);
            }).always(function(){
                setTimeout(function(){
                    i++;
                    next();
                }, 1000);
            });
        } else {
            dfd.resolve(areas);
        }
    };

    next();

    return dfd.promise();
};

var displayProgress = function(label, valueNow, valueMax){
    var $progress = $('#progress');
    var $progressbar = $('#progress_bar');
    var $progresslabel = $('#progress_label');

    $progresslabel.text(label);
    $progressbar.attr('aria-valuemin', 0);
    $progressbar.attr('aria-valuemax', valueMax);
    $progressbar.attr('aria-valuenow', valueNow);
    $progressbar.children('.progress-bar').css('width', (valueNow/valueMax*100) + '%');

    $progress.addClass('show');

    if ( valueNow == valueMax ) {
        setTimeout(function(){
            $progress.removeClass('show');
        }, 2000);
    }
};



$(function(){
    setUpSettingsInputs();

    $('#load_data').on('click', function(){
        var settings = getSettings();

        $('#api_key').removeClass('is-invalid');

        if ( settings["api_key"] ) {
            loadAreas().then(function(areas){
                console.log(areas);
                $('#search').focus();
            });
        } else {
            $('#api_key').addClass('is-invalid');
        }
    });

});
