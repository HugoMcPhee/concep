import { forEach } from "chootils/dist/loops";
import meta, { RecordedChanges, UntypedDiffInfo } from "./meta";

export function createDiffInfo(diffInfo: UntypedDiffInfo) {
  diffInfo.itemTypesChanged = [];
  diffInfo.itemsChanged.all__ = [];
  diffInfo.propsChanged.all__ = [];

  diffInfo.itemTypesChangedBool = {};
  diffInfo.itemsChangedBool.all__ = {};
  diffInfo.propsChangedBool.all__ = {};

  diffInfo.itemsAdded.all__ = [];
  diffInfo.itemsRemoved.all__ = [];

  diffInfo.itemsAddedBool.all__ = {};
  diffInfo.itemsRemovedBool.all__ = {};

  forEach(meta.itemTypeNames, (itemType) => {
    diffInfo.itemTypesChangedBool[itemType] = false;
    diffInfo.itemsChangedBool[itemType] = {};
    diffInfo.propsChangedBool[itemType] = {};
    diffInfo.itemsAdded[itemType] = [];
    diffInfo.itemsRemoved[itemType] = [];
    diffInfo.itemsAddedBool[itemType] = {};
    diffInfo.itemsRemovedBool[itemType] = {};
    diffInfo.itemsChanged[itemType] = [];
    diffInfo.propsChanged[itemType] = {};
    diffInfo.propsChangedBool[itemType].all__ = {};
    diffInfo.propsChanged[itemType].all__ = [];

    forEach(meta.itemIdsByItemType[itemType], (itemId) => {
      diffInfo.itemsChangedBool[itemType][itemId] = false;
      diffInfo.propsChangedBool[itemType][itemId] = {};
      diffInfo.propsChanged[itemType][itemId] = [];

      forEach(meta.propNamesByItemType[itemType], (propName) => {
        diffInfo.propsChangedBool[itemType][itemId][propName] = false;
        diffInfo.propsChangedBool[itemType].all__![propName] = false;
        diffInfo.propsChangedBool.all__![propName] = false;
      });
    });
  });
}

function clearDiffInfo(diffInfo: UntypedDiffInfo) {
  diffInfo.itemTypesChanged.length = 0;
  diffInfo.itemsChanged.all__.length = 0;
  diffInfo.propsChanged.all__!.length = 0;

  diffInfo.itemsAdded.all__.length = 0;
  diffInfo.itemsRemoved.all__.length = 0;

  for (let typeIndex = 0; typeIndex < meta.itemTypeNames.length; typeIndex++) {
    const itemType = meta.itemTypeNames[typeIndex];

    diffInfo.itemTypesChangedBool[itemType] = false;
    diffInfo.itemsAdded[itemType].length = 0;
    diffInfo.itemsRemoved[itemType].length = 0;
    diffInfo.itemsChanged[itemType].length = 0;
    diffInfo.propsChanged[itemType].all__!.length = 0;

    for (let nameIndex = 0; nameIndex < meta.itemIdsByItemType[itemType].length; nameIndex++) {
      const itemId = meta.itemIdsByItemType[itemType][nameIndex];

      diffInfo.itemsChangedBool[itemType][itemId] = false;

      diffInfo.itemsAddedBool[itemType][itemId] = false;
      diffInfo.itemsAddedBool.all__[itemId] = false;
      diffInfo.itemsRemovedBool[itemType][itemId] = false;
      diffInfo.itemsRemovedBool.all__[itemId] = false;
      diffInfo.propsChanged[itemType][itemId].length = 0;

      for (let propIndex = 0; propIndex < meta.propNamesByItemType[itemType].length; propIndex++) {
        const propName = meta.propNamesByItemType[itemType][propIndex];

        diffInfo.propsChangedBool[itemType][itemId][propName] = false;
        diffInfo.propsChangedBool[itemType].all__![propName] = false;
      }
    }
  }
}

export function makeGetStatesDiffFunction() {
  const { itemTypeNames, propNamesByItemType } = meta;

  return function getStatesDiff(
    nowState: any,
    prevState: any,
    diffInfo: any,
    recordedChanges: RecordedChanges,
    checkAllChanges: boolean
  ) {
    // NOTE could move into same loop as below!
    clearDiffInfo(diffInfo);

    let itemTypeAddedToItemsTypesChanged = false;

    for (let typeIndex = 0; typeIndex < itemTypeNames.length; ++typeIndex) {
      const itemType = itemTypeNames[typeIndex];

      itemTypeAddedToItemsTypesChanged = false;

      if (checkAllChanges || recordedChanges.itemTypesBool[itemType] === true) {
        const itemIds = checkAllChanges ? Object.keys(nowState[itemType]) : meta.itemIdsByItemType[itemType];

        // TODO repalce this with real previous item names?
        // NOTE may need to handle added and removed items, when not using checkAllChanges (which is set when getting a patch or diff)
        const prevItemIds = checkAllChanges ? Object.keys(prevState[itemType]) : meta.itemIdsByItemType[itemType];

        // check for items removed from previous object
        for (let prevNameIndex = 0; prevNameIndex < prevItemIds.length; ++prevNameIndex) {
          const prevItemId = prevItemIds[prevNameIndex];
          if (nowState[itemType][prevItemId] === undefined) {
            diffInfo.itemsRemoved.all__.push(prevItemId);
            diffInfo.itemsRemovedBool.all__[prevItemId] = true;
            diffInfo.itemsRemoved[itemType].push(prevItemId);
            diffInfo.itemsRemovedBool[itemType][prevItemId] = true;
          }
        }

        for (let nameIndex = 0; nameIndex < itemIds.length; ++nameIndex) {
          const itemId = itemIds[nameIndex];
          if (checkAllChanges || recordedChanges.itemIdsBool[itemType]?.[itemId] === true) {
            // check for items added since previous object
            if (prevState[itemType][itemId] === undefined) {
              diffInfo.itemsAdded.all__.push(itemId);
              diffInfo.itemsAddedBool.all__[itemId] = true;
              diffInfo.itemsAdded[itemType].push(itemId);
              diffInfo.itemsAddedBool[itemType][itemId] = true;
            }

            let propChanged = false;
            let itemAddedToItemsChanged = false;
            // let itemAddedToItemsRemoved = false;
            // let itemAddedToItemsAdded = false;

            // if (diffInfo.itemsAddedBool.all__[itemId]) {
            // if the item was just added (should it mark all the properties as changed?)
            // }

            if (!diffInfo.itemsRemovedBool.all__[itemId] && !diffInfo.itemsAddedBool.all__[itemId]) {
              for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; ++propIndex) {
                const itemPropName = propNamesByItemType[itemType][propIndex];

                if (checkAllChanges || recordedChanges.itemPropsBool[itemType]?.[itemId]?.[itemPropName] === true) {
                  // propAddedToPropsChanged = false;

                  // TODO IDEA - fast compare object values
                  // if its not the same, and it's an object
                  // then compare each property
                  // There's could be a table for which properties are objects! in meta
                  // and that same table could include a list of keys
                  // meta.keysByTypeByProp = { doll: { position: "x,y,z" } }
                  // meta.objectTypeByTypeByProp = { doll: { position: "point3D" } }

                  // if the properties are x,y,z, then use "point3D" instead of the array?
                  // it can use pointIsSame3d(prevValue, newValue)

                  // if (
                  //   currentState[itemType][itemId][itemPropName] !== null &&
                  //   typeof currentState[itemType][itemId][itemPropName] ===
                  //     "object"
                  // ) {
                  //   propChanged =
                  //     JSON.stringify(
                  //       currentState[itemType][itemId][itemPropName]
                  //     ) !==
                  //     JSON.stringify(
                  //       prevState[itemType][itemId][itemPropName]
                  //     );
                  // } else {
                  //   propChanged =
                  //     currentState[itemType][itemId][itemPropName] !==
                  //     prevState[itemType][itemId][itemPropName];
                  // }

                  propChanged = nowState[itemType][itemId][itemPropName] !== prevState[itemType][itemId][itemPropName];

                  if (propChanged) {
                    if (!itemTypeAddedToItemsTypesChanged) {
                      diffInfo.itemTypesChanged.push(itemType);
                      diffInfo.itemTypesChangedBool[itemType] = true;
                      itemTypeAddedToItemsTypesChanged = true;
                    }

                    if (!itemAddedToItemsChanged) {
                      diffInfo.itemsChanged[itemType].push(itemId);
                      diffInfo.itemsChangedBool[itemType][itemId] = true;

                      diffInfo.itemsChanged.all__.push(itemId);
                      diffInfo.itemsChangedBool.all__[itemId] = true;

                      itemAddedToItemsChanged = true;
                    }

                    if (!diffInfo.propsChangedBool[itemType][itemId][itemPropName]) {
                      diffInfo.propsChanged[itemType][itemId].push(itemPropName);
                      diffInfo.propsChangedBool[itemType][itemId][itemPropName] = true;
                    }

                    if (!diffInfo.propsChangedBool.all__[itemPropName]) {
                      diffInfo.propsChanged.all__.push(itemPropName);
                      diffInfo.propsChangedBool.all__[itemPropName] = true;
                    }

                    if (!diffInfo.propsChangedBool[itemType].all__[itemPropName]) {
                      diffInfo.propsChanged[itemType].all__.push(itemPropName);
                      diffInfo.propsChangedBool[itemType].all__[itemPropName] = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}
