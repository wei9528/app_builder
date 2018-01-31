//
// ABViewRuleActionFormRecordRuleUpdate
//
// An action that allows you to update fields on an object. 
//
//
import ABViewRuleAction from "../ABViewRuleAction"


export default class ABViewRuleActionFormRecordRuleUpdate extends ABViewRuleAction {

	/**
	 * @param {object} App 
	 *      The shared App object that is created in OP.Component
	 * @param {string} idBase
	 *      Identifier for this component
	 */
	constructor(App, idBase) {

		super(App, idBase);
		var L = this.Label;


		this.key = 'ABViewRuleActionFormRecordRuleUpdate';
		this.label = L('ab.component.ruleaction.abviewruleActionFormRecordRuleUpdate', '*Update Record');


		this.currentObject = null;  // the object this Action is tied to.


		// Labels for UI components
		// var labels = this.labels = {
		// 	common: App.labels,
		// 	component: {
		// 		// action: L("ab.component.form.action", "*Action"),
		// 		// when: L("ab.component.form.when", "*When"),
		// 		// values: L("ab.component.form.values", "*Values")
		// 	}
		// };

		// // internal list of Webix IDs to reference our UI components.
		// var ids = this.ids = {
		// 	// each instance must be unique
		// 	component: this.unique(idBase + '_component')+'_'+webix.uid(),	
		// 	// rules: this.unique(idBase + '_rules'),

		// 	// action: this.unique(idBase + '_action'),
		// 	// when: this.unique(idBase + '_when'),

		// 	// values: this.unique(idBase + '_values'),
		// 	// set: this.unique(idBase + '_set')

		// };


		// this.ui = {};


		// // for setting up UI
		// this.init = (options) => {
		// 	// register callbacks:
		// 	for (var c in _logic.callbacks) {
		// 		_logic.callbacks[c] = options[c] || _logic.callbacks[c];
		// 	}
		// };

		// // internal business logic 
		// var _logic = this._logic = {

		// 	callbacks: {
		// 		onDelete: function () { console.warn('NO onDelete()!') },
		// 		onSave: function (field) { console.warn('NO onSave()!') },
		// 	},

		// }

	}

////
//// LEFT OFF HERE:
// - explore webix querybuilder data types and how to define a new one
// - Rule.onSelect() needs to update the condition area with the new Conditions.
// - Action needs to return a data section
// - Rule.onSelect() neds to update the data entry section
// - empty conditions start with an "Always" display, and a button to add query
// - displaying the Rule should populate QB with existing data.


	conditionFields() {
		
		var fieldTypes = ['string', 'number', 'date'];

		var currFields = [];

		if (this.currentObject) {
			this.currentObject.fields().forEach((f)=>{

				if (fieldTypes.indexOf(f.key) != -1) {
					currFields.push({
						id: f.id,
						value: f.label,
						type: f.key
					});
				}
			})
		}

		return currFields;

// if (this.currentObject) {
// console.warn(' ... ABView.fields(): ', this.currentObject.fields() );
// }

// return [
//     { id:"fname",   value:"First Name", type:"string" },
//     { id:"lname",   value:"Last Name",  type:"string" },
//     { id:"age",     value:"Age",        type:"number" },
//     { id:"bdate",   value:"Birth Date", type:"date" }
// ];
	}


	// setObject(object) {
	// 	this.currentObject = object;
	// }



}