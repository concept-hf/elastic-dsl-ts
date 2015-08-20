export declare module ElasticDsl {
    interface IElasticFn<T> {
        (fn: IElasticFilter<T>): IElasticTerminal<T>;
    }
    interface IElasticProp<T> {
        (it: T): any;
    }
    interface IElasticQuery<T> {
        toJson(): any;
    }
    interface IElasticSearch<T> {
        filter(): IElasticFilter<T>;
        query(): IElasticQuery<T>;
        toJson(): any;
        take(amount: number): IElasticSearch<T>;
        skip(amount: number): IElasticSearch<T>;
        sortBy(prop: IElasticProp<T>): IElasticSearch<T>;
        sortByDesc(field: IElasticProp<T>): IElasticSearch<T>;
    }
    interface IElasticFilterBase {
    }
    interface IElasticTerminal<T> {
        back(): IElasticFilter<T>;
        compose(): any;
        toJson(): string;
    }
    interface IElasticFilter<T> extends IElasticTerminal<T>, IElasticFilterBase {
        and(fn: IElasticFn<T>): IElasticFilter<T>;
        or(fn: IElasticFn<T>): IElasticFilter<T>;
        bool(): IElasticBoolFilter<T>;
        exists(field: IElasticProp<T>): IElasticTerminal<T>;
        ids(idList: any[]): IElasticTerminal<T>;
        limit(amount: number): IElasticTerminal<T>;
        matchAll(): IElasticTerminal<T>;
        missing(field: IElasticProp<T>): IElasticTerminal<T>;
        not(): IElasticFilter<T>;
        prefix(prop: IElasticProp<T>, prefix: string): IElasticTerminal<T>;
        query(cache?: boolean): IElasticQuery<T>;
        lte(field: IElasticProp<T>, lte: number): IElasticTerminal<T>;
        lt(field: IElasticProp<T>, lt: number): IElasticTerminal<T>;
        gte(field: IElasticProp<T>, gte: number): IElasticTerminal<T>;
        gt(field: IElasticProp<T>, gt: number): IElasticTerminal<T>;
        range(prop: IElasticProp<T>, lte?: number, lt?: number, gte?: number, gt?: number): IElasticTerminal<T>;
        regExp(prop: IElasticProp<T>, regex: string): IElasticTerminal<T>;
        term(prop: IElasticProp<T>, term: string): IElasticTerminal<T>;
        terms(prop: IElasticProp<T>, terms: string[]): IElasticTerminal<T>;
        wrap(): IElasticFilter<T>;
        raw(obj: any): IElasticTerminal<T>;
        eq(prop: IElasticProp<T>, val: string): IElasticTerminal<T>;
    }
    interface IElasticBoolFilter<T> extends IElasticFilter<T> {
        must(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        mustnot(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        should(fn: IElasticFn<T>): IElasticBoolFilter<T>;
    }
    class ElasticTerminalFilter<T> implements IElasticTerminal<T> {
        private localParent;
        constructor(parent?: ElasticFilter<T>);
        back(): IElasticFilter<T>;
        cast<TCast extends ElasticTerminalFilter<T>>(): TCast;
        compose(): any;
        toJson(): string;
    }
    class ElasticFilter<T> extends ElasticTerminalFilter<T> implements IElasticFilter<T> {
        parent: ElasticFilter<T>;
        siblings: ElasticFilter<T>[];
        children: ElasticFilter<T>[];
        constructor(parent?: ElasticFilter<T>);
        wrap(): IElasticFilter<T>;
        and(fn: IElasticFn<T>): IElasticFilter<T>;
        or(fn: IElasticFn<T>): IElasticFilter<T>;
        bool(): IElasticBoolFilter<T>;
        exists(field: IElasticProp<T>): IElasticTerminal<T>;
        ids(idList: any[]): IElasticTerminal<T>;
        limit(amount: number): IElasticTerminal<T>;
        matchAll(): IElasticTerminal<T>;
        missing(field: IElasticProp<T>): IElasticTerminal<T>;
        not(): IElasticFilter<T>;
        prefix(field: IElasticProp<T>, prefix: string): ElasticRawFilter<T>;
        query(cache?: boolean): IElasticQuery<T>;
        lte(field: IElasticProp<T>, lte: number): IElasticTerminal<T>;
        lt(field: IElasticProp<T>, lt: number): IElasticTerminal<T>;
        gt(field: IElasticProp<T>, gt: number): IElasticTerminal<T>;
        gte(field: IElasticProp<T>, gte: number): IElasticTerminal<T>;
        range(field: IElasticProp<T>, lte?: number, lt?: number, gte?: number, gt?: number): IElasticTerminal<T>;
        regExp(field: IElasticProp<T>, regex: string): IElasticTerminal<T>;
        term(field: IElasticProp<T>, term: string): IElasticTerminal<T>;
        terms(field: IElasticProp<T>, terms: string[]): IElasticTerminal<T>;
        raw(obj: any): ElasticRawFilter<T>;
        eq(field: IElasticProp<T>, val: string): IElasticTerminal<T>;
        protected composeChildren(): any[];
        protected composeChild(): any;
    }
    class ElasticRootedFilter<T, TRoot> extends ElasticFilter<T> {
        root: TRoot;
        constructor(parent?: ElasticFilter<T>, root?: TRoot);
    }
    class ElasticBoolFilter<T> extends ElasticRootedFilter<T, ElasticBoolFilter<T>> implements IElasticBoolFilter<T> {
        mustFilter: ElasticBoolFilter<T>;
        mustNotFilter: ElasticBoolFilter<T>;
        shouldFilter: ElasticBoolFilter<T>;
        constructor(parent?: ElasticFilter<T>, root?: ElasticBoolFilter<T>);
        must(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        mustnot(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        should(fn: IElasticFn<T>): IElasticBoolFilter<T>;
    }
    class ElasticAndFilter<T> extends ElasticRootedFilter<T, ElasticAndFilter<T>> {
        conditions: ElasticAndFilter<T>[];
        constructor(parent?: ElasticFilter<T>, root?: ElasticAndFilter<T>);
        and(fn: IElasticFn<T>): IElasticFilter<T>;
    }
    class ElasticOrFilter<T> extends ElasticRootedFilter<T, ElasticOrFilter<T>> {
        conditions: ElasticOrFilter<T>[];
        constructor(parent?: ElasticFilter<T>, root?: ElasticOrFilter<T>);
        or(fn: IElasticFn<T>): IElasticFilter<T>;
    }
    class ElasticRawFilter<T> extends ElasticTerminalFilter<T> {
        rawObject: any;
        constructor(rawJson: any, parent?: ElasticFilter<T>);
        compose(): any;
    }
    interface ElasticComposerFn<T> {
        (compositor: ElasticDirectComposited<T>): any;
    }
    class ElasticDirectComposited<T> extends ElasticFilter<T> {
        compositor: ElasticComposerFn<T>;
        constructor(compositor: ElasticComposerFn<T>, parent?: ElasticFilter<T>);
        composite(): any;
    }
    class ElasticQuery<T> implements IElasticQuery<T> {
        toJson(): any;
    }
    class ElasticSearch<T> implements IElasticSearch<T> {
        private elasticFilter;
        private elasticQuery;
        private size;
        private from;
        private sort;
        filter(): IElasticFilter<T>;
        query(): IElasticQuery<T>;
        take(amount: number): IElasticSearch<T>;
        skip(amount: number): IElasticSearch<T>;
        sortBy(field: IElasticProp<T>, ascending?: boolean): IElasticSearch<T>;
        sortByDesc(field: IElasticProp<T>): IElasticSearch<T>;
        toJson(): any;
    }
}
