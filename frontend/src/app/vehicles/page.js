"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BudgetRange from "../../components/vehicle-finder/BudgetRange";
import OptionFilterBlock from "../../components/vehicle-finder/OptionFilterBlock";
import VehicleCard from "../../components/vehicle-finder/VehicleCard";
import VehicleComparison from "../../components/vehicle-finder/VehicleComparison";
import {
    BUDGET_MAX,
    BUDGET_MIN,
    createInitialFilters,
    FILTER_GROUPS,
} from "../../components/vehicle-finder/filterData";
import resultsStyles from "../../components/vehicle-finder/VehicleResults.module.css";
import {
    extractVehicles,
    getRecommendationReasons,
    getSelectedConditionChips,
    getVehicleId,
    isWithinBudget,
} from "../../components/vehicle-finder/vehicleUtils";
import styles from "./page.module.css";

export default function VehiclesPage() {
    const router = useRouter();

    const [vehicles, setVehicles] = useState([]);
    const [filters, setFilters] = useState(createInitialFilters);
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
    const [compareMessage, setCompareMessage] = useState("");

    useEffect(() => {
        const savedFilters = sessionStorage.getItem("vehicleFilters");

        if (!savedFilters) return;

        try {
            const parsedFilters = JSON.parse(savedFilters);

            setFilters({
                ...createInitialFilters(),
                ...parsedFilters,
                minBudget: parsedFilters.minBudget ?? BUDGET_MIN,
                maxBudget: parsedFilters.maxBudget || BUDGET_MAX,
            });
        } catch {
            sessionStorage.removeItem("vehicleFilters");
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem("vehicleFilters", JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        async function loadVehicles() {
            const token = localStorage.getItem("token");

            if (!token) {
                setStatus("error");
                setMessage("로그인 정보가 없습니다. 다시 로그인해주세요.");
                return;
            }

            try {
                const apiBaseUrl =
                    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

                const response = await fetch(`${apiBaseUrl}/api/vehicles`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok) {
                    setStatus("error");
                    setMessage(data.message || "차량 정보를 불러오지 못했습니다.");
                    return;
                }

                const vehicleArray = extractVehicles(data);

                setVehicles(vehicleArray);
                setStatus("success");

                if (vehicleArray.length === 0) {
                    setMessage(
                        "API 요청은 성공했지만 등록된 차량 데이터가 없습니다. MongoDB의 vehicles 컬렉션을 확인해주세요."
                    );
                }
            } catch (error) {
                console.error("차량 목록 요청 오류:", error);
                setStatus("error");
                setMessage(
                    "백엔드 서버와 연결할 수 없습니다. 4000번 포트의 서버를 확인해주세요."
                );
            }
        }

        loadVehicles();
    }, []);

    const recommendedVehicles = useMemo(() => {
        return vehicles
            .filter((vehicle) => isWithinBudget(vehicle, filters))
            .map((vehicle) => ({
                ...vehicle,
                recommendationReasons: getRecommendationReasons(vehicle, filters),
            }))
            .sort(
                (first, second) =>
                    second.recommendationReasons.length -
                    first.recommendationReasons.length
            );
    }, [vehicles, filters]);

    const selectedVehicles = useMemo(() => {
        return selectedVehicleIds
            .map((vehicleId) =>
                recommendedVehicles.find(
                    (vehicle) => getVehicleId(vehicle) === vehicleId
                )
            )
            .filter(Boolean);
    }, [recommendedVehicles, selectedVehicleIds]);

    const selectedConditionChips = getSelectedConditionChips(
        filters,
        FILTER_GROUPS
    );

    useEffect(() => {
        const currentVehicleIds = recommendedVehicles.map((vehicle) =>
            getVehicleId(vehicle)
        );

        setSelectedVehicleIds((previousIds) =>
            previousIds.filter((vehicleId) =>
                currentVehicleIds.includes(vehicleId)
            )
        );
    }, [recommendedVehicles]);

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

    function changeMinBudget(event) {
        const nextMinBudget = Number(event.target.value);

        setFilters((previousFilters) => ({
            ...previousFilters,
            minBudget: Math.min(nextMinBudget, previousFilters.maxBudget),
        }));
    }

    function changeMaxBudget(event) {
        const nextMaxBudget = Number(event.target.value);

        setFilters((previousFilters) => ({
            ...previousFilters,
            maxBudget: Math.max(nextMaxBudget, previousFilters.minBudget),
        }));
    }

    function resetFilters() {
        setFilters(createInitialFilters());
    }

    function toggleCompare(vehicle) {
        const vehicleId = getVehicleId(vehicle);

        if (!vehicleId) return;

        setCompareMessage("");

        setSelectedVehicleIds((previousIds) => {
            if (previousIds.includes(vehicleId)) {
                return previousIds.filter((id) => id !== vehicleId);
            }

            return [...previousIds, vehicleId];
        });
    }

    function scrollToComparison() {
        if (selectedVehicles.length < 2) {
            setCompareMessage("비교할 차량을 2대 이상 선택해주세요.");
            return;
        }

        document
            .getElementById("vehicle-comparison")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function moveToDetail(vehicle) {
        const vehicleId = getVehicleId(vehicle);

        if (vehicleId) {
            router.push(`/vehicles/${vehicleId}`);
        }
    }

    if (status === "loading") {
        return (
            <main className={styles.statePage}>
                <span className={styles.loader} />
                <p>차량 정보를 불러오고 있습니다.</p>
            </main>
        );
    }

    if (status === "error") {
        return (
            <main className={styles.statePage}>
                <p className={styles.stateLabel}>CONNECTION ERROR</p>
                <h1>차량 정보를 불러오지 못했습니다.</h1>
                <p>{message}</p>

                <div className={styles.stateActions}>
                    <button type="button" onClick={() => window.location.reload()}>
                        다시 불러오기
                    </button>
                    <button type="button" onClick={() => router.push("/")}>
                        로그인 화면
                    </button>
                </div>
            </main>
        );
    }

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
                    className={styles.changeButton}
                    onClick={() => setIsFilterOpen((previous) => !previous)}
                >
                    {isFilterOpen ? "조건 설정 닫기" : "조건 바로 수정"}
                </button>
            </header>

            <section className={styles.hero}>
                <p>CURATED FOR YOUR LIFE</p>
                <h1>당신에게 맞는 차량을 확인해보세요.</h1>

                <div className={styles.resultSummary}>
                    <strong>{recommendedVehicles.length}</strong>
                    <span>대의 실제 차량 정보를 비교합니다.</span>
                </div>
            </section>

            <section className={styles.conditionSummary}>
                <div className={styles.conditionSummaryText}>
                    <p>현재 선택 조건</p>

                    <div className={styles.conditionChips}>
                        {selectedConditionChips.length > 0 ? (
                            selectedConditionChips.map((chip) => (
                                <span key={chip}>{chip}</span>
                            ))
                        ) : (
                            <span className={styles.emptyChip}>
                                전체 조건으로 차량을 보고 있어요.
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    className={styles.inlineEditButton}
                    onClick={() => setIsFilterOpen((previous) => !previous)}
                >
                    조건 수정
                </button>
            </section>

            {isFilterOpen && (
                <section className={styles.filterPanel}>
                    <div className={styles.filterPanelHeader}>
                        <div>
                            <p>CONDITION EDIT</p>
                            <h2>추천 조건을 바로 바꿔보세요.</h2>
                        </div>

                        <button type="button" onClick={resetFilters}>
                            전체 초기화
                        </button>
                    </div>

                    <div className={styles.filterEditorBlocks}>
                        <BudgetRange
                            minBudget={filters.minBudget}
                            maxBudget={filters.maxBudget}
                            onMinChange={changeMinBudget}
                            onMaxChange={changeMaxBudget}
                        />

                        {FILTER_GROUPS.map((group, index) => (
                            <OptionFilterBlock
                                key={group.key}
                                step={String(index + 1).padStart(2, "0")}
                                group={group}
                                selectedOptions={filters[group.key]}
                                onToggle={toggleOption}
                            />
                        ))}
                    </div>
                </section>
            )}

            {message && <p className={styles.notice}>{message}</p>}

            <VehicleComparison
                selectedVehicles={selectedVehicles}
                onClear={() => setSelectedVehicleIds([])}
            />

            {recommendedVehicles.length === 0 ? (
                <section className={styles.emptyResult}>
                    <p>선택한 예산 범위에 맞는 차량이 없습니다.</p>
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                    >
                        예산 조건 수정
                    </button>
                </section>
            ) : (
                <section className={resultsStyles.vehicleGrid}>
                    {recommendedVehicles.map((vehicle, index) => (
                        <VehicleCard
                            key={getVehicleId(vehicle)}
                            vehicle={vehicle}
                            index={index}
                            isSelectedForCompare={selectedVehicleIds.includes(
                                getVehicleId(vehicle)
                            )}
                            onToggleCompare={toggleCompare}
                            onMoveToDetail={moveToDetail}
                        />
                    ))}
                </section>
            )}

            {selectedVehicleIds.length > 0 && (
                <div className={styles.compareBar}>
                    <div>
                        <span>비교 차량</span>
                        <strong>{selectedVehicleIds.length}대 선택</strong>
                    </div>

                    <button type="button" onClick={scrollToComparison}>
                        차량 비교하기
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
            )}

            {compareMessage && (
                <p className={styles.compareMessage} role="status">
                    {compareMessage}
                </p>
            )}
        </main>
    );
}