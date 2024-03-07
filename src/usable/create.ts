import { makeCopyStatesFunction } from "../copyStates";
import { createDiffInfo, makeGetStatesDiffFunction } from "../getStatesDiff";
import { getRepondStructureFromDefaults, makeRefsStructureFromRepondState } from "../getStructureFromDefaults";
import meta from "../meta";
import { AllState, DefaultRefs, DefaultStates, ItemType, StartStatesItemId, StepName } from "../types";
import { createRecordedChanges } from "../updating";
import { cloneObjectWithJson } from "../utils";

/*
can 'check' get clearer?
can check have single or arrays for every property, or would that widen all types?
*/

export function initRepond<
  T_AllInfo extends {
    [StoreName: string]: {
      state: (itemId: any) => any;
      refs: (itemId: any, type: any) => any;
      startStates?: Record<any, any>;
    };
  },
  T_StepNamesParam extends Readonly<string[]>
>(
  allInfo: T_AllInfo,
  extraOptions?: {
    stepNames: T_StepNamesParam;
    dontSetMeta?: boolean; // when only wanting to use makeRepond for the types
    framerate?: "full" | "half" | "auto";
  }
) {
  const { dontSetMeta } = extraOptions ?? {};

  const itemTypes = Object.keys(allInfo) as unknown as Readonly<ItemType[]>;

  const stepNamesUntyped = extraOptions?.stepNames ? [...extraOptions.stepNames] : ["default"];
  if (!stepNamesUntyped.includes("default")) stepNamesUntyped.push("default");

  const stepNames: Readonly<StepName[]> = [...stepNamesUntyped];

  meta.frameRateTypeOption = extraOptions?.framerate || "auto";
  if (meta.frameRateTypeOption === "full") meta.frameRateType = "full";
  else if (meta.frameRateTypeOption === "half") meta.frameRateType = "half";
  else if (meta.frameRateTypeOption === "auto") meta.frameRateType = "full";

  if (!dontSetMeta) {
    meta.stepNames = stepNames;
    meta.nowStepIndex = 0;
    meta.nowStepName = stepNames[meta.nowStepIndex];
  }

  // ReturnType<T_AllInfo[K_Type]["state"]> //

  const defaultStates: DefaultStates = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].state;
    return prev;
  }, {});
  const defaultRefs: DefaultRefs = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].refs;
    return prev;
  }, {});

  const initialState: AllState = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].startStates || ({} as StartStatesItemId<typeof key>);

    meta.itemIdsByItemType[key as string] = Object.keys(prev[key]);

    return prev;
  }, {});

  // ------------------------------------------------
  // Setup Repond
  // ------------------------------------------------

  if (!dontSetMeta) {
    const nowState: AllState = cloneObjectWithJson(initialState);
    const prevState: AllState = cloneObjectWithJson(initialState);
    // store initialState and set currentState
    meta.initialState = initialState;
    meta.nowState = nowState;
    meta.prevState = prevState;
    meta.defaultStateByItemType = defaultStates as any;
    meta.defaultRefsByItemType = defaultRefs as any;

    getRepondStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
    makeRefsStructureFromRepondState(); // sets currenRepondRefs based on itemIds from repond state

    meta.copyStates = makeCopyStatesFunction("copy") as any;
    meta.getStatesDiff = makeGetStatesDiffFunction();
    meta.mergeStates = makeCopyStatesFunction("merge") as any;

    createRecordedChanges(meta.recordedEffectChanges);
    createRecordedChanges(meta.recordedStepEndEffectChanges);
    createDiffInfo(meta.diffInfo);
  }
}
