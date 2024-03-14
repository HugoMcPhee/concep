import { removeItemFromArrayInPlace } from "chootils/dist/arrays";
import meta from "../../meta";
import { runWhenDoingEffectsRunAtStart, runWhenStartingEffects, runWhenStoppingEffects } from "../runWhens";
export function _startEffect(newEffect) {
    const phase = !!newEffect.atStepEnd ? "endOfStep" : "duringStep";
    const step = newEffect.step ?? "default";
    if (newEffect.runAtStart) {
        runWhenDoingEffectsRunAtStart(() => newEffect.run(meta.diffInfo, 16.66666, true /* ranWithoutChange */));
    }
    runWhenStartingEffects(() => {
        meta.allEffects[newEffect.id] = newEffect;
        if (!meta.effectIdsByPhaseByStep[phase][step]) {
            // add the effect to a new array
            meta.effectIdsByPhaseByStep[phase][step] = [newEffect.id];
        }
        else {
            if (!meta.effectIdsByPhaseByStep[phase][step]?.includes(newEffect.id)) {
                // add the effect to the array if it's not already there
                meta.effectIdsByPhaseByStep[phase][step].push(newEffect.id);
            }
        }
    });
}
export function _stopEffect(effectName) {
    runWhenStoppingEffects(() => {
        const effect = meta.allEffects[effectName];
        if (!effect)
            return;
        const phase = !!effect.atStepEnd ? "endOfStep" : "duringStep";
        const step = effect.step ?? "default";
        removeItemFromArrayInPlace(meta.effectIdsByPhaseByStep[phase][step] ?? [], effect.id);
        delete meta.allEffects[effectName];
    });
}
export function toSafeEffectId(prefix) {
    const counterNumber = meta.autoEffectIdCounter;
    meta.autoEffectIdCounter += 1;
    return (prefix || "autoEffect") + "_" + counterNumber;
}
