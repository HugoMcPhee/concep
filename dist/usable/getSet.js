import { forEach } from "chootils/dist/loops";
import { mergeToState } from "../copyStates";
import { runWhenAddingAndRemovingItems, whenSettingStates } from "../helpers/runWhens";
import { repondMeta as meta } from "../meta";
import { applyPatch, getPatch } from "../usable/patchesAndDiffs";
export function setState(propPath, newValue, itemId) {
    whenSettingStates(() => {
        if (newValue === undefined)
            return;
        if (!propPath) {
            console.error("propPath must be provided");
            return;
        }
        if (typeof propPath !== "string") {
            console.error("propPath must be a string");
            console.log("propPath", propPath);
            return;
        }
        const storeType = meta.itemTypeByPropPathId[propPath];
        const propKey = meta.propKeyByPropPathId[propPath];
        let foundItemId = itemId || meta.itemIdsByItemType[storeType]?.[0];
        if (!foundItemId) {
            foundItemId = Object.keys(meta.nowState[storeType] ?? {})[0];
            console.warn(`${propPath}No itemId found for setState ${storeType}, using first found itemId: ${foundItemId} from Object keys`);
        }
        mergeToState(storeType, propKey, newValue, foundItemId, meta.nowState, meta.nowMetaPhase === "runningEffects" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges, meta.recordedStepEndEffectChanges);
    });
}
export function setNestedState(newState) {
    whenSettingStates(() => {
        if (!newState)
            return;
        const itemTypes = Object.keys(newState);
        forEach(itemTypes, (itemType) => {
            const itemIds = Object.keys(newState[itemType]);
            forEach(itemIds, (itemId) => {
                const itemProps = Object.keys(newState[itemType][itemId]);
                forEach(itemProps, (propName) => {
                    const newValue = newState[itemType][itemId][propName];
                    setState(`${itemType}.${propName}`, newValue, itemId);
                });
            });
        });
    });
}
export const getDefaultState = (kind) => meta.defaultStateByItemType[kind];
export const getDefaultRefs = (kind) => meta.defaultRefsByItemType[kind];
export const getItemTypes = () => meta.itemTypeNames;
export const getItemIds = (kind) => meta.itemIdsByItemType[kind];
const _getNestedState = () => meta.nowState;
export const getState = (kind, itemId) => {
    if (!itemId) {
        const foundItemId = meta.itemIdsByItemType?.[kind]?.[0];
        if (!foundItemId) {
            console.warn(`(getState) No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
        }
        return meta.nowState[kind][foundItemId];
    }
    // const allItemTypeState = meta.nowState[kind];
    // if (allItemTypeState === undefined) {
    //   console.warn(`(getState) No state found for ${kind}`);
    // }
    // const foundState = allItemTypeState?.[itemId];
    // if (foundState === undefined) {
    //   console.warn(`(getState) No state found for ${kind} with id ${itemId}`);
    // }
    // return foundState;
    return meta.nowState[kind]?.[itemId];
};
// Good for running things to be sure the state change is seen
export function onNextTick(callback) {
    if (callback)
        meta.nextTickQueue.push(callback);
}
export const getPrevState = (itemType, itemId) => {
    if (!itemId) {
        // const foundItemId = meta.prevItemIdsByItemType?.[kind]?.[0];
        const foundItemId = Object.keys(meta.prevState?.[itemType] ?? {})?.[0] ?? meta.itemIdsByItemType?.[itemType]?.[0];
        if (!foundItemId) {
            // console.warn(`(getPrevState) No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
        }
        return meta.prevState?.[itemType]?.[foundItemId] ?? meta.nowState[itemType][foundItemId];
    }
    if (!meta.prevState[itemType]?.[itemId]) {
        // console.warn(`(getPrevState) No prevState found for ${kind} with id ${itemId} (using nowState instead)`);
        return meta.nowState[itemType][itemId];
    }
    return meta.prevState[itemType][itemId];
};
export const getRefs = (itemType, itemId) => {
    if (!itemId) {
        const foundItemId = meta.itemIdsByItemType?.[itemType]?.[0];
        if (!foundItemId) {
            console.warn(`(getRefs) No itemId provided for ${itemType}, using first found itemId: ${foundItemId}`);
        }
        return meta.nowRefs[itemType][foundItemId];
    }
    if (meta.nowRefs?.[itemType]?.[itemId] === undefined) {
        console.warn(`(getRefs) No refs found for ${itemType} with id ${itemId}`);
    }
    return meta.nowRefs[itemType][itemId];
};
// Adding and removing items
export function addItem(type, id, state, refs) {
    if (!meta.willAddItemsInfo[type])
        meta.willAddItemsInfo[type] = {};
    meta.willAddItemsInfo[type][id] = true;
    runWhenAddingAndRemovingItems(() => {
        meta.nowState[type][id] = {
            ...meta.defaultStateByItemType[type](id),
            ...(state || {}),
        };
        meta.nowRefs[type][id] = {
            ...meta.defaultRefsByItemType[type](id, meta.nowState[type][id]),
            ...(refs || {}),
        };
        meta.itemIdsByItemType[type].push(id);
        meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
        // TODO Figure out if adding an item should record the properties as changed or not?
        meta.recordedStepEndEffectChanges.itemPropsBool[type][id] = {};
        meta.recordedEffectChanges.itemPropsBool[type][id] = {};
        meta.diffInfo.propsChanged[type][id] = [];
        meta.diffInfo.propsChangedBool[type][id] = {};
        meta.recordedStepEndEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[type] = true;
        meta.recordedEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedEffectChanges.somethingChanged = true;
        // NOTE new items with props different to the defaults props are recorded as changed
        const itemPropNames = meta.propNamesByItemType[type];
        forEach(itemPropNames, (propName) => {
            const propChangedFromDefault = meta.nowState[type][id][propName] !== meta.defaultStateByItemType[type](id)[propName];
            if (propChangedFromDefault) {
                meta.recordedStepEndEffectChanges.itemPropsBool[type][id][propName] = true;
                meta.recordedEffectChanges.itemPropsBool[type][id][propName] = true;
            }
        });
    });
}
export function removeItem(type, id) {
    if (!meta.willRemoveItemsInfo[type])
        meta.willRemoveItemsInfo[type] = {};
    meta.willRemoveItemsInfo[type][id] = true;
    runWhenAddingAndRemovingItems(() => {
        // removing itemId
        delete meta.nowState[type][id];
        meta.itemIdsByItemType[type] = Object.keys(meta.nowState[type]);
        // delete meta.currentRefs[itemType][itemId]; // now done at the end of update repond
        meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[type] = true;
        meta.recordedEffectChanges.somethingChanged = true;
    });
}
export function getItemWillBeAdded(type, id) {
    return !!meta.willAddItemsInfo[type]?.[id];
}
export function getItemWillBeRemoved(type, id) {
    return !!meta.willRemoveItemsInfo[type]?.[id] || !!meta.nowState[type][id];
}
export function getItemWillExist(type, id) {
    return getItemWillBeAdded(type, id) || !!getState(type, id);
}
// For saving and loading
// Function to selectively get data with only specific props from the repond store, can be used for save data
export function getPartialState(propsToGet) {
    const itemTypes = Object.keys(propsToGet);
    if (!meta.didInit) {
        console.warn("getPartialState called before repond was initialized");
        return {};
    }
    const partialState = {};
    for (const itemType of itemTypes) {
        const itemPropNames = propsToGet[itemType];
        const itemIds = meta.itemIdsByItemType[itemType];
        const partialItems = {};
        for (const itemId of itemIds) {
            const item = getState(itemType, itemId);
            const partialItem = {};
            for (const propName of itemPropNames) {
                partialItem[propName] = item[propName];
            }
            partialItems[itemId] = partialItem;
        }
        partialState[itemType] = partialItems;
    }
    return partialState;
}
export function applyState(partialState) {
    if (partialState)
        applyPatch(getPatch(_getNestedState(), partialState));
}
