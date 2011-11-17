CouchDB Object Wrapper
======================

COW is a CouchDB interface for use with node.js.
This is a first revision, so take it with a grain of salt.

##Basic use

###Create a new document

    var Cow = require("./cow").Cow;
    var util = require("util");
    var database = "mydb";
    var record = new Cow(database);

    record.ready(function() {
       /*
        * this refers to the document fields
        * record is the Cow object
        */

       record.some_attribute = 7; // this is wrong, will not work
       this.save(); // this is an error, node will explode

       this.some_attribute = 7; // this is correct
       record.save(function() { // this is correct
          util.puts("safe!");
       });
    });

###Retrieve and update an existing document

    var Cow = require("./cow").Cow;
    var util = require("util");
    var database = "mydb";
    var id = "fe7c28a47e548fe95b6f1249dd004ba4";
    var record = new Cow(database, id);

    record.ready(function() {
       this.some_attribute += 5;
       record.save(function() {
          util.puts("safe!");
       });
    });

###Get all documents from a database

    var Cow = require("./cow").Cow;
    var database = "mydb";

    Cow.find({"db" : database,
              "callback" : function(records) {
                 records.done(function() {
                    records.each(function(record) {
                       this.some_attribute *= 2;
                       record.save();
                    });
                 });
              }
    });

###Get all documents from a view

    var Cow = require("./cow").Cow;
    var util = require("util");
    var database = "mydb";
    var view = "myview";
    var design = "mydesign";

    Cow.find({"db" : database,
              "view" : view,
              "design" : design,
              "callback" : function(records) {
                 records.done(function() {
                    var attrlist = '';
                    records.each(function(record) {
                       attrlist += this.some_attribute + " ";
                       util.puts(attrlist);
                    });
                 });
              }
    });
