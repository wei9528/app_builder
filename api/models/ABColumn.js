/**
 * ABColumn.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var async = require('async'),
    _ = require('lodash'),
    AD = require('ad-utils'),
    fs = require('fs'),
    path = require('path');

// This will be populated from the exported `defaults` properties of .js files
// found in /api/services/data_fields
var typeDefaults = {
    /*
        number: {
            type: 'integer',
            fieldName: 'number',
            setting: {
                icon: 'slack',
                editor: 'number',
                filter_type: 'number',
                format: 'numberFormat'
            }
        },
        string: {...},
        boolean: {...},
        ...
    */
};

var pathToFieldFiles = path.join(process.cwd(), 'api', 'services', 'data_fields');
var fieldFiles = fs.readdirSync(pathToFieldFiles);
fieldFiles.forEach(function (fieldFile) {
    var match = fieldFile.match(/^(\w+)\.js$/);
    if (match) {
        var name = match[1];
        var def = require(path.join(pathToFieldFiles, fieldFile));
        typeDefaults[name] = def.defaults;
    }
});


module.exports = {

    tableName: 'appbuilder_column',


    connection: 'appdev_default',
    migrate: 'alter',

    attributes: {

        // object: { model: 'ABObject' },

        name: {
            type: 'string',
            required: true
            //maxLength: 20 // <-- some exceptions
        },

        fieldName: {
            type: 'string',
            required: true
        },

        type: {
            type: 'string',
            required: true
        },

        weight: {
            type: 'integer',
            required: false
        },

        width: {
            type: 'integer',
            required: false
        },

        required: { type: 'boolean' },

        unique: { type: 'boolean' },

        setting: { type: 'json' },



        //// Multilingual Definitions

        // this will pull in the translations using .populate('translations')
        translations: {
            collection: 'ABColumnTrans',
            via: 'abcolumn'
        },

        translate: function (code) {
            return ADCore.model.translate({
                model: this,         // this instance of a Model
                code: code,          // the language code of the translation to use.
                ignore: ['abcolumn']     // don't include this field when translating
            });
        },

        _Klass: function () {
            return ABColumn;
        },

        isSynced: { type: 'boolean' }


    },

    ////
    // Lifecycle callbacks
    ////

    beforeValidate: function (values, cb) {
        if (values.setting && values.setting.isImported) {
            // `isImported` means the name length can exceed the normal limit.
        } 
        // If not imported, the name length must not be more than 20 characters
        else if (values.name && values.name.length > 20) {
            return cb(new Error(`Column name "${values.name}" is too long`));
        }
        
        for (var key in values) {
            if (values[key] == null || typeof values[key] == 'undefined' || values[key] != values[key] /* NaN */)
                delete values[key];
            else if (values[key] === '')
                values[key] = null;
        }

        cb();
    },

    beforeCreate: function (values, cb) {
        if (values.name)
            values.name = values.name.replace(/ /g, '_');

        if (values.weight == null) {
            // Set weight
            ABColumn.count({ object: values.object }).exec(function (err, found) {
                values.weight = found + 1;
                cb();
            });
        }
        else {
            cb();
        }

    },

    beforeUpdate: function (values, cb) {
        if (values.name)
            values.name = values.name.replace(/ /g, '_');

        cb();
    },

    afterDestroy: function (destroyedColumns, cb) {
        var ids = _.map(destroyedColumns, 'id'),
            connectCols = _.filter(destroyedColumns, function (col) {
                if (col.fieldName == 'connectObject' && col.setting) {
                    var colSetting = JSON.parse(col.setting);
                    if (colSetting.linkVia != null)
                        return true;
                    else
                        return false;
                }
                else {
                    return false;
                }
            }),
            connectedColIds = _.map(connectCols, function (col) {
                var colSetting = JSON.parse(col.setting);
                return colSetting.linkVia;
            });

        if (ids && ids.length) {
            async.parallel([
                // Delete column translations
                function (callback) {
                    ABColumnTrans.destroy({ abcolumn: ids })
                        .then(function () {
                            callback();
                        }, callback);
                },
                // Delete select list options
                function (callback) {
                    ABList.destroy({ column: ids })
                        .then(function () {
                            callback();
                        }, callback);
                },
                // Remove linked column
                function (callback) {
                    if (connectedColIds && connectedColIds.length > 0) {
                        ABColumn.destroy({ id: connectedColIds })
                            .then(function () {
                                callback();
                            }, callback);
                    }
                    else {
                        callback();
                    }
                }
            ], cb);
        }
        else {
            cb();
        }

    },


    ////
    // Model class methods
    ////
    
    
    /**
     * Get the list of supported AB column types.
     *
     * @return {Array}
     */
    getValidTypes: function() {
        return Object.keys(typeDefaults);
    },

    /**
     * Create an AppBuilder column entry. This is separate from building the
     * generated app's model.
     *
     * Examples:
     *     ABColumn.createColumn('number', { name: 'Population', object: 10 })
     *     ABColumn.createColumn('number', { name: 'Price', object: 123, type: 'float', language_code: 'en' })
     *     ABColumn.createColumn('string', { 
     *         name: 'Hello', 
     *         object: 11, 
     *         language_code: 'zh-hans', 
     *         label: '你好'
     *     })
     *     ABColumn.createColumn('text', { name: 'Description', object: 123 })
     *     ABColumn.createColumn('list', {
     *         name: 'Toppings',
     *         object: 123,
     *         weight: 3,
     *         setting: {
     *             options: [
     *                 {dataId: 46, id: "Crushed peanuts"},
     *                 {dataId: 47, id: "Pickled chili peppers"},
     *                 {dataId: 48, id: "Ketchup"}
     *             ]
     *         }
     *     })
     *
     * @param {string} type
     *     One of the following: 
     *         boolean, date, number, list, string, text,
     *         attachment, image.
     *
     *     Default values for `data` will be populated based on this. 
     *     See /api/services/data_fields/*.js
     *
     *     Note that this `type` parameter is different from `data.type` or
     *     `data.fieldName` in some situations. For instance, a float number
     *     field is a 'number' type, with and added '{type: float}' property
     *     in `data`.
     *
     *     For connections to other objects, use ABColumn.createLink() instead.
     *
     * @param {object} data
     * @param {string} data.name
     *     The name of the column. Required.
     * @param {integer} data.object
     *     The primary key ID of the ABObject that this column belongs to.
     *     Required.
     * @param {string} [data.language_code]
     *     Optional language code of the current language.
     *     The `data.name` value will be copied to the column label in the 
     *     current language. A language code prefix will be added to all other 
     *     language labels.
     * @param {string} [data.label]
     *     Optional column label to use instead of just copying the column name.
     * @param {string} [data.type]
     *     Optional. If you want to override the default for some reason.
     *     Such as specifying a 'float' type for a number field.
     * @param {string} [data.fieldName]
     *     Optional. If you want to override the default for some reason.
     * @param {integer} [data.weight]
     *     Optional. Default is to put the column at the bottom.
     * @param {string/object} [data.setting]
     *     Stringified JSON, or JSON basic object.
     * @return Deferred
     *     Resolves with the new column's data.
     */
    createColumn: function (type, data) {
        var dfd = AD.sal.Deferred();

        var defaultData = typeDefaults[type] || {};

        var columnData = data || {};
        _.defaults(data, {
            type: defaultData.type,
            fieldName: defaultData.fieldName,
            setting: {}
        });
        _.defaults(columnData.setting, defaultData.setting);

        var obj,
            column;

        async.series([
            // Preliminary checks
            function (next) {
                if (!typeDefaults[type]) return next(new Error('Type is not recognized: ' + type));
                if (!columnData.object) return next(new Error('data.object is required'));
                if (!columnData.name) return next(new Error('data.name is required'));
                next();
            },

            // Check ABObject
            function (next) {
                ABObject.find({ id: columnData.object })
                    .exec(function (err, list) {
                        if (err) next(err);
                        else if (!list || !list[0]) next(new Error('Object not found: ' + columnData.object));
                        else {
                            obj = list[0];
                            next();
                        }
                    });
            },

            // Determine column weight if needed
            function (next) {
                if (typeof columnData.weight == 'number') return next();
                ABColumn.count({ object: columnData.object })
                    .exec(function (err, found) {
                        if (err) next(err);
                        else {
                            // Put the new column at the end
                            columnData.weight = found;
                            next();
                        }
                    });
            },

            // The `setting` field needs to have the app name for some reason
            function (next) {
                // Skip if app name is already given
                if (columnData.setting.appName) return next();

                ABApplication.find({ id: obj.application })
                    .exec(function (err, list) {
                        if (err) next(err);
                        else if (!list || !list[0]) {
                            next(new Error('Application not found: ' + appID));
                        }
                        else {
                            columnData.setting.appName = list[0].name;
                            next();
                        }
                    });
            },

            // Create column entry & multilingual labels
            function (next) {

                columnData.label = columnData.label || columnData.name;
                Multilingual.model.create({
                    model: ABColumn,
                    data: columnData
                })
                    .fail(next)
                    .done(function (newColumn) {
                        column = newColumn;
                        next();
                    });
            }

        ], function (err) {
            if (err) dfd.reject(err);
            dfd.resolve(column);
        });

        return dfd;
    },


    /**
     * Create a connection column, together with the optional return connection
     * column.
     * It is possible for both the source and target to be same object.
     *
     * Example:
     *
     * ABColumn.createLink({
     *     name: 'MyLinkName',
     *     sourceObjectID: 5,
     *     targetObjectID: 7,
     *     sourceRelation: 'one',
     *     targetRelation: 'many',
     *     language_code: 'zh-hans'
     * }).then( ... )
     *
     * @param {object} data
     * @param {string} data.name
     * @param {string} [data.targetName]
     *     If not given, then `data.name` + 'Link' will be used.
     * @param {integer} data.sourceObjectID
     *     The primary key value of the object containing the column.
     * @param {integer} data.targetObjectID
     *     The primary key value of the object being linked to.
     * @param {string} data.sourceRelation
     *     Either "one" or "many".
     *     If omitted, then the retun connection column will not be created.
     * @param {string} data.targetRelation
     *     Either "one" or "many". Required.
     * @param {string} [data.language_code]
     * @return Deferred
     *     Resolves with (sourceObjectColumn, targetObjectColumn)
     */
    createLink: function (data) {
        var dfd = AD.sal.Deferred();

        var sourceSetting = {
            linkObject: data.targetObjectID,
        };
        var targetSetting = {
            linkObject: data.sourceObjectID,
        };
        if (data.sourceRelation != 'many') {
            sourceSetting.linkType = 'model';
            targetSetting.linkViaType = 'model';
        } else {
            sourceSetting.linkType = 'collection';
            targetSetting.linkViaType = 'collection';
        }
        if (data.targetRelation != 'many') {
            targetSetting.linkType = 'model';
            sourceSetting.linkViaType = 'model';
        } else {
            targetSetting.linkType = 'collection';
            sourceSetting.linkViaType = 'collection';
        }

        var sourceObject, targetObject;
        var sourceColumn, targetColumn;

        async.series([
            // Preliminary checks
            function (next) {
                var msg = null;
                [
                    'name', 'sourceObjectID', 'targetObjectID', 'targetRelation'
                ].forEach(function (paramName) {
                    if (!data[paramName]) msg = `data.${paramName} is required`;
                });

                if (msg) next(new Error(msg));
                else next();
            },

            // Find source object
            function (next) {
                ABObject.findOne({ id: data.sourceObjectID })
                    .populate('application')
                    .populate('translations')
                    .then(function (srcObj) {
                        sourceObject = srcObj;

                        next();
                    }, next);
            },

            // Find target object
            function (next) {
                ABObject.findOne({ id: data.targetObjectID })
                    .populate('application')
                    .populate('translations')
                    .then(function (trgObj) {
                        targetObject = trgObj;

                        next();
                    }, next);
            },

            // Set default of target link column
            function (next) {
                if (data.targetName == null) {
                    var srcObjTrans = sourceObject.translations.filter(function (trans) { return trans.language_code == 'en'; })[0];

                    if (srcObjTrans == null) {
                        data.targetName = data.name + ' Link';
                    }
                    else {
                        data.targetName = srcObjTrans.label
                    }
                }

                next();
            },

            function (next) {
                data.label = data.name;
                data.targetLabel = data.targetName;

                // Validate M:N table name should not more than 64 characters
                // M:N table name format: ab_APPNAME_OBJNAME_COLNAME__ab_APPNAME_OBJNAME_COLNAME
                if (sourceSetting.linkType == 'collection' && targetSetting.linkType == 'collection') {

                    if ((sourceObject.application.name + sourceObject.name + data.name).length + 6 > 32) {
                        data.name = data.name.substring(0, (32 - ((sourceObject.application.name + sourceObject.name).length + 5)));
                    }

                    if ((targetObject.application.name + targetObject.name + data.targetName).length + 6 > 32) {
                        data.targetName = data.targetName.substring(0, (32 - ((targetObject.application.name + targetObject.name).length + 5)));
                    }

                    // TODO : Check duplicate column names

                    next();
                }
                else {
                    next();
                }
            },

            // Create source connection column
            function (next) {
                ABColumn.createColumn('connectObject', {
                    name: data.name,
                    label: data.label,
                    object: data.sourceObjectID,
                    language_code: data.language_code,
                    setting: sourceSetting,
                    isSynced: data.isSynced || false
                })
                    .fail(next)
                    .done(function (col) {
                        sourceColumn = col;
                        sourceSetting = col.setting;

                        // This will be created in the next step
                        targetSetting.linkVia = col.id;

                        next();
                    });
            },

            // Create target connection column
            function (next) {
                // Skip if the source relation was not given.
                if (!data.sourceRelation) return next();

                ABColumn.createColumn('connectObject', {
                    name: data.targetName,
                    label: data.targetLabel,
                    object: data.targetObjectID,
                    language_code: data.language_code,
                    setting: targetSetting,
                    isSynced: data.isSynced || false
                })
                    .fail(next)
                    .done(function (col) {
                        targetColumn = col;

                        // This will be updated in the next step
                        sourceSetting.linkVia = col.id;

                        next();
                    });
            },

            // Update the source connection column that was just created earlier
            function (next) {
                // Skip this step if not needed
                if (!sourceSetting.linkVia) return next();

                ABColumn.update(sourceColumn.id, { setting: sourceSetting })
                    .exec(function (err, col) {
                        if (err) next(err);
                        else {
                            sourceColumn = col[0];
                            next();
                        }
                    });
            },

        ], function (err) {
            if (err) dfd.reject(err);
            else dfd.resolve(sourceColumn, targetColumn);
        });

        return dfd;
    },


};