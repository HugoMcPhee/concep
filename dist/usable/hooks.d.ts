import { repondMeta as meta } from "../meta";
import { AllState, Effect, ItemPropsByType, ItemType } from "../types";
export declare function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(whatToReturn: (diffInfo: typeof meta.diffInfo) => T_ReturnedRepondProps, options: Omit<Effect, "run">, hookDeps?: any[]): T_ReturnedRepondProps;
export declare function useStoreEffect<K_Type extends ItemType>(run: Effect["run"], options: Omit<Effect, "run">, hookDeps?: any[] | undefined): void;
export declare function useStoreItem<K_Type extends ItemType, T_ReturnType>(itemEffectCallback: (itemState: AllState[K_Type][keyof AllState[K_Type]]) => T_ReturnType, options: {
    id: string;
    type: K_Type;
    props: ItemPropsByType[K_Type];
}, hookDeps?: any[]): T_ReturnType;
