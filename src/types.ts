import { UntypedDiffInfo } from "./meta";
import { RepondTypes } from "./declarations";

// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type KeysOfUnion<T> = T extends any ? keyof T : never;

// TODO FIXME this type is duplicated in types
// There should only be one format?
export type EffectCheck<T_State extends { [key: string]: any }, T_ItemType extends string> =
  | {
      types?: [T_ItemType];
      ids?: string[];
      props?: KeysOfUnion<NonNullable<T_State[T_ItemType]>[keyof T_State[T_ItemType]]>[];
      addedOrRemoved?: boolean;
    }
  | {
      types?: T_ItemType;
      ids?: string[];
      props?: KeysOfUnion<NonNullable<T_State[T_ItemType]>[keyof T_State[T_ItemType]]>[];
      addedOrRemoved?: boolean;
    };

// https://stackoverflow.com/a/55930310 Readonly object , Ben Carp

export type DeepReadonly<T> =
  // tslint:disable-next-line: ban-types
  T extends AnyFunction | Primitive
    ? T // eslint-disable-next-line @typescript-eslint/no-unused-vars
    : T extends ReadonlyArray<infer R>
    ? T
    : T extends ReadonlyMap<infer K, infer V>
    ? IDRMap<K, V>
    : T extends ReadonlySet<infer ItemType>
    ? ReadonlySetDeep<ItemType>
    : T extends object
    ? DeepReadonlyObject<T>
    : T;

export type Primitive = null | undefined | string | number | boolean | symbol | bigint;

export type AnyFunction = (...args: any[]) => any;

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

interface IDRMap<K, V> extends ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>> {}

interface ReadonlySetDeep<ItemType> extends ReadonlySet<DeepReadonly<ItemType>> {}
//

// ----------------------------
// stuff from makeRepond

// type Without<T, K> = Pick<T, Exclude<keyof T, K>>;
type WithoutB<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object ? (WithoutB<T, U> & U) | (WithoutB<U, T> & T) : T | U;
// NOTE: could use ts-xor package (same)

export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };

// export type GetReadOnlyState<T_State> = {
//   [P_Type in keyof T_State]?: {
//     [P_Name in keyof T_State[P_Type]]?: {
//       [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name]
//         ? Readonly<T_State[P_Type][P_Name][P_Property]>
//         : never;
//     };
//   };
// };

export type GetPartialState<T_State> = {
  [P_Type in keyof T_State]?: {
    [P_Name in keyof T_State[P_Type]]?: {
      [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name]
        ? T_State[P_Type][P_Name][P_Property]
        : never;
    };
  };
};

export type ExtendsString<T> = T extends string ? T : never;

// ------------------------------------

export type RepondCallback = (frameDuration: number, frameTime: number) => any;

export type SetRepondState<T_State> = (
  newState: GetPartialState<T_State> | ((state: DeepReadonly<T_State>) => GetPartialState<T_State> | undefined),
  callback?: RepondCallback
) => void;

export type EffectPhase = "duringStep" | "endOfStep";

// ---------------------------------------------------------------------------------------------------------------------

export type StepName = RepondTypes["StepNames"][number];
type AllStoreInfo = RepondTypes["AllStoreInfo"]; // TODO rename?
export type ItemType = keyof AllStoreInfo;

export type DefaultStates = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["state"];
};
export type DefaultRefs = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["refs"];
};
type Get_DefaultRefs<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["refs"];

// Make a type that has the start states of all the stores
export type StartStates = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"];
};

export type StartStatesItemId<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["startStates"] extends Record<
  string,
  any
>
  ? keyof AllStoreInfo[K_Type]["startStates"]
  : string;

// make an AllState type that conditionally uses the keys and values of startStates if available or otherwise uses string as the key and the return type of the default "state"  (for that store) as the value
export type AllState = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"] extends Record<string, any>
    ? AllStoreInfo[K_Type]["startStates"]
    : Record<string, ReturnType<AllStoreInfo[K_Type]["state"]>>;
};

// Make an AllRefs type that uses Get_DefaultRefs for each store
export type AllRefs = {
  [K_Type in ItemType]: Record<
    StartStatesItemId<K_Type>,
    ReturnType<Get_DefaultRefs<K_Type>> // NOTE: refs wont be generic typed, generic ReturnType doesn't seem to work with nested generic function types like Blah<_T_Blah>["blah"]<T_Paramter>
  >;
};

export type ItemId<K_Type extends ItemType> = ExtendsString<KeysOfUnion<AllState[K_Type]>>;
export type PropName<K_Type extends ItemType> = KeysOfUnion<AllState[K_Type][ItemId<K_Type>]> & string;
export type AllProps = { [K_Type in ItemType]: PropName<K_Type> }[ItemType];

export type ItemIdsByType = {
  [K_Type in ItemType]: ItemId<K_Type>[];
};

type OriginalGroupNames = keyof RepondTypes["GroupedEffects"];
type RefinedGroupNames = RemoveEffectsSuffix<OriginalGroupNames>;

// Helper type to strip "Effects" suffix from group names
type RemoveEffectsSuffix<T extends string> = T extends `${infer Prefix}Effects` ? Prefix : T;

export type RefinedGroupedEffects = {
  [K in keyof RepondTypes["GroupedEffects"] as RemoveEffectsSuffix<K>]: RepondTypes["GroupedEffects"][K];
};

// ------------------------------------------------------------
// DiffInfo

type DiffInfo_PropsChanged = {
  [K_Type in ItemType]: Record<ItemId<K_Type>, PropName<K_Type>[]> & {
    all__: PropName<K_Type>[];
  };
} & { all__: AllProps[] };

type DiffInfo_PropsChangedBool = {
  [K_Type in ItemType]: Record<ItemId<K_Type>, { [K_PropName in PropName<K_Type>]: boolean }> & {
    all__: {
      [K_PropName in PropName<K_Type>]: boolean;
    };
  };
} & {
  all__: { [K_PropName in AllProps]: boolean };
};

type DiffInfo_ItemsChanged = Record<ItemType | "all__", ItemId<ItemType>[]>;

type DiffInfo_ItemsChangedBool = Record<ItemType | "all__", Record<ItemId<ItemType>, boolean>>;

export type DiffInfo = {
  itemTypesChanged: ItemType[];
  itemsChanged: DiffInfo_ItemsChanged;
  propsChanged: DiffInfo_PropsChanged;
  itemsAdded: DiffInfo_ItemsChanged;
  itemsRemoved: DiffInfo_ItemsChanged;
  itemTypesChangedBool: Record<ItemType | "all__", boolean>;
  itemsChangedBool: DiffInfo_ItemsChangedBool;
  propsChangedBool: DiffInfo_PropsChangedBool;
  itemsAddedBool: DiffInfo_ItemsChangedBool;
  itemsRemovedBool: DiffInfo_ItemsChangedBool;
};

// ------------------------------------------------------------

export type ItemEffect_Run_Params<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
  itemId: ItemId<K_Type>;
  newValue: AllState[K_Type][ItemId<K_Type>][K_PropName];
  prevValue: AllState[K_Type][ItemId<K_Type>][K_PropName];
  itemState: AllState[K_Type][ItemId<K_Type>];
  // itemRefs: T_Refs[K_Type][keyof T_Refs[K_Type]];
  itemRefs: AllRefs[K_Type][ItemId<K_Type>];
  // itemRefs: Get_T_Refs<K_Type>[ItemId<K_Type>];
  frameDuration: number;
  ranWithoutChange?: boolean;
};

export type ItemEffect_Check_Becomes =
  | undefined
  | string
  | number
  | boolean
  | ((theValue: any, prevValue: any) => boolean);

// -----------------
// Use Store Item NOTE may be able to reuse some of the ItemEffect check?
type UseStoreItem_Check_OneItem_OneProp<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
  prop?: K_PropName;
  type: K_Type;
  id: ItemId<K_Type>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};
type UseStoreItem_Check_OneItem_MultiProps<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
  prop?: K_PropName[];
  type: K_Type; // maybe ideally optional (and handle adding effect with any item type)
  id: ItemId<K_Type>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};
export type UseStoreItem_Check_OneItem<K_Type extends ItemType, K_PropName extends PropName<K_Type>> =
  | UseStoreItem_Check_OneItem_OneProp<K_Type, K_PropName>
  | UseStoreItem_Check_OneItem_MultiProps<K_Type, K_PropName>;

// -----------------
// Item Effect
type ItemEffect_Check_OneProp<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
  prop?: K_PropName;
  type: K_Type;
  id?: ItemId<K_Type>[] | ItemId<K_Type>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};
type ItemEffect_Check_MultiProps<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
  prop?: K_PropName[];
  type: K_Type; // maybe ideally optional (and handle adding listener with any item type)
  id?: ItemId<K_Type>[] | ItemId<K_Type>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};
export type ItemEffect_Check<K_Type extends ItemType, K_PropName extends PropName<K_Type>> =
  | ItemEffect_Check_OneProp<K_Type, K_PropName>
  | ItemEffect_Check_MultiProps<K_Type, K_PropName>;

export type ItemEffect_Run<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = (
  loopedInfo: ItemEffect_Run_Params<K_Type, K_PropName>
) => void;

export type ItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
  check: ItemEffect_Check<K_Type, K_PropName>;
  // can use function to check value, ideally it uses the type of the selected property
  run: ItemEffect_Run<K_Type, K_PropName>;
  atStepEnd?: boolean;
  id?: string;
  step?: StepName;
  runAtStart?: boolean;
};
// export type ItemEffect_ForGroup<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = ItemEffect<
//   K_Type,
//   K_PropName
// > & { _isPerItem?: true };

// -----------------
// Easy Effect
type EasyEffect_Check_OneItemType<K_Type extends ItemType> = {
  type?: K_Type;
  id?: ItemId<K_Type> | ItemId<K_Type>[];
  prop?: PropName<K_Type>[];
  addedOrRemoved?: boolean;
  becomes?: undefined;
};

/*
  // if it's an array of objects with multiple item types, this needs to be used
  [
    { type: ["characters"], id: "walker", prop: ["position"] },
    { type: ["global"], id: "main", prop: ["planePosition"] },
  ]);
  // "characters" and "global" need to be in array array so
  // the MultiItemTypes type's chosen
  */
type EasyEffect_Check_MultiItemTypes = {
  type?: ItemType[];
  id?: ItemId<ItemType> | ItemId<ItemType>[];
  prop?: AllProps[];
  addedOrRemoved?: boolean;
  becomes?: undefined;
};

export type EasyEffect_OneCheck<K_Type extends ItemType> =
  | EasyEffect_Check_OneItemType<K_Type>
  | EasyEffect_Check_MultiItemTypes;

export type EasyEffect_Check<K_Type extends ItemType> = EasyEffect_OneCheck<K_Type>[] | EasyEffect_OneCheck<K_Type>;

export type EasyEffect_Run = (
  diffInfo: DiffInfo,
  frameDuration: number,
  ranWithoutChange?: boolean // for useStoreItemEffect, to run the effect regardless of changes
) => void;

export type EasyEffect<K_Type extends ItemType> = {
  id?: string;
  check: EasyEffect_Check<K_Type>;
  run: EasyEffect_Run;
  atStepEnd?: boolean;
  step?: StepName;
  runAtStart?: boolean;
};

export type MakeEffects_Effect = Effect<ItemType>;

// -----------------
// Effect

type Effect_OneCheck_OneItemType<K_Type extends ItemType> = {
  types?: K_Type;
  ids?: ItemId<K_Type>[];
  props?: PropName<K_Type>;
  addedOrRemoved?: boolean;
};

export type Effect_OneCheck_MultiItemTypes = {
  types?: (keyof AllState)[];
  ids?: ItemId<ItemType>[];
  props?: AllProps[];
  addedOrRemoved?: boolean;
};

// NOTE: the type works, but autocomplete doesn't work ATM when
// trying to make properties/addedOrRemoved exclusive
// type TestChangeToCheckUnionWithProperties<T, K> = XOR<
//   Omit<TestChangeToCheckMultiItemTypes<T>, "addedOrRemoved">,
//   Omit<TestChangeToCheckOneItemType<T, K>, "addedOrRemoved">
// >;
// type TestChangeToCheckUnionWithoutProperties<T, K> = XOR<
//   Omit<TestChangeToCheckMultiItemTypes<T>, "properties">,
//   Omit<TestChangeToCheckOneItemType<T, K>, "properties">
// >;

// type TestChangeToCheckUnion<T, K> = XOR<
//   TestChangeToCheckUnionWithProperties<T, K>,
//   TestChangeToCheckUnionWithoutProperties<T, K>
// >;

export type Effect_OneCheck<K_Type extends ItemType> =
  | Effect_OneCheck_OneItemType<K_Type>
  | Effect_OneCheck_MultiItemTypes;

export type Effect_Check<K_Type extends ItemType> = Effect_OneCheck<K_Type>[];

export type UntypedEffect = {
  id: string;
  check: EffectCheck<any, any>[];
  run: (diffInfo: UntypedDiffInfo, frameDuration: number) => void;
  atStepEnd?: boolean;
  step?: string;
};

export type Effect<K_Type extends ItemType> = {
  id: string;
  check: Effect_Check<K_Type>;
  run: (diffInfo: DiffInfo, frameDuration: number) => void;
  atStepEnd?: boolean;
  step?: StepName;
};
