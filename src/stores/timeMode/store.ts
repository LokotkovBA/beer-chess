import { create } from "zustand";

export const useTimeModeStore = create<TimeModeState>((set) => ({
    side: 10,
    increment: 3,
    setSide(sliderValue) {
        set(state => ({ ...state, side: sliderValue }));
    },
    setIncrement(sliderValue) {
        set(state => ({ ...state, increment: sliderValue }));
    },
}));

export type TimeModeState = {
    side: number,
    increment: number,
    setSide: (sliderValue: number) => void,
    setIncrement: (sliderValue: number) => void,
}
