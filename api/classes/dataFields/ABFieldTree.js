/*
 * ABFieldTree
 *
 * An ABFieldTree defines a List field type.
 *
 */
var path = require('path');
var ABField = require(path.join(__dirname, "ABField.js"));

function L(key, altText) {
	return altText;  // AD.lang.label.getLabel(key) || altText;
}


var ABFieldTreeDefaults = {
	key: 'tree', // unique key to reference this specific DataField
	icon: 'sitemap',   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'		

	// menuName: what gets displayed in the Editor drop list
	menuName: L('ab.dataField.tree.menuName', '*Data Tree'),

	// description: what gets displayed in the Editor description.
	description: L('ab.dataField.tree.description', '*Data tree allows you to build a hierarchical set of selectable data. (ex: Categories and sub-categories)'),
	
	// what types of Sails ORM attributes can be imported into this data type?
	// http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
	compatibleOrmTypes: [],
}

var defaultValues = {
	options: []
}


class ABFieldTree extends ABField {

    constructor(values, object) {
		super(values, object, ABFieldTreeDefaults);


    	/*
    	{
			settings: {
				textDefault: 'string',
				supportMultilingual: true/false
			}
    	}
    	*/

		// we're responsible for setting up our specific settings:
		for (var dv in defaultValues) {
			this.settings[dv] = values.settings[dv] || defaultValues[dv];
		}

	}


	// return the default values for this DataField
	static defaults() {
		return ABFieldTreeDefaults;
	}



	/*
	 * @function propertiesComponent
	 *
	 * return a UI Component that contains the property definitions for this Field.
	 *
	 * @param {App} App the UI App instance passed around the Components.
	 * @return {Component}
	 */
	// static propertiesComponent(App) {
	// 	return ABFieldTreeComponent.component(App);
	// }



	///
	/// Instance Methods
	///


	isValid() {

		var errors = super.isValid();

		// errors = OP.Form.validationError({
		// 	name:'columnName',
		// 	message:L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name),
		// }, errors);

		return errors;
	}


	/**
	 * @method toObj()
	 *
	 * properly compile the current state of this ABApplication instance
	 * into the values needed for saving to the DB.
	 *
	 * Most of the instance data is stored in .json field, so be sure to
	 * update that from all the current values of our child fields.
	 *
	 * @return {json}
	 */
	// toObj () {

	// 	var obj = super.toObj();

	// 	// obj.settings = this.settings;  // <--  super.toObj()

	// 	return obj;
	// }




	///
	/// DB Migrations
	///


	/**
	 * @function migrateCreate
	 * perform the necessary sql actions to ADD this column to the DB table.
	 * @param {knex} knex the Knex connection.
	 */
	migrateCreate(knex) {
		return new Promise(
			(resolve, reject) => {

				var tableName = this.object.dbTableName();

				// if this column doesn't already exist (you never know)
				knex.schema.hasColumn(tableName, this.columnName)
					.then((exists) => {

						return knex.schema.table(tableName, (t) => {

							var currCol;
							currCol = t.json(this.columnName).nullable();

							// TODO: Set default to multiple select
							// MySQL - BLOB and TEXT columns cannot have DEFAULT values.
							// Error Code: 1101. BLOB, TEXT, GEOMETRY or JSON column 'Type' can't have a default value

							// if (this.settings.multipleDefault && this.settings.multipleDefault.length > 0) {
							// 	currCol.defaultTo(JSON.stringify(this.settings.multipleDefault));
							// }

							// create one if it doesn't exist:
							if (exists) {
								currCol.alter();
							}

						})
							.then(() => { resolve(); })
							.catch(reject);
					});

			}
		);
	}


	/**
	 * @function migrateDrop
	 * perform the necessary sql actions to drop this column from the DB table.
	 * @param {knex} knex the Knex connection.
	 */
	// NOTE: ABField.migrateDrop() is pretty good for most cases.
	// migrateDrop (knex) {
	// 	return new Promise(
	// 		(resolve, reject) => {
	// 			// do your special drop operations here.
	// 		}
	// 	)
	// }



	///
	/// DB Model Services
	///

	/**
	 * @method jsonSchemaProperties
	 * register your current field's properties here:
	 */
	jsonSchemaProperties(obj) {
		// take a look here:  http://json-schema.org/example1.html

		// if our field is not already defined:
		if (!obj[this.columnName]) {

			// store JSON blob value
			obj[this.columnName] = {
				"anyOf": [
					{ "type": "array" },
					{ "type": "null" },
					{
						// allow empty string because it could not put empty array in REST api
						"type": "string",
						"maxLength": 0
					}
				]
			};

		}

	}



	/**
	 * @method requestParam
	 * return the entry in the given input that relates to this field.
	 * @param {obj} allParameters  a key=>value hash of the inputs to parse.
	 * @return {obj} or undefined
	 */
	requestParam(allParameters) {
		var myParameter;

		myParameter = super.requestParam(allParameters);

		// '' (empty string) to null
		if (myParameter &&
			myParameter[this.columnName] != undefined && 
			myParameter[this.columnName] == '') {
			myParameter[this.columnName] = null;
		}

		return myParameter;
	}


	/**
	 * @method isValidParams
	 * Parse through the given parameters and return an error if this field's
	 * data seems invalid.
	 * @param {obj} allParameters  a key=>value hash of the inputs to parse.
	 * @return {array} 
	 */
	isValidData(allParameters) {
		var errors = [];

		return errors;
	}

}



module.exports = ABFieldTree;