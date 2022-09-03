import meta, { RecordedChanges, PietemMetaPhase } from "./meta";
import { forEach } from "chootils/dist/loops";
import checkListeners from "./checkListeners";
import { Phase } from "./types";

/*

ohhh, every setState is qued and run when the frame runs, so setState never runs before the frame)
but they run in a specific order so could get overwritten

and rereunning setState inside listeners is a way to change the values not depending on order

*/

function updateDiffInfo(recordedChanges: RecordedChanges) {
  //  make a diff of the changes
  meta.getStatesDiff(
    meta.currentState,
    meta.previousState,
    meta.diffInfo,
    recordedChanges,
    false // checkAllChanges
  );
}

function setMetaPhase(metaPhase: PietemMetaPhase) {
  meta.currentMetaPhase = metaPhase;
}

function updateFrameTimes(animationFrameTime: number) {
  meta.previousFrameTime = meta.latestFrameTime;
  meta.latestFrameTime = animationFrameTime;
  if (meta.nextFrameIsFirst === false) {
    meta.latestFrameDuration = meta.latestFrameTime - meta.previousFrameTime;
  } else {
    meta.latestFrameDuration = 16.66667;
  }
}

function runSetStates() {
  // merges all the states from setState()
  forEach(meta.setStatesQue, (loopedUpdateFunction) => {
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  });
  meta.setStatesQue.length = 0;
}

function runAddListeners() {
  // adding listeners (rules) are queued and happen here
  // removing listeners happens instantly
  forEach(meta.startListenersQue, (loopedUpdateFunction) => {
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  });
  meta.startListenersQue.length = 0;
}

function runAddAndRemove() {
  forEach(meta.addAndRemoveItemsQue, (loopedUpdateFunction) => {
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  });
  meta.addAndRemoveItemsQue.length = 0;
}

function runListeners(phase: Phase, stepName: string) {
  const listenerNamesToRun = checkListeners(phase, stepName);
  forEach(listenerNamesToRun, (name) => {
    if (meta.allListeners[name])
      meta.allListeners[name].whatToDo(meta.diffInfo, meta.latestFrameDuration);
  });
}

function runCallbacks(callbacksToRun: any[]) {
  forEach(callbacksToRun, (loopedCallback) => {
    loopedCallback(meta.latestFrameDuration, meta.latestFrameTime);
  });
}

function runAllCallbacks() {
  let copiedCallbacks: any[] = [];
  if (meta.callbacksQue.length > 0) {
    copiedCallbacks = meta.callbacksQue.slice(0) || [];
    meta.callbacksQue.length = 0;
  }
  runCallbacks(copiedCallbacks);
}

function runAllCallfowards() {
  let copiedCallforwards: any[] = [];
  if (meta.callforwardsQue.length > 0) {
    copiedCallforwards = meta.callforwardsQue.slice(0) || [];
    meta.callforwardsQue.length = 0;
  }
  runCallbacks(copiedCallforwards);
}

function resetRecordedChanges(recordedChanges: RecordedChanges) {
  recordedChanges.itemTypesBool = {};
  recordedChanges.itemNamesBool = {};
  recordedChanges.itemPropertiesBool = {};
  recordedChanges.somethingChanged = false;
}

function resetRecordedSubscribeChanges() {
  resetRecordedChanges(meta.recordedSubscribeChanges);
}

function resetRecordedDeriveChanges() {
  resetRecordedChanges(meta.recordedDeriveChanges);
}

// ohhhhhhhhhhhh waiiiiiiiittttttttt , hm
// the steps should all react to any changes made from previous steps
//

// let timeLogged = Date.now();

function runDeriveListeners(stepName: string) {
  resetRecordedDeriveChanges(); // NOTE recently added to prevent derive changes being remembered each time it derives again
  runListeners("derive", stepName); //  a running derive-listener can add more to the setStates que (or others)
  runAddListeners(); // add rules / effects
  runAddAndRemove(); // add and remove items
  runSetStates(); // run the qued setStates
  updateDiffInfo(meta.recordedDeriveChanges);
}

function removeRemovedItemRefs() {
  if (!meta.diffInfo.itemsRemoved) return;

  forEach(meta.diffInfo.itemTypesChanged, (loopedItemType) => {
    forEach(meta.diffInfo.itemsRemoved[loopedItemType], (removedItemName) => {
      delete meta.currentRefs[loopedItemType][removedItemName];
    });
  });
}

function runSetOfDeriveListeners(stepName: string) {
  meta.currentMetaPhase = "runningDeriveListeners";

  // recordedDeriveChanges are reset everytime a step derives?
  // resetRecordedDeriveChanges();
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;
  runDeriveListeners(stepName);
  if (!meta.recordedDeriveChanges.somethingChanged) return;

  console.warn(
    "running derive listeners a lot :S",
    Object.keys(meta.recordedDeriveChanges.itemTypesBool),
    Object.keys(meta.recordedDeriveChanges.itemPropertiesBool)
  );
}

function runSubscribeListenersShortcut(stepName: string) {
  meta.currentMetaPhase = "runningSubscribeListeners"; // hm not checked anywhere, but checking metaPhase !== "runningDerivers" is
  updateDiffInfo(meta.recordedSubscribeChanges); // the diff for all the combined derriver changes
  runListeners("subscribe", stepName); //  Then it runs the subscribers based on the diff
}

function runAStep(stepName: string) {
  runSetOfDeriveListeners(stepName);
  runSubscribeListenersShortcut(stepName);
  // HERE? save the current state for that step, so it can be used as the prevState for this step next frame?
}

function runAStepLoop() {
  runAStep(meta.currentStepName);
  meta.currentStepIndex += 1;
  meta.currentStepName = meta.stepNames[meta.currentStepIndex];
}

function runSetOfStepsLoopShortcut() {
  meta.currentStepIndex = 0;
  meta.currentStepName = meta.stepNames[meta.currentStepIndex];

  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;

  console.warn("tried to run a 30th step", meta.stepNames.length);
}

export function _updatePietem(animationFrameTime: number) {
  updateFrameTimes(animationFrameTime);

  setMetaPhase("runningUpdates");
  // save previous state, ,
  // this won't this disreguard all the state stuff from the callbacks?
  // because all the setStates are delayed, and get added to meta.whatToRunWhenUpdating to run later
  meta.copyStates(meta.currentState, meta.previousState);

  runSetOfStepsLoopShortcut();

  resetRecordedSubscribeChanges(); // maybe resetting recorded changes here is better, before the callbacks run? maybe it doesnt matter?

  setMetaPhase("waitingForFirstUpdate");
  runAllCallbacks();
  removeRemovedItemRefs();

  // runAllCallfowards(); // Moved callforwarsd to end of frame to help frame pacing issue on android? have also moved callforwarsd to inside callbacks

  // if theres nothing running on next frame
  meta.nextFrameIsFirst = meta.setStatesQue.length === 0;
}
