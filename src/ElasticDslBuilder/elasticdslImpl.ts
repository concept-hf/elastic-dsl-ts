module ElasticDsl {
    export class ElasticTerminalFilter<T> implements IElasticTerminal<T> {
        private localParent: ElasticFilter<T>;

        constructor(parent?: ElasticFilter<T>) {
            this.localParent = parent;
            if (parent) {
                parent.children.push(this);
            }
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

    export class ElasticFilter<T> extends ElasticTerminalFilter<T> implements IElasticFilter<T> {

        parent: ElasticFilter<T>;
        siblings: ElasticFilter<T>[] = [];
        children: IElasticTerminal<T>[] = [];
        searchRoot: IElasticSearch<T>;

        constructor(parent?: ElasticFilter<T>) {
            super(parent);
            this.parent = parent;
            if (parent) {
                this.searchRoot = parent.searchRoot;
                // parent.children.push(this);
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

        compose(): any {
            if (!this.root) {
                var result = {};
                if (this.mustFilter) {
                    this.checkSingleChild(this.mustFilter);
                    result["must"] = this.mustFilter.children[0].compose();
                }

                if (this.mustNotFilter) {
                    this.checkSingleChild(this.mustFilter);
                    result["mustnot"] = this.mustNotFilter.children[0].compose();
                }

                if (this.shouldFilter) {
                    this.checkSingleChild(this.shouldFilter);
                    result["should"] = this.shouldFilter.children[0].compose();
                }
            }

            throw new Error("Only root 'bool' filter is composable");
        }

        private checkSingleChild(filter: ElasticBoolFilter<T>) {
            if (filter.children.length != 1) {
                throw new Error("Filter should have exactly one child");
            }
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
            var andFilter = new ElasticAndFilter<T>(this, this.root == null ? this : this.root);
            fn(andFilter);
            return andFilter;
        }

        compose(): any {
            if (!this.root) {
                var childComposites = []
                this.conditions.forEach(d => {
                    if (d.children.length == 1 && !(d.children[0] instanceof ElasticAndFilter)) {
                        childComposites.push(d.children[0].compose());
                    }
                });
                return {
                    "and": childComposites
                }
            }

            throw new Error("Only root 'and' filter is composable");
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
            var andFilter = new ElasticOrFilter<T>(this, this.root == null ? this : this.root);
            fn(andFilter);
            return andFilter;
        }

        compose(): any {
            if (!this.root) {
                var childComposites = []
                this.conditions.forEach(d => {
                    if (d.children.length == 1 && !(d.children[0] instanceof ElasticOrFilter)) {
                        childComposites.push(d.children[0].compose());
                    }
                });
                return {
                    "or": childComposites
                }
            }

            throw new Error("Only root 'or' filter is composable");
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

    export class ElasticAggregateResult implements IAggregationResult<any> {
        name: string;

        constructor(name: string) {
            this.name = name;
        }

        read(result: IElasticSearchResult<any>): any {
            return result.aggregations[this.name];
        }
    }

    export class ElasticAggregation<T> implements IElasticAggregation<T>{
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
            if (!this.bucketFilter) {
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
            if (this.bucketFilter || this.children.size > 0) {
                if (this.bucketFilter) {
                    res["filter"] = this.localBucketFilter.compose();
                }
                if (this.children.size > 0) {
                    res["aggs"] = {};
                    this.children.forEach((agg, name) => {
                        res["aggs"][name] = agg.compose();
                    });
                }
            } else {
                res[this.name] = this.aggObject;
            }

            return res;
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
            this.property = this.property + '.' + propAsId.name;
            this.visit(node.object);
            return "";
        }
    }
}