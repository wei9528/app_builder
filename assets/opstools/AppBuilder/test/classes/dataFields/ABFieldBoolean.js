import AB from "../../../components/ab";
import ABFieldBoolean from "../../../classes/dataFields/ABFieldBoolean";

describe("ABFieldBoolean unit tests", () => {
   function L(key, altText) {
      return AD.lang.label.getLabel(key) || altText;
   }

   var sandbox;

   var ab;
   var mockApp;
   var mockObject;

   var target;
   var targetComponent;

   var webixCom;

   var columnName = "TEST_BOOLEAN_COLUMN";

   before(() => {
      ab = new AB();

      mockApp = ab._app;
      mockObject = {};

      target = new ABFieldBoolean(
         {
            columnName: columnName,
            settings: {}
         },
         mockObject
      );

      targetComponent = ABFieldBoolean.propertiesComponent(mockApp);

      // render edit component
      targetComponent.ui.container = "ab_test_div";
      webixCom = new webix.ui(targetComponent.ui);
   });

   beforeEach(() => {
      sandbox = sinon.sandbox.create();
   });

   afterEach(() => {
      sandbox.restore();
   });

   after(() => {
      if (webixCom && webixCom.destructor) webixCom.destructor();
   });

   /* Boolean field test cases */
   describe("Boolean field test cases", () => {
      it("should exist boolean field", () => {
         assert.isDefined(target);
      });

      it("should have valid default value", () => {
         let defaultValues = ABFieldBoolean.defaults();

         let menuName = L("ab.dataField.boolean.menuName", "*Checkbox");
         let description = L(
            "ab.dataField.boolean.description",
            "*A single checkbox that can be checked or unchecked."
         );

         assert.equal("boolean", defaultValues.key);
         assert.equal("check-square-o", defaultValues.icon);
         assert.equal(menuName, defaultValues.menuName);
         assert.equal(description, defaultValues.description);
         assert.isTrue(defaultValues.supportRequire);
      });

      it(".columnHeader: should return valid column config", () => {
         var columnConfig = target.columnHeader();

         assert.equal(
            "template",
            columnConfig.editor,
            'should be "template" editor'
         );
         assert.isFunction(columnConfig.template);
         assert.equal("center", columnConfig.css);
         assert.isUndefined(
            columnConfig.sort,
            "should not define sort in webix datatable"
         );
      });

      it(".columnHeader: template() should return value of field when display in grouping feature", () => {
         var columnConfig = target.columnHeader();

         let row = {
            $group: true
         };
         row[columnName] = "SHOULD RETURN THIS VALUE";

         let result = columnConfig.template(row);

         assert.equal(row[columnName], result);
      });

      it(".columnHeader: template() should return editable checkbox", () => {
         let isEditable = true;
         var columnConfig = target.columnHeader({
            editable: isEditable
         });

         let row = {},
            common = {
               checkbox: function() {
                  return "EDITABLE CHECKBOX";
               }
            },
            value = {},
            config = {};

         let result = columnConfig.template(row, common, value, config);

         assert.equal(
            `<div class="ab-boolean-display">${common.checkbox()}</div>`,
            result
         );
      });

      it(".columnHeader: template() should return read-only uncheck checkbox when value is false", () => {
         let isEditable = false;
         var columnConfig = target.columnHeader({
            editable: isEditable
         });

         let value = false;

         let row = {},
            common = {},
            config = {};

         let result = columnConfig.template(row, common, value, config);

         assert.equal("<div class='webix_icon fa fa-square-o'></div>", result);
      });

      it(".columnHeader: template() should return read-only checked checkbox when value is true", () => {
         let isEditable = false;
         var columnConfig = target.columnHeader({
            editable: isEditable
         });

         let value = true;

         let row = {},
            common = {},
            config = {};

         let result = columnConfig.template(row, common, value, config);

         assert.equal(
            "<div class='webix_icon fa fa-check-square-o'></div>",
            result
         );
      });

      it(".defaultValue: should set 1", () => {
         var rowData = {};

         // set default to true
         target.settings.default = 1;

         target.defaultValue(rowData);

         assert.isDefined(rowData[columnName]);
         assert.isTrue(rowData[columnName] == 1);
      });

      it(".defaultValue: should set 0", () => {
         var rowData = {};

         // set default to true
         target.settings.default = 0;

         target.defaultValue(rowData);

         assert.isDefined(rowData[columnName]);
         assert.isTrue(rowData[columnName] == 0);
      });

      it(".formComponent: should return form component { common, newInstance }", () => {
         assert.isDefined(target.formComponent);
         assert.isFunction(target.formComponent);

         let result = target.formComponent();

         // common property
         assert.isDefined(result.common);
         assert.isFunction(result.common);
         assert.equal("checkbox", result.common().key);

         // newInstance property
         assert.isDefined(result.newInstance);
         assert.isFunction(result.newInstance);
      });

      it(".detailComponent: should return detail component { common, newInstance }", () => {
         assert.isDefined(target.detailComponent);
         assert.isFunction(target.detailComponent);

         let result = target.detailComponent();

         // common property
         assert.isDefined(result.common);
         assert.isFunction(result.common);
         assert.equal("detailcheckbox", result.common().key);

         // newInstance property
         assert.isDefined(result.newInstance);
         assert.isFunction(result.newInstance);
      });
   });

   /* Boolean field component test cases */
   describe("Boolean field component test cases", () => {
      it("should exist boolean component", () => {
         assert.isDefined(targetComponent);
      });

      it("should return valid key", () => {
         let result = targetComponent.values();

         assert.equal("boolean", result.key);
         assert.equal(0, result.settings.default);
         assert.equal(1, result.settings.showIcon);
         assert.equal(0, result.settings.required);
      });
   });
});
