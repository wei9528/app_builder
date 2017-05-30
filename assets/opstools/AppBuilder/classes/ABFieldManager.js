/* 
 * ABFieldManager
 * 
 * An interface for managing the different ABFields available in our AppBuilder.
 *
 */


import ABFieldString from "./dataFields/ABFieldString"
import ABFieldNumber from "./dataFields/ABFieldNumber"
import ABFieldDate from "./dataFields/ABFieldDate"
import ABFieldBoolean from "./dataFields/ABFieldBoolean"
import ABFieldList from "./dataFields/ABFieldList"


import ABFieldImage from "./dataFields/ABFieldImage"

/* 
 * Fields
 * A name => ABField  hash of the different ABFields available.
 */
var Fields = {};
Fields[ABFieldString.defaults().key] = ABFieldString;
Fields[ABFieldNumber.defaults().key] = ABFieldNumber;
Fields[ABFieldDate.defaults().key] = ABFieldDate;
Fields[ABFieldBoolean.defaults().key] = ABFieldBoolean;
Fields[ABFieldList.defaults().key] = ABFieldList;


Fields[ABFieldImage.defaults().key] = ABFieldImage;



export default  {


	/*
	 * @function allFields
	 * return all the currently defined ABFields in an array.
	 * @return [{ABField},...]
	 */
	allFields: function() {
		var fields = [];
		for (var f in Fields) {
			fields.push(Fields[f]);
		}
		return fields;
	},


	/*
	 * @function newField
	 * return an instance of an ABField based upon the values.type value.
	 * @return {ABField}
	 */
	newField: function (values, object) {

		if (values.key) {
			return new Fields[values.key](values, object);
		} else {

//// TODO: what to do here?
		}

	}


}
