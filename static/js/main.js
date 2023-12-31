const { createApp, ref } = Vue;

var ajaxCache = {};

var areaTypes = [
    {
        id: "CTY",
        singular: "County council",
        plural: "County councils",
        input: true,
        output: false,
    }, {
        id: "CED",
        singular: "County ward",
        plural: "County wards",
        input: true,
        output: false,
    }, {
        id: "COI",
        singular: "Isles of Scilly",
        plural: "Isles of Scilly",
        input: true,
        output: false,
    }, {
        id: "COP",
        singular: "Isles of Scilly parish",
        plural: "Isles of Scilly parishes",
        input: true,
        output: false,
    }, {
        id: "CPC",
        singular: "Civil parish",
        plural: "Civil parishes",
        input: true,
        output: false,
    }, {
        id: "CPW",
        singular: "Civil parish ward",
        plural: "Civil parish wards",
        input: true,
        output: false,
    }, {
        id: "DIS",
        singular: "District council",
        plural: "District councils",
        input: true,
        output: false,
    }, {
        id: "DIW",
        singular: "District ward",
        plural: "District wards",
        input: true,
        output: false,
    }, {
        id: "ER",
        singular: "English region",
        plural: "English regions",
        input: true,
        output: false,
    }, {
        id: "GLA",
        singular: "London Assembly",
        plural: "London Assembly",
        input: true,
        output: false,
    }, {
        id: "LAC",
        singular: "London Assembly constituency",
        plural: "London Assembly constituencies",
        input: true,
        output: false,
    }, {
        id: "LBO",
        singular: "London borough",
        plural: "London boroughs",
        input: true,
        output: false,
    }, {
        id: "LBW",
        singular: "London ward",
        plural: "London wards",
        input: true,
        output: false,
    }, {
        id: "LGD",
        singular: "Northern Irish council",
        plural: "Northern Irish councils",
        input: true,
        output: false,
    }, {
        id: "LGE",
        singular: "Northern Irish electoral area",
        plural: "Northern Irish electoral areas",
        input: true,
        output: false,
    }, {
        id: "LGW",
        singular: "Northern Irish ward",
        plural: "Northern Irish wards",
        input: true,
        output: false,
    }, {
        id: "MTD",
        singular: "Metropolitan district",
        plural: "Metropolitan districts",
        input: true,
        output: false,
    }, {
        id: "MTW",
        singular: "Metropolitan ward",
        plural: "Metropolitan wards",
        input: true,
        output: false,
    }, {
        id: "NIE",
        singular: "Northern Irish Assembly constituency",
        plural: "Northern Irish Assembly constituencies",
        input: true,
        output: false,
    }, {
        id: "OLF",
        singular: "Lower Layer Super Output Area",
        plural: "Lower Layer Super Output Areas",
        input: false,
        output: true,
    }, {
        id: "OMF",
        singular: "Middle Layer Super Output Area",
        plural: "Middle Layer Super Output Areas",
        input: false,
        output: true,
    }, {
        id: "SPC",
        singular: "Scottish Parliament constituency",
        plural: "Scottish Parliament constituencies",
        input: true,
        output: false,
    }, {
        id: "SPE",
        singular: "Scottish Parliament region",
        plural: "Scottish Parliament regions",
        input: true,
        output: false,
    }, {
        id: "TTW",
        singular: "Travel to Work Area",
        plural: "Travel to Work Areas",
        input: true,
        output: false,
    }, {
        id: "UTA",
        singular: "Unitary authority",
        plural: "Unitary authorities",
        input: true,
        output: false,
    }, {
        id: "UTE",
        singular: "Unitary authority electoral division",
        plural: "Unitary authority electoral divisions",
        input: false,
        output: false,
    }, {
        id: "UTW",
        singular: "Unitary authority ward",
        plural: "Unitary authority wards",
        input: true,
        output: false,
    }, {
        id: "WAC",
        singular: "Welsh Assembly constituency",
        plural: "Welsh Assembly constituencies",
        input: true,
        output: false,
    }, {
        id: "WAE",
        singular: "Welsh Assembly region",
        plural: "Welsh Assembly regions",
        input: false,
        output: false,
    }, {
        id: "WMC",
        singular: "UK Parliamentary constituency",
        plural: "UK Parliamentary constituencies",
        input: true,
        output: true,
    }
];

var copyText = function(text){
    var $textarea = $("<textarea>");
    $textarea.val(text);
    $textarea.css("position", "fixed");
    $textarea.appendTo("body")
    $textarea[0].select();
    try {
        return document.execCommand("copy");  // Security exception may be thrown by some browsers.
    }
    catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }
    finally {
        $textarea.remove();
    }
};

createApp({
    delimiters: ["${", "}"], // avoid conflict with Jekyll `{{ }}` delimiters
    data() {
        return {
            api_key: null,
            api_key_valid: null,
            areas: [],
            area_types: areaTypes,
            map: null, // will be a Leaflet Map instance
            map_layer_output_areas: null, // will be a Leaflet geoJSON Layer instance
            map_layer_selected_areas: null, // will be a Leaflet geoJSON Layer instance
            output_areas: [],
            output_columns: [
                {
                    key: "mapit_id",
                    label: "MapIt ID"
                }, {
                    key: "gss",
                    label: "GSS code"
                }, {
                    key: "ons",
                    label: "ONS code"
                }, {
                    key: "name",
                    label: "Name"
                }
            ],
            progress_current: null,
            progress_max: null,
            progress_message: null,
            search_term: null,
            selected_area_ids: [],
            selected_area_type_ids: [
                "CTY",
                "COI",
                "DIS",
                "LBO",
                "LGD",
                "MTD",
                "TTW",
                "UTA",
            ],
            selected_output_area_type_id: "WMC",
            selected_output_column_keys: [
                "mapit_id",
                "gss",
                "name",
            ],
            suppressed_output_area_ids: [],
        }
    },
    computed: {
        input_area_types() {
            return _.filter(areaTypes, { input: true });
        },
        output_area_types() {
            return _.filter(areaTypes, { output: true });
        },
        progress_percentage() {
            return ( this.progress_current / this.progress_max ) * 100;
        },
        selected_output_columns() {
            var _this = this;
            return _.filter(_this.output_columns, function(column){
                return _this.selected_output_column_keys.indexOf(column.key) > -1;
            });
        },
        sorted_areas() {
            return Array.from(this.areas).sort(function(a, b){
                return a.name.localeCompare(b.name);
            });
        },
    },
    mounted() {
        var _this = this;

        if ( localStorage.getItem('mapit_api_key') ) {
            _this.api_key = localStorage.getItem('mapit_api_key');
            _this.verifyMapItApiKey();
        }

        _this.setUpMap();
    },
    watch: {
        api_key(value){
            if ( value ) {
                localStorage.setItem('mapit_api_key', value);
            } else {
                localStorage.removeItem('mapit_api_key');
            }
            this.verifyMapItApiKey();
        },
        selected_area_ids() {
            var _this = this;
            _this.regenerateOutputAreas();
            _this.regenerateSelectedAreaPolygons();
        },
        selected_output_area_type_id() {
            var _this = this;
            _this.regenerateOutputAreas();
        }
    },
    methods: {
        areaMatchesSearchTerm(area){
            var _this = this;
            if ( _this.search_term ) {
                return area.name.toLowerCase().indexOf(_this.search_term.toLowerCase()) > -1;
            } else {
                return true;
            }
        },
        areaName(mapit_id){
            var _this = this;

            // Fallback in case areaName is called before areas have been loaded.
            if ( _this.areas.length == 0 ) {
                return 'Area#' + mapit_id;
            }

            var area = _.findWhere(_this.areas, { mapit_id: mapit_id });

            // Fallback in case for some reason we request an area that hasn’t been loaded.
            if ( typeof area === 'undefined' ) {
                return 'Area#' + mapit_id;
            }

            var parent_area = _.findWhere(_this.areas, { mapit_id: area.parent_area_mapit_id });

            function suffixless(name) {
                var name = name;
                var suffixes = [
                    "Borough Council",
                    "City Council",
                    "County Council",
                    "District Council",
                    "Council",
                    "Corporation",
                    "Authority"
                ];

                $.each(suffixes, function(i, suffix){
                    if ( name.endsWith(suffix) ) {
                        name = name.slice(0, -suffix.length);
                    }
                });

                return name.trim();
            }

            if ( parent_area ) {
                return suffixless(area.name) + ' (' + suffixless(parent_area.name) + ')';
            } else {
                return suffixless(area.name);
            }
        },
        areaTypeName(type, plural){
            var name = plural ? "plural" : "singular";
            return _.findWhere(areaTypes, { id: type })[name];
        },
        copyOutputHTML(){
            // Remove .disabled rows.
            var $table = $("#output_table").clone();
            $table.find('tr.disabled').remove();
            // Remove all HTML attributes.
            $table.removeAttr('id class');
            $table.find('*').removeAttr('id class');
            var text = $table.prop("outerHTML");
            copyText(text);
        },
        copyOutputTSV(){
            var text = '';
            $("#output_table tr").not(".disabled").each(function(){
                text += $(this).children().map(function(){
                    return $(this).text();
                }).get().join('\t')
                text += '\n';
            });
            copyText(text);
        },
        // Call the given MapIt API endpoint with (optionally) a given set of
        // query params, and return a jQuery Deferred promise, suitable for
        // chaining .then, .done, and .fail onto.
        //
        // By default, responses are stored in the global ajaxCache, meaning
        // future requests with the same `endpoint` and `params` will return
        // immediately.
        //
        // `options` argument should be an object with the following keys:
        // - `endpoint` (eg: "/area/1234.json")
        // - `extraData`, an object that will be supplied as the second
        //   argument to any .done or .fail callbacks
        // - `bypassCache` (default: false), set to true to prevent the
        //   API response from being saved to or read from the ajaxCache
        getMapItResponseAsync(options){
            var _this = this;
            var dfd = $.Deferred();
            var options = $.extend({
                params: {},
                extraData: {},
                bypassCache: false
            }, options);

            var url = "https://mapit.mysociety.org" + options.endpoint;

            // Create a unique key for this request in the cache.
            var ajaxCacheKey = url;
            var querystring = $.param(options.params);
            if ( querystring ){
                ajaxCacheKey += '?' + querystring;
            }

            if ( ajaxCache.hasOwnProperty(ajaxCacheKey) && ! options.bypassCache ) {
                dfd.resolve(ajaxCache[ajaxCacheKey], options.extraData);
            } else {
                $.ajax({
                    url: url,
                    data: $.extend({ api_key: _this.api_key }, options.params),
                    dataType: "json"
                }).done(function(response){
                    ajaxCache[ajaxCacheKey] = response;
                    setTimeout(function(){
                        dfd.resolve(response, options.extraData);
                    }, 1000);
                }).fail(function(jqXHR){
                    setTimeout(function(){
                        dfd.reject(jqXHR.responseJSON.error, options.extraData);
                    }, 1000);
                });
            }

            return dfd.promise();
        },
        loadMapItAreas(){
            var _this = this;
            var i = 0;

            _this.areas = [];

            _this.sequentialMapItResponses(
                _.map(_this.selected_area_type_ids, function(id){
                    return {
                        endpoint: '/areas/' + id + '.json'
                    };
                }),
                function(request){
                    _this.progress_message = "Loading " + _this.areaTypeName(
                        _this.selected_area_type_ids[i],
                        'plural'
                    );
                    _this.progress_current = i + 1;
                    _this.progress_max = _this.selected_area_type_ids.length;
                    i++;
                },
                function(responseAreas){
                    $.each(responseAreas, function(_, a){
                        _this.areas.push({
                            mapit_id: a["id"],
                            parent_area_mapit_id: a["parent_area"],
                            name: a["name"],
                            type: a["type"],
                            gss: a["codes"]["gss"]
                        });
                    });
                },
                function(errorText){
                    console.warn(errorText);
                }
            ).then(function(){
                _this.progress_message = "Areas loaded";
                _this.progress_current = null;
                _this.progress_max = null;
            });
        },
        markSearchTermMatches(string){
            var _this = this;

            if ( _this.search_term ) {
                var regex = new RegExp(_this.search_term, 'gi');
                return string.replace(regex, `<mark>$&</mark>`);
            } else {
                return string;
            }
        },
        regenerateOutputAreas(){
            var _this = this;

            _this.output_areas = [];

            _this.sequentialMapItResponses(
                _.map(_this.selected_area_ids, function(area_id){
                    return {
                        endpoint: "/area/" + area_id + "/covers",
                        params: { type: _this.selected_output_area_type_id }
                    };
                }),
                undefined,
                function(responseAreas){
                    $.each(responseAreas, function(mapit_id, a){
                        var existing = _.findWhere(_this.output_areas, { mapit_id: a["id"] });
                        if ( ! existing ){
                            _this.output_areas.push({
                                mapit_id: a["id"],
                                name: a["name"],
                                type: a["type"],
                                gss: a["codes"]["gss"],
                                ons: a["codes"]["ons"],
                            });
                        }
                    });
                },
                undefined
            ).then(function(){
                _this.regenerateOutputAreaPolygons();
            });
        },
        regenerateOutputAreaPolygons(){
            var _this = this;

            _this.map_layer_output_areas.clearLayers();

            _this.sequentialMapItResponses(
                _.map(_this.output_areas, function(area){
                    return {
                        endpoint: "/area/" + area.mapit_id + ".geojson",
                        params: { simplify_tolerance: "0.001" },
                        extraData: { mapit_id: area.mapit_id }
                    };
                }),
                undefined,
                function(responseGeoJson, extraData){
                    responseGeoJson.properties = { mapit_id: extraData.mapit_id };
                    _this.map_layer_output_areas.addData(responseGeoJson);
                },
                undefined
            ).then(function(){
                _this.map.fitBounds(_this.map_layer_output_areas.getBounds());
            });
        },
        regenerateSelectedAreaPolygons(){
            var _this = this;

            _this.map_layer_selected_areas.clearLayers();

            _this.sequentialMapItResponses(
                _.map(_this.selected_area_ids, function(area_id){
                    return {
                        endpoint: "/area/" + area_id + ".geojson",
                        params: { simplify_tolerance: "0.001" },
                        extraData: { mapit_id: area_id }
                    };
                }),
                undefined,
                function(responseGeoJson, extraData){
                    responseGeoJson.properties = { mapit_id: extraData.mapit_id };
                    _this.map_layer_selected_areas.addData(responseGeoJson);
                },
                undefined
            ).then(function(){
                _this.map.fitBounds(_this.map_layer_selected_areas.getBounds());
            });
        },
        setUpMap(){
            var _this = this;

            _this.map = L.map(_this.$refs.map).setView([54.0934, -2.8948], 7)

            L.tileLayer(
                'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=7ac28b44c7414ced98cd4388437c718d',
                {
                    maxZoom: 19,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }
            ).addTo(_this.map);

            _this.map.createPane("selected_areas");
            _this.map.createPane("output_areas");

            _this.map.getPane("selected_areas").style.zIndex = 602;
            _this.map.getPane("output_areas").style.zIndex = 601;

            _this.map_layer_output_areas = L.geoJSON(undefined, {
                style: { fillOpacity: 0.2, color: "#FC832A" },
                onEachFeature: function (feature, layer) {
                    var mapit_id = feature.properties.mapit_id;
                    layer.on('mouseover', function () {
                        this.setStyle({ fillOpacity: 0.4 });
                    });
                    layer.on('mouseout', function () {
                        this.setStyle({ fillOpacity: 0.2 });
                    });
                    layer.on('click', function(e){
                        var i = _this.suppressed_output_area_ids.indexOf(mapit_id);
                        if ( i == -1 ) {
                            _this.suppressed_output_area_ids.push(mapit_id);
                            this.setStyle({ color: "#CCCCCC" });
                        } else {
                            _this.suppressed_output_area_ids.splice(i, 1);
                            this.setStyle({ color: "#FC832A" });
                        }
                    });
                },
                pane: "output_areas"
            }).addTo(_this.map);

            _this.map_layer_selected_areas = L.geoJSON(undefined, {
                style: { fillOpacity: 0 },
                interactive: false,
                pane: "selected_areas"
            }).addTo(_this.map);
        },
        // Given an array of "requests" (each "request" an `options` object
        // suitable for passing to getMapItResponseAsync) this will call
        // getMapItResponseAsync once for each request, sequentially, and
        // return a promise that .then, .done, or .fail can be chained onto.
        // If an eachBefore callback is provided, it will be called before
        // each API request. If eachDone or eachFail callbacks are provided,
        // they will be called after each API request, and passed the API
        // response or error string respectively.
        sequentialMapItResponses(requests, eachBefore, eachDone, eachFail){
            var _this = this;
            var eachBefore = eachBefore || function(){};
            var eachDone = eachDone || function(){};
            var eachFail = eachFail || function(){};

            return requests.reduce(
                function(p, options){
                    return p.then(function(){
                        eachBefore(options);
                        return _this.getMapItResponseAsync(
                            options
                        ).done(
                            eachDone
                        ).fail(
                            eachFail
                        );
                    });
                },
                $.when()
            );
        },
        verifyMapItApiKey(){
            var _this = this;
            _this.api_key_valid = null;

            if ( _this.api_key ) {
                _this.getMapItResponseAsync({
                    endpoint: "/quota",
                    bypassCache: true
                }).done(function(response){
                    if ( response.quota && response.quota.limit > 50 ) {
                        _this.api_key_valid = true;
                    } else {
                        _this.api_key_valid = false;
                    }
                });
            }
        }
    }
}).mount('#app');
