declare module ElasticDsl {
    export interface IElasticFn<T> {
        (fn: IElasticFilter<T>): IElasticTerminal<T>;
    }

    export interface IElasticProp<T> {
        (it: T): any;
    }

    export interface IElasticQuery<T> {
        toJson(): any;
    }

    export interface IElasticSearch<T> {
        filter(): IElasticFilter<T>;
        query(): IElasticQuery<T>;
        toJson(): any;
        take(amount: number): IElasticSearch<T>;
        skip(amount: number): IElasticSearch<T>;
        sortBy(prop: IElasticProp<T>): IElasticSearch<T>;
        sortByDesc(field: IElasticProp<T>): IElasticSearch<T>;
    }

    export interface IElasticFilterBase {

    }

    export interface IElasticTerminal<T> {
        back(): IElasticFilter<T>;
        compose(): any;
        toJson(): string;
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
    }

    export interface IElasticBoolFilter<T> extends IElasticFilter<T> {
        must(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        mustnot(fn: IElasticFn<T>): IElasticBoolFilter<T>;
        should(fn: IElasticFn<T>): IElasticBoolFilter<T>;
    }
}
