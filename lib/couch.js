var http = require('http');
var util = require('util');

var Couch = function(host, port) {
   this.host = host || "localhost";
   this.port = port || 5984;
};

Couch.prototype = {

   getAll : function(db, callback) {
      var options = {"url" : url = "/" + db + "/_all_docs"};
      this.request(options, callback);
   },

   getView : function(db, design, view, callback) {
      var options = {"url" : "/" + db + "/_design/" + design + "/_view/" + view};
      this.request(options, callback);
   },

   getOne : function(db, id, callback) {
      var options = {"url" : "/" + db + "/" + id};
      this.request(options, callback);
   },

   insert : function(db, obj, callback) {
      var options = {"url" : "/" + db,
                     "postData" : JSON.stringify(obj),
                     "method" : "POST"};
      this.request(options, callback);
   },

   update : function(db, id, obj, callback) {
      var options = {"url" : "/" + db + "/" + id,
                     "postData" : JSON.stringify(obj),
                     "method" : "PUT"};
      this.request(options, callback);
   },

   delete : function(db, id, rev, callback) {
      var options = {"url" : "/" + db + "/" + id + "?rev=" + rev,
                     "method" : "DELETE"};
      this.request(options, callback);
   },

   request : function(options, callback) {
      if (!options.hasOwnProperty('url')) {
         throw "Couch request must have url";
      }
      var url = options.url;
      var client = http.createClient(this.port, this.host);
      var method = (options.hasOwnProperty('method')
                        ? options.method
                        : 'GET');
      var postData = (options.hasOwnProperty('postData')
                        ? options.postData
                        : false);
      var headers = {"host": this.host,
                     "Referer" : "http://localhost/",
                     "Content-Type" : "application/json"};
      if (typeof options.headers === "object") {
         for (var key in options.headers) {
            headers[key] = options.headers[key];
         }
      }
      var request = client.request(method, url, headers);
      request.on('error', function(err) {
         util.log('ERROR: ' + err);
      });
      if (typeof postData === "string") {
         request.write(postData);
      }
      request.end();
      request.on('response', function(response) {
         var data = '';
         response.setEncoding('utf8');
         response.on('data', function(chunk) {
            data += chunk;
         });
         response.on('end', function() {
            if (typeof callback === "function") {
               callback(JSON.parse(data));
            }
         });
      });
   }
};

exports.Couch = Couch;
