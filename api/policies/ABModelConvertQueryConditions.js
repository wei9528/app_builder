/**
 * ABModelConvertQueryConditions
 * 
 * @module      :: Policy
 * @description :: Scan any provided conditions to see if we have a 'in_query' 
 *                 or 'not_in_query' clause.  If we do, convert it to an IN or NOT IN
 *                 clause.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

var url = require('url');
var AD = require('ad-utils');
var _ = require('lodash');


module.exports = function(req, res, next) {
    

    // our QB Conditions look like:
    // {
    //   "glue": "and",
    //   "rules": [{
    //     "key": "name_first",
    //     "rule": "begins_with",
    //     "value": "a"
    //   }, {
    //     "key": "name_family",
    //     "rule": "begins_with",
    //     "value": "a"
    //   }, {
    //     "glue": "or",
    //     "rules": [{
    //       "glue": "and",
    //       "rules": [{
    //         "key": "name_first",
    //         "rule": "not_begins_with",
    //         "value": "Apple"
    //       }, {
    //         "key": "name_family",
    //         "rule": "not_contains",
    //         "value": "Pie"
    //       }]
    //     }, {
    //       "glue": "and",
    //       "rules": [{
    //         "key": "name_first",
    //         "rule": "ends_with",
    //         "value": "Crumble"
    //       }, {
    //         "key": "name_family",
    //         "rule": "equal",
    //         "value": "Goodness"
    //       }]
    //     }]
    //   }]
    // }  
    //
    //   


    // move along if no or empty where clause
    if (_.isEmpty(req.options._where)) {
        next();
        return;
    }


    parseQueryCondition(req.options._where, null, req, res, (err) => {
        next(err);
    })
 

};


function findQueryEntry(_where) {

    if (_where.rules) {

        var entry = null;
        for(var i=0; i < _where.rules.length; i++) {
            entry = findQueryEntry(_where.rules[i]);
            if (entry) {
                return entry;
                break;
            }
        }
        return entry;

    } else {

        if ((_where.rule == 'in_query') || (_where.rule == 'not_in_query')) {
            return _where;
        } else {
            return null;
        }
    }
}



function parseQueryCondition(_where, object, req, res, cb) {

    var cond = findQueryEntry(_where);
    if (!cond) {
        cb();
    } else {

        // the first time we find a cond to process, we then
        // lookup the object for this route:
        if (!object) {
            AppBuilder.routes.verifyAndReturnObject(req, res)
                .then(function (obj) {
                    object = obj;

                    // try again with an object now:
                    parseQueryCondition(_where, object, req, res, cb);
                })
                .catch((err)=>{
                    ADCore.error.log('AppBuilder:Policy:ABModelConvertQueryConditions:error finding object for this route:', {error:err});
                    
                    // exit with error:
                    cb(err);
                });

        } else {

            // make sure we find our QueryObject
            var QueryObj = object.application.queries((q)=>{ return q.id == cond.value; })[0];
            if (!QueryObj) {

                ADCore.error.log('AppBuilder:Policy:ABModelConvertQueryConditions:Could not find specified query object:', { qid:cond.value, condition:cond });
                    
                var err = new Error('Unknown Query ID in condition.');
                err.condition = cond;
                cb(err);

            } else {


                var queryColumn;               
                    // {string} this is the 'tablename'.'colname' of the data to return

                var newKey = cond.key;         
                    // {string} this is the colName of the condition statement we want to pass
                    // on.  So for instance, if the condition we received was the 'this_object',
                    // filter, then we want the final condition to be:  id IN [],  and the 
                    // QB condition would be:  { key:'id', rule:'in', value:[] }.  So newKey == 'id'

                var parseColumn = cond.key;
                    // {string} this is the column we want our reference query to return so we can
                    // pull out the data for this filter condition.  So for example, the current query
                    // is returning userid and subaccount.id.  However our filter is filtering on
                    // subaccount.accountNum.  So we need to pull our 'accountNum' from the query.


                // if this is our special 'this_object' 'in_query'  queryID  filter:
                if (cond.key == 'this_object') {

                    queryColumn = object.dbTableName()+'.id';
                    newKey = 'id';  // the final filter needs to be 'id IN []', so 'id'
                    parseColumn = 'id';  // make sure we pull our 'id' values from the query

                    continueSingle(newKey, parseColumn, queryColumn);

                } else {
                    // this is a linkField IN QUERY filter:


                    // find field by it's name
                    var field = object.fields((f)=>{return f.columnName == cond.key;})[0];
                    if (!field) {

                        // ok, maybe we passed in a field.id:
                        field = object.fields((f)=>{return f.id == cond.key;})[0];
                        if (!field) {
console.error('!! field not found:', cond.key );
/// THIS IS AN ERROR!
                        }
                    }

                    // if get the field's linked object and see if it can be filtered:
                    var linkedObject = field.datasourceLink;
                    if (!QueryObj.canFilterObject(linkedObject)) {
console.error('!! linkedObject not filterable by Query:', cond.key );
//// THIS IS AN ERROR!!
                    } else {

                        // get the linked field:
                        var linkedField = field.fieldLink();

                        
                        

                        var linkCase = field.linkType()+':'+field.linkViaType();

                         switch(linkCase.toLowerCase()) {
//// LEFT OFF HERE:
// think through the different cases for compiling the link

    
                            case 'one:one':
                            case 'one:many':
                                
                                // this field is used in final filter condition
                                newKey = field.columnName;

                                // I need to pull out the PK from the filter Query:
                                parseColumn = 'id';

                                // make this the queryColumn:
                                queryColumn = linkedObject.dbTableName()+'.'+parseColumn;   
                                continueSingle(newKey, parseColumn, queryColumn);                             
                                break;


                            case 'many:one':
                                // they contain my .PK

                                // my .PK is what is used on our filter
                                newKey = 'id';

                                // I need to pull out the linkedField's columnName
                                parseColumn = linkedField.columnName;

                                // make this the queryColumn:
                                queryColumn = linkedObject.dbTableName()+'.'+parseColumn;  
                                continueSingle(newKey, parseColumn, queryColumn);                              
                                break;


                            case 'many:many':

                                // we need the .PK of our linked column out of the given query
                                parseColumn = 'id';  // linkedObject.PK()
                                queryColumn = linkedObject.dbTableName()+'.'+parseColumn;

                                processQueryValues(parseColumn,  queryColumn,  (err, ids) => {

                                    if (err) {
                                        cb(err);
                                        return;
                                    }

                                    // then we need to get which of our PK is stored in the linkTable for those linked entries
                                    var linkTableQuery = ABMigration.connection().queryBuilder();
                                    var joinTableName = field.joinTableName();

                                    var parseName = object.name;
                                    linkTableQuery.select(parseName)
                                        .from(joinTableName)
                                        .where(linkedObject.name, 'IN', ids)
                                        .then((data)=>{

                                            var myIds = data.map((d)=>{ return d[parseName] });

                                            var myPK = 'id';  // object.PK();
                                            buildCondition( myPK, myIds);

                                        })
                                        .catch((err) => {
                                            cb(err);
                                        })

                                });
                                break;
                         }


                    }

                }


                // buildCondition
                // final step of recreating the condition into the 
                // proper Field IN []  format;
                function buildCondition(newKey, ids) {
// convert cond into an IN or NOT IN
                    cond.key = newKey;
                    var convert = {
                        'in_query' : 'in',
                        'not_in_query' : 'not_in'
                    }
                    cond.rule = convert[cond.rule];
                    cond.value = ids;

console.log('.... new Condition:', cond);


                    // final step, so parse another condition:
                    parseQueryCondition(_where, object, req, res, cb);
                
                }


                // processQueryValues
                // this step runs the specified Query and pulls out an array of
                // ids that can be used for filtering.
                // @param {string} parseColumn  the name of the column of data to pull from the Query
                // @param {string} queryColumn  [table].[column] format of the data to pull from Query
                // @param {fn} done  a callback routine  done(err, data);
                function processQueryValues(parseColumn,  queryColumn,  done) {

                    var query = QueryObj.queryFind({}, req.user.data);
                    query.clearSelect().columns(queryColumn);
    console.log();
    console.log('converted query sql:', query.toSQL());

                    query
                        .then((data)=>{
    console.log('.... query data : ', data);
                            var ids = data.map((d)=>{ return d[parseColumn] });


                            done(null, ids);
                            // buildCondition(newKey, ids);

                        })
                        .catch((err)=>{
                            ADCore.error.log('AppBuilder:Policy:ABModelConvertQueryConditions:Error running query:', { error:err });
                            done(err);
                        })
                }


                // continueSingle
                // in 3 of our 4 cases we only need to run a single Query to 
                // finish our conversion.
                function continueSingle(newKey, parseColumn, queryColumn) {

                    processQueryValues(parseColumn, queryColumn, (err, ids)=>{

                        if (err) {
                            cb(err);
                        } else {
                            buildCondition(newKey, ids)
                        }

                    });

                }


            } // if !QueryObj

        } // if !object

    } // if !cond
}
