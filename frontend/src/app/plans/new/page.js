"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPlanPage() {
    const router = useRouter();

    // 입력칸의 모든 값을 하나의 객체로 관리합니다.
    // 아래 key 이름은 백엔드 MobilityPlan 스키마의 필드명과 맞춰 작성했습니다.
    const [formData, setFormData] = useState({
        title: "",
        purpose: "",
        budget: "",
        passengers: "",
        drivingPattern: "",
        parkingEnvironment: "",
        chargingEnvironment: "",
        preferredUsageType: "",
        priorities: "",
        notes: "",
    });

    // 제출 중에는 버튼을 비활성화하기 위한 상태입니다.
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 사용자에게 성공·실패 메시지를 보여줍니다.
    const [message, setMessage] = useState("");

    // 로그인하지 않은 사용자는 작성 페이지에 접근할 수 없도록 합니다.
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/");
        }
    }, [router]);

    // 모든 input, textarea의 값 변경을 처리하는 함수입니다.
    function handleChange(event) {
        const { name, value } = event.target;

        // 기존 formData의 값은 유지하고,
        // 사용자가 수정한 입력칸만 name을 기준으로 변경합니다.
        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    // 폼 제출 시 실행되는 함수입니다.
    async function handleSubmit(event) {
        event.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/");
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/plans`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",

                        // 로그인한 사용자의 JWT를 백엔드에 전달합니다.
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        title: formData.title,
                        purpose: formData.purpose,

                        // HTML input의 값은 기본적으로 문자열입니다.
                        // MongoDB의 budget은 Number 타입이므로 숫자로 변환합니다.
                        budget: Number(formData.budget),

                        // 빈값이면 보내지 않고, 값이 있다면 숫자로 변환합니다.
                        passengers: formData.passengers
                            ? Number(formData.passengers)
                            : undefined,

                        drivingPattern: formData.drivingPattern,
                        parkingEnvironment: formData.parkingEnvironment,
                        chargingEnvironment: formData.chargingEnvironment,
                        preferredUsageType: formData.preferredUsageType,

                        // 화면에서는 쉼표로 입력하지만,
                        // MongoDB에는 ["연비", "주차 편의성"] 배열로 저장합니다.
                        priorities: formData.priorities
                            .split(",")
                            .map((priority) => priority.trim())
                            .filter(Boolean),

                        notes: formData.notes,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "선택 계획 저장에 실패했습니다.");
                return;
            }

            setMessage("선택 계획을 저장했습니다.");

            // 저장 성공 후 목록 화면으로 이동합니다.
            router.push("/plans");
        } catch (error) {
            setMessage("백엔드 서버와 연결할 수 없습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main>
            <h1>새 모빌리티 선택 계획 작성</h1>
            <p>현재 생활패턴과 차량 선택 조건을 기록하세요.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">계획 제목 *</label>
                    <br />
                    <input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="예: 서울 출퇴근용 첫 차 선택 계획"
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="purpose">이용 목적 *</label>
                    <br />
                    <input
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        placeholder="예: 출퇴근, 주말 근거리 이동"
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="budget">예산 (만 원) *</label>
                    <br />
                    <input
                        id="budget"
                        name="budget"
                        type="number"
                        min="0"
                        value={formData.budget}
                        onChange={handleChange}
                        placeholder="예: 3000"
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="passengers">주요 탑승 인원</label>
                    <br />
                    <input
                        id="passengers"
                        name="passengers"
                        type="number"
                        min="1"
                        value={formData.passengers}
                        onChange={handleChange}
                        placeholder="예: 2"
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="drivingPattern">주행 패턴</label>
                    <br />
                    <input
                        id="drivingPattern"
                        name="drivingPattern"
                        value={formData.drivingPattern}
                        onChange={handleChange}
                        placeholder="예: 평일 왕복 30km, 월 1회 장거리"
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="parkingEnvironment">주차 환경</label>
                    <br />
                    <input
                        id="parkingEnvironment"
                        name="parkingEnvironment"
                        value={formData.parkingEnvironment}
                        onChange={handleChange}
                        placeholder="예: 아파트 지하주차장"
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="chargingEnvironment">충전 환경</label>
                    <br />
                    <input
                        id="chargingEnvironment"
                        name="chargingEnvironment"
                        value={formData.chargingEnvironment}
                        onChange={handleChange}
                        placeholder="예: 상시 충전 어려움"
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="preferredUsageType">희망 이용 방식</label>
                    <br />
                    <input
                        id="preferredUsageType"
                        name="preferredUsageType"
                        value={formData.preferredUsageType}
                        onChange={handleChange}
                        placeholder="예: 신차 구매, 인증중고차, 리스"
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="priorities">중요 조건</label>
                    <br />
                    <input
                        id="priorities"
                        name="priorities"
                        value={formData.priorities}
                        onChange={handleChange}
                        placeholder="예: 연비, 주차 편의성, 안전성"
                    />
                    <p>쉼표(,)로 조건을 구분해 입력하세요.</p>
                </div>

                <div>
                    <label htmlFor="notes">추가 메모</label>
                    <br />
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="예: 하이브리드 차량을 우선 고려하고 싶습니다."
                        rows="5"
                    />
                </div>

                <br />

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "저장 중..." : "선택 계획 저장"}
                </button>
            </form>

            {message && <p>{message}</p>}

            <br />

            <Link href="/plans">목록으로 돌아가기</Link>
        </main>
    );
}