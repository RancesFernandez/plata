import { useState } from "react";
import { Wallet, TrendingUp, Sparkles } from "lucide-react";
import { auth, db, firebaseConfigured } from "../../firebase";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import "./AuthScreen.css";

export default function AuthScreen({onDemo}) {
  const [mode,setMode] = useState("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("");
  const [msg,setMsg] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setMsg(""); setBusy(true);
    try {
      if (!firebaseConfigured) { setMsg("Configura Firebase para iniciar sesión real. Puedes explorar el modo demo."); return; }
      if (mode==="reset") { await sendPasswordResetEmail(auth,email); setMsg("Si el correo está registrado, recibirás instrucciones para restablecer la contraseña."); }
      else if (mode==="register") {
        const cred = await createUserWithEmailAndPassword(auth,email,password);
        if (name.trim()) await updateProfile(cred.user,{displayName:name.trim()});
        await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,email,name:name.trim(),createdAt:new Date().toISOString()},{merge:true});
      } else await signInWithEmailAndPassword(auth,email,password);
    } catch(err) { setMsg(err.code==="auth/invalid-credential" ? "Email o contraseña incorrectos." : err.code==="auth/email-already-in-use" ? "Ese email ya tiene una cuenta." : err.code==="auth/weak-password" ? "La contraseña debe tener al menos 6 caracteres." : err.message || "No se pudo completar la acción."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page">
    <div className="auth-art">
      <div className="brand brand-light"><span className="brand-mark"><Wallet size={21}/></span><span>plata<span className="brand-dot">.</span></span></div>
      <div className="art-copy"><span className="eyebrow">TU DINERO, TU TRANQUILIDAD</span><h1>Que tu dinero<br/>trabaje para <em>ti.</em></h1><p>Organiza tus gastos, alcanza tus metas y construye mejores hábitos financieros, a tu manera.</p></div>
      <div className="art-mini-card"><div className="mini-card-top"><span>Balance total</span><span className="mini-icon"><TrendingUp size={16}/></span></div><strong>$ 48.250</strong><div className="mini-positive"><TrendingUp size={14}/> +12,8% este mes</div><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
      <div className="auth-orb orb-one"/><div className="auth-orb orb-two"/>
      <p className="auth-foot">Una relación más saludable con tu dinero.</p>
    </div>
    <div className="auth-panel"><div className="auth-form-wrap">
      <div className="auth-mobile-brand brand"><span className="brand-mark"><Wallet size={21}/></span><span>plata<span className="brand-dot">.</span></span></div>
      <span className="eyebrow">{mode==="login"?"QUÉ BUENO VERTE":mode==="register"?"EMPIEZA HOY":"RECUPERAR ACCESO"}</span>
      <h2>{mode==="login"?"Bienvenido de nuevo":mode==="register"?"Crea tu cuenta":"¿Olvidaste tu contraseña?"}</h2>
      <p className="muted">{mode==="reset"?"Te enviaremos un enlace para restablecerla.": "Tus finanzas más claras, un paso a la vez."}</p>
      <form onSubmit={submit} className="auth-form">
        {mode==="register"&&<label>Nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="¿Cómo te llamas?" required/></label>}
        <label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" required/></label>
        {mode!=="reset"&&<label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required/></label>}
        {mode==="login"&&<button type="button" className="text-button forgot" onClick={()=>{setMode("reset");setMsg("");}}>¿Olvidaste tu contraseña?</button>}
        {msg&&<div className="notice">{msg}</div>}
        <button className="btn btn-primary btn-full" disabled={busy}>{busy?"Un momento…":mode==="login"?"Iniciar sesión":mode==="register"?"Crear cuenta":"Enviar enlace"}</button>
      </form>
      <div className="auth-switch">{mode==="login"?"¿Todavía no tienes cuenta?":mode==="register"?"¿Ya tienes una cuenta?":"¿Recordaste tu contraseña?"} <button className="text-button" onClick={()=>{setMode(mode==="login"?"register":"login");setMsg("");}}>{mode==="login"?"Regístrate gratis":"Volver al inicio"}</button></div>
      <div className="auth-divider"><span>o continúa explorando</span></div>
      <button className="btn btn-ghost btn-full" onClick={onDemo}><Sparkles size={16}/> Probar demo interactiva</button>
      {!firebaseConfigured&&<p className="tiny-note">Modo demo disponible. Para guardar datos en la nube, configura Firebase.</p>}
    </div><div className="auth-legal">Al continuar, tus datos financieros se mantienen privados según la configuración de tu cuenta.</div></div>
  </main>;
}

