import { PropertyVisitor } from './asthelper';
export var ElasticDsl;
(function (ElasticDsl) {
    class ElasticTerminalFilter {
        constructor(parent) {
            this.localParent = parent;
        }
        back() {
            var p = this.localParent;
            while (p && !p.hasOwnProperty('root')) {
                p = p.parent;
            }
            if (!p) {
                throw new Error("Previous root not found!");
            }
            var rooted = p;
            return rooted.root;
        }
        cast() {
            return this;
        }
        compose() {
            throw new Error("Base compose should not be called");
        }
        toJson() {
            return JSON.stringify(this.compose());
        }
    }
    ElasticDsl.ElasticTerminalFilter = ElasticTerminalFilter;
    class ElasticFilter extends ElasticTerminalFilter {
        constructor(parent) {
            super(parent);
            this.siblings = [];
            this.children = [];
            this.parent = parent;
            if (parent) {
                parent.children.push(this);
            }
        }
        wrap() {
            return new ElasticFilter(this);
        }
        and(fn) {
            var andFilter = new ElasticAndFilter(this);
            fn(andFilter);
            return andFilter;
        }
        or(fn) {
            var orFilter = new ElasticOrFilter(this);
            fn(orFilter);
            return orFilter;
        }
        bool() {
            return new ElasticBoolFilter(this);
        }
        exists(field) {
            var prop = PropertyVisitor.getProperty(field.toString());
            return new ElasticRawFilter({ "exists": { "field": prop } }, this);
        }
        ids(idList) {
            return new ElasticRawFilter({ "values": idList }, this);
        }
        limit(amount) { return new ElasticRawFilter({ "value": amount }, this); }
        matchAll() { return new ElasticRawFilter({ "match_all": "" }, this); }
        missing(field) {
            var prop = PropertyVisitor.getProperty(field.toString());
            return new ElasticRawFilter({ "missing": { "field": prop } }, this);
        }
        not() {
            return new ElasticDirectComposited(d => {
                return { "not": d.composeChild() };
            }, this);
        }
        prefix(field, prefix) {
            var prop = PropertyVisitor.getProperty(field.toString());
            var filter = { "prefix": {} };
            filter["prefix"][prop] = prefix;
            return new ElasticRawFilter(filter, this);
        }
        query(cache) { throw new Error("Not implemented"); }
        lte(field, lte) {
            return this.range(field, lte);
        }
        lt(field, lt) {
            return this.range(field, null, lt);
        }
        gt(field, gt) {
            return this.range(field, null, null, null, gt);
        }
        gte(field, gte) {
            return this.range(field, null, null, gte);
        }
        range(field, lte, lt, gte, gt) {
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
        }
        regExp(field, regex) {
            var prop = PropertyVisitor.getProperty(field.toString());
            var filter = { "regexp": {} };
            filter["regexp"][prop] = regex;
            return new ElasticRawFilter(filter, this);
        }
        term(field, term) {
            var prop = PropertyVisitor.getProperty(field.toString());
            var filter = { "term": {} };
            filter["term"][prop] = term;
            return new ElasticRawFilter(filter, this);
        }
        terms(field, terms) {
            var prop = PropertyVisitor.getProperty(field.toString());
            var filter = { "terms": {} };
            filter["terms"][prop] = terms;
            return new ElasticRawFilter(filter, this);
        }
        raw(obj) {
            return new ElasticRawFilter(obj, this);
        }
        eq(field, val) {
            return this.term(field, val);
        }
        composeChildren() {
            return this.children.map(d => d.compose());
        }
        composeChild() {
            if (this.children.length > 1) {
                throw new Error("Unexpected too many children");
            }
            else if (this.children.length === 1) {
                return this.children[0].compose();
            }
            return {};
        }
    }
    ElasticDsl.ElasticFilter = ElasticFilter;
    class ElasticRootedFilter extends ElasticFilter {
        constructor(parent, root) {
            super(parent);
            this.root = root;
        }
    }
    ElasticDsl.ElasticRootedFilter = ElasticRootedFilter;
    class ElasticBoolFilter extends ElasticRootedFilter {
        constructor(parent, root) {
            super(parent, root);
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
        must(fn) {
            fn(this.root.mustFilter);
            return this.root.mustFilter;
        }
        mustnot(fn) {
            fn(this.root.mustNotFilter);
            return this.root.mustNotFilter;
        }
        should(fn) {
            fn(this.root.shouldFilter);
            return this.root.shouldFilter;
        }
    }
    ElasticDsl.ElasticBoolFilter = ElasticBoolFilter;
    class ElasticAndFilter extends ElasticRootedFilter {
        constructor(parent, root) {
            super(parent, root);
            this.conditions = [];
            if (root) {
                root.conditions.push(this);
            }
            else {
                this.conditions.push(this);
            }
        }
        and(fn) {
            var andFilter = new ElasticAndFilter(this, this.root);
            fn(andFilter);
            return andFilter;
        }
    }
    ElasticDsl.ElasticAndFilter = ElasticAndFilter;
    class ElasticOrFilter extends ElasticRootedFilter {
        constructor(parent, root) {
            super(parent, root);
            this.conditions = [];
            if (root) {
                root.conditions.push(this);
            }
            else {
                this.conditions.push(this);
            }
        }
        or(fn) {
            var andFilter = new ElasticOrFilter(this, this.root);
            fn(andFilter);
            return andFilter;
        }
    }
    ElasticDsl.ElasticOrFilter = ElasticOrFilter;
    class ElasticRawFilter extends ElasticTerminalFilter {
        constructor(rawJson, parent) {
            super(parent);
            this.rawObject = rawJson;
        }
        compose() {
            return this.rawObject;
        }
    }
    ElasticDsl.ElasticRawFilter = ElasticRawFilter;
    class ElasticDirectComposited extends ElasticFilter {
        constructor(compositor, parent) {
            super(parent);
            this.compositor = compositor;
        }
        composite() {
            return this.compositor(this);
        }
    }
    ElasticDsl.ElasticDirectComposited = ElasticDirectComposited;
    class ElasticQuery {
        toJson() {
            throw new Error("Not implemented");
        }
    }
    ElasticDsl.ElasticQuery = ElasticQuery;
    class ElasticSearch {
        constructor() {
            this.size = 0;
            this.from = 0;
            this.sort = [];
        }
        filter() {
            if (!this.elasticFilter) {
                this.elasticFilter = new ElasticFilter();
            }
            return this.elasticFilter;
        }
        query() {
            if (!this.elasticQuery) {
                this.elasticQuery = new ElasticQuery();
            }
            return this.elasticQuery;
        }
        take(amount) {
            this.size = amount;
            return this;
        }
        skip(amount) {
            this.from = amount;
            return this;
        }
        sortBy(field, ascending = true) {
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
        }
        sortByDesc(field) {
            return this.sortBy(field, false);
        }
        toJson() {
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
        }
    }
    ElasticDsl.ElasticSearch = ElasticSearch;
})(ElasticDsl || (ElasticDsl = {}));
//# sourceMappingURL=elasticdsl.js.map