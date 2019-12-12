/**
 * Copyright 2014, 2017, 2019 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var path = require("path");
var util = require("util");
var fs = require("fs");
var _ = require("lodash");
var cfenv = require("cfenv");
var IBMCloudEnv = require('ibm-cloud-env');
IBMCloudEnv.init(path.resolve(__dirname, '/config/mappings.json'));

const REGEX_LEADING_ALPHA = /^[^a-zA-Z]*/;
const REGEX_ALPHA_NUM = /[^a-zA-Z0-9]/g;

var appEnv = cfenv.getAppEnv();

var userDir = path.join(__dirname, ".node-red");
// Ensure userDir exists - something that is normally taken care of by
// localfilesystem storage when running locally
if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);
if (!fs.existsSync(path.join(userDir, "node_modules"))) fs.mkdirSync(path.join(userDir, "node_modules"));

var settings = module.exports = {
    uiPort: process.env.PORT || 1880,
    mqttReconnectTime: 15000,
    debugMaxLength: 1000,

    //Flag for enabling Appmetrics dashboard (https://github.com/RuntimeTools/appmetrics-dash)
    useAppmetrics: false,

    userDir: userDir,

    flowFile: "flows.json",

    // Add the bluemix-specific nodes in
    nodesDir: path.join(__dirname, "nodes"),

    // Blacklist the non-bluemix friendly nodes
    nodesExcludes: ['66-mongodb.js', '75-exec.js', '35-arduino.js', '36-rpi-gpio.js', '25-serial.js', '28-tail.js', '50-file.js', '31-tcpin.js', '32-udp.js', '23-watch.js'],

    // Enable module reinstalls on start-up; this ensures modules installed
    // post-deploy are restored after a restage
    autoInstallModules: true,

    // Move the admin UI
    httpAdminRoot: '/red',

    // Serve up the welcome page
    httpStatic: path.join(__dirname, "public"),

    functionGlobalContext: {},

    // Configure the logging output
    logging: {
        // Only console logging is currently supported
        console: {
            // Level of logging to be recorded. Options are:
            // fatal - only those errors which make the application unusable should be recorded
            // error - record errors which are deemed fatal for a particular request + fatal errors
            // warn - record problems which are non fatal + errors + fatal errors
            // info - record information about the general running of the application + warn + error + fatal errors
            // debug - record information which is more verbose than info + info + warn + error + fatal errors
            // trace - record very detailed logging + debug + info + warn + error + fatal errors
            // off - turn off all logging (doesn't affect metrics or audit)
            level: "info",
            // Whether or not to include metric events in the log output
            metrics: false,
            // Whether or not to include audit events in the log output
            audit: true
        }
    }
};

// Look for the attached Cloudant instance to use for storage
settings.couchAppname = _sanitizeAppName(appEnv.name);
util.log("Setting couchAppname: " + settings.couchAppname)
settings.couchDb = process.env.NODE_RED_STORAGE_DB_NAME || settings.couchAppname;
util.log("Setting CouchDb: " + settings.couchDb);

var cloudantUrl = IBMCloudEnv.getString("cloudant_url");

if (!cloudantUrl) {
    util.log("Failed to find Cloudant url");
    if (process.env.NODE_RED_STORAGE_NAME) {
        util.log(" - using NODE_RED_STORAGE_NAME environment variable: " + process.env.NODE_RED_STORAGE_NAME);
    }
    // fall back to localfilesystem storage
} else {
    settings.storageModule = require("./couchstorage");
    settings.couchUrl = cloudantUrl;
}

function _sanitizeAppName(name) {
    name = name || 'appname';
    return name.toLowerCase().replace(REGEX_LEADING_ALPHA, '').replace(REGEX_ALPHA_NUM, '');
}