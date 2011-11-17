var Couch = require("./couch").Couch;
var util = require("util");

var CowList = function() {
   this.list = [];
   this.count = 0;
   this.readyCount = 0;
   this.doneCallback = null;
};

CowList.prototype = {

   push : function(record) {
      this.list.push(record);
      this.count = this.list.length;
      var tthis = this;
      record.ready(function() {
         tthis.anotherDone();
      });
   },

   each : function(callback) {
      for (var i in this.list) {
         this.list[i].ready(callback);
      }
   },

   anotherDone : function() {
      this.readyCount += 1;
      if (this.readyCount == this.count) {
         if (this.doneCallback !== null) {
            this.doneCallback.call(this);
         }
      }
   },

   done : function(callback) {
      this.doneCallback = callback;
      if (this.readyCount == this.count) {
         this.doneCallback.call(this);
      }
   }

};

var Cow = function(options) {
   var tthis, runc, host, post;
   options = options || {};
   port = options.port || null;
   host = options.host || null;
   this.id = false;
   this.obj = {};
   this.callbacks = [];
   this.loading = false;
   this.couch = new Couch(host, port);

   if (typeof arguments[0] === "string") {
      this.db = arguments[0];
   } else {
      throw "Error: Cow constructor requires db name as argument[0]";
   }
   if (typeof arguments[1] === "string") {
      this.id = arguments[1];
      this.loading = true;
      tthis = this;
      runc = (function(data) {
         tthis.obj = data;
         tthis.id = data._id;
         tthis.rev = data._rev;
         tthis.loading = false;
         tthis.runCallbacks();
      });
      this.couch.getOne(this.db, this.id, runc);
   } else if (typeof (arguments[1] === "function")) {
      this.ready(arguments[1]);
   }
   if (typeof arguments[2] === "function") {
      this.ready(arguments[2]);
   }
}

Cow.find = function(options) {
   var db,
       host,
       port,
       callback,
       couch;
   if (typeof options !== "object") {
      options = {};
   }
   host = options.host || null;
   port = options.port || null;
   couch = new Couch(host, port);
   if (options.hasOwnProperty("callback")) {
      callback = options.callback;
   } else {
      callback = function() {};
   }

   function fetchAll(data) {
      var list = new CowList();
      var cow;
      for (var i in data.rows) {
         cow = new Cow(db, data.rows[i].id);
         list.push(cow);
      }
      callback(list);
   };

   function wrapAll(data) {
      var list = new CowList();
      var cow;
      for (var i in data.rows) {
         cow = new Cow(db);
         cow.id = data.rows[i]._id;
         cow.rev = data.rows[i]._rev;
         cow.obj = data.rows[i].value;
         list.push(cow);
      }
      callback(list);
   };

   function wrapOne(data) {
      var cow;
      cow = new Cow(db);
      cow.id = data._id;
      cow.rev = data._rev;
      cow.obj = data;
      callback(cow);
   };

   if (options.hasOwnProperty("db")) {
      db = options.db;
   } else {
      throw "ERROR: Cow find requires db option";
   }
   if (options.hasOwnProperty("id")) {
      couch.getOne(db, options.id, wrapOne);
   } else if (options.hasOwnProperty("view")) {
      if (!options.hasOwnProperty("design")) {
         throw "ERROR: Cow view find requires design option";
      }
      couch.getView(db, options.design, options.view, wrapAll);
   } else {
      couch.getAll(db, fetchAll);
   }
};

Cow.prototype = {
   ready : function(callback) {
      if (typeof callback === "function") {
         this.callbacks.push(callback);
      }
      if (this.loading !== true) {
         this.runCallbacks();
      }
   },

   save : function(callback) {
      if (typeof callback !== "function") {
         callback = function() {};
      }
      var tthis = this;
      var runc = (function() {
         tthis.runCallbacks();
      });
      this.loading = true;
      this.ready(callback);
      if (this.id) {
         this.couch.update(this.db, this.id, this.obj, runc);
      } else {
         this.couch.insert(this.db, this.obj, runc);
      }
   },

   delete : function(callback) {
      if (typeof callback !== "function") {
         callback = function() {};
      }
      var tthis = this;
      var runc = (function() {
         tthis.runCallbacks();
      });
      this.loading = true;
      this.ready(callback);
      if (this.id && this.rev) {
         this.couch.delete(this.db, this.id, this.rev, runc);
      }
   },

   runCallbacks : function() {
      for (var i in this.callbacks) {
         this.callbacks[i].call(this.obj, this);
         delete this.callbacks[i];
      }
   }

};

exports.Cow = Cow;
