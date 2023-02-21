export declare function runNextFrame(): void;
export declare function runWhenStartingPietemListeners(whatToRun: any): void;
export declare function runWhenStoppingPietemListeners(whatToRun: any): void;
export declare function _setState(newState: any, callback?: any): void;
export declare function _removeItem({ type: itemType, name: itemName }: {
    type: string;
    name: string;
}, callback?: any): void;
export declare function _addItem({ type, name, state, refs, }: {
    type: string;
    name: string;
    state?: any;
    refs?: any;
}, callback?: any): void;
