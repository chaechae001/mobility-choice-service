import {
    BUDGET_MAX,
    BUDGET_MIN,
    BUDGET_STEP,
    formatBudget,
} from "./filterData";
import styles from "./VehicleFinderControls.module.css";

export default function BudgetRange({
                                        minBudget,
                                        maxBudget,
                                        onMinChange,
                                        onMaxChange,
                                    }) {
    const minPosition =
        ((minBudget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

    const maxPosition =
        ((maxBudget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

    return (
        <div className={styles.budgetControl}>
            <div className={styles.budgetValue}>
                {formatBudget(minBudget)}
                <span>~</span>
                {formatBudget(maxBudget)}
            </div>

            <div className={styles.rangeGroup}>
                <div className={styles.rangeTrack}>
                    <span
                        style={{
                            left: `${minPosition}%`,
                            right: `${100 - maxPosition}%`,
                        }}
                    />
                </div>

                <input
                    className={styles.rangeSlider}
                    type="range"
                    min={BUDGET_MIN}
                    max={BUDGET_MAX}
                    step={BUDGET_STEP}
                    value={minBudget}
                    onChange={onMinChange}
                    aria-label="최소 예산"
                />

                <input
                    className={styles.rangeSlider}
                    type="range"
                    min={BUDGET_MIN}
                    max={BUDGET_MAX}
                    step={BUDGET_STEP}
                    value={maxBudget}
                    onChange={onMaxChange}
                    aria-label="최대 예산"
                />
            </div>

            <div className={styles.rangeLabels}>
                <span>{formatBudget(BUDGET_MIN)}</span>
                <span>{formatBudget(BUDGET_MAX)}</span>
            </div>
        </div>
    );
}