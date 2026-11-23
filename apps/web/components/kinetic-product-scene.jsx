'use client'

import { useEffect, useRef } from 'react'
import { InteractiveAgentDemo } from './interactive-agent-demo'

export function KineticProductScene() {
  const sceneRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const motionScene = scene

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }

    function applyMotion(x, y) {
      motionScene.style.setProperty('--scene-rx', `${y * -3.2}deg`)
      motionScene.style.setProperty('--scene-ry', `${x * 5.2}deg`)
      motionScene.style.setProperty('--scene-x', `${x * 4}px`)
      motionScene.style.setProperty('--scene-y', `${y * 3}px`)
      motionScene.style.setProperty('--float-x', `${x * 18}px`)
      motionScene.style.setProperty('--float-y', `${y * 14}px`)
      motionScene.style.setProperty('--float-far-x', `${x * -11}px`)
      motionScene.style.setProperty('--float-far-y', `${y * -8}px`)
      motionScene.style.setProperty('--glow-x', `${50 + x * 22}%`)
      motionScene.style.setProperty('--glow-y', `${48 + y * 20}%`)
    }

    function animateMotion() {
      const easing = 0.08
      current.x += (target.x - current.x) * easing
      current.y += (target.y - current.y) * easing
      applyMotion(current.x, current.y)

      if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
        frameRef.current = window.requestAnimationFrame(animateMotion)
      } else {
        current.x = target.x
        current.y = target.y
        applyMotion(current.x, current.y)
        frameRef.current = null
      }
    }

    function startMotion() {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(animateMotion)
      }
    }

    function returnToRest() {
      target.x = 0
      target.y = 0
      startMotion()
    }

    function handlePointerMove(event) {
      if (reducedMotion.matches || event.pointerType === 'touch') return

      target.x = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth - 0.5) * 2))
      target.y = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight - 0.5) * 2))
      startMotion()
    }

    function handlePointerOut(event) {
      if (event.relatedTarget === null) returnToRest()
    }

    function handleReducedMotionChange() {
      if (!reducedMotion.matches) return
      target.x = 0
      target.y = 0
      current.x = 0
      current.y = 0
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      applyMotion(0, 0)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerout', handlePointerOut)
    window.addEventListener('blur', returnToRest)
    reducedMotion.addEventListener('change', handleReducedMotionChange)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('blur', returnToRest)
      reducedMotion.removeEventListener('change', handleReducedMotionChange)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [])

  return (
    <div ref={sceneRef} className="product-scene kinetic-scene">
      <div className="kinetic-field" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="kinetic-route" aria-hidden="true">
        <svg viewBox="0 0 1200 620" preserveAspectRatio="none">
          <path d="M15 138 C160 138 142 40 282 40 L920 40 C1080 40 1030 540 1185 540" />
          <circle cx="15" cy="138" r="5" />
          <circle cx="1185" cy="540" r="5" />
        </svg>
        <span className="route-label route-label-input">TASK</span>
        <span className="route-label route-label-output">DECISION</span>
      </div>
      <div className="intent-capsule" aria-hidden="true">
        <span>TASK / EXISTING PROJECT</span>
        <strong>Добавь request ID в каждый ответ API</strong>
      </div>
      <div className="scene-note scene-note-top" aria-hidden="true">
        <span className="pulse-dot" />
        Патч не применён
      </div>
      <div className="kinetic-stage">
        <InteractiveAgentDemo />
      </div>
      <div className="review-float" aria-hidden="true">
        <p>Check patch</p>
        <strong>
          17 <span>/ 18</span>
        </strong>
        <div className="review-meter">
          <i />
        </div>
        <small>1 тест требует внимания</small>
      </div>
      <div className="kinetic-caption" aria-hidden="true">
        <span>ASK → PLAN → DIFF → CHECK → ACCEPT</span>
        <span>TRIPLECODE PATCH REVIEW / LIVE</span>
      </div>
    </div>
  )
}
