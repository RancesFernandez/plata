import "./EmptyState.css";

export default function EmptyState({icon:Icon,title,text,action,onAction}) {return <div className="empty-state"><span><Icon size={24}/></span><h3>{title}</h3><p>{text}</p><button className="btn btn-primary" onClick={onAction}>{action}</button></div>}
