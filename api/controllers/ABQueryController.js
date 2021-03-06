/**
 * ABQueryController
 *
 * @description :: Server-side logic for managing Abapplications
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var path = require("path");

var ABGraphApplication = require(path.join(
   "..",
   "graphModels",
   "ABApplication"
));
var ABGraphQuery = require(path.join("..", "graphModels", "ABQuery"));

module.exports = {
   _config: {
      model: "abquery", // all lowercase model name
      actions: false,
      shortcuts: false,
      rest: false
   },

   /**
    * GET /app_builder/application/:appID/query
    *
    * Get queries of application
    */
   queryApplication: function(req, res) {
      let appID = req.param("appID");

      ABGraphQuery.findWithRelation("applications", appID, {
         relations: ["objects"]
      })
         .catch(res.AD.error)
         .then((queries) => {
            res.AD.success(queries || []);
         });
   },

   /**
    * GET /app_builder/query
    *
    * Find queries
    */
   queryFind: function(req, res) {
      let cond = req.query;

      ABGraphQuery.find({
         relations: ["objects"],
         where: cond
      })
         .catch(res.AD.error)
         .then((queries) => {
            res.AD.success(queries || []);
         });
   },

   /**
    * GET /app_builder/query/:queryID
    *
    * Get a query
    */
   queryFindOne: function(req, res) {
      let queryID = req.param("queryID");

      ABGraphQuery.findOne(queryID, {
         relations: ["objects"]
      })
         .catch(res.AD.error)
         .then((query) => {
            res.AD.success(query);
         });
   },

   /**
    * GET /app_builder/query/info
    *
    */
   queryInfo: function(req, res) {
      let cond = req.query;

      ABGraphQuery.find({
         select: ["id", "translations"],
         where: cond
      })
         .catch(res.AD.error)
         .then((queries) => {
            res.AD.success(queries || []);
         });
   },

   /**
    * PUT /app_builder/query?appID=[appId]
    *
    * Add a new query
    */
   querySave: function(req, res) {
      let appID = req.query.appID;
      let query = req.body.query;

      Promise.resolve()

         // Set view name of this query
         .then(() => {
            return new Promise((next, error) => {
               // If view name is set, then skip this step
               if (query.viewName || !appID) return next();

               ABGraphApplication.findOne(appID)
                  .catch((errMessage) => {
                     error(errMessage);
                     res.AD.error("Could not found application");
                  })
                  .then((app) => {
                     if (!app) {
                        res.AD.error("Could not found application");
                        return error(errMessage);
                     }

                     let appClass = app.toABClass();

                     // Set table name here
                     query.viewName = AppBuilder.rules.toObjectNameFormat(
                        appClass.dbApplicationName(),
                        "View_" + query.name
                     );

                     next();
                  });
            });
         })

         // Save query
         .then(() => {
            return new Promise((next, error) => {
               ABGraphQuery.upsert(query.id, query)
                  .catch((errMessage) => {
                     error(errMessage);
                     res.AD.error(true);
                  })
                  .then((result) => {
                     query = result;

                     next();
                  });
            });
         })

         // Set relation to application
         .then(() => {
            return new Promise((next, error) => {
               if (appID == null) return next();

               query
                  .relate(ABGraphQuery.relations.applications, appID)
                  .catch((errMessage) => {
                     error(errMessage);
                     res.AD.error(true);
                  })
                  .then(() => {
                     next();
                  });
            });
         })

         // Clear relations of objects
         .then(() => {
            return new Promise((next, error) => {
               query
                  .clearRelate("objects")
                  .catch((errMessage) => {
                     error(errMessage);
                     res.AD.error(true);
                  })
                  .then(() => {
                     next();
                  });
            });
         })

         // Set relation to objects
         .then(() => {
            let tasks = [];

            let storeObjectId = (parentObjectId, alias, joins = {}) => {
               let parentObject = ABObjectCache.get(parentObjectId);

               // relate to object
               tasks.push(
                  query.relate("objects", parentObjectId, {
                     alias: alias // store alias name
                  })
               );

               // loop join
               (joins.links || []).forEach((link) => {
                  let field = parentObject.fields(
                     (f) => f.id == link.fieldID
                  )[0];
                  if (!field) return;

                  let nextObjectId = field.settings.linkObject;

                  storeObjectId(nextObjectId, link.alias, link);
               });
            };

            // start to store join objects
            storeObjectId(query.joins.objectID, query.joins.alias, query.joins);

            return Promise.all(tasks);
         })

         // Pull query data
         .then(() => {
            return new Promise((next, error) => {
               ABGraphQuery.findOne(query.id, {
                  relations: ["objects"]
               })
                  .catch(error)
                  .then((queryData) => {
                     next(queryData);
                  });
            });
         })

         // Create/Update SQL view
         .then((q) => {
            return new Promise((next, error) => {
               let qClass = q.toABClass();

               ABMigration.createQuery(qClass)
                  .catch(error)
                  .then(() => {
                     next(q);
                  });
            });
         })

         // Final - Pass result
         .then((query) => {
            res.AD.success(query);
         });
   },

   /**
    * DELETE /app_builder/query/:queryID
    *
    * Delete a query
    */
   queryDestroy: function(req, res) {
      let queryID = req.param("queryID");

      Promise.resolve()

         // Remove from DB
         .then(() => ABGraphQuery.remove(queryID), res.AD.error)

         // Drop SQL view
         .then((removedQuery) => {
            let qClass = removedQuery.toABClass();
            return ABMigration.dropQuery(qClass);
         }, res.AD.error)

         .then(() => res.AD.success(true));
   },

   /**
    * PUT /app_builder/application/:appID/query/:queryID
    *
    * Import query to application
    */
   importQuery: function(req, res) {
      let appID = req.param("appID"),
         queryID = req.param("queryID");

      let application, query;

      Promise.resolve()

         // Get an application
         .then(() => {
            return new Promise((next, err) => {
               ABGraphApplication.findOne(appID, {
                  relations: ["queries"]
               })
                  .catch(err)
                  .then((app) => {
                     application = app;

                     next();
                  });
            });
         })

         // Get a query
         .then(() => {
            return new Promise((next, err) => {
               ABGraphQuery.findOne(queryID, {
                  relations: ["objects"]
               })
                  .catch(err)
                  .then((q) => {
                     query = q;

                     next();
                  });
            });
         })

         // Set relate
         .then(() => {
            return new Promise((next, err) => {
               // if exists
               if (application.queries.filter((q) => q.id == queryID)[0])
                  return next();

               application
                  .relate("queries", query.id)
                  .catch(err)
                  .then(() => {
                     next();
                  });
            });
         })

         // Return a object to result
         .then(() => {
            return new Promise((next, err) => {
               res.AD.success(query);
               next();
            });
         });
   },

   /**
    * DELETE /app_builder/application/:appID/query/:queryID
    *
    * Exclude query from application
    */
   excludeQuery: function(req, res) {
      let appID = req.param("appID"),
         queryID = req.param("queryID");

      ABGraphQuery.unrelate(ABGraphQuery.relations.applications, appID, queryID)
         .catch(res.AD.error)
         .then(() => {
            res.AD.success(true);
         });
   }
};
