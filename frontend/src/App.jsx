import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const http = axios.create({ timeout: 8000 });

const COLORS = {
  current_affairs: "#22d3ee",
  ai_ml:           "#a78bfa",
  tech:            "#60a5fa",
  business:        "#fb923c",
  science:         "#34d399",
  sports:          "#f472b6",
  entertainment:   "#fbbf24",
  world:           "#c084fc",
  politics:        "#f87171",
  war:             "#ef4444",
  health:          "#4ade80",
  crypto:          "#f59e0b",
  space:           "#818cf8",
  environment:     "#86efac",
};

const ICONS = {
  current_affairs: "🇮🇳",
  ai_ml:           "🤖",
  tech:            "💻",
  business:        "📈",
  science:         "🔬",
  sports:          "🏏",
  entertainment:   "🎬",
  world:           "🌍",
  politics:        "🏛️",
  war:             "⚔️",
  health:          "🏥",
  crypto:          "₿",
  space:           "🚀",
  environment:     "🌿",
};

const P = {
  bg:      "#07070f",
  surface: "#0d0d1a",
  sur2:    "#11111f",
  border:  "#ffffff0a",
  bor2:    "#ffffff14",
  text:    "#f0f0ff",
  mid:     "#6b7280",
  dim:     "#2a2a3a",
};

// ── AUDIO ─────────────────────────────────────────────────────
let _ac = null;
const ac = () => { if (!_ac) _ac = new (window.AudioContext||window.webkitAudioContext)(); return _ac; };
function tone(f, type="sine", dur=0.08, vol=0.04, delay=0) {
  try {
    const c=ac(), o=c.createOscillator(), g=c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type=type; o.frequency.value=f;
    const t=c.currentTime+delay;
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vol,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.start(t); o.stop(t+dur+0.01);
  } catch(e){}
}
const sfx = {
  hover:    ()=>tone(1400,"sine",0.05,0.02),
  click:    ()=>{ tone(900,"sine",0.07,0.05); tone(1200,"sine",0.09,0.04,0.07); },
  category: ()=>{ tone(600,"triangle",0.1,0.05); tone(900,"triangle",0.1,0.04,0.1); tone(1200,"triangle",0.08,0.03,0.2); },
  notify:   ()=>{ tone(880,"sine",0.2,0.07); tone(1320,"sine",0.15,0.05,0.22); },
  scroll:   ()=>tone(700,"sine",0.04,0.012),
};

// ── CURSOR ────────────────────────────────────────────────────
function Cursor() {
  const mx = useMotionValue(-200), my = useMotionValue(-200);
  const dx = useSpring(mx, { stiffness: 2000, damping: 60, mass: 0.1 });
  const dy = useSpring(my, { stiffness: 2000, damping: 60, mass: 0.1 });
  const rx = useSpring(mx, { stiffness: 300, damping: 30, mass: 0.4 });
  const ry = useSpring(my, { stiffness: 300, damping: 30, mass: 0.4 });
  const [hov, setHov] = useState(false);
  const [click, setClick] = useState(false);

  useEffect(() => {
    const move = e => { mx.set(e.clientX); my.set(e.clientY); };
    const over  = e => setHov(!!e.target.closest("a,button,select,input,[data-hover]"));
    const down  = () => setClick(true);
    const up    = () => setClick(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup",   up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup",   up);
    };
  }, [mx, my]);

  return (
    <>
      <motion.div style={{
        position:"fixed", zIndex:9998, pointerEvents:"none",
        left:rx, top:ry,
        width: hov?46:30, height: hov?46:30,
        borderRadius:"50%",
        border:`1.5px solid ${hov?"#a78bfa80":"#ffffff20"}`,
        translateX:"-50%", translateY:"-50%",
        scale: click ? 0.8 : 1,
        transition:"width 0.2s,height 0.2s,border-color 0.2s,scale 0.1s",
        boxShadow: hov ? "0 0 16px #a78bfa40" : "none",
      }} />
      <motion.div style={{
        position:"fixed", zIndex:9999, pointerEvents:"none",
        left:dx, top:dy,
        width: click?9:5, height: click?9:5,
        borderRadius:"50%",
        background: hov?"#a78bfa":"#ffffff",
        translateX:"-50%", translateY:"-50%",
        transition:"width 0.08s,height 0.08s,background 0.15s",
        boxShadow: hov?"0 0 14px #a78bfa":"0 0 6px #ffffff50",
      }} />
    </>
  );
}

// ── PARTICLES ─────────────────────────────────────────────────
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize(); window.addEventListener("resize",resize);
    const pts = Array.from({length:50},()=>({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      r:Math.random()*1.1+0.2,
      dx:(Math.random()-0.5)*0.15, dy:(Math.random()-0.5)*0.15,
      c:["#22d3ee","#a78bfa","#60a5fa","#fb923c","#34d399"][Math.floor(Math.random()*5)],
      a:Math.random()*0.2+0.03,
    }));
    let id;
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p=>{
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.c+Math.floor(p.a*255).toString(16).padStart(2,"0");
        ctx.fill();
        p.x+=p.dx; p.y+=p.dy;
        if(p.x<0||p.x>canvas.width) p.dx*=-1;
        if(p.y<0||p.y>canvas.height) p.dy*=-1;
      });
      id=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none",opacity:0.2}} />;
}

// ── LIVE CLOCK ────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(()=>setTime(new Date()),1000);
    return ()=>clearInterval(t);
  },[]);
  return (
    <span style={{color:P.dim,fontWeight:600,fontSize:10,letterSpacing:1,fontVariantNumeric:"tabular-nums"}}>
      {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
    </span>
  );
}

// ── TICKER ────────────────────────────────────────────────────
function Ticker({articles}) {
  const items = articles.slice(0,16);
  return (
    <div style={{background:"#000",borderBottom:`1px solid ${P.border}`,overflow:"hidden",padding:"9px 0",userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center"}}>
        <motion.div animate={{opacity:[1,0.6,1]}} transition={{repeat:Infinity,duration:1.8}}
          style={{background:"linear-gradient(90deg,#a78bfa,#22d3ee)",padding:"3px 16px",
            fontSize:9,fontWeight:900,letterSpacing:3,color:"#fff",whiteSpace:"nowrap",
            marginRight:20,borderRadius:"0 14px 14px 0",flexShrink:0}}>
          ⚡ LIVE
        </motion.div>
        <div style={{overflow:"hidden",flex:1}}>
          <motion.div
            animate={{x:["0%","-50%"]}}
            transition={{repeat:Infinity,duration:80,ease:"linear"}}
            style={{display:"inline-flex",gap:60,whiteSpace:"nowrap"}}
          >
            {[...items,...items].map((a,i)=>(
              <span key={i}
                style={{fontSize:12,color:P.mid,cursor:"none",transition:"color 0.2s",fontWeight:500}}
                onMouseEnter={e=>{e.target.style.color=COLORS[a.category]||"#a78bfa";sfx.hover();}}
                onMouseLeave={e=>e.target.style.color=P.mid}
                onClick={()=>{sfx.click();window.open(a.url,"_blank");}}>
                <span style={{color:COLORS[a.category],marginRight:6}}>{ICONS[a.category]}</span>
                {a.title.slice(0,70)}
                <span style={{color:P.dim,margin:"0 28px"}}>·</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── COUNTER ───────────────────────────────────────────────────
function AnimCount({to}) {
  const [v,setV]=useState(0);
  useEffect(()=>{
    let s=0; const step=to/(1600/16);
    const t=setInterval(()=>{s+=step;if(s>=to){setV(to);clearInterval(t);}else setV(Math.floor(s));},16);
    return()=>clearInterval(t);
  },[to]);
  return <>{v.toLocaleString()}</>;
}

// ── RING ──────────────────────────────────────────────────────
function Ring({cat,value,total,color,icon,onClick,active}) {
  const pct=total?(value/total)*100:0;
  const r=26;
  return (
    <motion.div data-hover="true"
      whileHover={{y:-5,scale:1.05}} whileTap={{scale:0.94}}
      onClick={()=>{onClick(cat);sfx.category();}}
      onMouseEnter={()=>sfx.hover()}
      style={{
        display:"flex",flexDirection:"column",alignItems:"center",
        padding:"18px 12px",borderRadius:18,cursor:"none",
        background:active?`${color}12`:"transparent",
        border:`1px solid ${active?color+"35":P.border}`,
        flex:1,minWidth:95,
        boxShadow:active?`0 0 20px ${color}20`:"none",
        transition:"all 0.3s",willChange:"transform",
      }}
    >
      <div style={{position:"relative",width:64,height:64,marginBottom:10}}>
        <svg width="64" height="64" style={{transform:"rotate(-90deg)",position:"absolute"}}>
          <circle cx="32" cy="32" r={r} fill="none" stroke={P.bor2} strokeWidth="3"/>
          <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color}
            strokeWidth="3" strokeLinecap="round"
            initial={{pathLength:0}}
            animate={{pathLength:pct/100}}
            transition={{duration:1.8,ease:[0.22,1,0.36,1]}}
            style={{filter:`drop-shadow(0 0 4px ${color}80)`}}
          />
        </svg>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:20,lineHeight:1}}>
          {icon}
        </div>
      </div>
      <div style={{fontSize:22,fontWeight:900,color,letterSpacing:-1,lineHeight:1}}>
        <AnimCount to={value}/>
      </div>
      <div style={{fontSize:8,color:P.dim,marginTop:4,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,textAlign:"center",lineHeight:1.4}}>
        {cat.replace("_"," ")}
      </div>
      <div style={{fontSize:9,color:color+"55",marginTop:2,fontWeight:700}}>{pct.toFixed(1)}%</div>
    </motion.div>
  );
}

// ── HERO CARD ─────────────────────────────────────────────────
function HeroCard({article}) {
  const color=COLORS[article.category]||"#a78bfa";
  const words=article.summary?.replace(/<[^>]*>/g,"").split(" ").length||0;
  const rt=Math.max(1,Math.ceil(words/200));
  return (
    <motion.a href={article.url} target="_blank" rel="noreferrer"
      style={{textDecoration:"none",display:"block"}}
      initial={{opacity:0,y:32}} animate={{opacity:1,y:0}}
      transition={{duration:0.7,ease:[0.22,1,0.36,1]}}
      data-hover="true" onClick={()=>sfx.click()} onMouseEnter={()=>sfx.hover()}
    >
      <motion.div
        whileHover={{y:-3}}
        transition={{type:"spring",stiffness:300,damping:28}}
        style={{
          background:`linear-gradient(135deg,${color}0e 0%,${P.surface} 55%)`,
          border:`1px solid ${color}20`,borderRadius:24,
          padding:"42px 48px",position:"relative",overflow:"hidden",
          willChange:"transform",
        }}
      >
        <motion.div style={{position:"absolute",top:0,left:0,right:0,height:1,
          background:`linear-gradient(90deg,transparent,${color},transparent)`}}
          animate={{opacity:[0.3,1,0.3]}} transition={{repeat:Infinity,duration:3}}/>
        <div style={{position:"absolute",top:-80,right:-80,width:280,height:280,
          background:`radial-gradient(circle,${color}0e 0%,transparent 65%)`,
          borderRadius:"50%",pointerEvents:"none"}}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {article.score>=7.5&&(
              <motion.span animate={{opacity:[1,0.7,1]}} transition={{repeat:Infinity,duration:2}}
                style={{fontSize:9,fontWeight:800,color:"#000",background:color,padding:"3px 12px",borderRadius:20,letterSpacing:1.5}}>
                🔥 BREAKING
              </motion.span>
            )}
            <span style={{fontSize:9,fontWeight:700,color,background:color+"15",padding:"3px 12px",borderRadius:20,letterSpacing:1.5,border:`1px solid ${color}25`}}>
              {ICONS[article.category]} {article.category?.replace("_"," ").toUpperCase()}
            </span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:800,padding:"3px 12px",borderRadius:20,
              color:article.score>=7?"#000":P.mid,
              background:article.score>=7?"#22d3ee":article.score>=5?"#fb923c30":P.dim+"30",
              boxShadow:article.score>=7?"0 0 12px #22d3ee50":"none"}}>
              ⭐ {article.score?.toFixed(1)}
            </span>
            <span style={{fontSize:10,color:P.dim,fontWeight:600}}>{rt} min</span>
          </div>
        </div>

        <h2 style={{fontSize:28,fontWeight:800,color:P.text,lineHeight:1.35,marginBottom:16,letterSpacing:-0.6,maxWidth:"78%"}}>
          {article.title}
        </h2>
        <p style={{fontSize:15,color:P.mid,lineHeight:1.85,marginBottom:28,maxWidth:"66%"}}>
          {article.summary?.replace(/<[^>]*>/g,"").slice(0,230)}...
        </p>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:11,color,background:color+"10",padding:"4px 14px",borderRadius:20,fontWeight:600,border:`1px solid ${color}20`}}>
              📡 {article.source?.slice(0,22)}
            </span>
            <span style={{fontSize:11,color:P.dim,fontWeight:500}}>
              {new Date(article.fetched_at).toLocaleTimeString()}
            </span>
          </div>
          <motion.span animate={{x:[0,5,0]}} transition={{repeat:Infinity,duration:2.5}}
            style={{fontSize:12,color,fontWeight:700,letterSpacing:0.5}}>
            Read story →
          </motion.span>
        </div>
      </motion.div>
    </motion.a>
  );
}

// ── ARTICLE CARD ──────────────────────────────────────────────
function ArticleCard({article,index}) {
  const color=COLORS[article.category]||"#a78bfa";
  const words=article.summary?.replace(/<[^>]*>/g,"").split(" ").length||0;
  const rt=Math.max(1,Math.ceil(words/200));
  return (
    <motion.a href={article.url} target="_blank" rel="noreferrer"
      style={{textDecoration:"none",display:"block"}}
      initial={{opacity:0,y:24,scale:0.98}}
      whileInView={{opacity:1,y:0,scale:1}}
      viewport={{once:true,margin:"-20px"}}
      transition={{duration:0.5,delay:Math.min(index*0.03,0.35),ease:[0.22,1,0.36,1]}}
      whileHover={{y:-5,scale:1.015}}
      whileTap={{scale:0.98}}
      data-hover="true"
      onClick={()=>sfx.click()}
      onMouseEnter={()=>sfx.hover()}
    >
      <motion.div
        style={{background:P.surface,border:`1px solid ${P.border}`,borderRadius:18,
          padding:"22px",position:"relative",overflow:"hidden",height:"100%",
          willChange:"transform"}}
        whileHover={{
          background:`linear-gradient(135deg,${color}0d,${P.surface})`,
          borderColor:color+"30",
          boxShadow:`0 16px 40px ${color}10,0 0 0 1px ${color}15`,
        }}
        transition={{duration:0.3}}
      >
        <motion.div style={{position:"absolute",top:0,left:"20%",right:"20%",height:1,
          background:`linear-gradient(90deg,transparent,${color},transparent)`,opacity:0}}
          whileHover={{opacity:0.5}} transition={{duration:0.3}}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
          <span style={{fontSize:9,fontWeight:700,color,textTransform:"uppercase",
            letterSpacing:1.5,background:color+"12",padding:"3px 11px",borderRadius:14,border:`1px solid ${color}20`}}>
            {ICONS[article.category]} {article.category?.replace("_"," ")}
          </span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {article.score>=7.5&&(
              <motion.span animate={{opacity:[1,0.5,1]}} transition={{repeat:Infinity,duration:1.8}}
                style={{fontSize:8,fontWeight:800,color:"#000",background:"#22d3ee",padding:"2px 7px",borderRadius:8,letterSpacing:1}}>HOT</motion.span>
            )}
            <span style={{fontSize:10,fontWeight:700,
              color:article.score>=7?"#22d3ee":article.score>=5?"#fb923c":P.dim}}>
              ⭐ {article.score?.toFixed(1)}
            </span>
          </div>
        </div>

        <h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700,color:P.text,lineHeight:1.55,letterSpacing:-0.2}}>
          {article.title}
        </h3>
        <p style={{margin:"0 0 16px",fontSize:12,color:P.mid,lineHeight:1.75}}>
          {article.summary?.replace(/<[^>]*>/g,"").slice(0,115)}...
        </p>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:10,color:color+"80",background:color+"08",padding:"2px 10px",
            borderRadius:12,fontWeight:600,border:`1px solid ${color}12`}}>
            📡 {article.source?.slice(0,16)}
          </span>
          <div style={{display:"flex",gap:8}}>
            <span style={{fontSize:10,color:P.dim}}>{rt}m</span>
            <span style={{fontSize:10,color:P.dim}}>{new Date(article.fetched_at).toLocaleTimeString()}</span>
          </div>
        </div>
      </motion.div>
    </motion.a>
  );
}

// ── TOAST ─────────────────────────────────────────────────────
function Toast({article,onDismiss}) {
  const color=COLORS[article.category]||"#a78bfa";
  useEffect(()=>{sfx.notify();const t=setTimeout(onDismiss,9000);return()=>clearTimeout(t);},[onDismiss]);
  return (
    <motion.div
      initial={{x:360,opacity:0,scale:0.9}} animate={{x:0,opacity:1,scale:1}} exit={{x:360,opacity:0,scale:0.9}}
      transition={{type:"spring",stiffness:280,damping:26}}
      data-hover="true"
      style={{background:P.sur2,border:`1px solid ${color}30`,borderRadius:16,
        padding:"16px 18px",width:320,position:"relative",overflow:"hidden",
        boxShadow:`0 0 30px ${color}18,0 16px 40px #00000060`,cursor:"none"}}
      onClick={()=>{sfx.click();window.open(article.url,"_blank");onDismiss();}}
    >
      <motion.div style={{position:"absolute",top:0,left:0,right:0,height:1.5,
        background:`linear-gradient(90deg,transparent,${color},transparent)`}}
        animate={{opacity:[0.4,1,0.4]}} transition={{repeat:Infinity,duration:2.5}}/>
      <motion.div style={{position:"absolute",bottom:0,left:0,height:2,
        background:color,boxShadow:`0 0 6px ${color}`,borderRadius:1}}
        initial={{width:"100%"}} animate={{width:"0%"}} transition={{duration:9,ease:"linear"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",gap:7,alignItems:"center"}}>
          <motion.div animate={{scale:[1,1.3,1]}} transition={{repeat:Infinity,duration:1.5}}
            style={{width:7,height:7,borderRadius:"50%",background:color,boxShadow:`0 0 8px ${color}`}}/>
          <span style={{fontSize:9,fontWeight:800,color,letterSpacing:2,textTransform:"uppercase"}}>
            {ICONS[article.category]} LIVE · {article.category?.replace("_"," ").toUpperCase()}
          </span>
        </div>
        <button onClick={e=>{e.stopPropagation();onDismiss();}}
          style={{background:"none",border:"none",color:P.dim,fontSize:18,lineHeight:1,padding:0,cursor:"none"}}>×</button>
      </div>
      <p style={{fontSize:13,fontWeight:600,color:P.text,lineHeight:1.5,marginBottom:10}}>
        {article.title.slice(0,88)}{article.title.length>88?"...":""}
      </p>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:P.mid}}>📡 {article.source?.slice(0,18)}</span>
        <span style={{fontSize:9,color,fontWeight:700,letterSpacing:1}}>TAP TO READ →</span>
      </div>
    </motion.div>
  );
}

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [articles,setArticles]=useState([]);
  const [stats,setStats]=useState(null);
  const [activeCategory,setActiveCategory]=useState("all");
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("score");
  const [toasts,setToasts]=useState([]);
  const [error,setError]=useState("");
  const [warp,setWarp]=useState(false);
  const shownIds=useRef(new Set());
  const firstLoad=useRef(true);

  const fetchData=useCallback(async()=>{
    try {
      const [ar,sr]=await Promise.all([
        http.get(`${API}/articles?category=${activeCategory}&limit=200`),
        http.get(`${API}/stats`),
      ]);
      const fresh=ar.data;
      if(!firstLoad.current){
        const newOnes=fresh.filter(a=>!shownIds.current.has(a.id)&&a.score>=6.5);
        newOnes.slice(0,2).forEach(a=>{
          shownIds.current.add(a.id);
          setToasts(t=>[...t.slice(-4),{...a,_tid:`${a.id}-${Date.now()}`}]);
        });
      } else {
        fresh.forEach(a=>shownIds.current.add(a.id));
        firstLoad.current=false;
      }
      setArticles(fresh);
      setStats(sr.data);
      setError("");
    } catch(e){
      console.error(e);
      setError("NewsFlash could not reach the local API. Make sure the backend is running.");
    }
    finally{setLoading(false);}
  },[activeCategory]);

  useEffect(()=>{fetchData();const i=setInterval(fetchData,30000);return()=>clearInterval(i);},[fetchData]);

  useEffect(()=>{
    let last=0;
    const fn=()=>{const n=Date.now();if(n-last>350){sfx.scroll();last=n;}};
    window.addEventListener("scroll",fn,{passive:true});
    return()=>window.removeEventListener("scroll",fn);
  },[]);

  const handleCategory=cat=>{
    setWarp(true); setTimeout(()=>setWarp(false),500);
    setActiveCategory(cat===activeCategory?"all":cat);
  };

  const filtered=articles
    .filter(a=>!search||
      a.title?.toLowerCase().includes(search.toLowerCase())||
      a.summary?.toLowerCase().includes(search.toLowerCase())||
      a.source?.toLowerCase().includes(search.toLowerCase())||
      a.category?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sortBy==="score"?b.score-a.score:new Date(b.fetched_at)-new Date(a.fetched_at));

  const hero=filtered[0];
  const grid=filtered.slice(1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;cursor:none!important;}
        html{scroll-behavior:smooth;}
        body{background:${P.bg};overflow-x:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
        ::selection{background:#a78bfa30;color:#f0f0ff;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:${P.bg};}
        ::-webkit-scrollbar-thumb{background:linear-gradient(#a78bfa,#22d3ee);border-radius:2px;}
        input,select{font-family:Inter,sans-serif;}
        input::placeholder{color:${P.dim};}
        input:focus,select:focus{outline:none;}
        select option{background:${P.sur2};color:#fff;}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      `}</style>

      <Cursor/>
      <Particles/>

      <AnimatePresence>
        {warp&&(
          <motion.div key="warp"
            initial={{opacity:0}} animate={{opacity:[0,0.12,0]}} exit={{opacity:0}}
            transition={{duration:0.5}}
            style={{position:"fixed",inset:0,zIndex:800,pointerEvents:"none",
              background:"radial-gradient(ellipse at center,#a78bfa,transparent 65%)"}}/>
        )}
      </AnimatePresence>

      <div style={{position:"fixed",bottom:24,right:24,zIndex:1000,display:"flex",flexDirection:"column",gap:10}}>
        <AnimatePresence>
          {toasts.slice(-3).map(t=>(
            <Toast key={t._tid} article={t} onDismiss={()=>setToasts(ts=>ts.filter(x=>x._tid!==t._tid))}/>
          ))}
        </AnimatePresence>
      </div>

      <div style={{minHeight:"100vh",fontFamily:"Inter,sans-serif",position:"relative",zIndex:1,color:P.text}}>

        <motion.header
          initial={{y:-70,opacity:0}} animate={{y:0,opacity:1}}
          transition={{duration:0.6,ease:[0.22,1,0.36,1]}}
          style={{background:"rgba(7,7,15,0.9)",backdropFilter:"blur(24px) saturate(180%)",
            WebkitBackdropFilter:"blur(24px) saturate(180%)",
            padding:"15px 48px",borderBottom:`1px solid ${P.border}`,
            display:"flex",justifyContent:"space-between",alignItems:"center",
            position:"sticky",top:0,zIndex:200}}
        >
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <motion.div animate={{rotate:[0,8,-8,0]}} transition={{repeat:Infinity,duration:5,ease:"easeInOut"}}
              style={{width:40,height:40,borderRadius:12,
                background:"linear-gradient(135deg,#a78bfa,#22d3ee)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,boxShadow:"0 0 24px #a78bfa50"}}>⚡</motion.div>
            <div>
              <div style={{fontSize:21,fontWeight:900,letterSpacing:-0.8,
                background:"linear-gradient(90deg,#f0f0ff,#a78bfa,#22d3ee,#f0f0ff)",
                backgroundSize:"300%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                animation:"gradientShift 6s ease infinite"}}>NewsFlash</div>
              <div style={{fontSize:10,display:"flex",alignItems:"center",gap:6,marginTop:1}}>
                <motion.span animate={{opacity:[1,0.2,1],scale:[1,0.8,1]}} transition={{repeat:Infinity,duration:2.5}}
                  style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:"#22d3ee",flexShrink:0}}/>
                <span style={{color:P.dim,letterSpacing:1.5,fontWeight:600,fontSize:10}}>
                  LIVE · {stats?.total?.toLocaleString()||0} ARTICLES ·&nbsp;
                </span>
                <LiveClock/>
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <motion.select whileHover={{scale:1.02}} value={sortBy} onChange={e=>{setSortBy(e.target.value);sfx.click();}}
              style={{background:P.sur2,border:`1px solid ${P.border}`,color:P.mid,
                padding:"8px 14px",borderRadius:12,fontSize:12,cursor:"none",fontWeight:500}}>
              <option value="score">⭐ Top Scored</option>
              <option value="time">🕐 Latest</option>
            </motion.select>
            <motion.input
              whileFocus={{scale:1.01}}
              placeholder="Search news, topics, sources..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{background:P.sur2,border:`1px solid ${P.border}`,color:P.text,
                padding:"8px 16px",borderRadius:12,fontSize:13,width:240,fontWeight:400}}/>
            <motion.button whileHover={{scale:1.04,boxShadow:"0 0 30px #a78bfa60"}} whileTap={{scale:0.96}}
              onClick={()=>{sfx.click();fetchData();}}
              style={{background:"linear-gradient(135deg,#a78bfa,#22d3ee)",border:"none",color:"#fff",
                padding:"8px 20px",borderRadius:12,cursor:"none",fontWeight:700,fontSize:12,
                letterSpacing:0.5,boxShadow:"0 0 20px #a78bfa40",fontFamily:"Inter"}}>
              ⚡ Refresh
            </motion.button>
          </div>
        </motion.header>

        {articles.length>0&&<Ticker articles={articles}/>}

        <div style={{padding:"36px 48px",maxWidth:1600,margin:"0 auto"}}>

          {stats&&(
            <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}}
              transition={{duration:0.65,delay:0.05}}
              style={{background:P.surface,border:`1px solid ${P.border}`,borderRadius:24,
                padding:"28px 32px",marginBottom:32}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
                <div>
                  <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>
                    Intelligence Coverage
                  </div>
                  <div style={{fontSize:12,color:P.dim,fontWeight:500}}>Click any category to filter</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:42,fontWeight:900,letterSpacing:-2,lineHeight:1,color:P.text}}>
                    {stats.total.toLocaleString()}
                  </div>
                  <div style={{fontSize:9,color:P.dim,fontWeight:600,letterSpacing:2,marginTop:3}}>ARTICLES INDEXED</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6}}>
                {Object.entries(stats.categories).map(([cat,val])=>(
                  <Ring key={cat} cat={cat} value={val} total={stats.total}
                    color={COLORS[cat]} icon={ICONS[cat]}
                    onClick={handleCategory} active={activeCategory===cat}/>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            transition={{duration:0.5,delay:0.1}}
            style={{display:"flex",gap:6,marginBottom:28,flexWrap:"wrap",alignItems:"center"}}>
            {["all",...Object.keys(COLORS)].map(cat=>{
              const active=activeCategory===cat;
              const color=COLORS[cat]||"#a78bfa";
              return (
                <motion.button key={cat} whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                  onClick={()=>handleCategory(cat)} onMouseEnter={()=>sfx.hover()}
                  style={{padding:"6px 14px",borderRadius:20,
                    border:`1px solid ${active?color:P.border}`,cursor:"none",
                    fontWeight:700,fontSize:10,fontFamily:"Inter",
                    background:active?color:"transparent",
                    color:active?"#000":P.mid,
                    boxShadow:active?`0 0 16px ${color}40`:"none",
                    letterSpacing:1.2,textTransform:"uppercase",
                    transition:"background 0.2s,border-color 0.2s,box-shadow 0.2s,color 0.2s"}}>
                  {ICONS[cat]||"◈"} {cat.replace("_"," ")}
                </motion.button>
              );
            })}
            <div style={{marginLeft:"auto",fontSize:11,color:P.dim,fontWeight:600}}>
              {filtered.length} results
              {search&&<span style={{color:"#a78bfa",marginLeft:6}}>· "{search}"</span>}
            </div>
          </motion.div>

          {error && (
            <div style={{
              marginBottom: 20, padding: "12px 16px", borderRadius: 12,
              border: `1px solid #ef444440`, background: "#ef444410",
              color: "#fca5a5", fontSize: 12, textAlign: "center"
            }}>
              {error} \u00b7 <button onClick={fetchData} style={{background:"none",border:0,color:"#c4b5fd",fontWeight:700,cursor:"pointer"}}>Retry</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading?(
              <motion.div key="load" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{textAlign:"center",padding:"100px 0"}}>
                <motion.div animate={{y:[0,-14,0],rotate:[0,8,-8,0]}}
                  transition={{repeat:Infinity,duration:0.9}}
                  style={{fontSize:60,marginBottom:20}}>⚡</motion.div>
                <div style={{fontSize:11,letterSpacing:4,color:"#a78bfa",fontWeight:700}}>LOADING INTELLIGENCE</div>
                <div style={{fontSize:10,letterSpacing:3,color:P.dim,marginTop:7,fontWeight:500}}>Aggregating feeds...</div>
              </motion.div>
            ):(
              <motion.div key={activeCategory+search}
                initial={{opacity:0,y:14,filter:"blur(6px)"}}
                animate={{opacity:1,y:0,filter:"blur(0px)"}}
                exit={{opacity:0,y:-8,filter:"blur(4px)"}}
                transition={{duration:0.4,ease:[0.22,1,0.36,1]}}>
                {hero&&(
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:10,color:P.dim,fontWeight:700,letterSpacing:3,marginBottom:10,textTransform:"uppercase"}}>Top Story</div>
                    <HeroCard article={hero}/>
                  </div>
                )}
                {grid.length>0&&(
                  <div>
                    <div style={{fontSize:10,color:P.dim,fontWeight:700,letterSpacing:3,marginBottom:10,marginTop:28,textTransform:"uppercase"}}>
                      Latest Intelligence
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12}}>
                      {grid.map((a,i)=><ArticleCard key={a.id} article={a} index={i}/>)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{borderTop:`1px solid ${P.border}`,marginTop:80,paddingTop:26,paddingBottom:36,textAlign:"center"}}>
            <div style={{fontSize:10,color:P.dim,letterSpacing:2.5,fontWeight:600}}>
              ⚡ NEWSFLASH · PERSONALISED REAL-TIME NEWS INTELLIGENCE · NLP SCORING ENGINE · 2026
            </div>
          </div>
        </div>
      </div>
    </>
  );
}