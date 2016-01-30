var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var esprima = require('esprima');
var ElasticTerminalFilter = (function () {
    function ElasticTerminalFilter(parent) {
        this.localParent = parent;
        if (parent) {
            parent.children.push(this);
        }
    }
    ElasticTerminalFilter.prototype.back = function () {
        return this.localParent;
    };
    ElasticTerminalFilter.prototype.cast = function () {
        return this;
    };
    ElasticTerminalFilter.prototype.compose = function () {
        throw new Error("Base compose should not be called");
    };
    ElasticTerminalFilter.prototype.toJson = function () {
        return JSON.stringify(this.compose());
    };
    ElasticTerminalFilter.prototype.execute = function () {
        return this.getSearchRoot().execute();
    };
    ElasticTerminalFilter.prototype.getSearchRoot = function () {
        if (!this.localParent || !this.localParent.searchRoot) {
            throw new Error("Parent not found");
        }
        return this.localParent.searchRoot;
    };
    return ElasticTerminalFilter;
})();
var ElasticFilter = (function (_super) {
    __extends(ElasticFilter, _super);
    function ElasticFilter(parent) {
        _super.call(this, parent);
        this.siblings = [];
        this.children = [];
        this.parent = parent;
        if (parent) {
            this.searchRoot = parent.searchRoot;
        }
    }
    ElasticFilter.prototype.nested = function (field, nestFn) {
        var prop = PropertyVisitor.getProperty(field.toString());
        var nested = new ElasticNestedFilter(prop, this);
        nestFn(nested);
        return this;
    };
    ElasticFilter.prototype.wrap = function () {
        return new ElasticFilter(this);
    };
    ElasticFilter.prototype.and = function () {
        var andFilter = new ElasticAndFilter(this);
        return andFilter;
    };
    ElasticFilter.prototype.or = function () {
        var orFilter = new ElasticOrFilter(this);
        return orFilter;
    };
    ElasticFilter.prototype.bool = function () {
        return new ElasticBoolFilter(this);
    };
    ElasticFilter.prototype.exists = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        return new ElasticRawFilter({ "exists": { "field": prop } }, this);
    };
    ElasticFilter.prototype.ids = function (idList) {
        return new ElasticRawFilter({ "values": idList }, this);
    };
    ElasticFilter.prototype.limit = function (amount) { return new ElasticRawFilter({ "value": amount }, this); };
    ElasticFilter.prototype.matchAll = function () { return new ElasticRawFilter({ "match_all": "" }, this); };
    ElasticFilter.prototype.missing = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        return new ElasticRawFilter({ "missing": { "field": prop } }, this);
    };
    ElasticFilter.prototype.not = function () {
        return new ElasticDirectComposited(function (d) {
            return { "not": d.composeChild() };
        }, this);
    };
    ElasticFilter.prototype.prefix = function (field, prefix) {
        var prop = PropertyVisitor.getProperty(field.toString());
        var filter = { "prefix": {} };
        filter["prefix"][prop] = prefix;
        return new ElasticRawFilter(filter, this);
    };
    ElasticFilter.prototype.query = function (cache) { throw new Error("Not implemented"); };
    ElasticFilter.prototype.lte = function (field, lte) {
        return this.range(field, lte);
    };
    ElasticFilter.prototype.lt = function (field, lt) {
        return this.range(field, null, lt);
    };
    ElasticFilter.prototype.gt = function (field, gt) {
        return this.range(field, null, null, null, gt);
    };
    ElasticFilter.prototype.gte = function (field, gte) {
        return this.range(field, null, null, gte);
    };
    ElasticFilter.prototype.range = function (field, lte, lt, gte, gt) {
        var prop = PropertyVisitor.getProperty(field.toString());
        var range = {};
        if (lte) {
            range["lte"] = lte;
        }
        if (lt) {
            range["lt"] = lt;
        }
        if (gte) {
            range["gte"] = gte;
        }
        if (gt) {
            range["gt"] = gt;
        }
        var f = {};
        f[prop] = range;
        var filter = { "range": f };
        return new ElasticRawFilter(filter, this);
    };
    ElasticFilter.prototype.regExp = function (field, regex) {
        var prop = PropertyVisitor.getProperty(field.toString());
        var filter = { "regexp": {} };
        filter["regexp"][prop] = regex;
        return new ElasticRawFilter(filter, this);
    };
    ElasticFilter.prototype.term = function (field, term) {
        var prop = PropertyVisitor.getProperty(field.toString());
        var filter = { "term": {} };
        filter["term"][prop] = term;
        return new ElasticRawFilter(filter, this);
    };
    ElasticFilter.prototype.terms = function (field, terms) {
        var prop = PropertyVisitor.getProperty(field.toString());
        var filter = { "terms": {} };
        filter["terms"][prop] = terms;
        return new ElasticRawFilter(filter, this);
    };
    ElasticFilter.prototype.raw = function (obj) {
        return new ElasticRawFilter(obj, this);
    };
    ElasticFilter.prototype.eq = function (field, val) {
        return this.term(field, val);
    };
    ElasticFilter.prototype.compose = function () {
        return this.composeChild();
    };
    ElasticFilter.prototype.composeChildren = function () {
        return this.children.map(function (d) { return d.compose(); });
    };
    ElasticFilter.prototype.composeChild = function () {
        if (this.children.length > 1) {
            throw new Error("Unexpected too many children");
        }
        else if (this.children.length === 1) {
            return this.children[0].compose();
        }
        return {};
    };
    return ElasticFilter;
})(ElasticTerminalFilter);
var ElasticNestedFilter = (function (_super) {
    __extends(ElasticNestedFilter, _super);
    function ElasticNestedFilter(path, parent) {
        _super.call(this, parent);
        this.path = path;
    }
    ElasticNestedFilter.prototype.compose = function () {
        var result = {};
        result["path"] = this.path;
        result["filter"] = _super.prototype.compose.call(this);
        return { "nested": result };
    };
    return ElasticNestedFilter;
})(ElasticFilter);
var ElasticRootedFilter = (function (_super) {
    __extends(ElasticRootedFilter, _super);
    function ElasticRootedFilter(parent, root) {
        _super.call(this, parent);
        this.root = root;
    }
    return ElasticRootedFilter;
})(ElasticFilter);
var ElasticBoolFilter = (function (_super) {
    __extends(ElasticBoolFilter, _super);
    function ElasticBoolFilter(parent, root) {
        _super.call(this, parent, root);
        if (root) {
            this.mustFilter = root.mustFilter;
            this.mustNotFilter = root.mustNotFilter;
            this.shouldFilter = root.shouldFilter;
            this.root = root;
        }
        else {
            this.mustFilter = new ElasticBoolFilter(this, this);
            this.mustNotFilter = new ElasticBoolFilter(this, this);
            this.shouldFilter = new ElasticBoolFilter(this, this);
            this.root = this;
        }
    }
    ElasticBoolFilter.prototype.must = function (fn) {
        var filter = new ElasticFilter(this.root.mustFilter);
        fn(filter);
        return this.root.mustFilter;
    };
    ElasticBoolFilter.prototype.mustnot = function (fn) {
        var filter = new ElasticFilter(this.root.mustNotFilter);
        fn(filter);
        return this.root.mustNotFilter;
    };
    ElasticBoolFilter.prototype.should = function (fn) {
        var filter = new ElasticFilter(this.root.shouldFilter);
        fn(filter);
        return this.root.shouldFilter;
    };
    ElasticBoolFilter.prototype.compose = function () {
        if (this.root === this) {
            var result = {};
            if (this.mustFilter.children.length > 0) {
                this.checkSingleChild(this.mustFilter);
                result["must"] = this.mustFilter.children[0].compose();
            }
            if (this.mustNotFilter.children.length > 0) {
                this.checkSingleChild(this.mustNotFilter);
                result["must_not"] = this.mustNotFilter.children[0].compose();
            }
            if (this.shouldFilter.children.length > 0) {
                this.checkSingleChild(this.shouldFilter);
                result["should"] = this.shouldFilter.children[0].compose();
            }
            return { 'bool': result };
        }
        throw new Error("Only root 'bool' filter is composable");
    };
    ElasticBoolFilter.prototype.checkSingleChild = function (filter) {
        if (filter.children.length > 1) {
            throw new Error("Filter should have at most one child");
        }
    };
    return ElasticBoolFilter;
})(ElasticRootedFilter);
var ElasticAndFilter = (function (_super) {
    __extends(ElasticAndFilter, _super);
    function ElasticAndFilter(parent) {
        _super.call(this, parent);
    }
    ElasticAndFilter.prototype.compose = function () {
        var conditions = [];
        this.children.forEach(function (child) {
            if (child instanceof ElasticAndFilter) {
                var composed = child.compose();
                composed.and.forEach(function (d) { return conditions.push(d); });
            }
            else {
                conditions.push(child.compose());
            }
        });
        return {
            "and": conditions
        };
    };
    return ElasticAndFilter;
})(ElasticFilter);
var ElasticOrFilter = (function (_super) {
    __extends(ElasticOrFilter, _super);
    function ElasticOrFilter(parent, root) {
        _super.call(this, parent);
    }
    ElasticOrFilter.prototype.compose = function () {
        var conditions = [];
        this.children.forEach(function (child) {
            if (child instanceof ElasticOrFilter) {
                var composed = child.compose();
                composed.or.map(function (d) { return conditions.push(d); });
            }
            else {
                conditions.push(child.compose());
            }
        });
        return {
            "or": conditions
        };
    };
    return ElasticOrFilter;
})(ElasticFilter);
var ElasticRawFilter = (function (_super) {
    __extends(ElasticRawFilter, _super);
    function ElasticRawFilter(rawJson, parent) {
        _super.call(this, parent);
        this.rawObject = rawJson;
    }
    ElasticRawFilter.prototype.compose = function () {
        return this.rawObject;
    };
    return ElasticRawFilter;
})(ElasticTerminalFilter);
var ElasticAggregateResult = (function () {
    function ElasticAggregateResult(name) {
        this.name = name;
    }
    ElasticAggregateResult.prototype.read = function (result) {
        return result.aggregations[this.name];
    };
    return ElasticAggregateResult;
})();
var ElasticAggregation = (function () {
    function ElasticAggregation(name) {
        this.children = new Map();
        this.aggObject = {};
        this.name = name;
    }
    ElasticAggregation.prototype.subAggregate = function (name) {
        var agg = new ElasticAggregation(name);
        this.children.set(name, agg);
        return agg;
    };
    ElasticAggregation.prototype.bucketFilter = function (fn) {
        if (!this.localBucketFilter) {
            this.localBucketFilter = new ElasticFilter();
        }
        fn(this.localBucketFilter);
        return this;
    };
    ElasticAggregation.prototype.min = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        this.aggObject = { "min": { "field": prop } };
        return new ElasticAggregateResult(this.name);
    };
    ElasticAggregation.prototype.max = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        this.aggObject = { "max": { "field": prop } };
        return new ElasticAggregateResult(this.name);
    };
    ElasticAggregation.prototype.sum = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        this.aggObject = { "sum": { "field": prop } };
        return new ElasticAggregateResult(this.name);
    };
    ElasticAggregation.prototype.avg = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        this.aggObject = { "avg": { "field": prop } };
        return new ElasticAggregateResult(this.name);
    };
    ElasticAggregation.prototype.count = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        this.aggObject = { "value_count": { "field": prop } };
        return new ElasticAggregateResult(this.name);
    };
    ElasticAggregation.prototype.stats = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        this.aggObject = { "stats": { "field": prop } };
        return new ElasticAggregateResult(this.name);
    };
    ElasticAggregation.prototype.extendedStats = function (field) {
        var prop = PropertyVisitor.getProperty(field.toString());
        this.aggObject = { "extended_stats": { "field": prop } };
        return new ElasticAggregateResult(this.name);
    };
    ElasticAggregation.prototype.compose = function () {
        var res = {};
        if (this.localBucketFilter || this.children.size > 0) {
            if (this.localBucketFilter) {
                res["filter"] = this.localBucketFilter.compose();
            }
            if (this.children.size > 0) {
                res["aggs"] = {};
                this.children.forEach(function (agg, name) {
                    res["aggs"][name] = agg.compose();
                });
            }
        }
        else {
            res = this.aggObject;
        }
        return res;
    };
    return ElasticAggregation;
})();
var ElasticDirectComposited = (function (_super) {
    __extends(ElasticDirectComposited, _super);
    function ElasticDirectComposited(compositor, parent) {
        _super.call(this, parent);
        this.compositor = compositor;
    }
    ElasticDirectComposited.prototype.composite = function () {
        return this.compositor(this);
    };
    return ElasticDirectComposited;
})(ElasticFilter);
var ElasticQuery = (function () {
    function ElasticQuery() {
    }
    ElasticQuery.prototype.toJson = function () {
        throw new Error("Not implemented");
    };
    ElasticQuery.prototype.compose = function () {
        throw new Error("Not implemented");
    };
    return ElasticQuery;
})();
var ElasticSearch = (function () {
    function ElasticSearch() {
        this.elasticAggregates = new Map();
        this.size = 0;
        this.from = 0;
        this.sort = [];
    }
    ElasticSearch.prototype.filter = function (fn) {
        if (!this.elasticFilter) {
            this.elasticFilter = new ElasticFilter();
            this.elasticFilter.searchRoot = this;
        }
        fn(this.elasticFilter);
        return this;
    };
    ElasticSearch.prototype.query = function (fn) {
        if (!this.elasticQuery) {
            this.elasticQuery = new ElasticQuery();
        }
        fn(this.elasticQuery);
        return this;
    };
    ElasticSearch.prototype.aggregate = function (name, fn) {
        if (!this.elasticAggregates.has(name)) {
            this.elasticAggregates.set(name, new ElasticAggregation(name));
        }
        fn(this.elasticAggregates.get(name));
        return this;
    };
    ElasticSearch.prototype.take = function (amount) {
        this.size = amount;
        return this;
    };
    ElasticSearch.prototype.skip = function (amount) {
        this.from = amount;
        return this;
    };
    ElasticSearch.prototype.sortBy = function (field, ascending) {
        if (ascending === void 0) { ascending = true; }
        var s = {};
        var prop = PropertyVisitor.getProperty(field.toString());
        if (ascending) {
            s[prop] = { "order": "asc" };
        }
        else {
            s[prop] = { "order": "desc" };
        }
        this.sort.push(s);
        return this;
    };
    ElasticSearch.prototype.sortByDesc = function (field) {
        return this.sortBy(field, false);
    };
    ElasticSearch.prototype.compose = function () {
        var json = { "query": { "filtered": {} } };
        if (this.elasticFilter) {
            json["query"]["filtered"]["filter"] = this.elasticFilter.compose();
        }
        if (this.elasticQuery) {
            json["query"]["filtered"]["query"] = this.elasticQuery.compose();
        }
        if (this.elasticAggregates.size > 0) {
            json["aggs"] = {};
            this.elasticAggregates.forEach(function (agg, name) {
                json["aggs"][name] = agg.compose();
            });
        }
        if (this.size > 0) {
            json["size"] = this.size.toString();
        }
        if (this.from > 0) {
            json["from"] = this.from.toString();
        }
        if (this.sort.length > 0) {
            json["sort"] = this.sort;
        }
        return json;
    };
    ElasticSearch.prototype.toJson = function () {
        return JSON.stringify(this.compose());
    };
    ElasticSearch.prototype.execute = function () {
        throw new Error("Not implemented. Derive your own base search class to execute the query.");
    };
    return ElasticSearch;
})();
exports.ElasticSearch = ElasticSearch;
var AstVisitor = (function () {
    function AstVisitor() {
        this.visitChain = [];
    }
    AstVisitor.prototype.visit = function (node) {
        this.visitChain.push(node);
        var result;
        switch (node.type) {
            case esprima.Syntax.Program:
                result = this.visitProgram(node);
                break;
            case esprima.Syntax.BinaryExpression:
                result = this.visitBinary(node);
                break;
            case esprima.Syntax.UnaryExpression:
                result = this.visitUnary(node);
                break;
            case esprima.Syntax.MemberExpression:
                result = this.visitMember(node);
                break;
            case esprima.Syntax.ExpressionStatement:
                result = this.visitExpression(node);
                break;
            case esprima.Syntax.FunctionExpression:
                result = this.visitFunctionExpression(node);
                break;
            case esprima.Syntax.BlockStatement:
                result = this.visitBlockStatement(node);
                break;
            case esprima.Syntax.ReturnStatement:
                result = this.visitReturn(node);
                break;
            case esprima.Syntax.Identifier:
                result = this.visitIdentifier(node);
                break;
            case esprima.Syntax.Literal:
                result = this.visitLiteral(node);
                break;
            case esprima.Syntax.Property:
                result = this.visitProperty(node);
                break;
            default:
                throw new Error("Invalid node type " + node.type);
        }
        this.visitChain.pop();
        return result;
    };
    AstVisitor.prototype.visitProgram = function (node) {
        var _this = this;
        return node.body.map(function (d) { return _this.visit(d); }).join();
    };
    AstVisitor.prototype.visitBinary = function (node) {
        this.visit(node.left);
        this.visit(node.right);
        return "";
    };
    AstVisitor.prototype.visitUnary = function (node) {
        this.visit(node.argument);
        return "";
    };
    AstVisitor.prototype.visitMember = function (node) {
        this.visit(node.object);
        this.visit(node.property);
        return "";
    };
    AstVisitor.prototype.visitLogical = function (node) {
        this.visit(node.left);
        this.visit(node.right);
        return "";
    };
    AstVisitor.prototype.visitExpression = function (node) {
        return this.visit(node.expression);
    };
    AstVisitor.prototype.visitReturn = function (node) {
        return this.visit(node.argument);
    };
    AstVisitor.prototype.visitFunctionExpression = function (node) {
        return this.visit(node.body);
    };
    AstVisitor.prototype.visitBlockStatement = function (node) {
        var _this = this;
        node.body.forEach(function (d) { return _this.visit(d); });
        return "";
    };
    AstVisitor.prototype.visitIdentifier = function (node) {
        return "";
    };
    AstVisitor.prototype.visitLiteral = function (node) {
        return "";
    };
    AstVisitor.prototype.visitProperty = function (node) {
        return "";
    };
    return AstVisitor;
})();
var PropertyVisitor = (function (_super) {
    __extends(PropertyVisitor, _super);
    function PropertyVisitor(func) {
        _super.call(this);
        var tree = esprima.parse("(" + func.toString() + ")");
        this.visit(tree);
    }
    PropertyVisitor.getProperty = function (fn, omitFirst) {
        if (omitFirst === void 0) { omitFirst = true; }
        var visitor = new PropertyVisitor(fn);
        var property = visitor.property;
        if (omitFirst) {
            var dotIndex = property.indexOf('.');
            if (dotIndex > 0) {
                property = property.slice(dotIndex + 1);
            }
        }
        return property;
    };
    PropertyVisitor.prototype.visitMember = function (node) {
        var propAsId = node.property;
        this.visit(node.object);
        this.property = this.property + '.' + propAsId.name;
        return "";
    };
    return PropertyVisitor;
})(AstVisitor);
//# sourceMappingURL=elasticdsl.js.map