import { money } from "../../domain/financeData";
import "./GoalMini.css";

export default function GoalMini({goals,currency}) { return goals.length?<div className="mini-goals">{goals.map(g=><div className="mini-goal" key={g.id}><div className="mini-goal-top"><span className="goal-emoji small-emoji">{g.emoji||"🎯"}</span><div><b>{g.name}</b><small>{money(g.saved,currency)} de {money(g.target,currency)}</small></div><strong>{Math.round(g.saved/(g.target||1)*100)}%</strong></div><div className="progress-track"><i style={{width:`${Math.min(100,g.saved/(g.target||1)*100)}%`}}/></div></div>)}</div>:<div className="empty-list"><p>Crea una meta para empezar a ahorrar.</p></div> }
