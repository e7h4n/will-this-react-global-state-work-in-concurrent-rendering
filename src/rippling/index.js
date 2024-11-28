import React, { useCallback, useSyncExternalStore } from 'react';
import { effect, state, computed, createStore } from 'rippling';

import {
    reducer,
    initialState,
    selectCount,
    incrementAction,
    doubleAction,
    createApp,
} from '../common';

const globalState = state(initialState);
const StoreContext = React.createContext(null);

const useStore = () => {
    const store = React.useContext(StoreContext);
    if (!store) {
        throw new Error('useStore must be used within StoreProvider');
    }
    return store;
}


const countState = computed(
    (get) => selectCount(get(globalState)),
);

const updateCountState = effect(
    (get, set, action) => {
        set(globalState, reducer(get(globalState), action));
    },
);

function useAtomValue(atom) {
    const store = useStore();
    return useSyncExternalStore((fn) => store.sub(atom, effect(fn)), () => store.get(atom));
}

function useAtomSet(atom) {
    const store = useStore();
    return (...args) => {
        const ret = store.set(atom, ...args);

        if (ret && typeof ret.then === 'function') {
            return ret.then((v) => {
                store.flush();
                return v;
            });
        }

        store.flush();
        return ret;
    };
}

const useCount = () => useAtomValue(countState);

const useIncrement = () => {
    const dispatch = useAtomSet(updateCountState);
    return useCallback(() => {
        dispatch(incrementAction);
    }, [dispatch]);
};

const useDouble = () => {
    const dispatch = useAtomSet(updateCountState);
    return useCallback(() => {
        dispatch(doubleAction);
    }, [dispatch]);
};

const Root = ({ children }) => {
    const store = createStore()
    return (
        <StoreContext.Provider value={store}>
            {children}
        </StoreContext.Provider>
    );
};

export default createApp(useCount, useIncrement, useDouble, Root);
