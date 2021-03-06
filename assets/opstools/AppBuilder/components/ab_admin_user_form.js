const ABComponent = require("../classes/platform/ABComponent");

const ABAdminFormInfo = require("./ab_admin_user_form_info");
const ABAdminFormRole = require("./ab_admin_user_form_role");

module.exports = class AB_Work_Admin_User_Form extends ABComponent {
   constructor(App) {
      super(App, "ab_admin_user_form");

      let L = this.Label;

      let FormInfo = new ABAdminFormInfo(App);
      let FormRole = new ABAdminFormRole(App);

      // internal list of Webix IDs to reference our UI components.
      let ids = {
         component: this.unique("component")
      };

      // Our webix UI definition:
      this.ui = {
         id: ids.component,
         type: "space",
         rows: [
            {
               borderless: true,
               type: "space",
               cols: [FormInfo.ui, FormRole.ui]
            }
         ]
      };

      // Our init() function for setting up our UI
      this.init = (userDC) => {
         this._userDC = userDC;

         FormInfo.init(userDC);
         FormRole.init(userDC);
      };

      // our internal business logic
      let _logic = {
         /**
          * @function show()
          *
          * Show this component.
          */
         show: function() {
            $$(ids.component).show();

            FormRole.show();
         }
      };

      this._logic = _logic;

      //
      // Define our external interface methods:
      //
      this.show = _logic.show;
   }
};
