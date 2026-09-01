import FilterBlock from "./FilterBlock";
import OptionToggle from "./OptionToggle";
import styles from "./VehicleFinderControls.module.css";

export default function OptionFilterBlock({
                                              step,
                                              group,
                                              selectedOptions,
                                              onToggle,
                                          }) {
    return (
        <FilterBlock
            step={step}
            title={group.title}
            description={group.description}
        >
            <div className={styles.optionList}>
                {group.options.map((option) => {
                    const isSelected = selectedOptions.includes(option.label);

                    return (
                        <OptionToggle
                            key={option.label}
                            option={option}
                            isSelected={isSelected}
                            onClick={() => onToggle(group.key, option.label)}
                        />
                    );
                })}
            </div>
        </FilterBlock>
    );
}