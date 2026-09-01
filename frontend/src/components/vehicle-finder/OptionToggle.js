import styles from "./VehicleFinderControls.module.css";

export default function OptionToggle({
                                         option,
                                         isSelected,
                                         onClick,
                                     }) {
    return (
        <button
            type="button"
            className={isSelected ? styles.selectedOption : styles.optionButton}
            aria-pressed={isSelected}
            onClick={onClick}
        >
            <span className={styles.optionIcon} aria-hidden="true">
                {option.icon}
            </span>

            <span className={styles.optionLabel}>{option.label}</span>

            <strong aria-hidden="true">
                {isSelected ? "✓" : "+"}
            </strong>
        </button>
    );
}