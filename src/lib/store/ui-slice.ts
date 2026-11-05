import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** Text handed to the chat composer (e.g. "Gửi vào chat" from the code workspace). */
export type ChatDraft = { id: number; text: string };

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileNavigationOpen: false,
    chatDraft: null as ChatDraft | null,
  },
  reducers: {
    sendToChat: {
      reducer(state, action: PayloadAction<ChatDraft>) {
        state.chatDraft = action.payload;
      },
      prepare(text: string) {
        return { payload: { id: Date.now(), text } };
      },
    },
    clearChatDraft(state) {
      state.chatDraft = null;
    },
    toggleMobileNavigation(state) {
      state.mobileNavigationOpen = !state.mobileNavigationOpen;
    },
    closeMobileNavigation(state) {
      state.mobileNavigationOpen = false;
    },
  },
});

export const { toggleMobileNavigation, closeMobileNavigation, sendToChat, clearChatDraft } =
  uiSlice.actions;
export const uiReducer = uiSlice.reducer;
