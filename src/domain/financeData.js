export const money = (n, currency="UYU") => new Intl.NumberFormat("es-UY", { style:"currency", currency, maximumFractionDigits:0 }).format(Number(n)||0);
export const nowMonth = new Date().toISOString().slice(0,7);
export const dateToday = new Date().toISOString().slice(0,10);
export const categories = [
  {name:"Vivienda", color:"#8b7cf6", icon:"⌂", type:"expense"},
  {name:"Comida", color:"#f59e72", icon:"🥑", type:"expense"},
  {name:"Transporte", color:"#58b7a5", icon:"🚲", type:"expense"},
  {name:"Ocio", color:"#ed83aa", icon:"✦", type:"expense"},
  {name:"Salud", color:"#69a6e8", icon:"♡", type:"expense"},
  {name:"Estudios", color:"#e8bd58", icon:"✎", type:"expense"},
  {name:"Compras", color:"#a18be8", icon:"◇", type:"expense"},
  {name:"Servicios", color:"#8290a6", icon:"⌁", type:"expense"},
  {name:"Ahorro", color:"#2d9f76", icon:"◎", type:"expense"},
  {name:"Sueldo", color:"#40ad87", icon:"↗", type:"income"},
  {name:"Freelance", color:"#5ca8c7", icon:"✧", type:"income"},
  {name:"Otros", color:"#a0a7b6", icon:"•", type:"both"}
];
export const seedTransactions = [
  {id:"d1", title:"Supermercado", category:"Comida", amount:1450, type:"expense", date:dateToday, note:"Compra semanal"},
  {id:"d2", title:"Abono mensual", category:"Transporte", amount:1250, type:"expense", date:dateToday, note:""},
  {id:"d3", title:"Sueldo", category:"Sueldo", amount:36500, type:"income", date:dateToday, note:""},
  {id:"d4", title:"Café con amigos", category:"Ocio", amount:460, type:"expense", date:dateToday, note:""},
  {id:"d5", title:"Internet", category:"Servicios", amount:1590, type:"expense", date:dateToday, note:""}
];
export const seedBudgets = [
  {id:"b1", category:"Comida", limit:6500},
  {id:"b2", category:"Transporte", limit:3000},
  {id:"b3", category:"Ocio", limit:2500},
  {id:"b4", category:"Compras", limit:2000}
];
export const seedGoals = [{id:"g1", name:"Viaje de verano", target:35000, saved:12400, due:"2027-01-15", emoji:"✈️"}];
export const readLocal = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
export const saveLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const catColor = name => categories.find(c=>c.name===name)?.color || "#8b7cf6";

