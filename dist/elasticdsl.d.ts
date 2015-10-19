declare module ElasticDsl {
    interface IElasticFn<T> {
        (fn: IElasticFilter<T>): IElasticTerminal<T>;
    }
    interface IElasticProp<T> {
        (it: T): any;
    }
    interface IElasticQuery<T> {
        toJson(): any;
        compose(): any;
    }
    interface IElasticSearch<T> {
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
    interface IElasticFilterBase {
    }
    interface IElasticTerminal<T> {
        back(): IElasticFilter<T>;
        compose(): any;
        toJson(): string;
        execute(): Promise<IElasticSearchResult<T>>;
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
        searchRoot: IElasticSearch<T>;
    }
    interface IElasticBoolFilter<T> extends IElasticFilter<T> {
        must(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        mustnot(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        should(fn: IElasticFn<T>): IElasticBoolFilter<T>;
    }
    interface IElasticAggregation<T> {
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
    interface ISingleValueMetric<TMetricType> extends IAggregationResult<ISingleValueMetric<TMetricType>> {
        value: TMetricType;
    }
    interface IMultiValueMetric<TMetricType> extends IAggregationResult<IMultiValueMetric<TMetricType>> {
        values: TMetricType[];
    }
    interface IStatsResult extends IAggregationResult<IStatsResult> {
        count: number;
        min: number;
        max: number;
        avg: number;
        sum: number;
    }
    interface IExtendedStatsResult extends IAggregationResult<IExtendedStatsResult> {
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
    interface IAggregationResult<TAgg> {
        name: string;
        read(result: IElasticSearchResult<any>): TAgg;
    }
    interface IElasticHit<T> {
        _index: string;
        _type: string;
        _id: string;
        _source: T;
    }
    interface IElasticSearchResult<T> {
        _shards: {
            total: number;
            succesfull: number;
            failed: number;
        };
        hits: {
            total: number;
            hits: IElasticHit<T>[];
        };
        aggregations: any;
    }
}
declare module ElasticDsl {
    class ElasticTerminalFilter<T> implements IElasticTerminal<T> {
        private localParent;
        constructor(parent?: ElasticFilter<T>);
        back(): IElasticFilter<T>;
        cast<TCast extends ElasticTerminalFilter<T>>(): TCast;
        compose(): any;
        toJson(): string;
        execute(): Promise<IElasticSearchResult<T>>;
        private getSearchRoot();
    }
    class ElasticFilter<T> extends ElasticTerminalFilter<T> implements IElasticFilter<T> {
        parent: ElasticFilter<T>;
        siblings: ElasticFilter<T>[];
        children: IElasticTerminal<T>[];
        searchRoot: IElasticSearch<T>;
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
        compose(): any;
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
        compose(): any;
        private checkSingleChild(filter);
    }
    class ElasticAndFilter<T> extends ElasticRootedFilter<T, ElasticAndFilter<T>> {
        conditions: ElasticAndFilter<T>[];
        constructor(parent?: ElasticFilter<T>, root?: ElasticAndFilter<T>);
        and(fn: IElasticFn<T>): IElasticFilter<T>;
        compose(): any;
    }
    class ElasticOrFilter<T> extends ElasticRootedFilter<T, ElasticOrFilter<T>> {
        conditions: ElasticOrFilter<T>[];
        constructor(parent?: ElasticFilter<T>, root?: ElasticOrFilter<T>);
        or(fn: IElasticFn<T>): IElasticFilter<T>;
        compose(): any;
    }
    class ElasticRawFilter<T> extends ElasticTerminalFilter<T> {
        rawObject: any;
        constructor(rawJson: any, parent?: ElasticFilter<T>);
        compose(): any;
    }
    class ElasticAggregateResult implements IAggregationResult<any> {
        name: string;
        constructor(name: string);
        read(result: IElasticSearchResult<any>): any;
    }
    class ElasticAggregation<T> implements IElasticAggregation<T> {
        private name;
        private localBucketFilter;
        private children;
        private aggObject;
        constructor(name: string);
        subAggregate(name: string): IElasticAggregation<T>;
        bucketFilter(fn: IElasticFn<T>): IElasticAggregation<T>;
        min(field: IElasticProp<T>): ISingleValueMetric<number>;
        max(field: IElasticProp<T>): ISingleValueMetric<number>;
        sum(field: IElasticProp<T>): ISingleValueMetric<number>;
        avg(field: IElasticProp<T>): ISingleValueMetric<number>;
        count(field: IElasticProp<T>): ISingleValueMetric<number>;
        stats(field: IElasticProp<T>): IStatsResult;
        extendedStats(field: IElasticProp<T>): IExtendedStatsResult;
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
        compose(): any;
    }
    class ElasticSearch<T> implements IElasticSearch<T> {
        private elasticFilter;
        private elasticQuery;
        private elasticAggregates;
        private size;
        private from;
        private sort;
        filter(fn: (filter: IElasticFilter<T>) => void): IElasticSearch<T>;
        query(fn: (query: IElasticQuery<T>) => void): IElasticSearch<T>;
        aggregate(name: string, fn: (aggregate: IElasticAggregation<T>) => void): IElasticSearch<T>;
        take(amount: number): IElasticSearch<T>;
        skip(amount: number): IElasticSearch<T>;
        sortBy(field: IElasticProp<T>, ascending?: boolean): IElasticSearch<T>;
        sortByDesc(field: IElasticProp<T>): IElasticSearch<T>;
        compose(): any;
        toJson(): any;
        execute(): Promise<IElasticSearchResult<T>>;
    }
}
