/*
 * ab_work_object_workspace_popupFilterDataTable
 *
 * Manage the data table's filters
 *
 */

const ABComponent = require("../classes/platform/ABComponent");
const RowFilter = require("../classes/platform/RowFilter");

module.exports = class AB_Work_Object_Workspace_PopupFilterDataTable extends ABComponent {
   constructor(App, idBase) {
      idBase = idBase || "ab_work_object_workspace_popupFilterDataTable";
      super(App, idBase);

      var L = this.Label;

      var labels = {
         common: App.labels
      };

      // internal list of Webix IDs to reference our UI components.
      var ids = {
         component: this.unique(idBase + "_popupFilter"),
         newfilterbutton: this.unique(idBase + "_popupFilter_newFilterButton"),
         filterform: this.unique(idBase + "_popupFilter_filterForm")
      };

      var CurrentObject = null;
      var DataFilter = new RowFilter(App, idBase);

      // webix UI definition:
      this.ui = {
         view: "popup",
         id: ids.component,
         width: 800,
         hidden: true,
         body: DataFilter.ui,
         on: {
            onShow: function() {
               _logic.onShow();
            }
         }
      };

      // setting up UI
      this.init = (options) => {
         // register our callbacks:
         for (var c in _logic.callbacks) {
            _logic.callbacks[c] = options[c] || _logic.callbacks[c];
         }

         webix.ui(this.ui);

         DataFilter.init({
            // when we make a change in the popups we want to make sure we save the new workspace to the properties to do so just fire an onChange event
            onChange: _logic.save
         });
      };

      // internal business logic
      var _logic = (this._logic = {
         callbacks: {
            /**
             * @function onChange
             * called when we have made changes to the hidden field settings
             * of our Current Object.
             *
             * this is meant to alert our parent component to respond to the
             * change.
             */
            onChange: function() {}
         },

         /**
          * @function objectLoad
          * Ready the Popup according to the current object
          * @param {ABObject} object  the currently selected object.
          */
         objectLoad: function(object) {
            CurrentObject = object;
            DataFilter.applicationLoad(
               CurrentObject ? CurrentObject.application : null
            );
            DataFilter.fieldsLoad(CurrentObject ? CurrentObject.fields() : []);
         },

         /**
          * @function show
          * show the popup
          *
          */
         show: function($view, fieldId) {
            $$(ids.component).show($view);
         },

         /**
          * @function onShow
          * Ready the Popup according to the current object each time it is shown (perhaps a field was created or delted)
          */
         onShow: function() {
            // populate settings to RowFilter
            DataFilter.setValue(CurrentObject.currentView().filterConditions);
         },

         /**
          * @function save
          * save .where settings to current object
          */
         save: function() {
            const filterConditions = DataFilter.getValue();

            CurrentObject.currentView().update({ filterConditions });

            // old method:

            // CurrentObject.workspaceFilterConditions = DataFilter.getValue();
            CurrentObject.save()
               .then(function() {
                  _logic.callbacks.onChange();
               })
               .catch(function(err) {
                  OP.Error.log("Error trying to save filterConditions", {
                     error: err,
                     filters: filterConditions
                  });
               });
         }
      });

      // Expose any globally accessible Actions:
      this.actions({
         /**
          * @function populateApplicationForm()
          *
          * Initialze the Form with the values from the provided
          * ABApplication.
          *
          * If no ABApplication is provided, then show an empty form.
          * (create operation)
          *
          * @param {ABApplication} Application
          *      [optional] The current ABApplication we are working with.
          */
         // populateApplicationForm: function(Application){
         // 	_logic.formReset();
         // 	if (Application) {
         // 		// populate Form here:
         // 		_logic.formPopulate(Application);
         // 	}
         // 	_logic.permissionPopulate(Application);
         // 	_logic.show();
         // }
      });

      // Interface methods for parent component:
      this.objectLoad = _logic.objectLoad;
      this.show = _logic.show;
   }
};
