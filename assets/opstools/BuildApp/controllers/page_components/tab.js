steal(
    // List your Controller's dependencies here:
    function () {
        var componentIds = {
            editView: 'ab-tab-edit-view',
            editMenu: 'ab-tab-edit-mode',
            addTabForm: 'ab-tab-create-form',
            propertyView: 'ab-tab-property-view',
            pageTree: 'ab-tab-page-tree'
        };

        //Constructor
        var tabComponent = function (application, viewId, componentId) {
            var data = {};

            var _this = this;

            this.viewId = viewId;
            this.editViewId = componentIds.editMenu;


            this.pendingTransactions = [];
            // this.listTabPages = [];

            //
            // Instance functions
            //

            /*
             * @function render
             * display this instance on the screen.
             *
             * in whatever context this component is being displayed, in the editor or on 
             * a generated page, render this instance based upon the provided settings.
             *
             * @param {json} setting  our instance settings.
             * @return {deferred}
             */
            this.render = function (setting) {
                var q = $.Deferred(),
                    self = this;

                // 1) rebuild the current view of our component 
                // based upon the given setting

                var view = $.extend(true, {}, tabComponent.getView());

                // setting.tabs    : {array} of { tab definitions }



                // do we have any pages added?
                // if (!self.listTabPages.length > 0) {
                    if ((setting.tabs)
                        && (setting.tabs.length)) {

                        view = tabComponent.tabView();
                        // self.listTabPages = setting.tabs;
                    } 
                // } else {
                //     view = tabComponent.tabView();
                // }
                view.id = self.viewId;  


                // there are several paths in .render() that need to
                // properly close out the method.  This is a common
                // routine to properly finish off the process.
                function finishIt() {

                    // event to notifiy the [ask pong who?] we are finished 
                    // updating our display
                    $(self).trigger('renderComplete', {});

                    var tabView = $$(self.viewId);
                    if (tabView && tabView.hideProgress) {
                        tabView.hideProgress();
                    }


                    data.isRendered = true;
                    q.resolve();
                }


                // if we are actually rendering tabs here
                if (view.view == 'tabview') {


                    // perform the page lookup here.
                    var listPagesToLoad = [];

                    // for each tab
                        // add a cell to the template
                    setting.tabs.forEach(function(tab){
                        if ((tab.checked === true) || (tab.checked == 'true')) {
                            view.cells.push(
                                {
                                  header: "<i class='fa "+tab.icon+"'></i> "+tab.label,
                                  body: {
                                    view: "template", 
                                    template:"<div id=\""+tab.uuid+"\" > </div>",
                                    height:500
                                  }
                                }
                            );
                            listPagesToLoad.push(tab.uuid);
                        }
                        return true;
                    });



                    // 2) find the existing element on our page, and replace it with the
                    // current view:
                    var tabView = webix.ui(view, $$(self.viewId));  // create the view at location $$(self.viewId) ?
                    webix.extend($$(self.viewId), webix.ProgressBar);

                    tabView.getTabbar().attachEvent("onChange", function(newv, oldv){

                        refreshTabView();
                    });



                    var Page = AD.Model.get('opstools.BuildApp.ABPage');

                    function refreshTabView(cb) {

                        if (tabView._pageTabs) {
                            tabView._pageTabs.forEach(function(page){

                                var id = '#'+page.name;
                                if ($(id).length) {

                                    $(id).html(page.getItemTemplate());
                                    page.comInstances = null; // force a refresh on components
                                    page.display(application);
                                }

                            });
                        }
                        if (cb) cb();
                    }


                    // 3) load the pages associated with these tabs:
                    if (listPagesToLoad.length) {

                        Page.findAll({ name: listPagesToLoad })
                        .then(function(pageTabs){

                            self.pageTabs = pageTabs;
                            tabView._pageTabs = pageTabs;

                            refreshTabView(finishIt);
                        })

                    } else {
                        finishIt();
                    }

                } else {

                    // else our tabView currently doesn't have any Tabs to render.
                    finishIt();
                }


                return q;
            };


            /**
             * @function getSettings
             *
             * In the Editor, once the user clicks [save], this is called
             * to pull out the current settings for this component.
             * @return {json}  the {json} configuration that becomes our 
             *                 {settings} parameters in our instance methods.
             *                  .tabs {array} of tab definitions for this instance
             *                      .checked {bool} if this tab is currently included
             *                      .icon {string} the fa-[icon] for this tab
             *                      .label {string} what is displayed for this  
             *                                      tab's label
             *                      .uuid {string} the uuid link to the ABPage that
             *                                     is displayed in this Tab area.
             */
            this.getSettings = function () {

                // var values = $$(componentIds.propertyView).getValues(),
                //     selectedPages = $$(componentIds.editMenu).find(function () { return true; }),
                //     selectedPageIds = $.map(selectedPages || [], function (page) {
                //         return page.id;
                //     });

                var tabs = [];
                $$(componentIds.pageTree).find(function(obj){
                    tabs.push({
                        checked:obj.checked || false,
                        icon: obj.icon,
                        label: obj.label,
                        uuid: obj.uuid
                    })
                    return true
                })
                return {
                    tabs: tabs
                };
            };


            /**
             * @function populateSettings
             *
             * In the Editor, take our current {settings} and display those 
             * values in the component's editor.
             */
            this.populateSettings = function (setting) {
                

                // call .render() to place the element on the page.
                // NOTE: this is happening in the Editor, so don't display
                // the rendered Tabs here:
                this.render({});


                // Clear the current tree view
                $$(componentIds.pageTree).clearAll();

                // display each tab definition in our tree view
                var tabs = setting.tabs || [];
                tabs.forEach(function(tab){

                    // make a copy of tab so changes don't persist unless 
                    // we click [save]
                    var cTab = {
                        icon: tab.icon,
                        label: tab.label,
                        uuid: tab.uuid
                    }
                    if (tab.checked == 'true') {
                        cTab.checked = true;
                    } else { 
                        cTab.checked = false; 
                    }

                    // add it to the tree view
                    $$(componentIds.pageTree).add(cTab, $$(componentIds.pageTree).count());
                })
                

                // we've added a method to our component to update the display 
                // once a configuration change has been made.
                tabComponent.refreshEditView(viewId);

                $$(componentIds.propertyView).refresh();
            };


            /**
             * @function isRendered
             *
             * indicates wether or not our component has rendered itself to the 
             * display.
             *
             * Should return TRUE after our .render() method has been called.
             *
             * @return {bool}
             */
            this.isRendered = function () {
                return data.isRendered === true;
            };


            /**
             * @function afterUpdate
             * 
             * called after the settings are saved and allows your component
             * to perform additional commands to complete the process.
             *
             * @param {obj} page  the ABPage this component is on.
             * @param {obj} component the ABPageComponent instance of this component
             * @return {Deferred} since this can be an async method of updating
             *              DB settings.
             */
            this.afterUpdate = function (page, component) {
                var dfd = AD.sal.Deferred();


                var actions = [];

                this.pendingTransactions.forEach(function(trans){

                    switch(trans.op) {
                        case 'add':
                            // name the page with our uuid, so we can manage it later.
                            actions.push(page.createTab({ name: trans.values.uuid, label:trans.values.Name }));
                            break;


                        case 'delete':
                            break;

                        default:
                            console.error('unknown transaction type:', trans.op);
                            break;
                    }
                })

                $.when.apply($, actions)
                .fail(function(err){
                    AD.error.log('Problems creating the Pages', err);
                    dfd.reject(err);
                })
                .then(function() {
                    console.log('looks good.');
                    dfd.resolve();
                })


                return dfd;
            }



            /**
             * @function resize
             *
             * This method is called when the page this app is on initiates a 
             * resize().
             *
             * (if they are in edit mode, then you wont get the updated value)
             *
             * @param {integer} width
             * @param {integer} height
             */
            this.resize = function TabResize(width, height) {
                var _this = this;

                // in case this is somehow called from the OPsPortal directly:
                if (!height) {
                    if (width.height) {
                        // width parameter looks like the OPsPortal 
                        // { height:value, width:value }
                        height = width.height;
                        width = width.width;
                    }
                }

                // .resize() can get spammed numerous times in a row.
                // let's not .adjust() each time to increase performance.
// console.log('tab resize()'); 
                if (!this.resizeDebounce) {

                    this.resizeDebounce = true;
                    
                    setTimeout(function(){
// console.log('tab .adjust()');

                        $$(_this.viewId).adjust();
                        _this.resizeDebounce = false;
                    }, 10);

                }
            }

// AD.comm.hub.subscribe('ab.interface.remove', function(tag, data) {
//     // data.app  = ABApplication.id
//     // data.page = ABPage.id;

// console.log('... tab:  ab.interface.remove:', _this.listTabPages );
// _this.pageTabs.forEach(function(page){
//     if (page.id = data.page) {

// // delete this page from the tab's settings.
//         _this.listTabPages = _this.listTabPages.filter( function(t){
//             return t.uuid != page.name;
//         })

// console.log('... found a page to delete from tab');

//     }
// })



/// LEFT OFF HERE:
// for each tab, if page.name = tab.uuid  remove this tab
// update our settings  ?? how ??
//
//
// - after adding a new page, the page display list doesn't update
// - Deleting a Tab should remove all embedded Pages
// - what about the Page Interface? how to update the Tab info.
//      - do we update the tab data when loading the editor / or / rendering the tab?
//          if page not found, then change our internal info?
//      - is there a way in the Page delete routine to update the Tab Data?
//
//
//// LEFT OFF HERE:
// - debug display errors:
//      - drop onto page, add tabs, save,
//        change page, add tabs -> tab preview doesn't change
//      - after create a new tab, return to edit results in page display errors.



  

// }) // end AD.comm.hub.subscribe()

        }


        //
        // Static Class functions
        // 


        /**
         * @function getInfo
         *
         * returns the definition that allows the Editor to display an icon
         * to drag this component onto the Page layout.
         *
         * This needs to provide a 
         *      .name : {string}  The label for this component
         *      .icon : {string}  The font awesome icon to display 
         *
         * @return {json} 
         */
        tabComponent.getInfo = function () {
            return {
                name: 'tab',
                icon: 'fa-window-maximize'
            };
        };


        // .tabView()
        // the base tabview Webix definition
        tabComponent.tabView = function(){
            return  { 
                // id:componentIds.editMenu,
                view:"tabview", 
                cells: [
                    // {
                    //   header: "Form",
                    //   // body: {
                    //   //   id: "formView",
                    //   //   view: "label", 
                    //   //   label:"form View"
                    //   // }
                    // }
                ]
                // tabbar:{
                // }, 
                // multiview:{
                // }
            };
        }


        /**
         * @function getView
         * 
         * returns the Webix definition for this component.
         *
         * For our Tab Component, we start off by returning a Label view.
         * If any tabs are available, we then swtich to the .tabView definition.
         * 
         * We do it this way because Webix will not display a tab view correctly
         * if there are no .cell entries.
         *
         * @return {json} 
         */
        tabComponent.getView = function () {
            return { 
                view:'label', 
// TODO: make this a multilingual string:
                label:'Add a page below'
                // , id:componentIds.editMenu 
            };
        };


        // refreshEditView
        // There are several places in our Tab Component when we want to 
        // update the Editor once a change has been made (click on a tab entry
        // to include or exclude from the list)
        //
        // this is unique to our Tab View
        tabComponent.refreshEditView = function(tabViewId) {

            // find out which pages have been included (those that are checked)
            var currentPages = [];
            $$(componentIds.pageTree).getChecked().forEach(function (pageId) {
                currentPages.push($$(componentIds.pageTree).getItem(pageId));
            });
            
            var updatedView = {};

            // if we have tabs
            if (currentPages.length) {

                // get the tabView data
                updatedView = tabComponent.tabView();

                // for each tab
                    // add a cell to the template
                currentPages.forEach(function(obj){
                    if (obj.checked) {
                        updatedView.cells.push(
                            {
                              header: "<i class='fa "+obj.icon+"'></i> "+obj.label,
                              body: {
                                view: "label", 
                                label:""
                              }
                            }
                        );
                    }
                    return true;
                });

            } else {

                // get the base label view
                updatedView = tabComponent.getView();
            }


            // overwrite the current instance of our component
            webix.ui(updatedView, $$(tabViewId));
        }


        /**
         * @function getEditView
         *
         * return the Webix layout definition for what should be displayed for
         * this component's Editor.
         *
         * @return {json}
         */
        tabComponent.getEditView = function (componentManager) {
            var menu = $.extend(true, {}, tabComponent.getView());
            menu.id = componentIds.editMenu;

            return {
                id: componentIds.editView,
                padding: 10,
                rows: [
                    menu,

                    {
                        id:componentIds.addTabForm,
                  

                        "view": "form",
                        "elements": [{
                            "margin": 10,
                            "cols": [
                                {
                                    "rows": [
                                        {
                                            "view": "text",
                                            "name": "Name",
                                            "label": "Tab Name",
                                            "labelWidth": "100",
// TODO: make this multilingual
                                            "placeholder": "Enter a tab name",
                                            "invalidMessage": "Tab name cannot be empty",
                                            "required":true,
                                            "width": 300, 
                                            on:{

                                                "onBlur":function(){
                                                    //or validate this element only
                                                    if (!this.validate()) {
                                                        webix.message("Please enter a tab name");
                                                        return false;
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                },
                            {
                                "rows": [
                                    {
                                        "view": "text",
                                        "name": "Icon",
                                        "label": "Icon",
                                        "labelWidth": "50",
// TODO: make this multilingual
                                        "placeholder": "Choose an icon",
                                        "width": 200
                                    }
                                ]
                            },
                            {
                                view:"button",
                                width:100,
// TODO: make this multilingual
                                value: 'Add Page',

                                // .click
                                // the [Add Page] button for our input form
                                click:function(){

                                    // make sure our form is valid
                                    if (!$$(componentIds.addTabForm).validate()) {
// TODO: make this multilingual
                                        webix.message("Please enter a tab name");
                                        return false;
                                    }

                                    
                                    var values = $$(componentIds.addTabForm).getValues();


                                    values.uuid = AD.util.uuid('tabs-');

                                    // 1) Trim value
                                    // 2) lowerCase() name must not match any existing lc names



                                    // after all our validations pass, we will 
                                    // store this as a pending transaction.
                                    //
                                    // we will add a new page to our page list to
                                    // reference this tab. The user can edit the 
                                    // tab view by editing that page in the editor.
                                    //
                                    // but we will wait until [save] is pressed 
                                    // before actually creating those pages.
                                    // 
                                    // to do that, we will store this as a pendingTransaction
                                    // on our component.  And when the .afterSaveSetting() is
                                    // called, we will then issue the commands to create the
                                    // pages.
                                    // 
                                    // componentManager.editInstance is the reference to
                                    // the current instance of the Tab we are editing.
                                    // store the new page transactions here:

                                    // make sure we have a .pendingTransactions
                                    var currentTab = componentManager.editInstance;
                                    if (!currentTab.pendingTransactions) {
                                        currentTab.pendingTransactions = [];
                                    }

                                    // record a new 'add' operation
                                    currentTab.pendingTransactions.push({
                                        op:'add',
                                        values: values
                                    });

// console.log('transactions:', currentTab.pendingTransactions);

                                    // clear our form
                                    $$(componentIds.addTabForm).clear();

                                    // new tab definition value
                                    var currentValue = {label:values.Name, icon:values.Icon, checked:true, uuid:values.uuid};

                                    // update the display of our pageTree
                                    $$(componentIds.pageTree).add(currentValue, $$(componentIds.pageTree).count());

                                    // now update the Edit View to represent the 
                                    // current settings/values
                                    tabComponent.refreshEditView(componentIds.editMenu);

                                }
                              
                            }
                          ]
                        }]
                    },

                    {
                        id: 'this-is-not-it',
                        view: 'label',
                        label: 'Tab list'
                    },
                    {
                        id: componentIds.pageTree,
                        view: 'tree',
                        template: "<div class='ab-page-list-item'>" +
                                  "{common.checkbox()} <i class='fa #icon#'></i> #label#" +
                                  "</div>",
                        on: {

                            // .onItemCheck
                            // the [] next to the tab in the tree view
                            // each time one is clicked we need to update the Edit View
                            onItemCheck: function () {
                                tabComponent.refreshEditView(componentIds.editMenu);
                            }
                        }
                    }
                ]
            };
        };


        /**
         * @function getPropertyView
         *
         * The Editor has a property list on the right side.
         * 
         * This method returns the Webix layout for that display.
         *
         * @param {object} componentManager
         * @return {json} 
         */
        tabComponent.getPropertyView = function (componentManager) {
            var self = this;

            // if you change a property value, you can reset the display by:
            // var setting = componentManager.editInstance.getSettings();
            // componentManager.editInstance.render(setting);

            return {
                id: componentIds.propertyView,
                view: "label",
                label: "no properties yet."
            };
        };



        /**
         * @function editStop
         *
         * This method is called before .saveSetting().  It is for making
         * sure any field in your property editor is no longer in an edit mode 
         * before you try to read from them.
         *
         * (if they are in edit mode, then you wont get the updated value)
         *
         * @param {object} componentManager
         * @return {json} 
         */
        // tabComponent.editStop = function () {
        //     if ($$(componentIds.propertyView))
        //         $$(componentIds.propertyView).editStop();
        // };


        return tabComponent;
    }
);