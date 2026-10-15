import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { mobileNavigationOpen: false },
  reducers: {
    toggleMobileNavigation(state) {
      state.mobileNavigationOpen = !state.mobileNavigationOpen;
    },
    closeMobileNavigation(state) {
      state.mobileNavigationOpen = false;
    },
  },
});

export const { toggleMobileNavigation, closeMobileNavigation } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
