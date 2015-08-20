var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ElasticDsl;
(function (ElasticDsl) {
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
    ElasticDsl.AstVisitor = AstVisitor;
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
            this.property = node.property + '.' + node.property;
            this.visit(node.object);
            return "";
        };
        return PropertyVisitor;
    })(AstVisitor);
    ElasticDsl.PropertyVisitor = PropertyVisitor;
})(ElasticDsl || (ElasticDsl = {}));
/// <reference path="asthelper.ts" />
var ElasticDsl;
(function (ElasticDsl) {
    var ElasticTerminalFilter = (function () {
        function ElasticTerminalFilter(parent) {
            this.localParent = parent;
        }
        ElasticTerminalFilter.prototype.back = function () {
            var p = this.localParent;
            while (p && !p.hasOwnProperty('root')) {
                p = p.parent;
            }
            if (!p) {
                throw new Error("Previous root not found!");
            }
            var rooted = p;
            return rooted.root;
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
        return ElasticTerminalFilter;
    })();
    ElasticDsl.ElasticTerminalFilter = ElasticTerminalFilter;
    var ElasticFilter = (function (_super) {
        __extends(ElasticFilter, _super);
        function ElasticFilter(parent) {
            _super.call(this, parent);
            this.siblings = [];
            this.children = [];
            this.parent = parent;
            if (parent) {
                parent.children.push(this);
            }
        }
        ElasticFilter.prototype.wrap = function () {
            return new ElasticFilter(this);
        };
        ElasticFilter.prototype.and = function (fn) {
            var andFilter = new ElasticAndFilter(this);
            fn(andFilter);
            return andFilter;
        };
        ElasticFilter.prototype.or = function (fn) {
            var orFilter = new ElasticOrFilter(this);
            fn(orFilter);
            return orFilter;
        };
        ElasticFilter.prototype.bool = function () {
            return new ElasticBoolFilter(this);
        };
        ElasticFilter.prototype.exists = function (field) {
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
            return new ElasticRawFilter({ "exists": { "field": prop } }, this);
        };
        ElasticFilter.prototype.ids = function (idList) {
            return new ElasticRawFilter({ "values": idList }, this);
        };
        ElasticFilter.prototype.limit = function (amount) { return new ElasticRawFilter({ "value": amount }, this); };
        ElasticFilter.prototype.matchAll = function () { return new ElasticRawFilter({ "match_all": "" }, this); };
        ElasticFilter.prototype.missing = function (field) {
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
            return new ElasticRawFilter({ "missing": { "field": prop } }, this);
        };
        ElasticFilter.prototype.not = function () {
            return new ElasticDirectComposited(function (d) {
                return { "not": d.composeChild() };
            }, this);
        };
        ElasticFilter.prototype.prefix = function (field, prefix) {
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
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
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
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
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
            var filter = { "regexp": {} };
            filter["regexp"][prop] = regex;
            return new ElasticRawFilter(filter, this);
        };
        ElasticFilter.prototype.term = function (field, term) {
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
            var filter = { "term": {} };
            filter["term"][prop] = term;
            return new ElasticRawFilter(filter, this);
        };
        ElasticFilter.prototype.terms = function (field, terms) {
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
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
    ElasticDsl.ElasticFilter = ElasticFilter;
    var ElasticRootedFilter = (function (_super) {
        __extends(ElasticRootedFilter, _super);
        function ElasticRootedFilter(parent, root) {
            _super.call(this, parent);
            this.root = root;
        }
        return ElasticRootedFilter;
    })(ElasticFilter);
    ElasticDsl.ElasticRootedFilter = ElasticRootedFilter;
    var ElasticBoolFilter = (function (_super) {
        __extends(ElasticBoolFilter, _super);
        function ElasticBoolFilter(parent, root) {
            _super.call(this, parent, root);
            if (root) {
                this.mustFilter = new ElasticBoolFilter(this, root);
                this.mustNotFilter = new ElasticBoolFilter(this, root);
                this.shouldFilter = new ElasticBoolFilter(this, root);
            }
            else {
                this.mustFilter = new ElasticBoolFilter(this, this);
                this.mustNotFilter = new ElasticBoolFilter(this, this);
                this.shouldFilter = new ElasticBoolFilter(this, this);
                this.root = this;
            }
        }
        ElasticBoolFilter.prototype.must = function (fn) {
            fn(this.root.mustFilter);
            return this.root.mustFilter;
        };
        ElasticBoolFilter.prototype.mustnot = function (fn) {
            fn(this.root.mustNotFilter);
            return this.root.mustNotFilter;
        };
        ElasticBoolFilter.prototype.should = function (fn) {
            fn(this.root.shouldFilter);
            return this.root.shouldFilter;
        };
        return ElasticBoolFilter;
    })(ElasticRootedFilter);
    ElasticDsl.ElasticBoolFilter = ElasticBoolFilter;
    var ElasticAndFilter = (function (_super) {
        __extends(ElasticAndFilter, _super);
        function ElasticAndFilter(parent, root) {
            _super.call(this, parent, root);
            this.conditions = [];
            if (root) {
                root.conditions.push(this);
            }
            else {
                this.conditions.push(this);
            }
        }
        ElasticAndFilter.prototype.and = function (fn) {
            var andFilter = new ElasticAndFilter(this, this.root);
            fn(andFilter);
            return andFilter;
        };
        return ElasticAndFilter;
    })(ElasticRootedFilter);
    ElasticDsl.ElasticAndFilter = ElasticAndFilter;
    var ElasticOrFilter = (function (_super) {
        __extends(ElasticOrFilter, _super);
        function ElasticOrFilter(parent, root) {
            _super.call(this, parent, root);
            this.conditions = [];
            if (root) {
                root.conditions.push(this);
            }
            else {
                this.conditions.push(this);
            }
        }
        ElasticOrFilter.prototype.or = function (fn) {
            var andFilter = new ElasticOrFilter(this, this.root);
            fn(andFilter);
            return andFilter;
        };
        return ElasticOrFilter;
    })(ElasticRootedFilter);
    ElasticDsl.ElasticOrFilter = ElasticOrFilter;
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
    ElasticDsl.ElasticRawFilter = ElasticRawFilter;
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
    ElasticDsl.ElasticDirectComposited = ElasticDirectComposited;
    var ElasticQuery = (function () {
        function ElasticQuery() {
        }
        ElasticQuery.prototype.toJson = function () {
            throw new Error("Not implemented");
        };
        return ElasticQuery;
    })();
    ElasticDsl.ElasticQuery = ElasticQuery;
    var ElasticSearch = (function () {
        function ElasticSearch() {
            this.size = 0;
            this.from = 0;
            this.sort = [];
        }
        ElasticSearch.prototype.filter = function () {
            if (!this.elasticFilter) {
                this.elasticFilter = new ElasticFilter();
            }
            return this.elasticFilter;
        };
        ElasticSearch.prototype.query = function () {
            if (!this.elasticQuery) {
                this.elasticQuery = new ElasticQuery();
            }
            return this.elasticQuery;
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
            var prop = ElasticDsl.PropertyVisitor.getProperty(field.toString());
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
        ElasticSearch.prototype.toJson = function () {
            var json = { "query": { "filtered": {} } };
            if (this.elasticFilter) {
                json["query"]["filtered"]["filter"] = this.elasticFilter.toJson();
            }
            if (this.elasticQuery) {
                json["query"]["filtered"]["query"] = this.elasticQuery.toJson();
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
        return ElasticSearch;
    })();
    ElasticDsl.ElasticSearch = ElasticSearch;
})(ElasticDsl || (ElasticDsl = {}));
//# sourceMappingURL=elasticdsl.js.map