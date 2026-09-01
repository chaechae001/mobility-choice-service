"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BudgetRange from "../../components/vehicle-finder/BudgetRange";
import FilterBlock from "../../components/vehicle-finder/FilterBlock";
import OptionFilterBlock from "../../components/vehicle-finder/OptionFilterBlock";
import {
    BUDGET_MAX,
    BUDGET_MIN,
    createInitialFilters,
    FILTER_GROUPS,
} from "../../components/vehicle-finder/filterData";
import styles from "./page.module.css";

export default function ExplorePage() {
    const router = useRouter();
    const [filters, setFilters] = useState(createInitialFilters);

    function toggleOption(groupKey, option) {
        setFilters((previousFilters) => {
            const currentOptions = previousFilters[groupKey];
            const isSelected = currentOptions.includes(option);

            return {
                ...previousFilters,
                [groupKey]: isSelected
                    ? currentOptions.filter((item) => item !== option)
                    : [...currentOptions, option],
            };
        });
    }

    function handleMinBudgetChange(event) {
        const nextMinBudget = Number(event.target.value);

        setFilters((previousFilters) => ({
            ...previousFilters,
            minBudget: Math.min(nextMinBudget, previousFilters.maxBudget),
        }));
    }

    function handleMaxBudgetChange(event) {
        const nextMaxBudget = Number(event.target.value);

        setFilters((previousFilters) => ({
            ...previousFilters,
            maxBudget: Math.max(nextMaxBudget, previousFilters.minBudget),
        }));
    }

    function handleReset() {
        setFilters(createInitialFilters());
    }

    function handleShowVehicles() {
        sessionStorage.setItem("vehicleFilters", JSON.stringify(filters));
        router.push("/vehicles");
    }

    const selectedConditionCount =
        FILTER_GROUPS.reduce(
            (count, group) => count + filters[group.key].length,
            0
        ) +
        (filters.minBudget !== BUDGET_MIN || filters.maxBudget !== BUDGET_MAX
            ? 1
            : 0);

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <button
                    type="button"
                    className={styles.logo}
                    onClick={() => router.push("/")}
                >
                    MOBILITY CHOICE
                </button>

                <button
                    type="button"
                    className={styles.resetButton}
                    onClick={handleReset}
                >
                    전체 초기화
                </button>
            </header>

            <section className={styles.hero}>
                <p className={styles.eyebrow}>PERSONAL MOBILITY FINDER</p>
                <h1>당신의 일상에 맞는 차를 찾아보세요.</h1>
                <p>
                    생활 방식과 원하는 기능을 함께 선택하면 다양한 브랜드의 차량을 한 번에 비교할 수 있습니다.
                </p>
            </section>

            <section className={styles.filterArea}>
                <FilterBlock
                    step="01"
                    title="예산은 어느 정도인가요?"
                    description="차량의 시작 가격을 기준으로 비교합니다."
                >
                    <BudgetRange
                        minBudget={filters.minBudget}
                        maxBudget={filters.maxBudget}
                        onMinChange={handleMinBudgetChange}
                        onMaxChange={handleMaxBudgetChange}
                    />
                </FilterBlock>

                {FILTER_GROUPS.map((group, index) => (
                    <OptionFilterBlock
                        key={group.key}
                        step={String(index + 2).padStart(2, "0")}
                        group={group}
                        selectedOptions={filters[group.key]}
                        onToggle={toggleOption}
                    />
                ))}
            </section>

            <div className={styles.bottomBar}>
                <div>
                    <span>선택한 조건</span>
                    <strong>{selectedConditionCount}개</strong>
                </div>

                <button type="button" onClick={handleShowVehicles}>
                    차량 추천 보기
                    <span aria-hidden="true">→</span>
                </button>
            </div>
        </main>
    );
}