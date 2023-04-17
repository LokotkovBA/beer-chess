import { type TimeModeState } from "./store";

export function timeModeValueSelector(state: TimeModeState) {
    return [state.side, state.increment] as const;
}

export function timeModeChangeSelector(state: TimeModeState) {
    return [state.setSide, state.setIncrement] as const;
}
