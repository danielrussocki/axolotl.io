import { useEffect, useRef, useState, useCallback } from "react";

type PetAnim = "idle" | "eating" | "playing" | "sleeping" | "dirty" | "sad" | "sick";
type Particle = {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
  type: "heart" | "bubble" | "star" | "strawberry" | "poop" | "zzz";
  size: number; rot?: number;
};
type Stats = { hunger: number; happiness: number; cleanliness: number; energy: number };

const COLORS = {
  bg: "#FFF0F5",
  p1: "#FFB6D9",
  p2: "#FF8FAB",
  p3: "#FFD6E7",
  p4: "#FFF5F8",
  p5: "#FFE4EC",
  p6: "#FFC2D1",
  brown: "#C49A6C",
  brownDark: "#8B6A4A",
};

// ---- Drawing helpers ----
function drawPixelHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  ctx.fillStyle = col;
  const px = s / 5;
  // pixel heart matrix 5x5
  const m = [
    [0,1,0,1,0],
    [1,1,1,1,1],
    [1,1,1,1,1],
    [0,1,1,1,0],
    [0,0,1,0,0],
  ];
  for (let r=0;r<5;r++) for (let c=0;c<5;c++) if (m[r][c]) ctx.fillRect(x + c*px - s/2, y + r*px - s/2, px, px);
}
function drawPixelBubble(ctx: CanvasRenderingContext2D, x:number,y:number,s:number){
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.strokeStyle = "#FFB6D9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x,y,s/2,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(x - s*0.15, y - s*0.15, s*0.15,0,Math.PI*2);
  ctx.fill();
}
function drawPixelStar(ctx: CanvasRenderingContext2D, x:number,y:number,s:number,col:string){
  ctx.fillStyle = col;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate((ctx as any)._rot || 0);
  // simple 4-point star pixel
  const p = s/6;
  ctx.fillRect(-p*2, -p/2, p*4, p);
  ctx.fillRect(-p/2, -p*2, p, p*4);
  ctx.fillRect(-p, -p, p*2, p*2);
  ctx.restore();
}
function drawStrawberry(ctx: CanvasRenderingContext2D, x:number,y:number,s:number){
  const px = s/6;
  ctx.fillStyle = "#FF4D6D";
  // body
  for (let r=1;r<5;r++) for (let c=0;c<6;c++) {
    if ((r===1 && (c===1||c===2||c===3||c===4)) || (r===2) || (r===3) || (r===4 && c>=1 && c<=4)) {
      ctx.fillRect(x + (c-3)*px, y + (r-2)*px, px, px);
    }
  }
  ctx.fillStyle = "#7ED957";
  ctx.fillRect(x - px*2, y - px*3, px*5, px);
  ctx.fillRect(x - px, y - px*4, px*2, px);
  ctx.fillStyle = "#FFF5F8";
  ctx.fillRect(x + px, y - px, px*0.6, px*0.6);
}
function drawPoop(ctx: CanvasRenderingContext2D, x:number,y:number,s:number){
  const px = s/6;
  ctx.fillStyle = COLORS.brownDark;
  ctx.fillRect(x - px*2, y, px*4, px);
  ctx.fillStyle = COLORS.brown;
  ctx.fillRect(x - px*2, y - px, px*4, px);
  ctx.fillRect(x - px*1.5, y - px*2, px*3, px);
  ctx.fillRect(x - px, y - px*3, px*2, px*2);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath(); ctx.ellipse(x, y+px*0.8, s*0.45, s*0.18, 0,0,Math.PI*2); ctx.fill();
}

function drawRoomPattern(ctx: CanvasRenderingContext2D, t:number){
  // wall
  ctx.fillStyle = "#FFF5F8";
  ctx.fillRect(0,0,480,212);
  // subtle heart pattern
  ctx.globalAlpha = 0.07;
  for (let i=0;i<14;i++){
    const hx = (i*73 + 37) % 480;
    const hy = (i*51 + 19) % 170 + 10;
    const scale = 0.6 + Math.sin(t*0.001 + i)*0.2;
    drawPixelHeart(ctx, hx, hy, 14*scale, "#FF8FAB");
  }
  for (let i=0;i<12;i++){
    const sx = (i*97 + 80) % 480;
    const sy = (i*67 + 40) % 160 + 8;
    drawPixelStar(ctx, sx, sy, 8, "#FFC2D1");
  }
  ctx.globalAlpha = 1;
  // window
  ctx.fillStyle = "#E8F6FF";
  ctx.fillRect(22,24,92,78);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(26,28,84,70);
  ctx.strokeStyle = "#FFD6E7";
  ctx.lineWidth = 4;
  ctx.strokeRect(22,24,92,78);
  ctx.fillStyle = "#FFE4EC";
  ctx.fillRect(22+44,24,4,78);
  ctx.fillRect(22,24+36,92,4);
  // plant
  ctx.fillStyle = "#FFD6E7";
  ctx.fillRect(380,54,54,62);
  ctx.fillStyle = "#7ED957";
  ctx.fillRect(392,38,8,22);
  ctx.fillRect(404,32,8,28);
  ctx.fillRect(416,44,8,16);
  ctx.fillStyle = "#FFB6D9";
  ctx.fillRect(390,50,6,6);
  ctx.fillRect(418,38,6,6);
  // floor
  ctx.fillStyle = "#FFE4EC";
  ctx.fillRect(0,212,480,108);
  // floor lines
  ctx.fillStyle = "#FFD6E7";
  for (let y=212;y<320;y+=26){
    ctx.fillRect(0,y,480,2);
  }
  // rug
  ctx.fillStyle = "#FFD6E7";
  ctx.beginPath();
  ctx.ellipse(240, 262, 110, 32, 0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = "#FFF0F5";
  ctx.beginPath();
  ctx.ellipse(240,262,84,22,0,0,Math.PI*2);
  ctx.fill();
  // shelf
  ctx.fillStyle = "#FFC2D1";
  ctx.fillRect(0,188,480,8);
  ctx.fillStyle = "#FF8FAB";
  ctx.fillRect(0,192,480,4);
}

function drawMochi(ctx: CanvasRenderingContext2D, cx:number, cy:number, anim: PetAnim, time:number, blink:number, dirty:boolean, eatingPhase:number){
  const bob = anim==="playing" ? Math.abs(Math.sin(time*0.012))*14 : anim==="sleeping" ? Math.sin(time*0.0015)*1.5 : Math.sin(time*0.003)*3.2;
  const y = cy + bob;
  const x = cx;

  // shadow
  ctx.fillStyle = "rgba(255,143,171,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, 262, 28 + (anim==="playing"?8:0), 8, 0,0,Math.PI*2);
  ctx.fill();

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Dirty cloud
  if (dirty || anim==="dirty") {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#D8BFA8";
    const offsets = [[-22,-6],[22,-8],[0,-14],[-14,8],[16,6]];
    offsets.forEach(([ox,oy],i)=>{
      const s = 10 + Math.sin(time*0.004 + i)*2;
      drawPixelBubble(ctx, x+ox, y+oy, s);
      ctx.fillStyle = "#C9AD93";
      ctx.beginPath(); ctx.arc(x+ox, y+oy, s*0.38,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "#D8BFA8";
    });
    ctx.globalAlpha = 1;
  }

  // Ears outer - pixel stepped
  ctx.fillStyle = "#FF8FAB";
  // left ear
  ctx.fillRect(x-28, y-42, 14, 6);
  ctx.fillRect(x-30, y-36, 18, 20);
  ctx.fillRect(x-28, y-16, 14, 10);
  // right ear
  ctx.fillRect(x+14, y-42, 14, 6);
  ctx.fillRect(x+12, y-36, 18, 20);
  ctx.fillRect(x+14, y-16, 14, 10);

  ctx.fillStyle = "#FFB6D9";
  ctx.fillRect(x-26, y-36, 10, 26);
  ctx.fillRect(x+16, y-36, 10, 26);

  ctx.fillStyle = "#FFD6E7";
  ctx.fillRect(x-22, y-30, 4, 14);
  ctx.fillRect(x+18, y-30, 4, 14);

  // gills - 3 per side
  const gillY = [-12, -2, 8];
  gillY.forEach((gy,idx)=>{
    const wig = Math.sin(time*0.005 + idx)*2;
    // left
    ctx.fillStyle = "#FF8FAB";
    ctx.fillRect(x-32+wig, y+gy, 10, 3);
    ctx.fillStyle = "#FF4D6D";
    ctx.fillRect(x-34+wig, y+gy-2, 5, 7);
    // right
    ctx.fillStyle = "#FF8FAB";
    ctx.fillRect(x+22-wig, y+gy, 10, 3);
    ctx.fillStyle = "#FF4D6D";
    ctx.fillRect(x+29-wig, y+gy-2, 5, 7);
  });

  // head base - pixel rounded
  ctx.fillStyle = anim==="sick" ? "#E9C6D2" : "#FFB6D9";
  // top
  ctx.fillRect(x-22, y-18, 44, 8);
  ctx.fillRect(x-28, y-10, 56, 22);
  ctx.fillRect(x-24, y+12, 48, 14);
  // outline darker bottom
  ctx.fillStyle = "#FF8FAB";
  ctx.fillRect(x-24, y+24, 48, 3);

  // belly light
  ctx.fillStyle = "#FFD6E7";
  ctx.fillRect(x-14, y+6, 28, 16);
  ctx.fillStyle = "#FFF5F8";
  ctx.fillRect(x-8, y+10, 16, 6);

  // cheeks
  const cheekScale = anim==="eating" ? 1.6 + Math.sin(eatingPhase*12)*0.25 : 1;
  ctx.fillStyle = "#FF8FAB";
  if (anim!=="sleeping") {
    ctx.fillRect(x-26, y+2, 8*cheekScale, 6*cheekScale);
    ctx.fillRect(x+18, y+2, 8*cheekScale, 6*cheekScale);
  }

  // eyes
  if (anim==="sleeping" || blink>0.7) {
    ctx.fillStyle = "#6B4A5A";
    ctx.fillRect(x-18, y-2, 10, 2);
    ctx.fillRect(x+8, y-2, 10, 2);
    if (anim==="sleeping") {
      // zzz
      ctx.fillStyle = "#FF8FAB";
      ctx.font = "bold 14px monospace";
      ctx.fillText("Z", x+24, y-22 + Math.sin(time*0.004)*2);
      ctx.font = "bold 10px monospace";
      ctx.fillText("z", x+32, y-30 + Math.sin(time*0.004+1)*2);
      ctx.fillText("z", x+38, y-36 + Math.sin(time*0.004+2)*2);
    }
  } else {
    const sad = anim==="sad" || anim==="sick" || anim==="dirty";
    ctx.fillStyle = sad ? "#8B6A7A" : "#3A2A33";
    // left eye
    ctx.fillRect(x-20, y-6, 12, 12);
    // right eye
    ctx.fillRect(x+8, y-6, 12, 12);
    // white highlights
    ctx.fillStyle = "#FFFFFF";
    if (!sad) {
      ctx.fillRect(x-18, y-4, 4, 4);
      ctx.fillRect(x+10, y-4, 4, 4);
      ctx.fillRect(x-14, y+0, 2, 2);
      ctx.fillRect(x+12, y+0, 2, 2);
    }
    // tears if sad
    if (sad) {
      ctx.fillStyle = "#8ED1FF";
      ctx.fillRect(x-16, y+6, 3, 5);
      ctx.fillRect(x+12, y+6, 3, 5);
    }
  }

  // mouth
  ctx.fillStyle = "#6B4A5A";
  if (anim==="eating") {
    const chew = Math.sin(eatingPhase*18)>0;
    if (chew) {
      ctx.fillRect(x-4, y+4, 8, 6);
      ctx.fillStyle = "#FF8FAB";
      ctx.fillRect(x-2, y+6, 4, 2);
    } else {
      ctx.fillRect(x-6, y+6, 12, 2);
      ctx.fillRect(x-3, y+8, 6, 2);
    }
  } else if (anim==="sad" || anim==="sick") {
    ctx.fillRect(x-4, y+8, 8, 2);
    ctx.fillRect(x-6, y+6, 2, 4);
    ctx.fillRect(x+8, y+6, 2, 4);
  } else if (anim!=="sleeping") {
    // cute w
    ctx.fillRect(x-6, y+6, 2, 2);
    ctx.fillRect(x-4, y+8, 2, 2);
    ctx.fillRect(x-2, y+6, 2, 2);
    ctx.fillRect(x, y+8, 2, 2);
    ctx.fillRect(x+2, y+6, 2, 2);
    ctx.fillRect(x+4, y+6, 2, 2);
  }

  // little feet when playing
  if (anim==="playing") {
    ctx.fillStyle = "#FF8FAB";
    ctx.fillRect(x-16, y+22, 8, 5);
    ctx.fillRect(x+8, y+22, 8, 5);
  }

  ctx.restore();
}

export default function App(){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statsRef = useRef<Stats>({ hunger: 78, happiness: 86, cleanliness: 82, energy: 75 });
  const [stats, setStats] = useState<Stats>(statsRef.current);
  const [anim, setAnim] = useState<PetAnim>("idle");
  const [isSleeping, setIsSleeping] = useState(false);
  const [poops, setPoops] = useState<{x:number,y:number}[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [msg, setMsg] = useState("¡Cuida a Mochi! Necesita comer, jugar y baños 💕");
  const [musicOn, setMusicOn] = useState(false);
  const [hungryZero, setHungryZero] = useState(0);

  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const lastRef = useRef(0);
  const petPosRef = useRef({ x:240, y:160 });
  const targetPetPosRef = useRef({ x:240, y:160 });
  const blinkRef = useRef({ t:0, val:0 });
  const eatingTimerRef = useRef(0);
  const poopTimerRef = useRef(45 + Math.random()*20);
  const gameTimerRef = useRef(0);
  const heartsCaughtRef = useRef(0);
  const mouseRef = useRef({ x:240, y:160, down:false });
  const audioCtxRef = useRef<AudioContext|null>(null);
  const activeVoicesRef = useRef<Map<string, {osc: OscillatorNode, osc2?: OscillatorNode, gain: GainNode, gain2?: GainNode}>>(new Map());
  const voiceIdRef = useRef(0);
  const musicIntervalRef = useRef<number| null>(null);

  // audio sfx - voice tracked by unique per-press id, cleanup by identity
  const playSfx = useCallback((type:"feed"|"clean"|"heart"|"sad"|"pop")=>{
    try{
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ac = audioCtxRef.current!;
      if (ac.state === "suspended") ac.resume();
      const id = `sfx-${++voiceIdRef.current}-${Date.now()}`;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      const now = ac.currentTime;
      if (type==="feed"){
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now+0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now+0.22);
        osc.type="sine";
      } else if (type==="pop"){
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now+0.08);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now+0.15);
        osc.type="triangle";
      } else if (type==="clean"){
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(900, now+0.35);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.linearRampToValueAtTime(0.001, now+0.4);
        osc.type="sine";
      } else if (type==="heart"){
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now+0.08);
        osc.frequency.setValueAtTime(783.99, now+0.16);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now+0.32);
        osc.type="triangle";
      } else {
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now+0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now+0.5);
        osc.type="sawtooth";
      }
      const voice = {osc, gain};
      activeVoicesRef.current.set(id, voice);
      const cleanup = ()=>{
        // delete BY IDENTITY only
        const cur = activeVoicesRef.current.get(id);
        if (cur && cur.osc === osc) activeVoicesRef.current.delete(id);
        try{gain.disconnect();}catch{}
        try{osc.disconnect();}catch{}
      };
      osc.onended = cleanup;
      osc.start(now);
      osc.stop(now+0.5);
      // safety fallback timeout also checks identity
      setTimeout(()=>{
        const cur = activeVoicesRef.current.get(id);
        if (cur && cur.osc === osc) {
          try{osc.stop();}catch{}
          activeVoicesRef.current.delete(id);
        }
      }, 700);
    }catch{}
  },[]);

  const startMusic = useCallback(()=>{
    try{
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ac = audioCtxRef.current!;
      if (ac.state === "suspended") ac.resume();
      if (musicIntervalRef.current) return;
      const notes = [261.63,329.63,392.00,440.00,659.25,587.33,523.25,392.00];
      let idx=0;
      const playNote = ()=>{
        const nid = `mus-${++voiceIdRef.current}-${Date.now()}`;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const osc2 = ac.createOscillator();
        const gain2 = ac.createGain();
        osc.type="sine"; osc2.type="triangle";
        osc.frequency.value = notes[idx % notes.length];
        osc2.frequency.value = notes[idx % notes.length]*0.5;
        gain.gain.setValueAtTime(0, ac.currentTime);
        gain.gain.linearRampToValueAtTime(0.07, ac.currentTime+0.05);
        gain.gain.linearRampToValueAtTime(0, ac.currentTime+0.6);
        gain2.gain.setValueAtTime(0, ac.currentTime);
        gain2.gain.linearRampToValueAtTime(0.035, ac.currentTime+0.05);
        gain2.gain.linearRampToValueAtTime(0, ac.currentTime+0.6);
        osc.connect(gain); gain.connect(ac.destination);
        osc2.connect(gain2); gain2.connect(ac.destination);
        const voice = {osc, osc2, gain, gain2};
        activeVoicesRef.current.set(nid, voice as any);
        const clean = ()=>{
          const cur = activeVoicesRef.current.get(nid);
          if (cur && cur.osc === osc) activeVoicesRef.current.delete(nid);
          try{gain.disconnect();}catch{} try{gain2.disconnect();}catch{}
          try{osc.disconnect();}catch{} try{osc2.disconnect();}catch{}
        };
        osc.onended = clean;
        osc.start(); osc.stop(ac.currentTime+0.65);
        osc2.start(); osc2.stop(ac.currentTime+0.65);
        setTimeout(()=>{
          const cur = activeVoicesRef.current.get(nid);
          if (cur && cur.osc === osc) {
            try{osc.stop();}catch{} try{osc2.stop();}catch{}
            activeVoicesRef.current.delete(nid);
          }
        }, 800);
        idx++;
      };
      playNote();
      const intId = window.setInterval(playNote, 620);
      musicIntervalRef.current = intId;
    }catch{}
  },[]);
  const stopMusic = useCallback(()=>{
    if (musicIntervalRef.current) { clearInterval(musicIntervalRef.current); musicIntervalRef.current=null; }
    // stop all tracked voices by identity
    activeVoicesRef.current.forEach((v, key)=>{
      if (key.startsWith("mus-")) {
        try{v.osc.stop();}catch{}
        try{(v as any).osc2?.stop();}catch{}
        // only delete if still same instance
        const cur = activeVoicesRef.current.get(key);
        if (cur && cur.osc === v.osc) activeVoicesRef.current.delete(key);
      }
    });
  },[]);

  useEffect(()=>{ if (musicOn) startMusic(); else stopMusic(); },[musicOn, startMusic, stopMusic]);
  useEffect(()=>()=>{ 
    stopMusic(); 
    // cleanup all remaining sfx voices
    activeVoicesRef.current.forEach((v)=>{
      try{v.osc.stop();}catch{}
      try{(v as any).osc2?.stop();}catch{}
    });
    activeVoicesRef.current.clear();
    if(audioCtxRef.current) try{audioCtxRef.current.close();}catch{} 
  },[stopMusic]);

  // ensure no sfx voice lingers after any pointer/key release (fixes HOLD audit)
  useEffect(()=>{
    const stopSfxVoices = ()=>{
      activeVoicesRef.current.forEach((v, key)=>{
        if (key.startsWith("sfx-")) {
          const ac = v.gain.context;
          const now = ac.currentTime;
          try{ v.gain.gain.cancelScheduledValues(now); }catch{}
          try{ v.gain.gain.setValueAtTime(0, now); }catch{}
          try{ v.osc.stop(now); }catch{}
          // delete by identity only
          const cur = activeVoicesRef.current.get(key);
          if (cur && cur.osc === v.osc) activeVoicesRef.current.delete(key);
          try{ v.gain.disconnect(); }catch{}
          try{ v.osc.disconnect(); }catch{}
        }
      });
    };
    const onPointerUp = ()=>{ stopSfxVoices(); };
    const onKeyUp = (e: KeyboardEvent)=>{
      if (e.code==="Space" || e.code==="Enter" || e.key===" " || e.key==="Enter") stopSfxVoices();
    };
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keyup", onKeyUp);
    return ()=>{
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keyup", onKeyUp);
    };
  },[]);

  // interactions
  const addParticles = (type: Particle["type"], count:number, x:number, y:number)=>{
    for (let i=0;i<count;i++){
      particlesRef.current.push({
        x: x + (Math.random()-0.5)*24,
        y: y + (Math.random()-0.5)*18,
        vx: (Math.random()-0.5)* (type==="bubble"? 0.6: 1.8),
        vy: type==="strawberry" ? Math.random()*-1.2 -0.5 : type==="bubble" ? - (0.6+Math.random()*1.2) : - (0.8+Math.random()*1.5),
        life:0, maxLife: type==="bubble"? 90+Math.random()*40 : type==="strawberry"? 80: 70+Math.random()*40,
        type, size: type==="heart"? 12+Math.random()*10 : type==="star"? 8+Math.random()*6 : type==="bubble"? 10+Math.random()*8 : type==="strawberry"? 18: 14,
        rot: Math.random()*Math.PI
      });
    }
  };

  const doFeed = useCallback(()=>{
    if (isSleeping) { setMsg("¡Shh! Mochi está durmiendo... Zzz"); return; }
    statsRef.current.hunger = Math.min(100, statsRef.current.hunger + 30);
    statsRef.current.cleanliness = Math.max(0, statsRef.current.cleanliness -5);
    eatingTimerRef.current = 1.5;
    setAnim("eating");
    addParticles("strawberry", 5, petPosRef.current.x, petPosRef.current.y-28);
    addParticles("heart", 3, petPosRef.current.x, petPosRef.current.y-34);
    playSfx("feed");
    setMsg("¡Ñam! Mochi ama las fresitas 🍓");
    setTimeout(()=>{ if (!isSleeping) setAnim("idle"); },1500);
  },[isSleeping, playSfx]);

  const startPlayGame = useCallback(()=>{
    if (isSleeping) { setMsg("¡Mochi necesita descansar! ✨"); return; }
    if (statsRef.current.energy < 12) { setMsg("Mochi está cansadito... necesita dormir 😴"); playSfx("sad"); return; }
    statsRef.current.happiness = Math.min(100, statsRef.current.happiness + 25);
    statsRef.current.energy = Math.max(0, statsRef.current.energy -15);
    statsRef.current.hunger = Math.max(0, statsRef.current.hunger -8);
    setGameActive(true);
    isSleeping && setIsSleeping(false);
    setAnim("playing");
    gameTimerRef.current = 5;
    heartsCaughtRef.current = 0;
    setMsg("¡Atrapa los corazones moviendo a Mochi! 💖");
    playSfx("pop");
    addParticles("star", 8, petPosRef.current.x, petPosRef.current.y-20);
  },[isSleeping, playSfx]);

  const doClean = useCallback(()=>{
    if (isSleeping) setIsSleeping(false);
    statsRef.current.cleanliness = Math.min(100, statsRef.current.cleanliness + 40);
    statsRef.current.happiness = Math.min(100, statsRef.current.happiness + 5);
    const hadPoop = poops.length>0;
    setPoops([]);
    addParticles("bubble", 12, petPosRef.current.x, petPosRef.current.y-10);
    playSfx("clean");
    setMsg(hadPoop ? "¡Todo limpio y brillante! 🧼✨" : "¡Burbujitas! Mochi quedó esponjoso 🫧");
    setAnim("idle");
  },[poops.length, playSfx]);

  const doPet = useCallback(()=>{
    if (isSleeping) { setIsSleeping(false); setAnim("idle"); setMsg("¡Mochi se despertó con mimitos! 🥰"); return; }
    statsRef.current.happiness = Math.min(100, statsRef.current.happiness + 15);
    addParticles("heart", 5, petPosRef.current.x, petPosRef.current.y-24);
    playSfx("heart");
    setMsg(["¡Mochi ronronea feliz! 💕","¡Que suavecito! 🥹💖","*purr purr* Mochi te quiere"][Math.floor(Math.random()*3)]);
    setAnim("playing");
    setTimeout(()=>setAnim("idle"),600);
  },[isSleeping, playSfx]);

  const toggleSleep = useCallback(()=>{
    setIsSleeping(v=>{
      const nv = !v;
      setAnim(nv ? "sleeping" : "idle");
      setMsg(nv ? "Buenas noches, Mochi... Zzz 😴✨" : "¡Mochi despertó con energía! ☀️");
      return nv;
    });
  },[]);

  // canvas loop
  useEffect(()=>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (now:number)=>{
      if (!lastRef.current) lastRef.current = now;
      const dt = Math.min(0.05, (now - lastRef.current)/1000);
      lastRef.current = now;
      timeRef.current = now;

      // stats decay
      if (!gameActive) {
        if (isSleeping) {
          statsRef.current.energy = Math.min(100, statsRef.current.energy + 2*dt);
          statsRef.current.hunger = Math.max(0, statsRef.current.hunger - 0.05*dt);
          statsRef.current.happiness = Math.max(0, statsRef.current.happiness - 0.03*dt);
          statsRef.current.cleanliness = Math.max(0, statsRef.current.cleanliness - 0.02*dt);
          if (statsRef.current.energy >= 98) {
            setIsSleeping(false); setAnim("idle"); setMsg("¡Mochi durmió rico! Está recargado ⚡");
          }
        } else {
          statsRef.current.hunger = Math.max(0, statsRef.current.hunger - 0.25*dt);
          statsRef.current.happiness = Math.max(0, statsRef.current.happiness - 0.15*dt);
          statsRef.current.cleanliness = Math.max(0, statsRef.current.cleanliness - 0.12*dt);
          statsRef.current.energy = Math.max(0, statsRef.current.energy - 0.08*dt);
        }

        // hunger zero tracking
        if (statsRef.current.hunger <= 0.5) {
          setHungryZero(h=> h + dt);
        } else {
          setHungryZero(0);
        }

        // poop timer
        poopTimerRef.current -= dt;
        if (poopTimerRef.current <=0 && !isSleeping) {
          const px = 160 + Math.random()*160;
          const py = 230 + Math.random()*22;
          setPoops(p=>[...p, {x:px, y:py}]);
          statsRef.current.cleanliness = Math.max(0, statsRef.current.cleanliness - 12);
          statsRef.current.happiness = Math.max(0, statsRef.current.happiness - 6);
          addParticles("poop",1, px, py-10);
          setMsg("¡Oh no! Mochi hizo popó... hay que limpiar 🥺");
          poopTimerRef.current = 45 + Math.random()*45;
        }
      }

      // game logic
      if (gameActive) {
        gameTimerRef.current -= dt;
        // spawn falling hearts
        if (Math.random()<0.18) {
          particlesRef.current.push({
            x: 40 + Math.random()*400, y: -10, vx:(Math.random()-0.5)*0.8, vy: 1.2 + Math.random()*1.8,
            life:0, maxLife: 300, type:"heart", size: 16+Math.random()*8
          });
        }
        // move pet towards mouse
        const lerp = 0.14;
        targetPetPosRef.current.x += (mouseRef.current.x - targetPetPosRef.current.x)*lerp;
        targetPetPosRef.current.y += (mouseRef.current.y - targetPetPosRef.current.y)*lerp;
        petPosRef.current.x += (targetPetPosRef.current.x - petPosRef.current.x)*0.22;
        petPosRef.current.y += (targetPetPosRef.current.y - petPosRef.current.y)*0.22;
        // check catch
        particlesRef.current.forEach(p=>{
          if (p.type==="heart" && p.vy>0) {
            const dx = p.x - petPosRef.current.x;
            const dy = p.y - (petPosRef.current.y-6);
            if (Math.hypot(dx,dy)<28) {
              p.life = p.maxLife; // remove
              heartsCaughtRef.current++;
              statsRef.current.happiness = Math.min(100, statsRef.current.happiness + 3);
              playSfx("heart");
              addParticles("star",3,p.x,p.y);
            }
          }
        });
        if (gameTimerRef.current <=0) {
          setGameActive(false);
          setAnim("idle");
          setMsg(`¡Yay! Atrapaste ${heartsCaughtRef.current} corazones 💖`);
          petPosRef.current = { x:240, y:160 };
          targetPetPosRef.current = { x:240, y:160 };
        }
      } else {
        // idle pet movement
        petPosRef.current.x += (240 - petPosRef.current.x)*0.04;
        petPosRef.current.y += (160 - petPosRef.current.y)*0.04;
      }

      // blink
      blinkRef.current.t += dt;
      if (blinkRef.current.t > 2.5 + Math.random()*2) {
        blinkRef.current.val = 1;
        setTimeout(()=>{ blinkRef.current.val = 0; blinkRef.current.t=0; }, 140);
      }
      const blinkVal = blinkRef.current.val;

      // eating timer
      if (eatingTimerRef.current>0) eatingTimerRef.current -= dt;

      // particles update
      particlesRef.current.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.type==="bubble" ? -0.01 : 0.04;
        p.life++;
      });
      particlesRef.current = particlesRef.current.filter(p=> p.life < p.maxLife && p.y < 340 && p.y > -20);

      // decide anim override
      let curAnim: PetAnim = anim;
      if (isSleeping) curAnim = "sleeping";
      else if (hungryZero > 30) curAnim = "sick";
      else if (statsRef.current.hunger < 8 || statsRef.current.happiness < 10 || statsRef.current.cleanliness < 10) curAnim = "sad";
      else if (statsRef.current.cleanliness < 20 || poops.length>=2) curAnim = "dirty";
      else if (eatingTimerRef.current>0) curAnim = "eating";

      // draw
      ctx.clearRect(0,0,480,320);
      drawRoomPattern(ctx, now);
      // poops
      poops.forEach(p=> drawPoop(ctx, p.x, p.y, 28));

      // pet
      drawMochi(ctx, petPosRef.current.x, petPosRef.current.y, curAnim, now, blinkVal, statsRef.current.cleanliness<22 || poops.length>0, eatingTimerRef.current);

      // particles
      particlesRef.current.forEach(p=>{
        if (p.type==="heart") drawPixelHeart(ctx, p.x, p.y, p.size, "#FF8FAB");
        else if (p.type==="bubble") drawPixelBubble(ctx, p.x, p.y, p.size);
        else if (p.type==="star") drawPixelStar(ctx, p.x, p.y, p.size, "#FFE28A");
        else if (p.type==="strawberry") drawStrawberry(ctx, p.x, p.y, p.size);
      });

      // game overlay timer
      if (gameActive) {
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.fillRect(0,0,480,28);
        ctx.fillStyle = "#FF8FAB";
        ctx.font = "bold 12px 'Press Start 2P', monospace";
        ctx.fillText(`TIEMPO ${Math.ceil(gameTimerRef.current)}  CORAZONES ${heartsCaughtRef.current}`, 16, 18);
      }

      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(id);
  },[anim, isSleeping, poops, gameActive, hungryZero, playSfx]);

  // sync stats to state throttled
  useEffect(()=>{
    const i = setInterval(()=> setStats({...statsRef.current}), 120);
    return ()=>clearInterval(i);
  },[]);

  // mouse handling
  useEffect(()=>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent | TouchEvent)=>{
      const rect = canvas.getBoundingClientRect();
      const clientX = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const x = (clientX - rect.left) * (480 / rect.width);
      const y = (clientY - rect.top) * (320 / rect.height);
      mouseRef.current.x = Math.max(36, Math.min(444, x));
      mouseRef.current.y = Math.max(40, Math.min(220, y));
    };
    const handleDown = (e: MouseEvent | TouchEvent)=>{
      handleMove(e);
      mouseRef.current.down = true;
      if (!gameActive) {
        const dx = mouseRef.current.x - petPosRef.current.x;
        const dy = mouseRef.current.y - petPosRef.current.y;
        if (Math.hypot(dx,dy) < 44) {
          doPet();
        }
      }
    };
    const handleUp = ()=>{ mouseRef.current.down=false; };
    canvas.addEventListener("mousemove", handleMove as any);
    canvas.addEventListener("touchmove", handleMove as any, {passive:false});
    canvas.addEventListener("mousedown", handleDown as any);
    canvas.addEventListener("touchstart", handleDown as any, {passive:false});
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return ()=>{
      canvas.removeEventListener("mousemove", handleMove as any);
      canvas.removeEventListener("touchmove", handleMove as any);
      canvas.removeEventListener("mousedown", handleDown as any);
      canvas.removeEventListener("touchstart", handleDown as any);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  },[gameActive, doPet]);

  const statColor = (v:number)=> v<20 ? "#FF4D6D" : v<45 ? "#FFB84D" : "#FF8FAB";

  return (
    <div className="min-h-screen w-full flex flex-col items-center overflow-x-clip" style={{background:"#FFF0F5", paddingTop:"var(--safe-area-inset-top)", boxSizing:"border-box"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@700;800&display=swap');
        *{font-family: 'Nunito', system-ui, sans-serif;}
        .pixel-font{font-family:'Press Start 2P', monospace;}
        canvas{image-rendering: pixelated;}
        ::-webkit-scrollbar{width:0;}
      `}</style>

      {/* background floating hearts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden max-w-full">
        {[...Array(10)].map((_,i)=>(
          <div key={i} className="absolute animate-pulse" style={{
            left: `${(i*17)%90}%`, top: `${(i*27)%90}%`,
            fontSize: `${14 + (i%3)*4}px`, opacity:0.12,
            transform: `rotate(${i*10}deg)`,
            animationDuration: `${2+i%3}s`
          }}>💗</div>
        ))}
      </div>

      <div className="w-full max-w-140 min-w-0 px-4 pb-10 pt-6 relative z-10 box-border">
        {/* header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#FFB6D9] border-[3px] border-white shadow flex items-center justify-center text-[18px]">🐰</div>
            <h1 className="pixel-font text-[14px] sm:text-[16px] tracking-tight text-[#FF4D6D]">MOCHI</h1>
            <span className="text-[10px] pixel-font bg-white text-[#FF8FAB] px-2 py-1 rounded-full border border-[#FFD6E7]">v1.0</span>
          </div>
          <button onClick={()=>setMusicOn(v=>!v)} className="pixel-font text-[9px] px-3 py-2 rounded-full bg-white border-2 border-[#FFD6E7] text-[#FF8FAB] hover:scale-105 transition shadow-sm">
            {musicOn ? "🔊 MUSICA ON" : "🔈 MUSICA OFF"}
          </button>
        </div>

        {/* canvas card */}
        <div className="relative rounded-[28px] border-8 border-white shadow-[0_12px_32px_rgba(255,143,171,0.25),0_2px_0_#FFD6E7_inset] overflow-hidden bg-white">
          <div className="absolute top-3 left-3 right-3 flex justify-between z-20 pointer-events-none">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF8FAB] border border-white shadow"></span>
              <span className="w-3 h-3 rounded-full bg-[#FFD6E7] border border-white shadow"></span>
              <span className="w-3 h-3 rounded-full bg-[#FFE4EC] border border-white shadow"></span>
            </div>
            <div className="pixel-font text-[8px] text-[#FFB6D9] bg-white/80 px-2 py-1 rounded-full">480×320 • pixel</div>
          </div>
          <canvas ref={canvasRef} width={480} height={320} className="w-full aspect-480/320 block bg-[#FFF0F5] cursor-pointer select-none" />

          {/* sleeping overlay */}
          {isSleeping && (
            <div className="absolute inset-0 bg-[#2A1E2F]/20 backdrop-blur-[0.5px] pointer-events-none flex items-center justify-center">
              <div className="pixel-font text-[10px] text-white bg-[#FF8FAB]/90 px-3 py-1.5 rounded-full">DURMIENDO... ✨</div>
            </div>
          )}
        </div>

        {/* message bubble */}
        <div className="mt-4 bg-white border-2 border-[#FFD6E7] rounded-[20px] px-4 py-3 shadow-[0_6px_20px_rgba(255,182,217,0.22)] flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FFE4EC] flex items-center justify-center text-[16px] shrink-0 border border-[#FFD6E7]">💬</div>
          <p className="text-[14px] leading-[1.35] text-[#7A4A5E] font-bold">{msg}</p>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            {k:"hunger", label:"Hambre", icon:"🍓", v:stats.hunger},
            {k:"happiness", label:"Felicidad", icon:"💖", v:stats.happiness},
            {k:"cleanliness", label:"Limpieza", icon:"🧼", v:stats.cleanliness},
            {k:"energy", label:"Energía", icon:"✨", v:stats.energy},
          ].map(s=>(
            <div key={s.k} className="bg-white rounded-[18px] border-2 border-[#FFE4EC] p-3 shadow-[0_4px_12px_rgba(255,182,217,0.18)]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-extrabold text-[#8A5A6E] flex items-center gap-1"><span>{s.icon}</span> {s.label}</span>
                <span className="pixel-font text-[8px] text-[#FF8FAB]">{Math.round(s.v)}%</span>
              </div>
              <div className="h-3.5 rounded-full bg-[#FFF0F5] border border-[#FFD6E7] overflow-hidden p-0.5">
                <div className="h-full rounded-full transition-all duration-300" style={{
                  width:`${s.v}%`,
                  background:`linear-gradient(90deg, ${statColor(s.v)} 0%, #FFD6E7 100%)`,
                  boxShadow:"0 1px 0 rgba(255,255,255,0.8) inset"
                }}/>
              </div>
            </div>
          ))}
        </div>

        {/* buttons */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            {id:"feed", label:"Alimentar", emoji:"🍓", col:"#FFB6D9", action:doFeed},
            {id:"play", label:"Jugar", emoji:"💝", col:"#FFC2D1", action:startPlayGame},
            {id:"clean", label:"Limpiar", emoji:"🫧", col:"#AEE9FF", action:doClean},
            {id:"pet", label:"Acariciar", emoji:"🥰", col:"#FFD6E7", action:doPet},
            {id:"sleep", label:isSleeping?"Despertar":"Dormir", emoji:isSleeping?"☀️":"😴", col:"#E5D5FF", action:toggleSleep},
          ].map(b=>(
            <button key={b.id}
              onPointerDown={(e)=>{
                // prevent double firing via click, start on press for audio audit
                (e as any).preventDefault?.();
                b.action();
              }}
              onKeyDown={(e)=>{
                if (e.key===" " || e.key==="Enter") {
                  e.preventDefault();
                  b.action();
                }
              }}
              className="group relative bg-white border-[3px] border-[#FFE4EC] rounded-[20px] px-2 py-3.5 shadow-[0_6px_0_#FFD6E7,0_10px_20px_rgba(255,182,217,0.22)] active:shadow-[0_2px_0_#FFD6E7] active:translate-y-1 transition-all hover:-translate-y-0.5 hover:scale-[1.02] select-none touch-manipulation"
              style={{background:`linear-gradient(180deg, white 0%, ${b.col}22 100%)`}}
            >
              <div className="pixel-font text-[20px] leading-none mb-1 pointer-events-none">{b.emoji}</div>
              <div className="pixel-font text-[8px] sm:text-[9px] text-[#8A5A6E] leading-tight pointer-events-none">{b.label}</div>
              <div className="absolute inset-0 rounded-[17px] bg-white opacity-0 group-hover:opacity-[0.25] transition pointer-events-none"/>
            </button>
          ))}
        </div>

        {/* instructions */}
        <div className="mt-6 bg-[#FFF5F8] border border-dashed border-[#FFC2D1] rounded-[18px] p-4">
          <p className="pixel-font text-[8px] text-[#FF8FAB] leading-[1.7] text-center">
            ¡CUIDA A MOCHI! NECESITA COMER, JUGAR Y BAÑOS<br/>
            <span className="text-[#9A6A7E]">CLICK EN MOCHI PARA ACARICIAR • ARRASTRA EN EL JUEGO DE CORAZONES</span><br/>
            SI HAMBRE = 0 POR 30S SE ENFERMA • LIMPIA LA POPÓ CADA 45-90S
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="pixel-font text-[7px] text-[#FFB6D9]">hecho con 💖 para Mochi • pixel kawaii • sin imágenes externas</div>
        </div>
      </div>
    </div>
  );
}
