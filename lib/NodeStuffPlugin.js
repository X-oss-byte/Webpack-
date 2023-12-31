/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var path = require("path");
var ModuleAliasPlugin = require("enhanced-resolve/lib/ModuleAliasPlugin");
var ModuleParserHelpers = require("./ModuleParserHelpers");
var ConstDependency = require("./dependencies/ConstDependency");
var BasicEvaluatedExpression = require("./BasicEvaluatedExpression");

function NodeStuffPlugin(options, context) {
	this.options = options;
	this.context = context;
}
module.exports = NodeStuffPlugin;
NodeStuffPlugin.prototype.apply = function(compiler) {
	function ignore() { return true; }
	var context = this.context;
	if(this.options.__filename == "mock") {
		compiler.parser.plugin("expression __filename", function(expr) {
			this.state.current.addVariable("__filename", JSON.stringify("/index.js"));
			return true;
		});
	} else if(this.options.__filename) {
		compiler.parser.plugin("expression __filename", function(expr) {
			this.state.current.addVariable("__filename", JSON.stringify(
				path.relative(context, this.state.module.resource)
			));
			return true;
		});
	}
	compiler.parser.plugin("evaluate Identifier __filename", function(expr) {
		if(!this.state.module) return;
		var res = new BasicEvaluatedExpression();
		res.setString(this.state.module.splitQuery(this.state.module.resource)[0]);
		res.setRange(expr.range);
		return res;
	});
	if(this.options.__dirname == "mock") {
		compiler.parser.plugin("expression __dirname", function(expr) {
			this.state.current.addVariable("__dirname", JSON.stringify("/"));
			return true;
		});
	} else if(this.options.__dirname) {
		compiler.parser.plugin("expression __dirname", function(expr) {
			this.state.current.addVariable("__dirname", JSON.stringify(
				path.relative(context, this.state.module.context)
			));
			return true;
		});
	}
	compiler.parser.plugin("evaluate Identifier __dirname", function(expr) {
		if(!this.state.module) return;
		var res = new BasicEvaluatedExpression();
		res.setString(this.state.module.context);
		res.setRange(expr.range);
		return res;
	});
	compiler.parser.plugin("expression require.main", function(expr) {
		var dep = new ConstDependency("require.cache[0]", expr.range);
		dep.loc = expr.loc;
		this.state.current.addDependency(dep);
		return true;
	});
	compiler.parser.plugin("expression module.exports", ignore);
	compiler.parser.plugin("expression module.loaded", ignore);
	compiler.parser.plugin("expression module.id", ignore);
	compiler.parser.plugin("expression module", function(expr) {
		return ModuleParserHelpers.addParsedVariable(this, "module", "require(" + JSON.stringify(path.join(__dirname, "..", "buildin", "module.js")) + ")(module)");
	});
};