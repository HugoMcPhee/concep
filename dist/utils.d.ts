export declare function cloneObjectWithJson(theObject: {
    [key: string]: any;
}): any;
export declare function toSafeArray<T_Item>(theValue: T_Item | T_Item[] | undefined): NonNullable<T_Item>[] | undefined;
export declare function asArray<T_Item>(theValue: T_Item | T_Item[] | undefined): T_Item[];
export declare function makeRefsStructureFromRepondState(): void;
