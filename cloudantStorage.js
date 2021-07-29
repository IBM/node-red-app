/**
 * Copyright 2014, 2019 IBM Corp.
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

 const {CloudantV1} = require("@ibm-cloud/cloudant");

 //var util = require('util');
 var fs = require('fs');
 
 const CLIENT = CloudantV1.newInstance({});
 
 var dbname;
 var settings;
 var appname;
 var currentFlowRev = null;
 var currentSettingsRev = null;
 var currentCredRev = null;
 
 //var libraryCache = {};
 
 function prepopulateFlows(resolve) {
     var key = appname + "/" + "flow";
 
     CLIENT.getDocument({
         db: dbname,
         docId: key,
     })
     .then((getDocumentResponse) => {
         resolve();
     })
     .catch((err) => {
         var promises = [];
         if (fs.existsSync(__dirname + "/defaults/flow.json")) {
             try {
                 var flow = fs.readFileSync(__dirname + "/defaults/flow.json", "utf8");
                 var flows = JSON.parse(flow);
                 console.log("[cloudantStorage] Installing default flow");
                 promises.push(cloudantStorage.saveFlows(flows));
             } catch (err2) {
                 console.log("[cloudantStorage] Failed to save default flow");
                 console.log(err2);
             }
         } else {
             console.log("[cloudantStorage] No default flow found");
         }
         if (fs.existsSync(__dirname + "/defaults/flow_cred.json")) {
             try {
                 var cred = fs.readFileSync(__dirname + "/defaults/flow_cred.json", "utf8");
                 var creds = JSON.parse(cred);
                 console.log("[cloudantStorage] Installing default credentials");
                 promises.push(cloudantStorage.saveCredentials(creds));
             } catch (err2) {
                 console.log("[cloudantStorage] Failed to save default credentials");
                 console.log(err2);
             }
         } else {
             console.log("[cloudantStorage] No default credentials found");
         }
         Promise.all(promises).then(function () {
             resolve();
         });
     });
 }
 
 
 var cloudantStorage = {
     init: function (_settings) {
         settings = _settings.cloudantService || {};
         if (!settings) {
             var err = Promise.reject("cloudantStorage settings not found");
             err.catch(err => {});
             return err;
         }
         
         appname = settings.prefix || require('os').hostname();
         dbname = settings.db || "nodered";
 
         return new Promise(function (resolve, reject) {
             CLIENT.getDatabaseInformation({ db: dbname })
             .then((dbInfo) => {
                 prepopulateFlows(resolve);
             })
             .catch((err) => {
                 console.log(err);
                 CLIENT
                 .putDatabase({ db: dbname })
                 .then((putDatabaseResult) => {
                     if (putDatabaseResult.result.ok) {
                         console.log(`"${dbname}" database created."`);
                     }
 
                     const viewDocument = { _id: "_design/library" }
                     
                     viewDocument['views'] = {
                                                 flow_entries_by_app_and_type: {
                                                     map: 
                                                     `function (doc) {
                                                         var p = doc._id.split("/");
                                                         if (p.length > 2 && p[2] == "flow") {
                                                             var meta = { path: p.slice(3).join("/") };
                                                             emit([p[0], p[2]], meta);
                                                         }
                                                     }`
                                                     
                                                 },
                                                 lib_entries_by_app_and_type: {
                                                     map: 
                                                     `function (doc) {
                                                         var p = doc._id.split("/");
                                                         if (p.length > 2) {
                                                             if (p[2] != "flow") {
                                                                 var pathParts = p.slice(3, -1);
                                                                 for (var i = 0; i < pathParts.length; i++) {
                                                                     emit([p[0], p[2], pathParts.slice(0, i).join("/")], { dir: pathParts.slice(i, i + 1)[0] });
                                                                 }
                                                                 var meta = {};
                                                                 for (var key in doc.meta) {
                                                                     meta[key] = doc.meta[key];
                                                                 }
                                                                 meta.fn = p.slice(-1)[0];
                                                                 emit([p[0], p[2], pathParts.join("/")], meta);
                                                             }
                                                         }
                                                     }`
                                                 }
                                             };
                                             
                     CLIENT.postDocument({
                         db: dbname,
                         document: viewDocument,  
                     })
                     .then((documentResponse) => {
                         prepopulateFlows(resolve);
                     })
                     .catch((err) => {
                         reject("Failed to create view: " + err);
                     });
                 })
                 .catch((err) => {
                     if (err.code === 412) {
                         console.log(
                             'Cannot create "' + dbname + '" database, it already exists.'
                         );
                         reject("Failed to create database: " + err);
                     }
                 });
             });
         });
     },
 
     getFlows: function () {
         var key = appname + "/" + "flow";
         return new Promise(function (resolve, reject) {
             CLIENT.getDocument({
                 db: dbname,
                 docId: key,
             })
             .then((getDocumentResponse) => {
                 let document = getDocumentResponse.result;
                 currentFlowRev = document._rev;
                 resolve(document.flow);
             })
             .catch((err) => {
                 if (err.status != 404) {
                     reject(err.toString());
                 } else {
                     resolve([]);
                 }
             });
         });
     },
 
     saveFlows: function (flows) {
         var key = appname + "/" + "flow";
         return new Promise(function (resolve, reject) {
             var doc = { _id: key, flow: flows };
             if (currentFlowRev) {
                 doc._rev = currentFlowRev;
             }
 
             CLIENT.postDocument({
                 db: dbname,
                 document: doc,
             })
             .then((postDocumentResponse) => {
                 let document = postDocumentResponse.result;
                 currentFlowRev = document.rev;
                 resolve();
             })
             .catch((err) => {
                 reject(err.toString());
             });
         });
     },
 
     getCredentials: function () {
         var key = appname + "/" + "credential";
         return new Promise(function (resolve, reject) {
             CLIENT.getDocument({
                 db: dbname,
                 docId: key,
             })
             .then((getDocumentResponse) => {
                 let document = getDocumentResponse.result;
                 currentCredRev = document._rev;
                 resolve(document.credentials);
             })
             .catch((err) => {
                 if (err.status != 404) {
                     reject(err.toString());
                 } else {
                     resolve({});
                 }
             });
         });
     },
 
     saveCredentials: function (credentials) {
         var key = appname + "/" + "credential";
         return new Promise(function (resolve, reject) {
             var doc = { _id: key, credentials: credentials };
             if (currentCredRev) {
                 doc._rev = currentCredRev;
             }
             CLIENT.postDocument({
                 db: dbname,
                 document: doc,
             })
             .then((postDocumentResponse) => {
                 let document = postDocumentResponse.result;
                 currentCredRev = document.rev;
                 resolve();
             })
             .catch((err) => {
                 reject(err.toString());
             })
         });
     },
 
     getSettings: function () {
         var key = appname + "/" + "settings";
         return new Promise(function (resolve, reject) {
             CLIENT.getDocument({
                 db: dbname,
                 docId: key,
             })
             .then((getDocumentResponse) => {
                 let response = getDocumentResponse.result
                 currentSettingsRev = response._rev;
                 resolve(response.settings);
             })
             .catch((err) => {
                 if (err.status != 404) {
                     reject(err.toString());
                 } else {
                     resolve({});
                 }
             });
         });
     },
 
     saveSettings: function (settings) {
         var key = appname + "/" + "settings";
         return new Promise(function (resolve, reject) {
             var doc = { _id: key, settings: settings };
             if (currentSettingsRev) {
                 doc._rev = currentSettingsRev;
             }
 
             CLIENT.postDocument({
                 db: dbname,
                 document: doc,
             })
             .then((postDocumentResponse) => {
                 currentSettingsRev = postDocumentResponse.result.rev;
                 resolve();
             })
             .catch((err) => {
                 reject(err.toString());
             });
 
             return;
 
         });
     },
     
     // Unused code?
     
     /*
     getAllFlows: function () {
         var key = [appname, "flow"];
         return new Promise(function (resolve, reject) {
             CLIENT.getDocument({
                 db: dbname,
                 docId: "_design/library"
             })
             .then((getDocumentResponse) => {
                 console.log(getDocumentResponse);
             })
 
             flowDb.view('library', 'flow_entries_by_app_and_type', { key: key }, function (e, data) {
                 if (e) {
                     reject(e.toString());
                 } else {
                     var result = {};
                     for (var i = 0; i < data.rows.length; i++) {
                         var doc = data.rows[i];
                         var path = doc.value.path;
                         var parts = path.split("/");
                         var ref = result;
                         for (var j = 0; j < parts.length - 1; j++) {
                             ref['d'] = ref['d'] || {};
                             ref['d'][parts[j]] = ref['d'][parts[j]] || {};
                             ref = ref['d'][parts[j]];
                         }
                         ref['f'] = ref['f'] || [];
                         ref['f'].push(parts.slice(-1)[0]);
                     }
                     resolve(result);
                 }
             });
         });
     },
 
     getFlow: function (fn) {
         if (fn.substr(0) != "/") {
             fn = "/" + fn;
         }
         var key = appname + "/lib/flow" + fn;
         return new Promise(function (resolve, reject) {
             CLIENT.getDocument({
                 db: dbname,
                 docId: key,
             })
             .then((getDocumentResponse) => {
                 let document = getDocumentResponse.result;
                 resolve(document.flow);
             })
             .catch((err) => {
                 reject(err);
             });
         });
     },
 
     saveFlow: function (fn, data) {
         if (fn.substr(0) != "/") {
             fn = "/" + fn;
         }
         var key = appname + "/lib/flow" + fn;
         return new Promise(function (resolve, reject) {
             var doc = { _id: key, data: data };
 
             CLIENT.getDocument({
                 db: dbname,
                 docId: key,
             })
             .then((getDocumentResponse) => {
                 let oldFlow = getDocumentResponse.result;
 
                 doc._rev = oldFlow._rev    
             })
             .finally(() => {
                 CLIENT.postDocument({
                     db: dbname,
                     document: doc,
                 })
                 .then((postDocumentResponse) => {
                     resolve();
                 })   
                 .catch((err) => {
                     reject(err);
                 }); 
             });
         });
     },
 
     getLibraryEntry: function (type, path) {
         if (path != "" && path.substr(0, 1) != "/") {
             var key = appname + "/lib/" + type + "/" + path;
         } else {
             var key = appname + "/lib/" + type + path;
         }
 
         if (libraryCache[key]) {
             return Promise.resolve(libraryCache[key]);
         }
 
         return new Promise(function (resolve, reject) {
             flowDb.get(key, function (err, doc) {
                 if (err) {
                     if (path.substr(-1, 1) == "/") {
                         path = path.substr(0, path.length - 1);
                     }
                     var qkey = [appname, type, path];
                     flowDb.view('library', 'lib_entries_by_app_and_type', { key: qkey }, function (e, data) {
                         if (e) {
                             reject(e);
                         } else {
                             var dirs = [];
                             var files = [];
                             for (var i = 0; i < data.rows.length; i++) {
                                 var row = data.rows[i];
                                 var value = row.value;
 
                                 if (value.dir) {
                                     if (dirs.indexOf(value.dir) == -1) {
                                         dirs.push(value.dir);
                                     }
                                 } else {
                                     files.push(value);
                                 }
                             }
                             libraryCache[key] = dirs.concat(files);
                             resolve(libraryCache[key]);
                         }
                     });
                 } else {
                     libraryCache[key] = doc.body;
                     resolve(doc.body);
                 }
             });
         });
     },
     saveLibraryEntry: function (type, path, meta, body) {
 
         var p = path.split("/");    // strip multiple slash
         p = p.filter(Boolean);
         path = p.slice(0, p.length).join("/")
 
         if (path != "" && path.substr(0, 1) != "/") {
             path = "/" + path;
         }
         var key = appname + "/lib/" + type + path;
         return new Promise(function (resolve, reject) {
             var doc = { _id: key, meta: meta, body: body };
             flowDb.get(key, function (err, d) {
                 if (d) {
                     doc._rev = d._rev;
                 }
                 flowDb.insert(doc, function (err, d) {
                     if (err) {
                         reject(err);
                     } else {
                         var p = path.split("/");
                         for (var i = 0; i < p.length; i++) {
                             delete libraryCache[appname + "/lib/" + type + (p.slice(0, i).join("/"))]
                         }
                         libraryCache[key] = body;
                         resolve();
                     }
                 });
             });
 
         });
     }
     */
 };
 
 module.exports = cloudantStorage;
 