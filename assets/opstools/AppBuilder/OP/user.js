import Comm from "./comm/comm";

class OPUser {
   constructor() {
      // get current user
      if (this.currentUser == null) {
         Comm.Service.get({ url: "/site/user/data" }).then((data) => {
            this.currentUser = data.user;
         });
      }

      // get the user list
      if (this.userList == null) {
         Comm.Service.get({ url: "/app_builder/user/list" }).then((data) => {
            this.userList = data;
         });
      }
   }
}

export default {
   id: function() {
      return this.user().id;
   },

   init: function() {
      if (!this.__user) this.__user = new OPUser();
   },

   user: function() {
      return this.__user.currentUser || {};
   },

   username: function() {
      return this.user().username;
   },

   userlist: function() {
      return this.__user.userList || [];
   }
};
