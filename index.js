var argv = require('minimist')(process.argv.slice(2));
var request = require('request');
var fs = require('fs');
var OPENCAGE_KEY = 'b259e2552bcc6545f684920858777172';
var OPENCAGE_API_BASE = 'http://api.opencagedata.com/geocode/v1/json';

function openCage(query, callback) {
    var params = {
        bounds: query.bbox,
        key: OPENCAGE_KEY,
        q: query.name
    };

    request.get(OPENCAGE_API_BASE, {qs: params}, function(err, res, body) {
        if (err) {
            console.log(err);
            process.exit(0);
        }

        var body = JSON.parse(body);
        var results = body.results;
        var data = [];
        var relevant = [];
        if (results.length > 1) {
            results.forEach(function(r) {
                if (r.confidence >= query.confidence) {
                    relevant.push(r);
                }
            });
        } else {
            relevant.push(results[0]);
        }

        relevant.forEach(function(rel) {
            if (rel.annotations.OSM.edit_url) {
                var osmLink = rel.annotations.OSM.edit_url;
                var osmId = osmLink.split('?')[1].split('#')[0].split('=');
                osmId.push(query.name);
                osmId.push('https://openstreetmap.org/'+osmId[0]+'/'+osmId[1]);
                data.push(osmId); 
            }
        });
                
        callback(err, data);
    });
}

function runGeocoder(filename, bbox, confidence) {
    var rows = fs.readFileSync(filename, {'encoding': 'utf-8'});
    var rowArray = rows.split('\n');
    rowArray.forEach(function (row) {
        openCage({'name': row, 'bbox': bbox, 'confidence': argv.confidence}, function(err, result) {
            result.forEach(function(r) {
                console.log(r.join(','))
            })
        });
    });
}

runGeocoder(argv.filename, argv.bbox, argv.confidence);