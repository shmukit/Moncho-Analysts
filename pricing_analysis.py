import numpy as np
import pandas as pd


def generate_synthetic_pricing_data(n_rows: int = 5_000, random_state: int = 42) -> pd.DataFrame:
    """Step 1: Generate synthetic pricing dataset."""
    rng = np.random.default_rng(random_state)

    skus = [f"SKU-{i:05d}" for i in range(1, n_rows + 1)]
    brands = rng.choice(["Alpha", "Beta", "Gamma", "Delta"], size=n_rows, replace=True)
    categories = rng.choice(["Electronics", "Grocery", "Personal Care", "Home"], size=n_rows, replace=True)

    countries = rng.choice(
        ["Bangladesh", "India", "Pakistan", "Sri Lanka", "Vietnam", "Thailand"],
        size=n_rows,
        replace=True,
    )

    currency_map = {
        "Bangladesh": "BDT",
        "India": "INR",
        "Pakistan": "PKR",
        "Sri Lanka": "LKR",
        "Vietnam": "VND",
        "Thailand": "THB",
    }
    currencies = [currency_map[c] for c in countries]

    fx_rates = {
        "BDT": 110,
        "INR": 83,
        "PKR": 280,
        "LKR": 300,
        "VND": 25000,
        "THB": 36,
    }

    base_usd_price = rng.uniform(2, 150, size=n_rows)
    fx_vec = np.array([fx_rates[c] for c in currencies])

    local_price = base_usd_price * fx_vec * rng.normal(1.0, 0.05, size=n_rows).clip(0.8, 1.2)
    usd_price = local_price / fx_vec

    demand_index = rng.normal(100, 25, size=n_rows).clip(10, None)

    import_duty_estimate = local_price * rng.uniform(0.05, 0.25, size=n_rows)
    logistics_cost = local_price * rng.uniform(0.03, 0.15, size=n_rows)

    competitor_price = local_price * rng.normal(0.97, 0.08, size=n_rows).clip(0.6, 1.4)
    discount_rate = rng.uniform(0, 0.35, size=n_rows)

    df = pd.DataFrame(
        {
            "sku_id": skus,
            "brand": brands,
            "category": categories,
            "country": countries,
            "currency": currencies,
            "local_price": local_price,
            "usd_price": usd_price,
            "demand_index": demand_index,
            "import_duty_estimate": import_duty_estimate,
            "logistics_cost": logistics_cost,
            "competitor_price": competitor_price,
            "discount_rate": discount_rate,
        }
    )

    return df


def avg_price_by_country(df: pd.DataFrame) -> pd.DataFrame:
    """1) Average price by country (USD)."""
    return (
        df.groupby("country", as_index=False)["usd_price"]
        .agg(avg_usd_price="mean", sku_count="count")
        .sort_values("avg_usd_price", ascending=False)
    )


def add_price_index_vs_asia(df: pd.DataFrame) -> tuple[pd.DataFrame, float]:
    """2) Price index vs Asia mean."""
    asia_countries = ["Bangladesh", "India", "Pakistan", "Sri Lanka", "Vietnam", "Thailand"]
    asia_mask = df["country"].isin(asia_countries)
    asia_mean = df.loc[asia_mask, "usd_price"].mean()

    df = df.copy()
    df["price_index_vs_asia"] = df["usd_price"] / asia_mean
    return df, asia_mean


def bangladesh_premium_discount_pct(df: pd.DataFrame, asia_mean_usd: float) -> float:
    """3) Bangladesh premium/discount vs Asia mean (%)."""
    bd_mask = df["country"] == "Bangladesh"
    if not bd_mask.any():
        return float("nan")

    bd_avg = df.loc[bd_mask, "usd_price"].mean()
    return (bd_avg - asia_mean_usd) / asia_mean_usd * 100.0


def add_competitor_undercut_pct(df: pd.DataFrame) -> pd.DataFrame:
    """4) Competitor undercut % (+ = we are more expensive)."""
    df = df.copy()
    df["competitor_undercut_pct"] = (df["usd_price"] - df["competitor_price"]) / df["usd_price"] * 100.0
    return df


def add_margin_proxy(df: pd.DataFrame) -> pd.DataFrame:
    """5) Estimated gross margin proxy (%)."""
    df = df.copy()
    df["net_price_local"] = df["local_price"] * (1.0 - df["discount_rate"])
    df["cost_proxy_local"] = df["net_price_local"] - df["import_duty_estimate"] - df["logistics_cost"]
    df["gross_margin_proxy_pct"] = (
        (df["net_price_local"] - df["cost_proxy_local"]) / df["net_price_local"]
    ) * 100.0
    return df


def simulate_price_elasticity(df: pd.DataFrame, pct_change: float = 0.10) -> pd.DataFrame:
    """6) Simple price elasticity simulation at portfolio level."""
    df = df.copy()

    elasticity_map = {
        "Electronics": -1.5,
        "Grocery": -0.6,
        "Personal Care": -1.0,
        "Home": -0.8,
    }
    df["assumed_elasticity"] = df["category"].map(elasticity_map).fillna(-1.0)

    df["base_qty"] = df["demand_index"]
    df["base_revenue"] = df["usd_price"] * df["base_qty"]

    def scenario(name: str, price_factor: float) -> pd.Series:
        price = df["usd_price"] * price_factor
        qty = df["base_qty"] * (1.0 + df["assumed_elasticity"] * (price_factor - 1.0))
        revenue = price * qty
        return pd.Series(
            {
                "scenario": name,
                "avg_price_usd": price.mean(),
                "total_qty": qty.sum(),
                "total_revenue_usd": revenue.sum(),
            }
        )

    results = pd.DataFrame(
        [
            scenario("baseline", 1.0),
            scenario(f"price_up_{int(pct_change * 100)}pct", 1.0 + pct_change),
            scenario(f"price_down_{int(pct_change * 100)}pct", 1.0 - pct_change),
        ]
    )

    base = results.loc[results["scenario"] == "baseline"].iloc[0]

    def implied_elasticity(row: pd.Series) -> float:
        pct_dp = (row["avg_price_usd"] - base["avg_price_usd"]) / base["avg_price_usd"]
        pct_dq = (row["total_qty"] - base["total_qty"]) / base["total_qty"]
        return pct_dq / pct_dp if pct_dp != 0 else float("nan")

    results["implied_elasticity_vs_baseline"] = results.apply(
        lambda r: implied_elasticity(r) if r["scenario"] != "baseline" else float("nan"),
        axis=1,
    )

    return results


def run_analysis(n_rows: int = 5_000, random_state: int = 42):
    """Orchestration: run full synthetic pricing analysis."""
    df = generate_synthetic_pricing_data(n_rows=n_rows, random_state=random_state)

    avg_by_country = avg_price_by_country(df)

    df, asia_mean_usd = add_price_index_vs_asia(df)

    bd_premium_pct = bangladesh_premium_discount_pct(df, asia_mean_usd)

    df = add_competitor_undercut_pct(df)

    df = add_margin_proxy(df)
    margin_by_country = (
        df.groupby("country", as_index=False)["gross_margin_proxy_pct"]
        .mean()
        .rename(columns={"gross_margin_proxy_pct": "avg_gross_margin_proxy_pct"})
    )

    elasticity_summary = simulate_price_elasticity(df, pct_change=0.10)

    return {
        "data": df,
        "avg_price_by_country": avg_by_country,
        "asia_mean_usd_price": asia_mean_usd,
        "bangladesh_premium_discount_pct": bd_premium_pct,
        "margin_by_country": margin_by_country,
        "elasticity_summary": elasticity_summary,
    }


if __name__ == "__main__":
    results = run_analysis()

    print("\n=== Average price by country (USD) ===")
    print(results["avg_price_by_country"].round(2).to_string(index=False))

    print("\n=== Asia mean USD price ===")
    print(round(results["asia_mean_usd_price"], 2))

    print("\n=== Bangladesh premium / discount vs Asia mean (%) ===")
    print(round(results["bangladesh_premium_discount_pct"], 2))

    print("\n=== Avg gross margin proxy by country (%) ===")
    print(results["margin_by_country"].round(2).to_string(index=False))

    print("\n=== Price elasticity simulation (portfolio-level) ===")
    print(results["elasticity_summary"].round(2).to_string(index=False))
