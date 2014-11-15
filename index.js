/*jslint node:true, nomen:true*/

(function () {

    'use strict';

    var fs = require('fs'),
        path = require('path'),
        figlet = require('figlet'),
        cheerio = require('cheerio'),
        _ = require('underscore'),
        async = require('async'),
        mkdirp = require('mkdirp');

    module.exports = function (params) {

        var options = _.defaults(params || {}, {
            header: 'Humans.txt',
            team: null,
            thanks: null,
            site: null,
            note: null,
            html: null,
            out: null,
            callback: null
        }),
            config = [],
            file = 'humans.txt';

        function traverse(object, first) {
            _.each(Object.keys(object), function (val) {
                var indent = "";
                if (typeof object[val] === 'string') {
                    if (!first) {
                        indent += '\t';
                    }
                    config.push(indent + val + ': ' + object[val]);
                } else {
                    config.push(val + ':');
                    traverse(object[val], false);
                }
            });
        }

        function add(name, object) {
            config.push('\n/* ' + name + ' */');
            if (typeof object === 'string') {
                config.push(object);
            } else if (Array.isArray(object)) {
                _.each(object, function (obj) {
                    config.push(obj);
                });
            } else {
                traverse(object, true);
            }
        }

        function writeTags(callback) {
            var $, tag = '<link rel="author" href="' + file + '" />';
            if (options.html) {
                fs.readFile(options.html, function (error, data) {
                    if (error) {
                        throw error;
                    }
                    $ = cheerio.load(data);
                    if ($('head').length > 0) {
                        $('head').append(tag);
                        return callback($.html(), tag);
                    }
                    return callback(null, tag);
                });
            } else {
                return callback(null, tag);
            }
        }

        async.waterfall([
            function (callback) {
                figlet(options.header, function (error, data) {
                    callback(error, data);
                });
            },
            function (data, callback) {
                config.push(data + '\n');
                add('TEAM', options.team);
                add('THANKS', options.thanks);
                add('SITE', options.site);
                add('NOTE', options.note);
                callback(null, data);
            },
            function (data, callback) {
                if (options.out) {
                    mkdirp(path.dirname(options.out), function (error) {
                        callback(error, data);
                    });
                } else {
                    callback(null, data);
                }
            },
            function (data, callback) {
                if (options.out) {
                    fs.writeFile(options.out, config.join('\n'), function (error) {
                        callback(error, config.join('\n'));
                    });
                } else {
                    callback(null, config.join('\n'));
                }
            },
            function (data, callback) {
                writeTags(function (html, tag) {
                    if (options.html && options.html !== '') {
                        fs.writeFile(options.html, html, function (error) {
                            callback(error, data, tag);
                        });
                    } else {
                        callback(null, data, tag);
                    }
                });
            }
        ], function (error, data, html) {
            if (options.callback) {
                return options.callback(error, data, html);
            }
            return;
        });

    };

}());
