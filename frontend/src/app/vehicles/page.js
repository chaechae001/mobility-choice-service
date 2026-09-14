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

// FastAPI의 ranking_service는 reasons라는 이름으로 추천 이유를 반환
// 기존 VehicleCard는 recommendationReasons를 사용하므로 화면용 이름으로 맞춤
// 따라서 차량 데이터를 화면에 맞는 형태로 한 번 변환
function normalizeRecommendation(vehicle) {
    return {
        ...vehicle,  // vehicle 안에 있던 모든 차량 정보를 새 객체로 복사
        recommendationReasons:  // recommendationReasons라는 새 속성을 만듬
            // 1순위: 이미 recommendationReasons가 있다면 그대로 사용
            // 2순위: FastAPI가 반환한 reasons가 있다면 사용
            // 3순위: 둘 다 없다면 빈 배열
            // recommendationsReasons가 있으면 사용, 없으면 reasons사용, 그것도 없으면 빈 배열 사용
            vehicle.recommendationReasons ?? vehicle.reasons ?? [],
    };
}

// Ollama 응답을 화면에 읽기 좋은 여러 줄로 나눔
// 이전 응답에 포함된 ** 또는 1. 같은 형식도 함께 정리
function splitAdviceLines(advice) {
    return advice
        // Markdown 굵게 표시 기호 제거: **문장** -> 문장
        .replace(/\*\*/g, "")

        // 줄바꿈 또는 "1. ", "2. " 앞에서 문장을 나눔
        .split(/\n+|(?=\s*\d+\.\s)/)

        // 각 문장의 앞뒤 공백과 기존 번호를 제거
        .map((line) => line.trim().replace(/^\d+\.\s*/, ""))

        // 빈 문자열은 화면에 표시하지 않음
        .filter(Boolean);
}

// FastAPI가 보낸 SSE 문자열 한 덩어리를 JavaScript 객체로 바꿈
function parseSseEvent(rawEvent) {
    const lines = rawEvent.split("\n");

    const eventLine = lines.find((line)=> line.startsWith("event:"));
    const dataLine = lines.find((data)=> data.startsWith("data:"));

    // 형식이 불완전한 조각은 무시
    if (!eventLine || !dataLine) {
        return null;
    }

    return {
        // "event : advice" -> "advice"
        eventName: eventLine.replace("event:", "").trim(),

        // "data: {...}" -> JavaScript 객체
        data: JSON.parse(dataLine.replace("data:", "").trim()),
    };
}

export default function VehiclesPage() {
    const router = useRouter();

    const [vehicles, setVehicles] = useState([]);
    const [filters, setFilters] = useState(createInitialFilters);
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
    const [compareMessage, setCompareMessage] = useState("");

    const [apiRecommendations, setApiRecommendations] = useState(null);
    const [advice, setAdvice] = useState("");
    const [isAdvising, setIsAdvising] = useState(false);
    const [adviceError, setAdviceError] = useState("");

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

    // 기존 화면의 빠른 필터링 결과
    // 버튼을 누르기 전에도 차량 목록과 조건 변경 결과를 바로 보여줌
    const localRecommendedVehicles = useMemo(() => {
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

    // FastAPI 추천 요청을 완료했다면 서버 결과를 우선 표시
    // 아직 요청 전이라면, 기존 프론트엔드 필터 결과를 표시
    // apiRecommendations: "맞춤 추천 받기" 버튼을 눌러 FastAPI가 반환한 추천 차량
    // localRecommendedVehicles: 버튼 누르기 전, 브라우저에서 기존 필터로 계산한 차량
    const displayedVehicles = apiRecommendations ?? localRecommendedVehicles;

    // 조건이 바뀌면 이전 조건으로 만든 AI 추천 결과를 초기화함
    // 사용자가 새 조건으로 다시 "맞춤 추천 받기"를 누르게 됨
    useEffect(()=> {
        setApiRecommendations(null);
        setAdvice("");
        setAdviceError("");
        setSelectedVehicleIds([]);
    }, [filters]);


    const selectedVehicles = useMemo(() => {
        return selectedVehicleIds
            .map((vehicleId) =>
                displayedVehicles.find(
                    (vehicle) => getVehicleId(vehicle) === vehicleId
                )
            )
            .filter(Boolean);
    }, [displayedVehicles, selectedVehicleIds]);

    const selectedConditionChips = getSelectedConditionChips(
        filters,
        FILTER_GROUPS
    );

    // 예산은 LLM이 아니라 현재 필터 값으로 직접 표시
    // 따라서 모델이 숫자를 잘못 요약해도 화면의 조건 정보는 정확
    const budgetChip =
        `예산 ${Number(filters.minBudget).toLocaleString("ko-KR")}만원` +
        ` ~ ${Number(filters.maxBudget).toLocaleString("ko-KR")}만원`;

    useEffect(() => {
        const currentVehicleIds = displayedVehicles.map((vehicle) =>
            getVehicleId(vehicle)
        );

        setSelectedVehicleIds((previousIds) =>
            previousIds.filter((vehicleId) =>
                currentVehicleIds.includes(vehicleId)
            )
        );
    }, [displayedVehicles]);

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

    // 버튼을 눌렀을 때만 FastAPI 추천 API와 Ollama를 호출
    async function requestRecommendation(){
        const token = localStorage.getItem("token");

        if(!token) {
            setAdviceError("로그인 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }

        // 새 요청을 시작하므로 이전 설명, 오류를 초기화함
        setIsAdvising(true);
        setAdvice("");
        setAdviceError("");
        setApiRecommendations(null);
        setSelectedVehicleIds([]);

        try {
            // Express(4000)가 아니라 FastAPI(8000) 주소를 사용한다.
            const aiApiBaseUrl =
                process.env.NEXT_PUBLIC_AI_API_BASE_URL || "http://127.0.0.1:8000";

            // 완성된 JSON 대신 스트리밍 API 호출
            const response = await fetch(
                `${aiApiBaseUrl}/api/recommendations/stream`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(filters),
                }
            );

            // 실제 요청 주소를 콘솔에서 확인
            console.log("AI 추천 요청 주소:", aiApiBaseUrl);

            // 인증 오류 등 스트리밍 시작 전의 HTTP 오류 처리
            if (!response.ok) {
                const errorText = await response.text();

                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(
                        errorData.detail || "AI 추천 요청을 시작하지 못했습니다."
                    );
                } catch (error) {
                    if (error instanceof SyntaxError) {
                        throw new Error(
                            "AI 추천 서버가 올바른 응답을 반환하지 않았습니다."
                        );
                    }
                    throw error;
                }
            }

            // 브라우저가 스트림을 읽을 수 없는 경우의 방어코드
            if (!response.body) {
                throw new Error("스트리밍 응답을 읽을 수 없습니다.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            // 네트워크 조각이 중간에 끊겨 들어올 수 있으므로 남은 문자열을 보관
            let buffer = "";

            while (true) {
                const {done, value} = await reader.read();

                if (done) {
                    break;
                }

                // Uint8Array 형태의 네트워크 데이터를 문자열로 변환
                buffer += decoder.decode(value, {stream: true});
                
                // SSE 이벤트는 빈 줄 (\n\n)로 구분
                const rawEvents = buffer.split("\n\n");

                // 마지막 조각은 아직 완성되지 않았을 수 있으므로 다음 반복까지 보관
                buffer = rawEvents.pop();

                rawEvents.forEach((rawEvent) => {
                    const parsedEvent = parseSseEvent(rawEvent);

                    if (!parsedEvent) {
                        return;
                    }

                    const { eventName, data } = parsedEvent;

                    // 추천 차량을 먼저 받으면 즉시 카드에 표시한다.
                    if (eventName === "recommendations") {
                        const nextRecommendations =
                            data.recommendations.map(normalizeRecommendation);

                        setApiRecommendations(nextRecommendations);
                    }

                    // Ollama 텍스트 조각을 기존 advice 뒤에 계속 붙인다.
                    if (eventName === "advice") {
                        setAdvice((previousAdvice) =>
                            previousAdvice + data.text
                        );
                    }

                    // 서버가 스트리밍 중 오류를 보낸 경우
                    if (eventName === "error") {
                        throw new Error(
                            data.detail ||
                            "추천 설명을 생성하는 중 오류가 발생했습니다."
                        );
                    }
                });
            }
        } catch (error) {
            console.error("AI 추천 스트리밍 오류:", error);

            setAdviceError(
                error instanceof Error
                    ? error.message
                    : "AI 추천 서버와 연결할 수 없습니다."
            );
        } finally {
            // 스트림이 끝나거나 오류가 나면 로딩 상태를 종료한다.
            setIsAdvising(false);
        }
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
                    <strong>{displayedVehicles.length}</strong>
                    <span>대의 실제 차량 정보를 비교합니다.</span>
                </div>
            </section>

            <section className={styles.conditionSummary}>
                <div className={styles.conditionSummaryText}>
                    <p>현재 선택 조건</p>

                    <div className={styles.conditionChips}>
                        {/* 코드가 계산한 정확한 예산 범위 */}
                        <span>{budgetChip}</span>

                        {/* 사용자가 선택한 생활 조건, 차종, 동력원 등 */}
                        {selectedConditionChips.map((chip) => (
                            <span key={chip}>{chip}</span>
                        ))}
                    </div>
                </div>
            <div className = {styles.conditionActions}>
                <button
                    type="button"
                    className={styles.inlineEditButton}
                    onClick={() => setIsFilterOpen((previous) => !previous)}
                >
                    조건 수정
                </button>
                
                <button
                    type="button"
                    className={styles.recommendButton}
                    onClick={requestRecommendation}
                    disabled={isAdvising}
                >
                    {isAdvising ? "추천 생성 중..." : "맞춤 추천 받기"}
                </button>
            </div>
            </section>
            
            {/* 맞춤 추천 버튼을 눌렀을 때, 생성 중임을 즉시 보여줌 */}
            {isAdvising && (
                <section className={styles.adviceLoading} aria-live="polite">
                    <span className={styles.adviceLoadingSpinner} aria-hidden="true" />

                    <div>
                        <h3>🚗 AI Recommendation</h3>
                        <p>차량 조건을 분석하고 추천 이유를 작성하고 있어요.</p>
                        <p>로컬 Ollama 모델을 실행하므로 잠시 걸릴 수 있습니다.</p>
                        <p></p>
                    </div>
                </section>
            )}

            {/* 추천 요청 자체가 실패했을 때만 오류를 보여줌 */}
            {adviceError && (
                <p className={styles.recommendationError} role="alert">
                    {adviceError}
                </p>
            )}

            {/* 추천 설명은 조건 요약과 조건 편집 사이에 표시 */}
            {advice && (
                <section className={styles.adviceSection}>
                    <p>AI ADVICE</p>
                    <h2>현재 조건을 기준으로 추천해요.</h2>

                    <ul className={styles.adviceList}>
                        {splitAdviceLines(advice).map((line, index) => (
                            <li key={`${line}-${index}`}>{line}</li>
                        ))}
                    </ul>
                </section>
            )}

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

            {displayedVehicles.length === 0 ? (
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
                    {displayedVehicles.map((vehicle, index) => (
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