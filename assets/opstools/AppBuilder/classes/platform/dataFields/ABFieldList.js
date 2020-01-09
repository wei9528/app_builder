var ABFieldListCore = require("../../core/dataFields/ABFieldListCore");
var ABFieldComponent = require("./ABFieldComponent");

function L(key, altText) {
    return AD.lang.label.getLabel(key) || altText;
}

// store the original options (look at logic.populate)
var originalOptions = [];

// store the current field being edited/created
var currentField;

var ids = {
    isMultiple: "ab-list-multiple-option",
    hasColors: "ab-list-colors-option",
    default: "ab-list-single-default",
    multipleDefault: "ab-list-multiple-default",
    options: "ab-list-option",
    colorboard: "ab-colorboard"
};

var colors = [
    ["#F44336", "#E91E63", "#9C27B0", "#673AB7"],
    ["#3F51B5", "#2196F3", "#03A9F4", "#00BCD4"],
    ["#009688", "#4CAF50", "#8BC34A", "#CDDC39"],
    ["#FFEB3B", "#FFC107", "#FF9800", "#FF5722"],
    ["#795548", "#9E9E9E", "#607D8B", "#000000"]
];

function getNextHex() {
    var options = $$(ids.options);
    var usedColors = [];
    options.data.each(function(item) {
        usedColors.push(item.hex);
    });
    var allColors = [];
    colors.forEach(function(c) {
        if (typeof c == "object") {
            c.forEach(function(j) {
                allColors.push(j);
            });
        }
    });
    var newHex = "#3498db";
    for (var i = 0; i < allColors.length; i++) {
        if (usedColors.indexOf(allColors[i]) == -1) {
            newHex = allColors[i];
            break;
        }
    }
    return newHex;
}

function toggleColorControl(value) {
    var colorPickers = $$(ids.options).$view.querySelectorAll(
        ".ab-color-picker"
    );
    colorPickers.forEach(function(itm) {
        if (value == 1) itm.classList.remove("hide");
        else itm.classList.add("hide");
    });
}

function updateDefaultList(ids, settings = {}) {
    var optList = $$(ids.options)
        .find({})
        .map(function(opt) {
            return {
                id: opt.id,
                value: opt.value,
                hex: opt.hex
            };
        });

    if ($$(ids.isMultiple).getValue()) {
        // Multiple default selector
        $$(ids.multipleDefault).define("options", optList);
        if (settings.multipleDefault) {
            var vals = [];
            settings.multipleDefault.forEach(function(d) {
                vals.push(d.id);
            });
            $$(ids.multipleDefault).setValue(vals.join());
        }

        $$(ids.multipleDefault).refresh();
    } else {
        // Single default selector
        $$(ids.default).define("options", optList);
        if (settings.default) $$(ids.default).setValue(settings.default);

        $$(ids.default).refresh();
    }
}

/**
 * ABFieldListComponent
 *
 * Defines the UI Component for this Data Field.  The ui component is responsible
 * for displaying the properties editor, populating existing data, retrieving
 * property values, etc.
 */
var ABFieldListComponent = new ABFieldComponent({
    fieldDefaults: ABFieldListCore.defaults(),

    elements: (App, field) => {
        ids = field.idsUnique(ids, App);

        return [
            {
                view: "checkbox",
                name: "isMultiple",
                disallowEdit: true,
                id: ids.isMultiple,
                labelRight: L("ab.dataField.list.isMultiple", "*Multiselect"),
                labelWidth: 0,
                value: false,
                on: {
                    onChange: (newV, oldV) => {
                        if (newV == true) {
                            $$(ids.default).hide();
                            $$(ids.multipleDefault).show();
                        } else {
                            $$(ids.default).show();
                            $$(ids.multipleDefault).hide();
                        }

                        updateDefaultList(ids, field.settings);
                    }
                }
            },
            {
                view: "checkbox",
                name: "hasColors",
                id: ids.hasColors,
                labelRight: L(
                    "ab.dataField.list.hasColors",
                    "*Customize Colors"
                ),
                labelWidth: 0,
                value: false,
                on: {
                    onChange: (newV, oldV) => {
                        if (newV == oldV) return false;

                        toggleColorControl(newV);
                    }
                }
            },
            {
                view: "label",
                label: `<b>${L("ab.dataField.list.options", "*Options")}</b>`
            },
            {
                id: ids.options,
                name: "options",
                css: "padList",
                view: App.custom.editlist.view,
                template:
                    "<div style='position: relative;'><i class='ab-color-picker fa fa-lg fa-chevron-circle-down' style='color:#hex#'></i> #value#<i class='ab-new-field-remove fa fa-remove' style='position: absolute; top: 7px; right: 7px;'></i></div>",
                autoheight: true,
                drag: true,
                editable: true,
                hex: "",
                editor: "text",
                editValue: "value",
                onClick: {
                    "ab-new-field-remove": (e, itemId, trg) => {
                        // Remove option item
                        // check that item is in saved data already
                        var matches = originalOptions.filter(function(x) {
                            return x.id == itemId;
                        })[0];
                        if (matches) {
                            // Ask the user if they want to remove option
                            OP.Dialog.Confirm({
                                title: L(
                                    "ab.dataField.list.optionDeleteTitle",
                                    "*Delete Option"
                                ),
                                text: L(
                                    "ab.dataField.list.optionDeleteText",
                                    "*All exisiting entries with this value will be cleared. Are you sure you want to delete this option?"
                                ),
                                fnYes: function() {
                                    // store the item that will be deleted for the save action
                                    currentField.pendingDeletions =
                                        currentField.pendingDeletions || [];
                                    currentField.pendingDeletions.push(itemId);
                                    $$(ids.options).remove(itemId);
                                }
                            });
                        }
                    },
                    "ab-color-picker": function(e, itemId, trg) {
                        // alert("open color picker");
                        var item = itemId;
                        webix
                            .ui({
                                id: ids.colorboard,
                                view: "popup",
                                body: {
                                    view: "colorboard",
                                    id: "color",
                                    width: 125,
                                    height: 150,
                                    palette: colors,
                                    left: 125,
                                    top: 150,
                                    on: {
                                        onSelect: (hex) => {
                                            var vals = $$(ids.options).getItem(
                                                item
                                            );
                                            vals.hex = hex;
                                            $$(ids.options).updateItem(
                                                item,
                                                vals
                                            );
                                            $$(ids.colorboard).hide();
                                        }
                                    }
                                }
                            })
                            .show(trg, { x: -7 });
                        return false;
                    }
                },
                on: {
                    onAfterAdd: () => {
                        updateDefaultList(ids, field.settings);
                    },
                    onAfterEditStop: () => {
                        updateDefaultList(ids, field.settings);
                    },
                    onAfterDelete: () => {
                        updateDefaultList(ids, field.settings);
                    },
                    onAfterRender: () => {
                        toggleColorControl($$(ids.hasColors).getValue());
                    }
                }
            },
            {
                view: "button",
                value: L("ab.dataField.list.addNewOption", "*Add new option"),
                click: function() {
                    var itemId = webix.uid();
                    var nextHex = getNextHex();
                    $$(ids.options).add(
                        { id: itemId, value: "", hex: nextHex },
                        $$(ids.options).count()
                    );
                    $$(ids.options).edit(itemId);
                }
            },
            {
                id: ids.default,
                placeholder: L(
                    "ab.dataField.list.selectDefault",
                    "*Select Default"
                ),
                name: "default",
                view: "richselect",
                label: L("ab.common.default", "*Default")
            },
            {
                id: ids.multipleDefault,
                placeholder: L(
                    "ab.dataField.list.selectDefault",
                    "*Select Default"
                ),
                css: "hideWebixMulticomboTag",
                tagMode: false,
                tagTemplate: function(values) {
                    var items = "";
                    values.forEach((val) => {
                        var item = $$(this.id)
                            .getList()
                            .getItem(val);
                        items +=
                            '<li class="webix_multicombo_value" style="line-height:24px; color: white; background: ' +
                            item.hex +
                            ';" optvalue="' +
                            item.id +
                            '"><span>' +
                            item.value +
                            '</span><span class="webix_multicombo_delete" role="button" aria-label="Remove item">x</span></li>';
                    });
                    return items;
                },
                options: [],
                name: "multipleDefault",
                view: "multicombo",
                label: L("ab.common.default", "*Default")
            }
        ];
    },

    // defaultValues: the keys must match a .name of your elements to set it's default value.
    defaultValues: ABFieldListCore.defaultValues(),

    // rules: basic form validation rules for webix form entry.
    // the keys must match a .name of your .elements for it to apply
    rules: {},

    // include additional behavior on default component operations here:
    // The base routines will be processed first, then these.  Any results
    // from the base routine, will be passed on to these:
    logic: {
        // isValid: function (ids, isValid) {

        // }

        clear: (ids) => {
            $$(ids.isMultiple).setValue(0);
            $$(ids.hasColors).setValue(0);
            $$(ids.options).clearAll();

            $$(ids.default).define("options", []);
            $$(ids.default).setValue(ABFieldListCore.defaultValues().default);

            $$(ids.multipleDefault).define("options", []);
            $$(ids.multipleDefault).setValue(
                ABFieldListCore.defaultValues().multipleDefault
            );
        },

        populate: (ids, field) => {
            // store the options that currently exisit to compare later for deletes
            originalOptions = field.settings.options;
            // we need to access the fields -> object -> model to run updates on save (may be refactored later)
            currentField = field;
            // empty this out so we don't try to delete already deleted options (or delete options that we canceled before running)
            currentField.pendingDeletions = [];
            // set options to webix list
            var opts = field.settings.options.map(function(opt) {
                return {
                    id: opt.id,
                    value: opt.text,
                    hex: opt.hex,
                    translations: opt.translations
                };
            });
            $$(ids.options).parse(opts);
            $$(ids.options).refresh();

            // update single/multiple default selector
            setTimeout(() => {
                updateDefaultList(ids, field.settings);
            }, 10);
        },

        /*
         * @function requiredOnChange
         *
         * The ABField.definitionEditor implements a default operation
         * to look for a default field and set it to a required field
         * if the field is set to required
         *
         * if you want to override that functionality, implement this fn()
         *
         * @param {string} newVal	The new value of label
         * @param {string} oldVal	The previous value
         */
        // requiredOnChange: (newVal, oldVal, ids) => {

        // 	// when require number, then default value needs to be reqired
        // 	$$(ids.default).define("required", newVal);
        // 	$$(ids.default).refresh();

        // 	if ($$(ids.multipleDefault).$view.querySelector(".webix_inp_label")) {
        // 		if (newVal) {
        // 			$$(ids.multipleDefault).define("required", true);
        // 			$$(ids.multipleDefault).$view.querySelector(".webix_inp_label").classList.add("webix_required");
        // 		} else {
        // 			$$(ids.multipleDefault).define("required", false);
        // 			$$(ids.multipleDefault).$view.querySelector(".webix_inp_label").classList.remove("webix_required");
        // 		}
        // 	}

        // },

        values: (ids, values) => {
            // Get options list from UI, then set them to settings
            values.settings.options = [];
            $$(ids.options).data.each((opt) => {
                values.settings.options.push({
                    id: opt.id,
                    text: opt.value,
                    hex: opt.hex,
                    translations: opt.translations
                });
            });

            // Un-translate options list
            values.settings.options.forEach(function(opt) {
                OP.Multilingual.unTranslate(opt, opt, ["text"]);
            });

            // Set multiple default value
            values.settings.multipleDefault = [];
            $$(ids.multipleDefault)
                .getValue()
                .split(",")
                .forEach((v) => {
                    values.settings.multipleDefault.push(
                        values.settings.options.filter(function(b) {
                            return b.id == v;
                        })[0]
                    );
                });

            return values;
        }
    }
});

module.exports = class ABFieldList extends ABFieldListCore {
    constructor(values, object) {
        super(values, object);
    }

    /*
     * @function propertiesComponent
     *
     * return a UI Component that contains the property definitions for this Field.
     *
     * @param {App} App the UI App instance passed around the Components.
     * @param {stirng} idBase
     * @return {Component}
     */
    static propertiesComponent(App, idBase) {
        return ABFieldListComponent.component(App, idBase);
    }

    ///
    /// Instance Methods
    ///

    save() {
        return super.save().then(() => {
            // Now we want to clear out any entries that had values == to item removed from our list:
            if (this.pendingDeletions.length) {
                var model = this.object.model();

                if (this.settings.isMultiple == true) {
                    // find all the entries that have one of the deleted values:
                    // use Promise to prevent issues with data being loaded before it is deleted on client side
                    return new Promise((resolve, reject) => {
                        var numDone = 0;
                        var numToDo = 0;

                        model
                            .findAll()
                            .then((list) => {
                                list = list.data || list;

                                // for each list item
                                list.forEach((item) => {
                                    if (Array.isArray(item[this.columnName])) {
                                        // get fields not in pendingDeletions
                                        var remainingFields = item[
                                            this.columnName
                                        ].filter((i) => {
                                            return (
                                                this.pendingDeletions.indexOf(
                                                    i.id
                                                ) == -1
                                            );
                                        });

                                        if (
                                            remainingFields.length !=
                                            item[this.columnName].length
                                        ) {
                                            numToDo++;

                                            // update value to new field list
                                            if (remainingFields.length == 0) {
                                                remainingFields = "";
                                            }
                                            var value = {};
                                            value[
                                                this.columnName
                                            ] = remainingFields;
                                            model
                                                .update(item.id, value)
                                                .then(() => {
                                                    // if ($$(node) && $$(node).updateItem)
                                                    // 	$$(node).updateItem(value.id, value);
                                                    numDone++;
                                                    if (numDone >= numToDo) {
                                                        resolve();
                                                    }
                                                });
                                        }
                                    }
                                });
                                if (numToDo == 0) {
                                    resolve();
                                }
                            })
                            .catch(reject);
                    });
                } else {
                    // find all the entries that have one of the deleted values:
                    var where = {};
                    where[this.columnName] = this.pendingDeletions;
                    return new Promise((resolve, reject) => {
                        var numDone = 0;

                        model
                            .findAll(where)
                            .then((list) => {
                                // make sure we just work with the { data:[] } that was returned
                                list = list.data || list;

                                // for each one, set the value to ''
                                // NOTE: jQuery ajax routines filter out null values, so we can't
                                // set them to null. :(
                                // var numDone = 0;
                                var value = {};
                                value[this.columnName] = "";

                                list.forEach((item) => {
                                    model.update(item.id, value).then(() => {
                                        numDone++;
                                        if (numDone >= list.length) {
                                            resolve();
                                        }
                                    });
                                });
                                if (list.length == 0) {
                                    resolve();
                                }
                            })
                            .catch(reject);
                    });
                }
            }
        });
    }

    isValid() {
        var validator = super.isValid();

        // validator.addError('columnName', L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

        return validator;
    }

    ///
    /// Working with Actual Object Values:
    ///

    // return the grid column header definition for this instance of ABFieldList
    columnHeader(options) {
        options = options || {};

        var config = super.columnHeader(options);
        var field = this;
        var App = App;
        var isRemovable = options.editable && !this.settings.required;

        // Multiple select list
        if (this.settings.isMultiple == true) {
            // var width = options.width,
            //     editable = options.editable;

            config.template = (obj) => {
                var placeHolder = "";
                if (options.editable) {
                    placeHolder =
                        "<span style='color: #CCC; padding: 0 5px;'>" +
                        L("ab.dataField.list.placeholder", "*Select item") +
                        "</span>";
                }
                var value = "";

                if (!obj[field.columnName]) return value;

                // get selected values
                // let selectedData = this._getSelectedOptions(obj);
                let selectedData = [];
                var opts =
                    typeof obj[field.columnName] == "string"
                        ? JSON.parse(obj[field.columnName])
                        : obj[field.columnName];
                field.settings.options.forEach(function(opt) {
                    if (opts.find((x) => x.id == opt.id)) {
                        selectedData.push(opt);
                    }
                });

                if (selectedData.length == 0) {
                    value = placeHolder;
                } else {
                    value += isRemovable
                        ? "<ul class='webix_multicombo_listbox hideWebixMulticomboTag'>"
                        : "<ul class='webix_multicombo_listbox hideWebixMulticomboTag notRemovable'>";
                }

                selectedData.forEach((item) => {
                    if (field.settings.hasColors && obj[field.columnName]) {
                        value +=
                            '<li class="webix_multicombo_value" style="line-height:24px; color: white; background: ' +
                            item.hex +
                            ';" optvalue="' +
                            item.id +
                            '"><span>' +
                            item.text +
                            "</span>" +
                            (isRemovable
                                ? '<span data-optvalue="' +
                                  item.id +
                                  '" class="webix_multicombo_delete" role="button" aria-label="Remove item">x</span>'
                                : "") +
                            "</li>";
                    } else {
                        value +=
                            '<li class="webix_multicombo_value" style="line-height:24px; color: white; background: #475466;" optvalue="' +
                            item.id +
                            '"><span>' +
                            item.text +
                            "</span>" +
                            (isRemovable
                                ? '<span data-optvalue="' +
                                  item.id +
                                  '" class="webix_multicombo_delete" role="button" aria-label="Remove item">x</span>'
                                : "") +
                            "</li>";
                    }
                });
                if (selectedData.length > 0) {
                    value += "</ul>";
                }
                return value;
            };

            config.editor = "multiselect";
            config.editParse = function(value) {
                var vals = [];
                field.settings.options.forEach(function(opt) {
                    if (value.split(",").indexOf(opt.id) > -1) {
                        vals.push(opt);
                    }
                });
                return vals;
            };
            config.editFormat = function(value) {
                var vals = [];
                if (Array.isArray(value)) {
                    value.forEach((v) => {
                        vals.push(v.id);
                    });
                    return vals.join();
                } else {
                    return value;
                }
            };
            config.options = field.settings.options.map(function(opt) {
                return {
                    id: opt.id,
                    value: opt.text,
                    hex: opt.hex
                };
            });
        }
        // Single select list
        else {
            var placeHolder = "";
            if (options.editable) {
                placeHolder =
                    "<span style='color: #CCC; padding: 0 5px;'>" +
                    L("ab.dataField.list.placeholder", "*Select item") +
                    "</span>";
            }

            config.template = (obj) => {
                var myHex = "#475466";
                var myText = placeHolder;
                var myId = 0;
                field.settings.options.forEach((h) => {
                    if (h.id == obj[field.columnName]) {
                        myHex = h.hex;
                        myText = h.text;
                        myId = h.id;
                    }
                });
                if (field.settings.hasColors && obj[field.columnName]) {
                    return (
                        (isRemovable
                            ? "<ul class='webix_multicombo_listbox hideWebixMulticomboTag'>"
                            : "<ul class='webix_multicombo_listbox hideWebixMulticomboTag notRemovable'>") +
                        '<li class="webix_multicombo_value" style="line-height:24px; color: white; background: ' +
                        myHex +
                        ';" optvalue="' +
                        myId +
                        '"><span>' +
                        myText +
                        "</span>" +
                        (isRemovable
                            ? '<span data-optvalue="' +
                              myId +
                              '" class="webix_multicombo_delete" role="button" aria-label="Remove item">x</span>'
                            : "") +
                        "</li>" +
                        "</ul>"
                    );
                } else {
                    if (myText != placeHolder) {
                        return (
                            myText +
                            (isRemovable
                                ? ' <a class="webix_multicombo_delete" style="color: #333;"><i class="fa fa-remove"></i></a>'
                                : "")
                        );
                    } else {
                        return myText;
                    }
                }
            };

            config.editor = "richselect";
            config.options = field.settings.options.map(function(opt) {
                return {
                    id: opt.id,
                    value: opt.text,
                    hex: opt.hex
                };
            });
        }

        return config;
    }

    /*
     * @function customDisplay
     * perform any custom display modifications for this field.
     * @param {object} row is the {name=>value} hash of the current row of data.
     * @param {App} App the shared ui App object useful more making globally
     *					unique id references.
     * @param {HtmlDOM} node  the HTML Dom object for this field's display.
     */
    customDisplay(row, App, node, options) {
        // sanity check.
        if (!node) {
            return;
        }

        options = options || {};

        if (this.settings.isMultiple == true) {
            if (!node.querySelector) return;

            let clearButton = node.querySelectorAll(".webix_multicombo_delete");
            if (clearButton) {
                clearButton.forEach((button) => {
                    button.addEventListener("click", (e) => {
                        e.stopPropagation();
                        let values = row[this.columnName];
                        let updatedVals = values.filter(
                            (obj) => obj.id != e.target.dataset.optvalue
                        );
                        var value = {};
                        if (updatedVals.length == 0) updatedVals = "";
                        value[this.columnName] = updatedVals;
                        this.object
                            .model()
                            .update(row.id, value)
                            .then(() => {
                                // update the client side data object as well so other data changes won't cause this save to be reverted
                                if ($$(node) && $$(node).updateItem)
                                    $$(node).updateItem(row.id, value);
                            })
                            .catch((err) => {
                                node.classList.add("webix_invalid");
                                node.classList.add("webix_invalid_cell");

                                OP.Error.log("Error updating our entry.", {
                                    error: err,
                                    row: row,
                                    values: ""
                                });
                            });
                    });
                });
            }
        } else {
            if (!node.querySelector) return;

            let clearButton = node.querySelector(".webix_multicombo_delete");
            if (clearButton) {
                clearButton.addEventListener("click", (e) => {
                    e.stopPropagation();
                    var values = {};
                    values[this.columnName] = "";
                    this.object
                        .model()
                        .update(row.id, values)
                        .then(() => {
                            // update the client side data object as well so other data changes won't cause this save to be reverted
                            if ($$(node) && $$(node).updateItem)
                                $$(node).updateItem(row.id, values);
                        })
                        .catch((err) => {
                            node.classList.add("webix_invalid");
                            node.classList.add("webix_invalid_cell");

                            OP.Error.log("Error updating our entry.", {
                                error: err,
                                row: row,
                                values: ""
                            });
                        });
                });
            }
        }
    }

    /*
     * @funciton formComponent
     * returns a drag and droppable component that is used on the UI
     * interface builder to place form components related to this ABField.
     *
     * an ABField defines which form component is used to edit it's contents.
     * However, what is returned here, needs to be able to create an instance of
     * the component that will be stored with the ABViewForm.
     */
    formComponent() {
        // NOTE: what is being returned here needs to mimic an ABView CLASS.
        // primarily the .common() and .newInstance() methods.
        var formComponentSetting = super.formComponent();

        // .common() is used to create the display in the list
        formComponentSetting.common = () => {
            return {
                key: this.settings.isMultiple ? "fieldcustom" : "selectsingle",
                options: this.settings.options.map(function(opt) {
                    return {
                        id: opt.id,
                        value: opt.text,
                        hex: opt.hex
                    };
                })
            };
        };

        return formComponentSetting;
    }

    detailComponent() {
        var detailComponentSetting = super.detailComponent();

        detailComponentSetting.common = () => {
            return {
                key: this.settings.isMultiple
                    ? "detailselectivity"
                    : "detailtext"
            };
        };

        return detailComponentSetting;
    }

    getValue(item, rowData) {
        var values = {};

        if (!item) return values;

        if (this.settings.isMultiple) {
            values = $$(item).getValue();
            // var domNode = item.$view.querySelector(".list-data-values");
            // values = this.selectivityGet(domNode);
        } else {
            values = $$(item).getValue();
        }
        return values;
    }

    setValue(item, rowData) {
        if (!item) return;

        if (this.settings.isMultiple) {
            super.setValue(item, rowData);
            // let selectedOpts = this._getSelectedOptions(rowData);
            //
            // // get selectivity dom
            // var domSelectivity = item.$view.querySelector(".list-data-values");
            //
            // // set value to selectivity
            // this.selectivitySet(domSelectivity, selectedOpts, this.App);
        } else {
            super.setValue(item, rowData);
        }
    }
};