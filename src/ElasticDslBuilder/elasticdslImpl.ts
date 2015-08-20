/// <reference path="asthelper.ts" />

module ElasticDsl {

    export class ElasticTerminalFilter<T> implements IElasticTerminal<T> {
        private localParent: ElasticFilter<T>;

        constructor(parent?: ElasticFilter<T>) {
            this.localParent = parent;
        }

        back(): IElasticFilter<T> {
            var p = this.localParent;
            while (p && !p.hasOwnProperty('root')) {
                p = p.parent;
            }
            if (!p) {
                throw new Error("Previous root not found!");
            }
            var rooted = <ElasticRootedFilter<T, ElasticFilter<T>>>p;

            return rooted.root;
        }

        cast<TCast extends ElasticTerminalFilter<T>>() {
            return <TCast>this;
        }

        compose(): any {
            throw new Error("Base compose should not be called");
        }

        toJson(): string {
            return JSON.stringify(this.compose());
        }
    }

    export class ElasticFilter<T> extends ElasticTerminalFilter<T> implements IElasticFilter<T> {

        parent: ElasticFilter<T>;
        siblings: ElasticFilter<T>[] = [];
        children: ElasticFilter<T>[] = [];

        constructor(parent?: ElasticFilter<T>) {
            super(parent);
            this.parent = parent;
            if (parent) {
                parent.children.push(this);
            }
        }

        wrap(): IElasticFilter<T> {
            return new ElasticFilter<T>(this);
        }

        and(fn: IElasticFn<T>): IElasticFilter<T> {
            var andFilter = new ElasticAndFilter<T>(this);
            fn(andFilter);
            return andFilter;
        }

        or(fn: IElasticFn<T>): IElasticFilter<T> {
            var orFilter = new ElasticOrFilter<T>(this);
            fn(orFilter);
            return orFilter;
        }

        bool(): IElasticBoolFilter<T> {
            return new ElasticBoolFilter<T>(this);
        }

        exists(field: IElasticProp<T>): IElasticTerminal<T> {
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            return new ElasticRawFilter({ "exists": { "field": prop } }, this);
        }

        ids(idList: any[]): IElasticTerminal<T> {
            return new ElasticRawFilter<T>({ "values": idList }, this);
        }

        limit(amount: number): IElasticTerminal<T> { return new ElasticRawFilter<T>({ "value": amount }, this); }

        matchAll(): IElasticTerminal<T> { return new ElasticRawFilter<T>({ "match_all": "" }, this); }

        missing(field: IElasticProp<T>): IElasticTerminal<T> {
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            return new ElasticRawFilter<T>({ "missing": { "field": prop } }, this);
        }

        not(): IElasticFilter<T> {
            return new ElasticDirectComposited<T>(d => {
                return { "not": d.composeChild() };
            }, this);
        }

        prefix(field: IElasticProp<T>, prefix: string) {
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            var filter = { "prefix": {} };
            filter["prefix"][prop] = prefix;
            return new ElasticRawFilter<T>(filter, this);
        }

        query(cache?: boolean): IElasticQuery<T> { throw new Error("Not implemented"); }

        lte(field: IElasticProp<T>, lte: number): IElasticTerminal<T> {
            return this.range(field, lte);
        }

        lt(field: IElasticProp<T>, lt: number): IElasticTerminal<T> {
            return this.range(field, null, lt);
        }

        gt(field: IElasticProp<T>, gt: number): IElasticTerminal<T> {
            return this.range(field, null, null, null, gt);
        }

        gte(field: IElasticProp<T>, gte: number): IElasticTerminal<T> {
            return this.range(field, null, null, gte);
        }

        range(field: IElasticProp<T>, lte?: number, lt?: number, gte?: number, gt?: number): IElasticTerminal<T> {
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            var range = {}
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
            return new ElasticRawFilter<T>(filter, this);
        }

        regExp(field: IElasticProp<T>, regex: string): IElasticTerminal<T> {
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            var filter = { "regexp": {} };
            filter["regexp"][prop] = regex;
            return new ElasticRawFilter<T>(filter, this);
        }

        term(field: IElasticProp<T>, term: string): IElasticTerminal<T> {
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            var filter = { "term": {} };
            filter["term"][prop] = term;
            return new ElasticRawFilter<T>(filter, this);
        }

        terms(field: IElasticProp<T>, terms: string[]): IElasticTerminal<T> {
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            var filter = { "terms": {} };
            filter["terms"][prop] = terms;
            return new ElasticRawFilter<T>(filter, this);
        }

        raw(obj: any): ElasticRawFilter<T> {
            return new ElasticRawFilter<T>(obj, this);
        }

        eq(field: IElasticProp<T>, val: string): IElasticTerminal<T> {
            return this.term(field, val);
        }

        protected composeChildren(): any[] {
            return this.children.map(d => d.compose());
        }

        protected composeChild(): any {
            if (this.children.length > 1) {
                throw new Error("Unexpected too many children");
            } else if (this.children.length === 1) {
                return this.children[0].compose();
            }

            return {};
        }
    }

    export class ElasticRootedFilter<T, TRoot> extends ElasticFilter<T> {
        root: TRoot;

        constructor(parent?: ElasticFilter<T>, root?: TRoot) {
            super(parent);
            this.root = root;
        }
    }

    export class ElasticBoolFilter<T> extends ElasticRootedFilter<T, ElasticBoolFilter<T>> implements IElasticBoolFilter<T> {
        mustFilter: ElasticBoolFilter<T>;
        mustNotFilter: ElasticBoolFilter<T>;
        shouldFilter: ElasticBoolFilter<T>;

        constructor(parent?: ElasticFilter<T>, root?: ElasticBoolFilter<T>) {
            super(parent, root);
            if (root) {
                this.mustFilter = new ElasticBoolFilter<T>(this, root);
                this.mustNotFilter = new ElasticBoolFilter<T>(this, root);
                this.shouldFilter = new ElasticBoolFilter<T>(this, root);
            } else {
                this.mustFilter = new ElasticBoolFilter<T>(this, this);
                this.mustNotFilter = new ElasticBoolFilter<T>(this, this);
                this.shouldFilter = new ElasticBoolFilter<T>(this, this);
                this.root = this;
            }
        }

        must(fn: IElasticFn<T>): IElasticBoolFilter<T> {
            fn(this.root.mustFilter);
            return this.root.mustFilter;
        }

        mustnot(fn: IElasticFn<T>): IElasticBoolFilter<T> {
            fn(this.root.mustNotFilter);
            return this.root.mustNotFilter;
        }

        should(fn: IElasticFn<T>): IElasticBoolFilter<T> {
            fn(this.root.shouldFilter);
            return this.root.shouldFilter;
        }
    }

    export class ElasticAndFilter<T> extends ElasticRootedFilter<T, ElasticAndFilter<T>> {
        conditions: ElasticAndFilter<T>[] = [];

        constructor(parent?: ElasticFilter<T>, root?: ElasticAndFilter<T>) {
            super(parent, root);
            if (root) {
                root.conditions.push(this);
            } else {
                this.conditions.push(this);
            }
        }

        and(fn: IElasticFn<T>): IElasticFilter<T> {
            var andFilter = new ElasticAndFilter<T>(this, this.root);
            fn(andFilter);
            return andFilter;
        }
    }

    export class ElasticOrFilter<T> extends ElasticRootedFilter<T, ElasticOrFilter<T>> {
        conditions: ElasticOrFilter<T>[] = [];

        constructor(parent?: ElasticFilter<T>, root?: ElasticOrFilter<T>) {
            super(parent, root);
            if (root) {
                root.conditions.push(this);
            } else {
                this.conditions.push(this);
            }
        }

        or(fn: IElasticFn<T>): IElasticFilter<T> {
            var andFilter = new ElasticOrFilter<T>(this, this.root);
            fn(andFilter);
            return andFilter;
        }
    }

    export class ElasticRawFilter<T> extends ElasticTerminalFilter<T> {
        rawObject: any;

        constructor(rawJson: any, parent?: ElasticFilter<T>) {
            super(parent);
            this.rawObject = rawJson;
        }

        compose(): any {
            return this.rawObject;
        }
    }

    // ReSharper disable once InconsistentNaming
    export interface ElasticComposerFn<T> {
        (compositor: ElasticDirectComposited<T>): any;
    }

    export class ElasticDirectComposited<T> extends ElasticFilter<T> {
        compositor: ElasticComposerFn<T>

        constructor(compositor: ElasticComposerFn<T>, parent?: ElasticFilter<T>) {
            super(parent);
            this.compositor = compositor;
        }

        composite(): any {
            return this.compositor(this);
        }
    }

    export class ElasticQuery<T> implements IElasticQuery<T> {
        toJson(): any {
            throw new Error("Not implemented");
        }
    }

    export class ElasticSearch<T> implements IElasticSearch<T> {
        private elasticFilter: IElasticFilter<T>;

        private elasticQuery: IElasticQuery<T>;

        private size: number = 0;

        private from: number = 0;

        private sort: any[] = [];

        filter(): IElasticFilter<T> {
            if (!this.elasticFilter) {
                this.elasticFilter = new ElasticFilter<T>();
            }

            return this.elasticFilter;
        }

        query(): IElasticQuery<T> {
            if (!this.elasticQuery) {
                this.elasticQuery = new ElasticQuery<T>();
            }

            return this.elasticQuery;
        }

        take(amount: number): IElasticSearch<T> {
            this.size = amount;
            return this;
        }

        skip(amount: number): IElasticSearch<T> {
            this.from = amount;
            return this;
        }

        sortBy(field: IElasticProp<T>, ascending: boolean = true): IElasticSearch<T> {
            var s = {};
            var prop = PropertyVisitor.getProperty((<any>field).toString());
            if (ascending) {
                s[prop] = { "order": "asc" };
            } else {
                s[prop] = { "order": "desc" };
            }

            this.sort.push(s);
            return this;
        }

        sortByDesc(field: IElasticProp<T>): IElasticSearch<T> {
            return this.sortBy(field, false);
        }

        toJson(): any {
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
}