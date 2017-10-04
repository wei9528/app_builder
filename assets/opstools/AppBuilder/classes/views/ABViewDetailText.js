/*
 * ABViewDetailText
 *
 * An ABViewDetailText defines a UI string component in the detail component.
 *
 */

import ABViewDetailComponent from "./ABViewDetailComponent"
import ABPropertyComponent from "../ABPropertyComponent"

function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}


var ABViewDetailTextPropertyComponentDefaults = {
}


var ABViewDetailTextDefaults = {
	key: 'detailtext',		// {string} unique key for this view
	icon: 'etsy',			// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.detail.text' // {string} the multilingual label key for the class label
}


export default class ABViewDetailText extends ABViewDetailComponent {

	/**
	 * @param {obj} values  key=>value hash of ABView values
	 * @param {ABApplication} application the application object this view is under
	 * @param {ABView} parent the ABView this view is a child of. (can be null)
	 */
	constructor(values, application, parent) {

		super(values, application, parent, ABViewDetailTextDefaults);

		// OP.Multilingual.translate(this, this, ['text']);

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
		return ABViewDetailTextDefaults;
	}

	///
	/// Instance Methods
	///

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

		var idBase = 'ABViewDetailTextEditorComponent';
		var ids = {
			component: App.unique(idBase + '_component')
		}


		var textElem = this.component(App).ui;
		textElem.id = ids.component;

		var _ui = {
			rows: [
				textElem,
				{}
			]
		};

		var _init = (options) => {
		}

		var _logic = {
		}


		return {
			ui: _ui,
			init: _init,
			logic: _logic
		}
	}



	//
	// Property Editor
	// 

	static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {

		var commonUI = super.propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults);


		// in addition to the common .label  values, we 
		// ask for:
		return commonUI.concat([
		]);

	}

	static propertyEditorPopulate(ids, view) {

		super.propertyEditorPopulate(ids, view);

	}

	static propertyEditorValues(ids, view) {

		super.propertyEditorValues(ids, view);

	}



	/*
	 * @component()
	 * return a UI component based upon this view.
	 * @param {obj} App 
	 * @return {obj} UI component
	 */
	component(App) {

		var component = super.component(App);
		var field = this.field();
		var detailView = this.detailComponent();

		var idBase = 'ABViewDetailText_' + this.id;
		var ids = {
			component: App.unique(idBase + '_component'),
		}

		var templateLabel = '';
		if (detailView.settings.showLabel == true) {
			if (detailView.settings.labelPosition == 'top')
				templateLabel = "<label style='display:block; text-align: left;' class='webix_inp_top_label'>#label#</label>#text#";
			else
				templateLabel = "<label style='width: #width#px; display: inline-block; float: left; line-height: 32px;'>#label#</label>#text#";
		}

		// var template = (templateLabel + "#result#")
		var template = (templateLabel)
			.replace(/#width#/g, detailView.settings.labelWidth)
			.replace(/#label#/g, field.label);
		// .replace(/#result#/g, field.columnHeader().template);

		component.ui.id = ids.component;
		component.ui.view = "template";
		component.ui.minHeight = 45;
		component.ui.height = 60;
		component.ui.borderless = true;
		component.ui.template = template;

		// make sure each of our child views get .init() called
		component.init = (options) => {
			component.logic.setValue('');
		}

		component.logic = {

			setValue: (val) => {
				$$(ids.component).setValues({ text: val });
			}

		}

		return component;
	}


	/*
	 * @method componentList
	 * return the list of components available on this view to display in the editor.
	 */
	componentList() {
		return [];
	}


}