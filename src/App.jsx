import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Download,
  Heart,
  Home,
  LogOut,
  Mail,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
  PiggyBank,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { auth, db, firebaseConfigured } from "./firebase";
import AuthScreen from "./components/AuthScreen/AuthScreen";
import TransactionList from "./components/TransactionList/TransactionList";
import GoalMini from "./components/GoalMini/GoalMini";
import EmptyState from "./components/EmptyState/EmptyState";
import Modal from "./components/Modal/Modal";
import {
  money,
  nowMonth,
  dateToday,
  categories,
  seedTransactions,
  seedBudgets,
  seedGoals,
  readLocal,
  saveLocal,
  catColor,
} from "./domain/financeData";

function App() {
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState(() =>
    readLocal("plata_transactions", seedTransactions),
  );
  const [budgets, setBudgets] = useState(() =>
    readLocal("plata_budgets", seedBudgets),
  );
  const [goals, setGoals] = useState(() => readLocal("plata_goals", seedGoals));
  const [plans, setPlans] = useState(() => readLocal("plata_plans", []));
  const [invitations, setInvitations] = useState(() =>
    readLocal("plata_invites", []),
  );
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [currency, setCurrency] = useState(() =>
    readLocal("plata_currency", "UYU"),
  );
  const [period, setPeriod] = useState(nowMonth);
  const [reportRange, setReportRange] = useState("6");
  const [search, setSearch] = useState("");
  const [showTransaction, setShowTransaction] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [toast, setToast] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Comida",
    date: dateToday,
    note: "",
    goalId: "",
    sourceCategory: "Sueldo",
  });
  const [budgetForm, setBudgetForm] = useState({
    category: "Comida",
    limit: "",
  });
  const [goalForm, setGoalForm] = useState({
    name: "",
    target: "",
    saved: "0",
    due: "",
    emoji: "🎯",
  });
  const [planForm, setPlanForm] = useState({
    name: "",
    email: "",
    kind: "Couple",
    budget: "",
  });
  const [goalContribution, setGoalContribution] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionSource, setContributionSource] = useState("Sueldo");
  const [inviteEmail, setInviteEmail] = useState("");
  const [activePlan, setActivePlan] = useState("personal");

  const uid = demo ? "demo-user" : user?.uid;
  const displayName = demo
    ? "Alex"
    : user?.displayName || user?.email?.split("@")[0] || "Mi cuenta";
  const userEmail = demo ? "alex@demo.com" : user?.email || "";
  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setDemo(false);
      setAuthReady(true);
    });
  }, []);
  useEffect(() => {
    if (!uid) return;
    if (demo) {
      setTransactions(readLocal("plata_transactions", seedTransactions));
      setBudgets(readLocal("plata_budgets", seedBudgets));
      setGoals(readLocal("plata_goals", seedGoals));
      setPlans(readLocal("plata_plans", []));
      setInvitations(readLocal("plata_invites", []));
      setReceivedInvitations(readLocal("plata_received_invites", []));
      return;
    }
    setLoadingData(true);
    const unsubs = [];
    const sharedTransactionUnsubs = new Map();
    const ownTransactions = new Map();
    const sharedTransactions = new Map();
    const publishTransactions = () => {
      const merged = new Map(ownTransactions);
      for (const item of sharedTransactions.values())
        for (const t of item) merged.set(t.id, t);
      setTransactions(
        [...merged.values()].sort((a, b) =>
          String(b.date || "").localeCompare(String(a.date || "")),
        ),
      );
    };
    const qOwnTransactions = query(
      collection(db, "transactions"),
      where("ownerUid", "==", uid),
    );
    unsubs.push(
      onSnapshot(
        qOwnTransactions,
        (snap) => {
          ownTransactions.clear();
          snap.docs.forEach((d) =>
            ownTransactions.set(d.id, { id: d.id, ...d.data() }),
          );
          publishTransactions();
        },
        () => {},
      ),
    );
    const ownBudgets = new Map();
    const sharedBudgets = new Map();
    const publishBudgets = () => {
      const merged = new Map(ownBudgets);
      for (const items of sharedBudgets.values()) {
        for (const item of items) merged.set(item.id, item);
      }
      setBudgets([...merged.values()]);
    };
    const qBudgets = query(
      collection(db, "budgets"),
      where("ownerUid", "==", uid),
    );
    unsubs.push(onSnapshot(qBudgets, (snap) => {
      ownBudgets.clear();
      snap.docs.forEach((d) => ownBudgets.set(d.id, { id: d.id, ...d.data() }));
      publishBudgets();
    }, (error) => {
      console.error("Error cargando presupuestos:", error);
      setToast(error?.code === "permission-denied"
        ? "Firebase bloqueó los presupuestos. Publica las reglas actualizadas de firestore.rules."
        : `No se pudieron cargar los presupuestos${error?.code ? ` (${error.code})` : ""}.`);
    }));
    const qGoals = query(collection(db, "goals"), where("ownerUid", "==", uid));
    unsubs.push(onSnapshot(qGoals, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error cargando metas:", error);
      setToast(error?.code === "permission-denied"
        ? "Firebase bloqueó las metas. Publica las reglas actualizadas de firestore.rules."
        : `No se pudieron cargar las metas${error?.code ? ` (${error.code})` : ""}.`);
    }));
    const qPlans = query(
      collection(db, "plans"),
      where("memberUids", "array-contains", uid),
    );
    unsubs.push(
      onSnapshot(
        qPlans,
        (snap) => {
          const nextPlans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setPlans(nextPlans);
          const ids = new Set(nextPlans.map((p) => p.id));
          for (const [planId, unsub] of sharedTransactionUnsubs.entries()) {
            const actualPlanId = planId.startsWith("budget:") ? planId.slice(7) : planId;
            if (!ids.has(actualPlanId)) {
              unsub();
              sharedTransactionUnsubs.delete(planId);
              sharedTransactions.delete(actualPlanId);
              sharedBudgets.delete(actualPlanId);
            }
          }
          publishBudgets();
          for (const p of nextPlans) {
            if (!sharedTransactionUnsubs.has(p.id)) {
              const qShared = query(collection(db, "transactions"), where("planId", "==", p.id));
              const unsub = onSnapshot(qShared, (ss) => {
                sharedTransactions.set(p.id, ss.docs.map((d) => ({ id: d.id, ...d.data() })));
                publishTransactions();
              }, (error) => console.error("Error cargando movimientos compartidos:", error));
              sharedTransactionUnsubs.set(p.id, unsub);
            }
            const qSharedBudgets = query(collection(db, "budgets"), where("planId", "==", p.id));
            const budgetUnsubKey = `budget:${p.id}`;
            if (!sharedTransactionUnsubs.has(budgetUnsubKey)) {
              const unsubBudget = onSnapshot(qSharedBudgets, (ss) => {
                sharedBudgets.set(p.id, ss.docs.map((d) => ({ id: d.id, ...d.data() })));
                publishBudgets();
              }, (error) => console.error("Error cargando presupuestos compartidos:", error));
              sharedTransactionUnsubs.set(budgetUnsubKey, unsubBudget);
            }
          }
        },
        (error) => {
          console.error("Error cargando planes compartidos:", error);
          setToast(
            error?.code === "permission-denied"
              ? "No puedes leer los planes. Publica las reglas actualizadas de firestore.rules."
              : "No se pudieron cargar los planes compartidos.",
          );
        },
      ),
    );
    const qInvites = query(
      collection(db, "invitations"),
      where("inviterUid", "==", uid),
    );
    unsubs.push(
      onSnapshot(
        qInvites,
        (snap) =>
          setInvitations(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (error) => {
          console.error("Error cargando invitaciones enviadas:", error);
          setToast(
            "No se pudieron cargar las invitaciones enviadas. Revisa las reglas de Firestore.",
          );
        },
      ),
    );
    const qReceived = query(
      collection(db, "invitations"),
      where("inviteeEmail", "==", (user?.email || "").trim().toLowerCase()),
    );
    unsubs.push(
      onSnapshot(
        qReceived,
        (snap) =>
          setReceivedInvitations(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((i) => i.status === "pending"),
          ),
        (error) => {
          console.error("Error cargando invitaciones recibidas:", error);
          setToast(
            "No se pudieron cargar las invitaciones recibidas. Revisa el correo y las reglas de Firestore.",
          );
        },
      ),
    );
    setLoadingData(false);
    return () => {
      unsubs.forEach((fn) => fn());
      sharedTransactionUnsubs.forEach((fn) => fn());
    };
  }, [uid, demo]);
  useEffect(() => {
    if (demo) {
      saveLocal("plata_transactions", transactions);
      saveLocal("plata_budgets", budgets);
      saveLocal("plata_goals", goals);
      saveLocal("plata_plans", plans);
      saveLocal("plata_invites", invitations);
    }
  }, [
    transactions,
    budgets,
    goals,
    plans,
    invitations,
    receivedInvitations,
    demo,
  ]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const periodTransactions = useMemo(
    () =>
      transactions.filter((t) => String(t.date || "").slice(0, 7) === period),
    [transactions, period],
  );
  const totalIncome = periodTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = periodTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const expenseByCategory = useMemo(
    () =>
      categories
        .filter((c) => c.type !== "income")
        .map((c) => ({
          ...c,
          value: periodTransactions
            .filter((t) => t.type === "expense" && t.category === c.name)
            .reduce((s, t) => s + Number(t.amount || 0), 0),
        }))
        .filter((c) => c.value > 0),
    [periodTransactions],
  );
  const monthlyData = useMemo(
    () =>
      Array.from({ length: Number(reportRange) }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - (Number(reportRange) - 1 - i));
        const key = d.toISOString().slice(0, 7);
        const ts = transactions.filter(
          (t) => String(t.date || "").slice(0, 7) === key,
        );
        return {
          month: d.toLocaleDateString("es-UY", { month: "short" }),
          income: ts
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + Number(t.amount || 0), 0),
          expense: ts
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + Number(t.amount || 0), 0),
        };
      }),
    [transactions, reportRange],
  );
  const filteredTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          !search ||
          `${t.title} ${t.category} ${t.note || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [transactions, search],
  );
  const visibleTransactions = useMemo(
    () =>
      filteredTransactions.filter((t) =>
        activePlan === "personal" ? !t.planId : t.planId === activePlan,
      ),
    [filteredTransactions, activePlan],
  );
  const visibleBudgets = useMemo(
    () => budgets.filter((b) =>
      (b.period === period || (!b.period && period === nowMonth)) &&
      (activePlan === "personal" ? !b.planId : b.planId === activePlan)
    ),
    [budgets, period, activePlan],
  );
  const budgetSpend = (b) =>
    transactions
      .filter((t) =>
        t.type === "expense" &&
        t.category === b.category &&
        String(t.date || "").slice(0, 7) === period &&
        (activePlan === "personal" ? !t.planId : t.planId === activePlan)
      )
      .reduce((s, t) => s + Number(t.amount || 0), 0);

  async function persistAdd(collectionName, data, setter) {
    if (demo) {
      setter((prev) => [{ id: crypto.randomUUID(), ...data }, ...prev]);
      setToast("Guardado en esta demo local.");
      return "demo";
    }
    if (!firebaseConfigured || !db || !uid) {
      setToast("Firebase no está configurado. Completa .env.local o entra en modo demo para guardar localmente.");
      return null;
    }
    try {
      const ref = await addDoc(collection(db, collectionName), {
        ...data,
        ownerUid: uid,
        createdAt: new Date().toISOString(),
      });
      setToast("Guardado correctamente.");
      return ref.id;
    } catch (e) {
      console.error(`Error guardando en ${collectionName}:`, e);
      setToast(e?.code === "permission-denied"
        ? `Firebase rechazó guardar ${collectionName}. Publica las reglas de firestore.rules en Firebase Console.`
        : `No se pudo guardar ${collectionName}${e?.code ? ` (${e.code})` : ""}. Revisa conexión y configuración de Firebase.`);
      return null;
    }
  }
  async function removeItem(collectionName, id, setter, items) {
    if (demo) {
      setter(items.filter((x) => x.id !== id));
      setToast("Elemento eliminado.");
      return;
    }
    try {
      await deleteDoc(doc(db, collectionName, id));
      setToast("Elemento eliminado.");
    } catch {
      setToast("No se pudo eliminar.");
    }
  }
  async function addTransaction(e) {
    e.preventDefault();
    const isGoalContribution = transactionForm.type === "goal_contribution";
    const amount = Number(transactionForm.amount);
    if (!transactionForm.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setToast("Completa el concepto y un importe válido.");
      return;
    }
    if (isGoalContribution) {
      const goal = goals.find((item) => item.id === transactionForm.goalId);
      if (!goal) {
        setToast("Selecciona la meta a la que quieres aportar.");
        return;
      }
      await saveGoalContribution(goal, amount, transactionForm.sourceCategory, transactionForm.date, transactionForm.note, transactionForm.title.trim());
    } else {
      const data = {
        ...transactionForm,
        amount,
        planId: activePlan === "personal" ? null : activePlan,
      };
      delete data.goalId;
      delete data.sourceCategory;
      const result = await persistAdd("transactions", data, setTransactions);
      if (result === null) return;
    }
    setTransactionForm({
      title: "", amount: "", type: "expense", category: "Comida",
      date: dateToday, note: "", goalId: "", sourceCategory: "Sueldo",
    });
    setShowTransaction(false);
  }
  async function addBudget(e) {
    e.preventDefault();
    const limit = Number(budgetForm.limit);
    if (!Number.isFinite(limit) || limit <= 0) {
      setToast("Ingresa un límite mensual mayor que cero.");
      return;
    }
    const planId = activePlan === "personal" ? null : activePlan;
    const duplicate = budgets.some((b) =>
      b.category === budgetForm.category &&
      (b.period === period || (!b.period && period === nowMonth)) &&
      (planId ? b.planId === planId : !b.planId)
    );
    if (duplicate) {
      setToast("Ya existe un presupuesto para esa categoría en este espacio. Elimina el anterior o elige otra categoría.");
      return;
    }
    const result = await persistAdd("budgets", {
      category: budgetForm.category,
      limit,
      period,
      planId,
    }, setBudgets);
    if (result === null) return;
    setBudgetForm({ category: "Comida", limit: "" });
    setShowBudget(false);
  }
  async function addGoal(e) {
    e.preventDefault();
    if (!goalForm.name.trim() || Number(goalForm.target) <= 0) return;
    await persistAdd(
      "goals",
      {
        ...goalForm,
        target: Number(goalForm.target),
        saved: Number(goalForm.saved) || 0,
        due: goalForm.due,
        planId: activePlan === "personal" ? null : activePlan,
      },
      setGoals,
    );
    setGoalForm({ name: "", target: "", saved: "0", due: "", emoji: "🎯" });
    setShowGoal(false);
  }
  async function saveGoalContribution(goal, amount, sourceCategory, date = dateToday, note = "", titleOverride = "") {
    const planId = activePlan === "personal" ? (goal.planId || null) : activePlan;
    const transactionData = {
      title: titleOverride || `Aporte a meta: ${goal.name}`,
      amount: Number(amount),
      type: "expense",
      category: "Ahorro",
      date,
      note: `Origen del dinero: ${sourceCategory}${note ? ` · ${note}` : ` · Aporte a “${goal.name}”`}.`,
      sourceCategory,
      goalId: goal.id,
      planId,
    };
    if (demo) {
      setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, saved: Number(g.saved || 0) + Number(amount) } : g));
      setTransactions((prev) => [{ id: crypto.randomUUID(), ...transactionData, ownerUid: uid, createdAt: new Date().toISOString() }, ...prev]);
      setToast("Aporte registrado en la meta y en tus movimientos del mes.");
      return true;
    }
    if (!firebaseConfigured || !db || !uid) {
      setToast("Firebase no está configurado. Completa .env.local para guardar el aporte.");
      return false;
    }
    try {
      const transactionRef = doc(collection(db, "transactions"));
      const goalRef = doc(db, "goals", goal.id);
      const batch = writeBatch(db);
      batch.set(transactionRef, { ...transactionData, ownerUid: uid, createdAt: new Date().toISOString() });
      batch.update(goalRef, { saved: increment(Number(amount)), updatedAt: new Date().toISOString() });
      await batch.commit();
      setToast("Aporte registrado en la meta y en tus movimientos del mes.");
      return true;
    } catch (error) {
      console.error("Error registrando aporte a meta:", error);
      setToast(error?.code === "permission-denied"
        ? "Firebase bloqueó el aporte. Publica las reglas actualizadas de firestore.rules y verifica que tengas acceso a esta meta."
        : `No se pudo registrar el aporte${error?.code ? ` (${error.code})` : ""}.`);
      return false;
    }
  }
  async function contributeGoal(e) {
    e.preventDefault();
    const goal = goals.find((x) => x.id === goalContribution);
    const amount = Number(contributionAmount);
    if (!goal || !Number.isFinite(amount) || amount <= 0) {
      setToast("Ingresa un importe válido para el aporte.");
      return;
    }
    const saved = await saveGoalContribution(goal, amount, contributionSource, dateToday);
    if (!saved) return;
    setGoalContribution(null);
    setContributionAmount("");
    setContributionSource("Sueldo");
  }
  async function createPlan(e) {
    e.preventDefault();
    const name = planForm.name.trim();
    const email = planForm.email.trim().toLowerCase();
    if (!name || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      setToast("Escribe un nombre y un correo válido para la invitación.");
      return;
    }
    if (email === userEmail.trim().toLowerCase()) {
      setToast("Usa el correo de otra persona para compartir el plan.");
      return;
    }
    if (!demo && (!firebaseConfigured || !db || !uid)) {
      setToast(
        "Conecta Firebase e inicia sesión para crear un plan compartido.",
      );
      return;
    }

    const createdAt = new Date().toISOString();
    const data = {
      name,
      kind: planForm.kind,
      budget: Number(planForm.budget) || 0,
      ownerUid: uid,
      ownerEmail: userEmail.toLowerCase(),
      memberUids: [uid],
      memberEmails: [userEmail.toLowerCase()],
      pendingInviteEmails: [email],
      createdAt,
    };
    const invite = {
      planName: name,
      inviterUid: uid,
      inviterEmail: userEmail.toLowerCase(),
      inviteeEmail: email,
      inviteeUid: null,
      status: "pending",
      createdAt,
    };

    try {
      let planId;
      if (demo) {
        planId = crypto.randomUUID();
        setPlans((prev) => [{ id: planId, ...data }, ...prev]);
        setInvitations((prev) => [
          { id: crypto.randomUUID(), planId, ...invite },
          ...prev,
        ]);
      } else {
        // Write the plan and invitation atomically to avoid orphan plans if one write fails.
        const planRef = doc(collection(db, "plans"));
        const invitationRef = doc(collection(db, "invitations"));
        planId = planRef.id;
        const batch = writeBatch(db);
        batch.set(planRef, data);
        batch.set(invitationRef, { ...invite, planId });
        await batch.commit();
      }

      const subject = encodeURIComponent(
        `Te invitaron al plan compartido "${name}" en Plata`,
      );
      const body = encodeURIComponent(
        `¡Hola! ${displayName} te invita a organizar finanzas en conjunto en Plata.\\n\\nPlan: ${name}\\nCorreo invitado: ${email}\\n\\nAbre Plata e inicia sesión con este correo para aceptar la invitación.`,
      );
      setPlanForm({ name: "", email: "", kind: "Couple", budget: "" });
      setShowPlan(false);
      setToast(
        "Plan creado e invitación guardada. Puedes enviar el correo preparado.",
      );
      // Email sending is intentionally user-confirmed; automatic sending needs a trusted server.
      window.setTimeout(() => {
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      }, 150);
    } catch (error) {
      console.error("Error creando plan compartido:", error);
      setToast(
        error?.code === "permission-denied"
          ? "Firebase rechazó la operación. Publica las reglas de firestore.rules y verifica que iniciaste sesión."
          : `No se pudo crear el plan${error?.code ? ` (${error.code})` : ""}. Revisa la conexión con Firebase.`,
      );
    }
  }

  async function acceptInvitation(invite) {
    if (demo) {
      setReceivedInvitations((prev) => prev.filter((i) => i.id !== invite.id));
      setPlans((prev) => {
        const exists = prev.some((p) => p.id === invite.planId);
        if (!exists) {
          const invitationPlan = readLocal("plata_plans", []).find(
            (p) => p.id === invite.planId,
          );
          if (invitationPlan)
            return [
              {
                ...invitationPlan,
                memberUids: [
                  ...new Set([...(invitationPlan.memberUids || []), uid]),
                ],
                memberEmails: [
                  ...new Set([
                    ...(invitationPlan.memberEmails || []),
                    userEmail.toLowerCase(),
                  ]),
                ],
                pendingInviteEmails: (
                  invitationPlan.pendingInviteEmails || []
                ).filter((e) => e !== userEmail.toLowerCase()),
              },
              ...prev,
            ];
        }
        return prev.map((p) =>
          p.id === invite.planId
            ? {
                ...p,
                memberUids: [...new Set([...(p.memberUids || []), uid])],
                memberEmails: [
                  ...new Set([
                    ...(p.memberEmails || []),
                    userEmail.toLowerCase(),
                  ]),
                ],
                pendingInviteEmails: (p.pendingInviteEmails || []).filter(
                  (e) => e !== userEmail.toLowerCase(),
                ),
              }
            : p,
        );
      });
      setInvitations((prev) =>
        prev.map((i) =>
          i.id === invite.id
            ? { ...i, status: "accepted", inviteeUid: uid }
            : i,
        ),
      );
      setToast("Invitación aceptada en la demo.");
      return;
    }

    try {
      const normalizedEmail = (user?.email || "").trim().toLowerCase();
      if (
        !normalizedEmail ||
        normalizedEmail !==
          String(invite.inviteeEmail || "")
            .trim()
            .toLowerCase()
      ) {
        setToast(
          "Inicia sesión con el mismo correo al que enviaron la invitación.",
        );
        return;
      }
      const planRef = doc(db, "plans", invite.planId);
      const inviteRef = doc(db, "invitations", invite.id);
      const [planSnapshot, inviteSnapshot] = await Promise.all([
        getDoc(planRef),
        getDoc(inviteRef),
      ]);
      if (!planSnapshot.exists() || !inviteSnapshot.exists()) {
        setToast("El plan o la invitación ya no existen.");
        return;
      }
      const plan = planSnapshot.data();
      const storedInvite = inviteSnapshot.data();
      if (
        storedInvite.status !== "pending" ||
        storedInvite.inviteeEmail.toLowerCase() !== normalizedEmail
      ) {
        setToast(
          "Esta invitación ya fue utilizada o no corresponde a tu cuenta.",
        );
        return;
      }
      const oldMembers = plan.memberUids || [];
      if (oldMembers.includes(uid)) {
        setToast("Ya formas parte de este plan.");
        return;
      }
      const memberUids = [...new Set([...oldMembers, uid])];
      const memberEmails = [
        ...new Set([...(plan.memberEmails || []), normalizedEmail]),
      ];
      const pendingInviteEmails = (plan.pendingInviteEmails || []).filter(
        (email) => email.toLowerCase() !== normalizedEmail,
      );

      // Commit both changes together. The plan update preserves existing members (including its owner).
      const batch = writeBatch(db);
      batch.update(planRef, { memberUids, memberEmails, pendingInviteEmails });
      batch.update(inviteRef, {
        status: "accepted",
        inviteeUid: uid,
        acceptedAt: new Date().toISOString(),
      });
      await batch.commit();

      setReceivedInvitations((prev) => prev.filter((i) => i.id !== invite.id));
      setToast("¡Invitación aceptada! El plan ya aparece en tus compartidos.");
    } catch (error) {
      console.error("Error aceptando invitación:", error);
      setToast(
        error?.code === "permission-denied"
          ? "Firebase bloqueó la aceptación. Publica las reglas actualizadas de firestore.rules y revisa el correo de tu cuenta."
          : `No se pudo aceptar la invitación${error?.code ? ` (${error.code})` : ""}.`,
      );
    }
  }

  async function exportCSV() {
    const exportRows =
      page === "transactions" ? visibleTransactions : filteredTransactions;
    const rows = [
      ["Fecha", "Concepto", "Categoría", "Tipo", "Importe", "Nota"],
      ...exportRows.map((t) => [
        t.date,
        t.title,
        t.category,
        t.type,
        t.amount,
        t.note || "",
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(";"),
      )
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plata-movimientos.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Archivo CSV exportado.");
  }

  if (!authReady)
    return (
      <div className="loading-screen">
        <div className="loading-mark">
          <Wallet />
        </div>
        <p>Preparando tus finanzas…</p>
      </div>
    );
  if (!user && !demo) return <AuthScreen onDemo={() => setDemo(true)} />;

  const navGroups = [
    {
      label: "TU ESPACIO",
      items: [
        ["overview", "Resumen", Home],
        ["transactions", "Movimientos", CreditCard],
        ["budgets", "Presupuestos", Activity],
        ["goals", "Metas de ahorro", Target],
        ["reports", "Informes", ChartNoAxesCombined],
      ],
    },
    { label: "EN COMPAÑÍA", items: [["shared", "Planes compartidos", Users]] },
    { label: "CUENTA", items: [["settings", "Configuración", Settings]] },
  ];
  const titleMap = {
    overview: "Resumen",
    transactions: "Movimientos",
    budgets: "Presupuestos",
    goals: "Metas de ahorro",
    reports: "Informes",
    shared: "Planes compartidos",
    settings: "Configuración",
  };
  const headingSub = {
    overview: "Aquí tienes una mirada clara a tu dinero.",
    transactions: "Cada movimiento cuenta. Ten todo bajo control.",
    budgets: "Pon límites realistas y sigue tu progreso.",
    goals: "Pequeños pasos, grandes planes.",
    reports: "Mira el panorama completo y descubre tendencias.",
    shared: "Organiza gastos y objetivos con alguien más.",
    settings: "Personaliza tu experiencia.",
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Wallet size={21} />
          </span>
          <span>
            plata<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="workspace-pill">
          <span className="workspace-avatar">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <b>{displayName}</b>
            <small>{demo ? "Modo demo" : "Mi espacio personal"}</small>
          </span>
          <ChevronDown size={15} />
        </div>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map(([id, label, Icon]) => (
              <button
                key={id}
                className={`nav-item ${page === id ? "active" : ""}`}
                onClick={() => {
                  setPage(id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === "shared" && plans.length > 0 && (
                  <span className="nav-count">{plans.length}</span>
                )}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-bottom">
          
          <button
            className="nav-item logout"
            onClick={async () => {
              if (demo) {
                setDemo(false);
              } else await signOut(auth);
            }}
          >
            <LogOut size={18} />
            <span>{demo ? "Salir de la demo" : "Cerrar sesión"}</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              Mi espacio <span>/</span> <b>{titleMap[page]}</b>
            </div>
          </div>
          <div className="topbar-right">
            <div className="currency-select">
              <span>{currency}</span>
              <ChevronDown size={14} />
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  saveLocal("plata_currency", e.target.value);
                }}
                aria-label="Moneda"
              >
                <option value="UYU">UYU</option>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <button
              className="icon-button notification-button"
              title="Notificaciones"
            >
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">HOLA, {displayName.toUpperCase()}</div>
              <h1>{titleMap[page]}</h1>
              <p>{headingSub[page]}</p>
            </div>
            <div className="heading-actions">
              {page === "overview" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowTransaction(true)}
                >
                  <Plus size={17} /> Añadir movimiento
                </button>
              )}
              {page === "transactions" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowTransaction(true)}
                >
                  <Plus size={17} /> Nuevo movimiento
                </button>
              )}
              {page === "budgets" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowBudget(true)}
                >
                  <Plus size={17} /> Crear presupuesto
                </button>
              )}
              {page === "goals" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowGoal(true)}
                >
                  <Plus size={17} /> Nueva meta
                </button>
              )}
              {page === "shared" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowPlan(true)}
                >
                  <Plus size={17} /> Crear plan compartido
                </button>
              )}
            </div>
          </div>

          {demo && (
            <div className="demo-banner">
              <Sparkles size={16} />
              <span>
                Estás explorando una demo interactiva. Los cambios se guardan en
                este navegador.
              </span>
              <button onClick={() => setDemo(false)}>
                <X size={15} />
              </button>
            </div>
          )}

          {page === "overview" && (
            <div className="page-stack">
              <section className="overview-top">
                <div className="balance-card">
                  <div className="balance-card-top">
                    <div>
                      <span className="balance-label">Balance del periodo</span>
                      <span className="balance-period">
                        <CalendarDays size={14} />
                        <input
                          type="month"
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                        />
                      </span>
                    </div>
                    <span className="balance-symbol">
                      <Wallet size={22} />
                    </span>
                  </div>
                  <div className="balance-value">
                    {money(balance, currency)}
                  </div>
                  <div
                    className={`balance-change ${balance >= 0 ? "positive" : "negative"}`}
                  >
                    {balance >= 0 ? (
                      <TrendingUp size={15} />
                    ) : (
                      <TrendingDown size={15} />
                    )}{" "}
                    {balance >= 0
                      ? "Ingresos por encima de gastos"
                      : "Los gastos superan los ingresos"}{" "}
                    <span>en este periodo</span>
                  </div>
                  <div className="balance-footer">
                    <span>
                      <i className="legend-dot income-dot" /> Ingresos{" "}
                      <b>{money(totalIncome, currency)}</b>
                    </span>
                    <span>
                      <i className="legend-dot expense-dot" /> Gastos{" "}
                      <b>{money(totalExpense, currency)}</b>
                    </span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon income-bg">
                    <ArrowDownLeft size={19} />
                  </div>
                  <span className="metric-label">Ingresos</span>
                  <strong>{money(totalIncome, currency)}</strong>
                  <span className="metric-caption">
                    <span className="tiny-trend positive">
                      <TrendingUp size={13} />
                    </span>{" "}
                    Total del periodo
                  </span>
                  <div className="sparkline income-spark">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon expense-bg">
                    <ArrowUpRight size={19} />
                  </div>
                  <span className="metric-label">Gastos</span>
                  <strong>{money(totalExpense, currency)}</strong>
                  <span className="metric-caption">Total del periodo</span>
                  <div className="sparkline expense-spark">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </section>
              <section className="dashboard-grid">
                <div className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Tu flujo de dinero</h3>
                      <p>Ingresos y gastos a lo largo del tiempo</p>
                    </div>
                    <select
                      value={reportRange}
                      onChange={(e) => setReportRange(e.target.value)}
                    >
                      <option value="3">Últimos 3 meses</option>
                      <option value="6">Últimos 6 meses</option>
                      <option value="12">Últimos 12 meses</option>
                    </select>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyData}
                        margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="incomeFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#46b99a"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="100%"
                              stopColor="#46b99a"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="expenseFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#ef8e9d"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="100%"
                              stopColor="#ef8e9d"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#edf0f5"
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9299a8", fontSize: 11 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9299a8", fontSize: 10 }}
                          tickFormatter={(v) =>
                            v >= 1000 ? `${Math.round(v / 1000)}k` : v
                          }
                        />
                        <Tooltip
                          formatter={(v) => money(v, currency)}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #eef0f5",
                            boxShadow: "0 8px 30px #1e293b12",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="income"
                          name="Ingresos"
                          stroke="#46b99a"
                          strokeWidth={2.5}
                          fill="url(#incomeFill)"
                        />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          name="Gastos"
                          stroke="#ed8d9b"
                          strokeWidth={2.5}
                          fill="url(#expenseFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-dot income-dot" /> Ingresos
                    </span>
                    <span>
                      <i className="legend-dot expense-dot" /> Gastos
                    </span>
                  </div>
                </div>
                <div className="panel category-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>¿En qué gastas?</h3>
                      <p>Distribución por categoría</p>
                    </div>
                    <button
                      className="small-link"
                      onClick={() => setPage("reports")}
                    >
                      Ver informe →
                    </button>
                  </div>
                  {expenseByCategory.length ? (
                    <>
                      <div className="donut-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseByCategory}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={64}
                              outerRadius={87}
                              paddingAngle={3}
                              stroke="none"
                            >
                              {expenseByCategory.map((c) => (
                                <Cell key={c.name} fill={c.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => money(v, currency)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center">
                          <strong>{money(totalExpense, currency)}</strong>
                          <span>total gastos</span>
                        </div>
                      </div>
                      <div className="category-legend">
                        {expenseByCategory.slice(0, 5).map((c) => (
                          <div key={c.name} className="category-legend-row">
                            <span>
                              <i style={{ background: c.color }} />
                              {c.name}
                            </span>
                            <b>
                              {Math.round(
                                (c.value / (totalExpense || 1)) * 100,
                              )}
                              %
                            </b>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-chart">
                      <span>◌</span>
                      <p>Aún no hay gastos en este periodo.</p>
                      <button
                        className="small-link"
                        onClick={() => setShowTransaction(true)}
                      >
                        Añadir el primero →
                      </button>
                    </div>
                  )}
                </div>
              </section>
              <section className="dashboard-grid lower-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Movimientos recientes</h3>
                      <p>Lo último que registraste</p>
                    </div>
                    <button
                      className="small-link"
                      onClick={() => setPage("transactions")}
                    >
                      Ver todos →
                    </button>
                  </div>
                  <TransactionList
                    items={visibleTransactions
                      .filter(
                        (t) => String(t.date || "").slice(0, 7) === period,
                      )
                      .slice(0, 5)}
                    currency={currency}
                    onDelete={(id) =>
                      removeItem(
                        "transactions",
                        id,
                        setTransactions,
                        transactions,
                      )
                    }
                    demo={demo}
                  />
                </div>
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Metas de ahorro</h3>
                      <p>Un poco más cerca cada día</p>
                    </div>
                    <button
                      className="small-link"
                      onClick={() => setPage("goals")}
                    >
                      Ver metas →
                    </button>
                  </div>
                  <GoalMini goals={goals.slice(0, 2)} currency={currency} />
                </div>
              </section>
            </div>
          )}

          {page === "transactions" && (
            <section className="panel table-panel">
              <div className="table-tools">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar movimientos…"
                  />
                </div>
                <label className="filter-select-label">
                  Espacio
                  <select
                    className="filter-select"
                    value={activePlan}
                    onChange={(e) => setActivePlan(e.target.value)}
                  >
                    <option value="personal">Mis finanzas</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-secondary" onClick={exportCSV}>
                  <Download size={16} /> Exportar CSV
                </button>
              </div>
              <TransactionList
                items={visibleTransactions}
                currency={currency}
                onDelete={(id) =>
                  removeItem("transactions", id, setTransactions, transactions)
                }
                demo={demo}
                showAll
              />
            </section>
          )}

          {page === "budgets" && (
            <section className="page-stack">
              <div className="budgets-intro panel">
                <div className="budget-intro-icon">
                  <Activity size={23} />
                </div>
                <div>
                  <h3>
                    Presupuesto de{" "}
                    {new Date(`${period}-01T12:00:00`).toLocaleDateString(
                      "es-UY",
                      { month: "long", year: "numeric" },
                    )}
                  </h3>
                  <p>
                    Los límites son una guía, no una regla. Ajusta tus objetivos
                    cuando lo necesites.
                  </p>
                </div>
                <div className="budget-controls">
                  <input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    aria-label="Mes del presupuesto"
                  />
                  <select value={activePlan} onChange={(e) => setActivePlan(e.target.value)} aria-label="Espacio del presupuesto">
                    <option value="personal">Mis finanzas</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={() => setShowBudget(true)}><Plus size={16}/> Nuevo presupuesto</button>
                </div>
              </div>
              <div className="budget-grid">
                {visibleBudgets.map((b) => {
                  const spent = budgetSpend(b);
                  const pct = Math.min(
                    100,
                    (spent / (Number(b.limit) || 1)) * 100,
                  );
                  return (
                    <div className="panel budget-card" key={b.id}>
                      <div className="budget-card-top">
                        <span
                          className="category-icon"
                          style={{
                            background: `${catColor(b.category)}22`,
                            color: catColor(b.category),
                          }}
                        >
                          {categories.find((c) => c.name === b.category)
                            ?.icon || "◇"}
                        </span>
                        <button
                          className="icon-button tiny"
                          onClick={() =>
                            removeItem("budgets", b.id, setBudgets, budgets)
                          }
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <span className="muted">{b.category}</span>
                      <strong>
                        {money(spent, currency)}{" "}
                        <small>/ {money(b.limit, currency)}</small>
                      </strong>
                      <div className="progress-track">
                        <i
                          style={{
                            width: `${pct}%`,
                            background:
                              pct >= 100 ? "#e8798b" : catColor(b.category),
                          }}
                        />
                      </div>
                      <div className="budget-foot">
                        <span>
                          {Math.round((spent / (Number(b.limit) || 1)) * 100)}%
                          utilizado
                        </span>
                        <b>
                          {spent > Number(b.limit)
                            ? "Excedido"
                            : `Quedan ${money(Number(b.limit) - spent, currency)}`}
                        </b>
                      </div>
                    </div>
                  );
                })}
                {!budgets.length && (
                  <EmptyState
                    icon={Activity}
                    title="Crea tu primer presupuesto"
                    text="Elige una categoría y define un límite mensual para mantenerte en control."
                    action="Crear presupuesto"
                    onAction={() => setShowBudget(true)}
                  />
                )}
              </div>
            </section>
          )}

          {page === "goals" && (
            <section className="page-stack">
              <div className="goal-hero">
                <div>
                  <span className="eyebrow">TU FUTURO, PASO A PASO</span>
                  <h2>
                    Todo gran plan empieza
                    <br />
                    con un pequeño ahorro.
                  </h2>
                  <p>
                    Define una meta, aporta cuando puedas y mira cómo crece.
                  </p>
                </div>
                <div className="goal-hero-art">
                  <div className="goal-circle">
                    <PiggyBank size={47} />
                    <span>ahorro</span>
                  </div>
                  <span className="float-coin coin-a">$</span>
                  <span className="float-coin coin-b">✦</span>
                </div>
              </div>
              <div className="goal-grid">
                {goals.map((g) => (
                  <div className="panel goal-card" key={g.id}>
                    <div className="goal-card-top">
                      <span className="goal-emoji">{g.emoji || "🎯"}</span>
                      <button
                        className="icon-button tiny"
                        onClick={() =>
                          removeItem("goals", g.id, setGoals, goals)
                        }
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <h3>{g.name}</h3>
                    <p className="muted">
                      {g.due
                        ? `Objetivo: ${new Date(`${g.due}T12:00:00`).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Sin fecha límite"}
                    </p>
                    <div className="goal-amounts">
                      <strong>{money(g.saved, currency)}</strong>
                      <span>de {money(g.target, currency)}</span>
                    </div>
                    <div className="progress-track goal-progress">
                      <i
                        style={{
                          width: `${Math.min(100, (g.saved / (g.target || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="goal-card-bottom">
                      <span>
                        {Math.round((g.saved / (g.target || 1)) * 100)}%
                        alcanzado
                      </span>
                      <button
                        className="small-link"
                        onClick={() => {
                          setGoalContribution(g.id);
                          setContributionAmount("");
                          setContributionSource("Sueldo");
                        }}
                      >
                        + Añadir aporte
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="new-goal-card"
                  onClick={() => setShowGoal(true)}
                >
                  <span>
                    <Plus size={22} />
                  </span>
                  <b>Una nueva meta</b>
                  <small>¿Qué te gustaría conseguir?</small>
                </button>
              </div>
            </section>
          )}

          {page === "reports" && (
            <section className="page-stack">
              <div className="report-controls panel">
                <div>
                  <h3>Tu informe financiero</h3>
                  <p className="muted">
                    Compara ingresos y gastos entre periodos.
                  </p>
                </div>
                <div className="report-selects">
                  <label>
                    Periodo
                    <select
                      value={reportRange}
                      onChange={(e) => setReportRange(e.target.value)}
                    >
                      <option value="3">3 meses</option>
                      <option value="6">6 meses</option>
                      <option value="12">12 meses</option>
                    </select>
                  </label>
                  <label>
                    Mes de referencia
                    <input
                      type="month"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    />
                  </label>
                </div>
              </div>
              <div className="report-kpis">
                <div className="panel report-kpi">
                  <span>Ingresos del mes</span>
                  <strong className="text-income">
                    {money(totalIncome, currency)}
                  </strong>
                </div>
                <div className="panel report-kpi">
                  <span>Gastos del mes</span>
                  <strong className="text-expense">
                    {money(totalExpense, currency)}
                  </strong>
                </div>
                <div className="panel report-kpi">
                  <span>Diferencia</span>
                  <strong>{money(balance, currency)}</strong>
                </div>
              </div>
              <div className="panel report-chart">
                <div className="panel-heading">
                  <div>
                    <h3>Comparativa de periodos</h3>
                    <p>Totales mensuales en {currency}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={exportCSV}>
                    <Download size={16} /> Exportar datos
                  </button>
                </div>
                <div className="chart-wrap tall">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      barGap={5}
                      margin={{ top: 15, right: 10, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#edf0f5"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9299a8", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9299a8", fontSize: 11 }}
                      />
                      <Tooltip formatter={(v) => money(v, currency)} />
                      <Bar
                        dataKey="income"
                        name="Ingresos"
                        fill="#46b99a"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name="Gastos"
                        fill="#ed8d9b"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Resumen por categoría</h3>
                    <p>Gastos del periodo seleccionado</p>
                  </div>
                </div>
                {expenseByCategory.map((c) => (
                  <div className="report-category" key={c.name}>
                    <span>
                      <i style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <div className="report-category-bar">
                      <i
                        style={{
                          width: `${(c.value / (totalExpense || 1)) * 100}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                    <b>{money(c.value, currency)}</b>
                    <small>
                      {Math.round((c.value / (totalExpense || 1)) * 100)}%
                    </small>
                  </div>
                ))}
                {!expenseByCategory.length && (
                  <p className="muted">
                    No hay gastos registrados en este periodo.
                  </p>
                )}
              </div>
            </section>
          )}

          {page === "shared" && (
            <section className="page-stack">
              <div className="shared-hero">
                <div className="shared-hero-icon">
                  <Users size={26} />
                </div>
                <div>
                  <h2>Las finanzas también se organizan en equipo.</h2>
                  <p>
                    Crea un espacio compartido con tu pareja, un compañero de
                    piso o un amigo para organizar gastos y objetivos en común.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowPlan(true)}
                >
                  <Plus size={16} /> Nuevo plan
                </button>
              </div>
              <div className="shared-grid">
                {plans.map((p) => (
                  <div className="panel shared-card" key={p.id}>
                    <div className="shared-card-top">
                      <span className="shared-avatar">
                        <Users size={20} />
                      </span>
                      <span className="status-pill">
                        {p.memberUids?.length > 1 ? "Compartido" : "Solo tú"}
                      </span>
                    </div>
                    <h3>{p.name}</h3>
                    <p className="muted">
                      {p.kind === "Couple"
                        ? "Pareja"
                        : p.kind === "Flatmates"
                          ? "Compañeros de piso"
                          : p.kind === "Trip"
                            ? "Viaje"
                            : "Otro plan"}{" "}
                      · Creado{" "}
                      {new Date(p.createdAt).toLocaleDateString("es-UY", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <div className="shared-plan-budget">
                      <span>Presupuesto objetivo</span>
                      <strong>{money(p.budget, currency)}</strong>
                    </div>
                    <div className="member-chips">
                      {(p.memberEmails || []).map((e) => (
                        <span key={e}>{e}</span>
                      ))}
                      {(p.pendingInviteEmails || []).map((e) => (
                        <span
                          className="pending-member-chip"
                          key={`pending-${e}`}
                        >
                          <Mail size={11} /> {e} · Invitación pendiente
                        </span>
                      ))}
                    </div>
                    <button
                      className="btn btn-secondary btn-full"
                      onClick={() => {
                        setActivePlan(p.id);
                        setPage("transactions");
                        setToast(
                          `Estás viendo el plan ${p.name}. Los movimientos nuevos quedarán asociados a este plan.`,
                        );
                      }}
                    >
                      Ver movimientos del plan <span>→</span>
                    </button>
                  </div>
                ))}
                <button
                  className="new-shared-card"
                  onClick={() => setShowPlan(true)}
                >
                  <span>
                    <Plus size={22} />
                  </span>
                  <b>Crear un plan en común</b>
                  <small>Invita a alguien por correo</small>
                </button>
              </div>
              <div className="panel invitations-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Invitaciones recibidas</h3>
                    <p>Si te invitaron con este correo, puedes unirte aquí.</p>
                  </div>
                  <Mail size={19} className="muted" />
                </div>
                {receivedInvitations.length ? (
                  receivedInvitations.map((i) => (
                    <div className="invitation-row" key={i.id}>
                      <span className="invitation-avatar">
                        <Mail size={16} />
                      </span>
                      <div>
                        <b>{i.planName}</b>
                        <small>Invita: {i.inviterEmail}</small>
                      </div>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => acceptInvitation(i)}
                      >
                        Aceptar
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    No tienes invitaciones pendientes en este correo.
                  </p>
                )}
                <div className="panel-heading sent-heading">
                  <div>
                    <h3>Invitaciones enviadas</h3>
                    <p>Estado de los correos que invitaste</p>
                  </div>
                </div>
                {invitations.length ? (
                  invitations.map((i) => (
                    <div className="invitation-row" key={i.id}>
                      <span className="invitation-avatar">
                        <Mail size={16} />
                      </span>
                      <div>
                        <b>{i.inviteeEmail}</b>
                        <small>Plan: {i.planName}</small>
                      </div>
                      <span
                        className={`status-pill ${i.status === "accepted" ? "accepted" : ""}`}
                      >
                        {i.status === "accepted" ? "Aceptada" : "Pendiente"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">Todavía no has enviado invitaciones.</p>
                )}
              </div>
              <div className="privacy-note">
                <ShieldCheck size={18} />
                <span>
                  Los planes compartidos son privados. Solo las personas
                  autorizadas deben poder ver sus movimientos y presupuestos.
                </span>
              </div>
            </section>
          )}

          {page === "settings" && (
            <section className="page-stack">
              <div className="panel settings-card">
                <div className="settings-icon">
                  <Settings size={21} />
                </div>
                <div className="settings-content">
                  <h3>Preferencias</h3>
                  <p className="muted">Configura cómo ves tus cantidades.</p>
                  <label>
                    Moneda principal
                    <select
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        saveLocal("plata_currency", e.target.value);
                      }}
                    >
                      <option value="UYU">Peso uruguayo (UYU)</option>
                      <option value="ARS">Peso argentino (ARS)</option>
                      <option value="USD">Dólar estadounidense (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </label>
                  <p className="tiny-note">
                    Cambiar la moneda solo cambia el símbolo y el formato. No
                    convierte los importes existentes.
                  </p>
                </div>
              </div>
              <div className="panel settings-card">
                <div className="settings-icon">
                  <ShieldCheck size={21} />
                </div>
                <div className="settings-content">
                  <h3>Privacidad y datos</h3>
                  <p className="muted">
                    Tus movimientos son privados salvo que los asocies a un plan
                    compartido.
                  </p>
                  <button className="btn btn-secondary" onClick={exportCSV}>
                    <Download size={16} /> Descargar mis movimientos
                  </button>
                </div>
              </div>
              <div className="panel settings-card">
                <div className="settings-icon">
                  <CircleHelp size={21} />
                </div>
                <div className="settings-content">
                  <h3>Acerca de Plata</h3>
                  <p className="muted">
                    Una herramienta de organización financiera personal. No es
                    un banco ni asesoramiento financiero.
                  </p>
                  <span className="version-pill">Versión inicial · 1.0</span>
                </div>
              </div>
            </section>
          )}
        </div>
        <footer className="app-footer">
          <span>Hecho para tener una relación más clara con tu dinero.</span>
          <span>
            <ShieldCheck size={14} /> Tus finanzas, tu control.
          </span>
        </footer>
      </main>

      {showTransaction && (
        <Modal
          title="Añadir movimiento"
          subtitle="Registra un ingreso o gasto."
          onClose={() => setShowTransaction(false)}
        >
          <form className="modal-form" onSubmit={addTransaction}>
            <div className="segmented">
              <button
                type="button"
                className={
                  transactionForm.type === "expense"
                    ? "selected expense-selected"
                    : ""
                }
                onClick={() =>
                  setTransactionForm({
                    ...transactionForm,
                    type: "expense",
                    category: "Comida",
                  })
                }
              >
                <ArrowUpRight size={16} /> Gasto
              </button>
              <button
                type="button"
                className={
                  transactionForm.type === "income"
                    ? "selected income-selected"
                    : ""
                }
                onClick={() =>
                  setTransactionForm({
                    ...transactionForm,
                    type: "income",
                    category: "Sueldo",
                  })
                }
              >
                <ArrowDownLeft size={16} /> Ingreso
              </button>
              <button
                type="button"
                className={transactionForm.type === "goal_contribution" ? "selected goal-selected" : ""}
                onClick={() => setTransactionForm({ ...transactionForm, type: "goal_contribution", category: "Ahorro", title: "Aporte a meta" })}
              >
                <PiggyBank size={16} /> Aporte a meta
              </button>
            </div>
            <label>
              Concepto
              <input
                autoFocus
                value={transactionForm.title}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    title: e.target.value,
                  })
                }
                placeholder="Ej. Compra del súper"
                required
              />
            </label>
            <div className="form-row">
              <label>
                Importe ({currency})
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0"
                  required
                />
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>
            {transactionForm.type === "goal_contribution" ? (
              <>
                <label>
                  Meta de ahorro
                  <select value={transactionForm.goalId} onChange={(e) => {
                    const selectedGoal = goals.find((g) => g.id === e.target.value);
                    setTransactionForm({ ...transactionForm, goalId: e.target.value, title: selectedGoal ? `Aporte a meta: ${selectedGoal.name}` : "Aporte a meta" });
                  }} required>
                    <option value="">Selecciona una meta…</option>
                    {goals.filter((g) => activePlan === "personal" ? !g.planId : g.planId === activePlan).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </label>
                <label>
                  ¿De dónde sale el dinero?
                  <select value={transactionForm.sourceCategory} onChange={(e) => setTransactionForm({ ...transactionForm, sourceCategory: e.target.value })}>
                    <option value="Sueldo">Sueldo</option>
                    <option value="Freelance">Trabajo independiente</option>
                    <option value="Ahorros previos">Ahorros previos</option>
                    <option value="Otros">Otra fuente</option>
                  </select>
                </label>
                <div className="notice">El aporte se registrará como gasto de ahorro del mes y aumentará el progreso de la meta elegida.</div>
              </>
            ) : (
              <label>
                Categoría
                <select
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                >
                  {categories.filter((c) => c.type === "both" || c.type === transactionForm.type).map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Nota (opcional)
              <textarea
                value={transactionForm.note}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    note: e.target.value,
                  })
                }
                placeholder="Añade un detalle…"
                rows="2"
              />
            </label>
            {activePlan !== "personal" && (
              <div className="notice">
                Este movimiento se asociará al plan compartido seleccionado.
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowTransaction(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary">
                <Plus size={16} /> Guardar movimiento
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showBudget && (
        <Modal
          title="Crear presupuesto"
          subtitle="Define un límite mensual por categoría."
          onClose={() => setShowBudget(false)}
        >
          <form className="modal-form" onSubmit={addBudget}>
            <label>
              Categoría
              <select
                value={budgetForm.category}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, category: e.target.value })
                }
              >
                {categories
                  .filter((c) => c.type !== "income")
                  .map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
              </select>
            </label>
            <label>
              Límite mensual ({currency})
              <input
                type="number"
                min="1"
                value={budgetForm.limit}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, limit: e.target.value })
                }
                placeholder="Ej. 5000"
                required
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowBudget(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary">Crear presupuesto</button>
            </div>
          </form>
        </Modal>
      )}
      {showGoal && (
        <Modal
          title="Nueva meta de ahorro"
          subtitle="Ponle nombre a eso que quieres conseguir."
          onClose={() => setShowGoal(false)}
        >
          <form className="modal-form" onSubmit={addGoal}>
            <label>
              Nombre de la meta
              <input
                value={goalForm.name}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, name: e.target.value })
                }
                placeholder="Ej. Viaje, laptop, fondo de emergencia"
                required
              />
            </label>
            <label>
              Objetivo ({currency})
              <input
                type="number"
                min="1"
                value={goalForm.target}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, target: e.target.value })
                }
                required
              />
            </label>
            <div className="notice">La meta comenzará en cero. Usa “Añadir aporte” para registrar cada ahorro; te preguntaremos de dónde sale el dinero y lo anotaremos también en Movimientos.</div>
            <div className="form-row">
              <label>
                Fecha objetivo
                <input
                  type="date"
                  value={goalForm.due}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, due: e.target.value })
                  }
                />
              </label>
              <label>
                Emoji
                <select
                  value={goalForm.emoji}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, emoji: e.target.value })
                  }
                >
                  {["🎯", "✈️", "🏠", "💻", "🚗", "🎓", "🎁", "🛟"].map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowGoal(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary">Crear meta</button>
            </div>
          </form>
        </Modal>
      )}
      {showPlan && (
        <Modal
          title="Crear plan compartido"
          subtitle="Invita a alguien para organizar gastos u objetivos en común."
          onClose={() => setShowPlan(false)}
        >
          <form className="modal-form" onSubmit={createPlan}>
            <label>
              Nombre del plan
              <input
                value={planForm.name}
                onChange={(e) =>
                  setPlanForm({ ...planForm, name: e.target.value })
                }
                placeholder="Ej. Alquiler y gastos de casa"
                required
              />
            </label>
            <label>
              Tipo de plan
              <select
                value={planForm.kind}
                onChange={(e) =>
                  setPlanForm({ ...planForm, kind: e.target.value })
                }
              >
                <option value="Couple">Pareja</option>
                <option value="Flatmates">Compañeros de piso</option>
                <option value="Trip">Viaje con amigos</option>
                <option value="Other">Otro objetivo común</option>
              </select>
            </label>
            <label>
              Correo de la persona a invitar
              <input
                type="email"
                value={planForm.email}
                onChange={(e) =>
                  setPlanForm({ ...planForm, email: e.target.value })
                }
                placeholder="persona@email.com"
                required
              />
            </label>
            <label>
              Presupuesto objetivo (opcional)
              <input
                type="number"
                min="0"
                value={planForm.budget}
                onChange={(e) =>
                  setPlanForm({ ...planForm, budget: e.target.value })
                }
                placeholder="Ej. 15000"
              />
            </label>
            <div className="notice">
              <Mail size={16} /> Se guardará la invitación y se abrirá tu
              aplicación de correo con un mensaje preparado. El envío automático
              requiere configurar un servicio de correo en Firebase.
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowPlan(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary">
                <Mail size={16} /> Crear e invitar
              </button>
            </div>
          </form>
        </Modal>
      )}
      {goalContribution && (
        <Modal
          title="Añadir aporte"
          subtitle={`Meta: ${goals.find((g) => g.id === goalContribution)?.name || ""}`}
          onClose={() => setGoalContribution(null)}
        >
          <form className="modal-form" onSubmit={contributeGoal}>
            <label>
              Importe ({currency})
              <input
                type="number"
                min="1"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="Ej. 500"
                required
              />
            </label>
            <label>
              ¿De dónde sale el dinero?
              <select value={contributionSource} onChange={(e) => setContributionSource(e.target.value)}>
                <option value="Sueldo">Sueldo</option>
                <option value="Freelance">Trabajo independiente</option>
                <option value="Ahorros previos">Ahorros previos</option>
                <option value="Otros">Otra fuente</option>
              </select>
            </label>
            <p className="muted">El aporte también se registrará en Movimientos como gasto de ahorro de este mes.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setGoalContribution(null)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary">Añadir aporte</button>
            </div>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
          <button onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
