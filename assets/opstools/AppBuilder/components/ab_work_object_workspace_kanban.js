
/*
 * ab_work_object_workspace_kanban
 *
 * Manage the Object Workspace KanBan area.
 *
 */
import AB_Work_KanbanSide from "./ab_work_object_workspace_kanban_sidePanel"


export default class ABWorkObjectKanBan extends OP.Component {

	/**
	 * 
	 * @param {*} App 
	 * @param {*} idBase 
	 */

	constructor(App, idBase) {

		idBase = idBase || 'ab_work_object_workspace_kanban';
		super(App, idBase);

		var L = this.Label;
		var labels = {
			common: App.labels,
			component: {
			}
		};

		// internal list of Webix IDs to reference our UI components.
		var ids = {
			component: this.unique(idBase + '_workspace_kanban'),
			kanban: this.unique(idBase + '_kanban'),
			resizer: this.unique(idBase + '_resizer'),
		}

		var users = OP.User.userlist().map(u => {
			return {
				id: u.username,
				value: u.username,
				image: ''
			};
		});

		let KanbanSide = new AB_Work_KanbanSide(App, idBase);

		// Our webix UI definition:
		this.ui = {
			id: ids.component,
			cols: [
				{
					id: ids.kanban,
					view: "kanban",
					cols: [],
					userList: true,
					editor: false, // we use side bar
					user: users,
					tags: [],
					data: [],
					on: {
						onListAfterSelect: (itemId, list) => {
							if (itemId)
								KanbanSide.show();
							else
								KanbanSide.hide();
						},
						onListAfterDrop: (context, ev, list) => {

							let rowId = context.source[0];
							if (rowId == null) return;

							let newStatus = context.to.config.status;

							_logic.updateStatus(rowId, newStatus);

						}
					}
				},
				{
					id: ids.resizer,
					view: "resizer",
					borderless: true,
				},
				KanbanSide.ui
			]
		};


		// Our init() function for setting up our UI
		this.init = (options) => {

			webix.extend($$(ids.kanban), webix.ProgressBar);

			KanbanSide.init({
				onClose: _logic.unselect
			})

		}



		var CurrentObject = null;		// current ABObject being displayed
		var CurrentVerticalField = null;


		// our internal business logic
		var _logic = this._logic = {


			/**
			 * @function hide()
			 *
			 * hide this component.
			 */
			hide: function () {
				$$(ids.component).hide();
			},


			/**
			 * @function show()
			 *
			 * Show this component.
			 */
			show: function () {

				$$(ids.component).show();

				if (!CurrentObject) return;

				// Get object's kanban view
				let kanbanView = CurrentObject.workspaceViews.getCurrentView();
				if (!kanbanView || kanbanView.type != "kanban") return;

				// Get vertical grouping field and populate to kanban list
				// NOTE: this field should be the select list type
				CurrentVerticalField = kanbanView.getVerticalGroupingField();
				if (!CurrentVerticalField) return;

				// Option format -  { id: "1543563751920", text: "Normal", hex: "#4CAF50" }
				let verticalOptions = (CurrentVerticalField.settings.options || []).map(opt => {

					return {
						header: opt.text,
						body: {
							view: "kanbanlist",
							status: opt.id
						}
					};
				});

				// Rebuild kanban that contains options
				// NOTE: webix kanban does not support dynamic vertical list
				webix.ui(verticalOptions, $$(ids.kanban));
				$$(ids.kanban).reconstruct();

				let horizontalField = kanbanView.getHorizontalGroupingField();


				_logic.loadData();

			},

			objectLoad: function (object) {

				CurrentObject = object;

			},

			loadData: function () {

				if (!CurrentObject || !CurrentVerticalField)
					return;

				// Show loading cursor
				if ($$(ids.kanban).showProgress)
					$$(ids.kanban).showProgress({ type: "icon" });

				// WORKAROUND: load all data for now
				CurrentObject.model().findAll({})
					.then((data) => {

						$$(ids.kanban).parse(data.data.map(d => {
							return {
								id: d.id,
								text: CurrentObject.displayData(d),
								status: d[CurrentVerticalField.columnName]
							};
						}));

						if ($$(ids.kanban).hideProgress)
							$$(ids.kanban).hideProgress();
					});

			},

			updateStatus: function (rowId, status) {

				// Show loading cursor
				if ($$(ids.kanban).showProgress)
					$$(ids.kanban).showProgress({ type: "icon" });

				let patch = {};
				patch[CurrentVerticalField.columnName] = status;

				CurrentObject.model()
					.update(rowId, patch)
					.then(() => {

						if ($$(ids.kanban).hideProgress)
							$$(ids.kanban).hideProgress();

					})
					.catch((err) => {

						OP.Error.log('Error saving item:', { error: err });

						if ($$(ids.kanban).hideProgress)
							$$(ids.kanban).hideProgress();

					});

			},

			unselect: function () {

				// TODO: how to unselect task in kanban
			}


		}



		// 
		// Define our external interface methods:
		// 

		this.hide = _logic.hide;
		this.show = _logic.show;
		this.objectLoad = _logic.objectLoad;

	}

}