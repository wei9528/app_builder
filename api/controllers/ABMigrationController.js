/**
 * ABMigrationController
 *
 * @description :: Server-side logic for managing updating the table & column information
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var AD = require("ad-utils");
var _ = require("lodash");
var path = require("path");
var async = require("async");

var ABGraphObject = require(path.join("..", "graphModels", "ABObject"));

var reloading = null;

module.exports = {
   /**
    * createObject
    *
    * post app_builder/migrate/object/:objID
    */
   createObject: function(req, res) {
      simpleObjectOperation(req, res, "createObject");
   },

   /**
    * dropObject
    *
    * delete app_builder/migrate/object/:objID
    */
   dropObject: function(req, res) {
      simpleObjectOperation(req, res, "dropObject");
   },

   /**
    * createField
    *
    * post app_builder/migrate/object/:objID/field/:fieldID
    */
   createField: function(req, res) {
      simpleFieldOperation(req, res, "createField");
   },

   /**
    * updateField
    *
    * put app_builder/migrate/object/:objID/field/:fieldID
    */
   updateField: function(req, res) {
      simpleFieldOperation(req, res, "updateField");
   },

   /**
    * dropField
    *
    * delete app_builder/migrate/object/:objID/field/:fieldID
    */
   dropField: function(req, res) {
      simpleFieldOperation(req, res, "dropField");
   },

   /**
    * createIndex
    *
    * post app_builder/migrate/object/:objID/index/:indexID
    */
   createIndex: function(req, res) {
      let newIndexVals = req.body;
      let objID = req.param("objID", -1);

      return (Promise.resolve()
            .then(() => ABGraphObject.findOne(objID))
            .then(
               (objectData) =>
                  new Promise((next, err) => {
                     if (!objectData) {
                        let missingObj = new Error("Missing Object");
                        missingObj.objID = objID;
                        console.log(`Error: Missing Object from id: ${objID}`);
                        return err(missingObj);
                     }

                     let object = objectData.toABClass();
                     let index = object.application.indexNew(
                        newIndexVals,
                        object
                     );
                     next(index);
                  })
            )
            // Create MySQL index
            .then((index) => ABMigration.createIndex(index))
            // TODO: Save index to ABObject
            .then(function() {
               res.AD.success({ good: "job" });
            })
            .catch(function(err) {
               ADCore.error.log("ABMigration.createIndex() failed:", {
                  error: err
               });
               res.AD.error(err, 500);
            })
      );
   },

   /**
    * dropField
    *
    * delete app_builder/migrate/object/:objID/index/:indexID
    */
   dropIndex: function(req, res) {
      simpleIndexOperation(req, res, "dropIndex")
         .then(function() {
            res.AD.success({ good: "job" });
         })
         .catch(function(err) {
            ADCore.error.log("ABMigration.dropIndex() failed:", {
               error: err
            });
            res.AD.error(err, 500);
         });
   }
};

// // Utility:
// function verifyAndReturnObject(req, res) {

//     return new Promise(
//         (resolve, reject) => {

//             var appID = req.param('appID', -1);
//             var objID = req.param('objID', -1);

//             sails.log.verbose('... appID:'+appID);
//             sails.log.verbose('... objID:'+objID);

//             // Verify input params are valid:
//             var invalidError = null;

//             if (appID == -1) {
//                 invalidError = ADCore.error.fromKey('E_MISSINGPARAM');
//                 invalidError.details = 'missing application.id';
//             } else if (objID == -1) {
//                 invalidError = ADCore.error.fromKey('E_MISSINGPARAM');
//                 invalidError.details = 'missing object.id';
//             }
//             if(invalidError) {
//                 sails.log.error(invalidError);
//                 res.AD.error(invalidError, 400);
//                 reject();
//             }

//             ABApplication.findOne({id: appID})
//             .then(function(app) {

//                 if( app ) {

//                     var Application = app.toABClass();
//                     var object = Application.objects((o) => { return o.id == objID; })[0];

//                     if (object) {

//                         resolve( object );

//                     } else {

//                         // error: object not found!
//                         var err = ADCore.error.fromKey('E_NOTFOUND');
//                         err.message = "Object not found.";
//                         err.objid = objID;
//                         sails.log.error(err);
//                         res.AD.error(err, 404);
//                         reject();
//                     }

//                 } else {

//                         // error: couldn't find the application
//                         var err = ADCore.error.fromKey('E_NOTFOUND');
//                         err.message = "Application not found.";
//                         err.appID = appID;
//                         sails.log.error(err);
//                         res.AD.error(err, 404);
//                         reject();
//                 }

//             })
//             .catch(function(err) {
//                 ADCore.error.log('ABApplication.findOne() failed:', { error:err, message:err.message, id:appID });
//                 res.AD.error(err);
//                 reject();
//             });

//         }
//     )

// }

function verifyAndReturnField(req, res) {
   return new Promise((resolve, reject) => {
      let objID = req.param("objID", -1);

      // AppBuilder.routes.verifyAndReturnObject(req, res)
      ABGraphObject.findOne(objID)
         .then(function(objectData) {
            if (!objectData) {
               var missingObj = new Error("Missing Object");
               missingObj.objID = objID;
               console.log(`Error: Missing Object from id: ${objID}`);
               return reject(missingObj);
            }

            let object = objectData.toABClass();

            var fieldID = req.param("fieldID", -1);

            sails.log.verbose("... fieldID:" + fieldID);

            // Verify input params are valid:
            if (fieldID == -1) {
               var invalidError = ADCore.error.fromKey("E_MISSINGPARAM");
               invalidError.details = "missing field.id";
               sails.log.error(invalidError);
               res.AD.error(invalidError, 400);
               reject();
            }

            // find and return our field
            var field = object.fields((f) => {
               return f.id == fieldID;
            })[0];
            if (field) {
               resolve(field);
            } else {
               // error: field not found!
               var err = ADCore.error.fromKey("E_NOTFOUND");
               err.message = "Field not found.";
               err.fieldID = fieldID;
               sails.log.error(err);
               res.AD.error(err, 404);
               reject();
            }
         }, reject)
         .catch(reject);
   });
}

function simpleObjectOperation(req, res, operation) {
   res.set("content-type", "application/javascript");

   sails.log.info("ABMigrationConroller." + operation + "()");

   let objID = req.param("objID", -1);

   // NOTE: verifyAnd...() handles any errors and responses internally.
   // only need to responde to an object being passed back on .resolve()
   AppBuilder.routes
      .verifyAndReturnObject(req, res)
      // ABGraphObject.findOne(objID)
      .then(function(object) {
         // let object = objectData.toABClass();

         ABMigration[operation](object)
            .then(function() {
               res.AD.success({ good: "job" });
            })
            .catch(function(err) {
               ADCore.error.log("ABMigration" + operation + "() failed:", {
                  error: err,
                  object: object
               });
               res.AD.error(err, 500);
            });
      });
}

function simpleFieldOperation(req, res, operation) {
   res.set("content-type", "application/javascript");

   sails.log.info("ABMigrationConroller." + operation + "()");

   // NOTE: verifyAnd...() handles any errors and responses internally.
   // only need to respond to a field being passed back on .resolve()
   verifyAndReturnField(req, res).then(function(field) {
      ABMigration[operation](field)
         .then(function() {
            // make sure this field's object's model cache is reset
            field.object.modelRefresh();

            res.AD.success({ good: "job" });
         })
         .catch(function(err) {
            ADCore.error.log("ABMigration." + operation + "() failed:", {
               error: err,
               field: field
            });
            res.AD.error(err, 500);
         });
   });
}

function simpleIndexOperation(req, res, operation) {
   res.set("content-type", "application/javascript");

   sails.log.info("ABMigrationConroller." + operation + "()");

   let objID = req.param("objID", -1);
   let indexID = req.param("indexID", -1);
   if (!objID || !indexID) {
      res.AD.error("Bad parameters", 400);
      return Promise.reject();
   }

   return Promise.resolve()
      .then(() => ABGraphObject.findOne(objID))
      .then(
         (objectData) =>
            new Promise((next, err) => {
               if (!objectData) {
                  let missingObj = new Error("Missing Object");
                  missingObj.objID = objID;
                  console.log(`Error: Missing Object from id: ${objID}`);
                  return err(missingObj);
               }

               let object = objectData.toABClass();

               let index = object.indexes((idx) => idx.id == indexID)[0];
               if (!index) {
                  let missingIndex = new Error("Missing Index");
                  missingIndex.objID = indexID;
                  console.log(`Error: Missing Index from id: ${indexID}`);
                  return err(missingIndex);
               }

               next(index);
            })
      )
      .then((index) => ABMigration[operation](index));
}
