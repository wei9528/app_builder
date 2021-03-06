/**
 * ABProcessController
 *
 * @description :: Server-side logic for managing our process apis
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const AB = require("ab-utils");
const reqAB = AB.reqAB({}, {});
reqAB.jobID = "ABProcessController.userInbox";

const async = require("async");

function getRoleObject() {
   const ROLE_OBJECT_ID = ABSystemObject.getObjectRoleId();
   return ABObjectCache.get(ROLE_OBJECT_ID);
}

// the input validations for the userInboxUpdate route:
var validationUserInboxUpdate = {
   uuid: {
      type: "string",
      required: true
   },
   response: {
      type: "string",
      required: true
   }
};

module.exports = {
   // get /process/inbox
   // retrieve the list of a users inbox notifications:
   userInbox: (req, res) => {
      var User = req.AD.user();
      var user = User.userModel.uuid || User.userModel.id;
      var roles = [];
      var inboxItems = null;

      async.series(
         [
            (done) => {
               // lookup User's Roles:
               // Permission.find({ user: User.userModel.id })
               //     .then((list) => {
               //         if (list && list.length > 0) {
               //             list.forEach((perm) => {
               //                 console.log("user perm:", perm);
               //                 roles.push(perm.role);
               //             });
               //         }
               //         done();
               //     })
               //     .catch(done);

               let RoleModel = getRoleObject();

               let cond = {
                  where: {
                     glue: "and",
                     rules: [
                        {
                           key: "users",
                           rule: "contains",
                           value: User.username()
                        }
                     ]
                  }
               };

               // if (cond.populate == null) cond.populate = true;

               RoleModel.queryFind(cond, req.user.data)
                  .catch(done)
                  .then((list) => {
                     (list || []).forEach((l) => {
                        roles.push(l.uuid);
                     });
                     done();
                  });
            },
            (done) => {
               var jobData = {
                  roles,
                  users: [User.userModel.uuid]
               };
               reqAB.serviceRequest(
                  "process_manager.inbox.find",
                  jobData,
                  (err, results) => {
                     inboxItems = results;
                     done(err);
                  }
               );
            }
         ],
         (err) => {
            if (err) {
               console.error("Error gathering inbox items: " + err.toString());
               res.AD.error(err);
               return;
            }
            res.AD.success(inboxItems);
         }
      );
   },

   // post /process/inbox/:uuid
   // param.response : {string}
   // update a given inbox item with it's response.
   userInboxUpdate: (req, res) => {
      // note: reqAB.validateParameters() are not supported under
      // node v6:

      // if (
      //     !reqAB.validateParameters(
      //         validationUserInboxUpdate,
      //         false,
      //         req.allParams()
      //     )
      // ) {
      //     var error = reqAB.errorValidation();
      //     reqAB.validationReset();
      //     res.AD.error(error);
      //     return;
      // }

      var User = req.AD.user();
      var user = User.userModel.id;

      var uuid = req.param("uuid");
      var response = req.param("response");

      if (!uuid || !response) {
         res.AD.error({
            message: "both uuid && response values are required."
         });
         return;
      }

      var jobData = {
         user,
         uuid,
         response
      };
      reqAB.serviceRequest(
         "process_manager.inbox.update",
         jobData,
         (err, updatedForm) => {
            if (err) {
               res.AD.error(err);
               return;
            }
            console.log(updatedForm);
            if (Array.isArray(updatedForm)) {
               updatedForm.forEach((form) => {
                  ABProcess.run(form.process);
               });
            } else {
               // Now notify this process instance that it need to run again:
               ABProcess.run(updatedForm.process);
            }

            res.AD.success({});
         }
      );
   }
};
