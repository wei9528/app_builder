
/*
 * ab_work_object_workspace
 *
 * Manage the Object Workspace area.
 *
 */

import AB_Work_HeaderEditMenu from "./ab_work_object_workspace_popupHeaderEditMenu"


export default class ABWorkObjectDatatable extends OP.Component {
    
    constructor(App) {
        super(App, 'ab_work_object_workspace_datatable');
        var L = this.Label;
        
        var labels = {
            common: App.labels,
            component: {

                confirmDeleteRowTitle : L('ab.object.deleteRow.title', "*Delete data"),
                confirmDeleteRowMessage : L('ab.object.deleteRow.message', "*Do you want to delete this row?"),

            }
        };


    	// internal list of Webix IDs to reference our UI components.
    	var ids = {
    		component: this.unique('component'),

    	}

        var defaultHeight = 0;

        var PopupHeaderEditComponent = new AB_Work_HeaderEditMenu(App);


    	// Our webix UI definition:
    	this.ui = {
    		view: "datatable",
    		id: ids.component,
            resizeColumn: {size: 6},
            resizeRow: {size: 6},
    		prerender: false,
    		editable: true,
    		fixedRowHeight: false,
    		editaction: "custom",
    		select: "cell",
            tooltip:function(obj, common){
                var tip = "";
                if (Array.isArray(obj[common.column.id])) {
                    obj[common.column.id].forEach(function (o) {
                        tip += o.text + "<br/>";
                    });
                } else if (typeof obj[common.column.id] == "undefined" && typeof obj[common.column.id+"__relation"] != "undefined") {
                    obj[common.column.id+"__relation"].forEach(function (o) {
                        tip += o.text + "<br/>";
                    });
                } else if (typeof obj[common.column.id+"__relation"] != "undefined" && typeof obj[common.column.id] == "number") {
                    tip = obj[common.column.id+"__relation"].text;
                } else {
                    tip = obj[common.column.id];
                }
                if (tip == null) {
                    return "";
                } else {
                    return tip;                    
                }
            },
    		dragColumn: true,
    		on: {
    			onBeforeSelect: function (data, preserve) {

					var selectField = CurrentObject.fields((f) => { return f.columnName == data.column; })[0];

					if (selectField == null) return true;

					var cellNode = this.getItemNode({ row: data.row, column: data.column }),
						rowData = this.getItem(data.row);

					return selectField.customEdit(rowData, App, cellNode);

    			},
    			onAfterSelect: function (data, prevent) {
    				_logic.onAfterSelect(data, prevent);
    			},
    			onCheck: function (row, col, val) { // Update checkbox data

					var state = {
						value: val
					};

					var editor = {
						row: row,
						column: col
					};

					_logic.onAfterEditStop(state, editor);
    			},
    			onBeforeEditStop: function (state, editor) {
console.error('!! ToDo: onBeforeEditStop()');
    				// var column = AD.classes.AppBuilder.currApp.currObj.columns.filter(function (col) { return col.name == editor.column; });

    				// if (!column || column.length < 1) return true;
    				// column = column[0];

    				// var passValidate = dataFieldsManager.validate(column, state.value);

    				// if (!passValidate) {
    				// 	$$(self.webixUiId.objectDatatable).editCancel();
    				// }

    				// return passValidate;
    			},
    			onAfterEditStop: function (state, editor, ignoreUpdate) {
    				_logic.onAfterEditStop(state, editor, ignoreUpdate);
    			},
                // We are sorting with server side requests now so we can remove this
    			// onAfterLoad: function () {
    			// 	_logic.onAfterLoad();
    			// },
    			onColumnResize: function (columnName, newWidth, oldWidth, user_action) {
                    _logic.onColumnResize(columnName, newWidth, oldWidth, user_action);
    			},
                onRowResize: function (rowId) {
                    _logic.onRowResize(rowId);
    			},
    			onBeforeColumnDrag: function (sourceId, event) {
    				if (sourceId === 'appbuilder_trash') // Remove column
    					return false;
    				else
    					return true;
    			},
    			onBeforeColumnDrop: function (sourceId, targetId, event) {
    				if (targetId === 'appbuilder_trash') // Remove column
    					return false;

    				// if ($$(self.webixUiId.visibleButton).config.badge > 0) {
    				// 	webix.alert({
    				// 		title: self.labels.object.couldNotReorderField,
    				// 		ok: self.labels.common.ok,
    				// 		text: self.labels.object.couldNotReorderFieldDetail
    				// 	});

    				// 	return false;
    				// }
    			},
    			onAfterColumnDrop: function (sourceId, targetId, event) {
                    _logic.onAfterColumnDrop(sourceId, targetId, event);
    			},
    			onAfterColumnShow: function (id) {
console.error('!! ToDo: onAfterColumnShow()');
    				// $$(self.webixUiId.visibleFieldsPopup).showField(id);
    			},
    			onAfterColumnHide: function (id) {
console.error('!! ToDo: onAfterColumnHide()');
    				// $$(self.webixUiId.visibleFieldsPopup).hideField(id);
    			},

    			onHeaderClick: function (id, e, node) {
    				_logic.onHeaderClick(id, e, node);
    			}
    		}
    	}



    	// Our init() function for setting up our UI
    	this.init = (options) => {

    		// register our callbacks:
    		for(var c in _logic.callbacks) {
    			_logic.callbacks[c] = options[c] || _logic.callbacks[c];
    		}

    		// webix.extend($$(ids.form), webix.ProgressBar);

            PopupHeaderEditComponent.init({
                onClick:_logic.callbackHeaderEdit       // be notified when there is a change in the hidden fields
            })


    		// NOTE: register the onAfterRender() here, so it only registers
    		// one.
    		var DataTable = $$(ids.component);
    		var throttleCustomDisplay = null;
            var items = [];

			webix.extend(DataTable, webix.ProgressBar);

    		DataTable.attachEvent("onAfterRender", function(data){
                items = [];
                data.order.each(function (i) {
                    if (typeof i != "undefined") items.push(i);
                });
    			if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);
    			throttleCustomDisplay = setTimeout(()=>{
    				if (CurrentObject) {
                        if (scrollStarted) clearTimeout(scrollStarted);
    					CurrentObject.customDisplays(this, App, DataTable, items);
    				}
    			}, 350);

    		});

            // we have some data types that have custom displays that don't look right after scrolling large data sets we need to call customDisplays again
            var scrollStarted = null;
            DataTable.attachEvent("onScroll", function(){
                if (scrollStarted) clearTimeout(scrollStarted);
                if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);
    			scrollStarted = setTimeout(()=>{
                    if (CurrentObject) {
    					CurrentObject.customDisplays(this, App, DataTable, items);
    				}
    			}, 1500);
            });

            
            // we have some data types that have custom displays that don't look right after scrolling large data sets we need to call customDisplays again
            DataTable.attachEvent("onAfterScroll", function(){
                if (throttleCustomDisplay) clearTimeout(throttleCustomDisplay);
                throttleCustomDisplay = setTimeout(()=>{
                    if (CurrentObject) {
                        if (scrollStarted) clearTimeout(scrollStarted);
                        CurrentObject.customDisplays(this, App, DataTable, items);
                    }
                }, 350);

            });


    		// Process our onItemClick events. 
    		// this is a good place to check if our delete/trash icon was clicked.
    		DataTable.attachEvent("onItemClick", function (id, e, node) {

    			// make sure we have an object selected before processing this.
    			if (!CurrentObject) { return; }


    			// if this was our trash icon:
    			if (e.target.className.indexOf('trash') > -1) {

    				OP.Dialog.Confirm({
    					title: labels.component.confirmDeleteRowTitle,
    					text:  labels.component.confirmDeleteRowMessage,
    					callback: function (result) {
    						if (result) {

    							CurrentObject.model()
    							.delete(id)
    							.then((response)=>{

    								if (response.numRows > 0) {
    									DataTable.remove(id);
    									DataTable.clearSelection();
    								} else {

    									OP.Dialog.Alert({
    										text:'No rows were effected.  This does not seem right.'
    									})
//// TODO: what do we do here?
    								}
    							})
    							.catch((err)=>{

    								OP.Error.log('Error deleting item:', {error:err});

//// TODO: what do we do here?	
    							})
    						}

    						DataTable.clearSelection();
    						return true;
    					}
    				});
    			}	
    			
    		});

    	}



    	var CurrentObject = null;		// current ABObject being displayed
    	var EditField	= null;			// which field (column header) is popup editor for
    	var EditNode	= null;			// which html node (column header) is popup editor for



    	// our internal business logic
    	var _logic = this._logic = {


    		callbacks:{

    			/**
    			 * @function onEditorMenu
    			 * report back which menu action was clicked.
    			 * We get the info from our popupHeaderEditor component, but all the
    			 * logic to respond to those options are in our parent. So we pass it
    			 * on ...
    			 *
    			 * @param {string} action [ 'hide', 'filter', 'sort', 'edit', 'delete' ]
    			 * @param {ABField} field  the field to which the action is to be applied
    			 * @param {dom} node  the optional html node for this header item.
    			 */
    			onEditorMenu: function(action, field) {  },
                
                
                onColumnOrderChange:function(object){}
    		},


    		/**
    		 * @function callbackHeaderEdit
    		 *
    		 * call back for when an item in the Header Edit Menu has been selected.
    		 * @param {string} action the action requested for this field:
    		 */
    		callbackHeaderEdit: function(action) {

    			PopupHeaderEditComponent.hide();
    			_logic.callbacks.onEditorMenu(action, EditField, EditNode);
    		},

            /**
    		 * @function getColumnConfig
    		 *
    		 * return the column index of a given column ID
    		 * @param {string} id column id you want the index of
    		 */
    		getColumnConfig: function(id) {
    			var DataTable = $$(ids.component);

    			return DataTable.getColumnConfig(id);
    		},

    		/**
    		 * @function getColumnIndex
    		 *
    		 * return the column index of a given column ID
    		 * @param {string} id column id you want the index of
    		 */
    		getColumnIndex: function(id) {
    			var DataTable = $$(ids.component);

    			return DataTable.getColumnIndex(id);
    		},
            
    		/**
    		 * @function getColumnConfig
    		 *
    		 * return the column config of a datagrid
    		 * @param {string} id datagrid id you want the column info from
    		 */
    		getFieldList: function() {
    			var DataTable = $$(ids.component);

    			return DataTable.fieldList;
    		},
            
            freezeDeleteColumn: function() {
                var DataTable = $$(ids.component);
                // we are going to always freeze the delete column if the datatable is wider than the container so it is easy to get to
                if (DataTable.$width < DataTable.Gj) {
                    return DataTable.define('rightSplit', 1);                        
                } else {
                    return DataTable.define('rightSplit', 0);
                }
            },
            
            /**
             * @function onAfterColumnDrop
             * When an editor drops a column to save a new column order
             * @param {string} sourceId the columnName of the item dragged
             * @param {string} targetId the columnName of the item dropped on
             * @param {event} event
             */
            onAfterColumnDrop: function (sourceId, targetId, event) {
                CurrentObject.fieldReorder(sourceId, targetId)
                .then(()=>{
                    _logic.callbacks.onColumnOrderChange(CurrentObject);
                    // freeze columns:
                    var DataTable = $$(ids.component);
                    if (CurrentObject.workspaceFrozenColumnID != "") {
                        DataTable.define('leftSplit', DataTable.getColumnIndex(CurrentObject.workspaceFrozenColumnID) + 1);
                    } else {
                        DataTable.define('leftSplit', 0);                        
                    }
                    _logic.freezeDeleteColumn();
                    DataTable.refreshColumns()
                })
                .catch((err)=>{

                    OP.Error.log('Error saving new column order:', {error:err});

                });
            },


    		/**
    		 * @function onAfterEditStop
    		 * When an editor is finished.
    		 * @param {json} state
    		 * @param {} editor
    		 * @param {} ignoreUpdate
    		 * @return
    		 */
    		onAfterEditStop: function (state, editor, ignoreUpdate) {

    			// state:   {value: "new value", old: "old value"}
    			// editor:  { column:"columnName", row:ID, value:'value', getInputNode:fn(), config:{}, focus: fn(), getValue: fn(), setValue: function, getInputNode: function, render: function…}

    			var DataTable = $$(ids.component);

    			if (state.value != state.old) {



    				var item = DataTable.getItem(editor.row);
    				item[editor.column] = state.value;

    				DataTable.removeCellCss(item.id, editor.column, "webix_invalid");
    				DataTable.removeCellCss(item.id, editor.column, "webix_invalid_cell");

    				var validator = CurrentObject.isValidData(item);
    				if (validator.pass()) {


//// Question: do we submit full item updates?  or just patches?
var patch = {};
patch[editor.column] = item[editor.column];  // NOTE: isValidData() might also condition the data for sending.state.value;
    					CurrentObject.model()
    					.update(item.id, item)
// .update(item.id, patch)
    					.then(()=>{

    						DataTable.updateItem(editor.row, item);
    						DataTable.clearSelection();
    						DataTable.refresh(editor.row);

    					})
    					.catch((err)=>{

    						OP.Error.log('Error saving item:', {error:err});

    						DataTable.clearSelection();
    						if (OP.Validation.isGridValidationError(err, editor.row, DataTable)) {

// Do we reset the value?
// item[editor.column] = state.old;
// DataTable.updateItem(editor.row, item);

    						} else {

// this was some other Error!

    						}


    					})

    				} else {

    					validator.updateGrid(editor.row, DataTable);
    				}



    			} else {

    				DataTable.clearSelection();
    			}

    			return false;

    				// var item = $$(self.webixUiId.objectDatatable).getItem(editor.row);

    				// self.updateRowData(state, editor, ignoreUpdate)
    				// 	.fail(function (err) { // Cached
    				// 		item[editor.column] = state.old;
    				// 		$$(self.webixUiId.objectDatatable).updateItem(editor.row, item);
    				// 		$$(self.webixUiId.objectDatatable).refresh(editor.row);

    				// 		// TODO : Message

    				// 		$$(self.webixUiId.objectDatatable).hideProgress();
    				// 	})
    				// 	.then(function (result) {
    				// 		if (item) {
    				// 			item[editor.column] = state.value;

    				// 			if (result && result.constructor.name === 'Cached' && result.isUnsync())
    				// 				item.isUnsync = true;

    				// 			$$(self.webixUiId.objectDatatable).updateItem(editor.row, item);
    				// 		}

    				// 		// TODO : Message

    				// 		$$(self.webixUiId.objectDatatable).hideProgress();
    				// 	});
    		},


    		onAfterLoad: function() {
    			// We are going to do this with a server side call now 
                // _logic.sortTable();
    		},


    		/**
    		 * @function onAfterSelect
    		 * This is when a user clicks on a cell.  We use the onAfterSelect to
    		 * trigger a normal .editCell() if there isn't a custom editor for this field.
    		 * @param {json} data webix cell data
    		 * @return
    		 */
    		onAfterSelect: function (data, prevent) {
    			// data: {row: 1, column: "name", id: "1_name", toString: function}
    			// data.row: .model.id
    			// data.column => columnName of the field


    			// Normal update data
    			$$(ids.component).editCell(data.row, data.column);


    				// var columnConfig = $$(self.webixUiId.objectDatatable).getColumnConfig(data.column),
    				// 	fieldData = AD.classes.AppBuilder.currApp.currObj.columns.filter(function (col) { return col.name == data.column; });

    				// if (!fieldData || fieldData.length < 1) {
    				// 	console.log('System could not found this column data');
    				// 	return false;
    				// } else
    				// 	fieldData = fieldData[0];

    				// // Custom update data
    				// if (dataFieldsManager.hasCustomEdit(columnConfig.fieldName, fieldData))
    				// 	return false;

    				// // Normal update data
    				// this.editCell(data.row, data.column);
    		},
            

            /**
             * @function onColumnResize
             * This is when a user adjusts the size of a column
             * @param {} columnName 
             * @param {int} newWidth
             * @param {int} oldWidth
             * @param {} user_action
             * @return
             */
            onColumnResize: function(columnName, newWidth, oldWidth, user_action) {
                CurrentObject.columnResize(columnName, newWidth, oldWidth)
                .then(()=>{
                    
                    var DataTable = $$(ids.component);
                    _logic.freezeDeleteColumn();
                    DataTable.refreshColumns();

                })
                .catch((err)=>{

                    OP.Error.log('Error saving new column size:', {error:err});

                });
            },


            /**
             * @function onRowResize
             * This is when a user adjusts the size of a row
             * @param {} rowId 
             * @param {int} newHeight
             * @param {int} oldHeight
             * @param {} user_action
             * @return
             */
            onRowResize: function(rowId) {
                var DataTable = $$(ids.component);
                
                var item = DataTable.getItem(rowId);
                var height = item.$height;
                
                var properties = item.properties || {};
                properties.height = height;
                
                item.properties = properties;

                CurrentObject.model()
                .update(item.id, item)
                .then(()=>{
                })
                .catch((err)=>{
                
                    OP.Error.log('Error saving item:', {error:err});
                
                });
            },


    		/**
    		 * @function onHeaderClick
    		 *
    		 * process the user clicking on the header for one of our columns.
    		 */
    		onHeaderClick: function (id, e, node) {

    			// Ignore system columns
    			if (id.column == 'appbuilder_trash')
    				return false;

    			// save our EditNode & EditField:
    			EditNode = node;

    			EditField = CurrentObject.fields(function(f){ return f.columnName == id.column; })[0];
    			if (EditField) {

    				// show the popup
    				PopupHeaderEditComponent.show(node);
    			}

    			return false;
    		},


    		objectLoad:function(object) {

    			CurrentObject = object;
                
                var DataTable = $$(ids.component);
                var minHeight = 0;
                defaultHeight = 0;
                CurrentObject._fields.forEach(function (f) {
                    if (f.key == "image" && parseInt(f.settings.useHeight) == 1 && parseInt(f.settings.imageHeight) > minHeight) {
                        minHeight = parseInt(f.settings.imageHeight);
                    }
                });
                if (minHeight > 0) {
                    defaultHeight = minHeight;
                }

    			PopupHeaderEditComponent.objectLoad(object);

                // supressed this because it seems to be making an extra call?
    			// _logic.refresh();
    		},


    		// rebuild the data table view:
    		refresh: function() {

    			// wait until we have an Object defined:
    			if (CurrentObject) {

    				var DataTable = $$(ids.component);
    				DataTable.clearAll();


    				//// update DataTable structure:
    				// get column list from our CurrentObject
    				var columnHeaders = CurrentObject.columnHeaders(true);

    				// add the delete / Trash column
    				columnHeaders.push({
    					id: "appbuilder_trash",
    					header: "",
    					width: 40,
    					template: "<span class='trash'>{common.trashIcon()}</span>",
    					css: { 'text-align': 'center' }
    				})
    				DataTable.refreshColumns(columnHeaders)


    				// freeze columns:
    				if (CurrentObject.workspaceFrozenColumnID != "") {
    					DataTable.define('leftSplit', DataTable.getColumnIndex(CurrentObject.workspaceFrozenColumnID) + 1);
    				} else {
                        DataTable.define('leftSplit', 0);                        
                    }
                    _logic.freezeDeleteColumn();
                    DataTable.refreshColumns();

    				//// update DataTable Content

    				// Set the Model object with a condition / skip / limit, then
    				// use it to load the DataTable:
    				//// NOTE: this should take advantage of Webix dynamic data loading on
    				//// larger data sets.
                    var wheres = {};
                    if (CurrentObject.workspaceFilterConditions.length > 0) {
                        wheres = CurrentObject.workspaceFilterConditions;
                    }
                    var sorts = {};
                    if (CurrentObject.workspaceSortFields.length > 0) {
                        sorts = CurrentObject.workspaceSortFields;
                    }
    				CurrentObject.model()
    				.where({
                        where: wheres, 
                        sort: sorts,
                        height: defaultHeight
                    })
    				.skip(0)
    				.limit(30)
    				.loadInto(DataTable);
    			}
    		},


    		/**
    		 * @function rowAdd()
    		 *
    		 * add a new row to the data table
    		 */
    		rowAdd:function() {
    			var emptyObj = CurrentObject.defaultValues();
    			CurrentObject.model()
    			.create(emptyObj)
    			.then((obj)=>{
    				var DataTable = $$(ids.component);
    				DataTable.add(obj, 0);
    			})
    		},


    		/**
    		 * @function show()
    		 *
    		 * Show this component.
    		 */
    		show:function() {

    			$$(ids.component).show();
    		},
    	}
        




    	// Expose any globally accessible Actions:
    	this.actions({

            onRowResizeAuto: function(rowId, height) {
                var DataTable = $$(ids.component);
                
                var item = DataTable.getItem(rowId);
                var height = height;
                
                var properties = item.properties || {};
                properties.height = height;
                
                item.properties = properties;

                CurrentObject.model()
                .update(item.id, item)
                .then(()=>{
                    item.$height = height;
                    DataTable.refresh();
                })
                .catch((err)=>{
                
                    OP.Error.log('Error saving item:', {error:err});
                
                });
            }

    	})


        // 
        // Define our external interface methods:
        // 
        this.objectLoad = _logic.objectLoad;
        this.refresh = _logic.refresh;
        this.addRow = _logic.rowAdd;

        // allow getColumnConfig for sort data table component
        this.getColumnConfig = _logic.getColumnConfig;
        // expose data for badge on frozen button
        this.getColumnIndex = _logic.getColumnIndex;

        // expose data for column sort UI
        this.getFieldList = _logic.getFieldList;
    }

}

