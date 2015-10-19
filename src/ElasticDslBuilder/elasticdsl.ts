declare module ElasticDsl {
    export interface IElasticFn<T> {
        (fn: IElasticFilter<T>): IElasticTerminal<T>;
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
        and(fn: IElasticFn<T>): IElasticFilter<T>;
        or(fn: IElasticFn<T>): IElasticFilter<T>;
        bool(): IElasticBoolFilter<T>;
        exists(field: IElasticProp<T>): IElasticTerminal<T>;
        ids(idList: any[]): IElasticTerminal<T>;
        limit(amount: number): IElasticTerminal<T>;
        matchAll(): IElasticTerminal<T>;
        missing(field: IElasticProp<T>): IElasticTerminal<T>;
        // nested<TNested>(prop: (it: T) => TNested): IElasticFilter<TNested>;
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
        _shards: {total: number, succesfull: number, failed: number};
        hits: { total: number, hits: IElasticHit<T>[] };
        aggregations: any;
    }
}
