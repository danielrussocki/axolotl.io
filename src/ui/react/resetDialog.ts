import type { GameCommand } from '../../application/contracts'

export interface ResetDialogState {
  isOpen: boolean
  keepPendingActions: boolean
}

export const createResetDialogState = (): ResetDialogState => ({
  isOpen: false,
  keepPendingActions: false,
})

export const openResetDialog = (state: ResetDialogState): ResetDialogState => ({
  ...state,
  isOpen: true,
})

export const closeResetDialog = (_state: ResetDialogState): ResetDialogState => createResetDialogState()

export const setKeepPendingActions = (state: ResetDialogState, keepPendingActions: boolean): ResetDialogState => ({
  ...state,
  keepPendingActions,
})

export const createConfirmResetCommand = (state: ResetDialogState): GameCommand => ({
  type: 'confirmReset',
  keepPendingActions: state.keepPendingActions,
})
