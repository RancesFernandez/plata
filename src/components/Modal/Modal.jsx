import { X } from "lucide-react";
import "./Modal.css";

export default function Modal({title,subtitle,onClose,children}) {return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal"><div className="modal-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose}><X size={19}/></button></div>{children}</section></div>}

