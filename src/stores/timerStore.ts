import { useCallback, useRef, useState, useEffect } from 'react'
import type { TimerState } from '../types'

interface TimerCallbacks {
  onComplete?: () => void
  onTick?: (elapsed: number, remaining: number) => void
}

export function createTimerEngine() {
  let intervalId: ReturnType<typeof setInterval> | null = null
  let startTimestamp: number = 0
  let pausedElapsed: number = 0
  let totalDuration: number = 0
  let isCountdown: boolean = true
  let callbacks: TimerCallbacks = {}

  function start(durationSeconds: number, countdown: boolean = true) {
    stop()
    isCountdown = countdown
    totalDuration = durationSeconds
    startTimestamp = Date.now()
    pausedElapsed = 0

    intervalId = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTimestamp) / 1000) + pausedElapsed

      if (isCountdown) {
        const remaining = Math.max(0, totalDuration - elapsed)
        callbacks.onTick?.(elapsed, remaining)
        if (remaining <= 0) {
          stop()
          callbacks.onComplete?.()
        }
      } else {
        callbacks.onTick?.(elapsed, 0)
      }
    }, 200)
  }

  function pause() {
    if (intervalId) {
      pausedElapsed += Math.floor((Date.now() - startTimestamp) / 1000)
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function resume() {
    if (!intervalId) {
      startTimestamp = Date.now()
      intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed

        if (isCountdown) {
          const remaining = Math.max(0, totalDuration - elapsed)
          callbacks.onTick?.(elapsed, remaining)
          if (remaining <= 0) {
            stop()
            callbacks.onComplete?.()
          }
        } else {
          callbacks.onTick?.(elapsed, 0)
        }
      }, 200)
    }
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function addTime(seconds: number) {
    totalDuration += seconds
  }

  function reset() {
    stop()
    startTimestamp = 0
    pausedElapsed = 0
    totalDuration = 0
  }

  function getElapsed(): number {
    const current = intervalId
      ? Math.floor((Date.now() - startTimestamp) / 1000) + pausedElapsed
      : pausedElapsed
    return current
  }

  function setCallbacks(cb: TimerCallbacks) {
    callbacks = cb
  }

  return { start, pause, resume, stop, addTime, reset, getElapsed, setCallbacks }
}

export function useTimer(initialDuration: number = 0) {
  const engineRef = useRef(createTimerEngine())
  const [state, setState] = useState<TimerState>({
    mode: 'countdown',
    status: 'idle',
    elapsed: 0,
    remaining: initialDuration,
    totalDuration: initialDuration,
    isFlowState: false,
    overtime: 0,
  })

  useEffect(() => {
    const engine = engineRef.current
    engine.setCallbacks({
      onTick(elapsed, remaining) {
        setState(prev => ({
          ...prev,
          elapsed,
          remaining: prev.mode === 'countdown' ? remaining : elapsed,
          overtime: prev.isFlowState ? elapsed - prev.totalDuration : 0,
        }))
      },
      onComplete() {
        setState(prev => ({
          ...prev,
          status: 'idle',
          remaining: 0,
        }))
      },
    })
  }, [])

  const startCountdown = useCallback((duration: number) => {
    const engine = engineRef.current
    engine.start(duration, true)
    setState({
      mode: 'countdown',
      status: 'running',
      elapsed: 0,
      remaining: duration,
      totalDuration: duration,
      isFlowState: false,
      overtime: 0,
    })
  }, [])

  const startCountup = useCallback(() => {
    const engine = engineRef.current
    engine.start(0, false)
    setState({
      mode: 'countup',
      status: 'running',
      elapsed: 0,
      remaining: 0,
      totalDuration: 0,
      isFlowState: false,
      overtime: 0,
    })
  }, [])

  const pause = useCallback(() => {
    engineRef.current.pause()
    setState(prev => ({ ...prev, status: 'paused' }))
  }, [])

  const resume = useCallback(() => {
    engineRef.current.resume()
    setState(prev => ({ ...prev, status: 'running' }))
  }, [])

  const addTime = useCallback((seconds: number) => {
    engineRef.current.addTime(seconds)
    setState(prev => ({
      ...prev,
      remaining: prev.remaining + seconds,
      totalDuration: prev.totalDuration + seconds,
    }))
  }, [])

  const enterFlowState = useCallback(() => {
    const engine = engineRef.current
    const elapsed = engine.getElapsed()
    engine.stop()
    engine.start(0, false)
    setState(prev => ({
      ...prev,
      mode: 'countup',
      status: 'running',
      isFlowState: true,
      overtime: 0,
      elapsed,
    }))
  }, [])

  const stop = useCallback(() => {
    engineRef.current.stop()
    setState({
      mode: 'countdown',
      status: 'idle',
      elapsed: 0,
      remaining: 0,
      totalDuration: 0,
      isFlowState: false,
      overtime: 0,
    })
  }, [])

  return {
    state,
    startCountdown,
    startCountup,
    pause,
    resume,
    addTime,
    enterFlowState,
    stop,
  }
}
