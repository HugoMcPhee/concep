import { repondMeta as meta } from "../meta";
import { runNextFrameIfNeeded } from "./frames";

export function whenSettingStates(callback: any) {
  if (meta.isRunningSetStates) {
    callback();
  } else {
    meta.setStatesQueue.push(callback);
  }
  runNextFrameIfNeeded();
}

export function whenStartingEffects(callback: any) {
  meta.startEffectsQueue.push(callback);
  runNextFrameIfNeeded();
}

export function whenStoppingEffects(callback: any) {
  // stopping listeners runs instantly
  callback();
}

export function whenDoingEffectsRunAtStart(callback: any) {
  meta.effectsRunAtStartQueue.push(callback);
  runNextFrameIfNeeded();
}

export function runWhenAddingAndRemovingItems(callback: any) {
  if (!meta.didStartFirstFrame) {
    callback();
  } else {
    meta.addAndRemoveItemsQueue.push(callback);
    runNextFrameIfNeeded();
  }
}
