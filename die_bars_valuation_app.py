#!/usr/bin/env python3
"""
Die Bars – Commercial Property Investment Valuation App
Bredasdorp, Western Cape, South Africa
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

# ─────────────────────────── page config ───────────────────────────
st.set_page_config(
    page_title="Die Bars – Investment Valuation",
    page_icon="🏢",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────── custom CSS ────────────────────────────
st.markdown("""
<style>
    .metric-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 20px; border-radius: 12px; margin: 5px 0;
        border-left: 4px solid #e94560; color: white;
    }
    .metric-card h3 { margin: 0; font-size: 14px; color: #a0a0a0; }
    .metric-card h2 { margin: 5px 0 0 0; font-size: 24px; }
    .green  { border-left-color: #00b894 !important; }
    .amber  { border-left-color: #fdcb6e !important; }
    .red    { border-left-color: #e94560 !important; }
    .blue   { border-left-color: #0984e3 !important; }
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] {
        background-color: #16213e; color: white;
        border-radius: 8px 8px 0 0; padding: 10px 20px;
    }
    .stTabs [aria-selected="true"] { background-color: #e94560; }
    div[data-testid="stSidebar"] { background: linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%); }
    div[data-testid="stSidebar"] .stMarkdown h1,
    div[data-testid="stSidebar"] .stMarkdown h2,
    div[data-testid="stSidebar"] .stMarkdown h3 { color: #e94560; }
</style>
""", unsafe_allow_html=True)

# ─────────────────────────── helper functions ──────────────────────
def fmt(v, prefix="R", decimals=0):
    """Format a number as Rand."""
    if decimals == 0:
        return f"{prefix}{v:,.0f}"
    return f"{prefix}{v:,.{decimals}f}"

def pct(v, decimals=1):
    return f"{v:.{decimals}f}%"

def traffic(val, green_thresh, amber_thresh, invert=False):
    """Return 🟢🟡🔴 based on thresholds."""
    if invert:
        if val <= green_thresh: return "🟢"
        if val <= amber_thresh: return "🟡"
        return "🔴"
    if val >= green_thresh: return "🟢"
    if val >= amber_thresh: return "🟡"
    return "🔴"

def calc_transfer_duty(price):
    """SA transfer duty schedule (2024/25)."""
    if price <= 1_100_000: return 0
    elif price <= 1_512_500: return (price - 1_100_000) * 0.03
    elif price <= 2_117_500: return 12_375 + (price - 1_512_500) * 0.06
    elif price <= 2_722_500: return 48_675 + (price - 2_117_500) * 0.08
    elif price <= 12_100_000: return 97_075 + (price - 2_722_500) * 0.11
    else: return 1_128_600 + (price - 12_100_000) * 0.13

def calc_bond_repayment(principal, annual_rate, years):
    """Monthly bond repayment (annuity)."""
    if principal <= 0: return 0
    r = annual_rate / 100 / 12
    n = years * 12
    if r == 0: return principal / n
    return principal * r * (1 + r)**n / ((1 + r)**n - 1)

def calc_irr(cashflows):
    """Newton's method IRR on annual cashflows."""
    try:
        return float(np.irr(cashflows)) * 100 if hasattr(np, 'irr') else _irr_newton(cashflows)
    except:
        return _irr_newton(cashflows)

def _irr_newton(cashflows, tol=1e-8, max_iter=1000):
    r = 0.10
    for _ in range(max_iter):
        npv = sum(cf / (1 + r)**t for t, cf in enumerate(cashflows))
        dnpv = sum(-t * cf / (1 + r)**(t + 1) for t, cf in enumerate(cashflows))
        if abs(dnpv) < 1e-14: break
        r_new = r - npv / dnpv
        if abs(r_new - r) < tol: return r_new * 100
        r = r_new
    return r * 100

def calc_npv(rate, cashflows):
    return sum(cf / (1 + rate / 100)**t for t, cf in enumerate(cashflows))

# ─────────────────────────── tenant data ───────────────────────────
DEFAULT_TENANTS = pd.DataFrame({
    "Unit":       ["1","2A","2B","4","5","6","7","8","9","13","11","12"],
    "GLA_m2":     [63, 36, 52, 25, 25, 26, 26, 37, 114, 134, 37, 37],
    "Gross_Monthly_Incl_VAT": [4752,4000,4000,3016.83,1750,1386.47,1446,4244.63,0,12468.82,0,1605],
    "VAT":        [619.83,521.74,521.74,393.50,228.26,180.84,188.61,553.65,0,1626.37,0,209.35],
    "Excl_VAT":   [4132.17,3478.26,3478.26,2623.33,1521.74,1205.63,1257.39,3690.98,0,10842.45,0,1395.65],
    "Agent_Fee":  [413.22,347.83,347.83,262.33,152.17,120.56,125.74,369.10,0,1084.25,0,139.57],
    "Net_Monthly":[3718.96,3130.43,3130.43,2361.00,1369.57,1085.06,1131.65,3321.88,0,9758.21,0,1256.09],
    "Escalation_Pct": [10,8,8,7,8,7,7,8,0,8,0,7],
    "Vacant":     [False,False,False,False,False,False,False,False,True,False,True,False],
    "Potential_Gross": [4752,4000,4000,3016.83,1750,1386.47,1446,4244.63,9500,12468.82,5000,1605],
    "Electricity":[831.20,0,0,640.67,0,784.60,448.30,830.00,0,1411.00,0,0],
    "Renewal":    ["30-Jul-26","30-Dec-26","30-Dec-26","31-Mar-26","28-Feb-26",
                   "31-Oct-26","30-Sep-26","31-Oct-26","VACANT","31-Aug-26","VACANT","31-Oct-26"],
})

# ═══════════════════════════ SIDEBAR ═══════════════════════════════
st.sidebar.markdown("# 🏢 Die Bars")
st.sidebar.markdown("### Bredasdorp Investment Valuation")
st.sidebar.markdown("---")

st.sidebar.markdown("## 🔧 Scenario Settings")
scenario_name = st.sidebar.text_input("Scenario Name", "Base Case")

st.sidebar.markdown("### 💰 Purchase & Financing")
asking_price = st.sidebar.number_input("Asking Price (R)", value=3_500_000, step=100_000, format="%d")
purchase_price = st.sidebar.number_input("Expected Purchase Price (R)", value=3_000_000, step=100_000, format="%d")
cash_pct = st.sidebar.slider("Cash Deposit (%)", 0, 100, 0, 5)
bond_pct = 100 - cash_pct
prime_rate = st.sidebar.number_input("Prime Lending Rate (%)", value=10.25, step=0.25, format="%.2f")
bond_spread = st.sidebar.number_input("Bond Rate Spread vs Prime (%)", value=0.0, step=0.25, format="%.2f",
                                       help="Your actual bond rate = prime + spread. Negative = below prime.")
bond_rate = prime_rate + bond_spread
bond_term_years = st.sidebar.slider("Bond Term (years)", 5, 30, 20)
holding_period = st.sidebar.slider("Holding Period (years)", 1, 30, 10)

st.sidebar.markdown("### 📈 Growth Assumptions")
rental_escalation = st.sidebar.number_input("Default Rental Escalation (%/yr)", value=8.0, step=0.5,
                                             help="Used as weighted average; individual tenant escalations also modelled")
expense_escalation = st.sidebar.number_input("Expense Escalation (%/yr)", value=6.0, step=0.5)
cap_rate_purchase = st.sidebar.number_input("Purchase Cap Rate Override (%)", value=0.0, step=0.5,
                                             help="Leave 0 to auto-calculate from actual NOI & price")
exit_cap_rate = st.sidebar.number_input("Exit Cap Rate (%)", value=10.0, step=0.5)

st.sidebar.markdown("### 🏗️ Vacancy & Capex")
structural_vacancy = st.sidebar.slider("Structural Vacancy Allowance (%)", 0, 30, 5,
                                        help="Additional vacancy buffer beyond current vacancies")
capex_initial = st.sidebar.number_input("Initial Capex / Improvements (R)", value=0, step=50_000, format="%d")
capex_annual = st.sidebar.number_input("Annual Maintenance Capex (R)", value=0, step=10_000, format="%d")

st.sidebar.markdown("### 🏛️ Operating Expenses (Monthly)")
monthly_rates = st.sidebar.number_input("Municipal Rates (R/month)", value=2_319, step=100, format="%d")
monthly_insurance = st.sidebar.number_input("Insurance (R/month)", value=1_075, step=50, format="%d")
monthly_other_opex = st.sidebar.number_input("Other Opex (R/month) — security, maintenance, etc.", value=0, step=100, format="%d")
management_fee_pct = st.sidebar.number_input("Management/Agent Fee (%)", value=10.0, step=0.5,
                                              help="As a % of gross rental income excl VAT")

st.sidebar.markdown("### 💹 Discount Rate")
discount_rate = st.sidebar.number_input("Discount Rate for NPV (%)", value=14.0, step=0.5,
                                         help="Opportunity cost / required return")

# ═══════════════════════════ CALCULATIONS ══════════════════════════
# --- Purchase costs ---
cash_deposit = purchase_price * cash_pct / 100
bond_amount = purchase_price * bond_pct / 100
transfer_duty = calc_transfer_duty(purchase_price)
# Estimate transfer & bond reg costs
transfer_cost_est = purchase_price * 0.015  # ~1.5%
bond_reg_cost_est = bond_amount * 0.012 if bond_amount > 0 else 0  # ~1.2%
total_acquisition = purchase_price + transfer_duty + transfer_cost_est + bond_reg_cost_est + capex_initial
equity_invested = cash_deposit + transfer_duty + transfer_cost_est + bond_reg_cost_est + capex_initial

monthly_bond_repayment = calc_bond_repayment(bond_amount, bond_rate, bond_term_years)

# --- Income ---
tenants = DEFAULT_TENANTS.copy()
current_gross_monthly_excl_vat = tenants.loc[~tenants["Vacant"], "Excl_VAT"].sum()
potential_gross_monthly_incl_vat = tenants["Potential_Gross"].sum()
current_gross_monthly_incl_vat = tenants.loc[~tenants["Vacant"], "Gross_Monthly_Incl_VAT"].sum()
current_net_monthly = tenants.loc[~tenants["Vacant"], "Net_Monthly"].sum()
total_gla = tenants["GLA_m2"].sum()
vacant_gla = tenants.loc[tenants["Vacant"], "GLA_m2"].sum()
occupied_gla = total_gla - vacant_gla
vacancy_rate_actual = vacant_gla / total_gla * 100

# Annual figures (Year 1)
annual_gross_income_excl_vat = current_gross_monthly_excl_vat * 12
structural_vacancy_deduction = annual_gross_income_excl_vat * structural_vacancy / 100
effective_gross_income = annual_gross_income_excl_vat - structural_vacancy_deduction

# Operating expenses (annual, owner-borne)
annual_rates = monthly_rates * 12
annual_insurance = monthly_insurance * 12
annual_management_fee = effective_gross_income * management_fee_pct / 100
annual_other_opex = monthly_other_opex * 12
total_annual_opex = annual_rates + annual_insurance + annual_management_fee + annual_other_opex + capex_annual

# NOI
noi_year1 = effective_gross_income - total_annual_opex

# Cap rate (actual)
actual_cap_rate = noi_year1 / purchase_price * 100 if purchase_price > 0 else 0
cap_rate_used = cap_rate_purchase if cap_rate_purchase > 0 else actual_cap_rate

# Income capitalisation value
income_cap_value = noi_year1 / (cap_rate_used / 100) if cap_rate_used > 0 else 0

# Yields
gross_yield = (current_gross_monthly_excl_vat * 12) / purchase_price * 100
net_yield = noi_year1 / purchase_price * 100

# Monthly cashflow
monthly_noi = noi_year1 / 12
monthly_cashflow = monthly_noi - monthly_bond_repayment
annual_cashflow_yr1 = monthly_cashflow * 12

# Cash on cash return
cash_on_cash = annual_cashflow_yr1 / equity_invested * 100 if equity_invested > 0 else 0

# DSCR
dscr = (noi_year1 / (monthly_bond_repayment * 12)) if monthly_bond_repayment > 0 else float('inf')

# ─── DCF projection ───
projection_years = holding_period
annual_cashflows = []  # after debt service
annual_noi_list = []
annual_income_list = []
annual_opex_list = []
annual_debt_service = monthly_bond_repayment * 12

curr_income = effective_gross_income
curr_opex_base = annual_rates + annual_insurance + annual_other_opex + capex_annual

for yr in range(1, projection_years + 1):
    if yr > 1:
        curr_income *= (1 + rental_escalation / 100)
    mgmt_fee = curr_income * management_fee_pct / 100
    if yr > 1:
        curr_opex_base *= (1 + expense_escalation / 100)
    total_opex = curr_opex_base + mgmt_fee
    noi = curr_income - total_opex
    cf_after_debt = noi - annual_debt_service
    annual_income_list.append(curr_income)
    annual_opex_list.append(total_opex)
    annual_noi_list.append(noi)
    annual_cashflows.append(cf_after_debt)

# Exit / terminal value
terminal_noi = annual_noi_list[-1] * (1 + rental_escalation / 100)
exit_value = terminal_noi / (exit_cap_rate / 100) if exit_cap_rate > 0 else 0

# Outstanding bond at exit
# Simple approximation using amortisation
outstanding_bond = bond_amount
r_m = bond_rate / 100 / 12
for m in range(holding_period * 12):
    interest = outstanding_bond * r_m
    principal_payment = monthly_bond_repayment - interest
    outstanding_bond = max(0, outstanding_bond - principal_payment)

net_exit_proceeds = exit_value - outstanding_bond

# CGT estimate (company rate ~21.6% effective = 80% inclusion * 27% tax)
capital_gain = exit_value - purchase_price
cgt_inclusion = 0.80
cgt_rate = 0.27
cgt = max(0, capital_gain * cgt_inclusion * cgt_rate)
net_exit_after_cgt = net_exit_proceeds - cgt

# IRR cashflows: equity out at year 0, annual CF, exit at final year
irr_cashflows = [-equity_invested] + annual_cashflows[:-1] + [annual_cashflows[-1] + net_exit_after_cgt]
irr = _irr_newton(irr_cashflows)
npv = calc_npv(discount_rate, irr_cashflows)

# Equity multiple
total_distributions = sum(annual_cashflows) + net_exit_after_cgt
equity_multiple = total_distributions / equity_invested if equity_invested > 0 else 0

# ═══════════════════════════ MAIN PAGE ═════════════════════════════
st.markdown(f"# 🏢 Die Bars — Commercial Property Investment Analysis")
st.markdown(f"**Scenario: {scenario_name}** | Kerkstraat 9, Bredasdorp | Cape Agulhas Municipality")
st.markdown("---")

# ─── Top KPI Cards ───
c1, c2, c3, c4, c5, c6 = st.columns(6)
with c1:
    tl = traffic(net_yield, 9, 7)
    st.markdown(f'<div class="metric-card {"green" if net_yield>=9 else "amber" if net_yield>=7 else "red"}"><h3>Net Yield {tl}</h3><h2>{pct(net_yield)}</h2></div>', unsafe_allow_html=True)
with c2:
    tl = traffic(irr, 18, 12)
    st.markdown(f'<div class="metric-card {"green" if irr>=18 else "amber" if irr>=12 else "red"}"><h3>IRR {tl}</h3><h2>{pct(irr)}</h2></div>', unsafe_allow_html=True)
with c3:
    tl = traffic(cash_on_cash, 10, 5)
    st.markdown(f'<div class="metric-card {"green" if cash_on_cash>=10 else "amber" if cash_on_cash>=5 else "red"}"><h3>Cash-on-Cash {tl}</h3><h2>{pct(cash_on_cash)}</h2></div>', unsafe_allow_html=True)
with c4:
    tl = traffic(dscr, 1.3, 1.0)
    st.markdown(f'<div class="metric-card {"green" if dscr>=1.3 else "amber" if dscr>=1.0 else "red"}"><h3>DSCR {tl}</h3><h2>{dscr:.2f}x</h2></div>', unsafe_allow_html=True)
with c5:
    st.markdown(f'<div class="metric-card blue"><h3>Monthly Cashflow</h3><h2>{fmt(monthly_cashflow)}</h2></div>', unsafe_allow_html=True)
with c6:
    st.markdown(f'<div class="metric-card blue"><h3>NPV @ {pct(discount_rate,0)}</h3><h2>{fmt(npv)}</h2></div>', unsafe_allow_html=True)

st.markdown("")

# ═══════════════════════════ TABS ══════════════════════════════════
tab1, tab2, tab3, tab4, tab5, tab6, tab7 = st.tabs([
    "📋 Property Overview", "💰 Income & Tenants", "📊 Valuation",
    "🏦 Finance & Cashflow", "📈 DCF Projection", "🔄 Scenario Comparison", "⚠️ Sensitivity"
])

# ─────────────── TAB 1: Property Overview ──────────────────────────
with tab1:
    st.markdown("## 🏢 Property Overview — Die Bars")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("### Property Details")
        overview_data = {
            "Property Name": "Die Bars",
            "Address": "Kerkstraat 9, Bredasdorp",
            "Municipality": "Cape Agulhas",
            "Erf Size": "1,172 m² (0.1172 ha)",
            "Total GLA": f"{total_gla} m²",
            "Total Units": "13",
            "Occupied Units": f"{(~tenants['Vacant']).sum()}",
            "Vacant Units": f"{tenants['Vacant'].sum()} (Units 9 & 11)",
            "Vacancy (by GLA)": pct(vacancy_rate_actual),
            "Municipal Valuation": fmt(2_900_000),
        }
        st.table(pd.DataFrame(overview_data.items(), columns=["Detail", "Value"]).set_index("Detail"))

    with col2:
        st.markdown("### Acquisition Summary")
        acq_data = {
            "Asking Price": fmt(asking_price),
            "Expected Purchase Price": fmt(purchase_price),
            "Discount to Asking": pct((asking_price - purchase_price) / asking_price * 100),
            "Transfer Duty": fmt(transfer_duty),
            "Transfer Costs (est.)": fmt(transfer_cost_est),
            "Bond Registration (est.)": fmt(bond_reg_cost_est),
            "Initial Capex": fmt(capex_initial),
            "Total Acquisition Cost": fmt(total_acquisition),
            "Cash Deposit": f"{fmt(cash_deposit)} ({cash_pct}%)",
            "Bond Amount": f"{fmt(bond_amount)} ({bond_pct}%)",
            "Total Equity Required": fmt(equity_invested),
        }
        st.table(pd.DataFrame(acq_data.items(), columns=["Detail", "Value"]).set_index("Detail"))

    # GLA breakdown chart
    st.markdown("### 📐 Unit Size Distribution")
    fig_gla = px.bar(tenants, x="Unit", y="GLA_m2", color="Vacant",
                      color_discrete_map={True: "#e94560", False: "#00b894"},
                      labels={"GLA_m2": "GLA (m²)", "Vacant": "Vacant?"},
                      title="GLA per Unit")
    fig_gla.update_layout(template="plotly_dark", height=350)
    st.plotly_chart(fig_gla, use_container_width=True)

# ─────────────── TAB 2: Income & Tenants ───────────────────────────
with tab2:
    st.markdown("## 💰 Tenant Schedule & Income Analysis")

    display_tenants = tenants[["Unit","GLA_m2","Gross_Monthly_Incl_VAT","Excl_VAT","Agent_Fee",
                                "Net_Monthly","Escalation_Pct","Vacant","Renewal"]].copy()
    display_tenants.columns = ["Unit","GLA (m²)","Gross (incl VAT)","Excl VAT","Agent Fee",
                                "Net Monthly","Escalation %","Vacant","Lease Renewal"]

    for col in ["Gross (incl VAT)","Excl VAT","Agent Fee","Net Monthly"]:
        display_tenants[col] = display_tenants[col].apply(lambda x: fmt(x, decimals=2))

    st.dataframe(display_tenants, use_container_width=True, hide_index=True)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Current Monthly Gross (excl VAT)", fmt(current_gross_monthly_excl_vat))
        st.metric("Current Monthly Net (after agent fee)", fmt(current_net_monthly))
    with col2:
        st.metric("Annual Gross Income (excl VAT)", fmt(annual_gross_income_excl_vat))
        st.metric("Structural Vacancy Deduction", fmt(structural_vacancy_deduction))
    with col3:
        st.metric("Effective Gross Income", fmt(effective_gross_income))
        st.metric("Avg Rent / m² (occupied)", fmt(current_gross_monthly_excl_vat / occupied_gla if occupied_gla else 0, decimals=2) + "/m²")

    # Rental income pie
    fig_rent = px.pie(tenants[~tenants["Vacant"]], values="Net_Monthly", names="Unit",
                       title="Net Monthly Income by Unit", hole=0.4)
    fig_rent.update_layout(template="plotly_dark", height=400)
    st.plotly_chart(fig_rent, use_container_width=True)

    # WALE
    st.markdown("### 📅 Weighted Average Lease Expiry (WALE)")
    st.info("All current leases are 1-year contracts (except Unit 13 which is 2-year). "
            "Most leases renew between Feb–Dec 2026. WALE is approximately **0.7–1.0 years** — "
            "this is typical for small retail but represents a **lease expiry risk** that the cap rate should compensate for.")

# ─────────────── TAB 3: Valuation ─────────────────────────────────
with tab3:
    st.markdown("## 📊 Property Valuation")

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("### Income Capitalisation Method")
        val_data = {
            "Effective Gross Income": fmt(effective_gross_income),
            "Less: Total Operating Expenses": fmt(total_annual_opex),
            "  → Rates & Taxes": fmt(annual_rates),
            "  → Insurance": fmt(annual_insurance),
            "  → Management Fee": fmt(annual_management_fee),
            "  → Other Opex": fmt(annual_other_opex),
            "  → Annual Capex": fmt(capex_annual),
            "= Net Operating Income (NOI)": fmt(noi_year1),
            "Cap Rate (actual on price)": pct(actual_cap_rate),
            "": "",
            "Income Cap Value (at actual cap)": fmt(income_cap_value),
            "Purchase Price": fmt(purchase_price),
            "Value vs Price": fmt(income_cap_value - purchase_price),
        }
        st.table(pd.DataFrame(val_data.items(), columns=["Item", "Amount"]).set_index("Item"))

    with col2:
        st.markdown("### Key Yields & Returns")
        yields = {
            "Gross Yield": pct(gross_yield),
            "Net Yield (Cap Rate)": pct(net_yield),
            "Cash-on-Cash Return (Yr 1)": pct(cash_on_cash),
            "Monthly Cashflow (after bond)": fmt(monthly_cashflow),
            "Annual Cashflow (after bond)": fmt(annual_cashflow_yr1),
            "DSCR": f"{dscr:.2f}x",
            "IRR (over holding period)": pct(irr),
            "Equity Multiple": f"{equity_multiple:.2f}x",
            "NPV @ {:.0f}%".format(discount_rate): fmt(npv),
        }
        st.table(pd.DataFrame(yields.items(), columns=["Metric", "Value"]).set_index("Metric"))

        # Traffic light summary
        st.markdown("### 🚦 Deal Health Check")
        checks = [
            ("Net Yield", net_yield, "≥9% 🟢 | ≥7% 🟡 | <7% 🔴", traffic(net_yield, 9, 7)),
            ("DSCR", dscr, "≥1.3x 🟢 | ≥1.0x 🟡 | <1.0x 🔴", traffic(dscr, 1.3, 1.0)),
            ("Cash-on-Cash", cash_on_cash, ">10% 🟢 | >5% 🟡 | <5% 🔴", traffic(cash_on_cash, 10, 5)),
            ("IRR", irr, ">18% 🟢 | >12% 🟡 | <12% 🔴", traffic(irr, 18, 12)),
            ("Vacancy", vacancy_rate_actual, "≤5% 🟢 | ≤15% 🟡 | >15% 🔴", traffic(vacancy_rate_actual, 5, 15, invert=True)),
        ]
        for name, val, rule, light in checks:
            st.markdown(f"**{light} {name}:** {val:.2f} — _{rule}_")

    # Valuation range chart
    st.markdown("### 📊 Valuation Range")
    cap_rates_range = [8, 9, 10, 11, 12, 13, 14]
    vals = [noi_year1 / (cr/100) for cr in cap_rates_range]
    fig_val = go.Figure()
    fig_val.add_trace(go.Bar(x=[f"{cr}%" for cr in cap_rates_range], y=vals,
                              marker_color=["#00b894" if v > purchase_price else "#e94560" for v in vals]))
    fig_val.add_hline(y=purchase_price, line_dash="dash", line_color="white",
                       annotation_text=f"Purchase Price {fmt(purchase_price)}")
    fig_val.update_layout(title="Property Value at Different Cap Rates",
                           yaxis_title="Value (R)", template="plotly_dark", height=400)
    st.plotly_chart(fig_val, use_container_width=True)

# ─────────────── TAB 4: Finance & Cashflow ─────────────────────────
with tab4:
    st.markdown("## 🏦 Finance Structure & Monthly Cashflow")
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### Bond Details")
        bond_data = {
            "Purchase Price": fmt(purchase_price),
            "Cash Deposit": f"{fmt(cash_deposit)} ({cash_pct}%)",
            "Bond Amount": f"{fmt(bond_amount)} ({bond_pct}%)",
            "Bond Interest Rate": f"{pct(bond_rate)} (Prime {pct(prime_rate)} + {pct(bond_spread,2)})",
            "Bond Term": f"{bond_term_years} years",
            "Monthly Repayment": fmt(monthly_bond_repayment),
            "Annual Debt Service": fmt(monthly_bond_repayment * 12),
            "Total Interest Over Term": fmt(monthly_bond_repayment * bond_term_years * 12 - bond_amount),
        }
        st.table(pd.DataFrame(bond_data.items(), columns=["Detail", "Value"]).set_index("Detail"))

    with col2:
        st.markdown("### Monthly Cashflow Waterfall")
        waterfall_items = ["Gross Income", "Vacancy", "Mgmt Fee", "Rates", "Insurance", "Other Opex", "Bond", "NET CASHFLOW"]
        waterfall_vals = [
            current_gross_monthly_excl_vat,
            -structural_vacancy_deduction/12,
            -annual_management_fee/12,
            -monthly_rates,
            -monthly_insurance,
            -monthly_other_opex,
            -monthly_bond_repayment,
            monthly_cashflow
        ]
        waterfall_measures = ["absolute","relative","relative","relative","relative","relative","relative","total"]
        fig_wf = go.Figure(go.Waterfall(
            x=waterfall_items, y=waterfall_vals, measure=waterfall_measures,
            connector={"line":{"color":"rgba(255,255,255,0.3)"}},
            increasing={"marker":{"color":"#00b894"}},
            decreasing={"marker":{"color":"#e94560"}},
            totals={"marker":{"color":"#0984e3"}},
            text=[fmt(abs(v)) for v in waterfall_vals],
            textposition="outside"
        ))
        fig_wf.update_layout(title="Monthly Cashflow Waterfall", template="plotly_dark", height=450,
                              yaxis_title="R per month", showlegend=False)
        st.plotly_chart(fig_wf, use_container_width=True)

    # Bond amortisation
    st.markdown("### 📉 Bond Amortisation Schedule")
    bal = bond_amount
    amort_data = []
    for yr in range(1, min(bond_term_years, holding_period) + 1):
        yr_interest = 0
        yr_principal = 0
        for m in range(12):
            interest = bal * r_m
            princ = monthly_bond_repayment - interest
            yr_interest += interest
            yr_principal += princ
            bal = max(0, bal - princ)
        amort_data.append({"Year": yr, "Opening Balance": bal + yr_principal,
                           "Interest": yr_interest, "Principal": yr_principal,
                           "Closing Balance": bal})
    amort_df = pd.DataFrame(amort_data)
    fig_amort = go.Figure()
    fig_amort.add_trace(go.Bar(name="Interest", x=amort_df["Year"], y=amort_df["Interest"], marker_color="#e94560"))
    fig_amort.add_trace(go.Bar(name="Principal", x=amort_df["Year"], y=amort_df["Principal"], marker_color="#00b894"))
    fig_amort.add_trace(go.Scatter(name="Balance", x=amort_df["Year"], y=amort_df["Closing Balance"],
                                    line=dict(color="white", width=2), yaxis="y2"))
    fig_amort.update_layout(barmode="stack", template="plotly_dark", height=400,
                             title="Annual Bond Amortisation",
                             yaxis=dict(title="Annual Payment (R)"),
                             yaxis2=dict(title="Outstanding Balance (R)", overlaying="y", side="right"),
                             legend=dict(x=0.7, y=1))
    st.plotly_chart(fig_amort, use_container_width=True)

# ─────────────── TAB 5: DCF Projection ────────────────────────────
with tab5:
    st.markdown("## 📈 DCF Projection & Exit Analysis")

    proj_df = pd.DataFrame({
        "Year": list(range(1, projection_years + 1)),
        "Gross Income": annual_income_list,
        "Operating Expenses": annual_opex_list,
        "NOI": annual_noi_list,
        "Debt Service": [annual_debt_service] * projection_years,
        "Cashflow After Debt": annual_cashflows,
    })

    # Chart
    fig_proj = make_subplots(specs=[[{"secondary_y": True}]])
    fig_proj.add_trace(go.Bar(name="NOI", x=proj_df["Year"], y=proj_df["NOI"], marker_color="#00b894"), secondary_y=False)
    fig_proj.add_trace(go.Bar(name="Opex", x=proj_df["Year"], y=proj_df["Operating Expenses"], marker_color="#e94560"), secondary_y=False)
    fig_proj.add_trace(go.Scatter(name="Cashflow After Debt", x=proj_df["Year"], y=proj_df["Cashflow After Debt"],
                                   line=dict(color="#0984e3", width=3)), secondary_y=False)
    fig_proj.add_trace(go.Scatter(name="Debt Service", x=proj_df["Year"], y=proj_df["Debt Service"],
                                   line=dict(color="white", dash="dash", width=2)), secondary_y=False)
    fig_proj.update_layout(template="plotly_dark", height=450, barmode="group",
                            title=f"{projection_years}-Year Income & Cashflow Projection")
    fig_proj.update_yaxes(title_text="R per annum", secondary_y=False)
    st.plotly_chart(fig_proj, use_container_width=True)

    # Table
    display_proj = proj_df.copy()
    for col in ["Gross Income","Operating Expenses","NOI","Debt Service","Cashflow After Debt"]:
        display_proj[col] = display_proj[col].apply(lambda x: fmt(x))
    st.dataframe(display_proj, use_container_width=True, hide_index=True)

    # Exit analysis
    st.markdown("### 🚪 Exit Analysis")
    col1, col2 = st.columns(2)
    with col1:
        exit_data = {
            f"Terminal NOI (Year {projection_years+1})": fmt(terminal_noi),
            "Exit Cap Rate": pct(exit_cap_rate),
            "Exit / Sale Value": fmt(exit_value),
            "Outstanding Bond at Exit": fmt(outstanding_bond),
            "Gross Equity Proceeds": fmt(net_exit_proceeds),
            "Capital Gain": fmt(capital_gain),
            "CGT Estimate (company)": fmt(cgt),
            "Net Equity After CGT": fmt(net_exit_after_cgt),
        }
        st.table(pd.DataFrame(exit_data.items(), columns=["Item", "Value"]).set_index("Item"))

    with col2:
        st.markdown("### 📊 Return Summary")
        return_data = {
            "Total Equity Invested": fmt(equity_invested),
            f"Total Cashflow ({projection_years} yrs)": fmt(sum(annual_cashflows)),
            "Net Exit Proceeds (after CGT)": fmt(net_exit_after_cgt),
            "Total Return": fmt(total_distributions),
            "Equity Multiple": f"{equity_multiple:.2f}x",
            "IRR": pct(irr),
            f"NPV @ {pct(discount_rate,0)}": fmt(npv),
        }
        st.table(pd.DataFrame(return_data.items(), columns=["Metric", "Value"]).set_index("Metric"))

# ─────────────── TAB 6: Scenario Comparison ────────────────────────
with tab6:
    st.markdown("## 🔄 Multi-Scenario Comparison")
    st.markdown("Compare different financing structures and assumptions side-by-side.")

    scenarios = {
        "100% Bond": {"cash_pct": 0},
        "80/20 Split": {"cash_pct": 20},
        "50/50 Split": {"cash_pct": 50},
        "Cash Purchase": {"cash_pct": 100},
    }

    results = []
    for sname, params in scenarios.items():
        cp = params["cash_pct"]
        bp = 100 - cp
        cd = purchase_price * cp / 100
        ba = purchase_price * bp / 100
        td = transfer_duty
        tc = transfer_cost_est
        brc = ba * 0.012 if ba > 0 else 0
        eq = cd + td + tc + brc + capex_initial
        mbr = calc_bond_repayment(ba, bond_rate, bond_term_years)
        ann_ds = mbr * 12
        mcf = monthly_noi - mbr
        acf = mcf * 12
        coc = acf / eq * 100 if eq > 0 else 0
        d = noi_year1 / ann_ds if ann_ds > 0 else float('inf')

        # Quick IRR
        cfs_scenario = [-eq]
        ci = effective_gross_income
        co = curr_opex_base
        for yr in range(1, projection_years + 1):
            if yr > 1: ci *= (1 + rental_escalation / 100)
            mf = ci * management_fee_pct / 100
            if yr > 1: co *= (1 + expense_escalation / 100)
            n = ci - co - mf
            cfs_scenario.append(n - ann_ds)
        # exit
        tn = (ci * (1 + rental_escalation / 100))
        ev = tn / (exit_cap_rate / 100) if exit_cap_rate > 0 else 0
        ob = ba
        for m in range(holding_period * 12):
            interest = ob * r_m
            pp = mbr - interest
            ob = max(0, ob - pp)
        cg = ev - purchase_price
        cgt_s = max(0, cg * 0.8 * 0.27)
        nep = ev - ob - cgt_s
        cfs_scenario[-1] += nep
        s_irr = _irr_newton(cfs_scenario)
        s_npv = calc_npv(discount_rate, cfs_scenario)
        s_em = (sum(cfs_scenario[1:]) ) / eq if eq > 0 else 0

        results.append({
            "Scenario": sname,
            "Equity Required": fmt(eq),
            "Monthly Bond": fmt(mbr),
            "Monthly Cashflow": fmt(mcf),
            "Cash-on-Cash": pct(coc),
            "DSCR": f"{d:.2f}x" if d < 100 else "N/A",
            "IRR": pct(s_irr),
            "NPV": fmt(s_npv),
            "Equity Multiple": f"{s_em:.2f}x",
        })

    results_df = pd.DataFrame(results).set_index("Scenario")
    st.dataframe(results_df, use_container_width=True)

    # Visual comparison
    comp_metrics = []
    for sname, params in scenarios.items():
        cp = params["cash_pct"]
        bp = 100 - cp
        ba = purchase_price * bp / 100
        cd = purchase_price * cp / 100
        brc = ba * 0.012 if ba > 0 else 0
        eq = cd + transfer_duty + transfer_cost_est + brc + capex_initial
        mbr = calc_bond_repayment(ba, bond_rate, bond_term_years)
        mcf = monthly_noi - mbr
        acf = mcf * 12
        coc = acf / eq * 100 if eq > 0 else 0
        comp_metrics.append({"Scenario": sname, "Cash-on-Cash %": coc, "Monthly Cashflow": mcf})

    comp_df = pd.DataFrame(comp_metrics)
    fig_comp = make_subplots(specs=[[{"secondary_y": True}]])
    fig_comp.add_trace(go.Bar(name="Monthly Cashflow", x=comp_df["Scenario"], y=comp_df["Monthly Cashflow"],
                               marker_color="#0984e3"), secondary_y=False)
    fig_comp.add_trace(go.Scatter(name="Cash-on-Cash %", x=comp_df["Scenario"], y=comp_df["Cash-on-Cash %"],
                                   mode="lines+markers", line=dict(color="#e94560", width=3),
                                   marker=dict(size=10)), secondary_y=True)
    fig_comp.update_layout(template="plotly_dark", height=400, title="Financing Scenario Comparison")
    fig_comp.update_yaxes(title_text="Monthly Cashflow (R)", secondary_y=False)
    fig_comp.update_yaxes(title_text="Cash-on-Cash Return (%)", secondary_y=True)
    st.plotly_chart(fig_comp, use_container_width=True)

    # Deal killer alerts
    st.markdown("### ⚠️ Deal Killer Alerts")
    for r in results:
        issues = []
        # parse monthly cashflow
        mcf_val = float(r["Monthly Cashflow"].replace("R","").replace(",",""))
        if mcf_val < 0:
            issues.append(f"❌ **Negative monthly cashflow**: {r['Monthly Cashflow']}")
        dscr_val = float(r["DSCR"].replace("x","")) if r["DSCR"] != "N/A" else 999
        if dscr_val < 1.0:
            issues.append(f"❌ **DSCR below 1.0**: {r['DSCR']} — income doesn't cover debt")
        if issues:
            st.warning(f"**{r['Scenario']}**: " + " | ".join(issues))
        else:
            st.success(f"**{r['Scenario']}**: ✅ No deal killers detected")

# ─────────────── TAB 7: Sensitivity Analysis ──────────────────────
with tab7:
    st.markdown("## ⚠️ Sensitivity & Break-Even Analysis")

    # Tornado diagram - which variable has biggest impact?
    st.markdown("### 🌪️ Tornado Diagram — Impact on IRR")

    base_irr = irr
    sensitivities = []

    # Vary each parameter ±20% and measure IRR impact
    def calc_scenario_irr(pp=purchase_price, re=rental_escalation, ee=expense_escalation,
                           ecr=exit_cap_rate, sv=structural_vacancy, br=bond_rate, cp=cash_pct):
        bp2 = 100 - cp
        cd2 = pp * cp / 100
        ba2 = pp * bp2 / 100
        brc2 = ba2 * 0.012 if ba2 > 0 else 0
        eq2 = cd2 + calc_transfer_duty(pp) + pp * 0.015 + brc2 + capex_initial
        if eq2 <= 0: eq2 = 1

        egi2 = current_gross_monthly_excl_vat * 12 * (1 - sv / 100)
        mgmt2 = egi2 * management_fee_pct / 100
        opex_base2 = annual_rates + annual_insurance + annual_other_opex + capex_annual
        noi2 = egi2 - opex_base2 - mgmt2
        mbr2 = calc_bond_repayment(ba2, br, bond_term_years)
        ads2 = mbr2 * 12

        cfs2 = [-eq2]
        ci2 = egi2
        co2 = opex_base2
        for yr in range(1, projection_years + 1):
            if yr > 1: ci2 *= (1 + re / 100)
            mf2 = ci2 * management_fee_pct / 100
            if yr > 1: co2 *= (1 + ee / 100)
            n2 = ci2 - co2 - mf2
            cfs2.append(n2 - ads2)
        tn2 = ci2 * (1 + re / 100)
        ev2 = tn2 / (ecr / 100) if ecr > 0 else 0
        ob2 = ba2
        rm2 = br / 100 / 12
        for m in range(holding_period * 12):
            if ob2 <= 0: break
            i2 = ob2 * rm2
            p2 = mbr2 - i2
            ob2 = max(0, ob2 - p2)
        cg2 = ev2 - pp
        cgt2 = max(0, cg2 * 0.8 * 0.27)
        cfs2[-1] += (ev2 - ob2 - cgt2)
        return _irr_newton(cfs2)

    params_to_test = [
        ("Purchase Price", purchase_price, purchase_price * 0.85, purchase_price * 1.15, "pp"),
        ("Rental Escalation", rental_escalation, rental_escalation * 0.7, rental_escalation * 1.3, "re"),
        ("Expense Escalation", expense_escalation, expense_escalation * 0.7, expense_escalation * 1.3, "ee"),
        ("Exit Cap Rate", exit_cap_rate, exit_cap_rate * 0.8, exit_cap_rate * 1.2, "ecr"),
        ("Vacancy", structural_vacancy, max(0, structural_vacancy - 5), structural_vacancy + 10, "sv"),
        ("Bond Rate", bond_rate, bond_rate - 2, bond_rate + 2, "br"),
    ]

    tornado_data = []
    for name, base_val, low_val, high_val, param_key in params_to_test:
        kwargs_low = {param_key: low_val}
        kwargs_high = {param_key: high_val}
        irr_low = calc_scenario_irr(**kwargs_low)
        irr_high = calc_scenario_irr(**kwargs_high)
        tornado_data.append({
            "Variable": name,
            "Low": min(irr_low, irr_high),
            "High": max(irr_low, irr_high),
            "Spread": abs(irr_high - irr_low),
        })

    tornado_df = pd.DataFrame(tornado_data).sort_values("Spread")

    fig_tornado = go.Figure()
    for _, row in tornado_df.iterrows():
        fig_tornado.add_trace(go.Bar(
            y=[row["Variable"]], x=[row["High"] - row["Low"]],
            base=[row["Low"]], orientation="h",
            marker_color="#0984e3", text=f"{row['Low']:.1f}% → {row['High']:.1f}%",
            textposition="outside", showlegend=False
        ))
    fig_tornado.add_vline(x=base_irr, line_dash="dash", line_color="#e94560",
                           annotation_text=f"Base IRR: {pct(base_irr)}")
    fig_tornado.update_layout(template="plotly_dark", height=400, title="Sensitivity of IRR to Key Variables",
                               xaxis_title="IRR (%)")
    st.plotly_chart(fig_tornado, use_container_width=True)

    # Break-even analysis
    st.markdown("### 💔 Break-Even Analysis")
    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### At what vacancy does cashflow = 0?")
        vac_range = list(range(0, 61, 1))
        cfs_by_vac = []
        for v in vac_range:
            egi_v = current_gross_monthly_excl_vat * 12 * (1 - v / 100)
            mgmt_v = egi_v * management_fee_pct / 100
            opex_v = annual_rates + annual_insurance + annual_other_opex + capex_annual
            noi_v = egi_v - opex_v - mgmt_v
            cf_v = noi_v - annual_debt_service
            cfs_by_vac.append(cf_v / 12)

        fig_be_vac = go.Figure()
        fig_be_vac.add_trace(go.Scatter(x=vac_range, y=cfs_by_vac, mode="lines",
                                         line=dict(color="#0984e3", width=3), fill="tozeroy",
                                         fillcolor="rgba(9,132,227,0.2)"))
        fig_be_vac.add_hline(y=0, line_color="#e94560", line_dash="dash")
        fig_be_vac.update_layout(template="plotly_dark", height=350,
                                  title="Monthly Cashflow vs Vacancy Rate",
                                  xaxis_title="Vacancy Rate (%)", yaxis_title="Monthly Cashflow (R)")
        st.plotly_chart(fig_be_vac, use_container_width=True)

        # Find break-even vacancy
        for i, cf in enumerate(cfs_by_vac):
            if cf <= 0:
                st.error(f"⚠️ Break-even vacancy: **~{vac_range[i]}%** — above this, you're cash-flow negative")
                break

    with col2:
        st.markdown("#### At what interest rate does cashflow = 0?")
        rate_range = [r/100 for r in range(500, 2001, 25)]
        cfs_by_rate = []
        for rt in rate_range:
            mbr_r = calc_bond_repayment(bond_amount, rt, bond_term_years)
            cf_r = monthly_noi - mbr_r
            cfs_by_rate.append(cf_r)

        fig_be_rate = go.Figure()
        fig_be_rate.add_trace(go.Scatter(x=rate_range, y=cfs_by_rate, mode="lines",
                                          line=dict(color="#00b894", width=3), fill="tozeroy",
                                          fillcolor="rgba(0,184,148,0.2)"))
        fig_be_rate.add_hline(y=0, line_color="#e94560", line_dash="dash")
        fig_be_rate.add_vline(x=bond_rate, line_color="white", line_dash="dot",
                               annotation_text=f"Current: {pct(bond_rate)}")
        fig_be_rate.update_layout(template="plotly_dark", height=350,
                                   title="Monthly Cashflow vs Interest Rate",
                                   xaxis_title="Interest Rate (%)", yaxis_title="Monthly Cashflow (R)")
        st.plotly_chart(fig_be_rate, use_container_width=True)

        for i, cf in enumerate(cfs_by_rate):
            if cf <= 0:
                st.error(f"⚠️ Break-even interest rate: **~{pct(rate_range[i])}** — above this, you're cash-flow negative")
                break

    # Heat map: vacancy vs interest rate
    st.markdown("### 🗺️ Heat Map: Monthly Cashflow (Vacancy × Interest Rate)")
    vac_vals = list(range(0, 35, 5))
    rate_vals = [r/2 for r in range(14, 30)]  # 7% to 15%
    z_data = []
    for v in vac_vals:
        row = []
        for rt in rate_vals:
            egi_h = current_gross_monthly_excl_vat * 12 * (1 - v / 100)
            mgmt_h = egi_h * management_fee_pct / 100
            opex_h = annual_rates + annual_insurance + annual_other_opex + capex_annual
            noi_h = egi_h - opex_h - mgmt_h
            mbr_h = calc_bond_repayment(bond_amount, rt, bond_term_years)
            cf_h = noi_h / 12 - mbr_h
            row.append(cf_h)
        z_data.append(row)

    fig_heat = go.Figure(data=go.Heatmap(
        z=z_data, x=[f"{r:.1f}%" for r in rate_vals], y=[f"{v}%" for v in vac_vals],
        colorscale=[[0, "#e94560"], [0.5, "#fdcb6e"], [1, "#00b894"]],
        text=[[fmt(c) for c in row] for row in z_data], texttemplate="%{text}",
        colorbar=dict(title="R/month")
    ))
    fig_heat.update_layout(template="plotly_dark", height=450,
                            title="Monthly Cashflow: Vacancy Rate vs Interest Rate",
                            xaxis_title="Interest Rate", yaxis_title="Vacancy Rate")
    st.plotly_chart(fig_heat, use_container_width=True)

# ─── Footer ───
st.markdown("---")
st.markdown("*Built for Die Bars, Bredasdorp | Cape Agulhas Municipality | South Africa*")
st.markdown("*Disclaimer: This tool is for informational purposes only. Always consult a qualified property valuer and financial advisor before making investment decisions.*")
