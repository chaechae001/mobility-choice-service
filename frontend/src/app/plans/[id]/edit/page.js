"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditPlanPage() {
    const router = useRouter();

    // URL의 /plans/[id]/edit에서 실제 ID를 가져옵니다.
    const params = useParams();
    const planId = params.id;

    // 작성 페이지와 같은 필드 구조를 사용합니다.
    // 처음에는 빈값이고, 기존 데이터를 불러온 후 값이 채워집니다.
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

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    // 개발 모드에서 기존 데이터를 중복 요청하지 않도록 관리합니다.
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) {
            return;
        }

        hasFetched.current = true;
        fetchPlanForEdit();
    }, [planId]);

    // 수정할 기존 계획 데이터를 불러옵니다.
    async function fetchPlanForEdit() {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/plans/${planId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "선택 계획을 불러오지 못했습니다.");
                return;
            }

            // MongoDB 데이터 형식을 form input에 맞는 형태로 바꿉니다.
            setFormData({
                title: data.title || "",
                purpose: data.purpose || "",
                budget: data.budget ?? "",
                passengers: data.passengers ?? "",
                drivingPattern: data.drivingPattern || "",
                parkingEnvironment: data.parkingEnvironment || "",
                chargingEnvironment: data.chargingEnvironment || "",
                preferredUsageType: data.preferredUsageType || "",

                // MongoDB의 배열을 "연비, 안전성, 주차 편의성" 문자열로 변환합니다.
                priorities: data.priorities?.join(", ") || "",

                notes: data.notes || "",
            });
        } catch (error) {
            setMessage("백엔드 서버와 연결할 수 없습니다.");
        } finally {
            setLoading(false);
        }
    }

    // 작성 화면과 같은 방식으로 입력값을 변경합니다.
    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    // 수정한 값을 백엔드 PATCH API로 보냅니다.
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
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/plans/${planId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        purpose: formData.purpose,
                        budget: Number(formData.budget),
                        passengers: formData.passengers
                            ? Number(formData.passengers)
                            : undefined,
                        drivingPattern: formData.drivingPattern,
                        parkingEnvironment: formData.parkingEnvironment,
                        chargingEnvironment: formData.chargingEnvironment,
                        preferredUsageType: formData.preferredUsageType,
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
                setMessage(data.message || "선택 계획 수정에 실패했습니다.");
                return;
            }

            // 수정이 끝나면 방금 수정한 계획의 상세 화면으로 이동합니다.
            router.push(`/plans/${planId}`);
        } catch (error) {
            setMessage("백엔드 서버와 연결할 수 없습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return <main>선택 계획을 불러오는 중입니다...</main>;
    }

    if (message && !formData.title) {
        return (
            <main>
                <p>{message}</p>
                <Link href="/plans">목록으로 돌아가기</Link>
            </main>
        );
    }

    return (
        <main>
            <Link href={`/plans/${planId}`}>← 상세 화면으로 돌아가기</Link>

            <h1>모빌리티 선택 계획 수정</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">계획 제목 *</label>
                    <br />
                    <input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
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
                        rows="5"
                    />
                </div>

                <br />

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "수정 저장 중..." : "수정 내용 저장"}
                </button>
            </form>

            {message && <p>{message}</p>}
        </main>
    );
}