import { describe, expect, it } from 'vitest'

import {
  closeResetDialog,
  createConfirmResetCommand,
  createResetDialogState,
  openResetDialog,
  setKeepPendingActions,
} from './resetDialog'

describe('reset dialog controls', () => {
  it('opens with queue preservation disabled by default', () => {
    expect(openResetDialog(createResetDialogState())).toEqual({
      isOpen: true,
      keepPendingActions: false,
    })
  })

  it('lets the player choose to retain pending actions when confirming', () => {
    const dialog = setKeepPendingActions(openResetDialog(createResetDialogState()), true)

    expect(createConfirmResetCommand(dialog)).toEqual({
      type: 'confirmReset',
      keepPendingActions: true,
    })
  })

  it('closes without retaining its previous choice when cancelled', () => {
    expect(closeResetDialog({ isOpen: true, keepPendingActions: true })).toEqual({
      isOpen: false,
      keepPendingActions: false,
    })
  })
})
