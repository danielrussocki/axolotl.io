import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { ActionCommand } from './application/contracts'
import { GameController } from './application/gameController'
import { getPetVisualState } from './domain/pet'
import { createBrowserAudioAdapter } from './infrastructure/audio/browserAudioAdapter'
import { PixiScene } from './ui/pixi/PixiScene'
import { createActionCommand, getNextMusicEnabled } from './ui/react/actionControls'
import { createBrowserClock, createBrowserPersistence, createBrowserSessionLock } from './ui/react/browserGamePorts'
import { createGameUiStore, type GameUiStore } from './ui/react/gameUiStore'
import { getNeedIndicator, needIndicators, type NeedKey } from './ui/react/needIndicators'
import { getQueueActionLabel, getQueueLimitUpdate, getQueueStatusLabel, getQueueVisibilityLabel } from './ui/react/queueControls'
import { releaseSessionLockOnPageHide } from './ui/react/sessionLifecycle'
import {
  closeResetDialog,
  createConfirmResetCommand,
  createResetDialogState,
  openResetDialog,
  setKeepPendingActions,
} from './ui/react/resetDialog'

const actionControls: readonly { label: string; type: ActionCommand['type']; needKey?: NeedKey }[] = [
  { label: 'Alimentar', type: 'feed', needKey: 'hunger' },
  { label: 'Jugar', type: 'play' },
  { label: 'Limpiar', type: 'clean', needKey: 'cleanliness' },
  { label: 'Acariciar', type: 'pet', needKey: 'happiness' },
  { label: 'Dormir', type: 'sleep', needKey: 'energy' },
] as const

export default function App() {
  const [store, setStore] = useState<GameUiStore | null>(null)
  const [isSessionBlocked, setIsSessionBlocked] = useState(false)
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [resetDialog, setResetDialog] = useState(createResetDialogState)
  const storeRef = useRef<GameUiStore | null>(null)
  const actionSequenceRef = useRef(0)
  const musicEnabledRef = useRef(true)
  const snapshot = useSyncExternalStore(
    (listener) => store?.subscribe(listener) ?? (() => {}),
    () => store?.getSnapshot() ?? null,
    () => null,
  )

  useEffect(() => {
    let isDisposed = false
    let createdStore: GameUiStore | null = null
    const sessionLock = createBrowserSessionLock()

    if (!sessionLock.claim()) {
      queueMicrotask(() => {
        if (!isDisposed) {
          setIsSessionBlocked(true)
        }
      })
      return
    }

    const removePageHideListener = releaseSessionLockOnPageHide(sessionLock)

    void GameController.create({
      persistence: createBrowserPersistence(),
      clock: createBrowserClock(),
      audio: createBrowserAudioAdapter({ musicSource: '/audio/music.mp3' }),
    }).then((controller) => {
      createdStore = createGameUiStore(controller)
      if (isDisposed) {
        createdStore.dispose()
        return
      }
      storeRef.current = createdStore
      setStore(createdStore)
    })

    return () => {
      isDisposed = true
      createdStore?.dispose()
      storeRef.current = null
      removePageHideListener()
      sessionLock.release()
    }
  }, [])

  const dispatchSceneCommand = useCallback((command: ActionCommand) => {
    const activeStore = storeRef.current
    return activeStore?.dispatch(command)
  }, [])

  const dispatchAction = useCallback((type: ActionCommand['type']) => {
    const activeStore = storeRef.current
    if (activeStore === null) {
      return
    }

    const createdAtMs = Date.now()
    actionSequenceRef.current += 1
    void activeStore.dispatch(createActionCommand(type, `local-${createdAtMs}-${actionSequenceRef.current}`, createdAtMs))
  }, [])

  const toggleMusic = useCallback(() => {
    const nextMusicEnabled = getNextMusicEnabled(musicEnabledRef.current)
    musicEnabledRef.current = nextMusicEnabled
    setIsMusicEnabled(nextMusicEnabled)
    void storeRef.current?.dispatch({ type: 'setMusicEnabled', isEnabled: nextMusicEnabled })
  }, [])

  const toggleQueueVisibility = useCallback((isVisible: boolean) => {
    void storeRef.current?.dispatch({ type: 'setQueueVisibility', isVisible: !isVisible })
  }, [])

  const updateQueueLimit = useCallback((value: string) => {
    const limit = getQueueLimitUpdate(value)
    if (limit !== null) {
      void storeRef.current?.dispatch({ type: 'setQueueLimit', limit })
    }
  }, [])

  const requestReset = useCallback(() => {
    setResetDialog(openResetDialog)
    void storeRef.current?.dispatch({ type: 'reset' })
  }, [])

  const cancelReset = useCallback(() => {
    setResetDialog(closeResetDialog)
    void storeRef.current?.dispatch({ type: 'cancelReset' })
  }, [])

  const confirmReset = useCallback(() => {
    const command = createConfirmResetCommand(resetDialog)
    setResetDialog(closeResetDialog)
    void storeRef.current?.dispatch(command)
  }, [resetDialog])

  const isMinigameActive = useCallback(() => storeRef.current?.getActiveMinigame() !== null, [])
  const getActiveMinigame = useCallback(() => storeRef.current?.getActiveMinigame() ?? null, [])
  const captureHeart = useCallback(() => {
    storeRef.current?.captureHeart()
  }, [])
  const finishMinigame = useCallback(() => storeRef.current?.finishMinigame(), [])
  const getSceneVisualState = useCallback(() => {
    const currentSnapshot = storeRef.current?.getSnapshot()
    return currentSnapshot === undefined
      ? 'normal'
      : getPetVisualState(currentSnapshot.state.pet, Date.now(), false)
  }, [])

  if (isSessionBlocked) {
    return (
      <main className="min-h-screen bg-[#fff0f5] px-4 py-6 text-[#7a4a5e] grid place-items-center">
        <section role="alert" className="max-w-md rounded-[28px] border-4 border-[#ff9eb8] bg-white p-6 text-center shadow-[0_12px_32px_rgba(255,143,171,0.25)]">
          <span aria-hidden="true" className="text-4xl">🔒</span>
          <h1 className="mt-3 font-extrabold text-[#c44061]">Sesión ya abierta</h1>
          <p className="mt-2">Ya hay una sesión de Mochi abierta. Recarga esta pestaña para jugar.</p>
        </section>
      </main>
    )
  }

  if (snapshot === null) {
    return <main className="min-h-screen bg-[#fff0f5] grid place-items-center text-[#8a5a6e]">Cargando a Mochi…</main>
  }

  const { needs } = snapshot.state.pet

  return (
    <main className="min-h-screen bg-[#fff0f5] px-4 py-6 text-[#7a4a5e]">
      <section className="mx-auto max-w-140">
        <header className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-[#ffb6d9]">🐰</span>
          <h1 className="pixel-font text-sm text-[#ff4d6d]">MOCHI</h1>
        </header>

        <div className="overflow-hidden rounded-[28px] border-8 border-white bg-white shadow-[0_12px_32px_rgba(255,143,171,0.25)]">
          <PixiScene
            onCommand={dispatchSceneCommand}
            isMinigameActive={isMinigameActive}
            getActiveMinigame={getActiveMinigame}
            onHeartCaptured={captureHeart}
            onMinigameFinished={finishMinigame}
            getPetVisualState={getSceneVisualState}
          />
        </div>

        <p role="status" className="mt-4 rounded-[20px] border-2 border-[#ffd6e7] bg-white px-4 py-3 font-bold shadow-sm">
          {snapshot.message}
        </p>

        {snapshot.notifications.length > 0 ? (
          <section className="mt-3 space-y-2" aria-label="Avisos de recuperación">
            {snapshot.notifications.map((notification, index) => (
              <p key={`${notification}-${index}`} role="alert" className="rounded-[16px] border-2 border-[#ff9eb8] bg-[#fff0f5] px-4 py-3 text-sm font-bold text-[#c44061]">
                {notification}
              </p>
            ))}
          </section>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          {needIndicators.map(({ key, label, icon }) => {
            const value = needs[key]
            const { isLow } = getNeedIndicator(key, value)
            return (
              <article
                key={key}
                id={`need-${key}`}
                data-low-need={isLow || undefined}
                className={`rounded-[18px] border-2 p-3 shadow-sm ${isLow ? 'border-[#ff4d6d] bg-[#fff0f5] shadow-[0_0_0_3px_rgba(255,77,109,0.16)]' : 'border-[#ffe4ec] bg-white'}`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-extrabold">{icon} {label}</span>
                  <span className={`pixel-font text-[8px] ${isLow ? 'text-[#ff4d6d]' : 'text-[#ff8fab]'}`}>{Math.round(value)}%</span>
                </div>
                <div className="h-3.5 overflow-hidden rounded-full border border-[#ffd6e7] bg-[#fff0f5] p-0.5">
                  <div className={`h-full rounded-full transition-[width] duration-300 ${isLow ? 'bg-[#ff4d6d]' : 'bg-[#ff8fab]'}`} style={{ width: `${value}%` }} />
                </div>
                {isLow ? <p className="mt-2 text-xs font-bold text-[#d9365a]">¡Atención!</p> : null}
              </article>
            )
          })}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3" aria-label="Controles de Mochi">
          {actionControls.map(({ label, type, needKey }) => {
            const isLow = needKey === undefined ? false : getNeedIndicator(needKey, needs[needKey]).isLow
            const visibleLabel = label === 'Dormir' && snapshot.state.pet.isSleeping ? 'Despertar' : label
            return (
            <button
              key={label}
              type="button"
              onClick={() => dispatchAction(type)}
              aria-describedby={isLow ? `need-${needKey}` : undefined}
              data-low-need={isLow || undefined}
              className={`rounded-[20px] border-2 px-2 py-3 text-sm font-bold ${isLow ? 'border-[#ff4d6d] bg-[#fff0f5] text-[#d9365a] shadow-[0_0_0_3px_rgba(255,77,109,0.16)]' : 'border-[#ffe4ec] bg-white text-[#8a5a6e]'}`}
            >
              {visibleLabel}
            </button>
            )
          })}
          <button
            type="button"
            aria-pressed={isMusicEnabled}
            onClick={toggleMusic}
            className="rounded-[20px] border-2 border-[#ffe4ec] bg-white px-2 py-3 text-sm font-bold text-[#8a5a6e]"
          >
            Música: {isMusicEnabled ? 'activada' : 'desactivada'}
          </button>
          <button
            type="button"
            onClick={requestReset}
            className="rounded-[20px] border-2 border-[#ff9eb8] bg-[#fff0f5] px-2 py-3 text-sm font-bold text-[#c44061]"
          >
            Reiniciar
          </button>
        </div>

        {resetDialog.isOpen ? (
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            className="mt-5 rounded-[20px] border-2 border-[#ff9eb8] bg-white p-4 shadow-[0_8px_24px_rgba(255,143,171,0.25)]"
          >
            <h2 id="reset-dialog-title" className="font-extrabold">¿Reiniciar el progreso?</h2>
            <p className="mt-2 text-sm">Mochi volverá a sus valores iniciales.</p>
            <label className="mt-4 flex items-start gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={resetDialog.keepPendingActions}
                onChange={(event) => setResetDialog((state) => setKeepPendingActions(state, event.currentTarget.checked))}
              />
              Conservar las acciones pendientes de la cola
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={cancelReset}
                className="rounded-xl border-2 border-[#ffd6e7] px-3 py-2 text-sm font-bold text-[#8a5a6e]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="rounded-xl border-2 border-[#ff9eb8] bg-[#ff6f91] px-3 py-2 text-sm font-bold text-white"
              >
                Reiniciar progreso
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-5 rounded-[20px] border-2 border-[#ffe4ec] bg-white p-4 shadow-sm" aria-labelledby="queue-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="queue-title" className="font-extrabold">Cola de acciones</h2>
            <button
              type="button"
              aria-controls="action-queue"
              aria-expanded={snapshot.state.queue.isVisible}
              onClick={() => toggleQueueVisibility(snapshot.state.queue.isVisible)}
              className="rounded-xl border-2 border-[#ffd6e7] px-3 py-2 text-xs font-bold text-[#8a5a6e]"
            >
              {getQueueVisibilityLabel(snapshot.state.queue.isVisible)}
            </button>
          </div>

          <label className="mt-4 block text-sm font-bold" htmlFor="queue-limit">
            Límite de acciones pendientes
            <input
              id="queue-limit"
              type="number"
              min="0"
              max="200"
              step="1"
              value={snapshot.state.queue.limit}
              onChange={(event) => updateQueueLimit(event.currentTarget.value)}
              className="mt-1.5 block w-full rounded-xl border-2 border-[#ffd6e7] px-3 py-2 text-[#7a4a5e]"
            />
          </label>

          {snapshot.state.queue.isVisible ? (
            <ul id="action-queue" className="mt-4 space-y-2" aria-label="Acciones pendientes">
              {snapshot.state.queue.items.length === 0 ? (
                <li className="rounded-xl bg-[#fff0f5] px-3 py-2 text-sm">No hay acciones pendientes.</li>
              ) : snapshot.state.queue.items.map((action) => (
                <li key={action.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#fff0f5] px-3 py-2 text-sm">
                  <span className="font-bold">{getQueueActionLabel(action.type)}</span>
                  <span>{getQueueStatusLabel(action.status)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </section>
    </main>
  )
}
