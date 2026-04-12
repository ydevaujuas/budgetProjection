import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from "recharts";

const CHILD1_BIRTH = 2025.3;
const CURRENT_YEAR = 2026;

const getCostByAge = (age, crechePrice) => {
  if (age < 0) return { garde: 0, alim: 0, label: "" };
  if (age < 3)  return { garde: crechePrice, alim: 80,  label: "Crèche" };
  if (age < 6)  return { garde: 180,         alim: 150, label: "Maternelle" };
  if (age < 11) return { garde: 120,          alim: 200, label: "Primaire" };
  if (age < 18) return { garde: 150,          alim: 250, label: "Collège/Lycée" };
  return        { garde: 0,    alim: 100, label: "Adulte" };
};

// Barèmes CAF 2025 — approximatifs, à titre indicatif
const getAidesCaf = (revAnnuel, nbEnfants, nbMoins3, nbMoins6) => {
  // CMG — Complément Mode de Garde (ass. mat / crèche privée, enfant < 6 ans)
  let cmgBase = 0;
  if (revAnnuel <= 26000)       cmgBase = 920;
  else if (revAnnuel <= 46000)  cmgBase = 750;
  else if (revAnnuel <= 72000)  cmgBase = 560;
  else                          cmgBase = 310;
  const cmg = nbMoins6 > 0 ? Math.round(cmgBase * (1 + (nbMoins6 - 1) * 0.25)) : 0;

  // Allocations familiales (à partir de 2 enfants)
  let allocFam = 0;
  if (nbEnfants >= 2) {
    let base = revAnnuel <= 72570 ? 176 : revAnnuel <= 96756 ? 88 : 44;
    if (nbEnfants >= 3) base += revAnnuel <= 72570 ? 226 : revAnnuel <= 96756 ? 113 : 57;
    allocFam = base;
  }

  // PAJE — allocation de base (par enfant < 3 ans)
  let pajeUnit = 0;
  if (revAnnuel <= 36000)       pajeUnit = 196;
  else if (revAnnuel <= 48000)  pajeUnit = 98;
  const paje = nbMoins3 * pajeUnit;

  return { cmg, allocFam, paje, total: cmg + allocFam + paje };
};

const estimateNetAfterTax = (revenuBrut) => {
  const taux = revenuBrut <= 4000 ? 0.08 : revenuBrut <= 5500 ? 0.10 : revenuBrut <= 7000 ? 0.12 : 0.14;
  return Math.round(revenuBrut * (1 - taux));
};

const SECTION_COLORS = {
  garde:    "#f97316",
  alim:     "#3b82f6",
  voiture:  "#8b5cf6",
  energie:  "#06b6d4",
  telecom:  "#0ea5e9",
  loisirs:  "#ec4899",
  assurance:"#64748b",
  aides:    "#22c55e",
};

const CustomTooltip = ({ active, payload, label, fixedCharges, mensualite }) => {
  if (!active || !payload?.length) return null;
  const varData = payload.filter(p => p.dataKey !== "totalAides");
  const aidesItem = payload.find(p => p.dataKey === "totalAides");
  const varTotal = varData.reduce((s, p) => s + (p.value || 0), 0);
  const grandTotal = varTotal + fixedCharges + mensualite;
  const net = grandTotal - (aidesItem?.value || 0);
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", color: "#f1f5f9", fontSize: 12, minWidth: 230 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#e2e8f0", fontSize: 13 }}>{label}</div>
      <div style={{ marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #334155" }}>
        {varData.map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, color: p.color, marginBottom: 3 }}>
            <span>{p.name}</span><span style={{ fontWeight: 600 }}>{p.value?.toLocaleString("fr-FR")} €</span>
          </div>
        ))}
      </div>
      <div style={{ color: "#94a3b8", marginBottom: 3, display: "flex", justifyContent: "space-between" }}>
        <span>Charges fixes</span><span>{fixedCharges.toLocaleString("fr-FR")} €</span>
      </div>
      <div style={{ color: "#94a3b8", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
        <span>Mensualité prêt</span><span>{mensualite.toLocaleString("fr-FR")} €</span>
      </div>
      <div style={{ paddingTop: 6, borderTop: "1px solid #475569", display: "flex", justifyContent: "space-between", color: "#f8fafc", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
        <span>Total sorties</span><span>{grandTotal.toLocaleString("fr-FR")} €</span>
      </div>
      {aidesItem?.value > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", color: "#4ade80", fontWeight: 700, fontSize: 13 }}>
          <span>− Aides CAF est.</span><span>−{aidesItem.value.toLocaleString("fr-FR")} €</span>
        </div>
      )}
      {aidesItem?.value > 0 && (
        <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", color: "#a3e635", fontWeight: 800, fontSize: 13 }}>
          <span>Net après aides</span><span>{net.toLocaleString("fr-FR")} €</span>
        </div>
      )}
    </div>
  );
};

const SliderControl = ({ label, value, setValue, min, max, step = 1, unit = "", color = "#f97316", hint }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{value.toLocaleString("fr-FR")}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => setValue(Number(e.target.value))}
      style={{ width: "100%", accentColor: color, cursor: "pointer", height: 4 }}
    />
    {hint && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{hint}</div>}
  </div>
);

const SectionTitle = ({ icon, label }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
    <span>{icon}</span>{label}
  </div>
);

const AideBadge = ({ label, value, detail }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: "#f0fdf4", marginBottom: 6 }}>
    <div>
      <div style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{label}</div>
      {detail && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{detail}</div>}
    </div>
    <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
      {value > 0 ? `+${value.toLocaleString("fr-FR")} €` : <span style={{ color: "#94a3b8" }}>—</span>}
    </span>
  </div>
);

export default function BudgetProjection() {
  const [nbChildren, setNbChildren] = useState(2);
  const [gap2, setGap2] = useState(3);
  const [gap3, setGap3] = useState(3);
  const [revenuFoyer, setRevenuFoyer] = useState(5200);
  const [montantPret, setMontantPret] = useState(300000);
  const [dureePret, setDureePret] = useState(25);
  const [tauxPret, setTauxPret] = useState(3.5);
  const [achatAnnee, setAchatAnnee] = useState(2028);
  const [crechePrice, setCrechePrice] = useState(750);
  const [baseAlim, setBaseAlim] = useState(500);
  const [voiture, setVoiture] = useState(100);
  const [energie, setEnergie] = useState(147);
  const [telecom, setTelecom] = useState(34);
  const [loisirs, setLoisirs] = useState(200);
  const [assurance, setAssurance] = useState(89);
  const [includeAides, setIncludeAides] = useState(true);
  const [activeTab, setActiveTab] = useState("famille");

  const child2Birth = CHILD1_BIRTH + gap2;
  const child3Birth = child2Birth + gap3;

  const revenuNet = useMemo(() => estimateNetAfterTax(revenuFoyer), [revenuFoyer]);
  const revAnnuel = revenuFoyer * 12;
  const fixedCharges = voiture + energie + telecom + loisirs + assurance;

  const mensualite = useMemo(() => {
    const r = tauxPret / 100 / 12;
    const n = dureePret * 12;
    if (r === 0) return Math.round(montantPret / n);
    return Math.round(montantPret * r / (1 - Math.pow(1 + r, -n)));
  }, [montantPret, dureePret, tauxPret]);

  const data = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => {
      const year = CURRENT_YEAR + i;

      // Garde & alim per child
      const age1 = year - CHILD1_BIRTH;
      const c1 = getCostByAge(age1, crechePrice);
      let garde = c1.garde, alimExtra = c1.alim;
      let nbMoins3 = 0, nbMoins6 = 0;
      if (age1 >= 0 && age1 < 3) nbMoins3++;
      if (age1 >= 0 && age1 < 6) nbMoins6++;

      if (nbChildren >= 2) {
        const age2 = year - child2Birth;
        const c2 = getCostByAge(age2, crechePrice);
        garde += c2.garde; alimExtra += c2.alim;
        if (age2 >= 0 && age2 < 3) nbMoins3++;
        if (age2 >= 0 && age2 < 6) nbMoins6++;
      }
      if (nbChildren >= 3) {
        const age3 = year - child3Birth;
        const c3 = getCostByAge(age3, crechePrice);
        garde += c3.garde; alimExtra += c3.alim;
        if (age3 >= 0 && age3 < 3) nbMoins3++;
        if (age3 >= 0 && age3 < 6) nbMoins6++;
      }

      const aides = getAidesCaf(revAnnuel, nbChildren, nbMoins3, nbMoins6);

      return {
        year: String(year),
        garde: Math.round(garde),
        alim: Math.round(baseAlim + alimExtra),
        voiture, energie, telecom, loisirs, assurance,
        totalAides: aides.total,
        cmg: aides.cmg,
        allocFam: aides.allocFam,
        paje: aides.paje,
        nbMoins3, nbMoins6,
      };
    });
  }, [nbChildren, gap2, gap3, crechePrice, baseAlim, voiture, energie, telecom, loisirs, assurance, child2Birth, child3Birth, revAnnuel]);

  const currentYearData = data[0];
  const peakData = [...data].sort((a, b) => (b.garde + b.alim) - (a.garde + a.alim))[0];
  const peakVarTotal = peakData.garde + peakData.alim;
  const peakGrandTotal = peakVarTotal + fixedCharges + mensualite;
  const margeAuPic = revenuNet - peakGrandTotal;
  const margeApresAides = margeAuPic + (includeAides ? peakData.totalAides : 0);
  const tauxEndettement = Math.round((mensualite / revenuNet) * 100);

  const tabs = [
    { id: "famille", label: "👨‍👩‍👧 Famille" },
    { id: "revenus", label: "💶 Revenus & Prêt" },
    { id: "charges", label: "🏠 Charges" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", minHeight: "100vh", padding: "28px 20px", color: "#1e293b" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, margin: 0, color: "#0f172a" }}>Projection des dépenses familiales</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Simulation sur 10 ans · 2026–2036</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Revenu net estimé", value: `${revenuNet.toLocaleString("fr-FR")} €`, sub: `après impôt (~${Math.round((1 - revenuNet/revenuFoyer)*100)}%)`, color: "#22c55e" },
          { label: "Taux d'endettement", value: `${tauxEndettement} %`, sub: `mensualité : ${mensualite.toLocaleString("fr-FR")} €`, color: tauxEndettement > 35 ? "#ef4444" : tauxEndettement > 30 ? "#f59e0b" : "#22c55e" },
          { label: "Aides CAF (année en cours)", value: `+${currentYearData.totalAides.toLocaleString("fr-FR")} €/mois`, sub: `CMG + AF + PAJE — barèmes 2025`, color: "#22c55e" },
          { label: "Marge au pic après aides", value: `${margeApresAides.toLocaleString("fr-FR")} €/mois`, sub: margeApresAides < 600 ? "⚠️ Très serré" : margeApresAides < 1000 ? "🟡 Correct" : "✅ Confortable", color: margeApresAides < 600 ? "#ef4444" : margeApresAides < 1000 ? "#f59e0b" : "#22c55e" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Chart */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 16 }}>Dépenses variables mensuelles (garde + alimentation)</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  {["garde","alim"].map(k => (
                    <linearGradient key={k} id={`${k}Grad`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SECTION_COLORS[k]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={SECTION_COLORS[k]} stopOpacity={0.04}/>
                    </linearGradient>
                  ))}
                  <linearGradient id="aidesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.03}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} width={52} />
                <Tooltip content={<CustomTooltip fixedCharges={fixedCharges} mensualite={mensualite} />} />
                <ReferenceLine x={String(achatAnnee)} stroke="#8b5cf6" strokeDasharray="5 3"
                  label={{ value: "Achat 🏠", fill: "#8b5cf6", fontSize: 10, position: "insideTopLeft" }} />
                <Area type="monotone" dataKey="alim" name="Alimentation" stackId="1"
                  stroke={SECTION_COLORS.alim} fill="url(#alimGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="garde" name="Garde d'enfant(s)" stackId="1"
                  stroke={SECTION_COLORS.garde} fill="url(#gardeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="totalAides" name="Aides CAF est."
                  stroke="#22c55e" fill="url(#aidesGrad)" strokeWidth={2} strokeDasharray="5 3" />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Synthèse */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                Synthèse budgétaire au pic · {peakData.year}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#475569", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={includeAides}
                  onChange={e => setIncludeAides(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: "#22c55e", cursor: "pointer" }}
                />
                Aides CAF
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Revenu net foyer", val: revenuNet, sign: "+", color: "#22c55e" },
                { label: `Mensualité prêt (${achatAnnee}+)`, val: mensualite, sign: "−", color: "#8b5cf6" },
                { label: "Garde d'enfants", val: peakData.garde, sign: "−", color: SECTION_COLORS.garde },
                { label: "Alimentation", val: peakData.alim, sign: "−", color: SECTION_COLORS.alim },
                { label: "Voiture(s)", val: voiture, sign: "−", color: SECTION_COLORS.voiture },
                { label: "Énergie (EDF + Engie)", val: energie, sign: "−", color: SECTION_COLORS.energie },
                { label: "Téléphonie & internet", val: telecom, sign: "−", color: SECTION_COLORS.telecom },
                { label: "Loisirs & vacances", val: loisirs, sign: "−", color: SECTION_COLORS.loisirs },
                { label: "Assurances", val: assurance, sign: "−", color: SECTION_COLORS.assurance },
                ...(includeAides ? [{ label: "Aides CAF estimées", val: peakData.totalAides, sign: "+", color: "#22c55e" }] : []),
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: row.sign === "+" ? "#f0fdf4" : "#f8fafc" }}>
                  <span style={{ fontSize: 12, color: "#475569" }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.sign} {row.val.toLocaleString("fr-FR")} €</span>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: margeAuPic < 0 ? "#fef2f2" : "#f8fafc", border: `1px solid ${margeAuPic < 0 ? "#fecaca" : "#e2e8f0"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Sans aides</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: margeAuPic < 600 ? "#ef4444" : margeAuPic < 1000 ? "#f59e0b" : "#475569" }}>{margeAuPic.toLocaleString("fr-FR")} €</div>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: margeApresAides < 600 ? "#fef2f2" : margeApresAides < 1000 ? "#fffbeb" : "#f0fdf4", border: `1px solid ${margeApresAides < 600 ? "#fecaca" : margeApresAides < 1000 ? "#fde68a" : "#bbf7d0"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>Reste à vivre après aides</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
                    {margeApresAides < 600 ? "⚠️ Marge critique" : margeApresAides < 1000 ? "🟡 Passable" : "✅ Bonne marge"}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, color: margeApresAides < 600 ? "#ef4444" : margeApresAides < 1000 ? "#f59e0b" : "#22c55e" }}>{margeApresAides.toLocaleString("fr-FR")} €</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: activeTab === t.id ? "#fff" : "transparent", color: activeTab === t.id ? "#1e293b" : "#94a3b8", boxShadow: activeTab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>{t.label}</button>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", flex: 1, overflowY: "auto" }}>

            {/* TAB: Famille */}
            {activeTab === "famille" && (
              <>
                <SectionTitle icon="👨‍👩‍👧" label="Configuration familiale" />
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>Nombre d'enfants total</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3].map(n => (
                      <button key={n} onClick={() => setNbChildren(n)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, background: nbChildren === n ? "#f97316" : "#f1f5f9", color: nbChildren === n ? "#fff" : "#64748b", transition: "all 0.15s" }}>{n}</button>
                    ))}
                  </div>
                </div>
                {nbChildren >= 2 && (
                  <SliderControl label="Écart enfant 2 après enfant 1"
                    value={gap2} setValue={setGap2} min={1} max={6} unit=" ans" color="#f97316"
                    hint={`Naissance prévue ≈ ${Math.round(CHILD1_BIRTH + gap2)}`}
                  />
                )}
                {nbChildren >= 3 && (
                  <SliderControl label="Écart enfant 3 après enfant 2"
                    value={gap3} setValue={setGap3} min={1} max={6} unit=" ans" color="#f97316"
                    hint={`Naissance prévue ≈ ${Math.round(CHILD1_BIRTH + gap2 + gap3)}`}
                  />
                )}
                {/* Aides CAF — année en cours */}
                <div style={{ marginTop: 16 }}>
                  <SectionTitle icon="🏦" label="Aides CAF estimées — 2026" />
                  <AideBadge
                    label="CMG — Complément Mode de Garde"
                    value={currentYearData.cmg}
                    detail={`${currentYearData.nbMoins6} enfant(s) < 6 ans · barème ${revAnnuel <= 26000 ? "tranche 1" : revAnnuel <= 46000 ? "tranche 2" : revAnnuel <= 72000 ? "tranche 3" : "tranche 4"}`}
                  />
                  <AideBadge
                    label="Allocations familiales"
                    value={currentYearData.allocFam}
                    detail={nbChildren < 2 ? "Nécessite ≥ 2 enfants" : `${nbChildren} enfants · ${revAnnuel <= 72570 ? "taux plein" : revAnnuel <= 96756 ? "taux partiel" : "taux réduit"}`}
                  />
                  <AideBadge
                    label="PAJE — allocation de base"
                    value={currentYearData.paje}
                    detail={`${currentYearData.nbMoins3} enfant(s) < 3 ans · ${revAnnuel <= 36000 ? "taux plein" : revAnnuel <= 48000 ? "demi-taux" : "hors plafond"}`}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, background: "#dcfce7", marginTop: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>Total aides mensuelles</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>+{currentYearData.totalAides.toLocaleString("fr-FR")} €</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8, lineHeight: 1.4 }}>
                    ⚠️ Estimations basées sur les barèmes CAF 2025. CMG applicable hors crèche PSU municipale (dont le tarif est déjà modulé au revenu). À vérifier sur caf.fr.
                  </div>
                </div>
              </>
            )}

            {/* TAB: Revenus & Prêt */}
            {activeTab === "revenus" && (
              <>
                <SectionTitle icon="💶" label="Revenus du foyer" />
                <SliderControl label="Revenus nets foyer (avant IR)"
                  value={revenuFoyer} setValue={setRevenuFoyer} min={3500} max={8000} step={100} unit=" €"
                  color="#22c55e"
                  hint={`Net après IR estimé : ${estimateNetAfterTax(revenuFoyer).toLocaleString("fr-FR")} €/mois`}
                />
                <div style={{ padding: "10px", background: "#f0fdf4", borderRadius: 8, marginBottom: 16, fontSize: 11, color: "#4ade80" }}>
                  <strong>Estimation fiscale approximative</strong> — taux effectif : ~{Math.round((1 - estimateNetAfterTax(revenuFoyer)/revenuFoyer)*100)}%.<br/>À affiner avec votre avis d'imposition réel.
                </div>

                <SectionTitle icon="🏦" label="Prêt immobilier" />
                <SliderControl label="Montant du prêt"
                  value={montantPret} setValue={setMontantPret} min={100000} max={600000} step={10000} unit=" €"
                  color="#8b5cf6" hint={`${(montantPret/1000).toFixed(0)} k€`}
                />
                <SliderControl label="Durée du prêt"
                  value={dureePret} setValue={setDureePret} min={10} max={30} unit=" ans"
                  color="#8b5cf6"
                />
                <SliderControl label="Taux d'intérêt annuel"
                  value={tauxPret} setValue={setTauxPret} min={0.5} max={6} step={0.1} unit=" %"
                  color="#8b5cf6"
                />
                <div style={{ padding: "10px 12px", background: "#f5f3ff", borderRadius: 8, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mensualité calculée</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Taux d'endettement : {tauxEndettement}% (limite : 35%)</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed" }}>{mensualite.toLocaleString("fr-FR")} €</div>
                </div>
                <SliderControl label="Année d'achat prévue"
                  value={achatAnnee} setValue={setAchatAnnee} min={2027} max={2031} unit=""
                  color="#8b5cf6"
                />
                {tauxEndettement > 35 && (
                  <div style={{ padding: "10px", background: "#fef2f2", borderRadius: 8, fontSize: 11, color: "#ef4444", border: "1px solid #fecaca" }}>
                    ⚠️ Taux d'endettement de <strong>{tauxEndettement}%</strong> — au-dessus du seuil bancaire de 35%.
                  </div>
                )}
              </>
            )}

            {/* TAB: Charges */}
            {activeTab === "charges" && (
              <>
                <SectionTitle icon="🚗" label="Transport" />
                <SliderControl label="Voiture(s) — leasing, carburant, entretien"
                  value={voiture} setValue={setVoiture} min={0} max={1000} step={50} unit=" €" color={SECTION_COLORS.voiture}
                />
                <SectionTitle icon="⚡" label="Logement & énergie" />
                <SliderControl label="Énergie — EDF & gaz"
                  value={energie} setValue={setEnergie} min={50} max={400} step={5} unit=" €"
                  color={SECTION_COLORS.energie} hint="Hors mensualité prêt"
                />
                <SliderControl label="Téléphonie & internet"
                  value={telecom} setValue={setTelecom} min={10} max={150} step={1} unit=" €"
                  color={SECTION_COLORS.telecom}
                />
                <SectionTitle icon="🎯" label="Vie courante" />
                <SliderControl label="Loisirs, sorties, vacances"
                  value={loisirs} setValue={setLoisirs} min={0} max={600} step={50} unit=" €" color={SECTION_COLORS.loisirs}
                />
                <SliderControl label="Assurances (auto, habitation, mutuelle)"
                  value={assurance} setValue={setAssurance} min={50} max={500} step={25} unit=" €" color={SECTION_COLORS.assurance}
                />
                <SectionTitle icon="🍼" label="Coûts de garde (brut)" />
                <SliderControl label="Coût crèche / ass. mat. brut"
                  value={crechePrice} setValue={setCrechePrice} min={400} max={1800} step={50} unit=" €"
                  color={SECTION_COLORS.garde} hint="Coût brut avant aides CAF (CMG déduit séparément)"
                />
                <div style={{ marginTop: 8, padding: "10px 12px", background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                  <span>Total charges fixes</span>
                  <span style={{ color: "#1e293b" }}>{fixedCharges.toLocaleString("fr-FR")} €/mois</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
