
/*
 * ab_work_object_workspace_popupHideFields
 *
 * Manage the Hide Fields popup.
 *
 */

import ABApplication from "../classes/ABApplication"



function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}


var labels = {

	component: {

		showAll: L('ab.visible_fields.showAll', "*Show All"),
		hideAll: L('ab.visible_fields.hideAll', "*Hide All"),
		errorFrozen: L('ab.visible_fields.errorFrozen', "*Sorry, you cannot hide your last frozen column."),
	}
}


var idBase = 'ab_work_object_workspace_popupHideFields';
OP.Component.extend(idBase, function(App) {

	labels.common = App.labels;


	// internal list of Webix IDs to reference our UI components
	var ids = {
		component: App.unique(idBase + '_component'),
		list: App.unique(idBase + "_list"),
	}


	// Our webix UI definition:
	var _ui = {
		view:"popup",
		id: ids.component,
		// modal: true,
		autoheight:true,
        body: {
            rows: [
                {
                    cols: [
                        {
                            view: 'button',
                            value: labels.component.showAll,
                            click: function () {
								_logic.clickShowAll();
                            }
                        },
                        {
                            view: 'button',
                            value: labels.component.hideAll,
                            click: function () {
								_logic.clickHideAll()
                            }
                        }
                    ]
                },
                {
                    view: 'list',
                    id: ids.list,
                    autoheight: true,
                    select: false,
                    template: '<span style="min-width: 18px; display: inline-block;"><i class="fa fa-circle ab-visible-field-icon"></i>&nbsp;</span> #label#',
                    on: {
                        onItemClick: function (id, e, node) {
							_logic.clickListItem(id, e, node);
                        }
                    }
                }
            ]
        },
        on: {
            onShow: function () {
				_logic.onShow();
                _logic.iconsReset();
            }
        }
    }



	// Our init() function for setting up our UI
	var _init = function(options) {

		// register our callbacks:
		for(var c in _logic.callbacks) {
			_logic.callbacks[c] = options[c] || _logic.callbacks[c];
		}

	}


	var CurrentObject = null;

	// our internal business logic
	var _logic = {

		callbacks:{

			/**
			 * @function onChange
			 * called when we have made changes to the hidden field settings
			 * of our Current Object.
			 *
			 * this is meant to alert our parent component to respond to the
			 * change.
			 */
			onChange:function(){}
		},


		/**
		 * @function clickHideAll
		 * the user clicked the [hide all] option.  So hide all our fields.
		 */
		clickHideAll: function () {

			// create an array of all our field.id's:
			var allFields = CurrentObject.fields();
			var newHidden = [];
			allFields.forEach(function(f){
				newHidden.push(f.columnName);
			})

			// store that
			CurrentObject.workspaceHiddenFields = newHidden;
			CurrentObject.save()
			.then(function(){
				_logic.iconsReset()
				_logic.callbacks.onChange()
			})
			.catch(function(err){
				OP.Error.log('Error trying to save workspaceHiddenFields', {error:err, fields:newHidden });
			})
		},


		/**
		 * @function clickShowAll
		 * the user clicked the [show all] option.  So show all our fields.
		 */
		clickShowAll: function () {

			// store an empty array of hidden fields
			CurrentObject.workspaceHiddenFields = [];
			CurrentObject.save()
			.then(function(){
				_logic.iconsReset();
				_logic.callbacks.onChange()
			})
			.catch(function(err){
				OP.Error.log('Error trying to save workspaceHiddenFields', {error:err, fields:newHidden });
			})
		},


		/**
		 * @function clickListItem
		 * update the clicked field setting.
		 */
		clickListItem: function(id, e, node) {
			var List = $$(ids.list);
			var item = List.getItem(id);
			if (CurrentObject.workspaceFrozenColumnID == item.columnName) {
				OP.Dialog.Alert({
					text: labels.component.errorFrozen
				});
				return;
			}

			var newFields = [];
			var isHidden = CurrentObject.workspaceHiddenFields.filter((fID) => { return fID == item.columnName;}).length>0;
			if (isHidden) {
				// unhide this field

				// get remaining fields
				newFields = CurrentObject.workspaceHiddenFields.filter((fID)=>{ return fID != item.columnName;});

				// find the icon and display it:
				_logic.iconShow(node);

			} else {
				newFields = CurrentObject.workspaceHiddenFields;
				newFields.push(item.columnName);

				_logic.iconHide(node);
			}

			// update our Object with current hidden fields
			CurrentObject.workspaceHiddenFields = newFields;
			CurrentObject.save()
			.then(function(){
				_logic.callbacks.onChange()
			})
			.catch(function(err){
				OP.Error.log('Error trying to save workspaceHiddenFields', {error:err, fields:newFields });
			})
		},

		/**
		 * @function iconFreezeOff
		 * Remove thumb tack if the field is not the choosen frozen column field
		 * @param {DOM} node  the html dom node of the element that contains our icon
		 */
		iconFreezeOff: function(node) {
			if (node) {
				node.querySelector('.ab-visible-field-icon').classList.remove("fa-thumb-tack");
				node.querySelector('.ab-visible-field-icon').classList.add("fa-circle");
			}
		},

		/**
		 * @function iconFreezeOn
		 * Show a thumb tack if the field is the choosen frozen column field
		 * @param {DOM} node  the html dom node of the element that contains our icon
		 */
		iconFreezeOn: function(node) {
			if (node) {
				node.querySelector('.ab-visible-field-icon').classList.remove("fa-circle");
				node.querySelector('.ab-visible-field-icon').classList.add("fa-thumb-tack");
			}
		},


		/**
		 * @function iconHide
		 * Hide the icon for the given node
		 * @param {DOM} node  the html dom node of the element that contains our icon
		 */
		iconHide: function(node) {
			if (node) {
				node.querySelector('.ab-visible-field-icon').style.visibility = "hidden";
			}
		},


		/**
		 * @function iconShow
		 * Show the icon for the given node
		 * @param {DOM} node  the html dom node of the element that contains our icon
		 */
		iconShow: function(node) {
			if (node) {
				node.querySelector('.ab-visible-field-icon').style.visibility = "visible";
			}
		},


		/**
		 * @function iconsReset
		 * Reset the icon displays according to the current values in our Object
		 */
		iconsReset: function() {

			var List = $$(ids.list);

			// for each item in the List
			var id = List.getFirstId();
			while(id) {
				var item = List.getItem(id);

				// find it's HTML Node
				var node = List.getItemNode(id);

				if (CurrentObject.workspaceFrozenColumnID == item.columnName) {
					_logic.iconFreezeOn(node);
				} else {
					_logic.iconFreezeOff(node);
				}

				// if this item is not hidden, show it.
				if (CurrentObject.workspaceHiddenFields.indexOf(item.columnName) == -1) {
					_logic.iconShow(node);
				} else {
					// else hide it
					_logic.iconHide(node);
				}

				// next item
				id = List.getNextId(id);
			}

		},


		/**
		 * @function objectLoad
		 * Ready the Popup according to the current object
		 * @param {ABObject} object  the currently selected object.
		 */
		objectLoad: function(object) {
			CurrentObject = object;
		},

		/**
		 * @function onShow
		 * Ready the Popup according to the current object each time it is shown (perhaps a field was created or delted)
		 */
		onShow: function() {
			// refresh list
			var allFields = CurrentObject.fields();
			var listFields = [];
			allFields.forEach((f) => {
				listFields.push({
					id: f.id,
					label: f.label,
					columnName: f.columnName
				})
			})

			$$(ids.list).parse(allFields);
		}

	}



	// Expose any globally accessible Actions:
	var _actions = {


	}



	// return the current instance of this component:
	return {
		ui:_ui,					// {obj} 	the webix ui definition for this component
		init:_init,				// {fn} 	init() to setup this component
		actions:_actions,		// {ob}		hash of fn() to expose so other components can access.


		// interface methods for parent component:
		objectLoad: _logic.objectLoad,


		_logic: _logic			// {obj} 	Unit Testing
	}

})
