import { CreditCard, X } from "lucide-react";
import { categories, catColor, money } from "../../domain/financeData";
import "./TransactionList.css";

export default function TransactionList({items,currency,onDelete,demo,showAll=false}) {
  if(!items.length)return <div className="empty-list"><span><CreditCard size={22}/></span><b>Todavía no hay movimientos</b><p>Los movimientos que registres aparecerán aquí.</p></div>;
  return <div className="transaction-list">{items.map(t=><div className="transaction-row" key={t.id}><span className="transaction-icon" style={{background:`${catColor(t.category)}22`,color:catColor(t.category)}}>{categories.find(c=>c.name===t.category)?.icon||"◇"}</span><div className="transaction-name"><b>{t.title}</b><span>{t.category}{t.date?` · ${new Date(`${t.date}T12:00:00`).toLocaleDateString("es-UY",{day:"numeric",month:"short"})}`:""}</span></div><div className={`transaction-amount ${t.type==="income"?"text-income":"text-expense"}`}>{t.type==="income"?"+":"−"}{money(t.amount,currency)}</div><button className="icon-button tiny row-delete" title="Eliminar movimiento" onClick={()=>onDelete(t.id)}><X size={14}/></button></div>)}</div>;
}
