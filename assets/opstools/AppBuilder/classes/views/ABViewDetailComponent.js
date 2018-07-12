/*
 * ABViewDetailComponent
 *
 * An ABViewDetailComponent defines a UI component that is intended to be part of
 * a detail.   These components are tied to an Object's data field.
 *
 */

import ABViewWidget from "./ABViewWidget"

function L(key, altText) {
	return AD.lang.label.getLabel(key) || altText;
}

export default class ABViewDetailComponent extends ABViewWidget {

	static propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults) {

		var commonUI = super.propertyEditorDefaultElements(App, ids, _logic, ObjectDefaults);

		return commonUI.concat([
			{
				name: 'fieldLabel',
				view: "text",
				disabled: true,
				label: L('ab.component.detail.field.label', '*Field')
			}
		]);

	}

	static propertyEditorPopulate(App, ids, view) {

		super.propertyEditorPopulate(App, ids, view);

		var field = view.field();

		if (field) {
			$$(ids.fieldLabel).setValue(field.label);
		}
	}

	/*
	 * @component()
	 * return a UI component based upon this view.
	 * @param {obj} App 
	 * @return {obj} UI component
	 */
	component(App) {

		// setup 'label' of the element
		var detailView = this.detailComponent(),
			field = this.field() || {},
			label = '';

		var settings = {};
		if (detailView)
			settings = detailView.settings;

		var isUsers = false;
		if (field.key == "user")
			isUsers = true;

		var templateLabel = '';
		if (settings.showLabel == true) {
			if (settings.labelPosition == 'top')
				templateLabel = "<label style='display:block; text-align: left;' class='webix_inp_top_label'>#label#</label>#display#";
			else
				templateLabel = "<label style='width: #width#px; display: inline-block; float: left; line-height: 32px;'>#label#</label><div class='ab-detail-component-holder' style='margin-left: #width#px;'>#display#</div>";
		}

		var template = (templateLabel)
			.replace(/#width#/g, settings.labelWidth)
			.replace(/#label#/g, field.label);
			
		var height = 38;
		if (settings.labelPosition == 'top')
			height = height * 2;

		if (field.settings && typeof field.settings.useHeight != "undefined" && field.settings.useHeight == 1) {
			height = parseInt(field.settings.imageHeight) || height;
		}

		var _ui = {
			view: "template",
			borderless: true,
			height: height,
			isUsers: isUsers,
			template: template,
			data: { display: '' } // show empty data in template
		};

		// make sure each of our child views get .init() called
		var _init = (options) => {
		}

		var _logic = {

			setValue: (componentId, val) => {

				if ($$(componentId))
					$$(componentId).setValues({ display: val });

			}

		}

		return {
			ui: _ui,
			init: _init,
			logic: _logic
		}

	}

	detailComponent() {
		var detailView = null;

		var curr = this;
		while (!curr.isRoot() && 
				curr.parent && 
				curr.key != 'detail' && 
				curr.key != 'dataview') {

			curr = curr.parent;
		}

		if (curr.key == 'detail' || curr.key == 'dataview') {
			detailView = curr;
		}

		return detailView;
	}

	field() {
		var object = this.application.objects((obj) => obj.id == this.settings.objectId)[0];
		if (object == null) return null;

		var field = object.fields((v) => v.id == this.settings.fieldId)[0];
		return field;
	}


	getCurrentData() {

		var detailCom = this.detailComponent();
		if (!detailCom) return null;

		var dc = detailCom.dataCollection();
		if (!dc) return null;

		var field = this.field();
		if (!field) return null;

		var currData = dc.getCursor();
		if (currData)
			return currData[field.columnName];
		else
			return null;

	}


	//// Report ////

	/**
	 * @method print
	 * 
	 * 
	 * @return {Object} - PDF object definition
	 */
	print(rowData) {

		var reportDef = {};

		var detailCom = this.detailComponent();
		if (!detailCom) return reportDef;

		var dc = detailCom.dataCollection();
		if (!dc) return reportDef;

		var field = this.field();
		if (!field) return reportDef;

		rowData = rowData || dc.getCursor() || {};

		var text = (field.format(rowData) || "");

		reportDef = {
			columns: [
				{
					bold: true,
					text: field.label,
					width: detailCom.settings.labelWidth
				},
				{
					text: text
				}
			]
		};

		return reportDef;

	}


}