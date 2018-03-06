//
// ABViewRuleListFormRecordRules
//
// A component that is responsible for displaying the specific list of Record
// Rules for a form.
//
import ABViewRuleList from "./ABViewRuleList"
import ABViewRule from "./ABViewRule"

import RoleUpdateExisting from "./ruleActions/ABViewRuleActionFormRecordRuleUpdate"
import RoleInsertConnected from "./ruleActions/ABViewRuleActionFormRecordRuleInsertConnected"
import RoleUpdateConnected from "./ruleActions/ABViewRuleActionFormRecordRuleUpdateConnected"

export default class ABViewRuleListFormRecordRules extends ABViewRuleList {

	/**
	 * @param {object} App 
	 *      ?what is this?
	 * @param {string} idBase
	 *      Identifier for this component
	 */
	constructor() {

		var settings = {
			labels: {
				header: "ab.component.form.recordRule", 
				headerDefault: "*Record Rules"
			}
		}
		super(settings);
		var L = this.Label;

	}


	// must return the actual Rule object.
	getRule () {

		var listActions = [
			new RoleUpdateExisting(this.App, this.idBase+'_ruleActionUpdate', this.currentForm),
			new RoleInsertConnected(this.App, this.idBase+'_ruleActionInsert', this.currentForm),
			new RoleUpdateConnected(this.App, this.idBase+'_ruleActionUpdateConnected', this.currentForm)
		]

		var Rule = new ABViewRule(listActions);
		if (this.currentObject) {
			Rule.objectLoad(this.currentObject);
		}
		return Rule;
	}

}