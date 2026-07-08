"""
Moncho Analysts — Pricing Intelligence Engine
==============================================
Senior Analyst Pricing Metrics:
  1. Average Price by Country
  2. Price Index vs Asia Mean
  3. Bangladesh Premium / Discount %
  4. Competitor Undercut %
  5. Estimated Gross Margin Proxy
  6. Price Elasticity Simulation
"""

import pandas as pd
import numpy as np

# ─────────────────────────────────────────────
#  STEP 1 — SYNTHETIC DATA GENERATION
# ─────────────────────────────────────────────

def generate_data(seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)

    countries = [
        "Bangladesh", "India", "Indonesia",
        "Malaysia",   "Thailand", "Vietnam",
        "Philippines","Singapore"
    ]

    # Currency codes & approximate USD FX rates (Feb 2026 illustrative)
    currency_map = {
        "Bangladesh":  ("BDT", 110.0),
        "India":       ("INR",  83.0),
        "Indonesia":   ("IDR", 15_500.0),
        "Malaysia":    ("MYR",   4.7),
        "Thailand":    ("THB",  35.0),
        "Vietnam":     ("VND", 24_500.0),
        "Philippines": ("PHP",  56.0),
        "Singapore":   ("SGD",   1.35),
    }

    # Income multipliers relative to India baseline
    income_multiplier = {
        "Bangladesh":  0.95,
        "India":       1.00,
        "Indonesia":   1.05,
        "Malaysia":    1.15,
        "Thailand":    1.10,
        "Vietnam":     1.00,
        "Philippines": 1.05,
        "Singapore":   1.40,
    }

    brands     = ["LEGO", "Mattel", "Hasbro", "Bandai Namco", "Fisher-Price"]
    categories = ["Building Set", "Action Figure", "Doll", "RC Car", "STEM Kit"]
    skus       = [f"SKU_{i:03d}" for i in range(1, 21)]

    rows = []
    sku_id_counter = 1000

    for sku in skus:
        brand       = np.random.choice(brands)
        category    = np.random.choice(categories)
        base_cost   = np.random.uniform(5, 20)   # production cost in USD

        for country in countries:
            currency, fx_rate = currency_map[country]
            multiplier        = income_multiplier[country]

            usd_price         = round(base_cost * np.random.uniform(2.0, 3.5) * multiplier, 2)
            local_price       = round(usd_price * fx_rate, 2)
            competitor_price  = round(usd_price * np.random.uniform(0.88, 1.12), 2)
            import_duty       = round(np.random.uniform(5, 20), 2)          # %
            logistics_cost    = round(np.random.uniform(1, 5), 2)           # USD
            demand_index      = round(np.random.uniform(50, 150), 1)        # 0-200 scale
            discount_rate     = round(np.random.uniform(0, 0.20), 3)        # 0–20%

            rows.append({
                "sku_id":             f"SKU_{sku_id_counter}",
                "brand":              brand,
                "category":           category,
                "country":            country,
                "currency":           currency,
                "local_price":        local_price,
                "usd_price":          usd_price,
                "demand_index":       demand_index,
                "import_duty_estimate": import_duty,
                "logistics_cost":     logistics_cost,
                "competitor_price":   competitor_price,
                "discount_rate":      discount_rate,
                # internal — used for margin calc, not shown in raw schema
                "_base_cost_usd":     round(base_cost, 2),
            })
            sku_id_counter += 1

    df = pd.DataFrame(rows)
    return df


# ─────────────────────────────────────────────
#  STEP 2 — PRICING METRICS (Senior Analyst)
# ─────────────────────────────────────────────

def compute_metrics(df: pd.DataFrame) -> dict:
    results = {}

    # ── Effective (post-discount) USD selling price ────────────────────────
    df = df.copy()
    df["effective_usd_price"] = df["usd_price"] * (1 - df["discount_rate"])

    # ── 1. Average Price by Country ────────────────────────────────────────
    avg_by_country = (
        df.groupby("country")
          .agg(
              avg_usd_price    = ("usd_price",       "mean"),
              avg_local_price  = ("local_price",     "mean"),
              avg_discount_pct = ("discount_rate",   lambda x: x.mean() * 100),
              sku_count        = ("sku_id",          "count"),
          )
          .round(2)
          .sort_values("avg_usd_price", ascending=False)
          .reset_index()
    )
    results["avg_price_by_country"] = avg_by_country

    # ── 2. Price Index vs Asia Mean ────────────────────────────────────────
    asia_mean = df["usd_price"].mean()
    price_index = avg_by_country[["country","avg_usd_price"]].copy()
    price_index["asia_mean_usd"]  = round(asia_mean, 2)
    price_index["price_index"]    = (price_index["avg_usd_price"] / asia_mean * 100).round(1)
    price_index["index_vs_mean"]  = (price_index["price_index"] - 100).round(1)
    # Interpretation: >0 = above average, <0 = below average
    price_index["interpretation"] = price_index["index_vs_mean"].apply(
        lambda x: "🔴 Above Asia Avg" if x > 0 else "🟢 Below Asia Avg"
    )
    results["price_index_vs_asia_mean"] = price_index

    # ── 3. Bangladesh Premium / Discount % ────────────────────────────────
    bd_mean   = df.loc[df["country"] == "Bangladesh", "usd_price"].mean()
    bd_premium = price_index[["country","avg_usd_price"]].copy()
    bd_premium["bd_mean_usd"]      = round(bd_mean, 2)
    bd_premium["bd_premium_pct"]   = (
        (bd_premium["avg_usd_price"] - bd_mean) / bd_mean * 100
    ).round(2)
    bd_premium["bd_interpretation"] = bd_premium["bd_premium_pct"].apply(
        lambda x: f"{'🔺 Premium' if x >= 0 else '🔻 Discount'}: {abs(x):.1f}%"
    )
    results["bangladesh_premium_discount"] = bd_premium

    # ── 4. Competitor Undercut % ───────────────────────────────────────────
    df["undercut_pct"] = (
        (df["usd_price"] - df["competitor_price"]) / df["competitor_price"] * 100
    ).round(2)
    # Positive = we are MORE expensive than competitor (they undercut us)
    # Negative = we are CHEAPER than competitor (we undercut them)
    undercut = (
        df.groupby("country")
          .agg(
              avg_our_price        = ("usd_price",         "mean"),
              avg_competitor_price = ("competitor_price",  "mean"),
              avg_undercut_pct     = ("undercut_pct",      "mean"),
              pct_skus_undercut    = ("undercut_pct",      lambda x: (x > 0).mean() * 100),
          )
          .round(2)
          .reset_index()
    )
    undercut["undercut_signal"] = undercut["avg_undercut_pct"].apply(
        lambda x: "🚨 Competitor cheaper (risk)" if x > 2
        else ("✅ We are cheaper" if x < -2 else "➡️ Near parity")
    )
    results["competitor_undercut"] = undercut

    # ── 5. Estimated Gross Margin Proxy ────────────────────────────────────
    # Gross Margin = (Effective Price - Base Cost - Logistics - Duty Adj) / Effective Price
    df["duty_cost_usd"]   = df["_base_cost_usd"] * df["import_duty_estimate"] / 100
    df["total_cost_usd"]  = df["_base_cost_usd"] + df["logistics_cost"] + df["duty_cost_usd"]
    df["gross_margin_pct"] = (
        (df["effective_usd_price"] - df["total_cost_usd"])
        / df["effective_usd_price"] * 100
    ).round(2)

    margin_by_country = (
        df.groupby("country")
          .agg(
              avg_effective_price = ("effective_usd_price", "mean"),
              avg_total_cost      = ("total_cost_usd",      "mean"),
              avg_gross_margin_pct= ("gross_margin_pct",    "mean"),
              min_margin          = ("gross_margin_pct",    "min"),
              max_margin          = ("gross_margin_pct",    "max"),
          )
          .round(2)
          .reset_index()
          .sort_values("avg_gross_margin_pct", ascending=False)
    )
    margin_by_country["margin_health"] = margin_by_country["avg_gross_margin_pct"].apply(
        lambda x: "🟢 Healthy (>40%)" if x > 40
        else ("🟡 Moderate (25–40%)" if x >= 25 else "🔴 At Risk (<25%)")
    )
    results["gross_margin_proxy"] = margin_by_country

    # ── 5b. Brand & Category Positioning (by Country) ───────────────────────
    brand_pos = (
        df.groupby(["country", "brand"])
          .agg(
              avg_usd_price      = ("usd_price", "mean"),
              avg_gross_margin   = ("gross_margin_pct", "mean"),
              sku_count          = ("sku_id", "count"),
              revenue_proxy_usd  = ("effective_usd_price", lambda x: (x * df.loc[x.index, "demand_index"]).sum()),
          )
          .reset_index()
    )
    # Normalise revenue proxy for readability
    brand_pos["revenue_proxy_usd"] = (brand_pos["revenue_proxy_usd"] / 1_000).round(1)
    brand_pos["positioning"] = brand_pos.apply(
        lambda r: "Premium" if r["avg_usd_price"] > df["usd_price"].mean() and r["avg_gross_margin"] >= 40
        else ("Value" if r["avg_usd_price"] < df["usd_price"].mean() and r["avg_gross_margin"] < 30
              else "Mid / Balanced"),
        axis=1,
    )
    results["brand_positioning"] = brand_pos.round(2).sort_values(
        ["country", "avg_usd_price"], ascending=[True, False]
    )

    category_pos = (
        df.groupby(["country", "category"])
          .agg(
              avg_usd_price      = ("usd_price", "mean"),
              avg_gross_margin   = ("gross_margin_pct", "mean"),
              avg_demand_index   = ("demand_index", "mean"),
              revenue_proxy_usd  = ("effective_usd_price", lambda x: (x * df.loc[x.index, "demand_index"]).sum()),
          )
          .reset_index()
    )
    category_pos["revenue_proxy_usd"] = (category_pos["revenue_proxy_usd"] / 1_000).round(1)
    results["category_positioning"] = category_pos.round(2).sort_values(
        ["country", "avg_usd_price"], ascending=[True, False]
    )

    # ── 6. Price Elasticity Simulation ────────────────────────────────────
    # Simulated: % change in demand for a 10% price increase
    # Using: demand_index as proxy for baseline demand
    # Elasticity coefficient randomly assigned per category (realistic approximation)
    elasticity_map = {
        "Building Set":  -1.2,
        "Action Figure": -0.9,
        "Doll":          -1.0,
        "RC Car":        -1.5,
        "STEM Kit":      -0.7,
    }
    df["elasticity_coeff"]     = df["category"].map(elasticity_map)
    df["price_shock_pct"]      = 10.0   # simulate +10% price increase
    df["demand_change_pct"]    = df["elasticity_coeff"] * df["price_shock_pct"]
    df["new_demand_index"]     = (df["demand_index"] * (1 + df["demand_change_pct"] / 100)).round(1)
    df["revenue_impact_index"] = (
        (df["usd_price"] * 1.1 * df["new_demand_index"])
        / (df["usd_price"] * df["demand_index"]) * 100 - 100
    ).round(2)

    elasticity_summary = (
        df.groupby(["category", "country"])
          .agg(
              elasticity_coeff   = ("elasticity_coeff",    "first"),
              avg_demand_index   = ("demand_index",        "mean"),
              avg_new_demand     = ("new_demand_index",    "mean"),
              avg_demand_chg_pct = ("demand_change_pct",  "mean"),
              avg_revenue_impact = ("revenue_impact_index","mean"),
          )
          .round(2)
          .reset_index()
    )
    elasticity_summary["elasticity_verdict"] = elasticity_summary["elasticity_coeff"].apply(
        lambda e: "🔴 Elastic — price hike risky" if abs(e) > 1.0
        else "🟢 Inelastic — price hike tolerable"
    )
    results["price_elasticity"] = elasticity_summary

    # ── 6b. Competitive Pressure Score ──────────────────────────────────────
    competitive_pressure = (
        df.groupby("country")
          .agg(
              avg_undercut_pct    = ("undercut_pct", "mean"),
              pct_skus_undercut   = ("undercut_pct", lambda x: (x > 0).mean() * 100),
              pct_skus_heavily_undercut = ("undercut_pct", lambda x: (x > 5).mean() * 100),
          )
          .reset_index()
    )
    def pressure_bucket(row):
        score = 0
        if row["avg_undercut_pct"] > 0:
            score += 1
        if row["avg_undercut_pct"] > 3:
            score += 1
        if row["pct_skus_undercut"] > 50:
            score += 1
        if row["pct_skus_heavily_undercut"] > 25:
            score += 1
        if score >= 3:
            return "5 — Very High"
        if score == 2:
            return "4 — High"
        if score == 1:
            return "3 — Medium"
        return "1–2 — Low"

    competitive_pressure["pressure_band"] = competitive_pressure.apply(pressure_bucket, axis=1)
    results["competitive_pressure"] = competitive_pressure.round(2)

    # ── 7. Country Strategy View (Price vs Margin) ─────────────────────────
    country_view = margin_by_country.merge(
        price_index[["country", "price_index", "index_vs_mean"]],
        on="country",
        how="left",
    )
    def classify_strategy(row):
        high_margin = row["avg_gross_margin_pct"] >= 40
        low_margin = row["avg_gross_margin_pct"] < 25
        premium = row["index_vs_mean"] >= 5
        discount = row["index_vs_mean"] <= -5

        if high_margin and premium:
            return "💎 Premium stronghold — defend price, invest in brand"
        if high_margin and discount:
            return "🟢 Underpriced with strong margin — room to increase price"
        if low_margin and premium:
            return "🔴 High price, weak margin — urgent cost or price review"
        if low_margin and discount:
            return "🟠 Discounted & thin margin — tighten promo / mix"
        return "⚖️ Balanced — monitor, fine‑tune by SKU"

    country_view["strategy_recommendation"] = country_view.apply(classify_strategy, axis=1)
    results["country_strategy_view"] = country_view.sort_values(
        "avg_gross_margin_pct", ascending=False
    ).reset_index(drop=True)

    # ── 8. SKU‑level Opportunity & Risk Lists ──────────────────────────────
    opportunity_mask = (df["gross_margin_pct"] >= 40) & (df["undercut_pct"] <= -5)
    risk_mask = (df["gross_margin_pct"] <= 25) & (df["undercut_pct"] >= 5)

    cols = [
        "sku_id", "brand", "category", "country",
        "usd_price", "competitor_price",
        "undercut_pct", "gross_margin_pct",
        "demand_index",
    ]

    sku_promo_opportunities = (
        df.loc[opportunity_mask, cols]
          .sort_values(["undercut_pct", "gross_margin_pct"])
          .reset_index(drop=True)
    )
    sku_price_risks = (
        df.loc[risk_mask, cols]
          .sort_values(["undercut_pct", "gross_margin_pct"], ascending=[False, True])
          .reset_index(drop=True)
    )

    results["sku_promo_opportunities"] = sku_promo_opportunities
    results["sku_price_risks"] = sku_price_risks

    # ── Also return enriched df for downstream use ─────────────────────────
    results["enriched_df"] = df

    return results


# ─────────────────────────────────────────────
#  MAIN — PRINT REPORT
# ─────────────────────────────────────────────

def print_section(title: str, df: pd.DataFrame):
    width = 90
    print("\n" + "═" * width)
    print(f"  {title}")
    print("═" * width)
    print(df.to_string(index=False))
    print()

if __name__ == "__main__":
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 200)
    pd.set_option("display.float_format", "{:,.2f}".format)

    print("\n" + "▓" * 90)
    print("  MONCHO ANALYSTS — ASIA PRICING INTELLIGENCE REPORT")
    print("  Generated: February 2026  |  SKUs: 20  |  Markets: 8  |  Records: 160")
    print("▓" * 90)

    df   = generate_data()
    res  = compute_metrics(df)

    print_section("METRIC 1 — Average Price by Country (USD & Local Currency)",
                  res["avg_price_by_country"])

    print_section("METRIC 2 — Price Index vs Asia Mean (100 = Asia Average)",
                  res["price_index_vs_asia_mean"])

    print_section("METRIC 3 — Bangladesh Premium / Discount % vs Other Markets",
                  res["bangladesh_premium_discount"])

    print_section("METRIC 4 — Competitor Undercut Analysis",
                  res["competitor_undercut"])

    print_section("METRIC 5 — Estimated Gross Margin Proxy by Country",
                  res["gross_margin_proxy"])

    print_section("METRIC 6 — Price Elasticity Simulation (+10% Price Shock)",
                  res["price_elasticity"])

    # Brand & category positioning
    print_section("BRAND POSITIONING — Price, Margin & Revenue Proxy by Country",
                  res["brand_positioning"])
    print_section("CATEGORY POSITIONING — Price, Margin, Demand & Elasticity by Country",
                  res["category_positioning"])

    # Advanced Market Pricing Intelligence views
    print_section("STRATEGY VIEW — Country Price vs Margin (What to Do by Market)",
                  res["country_strategy_view"])

    print_section("COMPETITIVE PRESSURE SCORE — Where Competitors Systematically Beat Us",
                  res["competitive_pressure"])

    # Limit SKU lists for readability
    if not res["sku_promo_opportunities"].empty:
        print_section("SKU WATCHLIST — Promo Opportunities (We are cheaper with strong margin)",
                      res["sku_promo_opportunities"].head(25))
    if not res["sku_price_risks"].empty:
        print_section("SKU WATCHLIST — Price Risks (Competitor cheaper & thin margin)",
                      res["sku_price_risks"].head(25))

    # Optional: export to CSV
    res["enriched_df"].drop(columns=["_base_cost_usd"]).to_csv(
        r"e:\Users\Waifuzzama\Downloads\MONCHO-AI\Moncho-Analysts\moncho_pricing_data.csv",
        index=False
    )
    print("✅  Enriched dataset exported → moncho_pricing_data.csv")
    print("▓" * 90 + "\n")
