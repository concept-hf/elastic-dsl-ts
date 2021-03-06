﻿import esprima = require('esprima');

export interface IElasticFn<T> {
    (fn: IElasticFilter<T>): IElasticTerminal<T> | void;
}

export interface IElasticProp<T> {
    (it: T): any;
}

export interface IElasticQuery<T> {
    toJson(): any;
    compose(): any;
}

export interface IElasticSearch<T> {
    filter(fn: (filter: IElasticFilter<T>) => void): IElasticSearch<T>;
    query(fn: (filter: IElasticFilter<T>) => void): IElasticSearch<T>;
    aggregate(name: string, fn: (aggregate: IElasticAggregation<T>) => void): IElasticSearch<T>;
    toJson(): any;
    take(amount: number): IElasticSearch<T>;
    skip(amount: number): IElasticSearch<T>;
    sortBy(prop: IElasticProp<T>): IElasticSearch<T>;
    sortByDesc(field: IElasticProp<T>): IElasticSearch<T>;
    execute(): Promise<IElasticSearchResult<T>>;
}

export interface IElasticFilterBase {
}

export interface IElasticTerminal<T> {
    back(): IElasticFilter<T>;
    compose(): any;
    toJson(): string;
    execute(): Promise<IElasticSearchResult<T>>;
}

export interface IElasticFilter<T> extends IElasticTerminal<T>, IElasticFilterBase {
    and(): IElasticAndFilter<T>;
    or(): IElasticOrFilter<T>;
    bool(): IElasticBoolFilter<T>;
    exists(field: IElasticProp<T>): IElasticTerminal<T>;
    ids(idList: any[]): IElasticTerminal<T>;
    limit(amount: number): IElasticTerminal<T>;
    matchAll(): IElasticTerminal<T>;
    missing(field: IElasticProp<T>): IElasticTerminal<T>;
    nested<TNested>(prop: (it: T) => TNested[], nestFn: (nest: IElasticNestedFilter<TNested>) => any): IElasticFilter<T>;
    not(): IElasticFilter<T>;
    prefix(prop: IElasticProp<T>, prefix: string): IElasticTerminal<T>;
    query(cache?: boolean): IElasticQuery<T>;
    lte(field: IElasticProp<T>, lte: number): IElasticTerminal<T>;
    lt(field: IElasticProp<T>, lt: number): IElasticTerminal<T>;
    gte(field: IElasticProp<T>, gte: number): IElasticTerminal<T>;
    gt(field: IElasticProp<T>, gt: number): IElasticTerminal<T>;
    range(prop: IElasticProp<T>, lte?: number, lt?: number, gte?: number, gt?: number): IElasticTerminal<T>;
    regExp(prop: IElasticProp<T>, regex: string): IElasticTerminal<T>;
    term(prop: IElasticProp<T>, term: any): IElasticTerminal<T>;
    terms(prop: IElasticProp<T>, terms: any[]): IElasticTerminal<T>;
    wrap(): IElasticFilter<T>;
    raw(obj: any): IElasticTerminal<T>;

    eq(prop: IElasticProp<T>, val: any): IElasticTerminal<T>;

    searchRoot: IElasticSearch<T>;
}

export interface IElasticNestedFilter<T> extends IElasticFilter<T> {

}

export interface IElasticBoolFilter<T> extends IElasticFilter<T> {
    must(fn: IElasticFn<T>): IElasticBoolFilter<T>;
    mustnot(fn: IElasticFn<T>): IElasticBoolFilter<T>;
    should(fn: IElasticFn<T>): IElasticBoolFilter<T>;
}

export interface IElasticAggregation<T> {
    compose(): any;
    subAggregate(name: string): IElasticAggregation<T>;
    bucketFilter(fn: IElasticFn<T>): IElasticAggregation<T>;
    min(field: IElasticProp<T>): ISingleValueMetric<number>;
    max(field: IElasticProp<T>): ISingleValueMetric<number>;
    sum(field: IElasticProp<T>): ISingleValueMetric<number>;
    avg(field: IElasticProp<T>): ISingleValueMetric<number>;
    count(field: IElasticProp<T>): ISingleValueMetric<number>;
    stats(field: IElasticProp<T>): IStatsResult;
    extendedStats(field: IElasticProp<T>): IExtendedStatsResult;
}

export interface ISingleValueMetric<TMetricType> extends IAggregationResult<ISingleValueMetric<TMetricType>> {
    value: TMetricType;
}

export interface IMultiValueMetric<TMetricType> extends IAggregationResult<IMultiValueMetric<TMetricType>> {
    values: TMetricType[];
}

export interface IStatsResult extends IAggregationResult<IStatsResult> {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
}

export interface IExtendedStatsResult extends IAggregationResult<IExtendedStatsResult> {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
    sum_of_squares: number;
    variance: number;
    std_deviation: number;
    upper: number;
    lower: number;
}

export interface IAggregationResult<TAgg> {
    name: string;
    read(result: IElasticSearchResult<any>): TAgg;
}


export interface IElasticHit<T> {
    _index: string;
    _type: string;
    _id: string;
    _source: T;
}

export interface IElasticSearchResult<T> {
    _shards: { total: number, succesfull: number, failed: number };
    hits: { total: number, hits: IElasticHit<T>[] };
    aggregations: any;
}

export interface IElasticAndFilter<T> extends IElasticFilter<T> {
}

export interface IElasticOrFilter<T> extends IElasticFilter<T> {
}

class ElasticTerminalFilter<T> implements IElasticTerminal<T> {
    private localParent: ElasticFilter<T>;

    constructor(parent?: ElasticFilter<T>) {
        this.localParent = parent;
        if (parent) {
            parent.children.push(this);
        }
    }

    back(): IElasticFilter<T> {
        return this.localParent;
    }

    cast<TCast extends ElasticTerminalFilter<T>>() {
        return <TCast><any>this;
    }

    compose(): any {
        throw new Error("Base compose should not be called");
    }

    toJson(): string {
        return JSON.stringify(this.compose());
    }

    execute(): Promise<IElasticSearchResult<T>> {
        return this.getSearchRoot().execute();
    }

    private getSearchRoot(): IElasticSearch<T> {
        if (!this.localParent || !this.localParent.searchRoot) {
            throw new Error("Parent not found");
        }

        return this.localParent.searchRoot;
    }
}

class ElasticFilter<T> extends ElasticTerminalFilter<T> implements IElasticFilter<T> {

    parent: ElasticFilter<T>;
    siblings: ElasticFilter<T>[] = [];
    children: IElasticTerminal<T>[] = [];
    searchRoot: IElasticSearch<T>;

    constructor(parent?: ElasticFilter<T>) {
        super(parent);
        this.parent = parent;
        if (parent) {
            this.searchRoot = parent.searchRoot;
        }
    }

    nested<TNested>(
        field: (it: T) => TNested[],
        nestFn: (nest: IElasticNestedFilter<TNested>) => any): IElasticFilter<T> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        var nested = new ElasticNestedFilter<T, TNested>(prop, this);
        nestFn(nested);
        return this;
    }

    wrap(): IElasticFilter<T> {
        return new ElasticFilter<T>(this);
    }

    and(): IElasticAndFilter<T> {
        var andFilter = new ElasticAndFilter<T>(this);
        return andFilter;
    }

    or(): IElasticOrFilter<T> {
        var orFilter = new ElasticOrFilter<T>(this);
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

    term(field: IElasticProp<T>, term: any): IElasticTerminal<T> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        var filter = { "term": {} };
        filter["term"][prop] = term;
        return new ElasticRawFilter<T>(filter, this);
    }

    terms(field: IElasticProp<T>, terms: any[]): IElasticTerminal<T> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        var filter = { "terms": {} };
        filter["terms"][prop] = terms;
        return new ElasticRawFilter<T>(filter, this);
    }

    raw(obj: any): ElasticRawFilter<T> {
        return new ElasticRawFilter<T>(obj, this);
    }

    eq(field: IElasticProp<T>, val: any): IElasticTerminal<T> {
        return this.term(field, val);
    }

    compose(): any {
        return this.composeChild();
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

class ElasticNestedFilter<T, TNested> extends ElasticFilter<TNested> implements IElasticNestedFilter<TNested>{
    private path: string;

    constructor(path: string, parent?: ElasticFilter<T>) {
        // TODO: Remove this hack. Possibly by introducing a non-typed container interface
        super(<any>parent);
        this.path = path;
    }

    compose(): any {
        var result = {};
        result["path"] = this.path;
        result["filter"] = super.compose();
        return { "nested": result };
    }
}

class ElasticRootedFilter<T, TRoot> extends ElasticFilter<T> {
    root: TRoot;

    constructor(parent?: ElasticFilter<T>, root?: TRoot) {
        super(parent);
        this.root = root;
    }
}

class ElasticBoolFilter<T> extends ElasticRootedFilter<T, ElasticBoolFilter<T>> implements IElasticBoolFilter<T> {
    mustFilter: ElasticBoolFilter<T>;
    mustNotFilter: ElasticBoolFilter<T>;
    shouldFilter: ElasticBoolFilter<T>;

    constructor(parent?: ElasticFilter<T>, root?: ElasticBoolFilter<T>) {
        super(parent, root);
        if (root) {
            this.mustFilter = root.mustFilter;
            this.mustNotFilter = root.mustNotFilter;
            this.shouldFilter = root.shouldFilter;
            this.root = root;
        } else {
            this.mustFilter = new ElasticBoolFilter<T>(this, this);
            this.mustNotFilter = new ElasticBoolFilter<T>(this, this);
            this.shouldFilter = new ElasticBoolFilter<T>(this, this);
            this.root = this;
        }
    }

    must(fn: IElasticFn<T>): IElasticBoolFilter<T> {
        var filter = new ElasticFilter<T>(this.root.mustFilter);
        fn(filter);
        return this.root.mustFilter;
    }

    mustnot(fn: IElasticFn<T>): IElasticBoolFilter<T> {
        var filter = new ElasticFilter<T>(this.root.mustNotFilter);
        fn(filter);
        return this.root.mustNotFilter;
    }

    should(fn: IElasticFn<T>): IElasticBoolFilter<T> {
        var filter = new ElasticFilter<T>(this.root.shouldFilter);
        fn(filter);
        return this.root.shouldFilter;
    }

    compose(): any {
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
    }

    private checkSingleChild(filter: ElasticBoolFilter<T>) {
        if (filter.children.length > 1) {
            throw new Error("Filter should have at most one child");
        }
    }
}

class ElasticAndFilter<T> extends ElasticFilter<T> implements IElasticAndFilter<T> {

    constructor(parent?: ElasticFilter<T>) {
        super(parent);
    }

    compose(): any {
        var conditions: any[] = [];

        this.children.forEach(child => {
            if (child instanceof ElasticAndFilter) {
                let composed: { and: any[] } = child.compose();
                composed.and.forEach(d => conditions.push(d));
            } else {
                conditions.push(child.compose());
            }
        });

        return {
            "and": conditions
        };
    }
}

class ElasticOrFilter<T> extends ElasticFilter<T> implements IElasticOrFilter<T> {

    constructor(parent?: ElasticFilter<T>, root?: ElasticOrFilter<T>) {
        super(parent);
    }

    compose(): any {
        var conditions: any[] = [];

        this.children.forEach(child => {
            if (child instanceof ElasticOrFilter) {
                let composed: { or: any[] } = child.compose();
                composed.or.map(d => conditions.push(d));
            } else {
                conditions.push(child.compose());
            }
        });

        return {
            "or": conditions
        };
    }
}

class ElasticRawFilter<T> extends ElasticTerminalFilter<T> {
    rawObject: any;

    constructor(rawJson: any, parent?: ElasticFilter<T>) {
        super(parent);
        this.rawObject = rawJson;
    }

    compose(): any {
        return this.rawObject;
    }
}

class ElasticAggregateResult implements IAggregationResult<any> {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    read(result: IElasticSearchResult<any>): any {
        return result.aggregations[this.name];
    }
}

class ElasticAggregation<T> implements IElasticAggregation<T>{
    private name: string;
    private localBucketFilter: ElasticFilter<T>;
    private children: Map<string, ElasticAggregation<T>> = new Map<string, ElasticAggregation<T>>();
    private aggObject: any = {};

    constructor(name: string) {
        this.name = name;
    }

    subAggregate(name: string): IElasticAggregation<T> {
        var agg = new ElasticAggregation<T>(name);
        this.children.set(name, agg);
        return agg;
    }

    bucketFilter(fn: IElasticFn<T>): IElasticAggregation<T> {
        if (!this.localBucketFilter) {
            this.localBucketFilter = new ElasticFilter<T>();
        }

        fn(this.localBucketFilter);

        return this;
    }

    min(field: IElasticProp<T>): ISingleValueMetric<number> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        this.aggObject = { "min": { "field": prop } };
        return <any>new ElasticAggregateResult(this.name);
    }

    max(field: IElasticProp<T>): ISingleValueMetric<number> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        this.aggObject = { "max": { "field": prop } };
        return <any>new ElasticAggregateResult(this.name);
    }

    sum(field: IElasticProp<T>): ISingleValueMetric<number> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        this.aggObject = { "sum": { "field": prop } };
        return <any>new ElasticAggregateResult(this.name);
    }

    avg(field: IElasticProp<T>): ISingleValueMetric<number> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        this.aggObject = { "avg": { "field": prop } };
        return <any>new ElasticAggregateResult(this.name);
    }

    count(field: IElasticProp<T>): ISingleValueMetric<number> {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        this.aggObject = { "value_count": { "field": prop } };
        return <any>new ElasticAggregateResult(this.name);
    }

    stats(field: IElasticProp<T>): IStatsResult {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        this.aggObject = { "stats": { "field": prop } };
        return <any>new ElasticAggregateResult(this.name);
    }

    extendedStats(field: IElasticProp<T>): IExtendedStatsResult {
        var prop = PropertyVisitor.getProperty((<any>field).toString());
        this.aggObject = { "extended_stats": { "field": prop } };
        return <any>new ElasticAggregateResult(this.name);
    }

    compose(): any {
        var res = {};
        if (this.localBucketFilter || this.children.size > 0) {
            if (this.localBucketFilter) {
                res["filter"] = this.localBucketFilter.compose();
            }
            if (this.children.size > 0) {
                res["aggs"] = {};
                this.children.forEach((agg, name) => {
                    res["aggs"][name] = agg.compose();
                });
            }
        } else {
            res = this.aggObject;
        }

        return res;
    }
}

// ReSharper disable once InconsistentNaming
interface ElasticComposerFn<T> {
    (compositor: ElasticDirectComposited<T>): any;
}

class ElasticDirectComposited<T> extends ElasticFilter<T> {
    compositor: ElasticComposerFn<T>

    constructor(compositor: ElasticComposerFn<T>, parent?: ElasticFilter<T>) {
        super(parent);
        this.compositor = compositor;
    }

    composite(): any {
        return this.compositor(this);
    }
}

class ElasticQuery<T> implements IElasticQuery<T> {
    toJson(): any {
        throw new Error("Not implemented");
    }

    compose(): any {
        throw new Error("Not implemented");
    }
}

export class ElasticSearch<T> implements IElasticSearch<T> {
    private elasticFilter: IElasticFilter<T>;

    private elasticQuery: IElasticQuery<T>;

    private elasticAggregates: Map<string, IElasticAggregation<T>> = new Map<string, IElasticAggregation<T>>();

    private size: number = 0;

    private from: number = 0;

    private sort: any[] = [];

    filter(fn: (filter: IElasticFilter<T>) => void): IElasticSearch<T> {
        if (!this.elasticFilter) {
            this.elasticFilter = new ElasticFilter<T>();
            this.elasticFilter.searchRoot = this;
        }

        fn(this.elasticFilter);

        return this;
    }

    query(fn: (query: IElasticQuery<T>) => void): IElasticSearch<T> {
        if (!this.elasticQuery) {
            this.elasticQuery = new ElasticQuery<T>();
        }

        fn(this.elasticQuery);

        return this;
    }

    aggregate(name: string, fn: (aggregate: IElasticAggregation<T>) => void): IElasticSearch<T> {
        if (!this.elasticAggregates.has(name)) {
            this.elasticAggregates.set(name, new ElasticAggregation<T>(name));
        }

        fn(this.elasticAggregates.get(name));

        return this;
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

    compose(): any {
        var json = { "query": { "filtered": {} } };
        if (this.elasticFilter) {
            json["query"]["filtered"]["filter"] = this.elasticFilter.compose();
        }

        if (this.elasticQuery) {
            json["query"]["filtered"]["query"] = this.elasticQuery.compose();
        }

        if (this.elasticAggregates.size > 0) {
            json["aggs"] = {};
            this.elasticAggregates.forEach((agg, name) => {
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
    }

    toJson(): any {
        return JSON.stringify(this.compose());
    }

    execute(): Promise<IElasticSearchResult<T>> {
        throw new Error("Not implemented. Derive your own base search class to execute the query.");
    }
}

class AstVisitor {
    public visitChain: ESTree.Node[] = [];

    protected visit(node: ESTree.Node): string {
        this.visitChain.push(node);
        var result: string;
        switch (node.type) {
            case esprima.Syntax.Program:
                result = this.visitProgram(<ESTree.Program>node)
                break;
            case esprima.Syntax.BinaryExpression:
                result = this.visitBinary(<ESTree.BinaryExpression>node);
                break;
            case esprima.Syntax.UnaryExpression:
                result = this.visitUnary(<ESTree.UnaryExpression>node);
                break;
            case esprima.Syntax.MemberExpression:
                result = this.visitMember(<ESTree.MemberExpression>node);
                break;
            case esprima.Syntax.ExpressionStatement:
                result = this.visitExpression(<ESTree.ExpressionStatement>node);
                break;
            case esprima.Syntax.FunctionExpression:
                result = this.visitFunctionExpression(<ESTree.FunctionExpression>node);
                break;
            case esprima.Syntax.BlockStatement:
                result = this.visitBlockStatement(<ESTree.BlockStatement>node);
                break;
            case esprima.Syntax.ReturnStatement:
                result = this.visitReturn(<ESTree.ReturnStatement>node);
                break;
            case esprima.Syntax.Identifier:
                result = this.visitIdentifier(<ESTree.Identifier>node);
                break;
            case esprima.Syntax.Literal:
                result = this.visitLiteral(<ESTree.Literal>node);
                break;
            case esprima.Syntax.Property:
                result = this.visitProperty(<ESTree.Property>node);
                break;
            default:
                throw new Error("Invalid node type " + node.type);
        }

        this.visitChain.pop();
        return result;
    }

    protected visitProgram(node: ESTree.Program): string {
        return node.body.map(d => this.visit(d)).join();
    }

    protected visitBinary(node: ESTree.BinaryExpression): string {
        this.visit(node.left);
        this.visit(node.right);
        return "";
    }

    protected visitUnary(node: ESTree.UnaryExpression): string {
        this.visit(node.argument);
        return "";
    }

    protected visitMember(node: ESTree.MemberExpression): string {
        this.visit(node.object);
        this.visit(node.property);
        return "";
    }

    protected visitLogical(node: ESTree.LogicalExpression) {
        this.visit(node.left);
        this.visit(node.right);
        return "";
    }

    protected visitExpression(node: ESTree.ExpressionStatement) {
        return this.visit(node.expression);
    }

    protected visitReturn(node: ESTree.ReturnStatement): string {
        return this.visit(node.argument);
    }

    protected visitFunctionExpression(node: ESTree.FunctionExpression): string {
        return this.visit(node.body);
    }

    protected visitBlockStatement(node: ESTree.BlockStatement): string {
        node.body.forEach(d => this.visit(d));
        return "";
    }

    protected visitIdentifier(node: ESTree.Identifier): string {
        return "";
    }

    protected visitLiteral(node: ESTree.Literal): string {
        return "";
    }

    protected visitProperty(node: ESTree.Property): string {
        return "";
    }
}

class PropertyVisitor extends AstVisitor {
    public static getProperty(fn: any, omitFirst: boolean = true) {
        var visitor = new PropertyVisitor(fn);
        var property = visitor.property;
        if (omitFirst) {
            var dotIndex = property.indexOf('.');
            if (dotIndex > 0) {
                property = property.slice(dotIndex + 1);
            }
        }

        return property;
    }

    property: string;

    constructor(func: any) {
        super();
        var tree = esprima.parse("(" + func.toString() + ")");
        this.visit(tree);
    }

    protected visitMember(node: ESTree.MemberExpression): string {
        var propAsId = <ESTree.Identifier>node.property;
        this.visit(node.object);
        this.property = this.property + '.' + propAsId.name;

        return "";
    }
}
