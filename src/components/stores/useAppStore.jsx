import React, { createContext, useContext, useReducer, useRef } from 'react';

// Define the initial state for filters and toggles that will be shared globally.
const initialState = {
  filters: {
    grade_numbers: [],
    title_q: "",
  },
  debouncedTitleQ: "",
  showMyBasketOnly: false,
  showMyBooksOnly: false,
};

// Action types
const actionTypes = {
  SET_FILTERS: 'SET_FILTERS',
  SET_TITLE_Q: 'SET_TITLE_Q',
  SET_DEBOUNCED_TITLE_Q: 'SET_DEBOUNCED_TITLE_Q',
  SET_SHOW_MY_BASKET_ONLY: 'SET_SHOW_MY_BASKET_ONLY',
  SET_SHOW_MY_BOOKS_ONLY: 'SET_SHOW_MY_BOOKS_ONLY',
  RESET_FILTERS: 'RESET_FILTERS',
  // New granular actions for mutual exclusivity
  CLEAR_PERSONAL_FILTERS: 'CLEAR_PERSONAL_FILTERS',
  CLEAR_GENERAL_FILTERS: 'CLEAR_GENERAL_FILTERS',
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_FILTERS:
      return { ...state, filters: action.payload };
    case actionTypes.SET_TITLE_Q:
      return { ...state, filters: { ...state.filters, title_q: action.payload } };
    case actionTypes.SET_DEBOUNCED_TITLE_Q:
      return { ...state, debouncedTitleQ: action.payload };
    case actionTypes.SET_SHOW_MY_BASKET_ONLY:
      return { ...state, showMyBasketOnly: action.payload };
    case actionTypes.SET_SHOW_MY_BOOKS_ONLY:
      return { ...state, showMyBooksOnly: action.payload };
    case actionTypes.RESET_FILTERS:
      return { ...initialState };
    case actionTypes.CLEAR_PERSONAL_FILTERS:
      return { ...state, showMyBasketOnly: false, showMyBooksOnly: false };
    case actionTypes.CLEAR_GENERAL_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, grade_numbers: [], title_q: "" },
        debouncedTitleQ: ""
      };
    default:
      return state;
  }
};

// Create context with default value that includes dummy functions
const defaultContext = {
  ...initialState,
  setFilters: () => {},
  setTitleQ: () => {},
  setTitleQDebounced: () => {},
  setShowMyBasketOnly: () => {},
  setShowMyBooksOnly: () => {},
  resetFilters: () => {},
};

const AppStoreContext = createContext(defaultContext);

// Provider component
export const AppStoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const debounceTimeoutRef = useRef(null);

  const actions = {
    setFilters: (newFilters) => {
      // If a grade filter is being applied, clear personal filters
      if (newFilters.grade_numbers.length > 0) {
        dispatch({ type: actionTypes.CLEAR_PERSONAL_FILTERS });
      }
      dispatch({ type: actionTypes.SET_FILTERS, payload: newFilters });
    },
    setTitleQ: (value) => dispatch({ type: actionTypes.SET_TITLE_Q, payload: value }),
    setTitleQDebounced: (value) => {
      // If a search term is being entered, clear personal filters
      if (value.trim().length > 0) {
        dispatch({ type: actionTypes.CLEAR_PERSONAL_FILTERS });
      }

      // Update the immediate filter value for UI responsiveness
      dispatch({ type: actionTypes.SET_TITLE_Q, payload: value });
      
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Set new timeout for debounced value
      debounceTimeoutRef.current = setTimeout(() => {
        dispatch({ type: actionTypes.SET_DEBOUNCED_TITLE_Q, payload: value });
      }, 300);
    },
    setShowMyBasketOnly: (value) => {
      // If activating this filter, clear general filters and the other personal filter
      if (value) {
        dispatch({ type: actionTypes.CLEAR_GENERAL_FILTERS });
        dispatch({ type: actionTypes.SET_SHOW_MY_BOOKS_ONLY, payload: false });
      }
      dispatch({ type: actionTypes.SET_SHOW_MY_BASKET_ONLY, payload: value });
    },
    setShowMyBooksOnly: (value) => {
      // If activating this filter, clear general filters and the other personal filter
      if (value) {
        dispatch({ type: actionTypes.CLEAR_GENERAL_FILTERS });
        dispatch({ type: actionTypes.SET_SHOW_MY_BASKET_ONLY, payload: false });
      }
      dispatch({ type: actionTypes.SET_SHOW_MY_BOOKS_ONLY, payload: value });
    },
    resetFilters: () => {
      // Clear any pending debounce timeout when resetting
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      dispatch({ type: actionTypes.RESET_FILTERS });
    },
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const value = { ...state, ...actions };

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
};

// Custom hook to use the store
const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    console.warn('useAppStore must be used within an AppStoreProvider, using default values');
    return defaultContext;
  }
  return context;
};

// Static method to get initial state (for compatibility with the previous Zustand-like API)
useAppStore.getState = () => initialState;

export { useAppStore };
export default useAppStore;