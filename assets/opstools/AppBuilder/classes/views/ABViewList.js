/*
 * ABViewList
 *
 * An ABViewList defines a UI label display component.
 *
 */

import ABViewWidget from "./ABViewWidget"
import ABPropertyComponent from "../ABPropertyComponent"

function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}


var ABViewLabelPropertyComponentDefaults = {
}


var ABViewDefaults = {
	key: 'list',		// {string} unique key for this view
	icon: 'list-ul',		// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.list' // {string} the multilingual label key for the class label
}



export default class ABViewLabel extends ABViewWidget {

	/**
 * @param {obj} values  key=>value hash of ABView values
 * @param {ABApplication} application the application object this view is under
 * @param {ABViewWidget} parent the ABViewWidget this view is a child of. (can be null)
 */
	constructor(values, application, parent) {

		super(values, application, parent, ABViewDefaults);

		// 	{
		// 		id:'uuid',					// uuid value for this obj
		// 		key:'viewKey',				// unique key for this View Type
		// 		icon:'font',				// fa-[icon] reference for an icon for this View Type
		// 		label:'',					// pulled from translation

		//		settings: {					// unique settings for the type of field
		//			format: x				// the display style of the text
		//		},

		// 		views:[],					// the child views contained by this view.

		//		translations:[]				// text: the actual text being displayed by this label.

		// 	}

	}


	static common() {
		return ABViewDefaults;
	}



	//
	//	Editor Related
	//


	/** 
	 * @method editorComponent
	 * return the Editor for this UI component.
	 * the editor should display either a "block" view or "preview" of 
	 * the current layout of the view.
	 * @param {string} mode what mode are we in ['block', 'preview']
	 * @return {Component} 
	 */
	editorComponent(App, mode) {

		var idBase = 'ABViewListEditorComponent';

		var ListViewComponent = this.component(App, idBase);

		return ListViewComponent;
	}


	//
	// Property Editor
	// 

	static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {

		var commonUI = super.propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults);

		// _logic functions

		_logic.selectSource = (dcId, oldDcId) => {

			var currView = _logic.currentEditObject();

			// Update field options in property
			this.propertyUpdateFieldOptions(ids, currView, dcId);

		};

		return commonUI.concat([
			{
				name: 'datacollection',
				view: 'richselect',
				label: L('ab.components.list.dataSource', "*Data Source"),
				labelWidth: App.config.labelWidthLarge,
				on: {
					onChange: _logic.selectSource
				}
			},
			{
				name: 'field',
				view: 'richselect',
				label: L('ab.components.list.field', "*Field"),
				labelWidth: App.config.labelWidthLarge
			}
		]);

	}


	/**
	 * @method propertyUpdateFieldOptions
	 * Populate fields of object to select list in property
	 * 
	 * @param {Object} ids 
	 * @param {ABViewForm} view - the current component
	 * @param {string} dcId - id of ABViewDataCollection
	 */
	static propertyUpdateFieldOptions(ids, view, dcId) {

		var datacollection = view.pageRoot().dataCollections(dc => dc.id == dcId)[0];
		var object = datacollection ? datacollection.datasource : null;

		// Pull field list
		var fieldOptions = [];
		if (object != null) {

			fieldOptions = object.fields().map(f => {

				return {
					id: f.id,
					value: f.label
				};

			});
		}

		$$(ids.field).define("options", fieldOptions);
		$$(ids.field).refresh();

	}

	static propertyEditorPopulate(App, ids, view) {

		super.propertyEditorPopulate(App, ids, view);

		var dataCollectionId = (view.settings.datacollection ? view.settings.datacollection : null);
		var SourceSelector = $$(ids.datacollection);

		// Pull data collections to options
		var dcOptions = view.pageRoot().dataCollections(dc => dc.sourceType == "object").map((dc) => {

			return {
				id: dc.id,
				value: dc.label
			};
		});

		dcOptions.unshift({
			id: null,
			value: '[Select]'
		});
		SourceSelector.define('options', dcOptions);
		SourceSelector.define('value', dataCollectionId);
		SourceSelector.refresh();

		this.propertyUpdateFieldOptions(ids, view, dataCollectionId);

		$$(ids.field).setValue(view.settings.field);

	}


	static propertyEditorValues(ids, view) {

		super.propertyEditorValues(ids, view);

		view.settings.datacollection = $$(ids.datacollection).getValue();
		view.settings.field = $$(ids.field).getValue();

	}


	/*
	 * @component()
	 * return a UI component based upon this view.
	 * @param {obj} App 
	 * @return {obj} UI component
	 */
	component(App) {

		var idBase = 'ABViewListEditorComponent';
		var ids = {
			component: App.unique(idBase + '_component')
		};


		var _ui = {
			id: ids.component,
			view: "dataview",
			type: {
				width: 1000,
				height: 30
			}
		}


		var field = this.field();
		if (field)
			_ui.template = (item) => {

				var field = this.field();
				if (!field)
					return "";

				return field.format(item);
			};


		var _init = (options) => {

			var dc = this.dataCollection();
			if (!dc) return;

			// bind dc to component
			dc.bind($$(ids.component));

		}

		// var _logic = {
		// } 

		return {
			ui: _ui,
			init: _init
		}
	}


	/**
	 * @method dataCollection
	 * return ABViewDataCollection of this form
	 * 
	 * @return {ABViewDataCollection}
	 */
	dataCollection() {
		return this.pageRoot().dataCollections((dc) => dc.id == this.settings.datacollection)[0];
	}



	field() {

		var dc = this.dataCollection();
		if (!dc) return null;

		var object = dc.datasource;
		if (!object) return null;

		return object.fields(f => f.id == this.settings.field)[0];
	}


	//// Report ////

	/**
	 * @method print
	 * 
	 * 
	 * @return {Object} - PDF object definition
	 */
	print() {

		var reportDef = {
			ul: []
		};

		var dc = this.dataCollection();
		if (!dc) return reportDef;

		var field = this.field();
		if (!field) return reportDef;

		dc.getData().forEach(item => {

			var display = field.format(item);

			reportDef.ul.push(display);

		});

		return reportDef;

	}


}