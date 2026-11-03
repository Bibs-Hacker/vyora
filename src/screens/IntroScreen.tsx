import { useEffect, useMemo, useState } from 'react'
import { VyoraMark } from '../components/Icons'

export function IntroScreen({ onDone }: { onDone: (goTo: 'register' | 'login') => void }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 1600); return () => clearTimeout(t) }, [])
  const dots = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 8, dur: 7 + Math.random() * 7, size: 2 + Math.random() * 3
  })), [])

  function finish(goTo: 'register' | 'login') {
    localStorage.setItem('vyora.introSeen', '1')
    onDone(goTo)
  }

  return (
    <div className='intro'>
      <div className='particles' aria-hidden>
        <span className='orb a' /><span className='orb b' />
        {dots.map((d, i) => (
          <span key={i} className='dot' style={{
            left: `${d.left}%`, bottom: '-10px', width: d.size, height: d.size,
            animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`
          }} />
        ))}
      </div>
      <button className='intro-skip' onClick={() => finish('login')}>Skip</button>
      <div className='intro-inner'>
        <VyoraMark className='intro-mark' />
        <h1 className='intro-title'>VYORA</h1>
        <p className='intro-tag'>A world made for connection</p>
        <div className='intro-cta' style={{ opacity: ready ? 1 : 0.4, pointerEvents: ready ? 'auto' : 'none' }}>
          <button className='btn primary block' onClick={() => finish('register')}>Create account</button>
          <button className='btn ghost block' onClick={() => finish('login')}>Sign in</button>
        </div>
      </div>
      <div className='intro-credit'>Created by Dev Brian</div>
    </div>
  )
}
